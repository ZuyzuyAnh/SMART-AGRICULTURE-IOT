import mongoose, { Document, Schema } from "mongoose";

export interface ICareTask extends Document {
  name: string;
  type: string;
  scheduled_date: Date;
  note: string;
  status: string;
  carePlanId: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const CareTaskSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "Bón phân",
      "Tưới nước",
      "Phun thuốc",
      "Tỉa cành",
      "Thu hoạch",
      "Xử lý sâu bệnh",
    ],
    required: true,
  },
  scheduled_date: { type: Date, required: true },
  note: { type: String },
  status: {
    type: String,
    enum: ["Chưa thực hiện", "Đang thực hiện", "Đã hoàn thành", "Đã hủy"],
    default: "Chưa thực hiện",
  },
  carePlanId: { type: Schema.Types.ObjectId, ref: "CarePlan", required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

export default mongoose.model<ICareTask>("CareTask", CareTaskSchema);
