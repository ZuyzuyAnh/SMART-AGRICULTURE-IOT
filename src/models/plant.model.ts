import mongoose, { Document, Schema } from 'mongoose';

export interface IPlant extends Document {
  name: string;
  img: string;
  address: string;
  status: string;
  startdate: Date;
  note: string;
  locationId: mongoose.Types.ObjectId;
  seasonId: mongoose.Types.ObjectId;
  history_plantId: mongoose.Types.ObjectId;
  carePlanId: mongoose.Types.ObjectId;
  alertSettingsId: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const PlantSchema: Schema = new Schema({
  name: { type: String, required: true },
  img: { type: String },
  address: { type: String },
  status: { 
    type: String, 
    enum: ['Đang tốt', 'Cần chú ý', 'Có vấn đề', 'Đã thu hoạch'],
    default: 'Đang tốt'
  },
  startdate: { type: Date, default: Date.now },
  note: { type: String },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
  seasonId: { type: Schema.Types.ObjectId, ref: 'Season' },
  history_plantId: { type: Schema.Types.ObjectId, ref: 'HistoryPlant' },
  carePlanId: { type: Schema.Types.ObjectId, ref: 'CarePlan' },
  alertSettingsId: { type: Schema.Types.ObjectId, ref: 'AlertSetting' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<IPlant>('Plant', PlantSchema);