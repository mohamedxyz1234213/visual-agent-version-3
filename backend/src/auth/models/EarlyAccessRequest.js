import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── EarlyAccessRequest ────────────────────────────────────────────────────────
const earlyAccessRequestSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    username: { type: String, required: true, trim: true, index: true },
    reason: { type: String, default: '' },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'expired'],
      default: 'pending',
      index: true,
    },

    // Invite token (only populated on approval)
    inviteToken: { type: String, index: true },
    inviteExpiresAt: { type: Date },

    // Audit
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },

    completedAt: { type: Date },
    completedUserId: { type: Schema.Types.ObjectId, ref: 'User' },

    // IP / agent for security audit
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

earlyAccessRequestSchema.index({ email: 1, status: 1 });

export const EarlyAccessRequest = mongoose.model('EarlyAccessRequest', earlyAccessRequestSchema);
