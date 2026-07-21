import mongoose from 'mongoose';

const { Schema } = mongoose;

const exerciseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CodingLesson', index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    type: {
      type: String,
      enum: ['fill-code', 'find-bug', 'predict-output', 'drag-drop', 'free-code', 'match-output'],
      default: 'free-code',
    },
    starterCode: { type: String, default: '' },
    solution: { type: String, default: '' },
    solutionExplanation: { type: String, default: '' },
    testCases: [
      {
        id: String,
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false },
        description: String,
      },
    ],
    hints: [
      {
        order: Number,
        text: String,
        cost: { type: Number, default: 5 }, // coins
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    xpReward: { type: Number, default: 10 },
    coinReward: { type: Number, default: 5 },
    timeLimit: { type: Number }, // seconds, optional
    tags: [String],
    estimatedTime: { type: Number, default: 10 }, // minutes
    successRate: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    totalPasses: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

exerciseSchema.index({ subjectId: 1, difficulty: 1 });
exerciseSchema.index({ tags: 1 });

export const Exercise = mongoose.model('Exercise', exerciseSchema);
