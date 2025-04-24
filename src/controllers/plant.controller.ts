import { Request, Response } from 'express';
import mongoose from 'mongoose';
import plantService from '../services/plant.service';
import seasonService from '../services/season.service';
import locationService from '../services/location.service';

export const createPlant = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { locationId, seasonId } = req.params;
    const { name, img, status, note, startdate } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(locationId) || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID or season ID'
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Plant name is required'
      });
    }
    
    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this season'
      });
    }
    
    // Kiểm tra location có thuộc season không
    const location = await locationService.getLocationById(new mongoose.Types.ObjectId(locationId));
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    if (location.seasonId.toString() !== seasonId) {
      return res.status(400).json({
        success: false,
        message: 'Location does not belong to the specified season'
      });
    }
    
    // Tạo cây trồng mới
    const plant = await plantService.createPlant({
      name,
      img,
      status: status || 'Đang tốt',
      note,
      startdate: startdate ? new Date(startdate) : new Date(),
      locationId: new mongoose.Types.ObjectId(locationId),
      seasonId: new mongoose.Types.ObjectId(seasonId)
    });
    
    return res.status(201).json({
      success: true,
      message: 'Plant created successfully',
      data: plant
    });
  } catch (error) {
    console.error('Error creating plant:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while creating plant'
    });
  }
};

export const getPlantsByLocation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { locationId, seasonId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(locationId) || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID or season ID'
      });
    }
    
    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this season'
      });
    }
    
    // Kiểm tra location có thuộc season không
    const location = await locationService.getLocationById(new mongoose.Types.ObjectId(locationId));
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    if (location.seasonId.toString() !== seasonId) {
      return res.status(400).json({
        success: false,
        message: 'Location does not belong to the specified season'
      });
    }
    
    // Phân trang
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Lọc theo trạng thái
    const filter: any = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Tìm kiếm theo tên
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    const result = await plantService.getPlantsByLocationId(
      new mongoose.Types.ObjectId(locationId),
      page,
      limit,
      filter
    );
    
    return res.status(200).json({
      success: true,
      message: 'Plants retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error getting plants:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while getting plants'
    });
  }
};

export const getPlantsBySeason = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { seasonId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid season ID'
      });
    }
    
    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this season'
      });
    }
    
    // Phân trang
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Lọc theo trạng thái
    const filter: any = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Tìm kiếm theo tên
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }
    
    const result = await plantService.getPlantsBySeasonId(
      new mongoose.Types.ObjectId(seasonId),
      page,
      limit,
      filter
    );
    
    return res.status(200).json({
      success: true,
      message: 'Plants retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Error getting plants:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while getting plants'
    });
  }
};

export const getPlantById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { plantId, seasonId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plant ID or season ID'
      });
    }
    
    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this season'
      });
    }
    
    // Lấy thông tin cây trồng
    const plant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }
    
    // Kiểm tra cây trồng có thuộc season không
    if (plant.seasonId.toString() !== seasonId) {
      return res.status(400).json({
        success: false,
        message: 'Plant does not belong to the specified season'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Plant retrieved successfully',
      data: plant
    });
  } catch (error) {
    console.error('Error getting plant:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while getting plant'
    });
  }
};

export const updatePlant = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { plantId, seasonId } = req.params;
    const { name, img, status, note } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plant ID or season ID'
      });
    }
    
    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this season'
      });
    }
    
    // Kiểm tra cây trồng tồn tại không
    const existingPlant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    
    if (!existingPlant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }
    
    // Kiểm tra cây trồng có thuộc season không
    if (existingPlant.seasonId.toString() !== seasonId) {
      return res.status(400).json({
        success: false,
        message: 'Plant does not belong to the specified season'
      });
    }
    
    // Cập nhật thông tin cây trồng
    const updateData: any = {};
    if (name) updateData.name = name;
    if (img !== undefined) updateData.img = img;
    if (status) updateData.status = status;
    if (note !== undefined) updateData.note = note;
    
    const updatedPlant = await plantService.updatePlant(
      new mongoose.Types.ObjectId(plantId),
      updateData
    );
    
    return res.status(200).json({
      success: true,
      message: 'Plant updated successfully',
      data: updatedPlant
    });
  } catch (error) {
    console.error('Error updating plant:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating plant'
    });
  }
};

export const deletePlant = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { plantId, seasonId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plant ID or season ID'
      });
    }
    
    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this season'
      });
    }
    
    // Kiểm tra cây trồng tồn tại không
    const existingPlant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    
    if (!existingPlant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }
    
    // Kiểm tra cây trồng có thuộc season không
    if (existingPlant.seasonId.toString() !== seasonId) {
      return res.status(400).json({
        success: false,
        message: 'Plant does not belong to the specified season'
      });
    }
    
    // Xóa cây trồng
    const result = await plantService.deletePlant(new mongoose.Types.ObjectId(plantId));
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete plant'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Plant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plant:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while deleting plant'
    });
  }
};

export const updatePlantStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { plantId, seasonId } = req.params;
    const { status } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plant ID or season ID'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['Đang tốt', 'Cần chú ý', 'Có vấn đề', 'Đã thu hoạch'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Kiểm tra quyền truy cập season
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Season not found'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this season'
      });
    }
    
    // Kiểm tra cây trồng tồn tại không
    const existingPlant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    
    if (!existingPlant) {
      return res.status(404).json({
        success: false,
        message: 'Plant not found'
      });
    }
    
    // Kiểm tra cây trồng có thuộc season không
    if (existingPlant.seasonId.toString() !== seasonId) {
      return res.status(400).json({
        success: false,
        message: 'Plant does not belong to the specified season'
      });
    }
    
    // Cập nhật trạng thái cây trồng
    const updatedPlant = await plantService.updatePlantStatus(
      new mongoose.Types.ObjectId(plantId),
      status
    );
    
    return res.status(200).json({
      success: true,
      message: 'Plant status updated successfully',
      data: updatedPlant
    });
  } catch (error) {
    console.error('Error updating plant status:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred while updating plant status'
    });
  }
};