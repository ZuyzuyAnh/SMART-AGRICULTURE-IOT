import multer from "multer";
import { Router } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import predictService from "../services/image_predict";

const router = Router();

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

router.post("/upload/init", (req, res) => {
  const fileId = crypto.randomUUID();

  console.log(`File ID: ${fileId}`);

  res.json({
    success: true,
    fileId,
  });
});

router.post("/upload/chunk", upload.single("chunk"), (req, res) => {
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

router.post("/upload/complete", async (req, res) => {
  const { fileId, fileName, totalChunks } = req.body;

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

    const file = path.join("uploads", fileName);
    const writeStream = fs.createWriteStream(file);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join("temp", `${fileId}_${i}`);
      const chunk = fs.readFileSync(chunkPath);

      writeStream.write(chunk);
      fs.unlinkSync(chunkPath);
    }

    writeStream.end();

    const result = await predictService.predict(file);

    res.json({
      success: true,
      result,
      filePath: file,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
