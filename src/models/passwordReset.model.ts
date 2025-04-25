import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordReset extends Document {
  email: string;
  token: string;
  expires: Date;
  used: boolean;
  created_at: Date;
}

const PasswordResetSchema: Schema = new Schema({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  used: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

PasswordResetSchema.index({ email: 1, token: 1 });
PasswordResetSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);