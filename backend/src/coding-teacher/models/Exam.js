import mongoose from 'mongoose';

const { Schema } = mongoose;

const examSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User' },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    schoolYearId: { type: Schema.Types.ObjectId, ref: 'SchoolYear' },
    type: {
      type: String,
      enum: ['midterm', 'final', 'quiz', 'practice', 'diagnostic'],
      default: 'quiz',
    },
    instructions: { type: String, default: '' },
    questions: [
      {
        id: String,
        type: {
          type: String,
          enum: ['mcq', 'code', 'fill-blank', 'bug-fix', 'predict-output', 'drag-drop'],
        },
        question: String,
        code: String,
        codeLanguage: String,
        options: [String],
        correctAnswer: String,
        points: { type: Number, default: 1 },
        explanation: String,
        hint: String,
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard'],
          default: 'medium',
        },
        tags: [String],
      },
    ],
    duration: { type: Number, default: 60 }, // minutes
    totalPoints: { type: Number, default: 0 },
    passingScore: { type: Number, default: 60 }, // percentage
    startDate: { type: Date },
    endDate: { type: Date },
    isPublished: { type: Boolean, default: false },
    attemptsAllowed: { type: Number, default: 1 },
    showCorrectAnswers: { type: Boolean, default: false },
    randomizeQuestions: { type: Boolean, default: false },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

// Auto-calculate total points on save
examSchema.pre('save', function (next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  next();
});

export const Exam = mongoose.model('Exam', examSchema);
