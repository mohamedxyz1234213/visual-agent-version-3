import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── AiRequestLog ──────────────────────────────────────────────────────────────
// Records every AI generation request (upload, explain, retry)
const aiRequestLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userEmail: { type: String, lowercase: true, trim: true, index: true },
    username: { type: String, trim: true },

    type: { type: String, enum: ['upload', 'explain'], required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', index: true },
    seriesId: { type: Schema.Types.ObjectId, ref: 'LessonSeries' },

    provider: { type: String },
    model: { type: String },
    sourceFilename: { type: String },

    status: { type: String, enum: ['started', 'completed', 'failed'], default: 'started', index: true },
    errorMessage: { type: String },

    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const AiRequestLog = mongoose.model('AiRequestLog', aiRequestLogSchema);
