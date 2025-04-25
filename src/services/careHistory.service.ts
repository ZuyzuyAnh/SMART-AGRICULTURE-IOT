import { ICareHistory } from '../models/careHistory.model';
import CareHistory from '../models/careHistory.model';
import Plant from '../models/plant.model';
import mongoose from 'mongoose';

class CareHistoryService {
  // Thêm bản ghi lịch sử chăm sóc mới
  async addCareHistory(data: {
    plantId: mongoose.Types.ObjectId;
    taskId?: mongoose.Types.ObjectId;
    activity: string;
    description: string;
    performed_by: mongoose.Types.ObjectId;
    performed_at: Date;
    notes?: string;
    images?: string[];
  }): Promise<ICareHistory> {
    try {
      // Kiểm tra plant có tồn tại không
      const plant = await Plant.findById(data.plantId);
      if (!plant) {
        throw new Error('Cây trồng không tồn tại');
      }
      
      // Tạo bản ghi lịch sử
      const careHistory = new CareHistory({
        ...data,
        created_at: new Date()
      });
      
      return await careHistory.save();
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử chăm sóc của cây trồng
  async getPlantCareHistory(
    plantId: mongoose.Types.ObjectId,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      startDate?: Date;
      endDate?: Date;
      activity?: string;
    } = {}
  ): Promise<{
    histories: ICareHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'performed_at',
        sortOrder = 'desc',
        startDate,
        endDate,
        activity
      } = options;
      
      // Xây dựng query filter
      const filter: any = { plantId };
      
      if (startDate || endDate) {
        filter.performed_at = {};
        if (startDate) filter.performed_at.$gte = startDate;
        if (endDate) filter.performed_at.$lte = endDate;
      }
      
      if (activity) {
        filter.activity = activity;
      }
      
      // Đếm tổng số bản ghi
      const total = await CareHistory.countDocuments(filter);
      const totalPages = Math.ceil(total / limit);
      
      // Thực hiện query với phân trang và sắp xếp
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const histories = await CareHistory.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('taskId', 'name type')
        .populate('performed_by', 'username email');
      
      return {
        histories,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy thống kê lịch sử chăm sóc theo loại hoạt động
  async getCareHistoryStats(
    plantId: mongoose.Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ activity: string; count: number }[]> {
    try {
      // Xây dựng filter
      const filter: any = { plantId };
      
      if (startDate || endDate) {
        filter.performed_at = {};
        if (startDate) filter.performed_at.$gte = startDate;
        if (endDate) filter.performed_at.$lte = endDate;
      }
      
      // Thực hiện aggregation để đếm theo loại hoạt động
      const stats = await CareHistory.aggregate([
        { $match: filter },
        { $group: {
            _id: '$activity',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $project: {
            _id: 0,
            activity: '$_id',
            count: 1
          }
        }
      ]);
      
      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Lấy chi tiết một bản ghi lịch sử
  async getCareHistoryById(historyId: mongoose.Types.ObjectId): Promise<ICareHistory | null> {
    try {
      return await CareHistory.findById(historyId)
        .populate('taskId', 'name type')
        .populate('performed_by', 'username email');
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật một bản ghi lịch sử
  async updateCareHistory(
    historyId: mongoose.Types.ObjectId,
    data: {
      activity?: string;
      description?: string;
      performed_at?: Date;
      notes?: string;
      images?: string[];
    }
  ): Promise<ICareHistory | null> {
    try {
      return await CareHistory.findByIdAndUpdate(
        historyId,
        data,
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Xóa một bản ghi lịch sử
  async deleteCareHistory(historyId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const result = await CareHistory.findByIdAndDelete(historyId);
      return result !== null;
    } catch (error) {
      throw error;
    }
  }

  // Đánh dấu công việc chăm sóc là đã hoàn thành và thêm vào lịch sử
  async completeTask(
    taskId: mongoose.Types.ObjectId,
    data: {
      plantId: mongoose.Types.ObjectId;
      performed_by: mongoose.Types.ObjectId;
      notes?: string;
      images?: string[];
    }
  ): Promise<ICareHistory> {
    try {
      // Tìm thông tin công việc
      const task = await mongoose.model('CareTask').findById(taskId);
      if (!task) {
        throw new Error('Không tìm thấy công việc chăm sóc');
      }
      
      // Tạo bản ghi lịch sử
      const careHistory = new CareHistory({
        plantId: data.plantId,
        taskId,
        activity: task.type,
        description: `Hoàn thành công việc: ${task.name}`,
        performed_by: data.performed_by,
        performed_at: new Date(),
        notes: data.notes,
        images: data.images,
        created_at: new Date()
      });
      
      // Lưu bản ghi lịch sử
      const savedHistory = await careHistory.save();
      
      // Cập nhật trạng thái công việc (nếu cần)
      await mongoose.model('CareTask').findByIdAndUpdate(
        taskId,
        { status: 'Đã hoàn thành', updated_at: new Date() }
      );
      
      return savedHistory;
    } catch (error) {
      throw error;
    }
  }
}

export default new CareHistoryService();