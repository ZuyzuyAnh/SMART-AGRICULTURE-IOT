import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Tạo thư mục uploads nếu chưa có
const uploadFolder = path.join(__dirname, "../../uploads/camera");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Cấu hình multer để lưu ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    // Lấy device ID từ request body hoặc query hoặc mặc định là "unknown"
    const deviceId = req.body.deviceId || req.query.deviceId || "unknown";
    // Tạo tên file với timestamp và device ID
    cb(null, `${deviceId}_${Date.now()}.jpg`);
  },
});

// Cấu hình middleware upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    // Kiểm tra loại file
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh!") as any, false);
    }
  },
});

// Tạo router cho upload từ ESP32-CAM
const cameraUploadRouter = Router();

// Route xử lý POST request không yêu cầu xác thực để ESP32 có thể gửi ảnh
cameraUploadRouter.post(
  "/api/camera/upload",
  upload.single("image"),
  (req, res, next) => {
    // Middleware xử lý upload sẽ đảm bảo file đã được lưu
    // Controller sẽ xử lý tiếp ở bước sau
    next();
  }
);

export { upload, cameraUploadRouter };
