import { IPlant } from '../models/plant.model';
import Plant from '../models/plant.model';
import Location from '../models/location.model';
import Season from '../models/season.model';
import mongoose from 'mongoose';

class PlantService {
  // Tạo cây trồng mới
  async createPlant(plantData: {
    name: string;
    img?: string;
    address?: string;
    status?: string;
    startdate?: Date;
    note?: string;
    locationId: mongoose.Types.ObjectId;
    seasonId: mongoose.Types.ObjectId;
  }): Promise<IPlant> {
    try {
      // Kiểm tra xem Season có tồn tại không
      const seasonExists = await Season.exists({ _id: plantData.seasonId });
      if (!seasonExists) {
        throw new Error('Season not found');
      }
      
      // Kiểm tra xem Location có tồn tại không
      const locationExists = await Location.exists({ _id: plantData.locationId });
      if (!locationExists) {
        throw new Error('Location not found');
      }
      
      const plant = new Plant({
        ...plantData,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return await plant.save();
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả cây trồng theo locationId
  async getPlantsByLocationId(
    locationId: mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    filter: any = {}
  ): Promise<{
    plants: IPlant[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const query = { locationId, ...filter };
      const total = await Plant.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      const plants = await Plant.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
        
      return {
        plants,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả cây trồng theo seasonId
  async getPlantsBySeasonId(
    seasonId: mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    filter: any = {}
  ): Promise<{
    plants: IPlant[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const query = { seasonId, ...filter };
      const total = await Plant.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      const plants = await Plant.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
        
      return {
        plants,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy chi tiết cây trồng
  async getPlantById(plantId: mongoose.Types.ObjectId): Promise<IPlant | null> {
    try {
      return await Plant.findById(plantId);
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật cây trồng
  async updatePlant(
    plantId: mongoose.Types.ObjectId,
    updateData: Partial<IPlant>
  ): Promise<IPlant | null> {
    try {
      return await Plant.findByIdAndUpdate(
        plantId,
        {
          ...updateData,
          updated_at: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Xóa cây trồng
  async deletePlant(plantId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const result = await Plant.findByIdAndDelete(plantId);
      return result !== null;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật trạng thái cây trồng
  async updatePlantStatus(
    plantId: mongoose.Types.ObjectId,
    status: string
  ): Promise<IPlant | null> {
    try {
      return await Plant.findByIdAndUpdate(
        plantId,
        {
          status,
          updated_at: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }
}

export default new PlantService();