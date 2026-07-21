import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── School ────────────────────────────────────────────────────────────────────
const schoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const School = mongoose.model('School', schoolSchema);
