import { Request, Response } from "express";
import mongoose from "mongoose";
import seasonService from "../services/season.service";

export const createSeason = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { name, start_date, end_date } = req.body;

    // Validate input
    if (!name || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, start_date and end_date",
      });
    }

    // Kiểm tra ngày bắt đầu phải trước ngày kết thúc
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
      });
    }

    const season = await seasonService.createSeason({
      name,
      start_date: startDate,
      end_date: endDate,
      userId: new mongoose.Types.ObjectId(userId),
    });

    return res.status(201).json({
      success: true,
      message: "Season created successfully",
      data: season,
    });
  } catch (error) {
    console.error("Error creating season:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while creating season",
    });
  }
};

export const getSeasons = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Phân trang
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Lọc theo trạng thái (đang diễn ra, đã kết thúc)
    const filter: any = {};
    if (req.query.status === "active") {
      filter.end_date = { $gte: new Date() };
    } else if (req.query.status === "completed") {
      filter.end_date = { $lt: new Date() };
    }

    // Tìm kiếm theo tên
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    const result = await seasonService.getSeasonsByUserId(
      new mongoose.Types.ObjectId(userId),
      page,
      limit,
      filter
    );

    return res.status(200).json({
      success: true,
      message: "Seasons retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error getting seasons:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while getting seasons",
    });
  }
};

// Chỉnh sửa trong controllers/season.controller.ts - hàm getSeasonById
export const getSeasonById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { seasonId } = req.params;

    console.log("Request User ID:", userId);
    console.log("Request Season ID:", seasonId);

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

    const season = await seasonService.getSeasonById(
      new mongoose.Types.ObjectId(seasonId)
    );

    console.log("Found Season:", season ? "Yes" : "No");

    if (!season) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    // Log chi tiết để debug
    console.log("Season User ID (DB):", season.userId);
    console.log("Season User ID (String):", season.userId.toString());
    console.log("Request User ID:", userId);
    console.log("Types:", {
      seasonUserId: typeof season.userId,
      seasonUserIdString: typeof season.userId.toString(),
      userId: typeof userId,
    });
    console.log("Comparison Result:", season.userId.toString() === userId);

    // Kiểm tra xem season có thuộc về user không
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this season",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Season retrieved successfully",
      data: season,
    });
  } catch (error) {
    console.error("Error getting season:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while getting season",
    });
  }
};

export const updateSeason = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { seasonId } = req.params;
    const { name, start_date, end_date } = req.body;

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

    // Kiểm tra season có tồn tại và thuộc về user không
    const existingSeason = await seasonService.getSeasonById(
      new mongoose.Types.ObjectId(seasonId)
    );

    if (!existingSeason) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (existingSeason.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this season",
      });
    }

    // Validate ngày nếu được cung cấp
    let updateData: any = {
      name,
    };

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before end date",
        });
      }

      updateData.start_date = startDate;
      updateData.end_date = endDate;
    } else if (start_date) {
      const startDate = new Date(start_date);
      const endDate = existingSeason.end_date;

      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before end date",
        });
      }

      updateData.start_date = startDate;
    } else if (end_date) {
      const endDate = new Date(end_date);
      const startDate = existingSeason.start_date;

      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date must be before end date",
        });
      }

      updateData.end_date = endDate;
    }

    const updatedSeason = await seasonService.updateSeason(
      new mongoose.Types.ObjectId(seasonId),
      updateData
    );

    return res.status(200).json({
      success: true,
      message: "Season updated successfully",
      data: updatedSeason,
    });
  } catch (error) {
    console.error("Error updating season:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while updating season",
    });
  }
};

export const deleteSeason = async (req: Request, res: Response) => {
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

    // Kiểm tra season có tồn tại và thuộc về user không
    const existingSeason = await seasonService.getSeasonById(
      new mongoose.Types.ObjectId(seasonId)
    );

    if (!existingSeason) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (existingSeason.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this season",
      });
    }

    // Xóa season
    const result = await seasonService.deleteSeason(
      new mongoose.Types.ObjectId(seasonId)
    );

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete season",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Season deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting season:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while deleting season",
    });
  }
};

export const getSeasonStats = async (req: Request, res: Response) => {
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

    // Kiểm tra season có tồn tại và thuộc về user không
    const existingSeason = await seasonService.getSeasonById(
      new mongoose.Types.ObjectId(seasonId)
    );

    if (!existingSeason) {
      return res.status(404).json({
        success: false,
        message: "Season not found",
      });
    }

    if (existingSeason.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this season",
      });
    }

    const stats = await seasonService.getSeasonStats(
      new mongoose.Types.ObjectId(seasonId)
    );

    return res.status(200).json({
      success: true,
      message: "Season stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error getting season stats:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An error occurred while getting season stats",
    });
  }
};
