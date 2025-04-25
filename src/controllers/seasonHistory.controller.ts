// src/controllers/seasonHistory.controller.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import seasonHistoryService from '../services/seasonHistory.service';
import seasonService from '../services/season.service';

export const archiveSeason = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { seasonId } = req.params;
    const { 
      harvest_date, total_yield, yield_quality, total_cost,
      total_revenue, weather_conditions, challenges, solutions,
      lessons_learned, notes, images 
    } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(seasonId)) {
      return res.status(400).json({
        success: false,
        message: 'ID mùa vụ không hợp lệ'
      });
    }
    
    if (!harvest_date || !total_yield || !yield_quality) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ngày thu hoạch, tổng sản lượng và chất lượng'
      });
    }
    
    // Kiểm tra quyền truy cập
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mùa vụ'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập mùa vụ này'
      });
    }
    
    // Kiểm tra xem mùa vụ đã lưu trữ chưa
    if (season.is_archived) {
      return res.status(400).json({
        success: false,
        message: 'Mùa vụ này đã được lưu trữ'
      });
    }
    
    const seasonHistory = await seasonHistoryService.archiveSeason(
      new mongoose.Types.ObjectId(seasonId),
      {
        harvest_date: new Date(harvest_date),
        total_yield,
        yield_quality,
        total_cost,
        total_revenue,
        weather_conditions,
        challenges,
        solutions,
        lessons_learned,
        notes,
        images
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Lưu trữ mùa vụ thành công',
      data: seasonHistory
    });
  } catch (error) {
    console.error('Error archiving season:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi lưu trữ mùa vụ'
    });
  }
};

export const getSeasonReport = async (req: Request, res: Response) => {
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
        message: 'ID mùa vụ không hợp lệ'
      });
    }
    
    // Kiểm tra quyền truy cập
    const season = await seasonService.getSeasonById(new mongoose.Types.ObjectId(seasonId));
    if (!season) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mùa vụ'
      });
    }
    
    if (season.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập mùa vụ này'
      });
    }
    
    // Kiểm tra xem mùa vụ đã lưu trữ chưa
    if (!season.is_archived) {
      return res.status(400).json({
        success: false,
        message: 'Mùa vụ chưa được lưu trữ'
      });
    }
    
    const report = await seasonHistoryService.generateSeasonReport(
      new mongoose.Types.ObjectId(seasonId)
    );
    
    return res.status(200).json({
      success: true,
      message: 'Tạo báo cáo mùa vụ thành công',
      data: report
    });
  } catch (error) {
    console.error('Error generating season report:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi tạo báo cáo mùa vụ'
    });
  }
};

export const getSeasonHistories = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page, limit, sortBy, sortOrder, year } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const options: any = {
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
      sortBy: sortBy || 'end_date',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc'
    };
    
    if (year) {
      options.year = parseInt(year as string);
    }
    
    const result = await seasonHistoryService.getSeasonHistoriesByUserId(
      new mongoose.Types.ObjectId(userId),
      options
    );
    
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách lịch sử mùa vụ thành công',
      data: result
    });
  } catch (error) {
    console.error('Error getting season histories:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi lấy danh sách lịch sử mùa vụ'
    });
  }
};

export const getSeasonHistoryDetail = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { historyId } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch sử không hợp lệ'
      });
    }
    
    const history = await seasonHistoryService.getSeasonHistoryById(
      new mongoose.Types.ObjectId(historyId)
    );
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử mùa vụ'
      });
    }
    
    if (history.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập lịch sử mùa vụ này'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết lịch sử mùa vụ thành công',
      data: history
    });
  } catch (error) {
    console.error('Error getting season history detail:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi lấy chi tiết lịch sử mùa vụ'
    });
  }
};

export const updateSeasonHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { historyId } = req.params;
    const updateData = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID lịch sử không hợp lệ'
      });
    }
    
    const history = await seasonHistoryService.getSeasonHistoryById(
      new mongoose.Types.ObjectId(historyId)
    );
    
    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch sử mùa vụ'
      });
    }
    
    if (history.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập lịch sử mùa vụ này'
      });
    }
    
    // Loại bỏ các trường không được phép cập nhật
    delete updateData.seasonId;
    delete updateData.userId;
    delete updateData.created_at;
    
    const updatedHistory = await seasonHistoryService.updateSeasonHistory(
      new mongoose.Types.ObjectId(historyId),
      updateData
    );
    
    return res.status(200).json({
      success: true,
      message: 'Cập nhật lịch sử mùa vụ thành công',
      data: updatedHistory
    });
  } catch (error) {
    console.error('Error updating season history:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Lỗi khi cập nhật lịch sử mùa vụ'
    });
  }
};