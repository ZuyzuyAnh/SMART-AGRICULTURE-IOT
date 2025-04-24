import mongoose, { Document, Schema } from 'mongoose';

export interface IAlertSetting extends Document {
  temperature_min: number;
  temperature_max: number;
  soil_moisture_min: number;
  soil_moisture_max: number;
  light_intensity_min: number;
  light_intensity_max: number;
  created_at: Date;
  updated_at: Date;
}

const AlertSettingSchema: Schema = new Schema({
  temperature_min: { type: Number, default: 18 },
  temperature_max: { type: Number, default: 30 },
  soil_moisture_min: { type: Number, default: 30 },
  soil_moisture_max: { type: Number, default: 70 },
  light_intensity_min: { type: Number, default: 100 },
  light_intensity_max: { type: Number, default: 1000 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<IAlertSetting>('AlertSetting', AlertSettingSchema);