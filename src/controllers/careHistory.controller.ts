import { Request, Response } from 'express';
import mongoose from 'mongoose';
import careHistoryService from '../services/careHistory.service';
import plantService from '../services/plant.service';

export const addCareHistory = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;
    const { taskId, activity, description, performed_at, notes, images } = req.body;
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
    
    if (!activity || !description || !performed_at) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp loại hoạt động, mô tả và thời gian thực hiện'
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
    
    // Dữ liệu đầu vào cho lịch sử chăm sóc
    const historyData: any = {
      plantId: new mongoose.Types.ObjectId(plantId),
      activity,
      description,
      performed_by: new mongoose.Types.ObjectId(userId),
      performed_at: new Date(performed_at),
      notes,
      images
    };
    
    // Nếu có taskId, thêm vào dữ liệu
    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      historyData.taskId = new mongoose.Types.ObjectId(taskId);
    }
    
    const careHistory = await careHistoryService.addCareHistory(historyData);
    
    return res.status(201).json({
      success: true,
      message: 'Thêm lịch sử chăm sóc thành công',
      data: careHistory
    });
  } catch (error) {
    console.error('Error adding care history:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi thêm lịch sử chăm sóc'
    });
  }
};

export const getPlantCareHistory = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;
    const userId = req.user?.id;
    const { 
      page, limit, sortBy, sortOrder, 
      startDate, endDate, activity 
    } = req.query;
    
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
    
    // Xử lý các tham số query
    const options: any = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: sortBy || 'performed_at',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
    };
    
    if (startDate) {
      options.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate as string);
    }
    
    if (activity) {
      options.activity = activity;
    }
    
    const result = await careHistoryService.getPlantCareHistory(
      new mongoose.Types.ObjectId(plantId),
      options
    );
    
    return res.status(200).json({
      success: true,
      message: 'Lấy lịch sử chăm sóc thành công',
      data: result
    });
  } catch (error) {
    console.error('Error getting care history:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi lấy lịch sử chăm sóc'
    });
  }
};

export const getCareHistoryStats = async (req: Request, res: Response) => {
  try {
    const { plantId } = req.params;
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;
    
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
    
    // Xử lý các tham số ngày
    let startDateObj, endDateObj;
    
    if (startDate) {
      startDateObj = new Date(startDate as string);
    }
    
    if (endDate) {
      endDateObj = new Date(endDate as string);
    }
    
    const stats = await careHistoryService.getCareHistoryStats(
      new mongoose.Types.ObjectId(plantId),
      startDateObj,
      endDateObj
    );
    
    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê lịch sử chăm sóc thành công',
      data: stats
    });
  } catch (error) {
    console.error('Error getting care history stats:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi lấy thống kê lịch sử chăm sóc'
    });
  }
};

export const getCareHistoryDetail = async (req: Request, res: Response) => {
  try {
    const { plantId, historyId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
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
    
    const history = await careHistoryService.getCareHistoryById(new mongoose.Types.ObjectId(historyId));
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử chăm sóc'
      });
    }
    
    // Kiểm tra history có thuộc về plant không
    if (history.plantId.toString() !== plantId) {
      return res.status(400).json({
        success: false,
        message: 'Lịch sử chăm sóc không thuộc về cây trồng này'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết lịch sử chăm sóc thành công',
      data: history
    });
  } catch (error) {
    console.error('Error getting care history detail:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi lấy chi tiết lịch sử chăm sóc'
    });
  }
};

export const updateCareHistory = async (req: Request, res: Response) => {
  try {
    const { plantId, historyId } = req.params;
    const { activity, description, performed_at, notes, images } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
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
    
    // Kiểm tra lịch sử tồn tại không
    const history = await careHistoryService.getCareHistoryById(new mongoose.Types.ObjectId(historyId));
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử chăm sóc'
      });
    }
    
    // Kiểm tra history có thuộc về plant không
    if (history.plantId.toString() !== plantId) {
      return res.status(400).json({
        success: false,
        message: 'Lịch sử chăm sóc không thuộc về cây trồng này'
      });
    }
    
    const updateData: any = {};
    if (activity) updateData.activity = activity;
    if (description) updateData.description = description;
    if (performed_at) updateData.performed_at = new Date(performed_at);
    if (notes !== undefined) updateData.notes = notes;
    if (images) updateData.images = images;
    
    const updatedHistory = await careHistoryService.updateCareHistory(
      new mongoose.Types.ObjectId(historyId),
      updateData
    );
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật lịch sử chăm sóc thành công',
      data: updatedHistory
    });
  } catch (error) {
    console.error('Error updating care history:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi cập nhật lịch sử chăm sóc'
    });
  }
};

export const deleteCareHistory = async (req: Request, res: Response) => {
  try {
    const { plantId, historyId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
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
    
    // Kiểm tra lịch sử tồn tại không
    const history = await careHistoryService.getCareHistoryById(new mongoose.Types.ObjectId(historyId));
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử chăm sóc'
      });
    }
    
    // Kiểm tra history có thuộc về plant không
    if (history.plantId.toString() !== plantId) {
      return res.status(400).json({
        success: false,
        message: 'Lịch sử chăm sóc không thuộc về cây trồng này'
      });
    }
    
    const result = await careHistoryService.deleteCareHistory(new mongoose.Types.ObjectId(historyId));
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa lịch sử chăm sóc'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa lịch sử chăm sóc thành công'
    });
  } catch (error) {
    console.error('Error deleting care history:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi xóa lịch sử chăm sóc'
    });
  }
};

export const completeTask = async (req: Request, res: Response) => {
  try {
    const { plantId, taskId } = req.params;
    const { notes, images } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(plantId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
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
    
    const history = await careHistoryService.completeTask(
      new mongoose.Types.ObjectId(taskId),
      {
        plantId: new mongoose.Types.ObjectId(plantId),
        performed_by: new mongoose.Types.ObjectId(userId),
        notes,
        images
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Đánh dấu công việc hoàn thành và thêm vào lịch sử thành công',
      data: history
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi đánh dấu công việc hoàn thành'
    });
  }
};