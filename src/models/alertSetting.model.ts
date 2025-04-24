import mongoose, { Document, Schema } from 'mongoose';

export interface IAlertSettings extends Document {
  temperature_min: number;
  temperature_max: number;
  soil_moisture_min: number;
  soil_moisture_max: number;
  light_intensity_min: number;
  light_intensity_max: number;
  created_at: Date;
  updated_at: Date;
  locationId: mongoose.Types.ObjectId;
}

const AlertSettingsSchema: Schema = new Schema({
  temperature_min: { type: Number, default: 15 },
  temperature_max: { type: Number, default: 35 },
  soil_moisture_min: { type: Number, default: 30 },
  soil_moisture_max: { type: Number, default: 80 },
  light_intensity_min: { type: Number, default: 300 },
  light_intensity_max: { type: Number, default: 800 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true }
});

export default mongoose.model<IAlertSettings>('AlertSettings', AlertSettingsSchema);