// src/models/location.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  description: string;
  area: string;
  seasonId: mongoose.Types.ObjectId; // Thêm tham chiếu đến Season
  sensorDataId: mongoose.Types.ObjectId;
  sensor_settingsId: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const LocationSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  area: { type: String },
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true }, // Liên kết với Season
  sensorDataId: { type: Schema.Types.ObjectId, ref: 'SensorData' },
  sensor_settingsId: { type: Schema.Types.ObjectId, ref: 'SensorSetting' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<ILocation>('Location', LocationSchema);