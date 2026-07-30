import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── StoryboardScene ───────────────────────────────────────────────────────────
const storyboardSceneSchema = new Schema({
  partId: { type: Schema.Types.ObjectId, ref: 'LessonPart', required: true, index: true },
  timeOffset: { type: Number, default: 0 },
  actionType: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
});

// ── LessonPart ────────────────────────────────────────────────────────────────
const lessonPartSchema = new Schema({
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
  orderIndex: { type: Number, required: true },
  title: { type: String, required: true },
  narration: { type: String },
  durationSeconds: { type: Number, default: 120 },
  audioUrl: { type: String },
  partType: { type: String, enum: ['content', 'quiz', 'final_quiz', 'exercise'], default: 'content' },
});

// ── Lesson ────────────────────────────────────────────────────────────────────
const lessonSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: String },
    sourceFilename: { type: String, required: true },
    sourceFileUrl: { type: String },
    rawText: { type: String },
    summary: { type: String },
    status: { type: String, enum: ['processing', 'ready', 'error'], default: 'processing' },
    processingStep: { type: String, default: 'queued' },
    errorMessage: { type: String },
    // ── AI provider + model chosen by user ───────────────────────────────────
    aiProvider: { type: String, enum: ['openrouter', 'blaze', 'blazeapi', 'fastapi', 'template'], default: 'openrouter' },
    analysisModel: { type: String },
    // ── Series fields ────────────────────────────────────────────────────────
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'LessonSeries' },
    lessonIndex: { type: Number, default: 0 },   // 0-based position in series
    totalLessons: { type: Number, default: 1 },
    // ── Owner (multi-tenant) ────────────────────────────────────────────────
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

export const Lesson = mongoose.model('Lesson', lessonSchema);
export const LessonPart = mongoose.model('LessonPart', lessonPartSchema);
export const StoryboardScene = mongoose.model('StoryboardScene', storyboardSceneSchema);
