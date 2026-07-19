import mongoose from 'mongoose';

const { Schema } = mongoose;

const progressSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    overallCompletion: { type: Number, default: 0 }, // percentage 0-100
    lessonCompletions: [
      {
        lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
        completedAt: Date,
        score: Number,
        timeSpent: Number, // seconds
        attempts: { type: Number, default: 1 },
      },
    ],
    examScores: [
      {
        examId: { type: Schema.Types.ObjectId, ref: 'Exam' },
        score: Number,
        maxScore: Number,
        percentage: Number,
        rankInClass: Number,
        takenAt: Date,
      },
    ],
    exerciseStats: {
      total: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      partial: { type: Number, default: 0 },
      avgScore: { type: Number, default: 0 },
      avgTimeSpent: { type: Number, default: 0 },
      byDifficulty: {
        easy: { total: { type: Number, default: 0 }, passed: { type: Number, default: 0 } },
        medium: { total: { type: Number, default: 0 }, passed: { type: Number, default: 0 } },
        hard: { total: { type: Number, default: 0 }, passed: { type: Number, default: 0 } },
      },
    },
    conceptMastery: [
      {
        concept: String,
        proficiency: { type: Number, default: 0 }, // 0-100
        lastPracticed: Date,
      },
    ],
    timeSpent: { type: Number, default: 0 }, // total minutes
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

progressSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
