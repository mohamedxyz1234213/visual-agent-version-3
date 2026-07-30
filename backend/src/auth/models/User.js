import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    username: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ['user', 'admin', 'super-admin', 'teacher', 'student', 'parent'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },

    // Quota (lessons the user is allowed to generate)
    maxAiRequests: { type: Number, default: 3 },
    aiRequestsUsed: { type: Number, default: 0 },

    // Profile niceties
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id.toString(),
    email: this.email,
    username: this.username,
    role: this.role,
    status: this.status,
    max_ai_requests: this.maxAiRequests,
    ai_requests_used: this.aiRequestsUsed,
    last_login_at: this.lastLoginAt ?? null,
    created_at: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
