import mongoose, { Schema, Document } from "mongoose";

export interface ICameraImage extends Document {
  filename: string;
  path: string;
  deviceId: string;
  locationId?: mongoose.Types.ObjectId;
  plantId?: mongoose.Types.ObjectId;
  captured_at: Date;
  created_at: Date;
  metadata?: {
    size?: number;
    width?: number;
    height?: number;
    format?: string;
  };
}

const CameraImageSchema: Schema = new Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  deviceId: { type: String, required: true, index: true },
  locationId: { type: Schema.Types.ObjectId, ref: "Location", index: true },
  plantId: { type: Schema.Types.ObjectId, ref: "Plant", index: true },
  captured_at: { type: Date, default: Date.now, index: true },
  created_at: { type: Date, default: Date.now },
  metadata: {
    size: Number,
    width: Number,
    height: Number,
    format: String,
  },
});

// Tạo index tổng hợp để tìm kiếm hiệu quả hơn
CameraImageSchema.index({ deviceId: 1, captured_at: -1 });
CameraImageSchema.index({ locationId: 1, captured_at: -1 });
CameraImageSchema.index({ plantId: 1, captured_at: -1 });

export default mongoose.model<ICameraImage>("CameraImage", CameraImageSchema);
