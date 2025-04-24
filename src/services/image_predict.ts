import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import IMG4Predict from "../models/img4predict.model";
import Prediction from "../models/prediction.model";
import mongoose from "mongoose";

const MODEL_PATH = "/home/hungnm/projects/SMART-AGRICULTURE-IOT/tfjs_model";

const PLANT_DISEASE_CLASSES = [
  "Pepper_bell_healthy",
  "Pepper_bell_bacterial_spot",
  "Tomato_Early_blight",
  "Potato_Early_blight",
  "Potato_Late_blight",
  "Tomato_Bacterial_spot",
  "Tomato_Leaf_Mold",
  "Tomato_Septoria_leaf_spot",
  "Tomato_healthy",
  "Tomato_Late_blight",
  "Potato_healthy",
  "Tomato_Target_Spot",
  "Tomato_Spider_mites",
  "Tomato_Yellow_Leaf_Curl_Virus",
  "Tomato_mosaic_virus",
];

class ImagePredictionService {
  private model: tf.LayersModel | null;
  private labels: string[] | null;
  private isLoaded: boolean;

  constructor() {
    this.model = null;
    this.labels = PLANT_DISEASE_CLASSES;
    this.isLoaded = false;
  }

  async loadModel() {
    try {
      console.log("Đang tải model...");
      this.model = await tf.loadLayersModel(
        `file://${MODEL_PATH}/model_fixed2.json`
      );

      if (fs.existsSync(path.join(MODEL_PATH, "labels.json"))) {
        this.labels = JSON.parse(
          fs.readFileSync(path.join(MODEL_PATH, "labels.json"), "utf8")
        );
      } else {
        this.labels = PLANT_DISEASE_CLASSES;
      }

      this.isLoaded = true;
      console.log("Đã tải model thành công!");
    } catch (error) {
      console.error("Lỗi khi tải model:", error);
      throw new Error("Không thể tải model");
    }
  }

  async ensureModelLoaded() {
    if (!this.isLoaded) {
      await this.loadModel();
    }
  }

  async preprocessImage(imagePath) {
    try {
      const imageBuffer = await sharp(imagePath).resize(224, 224).toBuffer();

      const imageTensor = tf.node.decodeImage(imageBuffer, 3);

      const normalizedImage = imageTensor.div(255.0);

      const batchedImage = normalizedImage.expandDims(0);

      return batchedImage;
    } catch (error) {
      console.error("Lỗi khi tiền xử lý ảnh:", error);
      throw new Error("Không thể xử lý ảnh");
    }
  }

  async predict(imagePath: string, imageId?: string) {
    await this.ensureModelLoaded();

    try {
      const inputTensor = await this.preprocessImage(imagePath);

      const predictions = await this.model.predict(inputTensor);

      const predictionData = Array.isArray(predictions)
        ? await predictions[0].data()
        : await predictions.data();

      const predictionArray = Array.from(predictionData);
      const maxProbability = Math.max(...predictionArray);
      const classIndex = predictionArray.indexOf(maxProbability);
      const className = this.labels[classIndex];

      const results = {
        prediction: classIndex,
        className,
        confidence: maxProbability,
      };

      tf.dispose(inputTensor);
      tf.dispose(predictions);

      // Nếu có imageId, lưu kết quả dự đoán vào MongoDB
      if (imageId) {
        const prediction = new Prediction({
          disease_name: className,
          confidence: maxProbability,
          note: `Predicted with confidence: ${(maxProbability * 100).toFixed(
            2
          )}%`,
          predicted_at: new Date(),
          created_at: new Date(),
          IMG4PredictId: new mongoose.Types.ObjectId(imageId),
        });

        const savedPrediction = await prediction.save();

        // Thêm ID của dự đoán vào kết quả trả về
        results["predictionId"] = savedPrediction._id;
      }

      return results;
    } catch (error) {
      console.error("Lỗi khi dự đoán:", error);
      throw new Error("Không thể thực hiện dự đoán");
    }
  }

  // Phương thức mới để dự đoán theo ID ảnh
  async predictById(imageId: string) {
    try {
      // Tìm ảnh trong MongoDB
      const image = await IMG4Predict.findById(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      // Đường dẫn tuyệt đối đến file ảnh
      const imagePath = path.join(
        process.cwd(),
        image.imgURL.replace(/^\//, "")
      );

      if (!fs.existsSync(imagePath)) {
        throw new Error("Image file not found on server");
      }

      // Dự đoán và lưu kết quả
      return await this.predict(imagePath, imageId);
    } catch (error) {
      console.error("Error during prediction by ID:", error);
      throw error;
    }
  }

  // Phương thức để lấy kết quả dự đoán theo ID
  async getPredictionById(predictionId: string) {
    try {
      const prediction = await Prediction.findById(predictionId).populate(
        "IMG4PredictId"
      );

      if (!prediction) {
        throw new Error("Prediction not found");
      }

      return prediction;
    } catch (error) {
      console.error("Error fetching prediction:", error);
      throw error;
    }
  }
}

export default new ImagePredictionService();
