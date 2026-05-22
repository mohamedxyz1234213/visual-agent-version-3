import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── QuizQuestion ──────────────────────────────────────────────────────────────
const quizQuestionSchema = new Schema({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  orderIndex: { type: Number, required: true },
  questionType: {
    type: String,
    enum: ['mcq', 'fill_blank', 'short_answer', 'graph_interpretation'],
    required: true,
  },
  questionText: { type: String, required: true },
  options: { type: Schema.Types.Mixed }, // { choices: [...], correct: '...' }
  correctAnswer: { type: String },
  explanation: { type: String },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
});

// ── Quiz ──────────────────────────────────────────────────────────────────────
const quizSchema = new Schema({
  partId: { type: Schema.Types.ObjectId, ref: 'LessonPart', required: true, unique: true, index: true },
});

// ── QuizAttempt ───────────────────────────────────────────────────────────────
const quizAttemptSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    sessionId: { type: String },
    answers: { type: Schema.Types.Mixed, required: true }, // { "<questionId>": "<userAnswer>" }
    score: { type: Number },
    feedback: { type: Schema.Types.Mixed }, // { "<questionId>": { correct, explanation } }
    passed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Quiz = mongoose.model('Quiz', quizSchema);
export const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
