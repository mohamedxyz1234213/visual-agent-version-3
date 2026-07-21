import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../auth/middleware/auth.js';
import { Student, Teacher, Subject, CodingLesson, Exercise, Exam, Submission, StudentRegistrationRequest } from '../models/index.js';
import { calculateAge } from '../../utils/age.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// ── GET /api/v1/admin/dashboard-metrics ───────────────────────────────────────
router.get('/dashboard-metrics', async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalLessons,
      totalExercises,
      totalExams,
      totalSubmissions,
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      CodingLesson.countDocuments(),
      Exercise.countDocuments(),
      Exam.countDocuments(),
      Submission.countDocuments(),
    ]);

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalLessons,
        totalExercises,
        totalExams,
        totalSubmissions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Student Registration Approval ─────────────────────────────────────────────
// Students self-register (school email, parent phone, national ID, DOB) but the
// account only becomes usable once an admin reviews and approves it here. On
// approval, the student is NOT auto-assigned to any teacher — teachers add
// already-approved students to their own class by student code afterward.

router.get('/registration-requests', async (req, res, next) => {
  try {
    const { status = 'pending', search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { schoolEmail: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } },
      ];
    }

    const requests = await StudentRegistrationRequest.find(filter)
      .populate('schoolYearId', 'name grade')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      requests: requests.map((r) => ({
        id: r._id,
        fullName: r.fullName,
        username: r.username,
        schoolEmail: r.schoolEmail,
        parentPhone: r.parentPhone,
        nationalId: r.nationalId,
        dateOfBirth: r.dateOfBirth,
        age: calculateAge(r.dateOfBirth),
        matchedSchoolYear: r.schoolYearId,
        section: r.section,
        status: r.status,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/registration-requests/:id/approve', async (req, res, next) => {
  try {
    const request = await StudentRegistrationRequest.findOne({ _id: req.params.id, status: 'pending' });
    if (!request) return res.status(404).json({ error: 'Registration request not found or already reviewed' });

    const schoolYearId = req.body?.schoolYearId || request.schoolYearId;
    const section = req.body?.section || request.section || '';

    // Import User dynamically to avoid circular dependency
    const { User } = await import('../../auth/models/index.js');

    // Check for existing user BEFORE creating anything
    const existingUser = await User.findOne({ $or: [{ email: request.schoolEmail }, { username: request.username }] });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email or username already exists.' });
    }

    const user = await User.create({
      email: request.schoolEmail,
      username: request.username,
      passwordHash: request.passwordHash,
      role: 'student',
      status: 'active',
    });

    let student;
    try {
      student = await Student.create({
        userId: user._id,
        nationalId: request.nationalId,
        schoolEmail: request.schoolEmail,
        parentPhone: request.parentPhone,
        dateOfBirth: request.dateOfBirth,
        schoolYearId,
        section,
        teacherIds: [], // unassigned — a teacher must add them by student code
        status: 'active',
      });
    } catch (studentErr) {
      // Cleanup: delete the already-created user to avoid orphan records
      await User.findByIdAndDelete(user._id).catch(() => {});
      throw studentErr;
    }

    try {
      request.status = 'approved';
      request.reviewedBy = req.userId;
      request.reviewedAt = new Date();
      request.createdUserId = user._id;
      request.createdStudentId = student._id;
      await request.save();
    } catch (saveErr) {
      // Cleanup: delete both user and student to avoid orphan records
      await User.findByIdAndDelete(user._id).catch(() => {});
      await Student.findByIdAndDelete(student._id).catch(() => {});
      throw saveErr;
    }

    res.json({ ok: true, studentId: student._id, userId: user._id, studentCode: student.studentCode });
  } catch (err) {
    // If this is a known error (e.g., next is not a function from Mongoose hooks),
    // log it clearly so we can debug
    if (err && err.message && err.message.includes('next is not a function')) {
      console.error('[MONGOOSE HOOK ERROR] A Mongoose 9 pre-save hook is calling next() which is no longer supported. Check Student model pre-save hook.');
    }
    next(err);
  }
});

router.post('/registration-requests/:id/reject', async (req, res, next) => {
  try {
    const request = await StudentRegistrationRequest.findOne({ _id: req.params.id, status: 'pending' });
    if (!request) return res.status(404).json({ error: 'Registration request not found or already reviewed' });

    request.status = 'rejected';
    request.reviewedBy = req.userId;
    request.reviewedAt = new Date();
    request.rejectionReason = String(req.body?.reason || '').trim().slice(0, 500);
    await request.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── Content Management ────────────────────────────────────────────────────────
router.get('/subjects', async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    res.json({ subjects });
  } catch (err) {
    next(err);
  }
});

router.post('/subjects', async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json({ ok: true, subject });
  } catch (err) {
    next(err);
  }
});

router.get('/exams', async (req, res, next) => {
  try {
    const exams = await Exam.find()
      .sort({ createdAt: -1 })
      .populate('subjectId', 'name')
      .populate('teacherId', 'username email')
      .lean();
    res.json({ exams });
  } catch (err) {
    next(err);
  }
});

export default router;
