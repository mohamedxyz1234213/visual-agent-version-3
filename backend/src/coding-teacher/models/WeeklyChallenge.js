import mongoose from 'mongoose';

const { Schema } = mongoose;

const weeklyChallengeSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    rules: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    submissions: [
      {
        studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
        submissionId: { type: Schema.Types.ObjectId, ref: 'Submission' },
        score: Number,
        time: Number, // seconds
        rank: Number,
        submittedAt: Date,
      },
    ],
    rewards: {
      xp: { type: Number, default: 20 },
      coins: { type: Number, default: 10 },
      badgeId: { type: Schema.Types.ObjectId, ref: 'Badge' },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

weeklyChallengeSchema.index({ startDate: 1, endDate: 1 });

export const WeeklyChallenge = mongoose.model('WeeklyChallenge', weeklyChallengeSchema);
