import mongoose from 'mongoose';

const { Schema } = mongoose;

const lessonPathSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    lessons: [
      {
        lessonId: { type: Schema.Types.ObjectId, ref: 'CodingLesson' },
        title: String,
        order: { type: Number, default: 0 },
        mandatory: { type: Boolean, default: true },
      },
    ],
    assignedStudentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    estimatedWeeks: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lessonPathSchema.index({ teacherId: 1, isActive: 1 });

export const LessonPath = mongoose.model('LessonPath', lessonPathSchema);
