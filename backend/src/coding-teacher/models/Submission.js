import mongoose from 'mongoose';

const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', index: true },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    status: {
      type: String,
      enum: ['pending', 'running', 'passed', 'failed', 'partial', 'error'],
      default: 'pending',
    },
    results: [
      {
        testCaseId: String,
        passed: Boolean,
        output: String,
        expectedOutput: String,
        executionTime: Number, // ms
        memoryUsed: Number, // KB
      },
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }, // seconds
    aiFeedback: { type: String, default: '' },
    aiFeedbackDetails: {
      conceptualMistake: String,
      suggestion: String,
      similarConcept: String,
      encouragement: String,
    },
    teacherFeedback: { type: String, default: '' },
    attemptNumber: { type: Number, default: 1 },
    hintsUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

submissionSchema.index({ exerciseId: 1, studentId: 1 });
submissionSchema.index({ examId: 1, studentId: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);
