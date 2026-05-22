import mongoose from 'mongoose';

const { Schema } = mongoose;

// Tracks a multi-lesson course generated from a single document upload.
const lessonSeriesSchema = new Schema(
  {
    userInstructions: { type: String },       // what the user typed before upload
    analysisModel: { type: String, default: 'qwen3.6-plus-thinking' },
    sourceFilename: { type: String, required: true },
    totalLessons: { type: Number, required: true },
    completedLessons: { type: Number, default: 0 },
    // Remaining lesson specs stored so background jobs can process them
    remainingSpecs: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
);

export const LessonSeries = mongoose.model('LessonSeries', lessonSeriesSchema);
