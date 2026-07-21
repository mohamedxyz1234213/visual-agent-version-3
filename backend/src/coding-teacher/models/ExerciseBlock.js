import mongoose from 'mongoose';

const { Schema } = mongoose;

const exerciseBlockSchema = new Schema(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: 'CodingLesson', required: true, index: true },
    title: { type: String, default: '' },
    instructions: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    starterCode: { type: String, default: '' },
    solution: { type: String, default: '' },
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
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    order: { type: Number, default: 0 },
    isRequired: { type: Boolean, default: true },
    xpReward: { type: Number, default: 10 },
  },
  { timestamps: true }
);

exerciseBlockSchema.index({ lessonId: 1, order: 1 });

export const ExerciseBlock = mongoose.model('ExerciseBlock', exerciseBlockSchema);
