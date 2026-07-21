import mongoose from 'mongoose';

const { Schema } = mongoose;

// ── SchoolYear ────────────────────────────────────────────────────────────────
// A grade/class grouping (e.g. "Grade 7"). `minAge`/`maxAge` let the teacher
// registration-approval flow auto-suggest the right year for a given student
// date-of-birth, since this platform's single subject (programming) is taught
// across an age-appropriate curriculum.
const schoolYearSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    name: { type: String, required: true, trim: true },
    grade: { type: Number },
    minAge: { type: Number, default: 0 },
    maxAge: { type: Number, default: 99 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SchoolYear = mongoose.model('SchoolYear', schoolYearSchema);
