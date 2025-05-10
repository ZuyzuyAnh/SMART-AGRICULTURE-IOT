// src/models/notification.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  title: string;
  content: string;
  type: string;
  priority: string;
  recipients: string[];
  data: Record<string, any>;
  locationId?: mongoose.Types.ObjectId;
  sensorDataId?: mongoose.Types.ObjectId;
  read: boolean;
  created_at: Date;
  read_at?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const NotificationSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "SYSTEM",
      "ALERT",
      "INFO",
      "CARE_PLAN",
      "DEVICE_ALERT",
      "SEASON_ENDING",
      "HARVEST_ALERT",
    ],
  },
  priority: {
    type: String,
    required: true,
    enum: ["HIGH", "MEDIUM", "LOW"],
  },
  recipients: [{ type: String }], // ["all"] hoặc danh sách userId
  data: { type: Schema.Types.Mixed }, // Dữ liệu bổ sung
  locationId: { type: Schema.Types.ObjectId, ref: "Location" },
  sensorDataId: { type: Schema.Types.ObjectId, ref: "SensorData" },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  read_at: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
