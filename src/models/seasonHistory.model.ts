// src/models/seasonHistory.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ISeasonHistory extends Document {
  seasonId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  start_date: Date;
  end_date: Date;
  harvest_date: Date;
  total_yield: number; // Tổng sản lượng (kg)
  yield_quality: string; // Chất lượng thu hoạch (ví dụ: Tốt, Trung bình, Kém)
  total_plants: number; // Tổng số cây trồng
  successful_plants: number; // Số cây thu hoạch thành công
  failed_plants: number; // Số cây thất bại
  total_cost: number; // Tổng chi phí
  total_revenue: number; // Tổng doanh thu
  profit: number; // Lợi nhuận
  weather_conditions: string; // Điều kiện thời tiết tổng quan
  challenges: string; // Thách thức gặp phải
  solutions: string; // Giải pháp đã áp dụng
  lessons_learned: string; // Bài học kinh nghiệm
  notes: string; // Ghi chú
  images: string[]; // Hình ảnh thu hoạch
  created_at: Date;
}

const SeasonHistorySchema: Schema = new Schema({
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  harvest_date: { type: Date, required: true },
  total_yield: { type: Number, default: 0 },
  yield_quality: { type: String, enum: ['Xuất sắc', 'Tốt', 'Trung bình', 'Kém'], default: 'Trung bình' },
  total_plants: { type: Number, default: 0 },
  successful_plants: { type: Number, default: 0 },
  failed_plants: { type: Number, default: 0 },
  total_cost: { type: Number, default: 0 },
  total_revenue: { type: Number, default: 0 },
  profit: { type: Number, default: 0 },
  weather_conditions: { type: String },
  challenges: { type: String },
  solutions: { type: String },
  lessons_learned: { type: String },
  notes: { type: String },
  images: [{ type: String }],
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<ISeasonHistory>('SeasonHistory', SeasonHistorySchema);