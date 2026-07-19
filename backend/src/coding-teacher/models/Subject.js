import mongoose from 'mongoose';

const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    schoolYearId: { type: Schema.Types.ObjectId, ref: 'SchoolYear' },
    description: { type: String, default: '' },
    icon: { type: String, default: 'BookOpen' },
    color: { type: String, default: '#D4F542' },
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    curriculum: [
      {
        moduleId: String,
        title: String,
        description: String,
        order: Number,
        lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
        isPublished: { type: Boolean, default: false },
      },
    ],
    totalLessons: { type: Number, default: 0 },
    totalExercises: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.index({ name: 1, schoolId: 1 });

export const Subject = mongoose.model('Subject', subjectSchema);
