import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── Session ───────────────────────────────────────────────────────────────────
const sessionSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'admin', 'super-admin', 'teacher', 'student', 'parent'], required: true },
    ip: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', sessionSchema);
