import { ILocation } from '../models/location.model';
import Location from '../models/location.model';
import Season from '../models/season.model';
import mongoose from 'mongoose';

class LocationService {
  // Tạo địa điểm mới
  async createLocation(locationData: {
    name: string;
    description?: string;
    area?: string;
    seasonId: mongoose.Types.ObjectId;
  }): Promise<ILocation> {
    try {
      // Kiểm tra xem Season có tồn tại không
      const seasonExists = await Season.exists({ _id: locationData.seasonId });
      if (!seasonExists) {
        throw new Error('Season not found');
      }
      
      const location = new Location({
        ...locationData,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return await location.save();
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả địa điểm của một mùa vụ
  async getLocationsBySeasonId(
    seasonId: mongoose.Types.ObjectId,
    page: number = 1,
    limit: number = 10,
    filter: any = {}
  ): Promise<{
    locations: ILocation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const query = { seasonId, ...filter };
      const total = await Location.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      const locations = await Location.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
        
      return {
        locations,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy chi tiết địa điểm
  async getLocationById(locationId: mongoose.Types.ObjectId): Promise<ILocation | null> {
    try {
      return await Location.findById(locationId);
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật địa điểm
  async updateLocation(
    locationId: mongoose.Types.ObjectId,
    updateData: Partial<ILocation>
  ): Promise<ILocation | null> {
    try {
      return await Location.findByIdAndUpdate(
        locationId,
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

  // Xóa địa điểm
  async deleteLocation(locationId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const result = await Location.findByIdAndDelete(locationId);
      return result !== null;
    } catch (error) {
      throw error;
    }
  }
}

export default new LocationService();