import { Request, Response } from 'express';
import mongoose from 'mongoose';
import carePlanService from '../services/carePlan.service';
import plantService from '../services/plant.service';

export const createCarePlan = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;
    const { date, type, note, status } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId)) {
      return res.status(400).json({
        success: false,
        message: 'ID cây trồng không hợp lệ'
      });
    }
    
    if (!date || !type) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày và loại kế hoạch'
      });
    }
    
    // Kiểm tra quyền truy cập cây trồng
    const plant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cây trồng'
      });
    }
    
    // Kiểm tra xem cây trồng đã có kế hoạch chưa
    if (plant.carePlanId) {
      return res.status(400).json({
        success: false,
        message: 'Cây trồng đã có kế hoạch chăm sóc, vui lòng cập nhật kế hoạch hiện tại'
      });
    }
    
    const carePlan = await carePlanService.createCarePlan({
      plantId: new mongoose.Types.ObjectId(plantId),
      date: new Date(date),
      type,
      note,
      status
    });
    
    return res.status(201).json({
      success: true,
      message: 'Tạo kế hoạch chăm sóc thành công',
      data: carePlan
    });
  } catch (error) {
    console.error('Error creating care plan:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi tạo kế hoạch chăm sóc'
    });
  }
};

export const getCarePlan = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId)) {
      return res.status(400).json({
        success: false,
        message: 'ID cây trồng không hợp lệ'
      });
    }
    
    // Kiểm tra quyền truy cập cây trồng
    const plant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cây trồng'
      });
    }
    
    const carePlan = await carePlanService.getCarePlanByPlantId(new mongoose.Types.ObjectId(plantId));
    
    if (!carePlan) {
      return res.status(404).json({
        success: false,
        message: 'Cây trồng chưa có kế hoạch chăm sóc'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy kế hoạch chăm sóc thành công',
      data: carePlan
    });
  } catch (error) {
    console.error('Error getting care plan:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi lấy kế hoạch chăm sóc'
    });
  }
};

export const updateCarePlan = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;
    const { date, type, note, status } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId)) {
      return res.status(400).json({
        success: false,
        message: 'ID cây trồng không hợp lệ'
      });
    }
    
    // Kiểm tra quyền truy cập cây trồng
    const plant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cây trồng'
      });
    }
    
    if (!plant.carePlanId) {
      return res.status(404).json({
        success: false,
        message: 'Cây trồng chưa có kế hoạch chăm sóc'
      });
    }
    
    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (type) updateData.type = type;
    if (note !== undefined) updateData.note = note;
    if (status) updateData.status = status;
    
    const carePlan = await carePlanService.updateCarePlan(
      plant.carePlanId,
      updateData
    );
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật kế hoạch chăm sóc thành công',
      data: carePlan
    });
  } catch (error) {
    console.error('Error updating care plan:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi cập nhật kế hoạch chăm sóc'
    });
  }
};

export const deleteCarePlan = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId)) {
      return res.status(400).json({
        success: false,
        message: 'ID cây trồng không hợp lệ'
      });
    }
    
    // Kiểm tra quyền truy cập cây trồng
    const plant = await plantService.getPlantById(new mongoose.Types.ObjectId(plantId));
    if (!plant) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cây trồng'
      });
    }
    
    if (!plant.carePlanId) {
      return res.status(404).json({
        success: false,
        message: 'Cây trồng chưa có kế hoạch chăm sóc'
      });
    }
    
    const result = await carePlanService.deleteCarePlan(plant.carePlanId);
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa kế hoạch chăm sóc'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa kế hoạch chăm sóc thành công'
    });
  } catch (error) {
    console.error('Error deleting care plan:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi xóa kế hoạch chăm sóc'
    });
  }
};