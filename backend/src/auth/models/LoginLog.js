import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── LoginLog ──────────────────────────────────────────────────────────────────
const loginLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    username: { type: String, trim: true },
    success: { type: Boolean, required: true, index: true },
    failureReason: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const LoginLog = mongoose.model('LoginLog', loginLogSchema);
