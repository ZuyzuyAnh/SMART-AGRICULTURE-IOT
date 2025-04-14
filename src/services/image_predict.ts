import * as tf from "@tensorflow/tfjs-node";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const MODEL_PATH = "/media/zuyanh/New Volume/iot-node/tfjs_model";

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
    this.labels = null;
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

  async predict(imagePath) {
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

      const results = {
        prediction: classIndex,
        className: PLANT_DISEASE_CLASSES[classIndex],
      };

      tf.dispose(inputTensor);
      tf.dispose(predictions);

      return results;
    } catch (error) {
      console.error("Lỗi khi dự đoán:", error);
      throw new Error("Không thể thực hiện dự đoán");
    }
  }
}

export default new ImagePredictionService();
