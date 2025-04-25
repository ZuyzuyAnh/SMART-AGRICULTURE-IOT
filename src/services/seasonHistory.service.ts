// src/services/seasonHistory.service.ts
import mongoose from 'mongoose';
import SeasonHistory, { ISeasonHistory } from '../models/seasonHistory.model';
import Season from '../models/season.model';
import Plant from '../models/plant.model';
import SensorData from '../models/sensorData.model';
import CareHistory from '../models/careHistory.model';
import Prediction from '../models/prediction.model';

class SeasonHistoryService {
  // Đóng và lưu trữ một mùa vụ
  async archiveSeason(
    seasonId: mongoose.Types.ObjectId,
    data: {
      harvest_date: Date;
      total_yield: number;
      yield_quality: string;
      total_cost?: number;
      total_revenue?: number;
      weather_conditions?: string;
      challenges?: string;
      solutions?: string;
      lessons_learned?: string;
      notes?: string;
      images?: string[];
    }
  ): Promise<ISeasonHistory> {
    try {
      // Kiểm tra và lấy thông tin mùa vụ
      const season = await Season.findById(seasonId);
      if (!season) {
        throw new Error('Không tìm thấy mùa vụ');
      }
      
      // Kiểm tra xem mùa vụ đã kết thúc chưa
      if (new Date() < season.end_date) {
        throw new Error('Không thể lưu trữ mùa vụ chưa kết thúc');
      }
      
      // Tính toán số liệu thống kê
      const plants = await Plant.find({ seasonId });
      const totalPlants = plants.length;
      const successfulPlants = plants.filter(p => p.status === 'Đã thu hoạch').length;
      const failedPlants = plants.filter(p => p.status === 'Có vấn đề' || p.status === 'Thất bại').length;
      
      // Tính lợi nhuận
      const profit = (data.total_revenue || 0) - (data.total_cost || 0);
      
      // Tạo bản ghi lịch sử
      const seasonHistory = new SeasonHistory({
        seasonId,
        userId: season.userId,
        name: season.name,
        start_date: season.start_date,
        end_date: season.end_date,
        harvest_date: data.harvest_date,
        total_yield: data.total_yield,
        yield_quality: data.yield_quality,
        total_plants: totalPlants,
        successful_plants: successfulPlants,
        failed_plants: failedPlants,
        total_cost: data.total_cost || 0,
        total_revenue: data.total_revenue || 0,
        profit,
        weather_conditions: data.weather_conditions || '',
        challenges: data.challenges || '',
        solutions: data.solutions || '',
        lessons_learned: data.lessons_learned || '',
        notes: data.notes || '',
        images: data.images || [],
        created_at: new Date()
      });
      
      // Lưu lịch sử và cập nhật trạng thái mùa vụ
      const savedHistory = await seasonHistory.save();
      
      await Season.findByIdAndUpdate(seasonId, { 
        status: 'Đã kết thúc',
        is_archived: true
      });
      
      return savedHistory;
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử mùa vụ theo ID
  async getSeasonHistoryById(historyId: mongoose.Types.ObjectId): Promise<ISeasonHistory | null> {
    try {
      return await SeasonHistory.findById(historyId);
    } catch (error) {
      throw error;
    }
  }

  // Lấy lịch sử mùa vụ theo seasonId
  async getHistoryBySeasonId(seasonId: mongoose.Types.ObjectId): Promise<ISeasonHistory | null> {
    try {
      return await SeasonHistory.findOne({ seasonId });
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả lịch sử mùa vụ của người dùng
  async getSeasonHistoriesByUserId(
    userId: mongoose.Types.ObjectId,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      year?: number;
    } = {}
  ): Promise<{
    histories: ISeasonHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'end_date',
        sortOrder = 'desc',
        year
      } = options;
      
      const query: any = { userId };
      
      // Lọc theo năm nếu được cung cấp
      if (year) {
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);
        query.end_date = { $gte: startOfYear, $lte: endOfYear };
      }
      
      // Đếm tổng số bản ghi
      const total = await SeasonHistory.countDocuments(query);
      const totalPages = Math.ceil(total / limit);
      
      // Thực hiện query với phân trang và sắp xếp
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const histories = await SeasonHistory.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
      
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

  // Tạo báo cáo phân tích
  async generateSeasonReport(seasonId: mongoose.Types.ObjectId): Promise<any> {
    try {
      const history = await this.getHistoryBySeasonId(seasonId);
      if (!history) {
        throw new Error('Không tìm thấy lịch sử mùa vụ');
      }
      
      // Lấy dữ liệu cảm biến trung bình
      const locations = await mongoose.model('Location').find({ seasonId });
      const locationIds = locations.map(loc => loc._id);
      
      const sensorData = await SensorData.aggregate([
        { $match: { locationId: { $in: locationIds } } },
        { $group: {
            _id: null,
            avgTemperature: { $avg: '$temperature' },
            avgSoilMoisture: { $avg: '$soil_moisture' },
            avgLightIntensity: { $avg: '$light_intensity' },
            minTemperature: { $min: '$temperature' },
            maxTemperature: { $max: '$temperature' },
            minSoilMoisture: { $min: '$soil_moisture' },
            maxSoilMoisture: { $max: '$soil_moisture' },
            minLightIntensity: { $min: '$light_intensity' },
            maxLightIntensity: { $max: '$light_intensity' }
          }
        }
      ]);
      
      // Thống kê bệnh dịch
      const plants = await Plant.find({ seasonId });
      const plantIds = plants.map(plant => plant._id);
      
      // Lấy dữ liệu từ model IMG4Predict
      const images = await mongoose.model('IMG4Predict').find({ PlantId: { $in: plantIds } });
      const imageIds = images.map(img => img._id);
      
      // Thống kê loại bệnh
      const diseases = await Prediction.aggregate([
        { $match: { IMG4PredictId: { $in: imageIds } } },
        { $group: {
            _id: '$disease_name',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Thống kê hoạt động chăm sóc
      const careActivities = await CareHistory.aggregate([
        { $match: { plantId: { $in: plantIds } } },
        { $group: {
            _id: '$activity',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      // Tạo báo cáo tổng hợp
      return {
        seasonInfo: {
          name: history.name,
          startDate: history.start_date,
          endDate: history.end_date,
          harvestDate: history.harvest_date,
          duration: Math.ceil((history.end_date.getTime() - history.start_date.getTime()) / (1000 * 60 * 60 * 24))
        },
        productivity: {
          totalPlants: history.total_plants,
          successfulPlants: history.successful_plants,
          failedPlants: history.failed_plants,
          successRate: history.total_plants > 0 ? (history.successful_plants / history.total_plants) * 100 : 0,
          totalYield: history.total_yield,
          yieldQuality: history.yield_quality
        },
        economics: {
          totalCost: history.total_cost,
          totalRevenue: history.total_revenue,
          profit: history.profit,
          roi: history.total_cost > 0 ? (history.profit / history.total_cost) * 100 : 0
        },
        environmentData: sensorData.length > 0 ? sensorData[0] : null,
        diseaseStatistics: diseases,
        careActivities: careActivities,
        challenges: history.challenges,
        solutions: history.solutions,
        lessonsLearned: history.lessons_learned
      };
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật lịch sử mùa vụ
  async updateSeasonHistory(
    historyId: mongoose.Types.ObjectId,
    data: Partial<ISeasonHistory>
  ): Promise<ISeasonHistory | null> {
    try {
      return await SeasonHistory.findByIdAndUpdate(historyId, data, { new: true });
    } catch (error) {
      throw error;
    }
  }

  // Thêm vào seasonHistory.service.ts
async compareSeasons(seasonHistoryIds: mongoose.Types.ObjectId[]): Promise<any> {
    try {
      const histories = await SeasonHistory.find({
        _id: { $in: seasonHistoryIds }
      });
      
      if (histories.length < 2) {
        throw new Error('Cần ít nhất 2 mùa vụ để so sánh');
      }
      
      // Tính toán các chỉ số so sánh
      const comparisonData = histories.map(history => ({
        id: history._id,
        name: history.name,
        start_date: history.start_date,
        end_date: history.end_date,
        duration: Math.ceil((history.end_date.getTime() - history.start_date.getTime()) / (1000 * 60 * 60 * 24)),
        total_yield: history.total_yield,
        yield_quality: history.yield_quality,
        total_plants: history.total_plants,
        successful_plants: history.successful_plants,
        success_rate: history.total_plants > 0 ? (history.successful_plants / history.total_plants) * 100 : 0,
        total_cost: history.total_cost,
        total_revenue: history.total_revenue,
        profit: history.profit,
        roi: history.total_cost > 0 ? (history.profit / history.total_cost) * 100 : 0
      }));
      
      return {
        seasons: comparisonData,
        best_yield: comparisonData.reduce((prev, current) => 
          (prev.total_yield > current.total_yield) ? prev : current
        ),
        best_profit: comparisonData.reduce((prev, current) => 
          (prev.profit > current.profit) ? prev : current
        ),
        best_success_rate: comparisonData.reduce((prev, current) => 
          (prev.success_rate > current.success_rate) ? prev : current
        )
      };
    } catch (error) {
      throw error;
    }
  }

  // Ví dụ về cách tạo báo cáo PDF (cần cài đặt thêm PDFKit)
async generatePDFReport(seasonHistoryId: mongoose.Types.ObjectId): Promise<Buffer> {
    try {
      const history = await this.getSeasonHistoryById(seasonHistoryId);
      if (!history) {
        throw new Error('Không tìm thấy lịch sử mùa vụ');
      }
      
      const report = await this.generateSeasonReport(history.seasonId);
      
      // Tạo PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      
      // Nội dung PDF
      doc.fontSize(25).text(`Báo cáo mùa vụ: ${history.name}`, {
        align: 'center'
      });
      
      doc.moveDown();
      doc.fontSize(16).text('Thông tin chung:');
      doc.fontSize(12).text(`Ngày bắt đầu: ${report.seasonInfo.startDate.toLocaleDateString()}`);
      doc.fontSize(12).text(`Ngày kết thúc: ${report.seasonInfo.endDate.toLocaleDateString()}`);
      doc.fontSize(12).text(`Thời gian: ${report.seasonInfo.duration} ngày`);
      
      // Tiếp tục thêm nội dung...
      
      doc.end();
      
      // Trả về buffer
      return new Promise((resolve) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
      });
    } catch (error) {
      throw error;
    }
  }
}

export default new SeasonHistoryService();