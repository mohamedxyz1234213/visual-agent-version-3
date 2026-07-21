import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'lesson-assigned', 'exam-upcoming', 'exam-result',
        'exercise-feedback', 'achievement', 'badge-earned',
        'streak-warning', 'streak-broken', 'streak-milestone',
        'leaderboard-change', 'challenge-start', 'challenge-end',
        'parent-update', 'system', 'announcement',
        'teacher-message', 'ai-avatar-summary',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    metadata: {
      entityType: String,
      entityId: String,
      url: String,
      image: String,
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    expiresAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
