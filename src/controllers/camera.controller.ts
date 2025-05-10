import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import * as cameraService from "../services/camera.service";

const uploadFolder = path.join(__dirname, "../../uploads/camera");

// Đảm bảo thư mục uploads/camera tồn tại
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// Xử lý upload ảnh từ ESP32-CAM
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Không có file ảnh trong yêu cầu" });
    }

    // Lấy thông tin từ request
    const deviceId = req.body.deviceId || req.query.deviceId || "unknown";
    const locationId = req.body.locationId || req.query.locationId;
    const plantId = req.body.plantId || req.query.plantId;

    console.log(`Ảnh đã nhận từ thiết bị ${deviceId}: ${req.file.filename}`);

    // Lưu thông tin ảnh vào DB
    try {
      const savedImage = await cameraService.saveImageInfo(
        req.file.filename,
        deviceId,
        locationId,
        plantId
      );

      res.status(200).json({
        message: "Tải ảnh lên thành công",
        filename: req.file.filename,
        imageId: savedImage._id,
      });
    } catch (dbError) {
      console.error("Lỗi khi lưu thông tin ảnh vào DB:", dbError);
      // Vẫn trả về 200 vì ảnh đã được lưu thành công
      res.status(200).json({
        message: "Tải ảnh lên thành công nhưng không lưu được thông tin vào DB",
        filename: req.file.filename,
      });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý tải lên ảnh:", error);
    res.status(500).json({ message: "Lỗi server khi xử lý ảnh" });
  }
};

// Lấy danh sách ảnh (gallery)
export const getGallery = async (req: Request, res: Response) => {
  try {
    const {
      limit = 20,
      page = 1,
      deviceId,
      locationId,
      plantId,
      sortBy = "captured_at",
      sortOrder = -1,
    } = req.query;

    const filters: Record<string, any> = {};

    // Thêm các điều kiện lọc nếu có
    if (deviceId) filters.deviceId = deviceId;
    if (locationId) filters.locationId = locationId;
    if (plantId) filters.plantId = plantId;

    // Lấy danh sách ảnh từ DB
    const result = await cameraService.getImages(
      filters,
      parseInt(page as string),
      parseInt(limit as string),
      sortBy as string,
      parseInt(sortOrder as string) as -1 | 1
    );

    res.status(200).json({
      totalImages: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: result.pages,
      images: result.images.map((img) => ({
        id: img._id,
        path: img.path,
        deviceId: img.deviceId,
        locationId: img.locationId,
        plantId: img.plantId,
        captured_at: img.captured_at,
        metadata: img.metadata,
      })),
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách ảnh:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách ảnh" });
  }
};

// Lấy ảnh mới nhất
export const getLatestImage = async (req: Request, res: Response) => {
  try {
    const { deviceId, locationId, plantId } = req.query;

    const filters: Record<string, any> = {};

    // Thêm các điều kiện lọc nếu có
    if (deviceId) filters.deviceId = deviceId;
    if (locationId) filters.locationId = locationId;
    if (plantId) filters.plantId = plantId;

    // Lấy ảnh mới nhất từ DB
    const latestImage = await cameraService.getLatestImage(filters);

    if (!latestImage) {
      return res.status(404).json({ message: "Không tìm thấy ảnh nào" });
    }

    res.status(200).json({
      id: latestImage._id,
      path: latestImage.path,
      deviceId: latestImage.deviceId,
      locationId: latestImage.locationId,
      plantId: latestImage.plantId,
      captured_at: latestImage.captured_at,
      metadata: latestImage.metadata,
    });
  } catch (error) {
    console.error("Lỗi khi lấy ảnh mới nhất:", error);
    res.status(500).json({ message: "Lỗi server khi lấy ảnh mới nhất" });
  }
};

// Lấy ảnh theo thiết bị
export const getDeviceImages = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // Lấy danh sách ảnh từ DB
    const result = await cameraService.getImages(
      { deviceId },
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      totalImages: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: result.pages,
      images: result.images.map((img) => ({
        id: img._id,
        path: img.path,
        deviceId: img.deviceId,
        locationId: img.locationId,
        plantId: img.plantId,
        captured_at: img.captured_at,
        metadata: img.metadata,
      })),
    });
  } catch (error) {
    console.error(`Lỗi khi lấy ảnh từ thiết bị ${req.params.deviceId}:`, error);
    res.status(500).json({ message: "Lỗi server khi lấy ảnh theo thiết bị" });
  }
};
