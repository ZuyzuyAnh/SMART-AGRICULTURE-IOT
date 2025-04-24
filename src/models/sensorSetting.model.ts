import mongoose, { Document, Schema } from 'mongoose';

export interface ISensorSetting extends Document {
  frequency: number;
  is_active: boolean;
  last_updated: Date;
  created_at: Date;
  updated_at: Date;
}

const SensorSettingSchema: Schema = new Schema({
  frequency: { type: Number, default: 15, comment: 'Frequency in minutes' },
  is_active: { type: Boolean, default: true },
  last_updated: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<ISensorSetting>('SensorSetting', SensorSettingSchema);