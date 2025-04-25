import mongoose, { Document, Schema } from 'mongoose';

export interface ISeason extends Document {
  name: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
  userId: mongoose.Types.ObjectId;
  is_archived: boolean;
}

const SeasonSchema: Schema = new Schema({
  name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['Đang chuẩn bị', 'Đang diễn ra', 'Đã kết thúc'], 
    default: 'Đang chuẩn bị' 
  },
  is_archived: { type: Boolean, default: false }
});

export default mongoose.model<ISeason>('Season', SeasonSchema);