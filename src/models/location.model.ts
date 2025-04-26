import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  location_code: string; 
  description: string;
  area: string;
  seasonId: mongoose.Types.ObjectId;
  sensorDataId: mongoose.Types.ObjectId;
  sensor_settingsId: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const LocationSchema: Schema = new Schema({
  name: { type: String, required: true },
  location_code: { type: String, required: true, unique: true }, 
  description: { type: String },
  area: { type: String },
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
  sensorDataId: { type: Schema.Types.ObjectId, ref: 'SensorData' },
  sensor_settingsId: { type: Schema.Types.ObjectId, ref: 'SensorSetting' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

LocationSchema.index({ location_code: 1 }, { unique: true });

export default mongoose.model<ILocation>('Location', LocationSchema);