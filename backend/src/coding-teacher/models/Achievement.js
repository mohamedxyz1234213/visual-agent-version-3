import mongoose from 'mongoose';

const { Schema } = mongoose;

const achievementSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: {
      type: String,
      enum: [
        'first-lesson', 'first-exercise', 'first-avatar-session',
        'streak-3', 'streak-7', 'streak-14', 'streak-30', 'streak-100',
        'perfect-score', 'bug-hunter', 'speed-demon', 'night-owl',
        'helper', 'explorer', 'code-master', 'ai-friend',
        'early-bird', 'weekend-warrior', 'subject-expert',
        'leaderboard-top-3', 'challenge-winner', 'game-master',
      ],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Trophy' },
    color: { type: String, default: '#D4F542' },
    xpBonus: { type: Number, default: 0 },
    coinBonus: { type: Number, default: 0 },
    unlockedAt: { type: Date, default: Date.now },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

achievementSchema.index({ studentId: 1, type: 1 }, { unique: true });

export const Achievement = mongoose.model('Achievement', achievementSchema);
