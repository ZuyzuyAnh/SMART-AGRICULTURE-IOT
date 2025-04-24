import mongoose, { Document, Schema } from 'mongoose';

export interface ISeason extends Document {
  name: string;
  start_date: Date;
  end_date: Date;
  created_at: Date;
  updated_at: Date;
  userId: mongoose.Types.ObjectId;
}

const SeasonSchema: Schema = new Schema({
  name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export default mongoose.model<ISeason>('Season', SeasonSchema);