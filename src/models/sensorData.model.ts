import mongoose, { Document, Schema } from 'mongoose';

export interface ISensorData extends Document {
  id: string;
  temperature: number;
  soil_moisture: number;
  light_intensity: number;
  recorded_at: Date;
  created_at: Date;
}

const SensorDataSchema: Schema = new Schema({
  temperature: { type: Number, required: true },
  soil_moisture: { type: Number, required: true },
  light_intensity: { type: Number, required: true },
  recorded_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model<ISensorData>('SensorData', SensorDataSchema);