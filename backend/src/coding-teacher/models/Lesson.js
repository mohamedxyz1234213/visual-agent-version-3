import mongoose from 'mongoose';

const { Schema } = mongoose;

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    moduleId: { type: String, default: '' },
    order: { type: Number, default: 0 },
    content: { type: String, default: '' }, // rich text / markdown
    videoUrl: { type: String, default: '' },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    duration: { type: Number, default: 30 }, // estimated minutes
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    tags: [String],
    codeSnippets: [
      {
        language: String,
        code: String,
        explanation: String,
      },
    ],
    hasAvatarVersion: { type: Boolean, default: false },
    avatarLessonId: { type: Schema.Types.ObjectId, ref: 'AvatarLesson' },
    isPublished: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    totalExercises: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

lessonSchema.index({ subjectId: 1, order: 1 });
lessonSchema.index({ teacherId: 1, isPublished: 1 });

export const Lesson = mongoose.model('Lesson', lessonSchema);
