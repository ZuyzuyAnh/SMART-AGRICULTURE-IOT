import { ISeason } from '../models/season.model';
import Season from '../models/season.model';
import mongoose from 'mongoose';

class SeasonService {
  // Tạo mùa vụ mới
  async createSeason(seasonData: {
    name: string;
    start_date: Date;
    end_date: Date;
    userId: mongoose.Types.ObjectId;
  }): Promise<ISeason> {
    try {
      const season = new Season({
        ...seasonData,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return await season.save();
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả mùa vụ của user
  async getSeasonsByUserId(
    userId: mongoose.Types.ObjectId, 
    page: number = 1, 
    limit: number = 10,
    filter: any = {}
  ): Promise<{
    seasons: ISeason[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const query = { userId, ...filter };
      const total = await Season.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      const seasons = await Season.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
        
      return {
        seasons,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      throw error;
    }
  }

  // Lấy chi tiết mùa vụ
  async getSeasonById(seasonId: mongoose.Types.ObjectId): Promise<ISeason | null> {
    try {
      return await Season.findById(seasonId);
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật mùa vụ
  async updateSeason(
    seasonId: mongoose.Types.ObjectId,
    updateData: Partial<ISeason>
  ): Promise<ISeason | null> {
    try {
      return await Season.findByIdAndUpdate(
        seasonId,
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

  // Xóa mùa vụ
  async deleteSeason(seasonId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const result = await Season.findByIdAndDelete(seasonId);
      return result !== null;
    } catch (error) {
      throw error;
    }
  }

  // Thống kê tổng quan về mùa vụ
  async getSeasonStats(seasonId: mongoose.Types.ObjectId): Promise<any> {
    try {
      // Bạn có thể mở rộng phần này để lấy thêm thông tin từ Plants
      // và các thực thể khác liên quan đến Season
      const season = await Season.findById(seasonId);
      
      // Ví dụ: có thể thêm code để đếm số cây trồng trong mùa vụ
      // const plantCount = await Plant.countDocuments({ seasonId });
      
      return {
        season,
        // stats: {
        //   plantCount,
        //   // Thêm các thống kê khác
        // }
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new SeasonService();