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
    plantingDate?: Date;  // Thêm ngày trồng
    harvestDate?: Date;   // Thêm ngày thu hoạch
    yield?: {             // Thêm sản lượng
      amount?: number;
      unit?: string;
    };
    quality?: {           // Thêm chất lượng
      rating?: string;
      description?: string;
    };
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

  // Cập nhật thông tin thu hoạch
  async updateHarvestInfo(
    plantId: mongoose.Types.ObjectId,
    harvestData: {
      harvestDate: Date;
      yield?: {
        amount: number;
        unit: string;
      };
      quality?: {
        rating: string;
        description?: string;
      };
    }
  ): Promise<IPlant | null> {
    try {
      return await Plant.findByIdAndUpdate(
        plantId,
        {
          harvestDate: harvestData.harvestDate,
          yield: harvestData.yield,
          quality: harvestData.quality,
          status: 'Đã thu hoạch',
          updated_at: new Date()
        },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả cây trồng theo trạng thái thu hoạch hoặc không thu hoạch
  async getPlantsByHarvestStatus(
    userId: string,
    isHarvested: boolean,
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<{
    plants: IPlant[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Tìm tất cả season thuộc về user
      const userSeasons = await Season.find({ userId: new mongoose.Types.ObjectId(userId) })
        .select('_id');
      
      if (userSeasons.length === 0) {
        return {
          plants: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
      
      // Lấy danh sách seasonId
      const seasonIds = userSeasons.map(season => season._id);
      
      // Xây dựng query dựa trên trạng thái thu hoạch
      let statusQuery;
      if (isHarvested) {
        // Nếu isHarvested = true, chỉ lấy cây với trạng thái "Đã thu hoạch" hoặc có harvestDate
        statusQuery = { 
          $or: [
            { status: "Đã thu hoạch" },
            { harvestDate: { $exists: true, $ne: null } }
          ]
        };
      } else {
        // Nếu isHarvested = false, lấy tất cả cây với trạng thái khác "Đã thu hoạch" và không có harvestDate
        statusQuery = { 
          $and: [
            { status: { $ne: "Đã thu hoạch" } },
            { $or: [
                { harvestDate: { $exists: false } },
                { harvestDate: null }
              ]
            }
          ]
        };
      }
      
      // Thêm điều kiện tìm kiếm theo tên nếu có
      const searchQuery = search 
        ? { name: { $regex: search, $options: 'i' } }
        : {};
      
      // Kết hợp các điều kiện query
      const query = {
        seasonId: { $in: seasonIds },
        ...statusQuery,
        ...searchQuery
      };
      
      const total = await Plant.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      const plants = await Plant.find(query)
        .populate('locationId', 'name')  // Thêm thông tin location
        .populate('seasonId', 'name')    // Thêm thông tin season
        .sort({ updated_at: -1 })
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

  // Lấy thống kê sản lượng theo mùa vụ
  async getYieldStatsBySeasonId(seasonId: mongoose.Types.ObjectId): Promise<{
    totalPlants: number;
    harvestedPlants: number;
    totalYield: number;
    averageQuality: string;
    yieldByQuality: Record<string, number>;
  }> {
    try {
      const totalPlants = await Plant.countDocuments({ seasonId });
      
      const harvestedPlants = await Plant.countDocuments({ 
        seasonId,
        $or: [
          { status: "Đã thu hoạch" },
          { harvestDate: { $exists: true, $ne: null } }
        ]
      });
      
      // Lấy tất cả cây đã thu hoạch
      const harvestedData = await Plant.find({
        seasonId,
        $or: [
          { status: "Đã thu hoạch" },
          { harvestDate: { $exists: true, $ne: null } }
        ],
        'yield.amount': { $exists: true, $ne: null }
      });
      
      // Tính tổng sản lượng, đã chuyển đổi sang đơn vị kg
      let totalYield = 0;
      const yieldByQuality: Record<string, number> = {
        'Tốt': 0,
        'Trung bình': 0,
        'Kém': 0
      };

      harvestedData.forEach(plant => {
        if (plant.yield?.amount) {
          let amount = plant.yield.amount;
          
          // Chuyển đổi đơn vị về kg
          if (plant.yield.unit === 'tạ') {
            amount *= 100;
          } else if (plant.yield.unit === 'tấn') {
            amount *= 1000;
          }
          
          totalYield += amount;
          
          // Thống kê theo chất lượng
          if (plant.quality?.rating) {
            yieldByQuality[plant.quality.rating] += amount;
          }
        }
      });
      
      // Tính chất lượng trung bình
      let averageQuality = 'Không xác định';
      if (harvestedData.length > 0) {
        const qualityCounts: Record<string, number> = {
          'Tốt': 0,
          'Trung bình': 0,
          'Kém': 0
        };
        
        harvestedData.forEach(plant => {
          if (plant.quality?.rating) {
            qualityCounts[plant.quality.rating]++;
          }
        });
        
        const maxQuality = Object.entries(qualityCounts).reduce((a, b) => 
          a[1] > b[1] ? a : b, ['Không xác định', 0]
        );
        
        averageQuality = maxQuality[0];
      }
      
      return {
        totalPlants,
        harvestedPlants,
        totalYield,
        averageQuality,
        yieldByQuality
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new PlantService();