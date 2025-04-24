import mongoose, { Document, Schema } from 'mongoose';

export interface ICarePlan extends Document {
  date: Date;
  type: string;
  note: string;
  status: string;
  careTasksId: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CarePlanSchema: Schema = new Schema({
  date: { type: Date, required: true },
  type: { type: String, required: true },
  note: { type: String },
  status: { 
    type: String,
    enum: ['Đang thực hiện', 'Đã hoàn thành', 'Đã hủy'],
    default: 'Đang thực hiện'
  },
  careTasksId: { type: Schema.Types.ObjectId, ref: 'CareTask' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model<ICarePlan>('CarePlan', CarePlanSchema);