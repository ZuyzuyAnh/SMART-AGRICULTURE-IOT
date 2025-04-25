import mongoose, { Document, Schema } from 'mongoose';

export interface ICareHistory extends Document {
  plantId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  activity: string;
  description: string;
  performed_by: mongoose.Types.ObjectId; // ID của user thực hiện
  performed_at: Date;
  notes?: string;
  images?: string[];
  created_at: Date;
}

const CareHistorySchema: Schema = new Schema({
  plantId: { type: Schema.Types.ObjectId, ref: 'Plant', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'CareTask' }, // Optional, có thể liên kết với task hoặc không
  activity: { type: String, required: true }, // Loại hoạt động: Tưới nước, Bón phân, Phun thuốc, etc.
  description: { type: String, required: true },
  performed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  performed_at: { type: Date, required: true },
  notes: { type: String },
  images: [{ type: String }], // Đường dẫn đến hình ảnh (nếu có)
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<ICareHistory>('CareHistory', CareHistorySchema);