import CameraImage, { ICameraImage } from "../models/cameraImage.model";
import mongoose, { SortOrder } from "mongoose";
import path from "path";
import fs from "fs";
import sharp from "sharp";

interface ImageMetadata {
  size: number;
  width: number;
  height: number;
  format: string;
}

// Lưu thông tin ảnh vào database
export const saveImageInfo = async (
  filename: string,
  deviceId: string,
  locationId?: string,
  plantId?: string
): Promise<ICameraImage> => {
  try {
    const imagePath = path.join(__dirname, "../../uploads/camera", filename);

    // Lấy metadata của ảnh
    let metadata: ImageMetadata | null = null;
    try {
      const imageInfo = await sharp(imagePath).metadata();
      const stats = fs.statSync(imagePath);

      metadata = {
        size: stats.size,
        width: imageInfo.width || 0,
        height: imageInfo.height || 0,
        format: imageInfo.format || "unknown",
      };
    } catch (error) {
      console.error("Không thể lấy metadata của ảnh:", error);
    }

    // Tạo đối tượng ảnh mới
    const imageData: Partial<ICameraImage> = {
      filename,
      path: `/uploads/camera/${filename}`,
      deviceId,
      captured_at: new Date(),
      created_at: new Date(),
      metadata,
    };

    // Thêm locationId và plantId nếu có
    if (locationId) {
      imageData.locationId = new mongoose.Types.ObjectId(locationId);
    }

    if (plantId) {
      imageData.plantId = new mongoose.Types.ObjectId(plantId);
    }

    // Lưu vào database
    const newImage = new CameraImage(imageData);
    return await newImage.save();
  } catch (error) {
    console.error("Lỗi khi lưu thông tin ảnh:", error);
    throw error;
  }
};

// Lấy danh sách ảnh với phân trang
export const getImages = async (
  filters: Record<string, any>,
  page: number = 1,
  limit: number = 20,
  sortBy: string = "captured_at",
  sortOrder: SortOrder = -1
): Promise<{ images: ICameraImage[]; total: number; pages: number }> => {
  try {
    const skip = (page - 1) * limit;

    // Tạo sort object
    const sort: { [key: string]: SortOrder } = {};
    sort[sortBy] = sortOrder;

    // Đếm tổng số ảnh
    const total = await CameraImage.countDocuments(filters);

    // Lấy danh sách ảnh
    const images = await CameraImage.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return {
      images,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách ảnh:", error);
    throw error;
  }
};

// Lấy ảnh mới nhất theo bộ lọc
export const getLatestImage = async (
  filters: Record<string, any>
): Promise<ICameraImage | null> => {
  try {
    return await CameraImage.findOne(filters).sort({ captured_at: -1 });
  } catch (error) {
    console.error("Lỗi khi lấy ảnh mới nhất:", error);
    throw error;
  }
};

// Xóa ảnh theo ID
export const deleteImage = async (imageId: string): Promise<boolean> => {
  try {
    const image = await CameraImage.findById(imageId);

    if (!image) {
      return false;
    }

    // Xóa file ảnh
    const imagePath = path.join(__dirname, "../..", image.path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Xóa thông tin từ database
    await CameraImage.findByIdAndDelete(imageId);

    return true;
  } catch (error) {
    console.error("Lỗi khi xóa ảnh:", error);
    throw error;
  }
};
