import mongoose from 'mongoose';

const { Schema } = mongoose;

const badgeSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Award' },
    criteria: {
      type: {
        type: String,
        enum: ['xp-reached', 'streak-reached', 'exercises-completed', 'exams-passed', 'avatar-sessions', 'perfect-scores', 'help-others', 'custom'],
        required: true,
      },
      threshold: { type: Number, default: 1 },
      subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
      timeFrame: { type: String, enum: ['daily', 'weekly', 'monthly', 'all-time'], default: 'all-time' },
    },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    color: { type: String, default: '#D4F542' },
    xpBonus: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Badge = mongoose.model('Badge', badgeSchema);

// StudentBadge junction
const studentBadgeSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    badgeId: { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    earnedAt: { type: Date, default: Date.now },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studentBadgeSchema.index({ studentId: 1, badgeId: 1 }, { unique: true });

export const StudentBadge = mongoose.model('StudentBadge', studentBadgeSchema);
