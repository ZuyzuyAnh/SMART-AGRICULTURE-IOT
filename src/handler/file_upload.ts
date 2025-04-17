import multer from "multer";
import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import predictService from "../services/image_predict";
import IMG4Predict from "../models/img4predict.model";
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Đảm bảo thư mục tồn tại
const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir("temp");
ensureDir("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp/");
  },
  filename: (req, file: Express.Multer.File, cb) => {
    const tempFilename = `temp_${Date.now()}_${Math.round(
      Math.random() * 1000000
    )}`;
    cb(null, tempFilename);
  },
});

const upload = multer({ storage });

router.post("/upload/init", authenticate, (req: Request, res: Response) => {
  const fileId = crypto.randomUUID();

  console.log(`File ID: ${fileId}`);

  res.json({
    success: true,
    fileId,
  });
});

router.post("/upload/chunk", authenticate, upload.single("chunk"), (req: Request, res: Response) => {
  const { fileId, chunkId, totalChunks, fileName } = req.body;

  console.log("Request body:", req.body);

  if (!fileId || chunkId === undefined || !totalChunks) {
    res.status(400).json({
      success: false,
      message: "Missing parameters",
    });

    return;
  }

  console.log("Uploaded file:", req.file);

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "No file uploaded",
    });

    return;
  }

  const newFilename = `${fileId}_${chunkId}`;
  const oldPath = req.file.path;
  const newPath = path.join("temp", newFilename);

  try {
    fs.renameSync(oldPath, newPath);

    res.json({
      success: true,
      fileId,
      chunkId: parseInt(chunkId),
      message: `Chunk ${chunkId} uploaded successfully`,
    });
  } catch (error) {
    console.error("Error renaming file:", error);
    res.status(500).json({
      success: false,
      message: "Error processing file",
    });
  }
});

router.post("/upload/complete", authenticate, async (req: Request, res: Response) => {
  const { fileId, fileName, totalChunks, plantId } = req.body;

  if (!fileId || !fileName || !totalChunks) {
    res.status(400).json({
      success: false,
      message: "Missing parameters",
    });

    return;
  }

  try {
    const expectedChunks = Array.from(
      { length: parseInt(totalChunks) },
      (_, i) => i
    );
    const missingChunks = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join("temp", `${fileId}_${i}`);

      if (!fs.existsSync(chunkPath)) {
        missingChunks.push(i);
      }
    }

    if (missingChunks.length > 0) {
      res.status(400).json({
        success: false,
        message: "Missing chunks",
        missingChunks,
      });

      return;
    }

    const uploadPath = path.join("uploads", fileName);
    const writeStream = fs.createWriteStream(uploadPath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join("temp", `${fileId}_${i}`);
      const chunk = fs.readFileSync(chunkPath);

      writeStream.write(chunk);
      fs.unlinkSync(chunkPath);
    }

    writeStream.end();

    // Lưu thông tin ảnh vào MongoDB
    const newImage = new IMG4Predict({
      imgURL: `/uploads/${fileName}`,
      uploaded_at: new Date(),
      created_at: new Date(),
      PlantId: plantId || null
    });

    const savedImage = await newImage.save();

    // Dự đoán ảnh
    const result = await predictService.predict(uploadPath, savedImage._id.toString());

    res.json({
      success: true,
      result,
      filePath: uploadPath,
      image: savedImage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Thêm endpoint để lấy kết quả dự đoán
router.get("/predictions/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prediction = await predictService.getPredictionById(id);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction not found"
      });
    }
    
    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
