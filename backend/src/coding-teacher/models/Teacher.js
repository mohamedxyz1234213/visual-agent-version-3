import mongoose from 'mongoose';

const { Schema } = mongoose;

const teacherSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    schoolYears: [{ type: Schema.Types.ObjectId, ref: 'SchoolYear' }],
    sections: [String],
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    bio: { type: String, default: '' },
    qualifications: [String],
    specialization: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model('Teacher', teacherSchema);
