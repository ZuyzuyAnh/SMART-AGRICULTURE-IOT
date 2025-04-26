import { Request, Response } from "express";
import mongoose from "mongoose";
import locationService from "../services/location.service";
import seasonService from "../services/season.service";

export const createLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { seasonId } = req.params;
    const { name, description, area, location_code } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: "ID mùa vụ không hợp lệ",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tên vị trí là bắt buộc",
      });
    }

    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(
      new mongoose.Types.ObjectId(seasonId)
    );

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy mùa vụ",
      });
    }

    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền truy cập mùa vụ này",
      });
    }

    const location = await locationService.createLocation({
      name,
      description,
      area,
      location_code,
      seasonId: new mongoose.Types.ObjectId(seasonId),
    });

    return res.status(201).json({
      success: true,
      message: "Tạo vị trí thành công",
      data: location,
    });
  } catch (error) {
    console.error("Error creating location:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Lỗi khi tạo vị trí",
    });
  }
};

export const getLocations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { seasonId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid season ID",
      });
    }

    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(
      new mongoose.Types.ObjectId(seasonId)
    );

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this season",
      });
    }

    // Phân trang
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Lọc theo tên
    const filter: any = {};
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    const result = await locationService.getLocationsBySeasonId(
      new mongoose.Types.ObjectId(seasonId),
      page,
      limit,
      filter
    );

    return res.status(200).json({
      success: true,
      message: "Locations retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error getting locations:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while getting locations",
    });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { locationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      });
    }

    const location = await locationService.getLocationById(
      new mongoose.Types.ObjectId(locationId)
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(location.seasonId);

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this location",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location retrieved successfully",
      data: location,
    });
  } catch (error) {
    console.error("Error getting location:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while getting location",
    });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { locationId } = req.params;
    const { name, description, area } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      });
    }

    const location = await locationService.getLocationById(
      new mongoose.Types.ObjectId(locationId)
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(location.seasonId);

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this location",
      });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (area !== undefined) updateData.area = area;

    const updatedLocation = await locationService.updateLocation(
      new mongoose.Types.ObjectId(locationId),
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: updatedLocation,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while updating location",
    });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { locationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID",
      });
    }

    const location = await locationService.getLocationById(
      new mongoose.Types.ObjectId(locationId)
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(location.seasonId);

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this location",
      });
    }

    const result = await locationService.deleteLocation(
      new mongoose.Types.ObjectId(locationId)
    );

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete location",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while deleting location",
    });
  }
};
