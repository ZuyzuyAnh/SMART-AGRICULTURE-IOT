import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  name: string;
  type: string;
  deviceId: string; // ID duy nhất của thiết bị (có thể là MAC address)
  locationId: mongoose.Types.ObjectId | null;
  status: string;
  last_active: Date;
  battery_level: number;
  firmware_version: string;
  sensors: string[]; // Các loại cảm biến trên thiết bị ['temperature', 'humidity', 'light_intensity']
  settings: any; // Cài đặt dành riêng cho thiết bị
  created_at: Date;
  updated_at: Date;
}

const DeviceSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['ESP32', 'Arduino', 'RaspberryPi', 'Custom'],
    default: 'Custom'
  },
  deviceId: { type: String, required: true, unique: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', default: null },
  status: { 
    type: String, 
    enum: ['Hoạt động', 'Không hoạt động', 'Offline', 'Cần bảo trì'],
    default: 'Không hoạt động'
  },
  last_active: { type: Date },
  battery_level: { type: Number },
  firmware_version: { type: String },
  sensors: [{ type: String }],
  settings: { type: Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index để tìm kiếm nhanh
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ locationId: 1 });

export default mongoose.model<IDevice>('Device', DeviceSchema);