import { ICareTask } from '../models/careTask.model';
import CareTask from '../models/careTask.model';
import CarePlan from '../models/carePlan.model';
import mongoose from 'mongoose';

class CareTaskService {
  // Thêm công việc mới vào kế hoạch chăm sóc
  async createCareTask(data: {
    carePlanId: mongoose.Types.ObjectId;
    name: string;
    type: string;
    scheduled_date: Date;
    note?: string;
  }): Promise<ICareTask> {
    try {
      // Kiểm tra carePlan có tồn tại không
      const carePlan = await CarePlan.findById(data.carePlanId);
      if (!carePlan) {
        throw new Error('Kế hoạch chăm sóc không tồn tại');
      }
      
      // Tạo công việc
      const careTask = new CareTask({
        name: data.name,
        type: data.type,
        scheduled_date: data.scheduled_date,
        note: data.note || '',
        carePlanId: data.carePlanId,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return await careTask.save();
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách công việc trong kế hoạch
  async getCareTasksByCarePlanId(
    carePlanId: mongoose.Types.ObjectId,
    filter: any = {}
  ): Promise<ICareTask[]> {
    try {
      return await CareTask.find({ 
        carePlanId,
        ...filter
      }).sort({ scheduled_date: 1 });
    } catch (error) {
      throw error;
    }
  }

  // Lấy chi tiết công việc
  async getCareTaskById(taskId: mongoose.Types.ObjectId): Promise<ICareTask | null> {
    try {
      return await CareTask.findById(taskId);
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật công việc
  async updateCareTask(
    taskId: mongoose.Types.ObjectId,
    data: {
      name?: string;
      type?: string;
      scheduled_date?: Date;
      note?: string;
    }
  ): Promise<ICareTask | null> {
    try {
      const updateData: any = { ...data, updated_at: new Date() };
      
      return await CareTask.findByIdAndUpdate(
        taskId,
        updateData,
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Xóa công việc
  async deleteCareTask(taskId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const result = await CareTask.findByIdAndDelete(taskId);
      return result !== null;
    } catch (error) {
      throw error;
    }
  }

  // Lấy các công việc sắp tới
  async getUpcomingTasks(
    plantId: mongoose.Types.ObjectId,
    days: number = 7
  ): Promise<ICareTask[]> {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);
      
      // Tìm carePlan của plant
      const plant = await mongoose.model('Plant').findById(plantId);
      if (!plant || !plant.carePlanId) {
        return [];
      }
      
      return await CareTask.find({
        carePlanId: plant.carePlanId,
        scheduled_date: {
          $gte: today,
          $lte: endDate
        }
      }).sort({ scheduled_date: 1 });
    } catch (error) {
      throw error;
    }
  }
}

export default new CareTaskService();