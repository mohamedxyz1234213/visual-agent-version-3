import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── StudentRegistrationRequest ────────────────────────────────────────────────
// A prospective student submits this form themselves (public, no auth). It sits
// in a pending queue until a teacher — matched by age/school-year — reviews and
// either approves (which provisions the User + Student accounts) or rejects it.
const studentRegistrationRequestSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    schoolEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    parentPhone: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },

    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    schoolYearId: { type: Schema.Types.ObjectId, ref: 'SchoolYear' },
    section: { type: String, default: '' },

    // Password is hashed immediately on submit — never stored in plain text,
    // and never exposed by any read endpoint.
    passwordHash: { type: String, required: true },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // the approving/rejecting teacher
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
    createdUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdStudentId: { type: Schema.Types.ObjectId, ref: 'Student' },

    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

studentRegistrationRequestSchema.index({ nationalId: 1, status: 1 });

export const StudentRegistrationRequest = mongoose.model(
  'StudentRegistrationRequest',
  studentRegistrationRequestSchema
);
