import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── PageViewLog ───────────────────────────────────────────────────────────────
const pageViewLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    username: { type: String, trim: true },
    userEmail: { type: String, lowercase: true, trim: true },

    path: { type: String, required: true, index: true },
    method: { type: String, default: 'GET' },
    statusCode: { type: Number },

    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const PageViewLog = mongoose.model('PageViewLog', pageViewLogSchema);
