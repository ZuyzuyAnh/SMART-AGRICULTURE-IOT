import { ICarePlan } from '../models/carePlan.model';
import CarePlan from '../models/carePlan.model';
import CareTask from '../models/careTask.model';
import Plant from '../models/plant.model';
import mongoose from 'mongoose';

class CarePlanService {
  // Tạo kế hoạch chăm sóc mới
  async createCarePlan(data: {
    plantId: mongoose.Types.ObjectId;
    date: Date;
    type: string;
    note?: string;
    status?: string;
  }): Promise<ICarePlan> {
    try {
      // Kiểm tra plant có tồn tại không
      const plant = await Plant.findById(data.plantId);
      if (!plant) {
        throw new Error('Cây trồng không tồn tại');
      }
      
      // Tạo kế hoạch chăm sóc
      const carePlan = new CarePlan({
        date: data.date,
        type: data.type,
        note: data.note || '',
        status: data.status || 'Đang thực hiện',
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const savedCarePlan = await carePlan.save();
      
      // Cập nhật carePlanId trong plant
      plant.carePlanId = savedCarePlan._id as mongoose.Types.ObjectId;
      await plant.save();
      
      return savedCarePlan;
    } catch (error) {
      throw error;
    }
  }

  // Lấy kế hoạch chăm sóc của cây trồng
  async getCarePlanByPlantId(plantId: mongoose.Types.ObjectId): Promise<ICarePlan | null> {
    try {
      const plant = await Plant.findById(plantId);
      if (!plant || !plant.carePlanId) {
        return null;
      }
      
      return await CarePlan.findById(plant.carePlanId);
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật kế hoạch chăm sóc
  async updateCarePlan(
    carePlanId: mongoose.Types.ObjectId,
    data: {
      date?: Date;
      type?: string;
      note?: string;
      status?: string;
    }
  ): Promise<ICarePlan | null> {
    try {
      const updateData: any = { ...data, updated_at: new Date() };
      
      return await CarePlan.findByIdAndUpdate(
        carePlanId,
        updateData,
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Xóa kế hoạch chăm sóc
  async deleteCarePlan(carePlanId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      // Tìm plants sử dụng carePlan này và xóa tham chiếu
      await Plant.updateMany(
        { carePlanId },
        { $unset: { carePlanId: 1 } }
      );
      
      // Xóa tất cả careTasks liên quan
      await CareTask.deleteMany({ carePlanId });
      
      // Xóa carePlan
      const result = await CarePlan.findByIdAndDelete(carePlanId);
      return result !== null;
    } catch (error) {
      throw error;
    }
  }
}

export default new CarePlanService();