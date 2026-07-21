import mongoose from 'mongoose';

const { Schema } = mongoose;

const aiConversationSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'expired'],
      default: 'active',
    },
    topic: { type: String, default: '' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    lessonId: { type: Schema.Types.ObjectId, ref: 'CodingLesson' },
    messages: [
      {
        id: String,
        role: { type: String, enum: ['system', 'user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now },
        audioUrl: String,
        audioDuration: Number,
        emotion: {
          type: String,
          enum: ['happy', 'thinking', 'explaining', 'celebrating', 'concerned', 'neutral'],
          default: 'neutral',
        },
        codeSnippet: {
          language: String,
          code: String,
        },
      },
    ],
    summary: { type: String, default: '' },
    satisfactionRating: { type: Number, min: 1, max: 5 },
    duration: { type: Number, default: 0 }, // seconds
    xpEarned: { type: Number, default: 0 },
    conceptsCovered: [String],
  },
  { timestamps: true }
);

aiConversationSchema.index({ studentId: 1, createdAt: -1 });

export const AIConversation = mongoose.model('AIConversation', aiConversationSchema);
