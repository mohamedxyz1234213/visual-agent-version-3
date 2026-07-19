import { Router } from 'express';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  Teacher,
  Student,
  CodingLesson,
  Exercise,
  Exam,
  Submission,
  Subject,
  Progress,
  WeeklyChallenge,
} from '../models/index.js';
import { User } from '../../auth/models/index.js';

const router = Router();

router.use(requireAuth);

// ── GET /api/v1/teacher/dashboard ─────────────────────────────────────────────
router.get('/dashboard', requireRole('teacher'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.userId }).lean();
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const [studentCount, lessonCount, pendingSubmissions, examCount, myStudentIds] = await Promise.all([
      Student.countDocuments({ teacherIds: req.userId, status: 'active' }),
      CodingLesson.countDocuments({ teacherId: req.userId }),
      Submission.countDocuments({ status: 'pending' }).limit(10),
      Exam.countDocuments({ teacherId: req.userId }),
      Student.find({ teacherIds: req.userId, status: 'active' }).distinct('_id'),
    ]);

    // Average class score \u2014 computed from the live teacherIds assignment,
    // not the (potentially stale) Teacher.students array.
    const avgProgress = await Progress.aggregate([
      { $match: { studentId: { $in: myStudentIds } } },
      { $group: { _id: null, avgCompletion: { $avg: '$overallCompletion' } } },
    ]);

    const recentLessons = await CodingLesson.find({ teacherId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status isPublished createdAt totalStudents averageScore')
      .lean();

    res.json({
      stats: {
        totalStudents: studentCount,
        totalLessons: lessonCount,
        pendingSubmissions: pendingSubmissions.length,
        totalExams: examCount,
        avgClassScore: avgProgress[0]?.avgCompletion || 0,
      },
      recentLessons,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/teacher/classes ───────────────────────────────────────────────
router.get('/classes', requireRole('teacher'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.userId }).lean();
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const students = await Student.find({ teacherIds: req.userId, status: 'active' })
      .populate('userId', 'username email')
      .populate('schoolYearId', 'name grade')
      .lean();

    // Group by school year
    const classes = {};
    students.forEach((s) => {
      const yearName = s.schoolYearId?.name || 'Unassigned';
      if (!classes[yearName]) classes[yearName] = [];
      classes[yearName].push({
        id: s._id,
        studentCode: s.studentCode,
        username: s.userId?.username,
        email: s.userId?.email,
        section: s.section,
        xp: s.xp,
        level: s.level,
        streak: s.streak,
        averageScore: s.averageScore,
        totalLessonsCompleted: s.totalLessonsCompleted,
        lastActivityDate: s.lastActivityDate,
      });
    });

    res.json({ classes });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/teacher/students/:id/progress ─────────────────────────────────
router.get('/students/:id/progress', requireRole('teacher'), async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'username email')
      .lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const progress = await Progress.find({ studentId: student._id })
      .populate('subjectId', 'name color')
      .lean();

    const recentSubmissions = await Submission.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('exerciseId', 'title difficulty')
      .lean();

    res.json({ student, progress, recentSubmissions });
  } catch (err) {
    next(err);
  }
});

// ── CRUD Lessons ──────────────────────────────────────────────────────────────
router.get('/lessons', requireRole('teacher'), async (req, res, next) => {
  try {
    const { status, subjectId } = req.query;
    const filter = { teacherId: req.userId };
    if (status) filter.isPublished = status === 'published';
    if (subjectId) filter.subjectId = subjectId;

    const lessons = await CodingLesson.find(filter)
      .sort({ createdAt: -1 })
      .populate('subjectId', 'name color')
      .lean();

    res.json({ lessons });
  } catch (err) {
    next(err);
  }
});

router.get('/lessons/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const lesson = await CodingLesson.findOne({ _id: req.params.id, teacherId: req.userId }).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ lesson });
  } catch (err) {
    next(err);
  }
});

router.post('/lessons', requireRole('teacher'), async (req, res, next) => {
  try {
    const { title, subjectId, content, difficulty, duration, tags, codeSnippets, order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const lesson = await CodingLesson.create({
      title,
      subjectId,
      teacherId: req.userId,
      content: content || '',
      difficulty: difficulty || 'beginner',
      duration: duration || 30,
      tags: tags || [],
      codeSnippets: codeSnippets || [],
      order: order || 0,
    });

    res.status(201).json({ ok: true, lesson });
  } catch (err) {
    next(err);
  }
});

router.put('/lessons/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const lesson = await CodingLesson.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ ok: true, lesson });
  } catch (err) {
    next(err);
  }
});

router.delete('/lessons/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const result = await CodingLesson.findOneAndDelete({ _id: req.params.id, teacherId: req.userId });
    if (!result) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── CRUD Exercises ────────────────────────────────────────────────────────────
router.get('/exercises', requireRole('teacher'), async (req, res, next) => {
  try {
    const exercises = await Exercise.find({ teacherId: req.userId })
      .sort({ createdAt: -1 })
      .populate('subjectId', 'name')
      .lean();
    res.json({ exercises });
  } catch (err) {
    next(err);
  }
});

router.post('/exercises', requireRole('teacher'), async (req, res, next) => {
  try {
    const exercise = await Exercise.create({
      ...req.body,
      teacherId: req.userId,
    });
    res.status(201).json({ ok: true, exercise });
  } catch (err) {
    next(err);
  }
});

router.put('/exercises/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const exercise = await Exercise.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });
    res.json({ ok: true, exercise });
  } catch (err) {
    next(err);
  }
});

// ── CRUD Exams ────────────────────────────────────────────────────────────────
router.get('/exams', requireRole('teacher'), async (req, res, next) => {
  try {
    const exams = await Exam.find({ teacherId: req.userId })
      .sort({ createdAt: -1 })
      .populate('subjectId', 'name')
      .lean();
    res.json({ exams });
  } catch (err) {
    next(err);
  }
});

router.post('/exams', requireRole('teacher'), async (req, res, next) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      teacherId: req.userId,
    });
    res.status(201).json({ ok: true, exam });
  } catch (err) {
    next(err);
  }
});

router.put('/exams/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const exam = await Exam.findOneAndUpdate(
      { _id: req.params.id, teacherId: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json({ ok: true, exam });
  } catch (err) {
    next(err);
  }
});

// ── Submissions & Grading ─────────────────────────────────────────────────────
router.get('/submissions', requireRole('teacher'), async (req, res, next) => {
  try {
    const { exerciseId, studentId, status } = req.query;
    const filter = {};
    if (exerciseId) filter.exerciseId = exerciseId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    const submissions = await Submission.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('studentId', 'studentCode')
      .populate('exerciseId', 'title difficulty')
      .lean();

    res.json({ submissions });
  } catch (err) {
    next(err);
  }
});

router.put('/submissions/:id/feedback', requireRole('teacher'), async (req, res, next) => {
  try {
    const { teacherFeedback, score } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { $set: { teacherFeedback, score } },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json({ ok: true, submission });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/teacher/analytics/:classId ────────────────────────────────────
router.get('/analytics/:classId', requireRole('teacher'), async (req, res, next) => {
  try {
    const students = await Student.find({ schoolYearId: req.params.classId, status: 'active' })
      .populate('userId', 'username')
      .lean();

    const studentIds = students.map((s) => s._id);

    const progress = await Progress.find({ studentId: { $in: studentIds } }).lean();
    const submissions = await Submission.find({ studentId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    // Calculate averages
    const avgCompletion = progress.reduce((sum, p) => sum + p.overallCompletion, 0) / (progress.length || 1);
    const avgScore = submissions.reduce((sum, s) => sum + s.score, 0) / (submissions.length || 1);

    res.json({
      studentCount: students.length,
      avgCompletion: Math.round(avgCompletion),
      avgScore: Math.round(avgScore),
      students: students.map((s) => ({
        id: s._id,
        username: s.userId?.username,
        xp: s.xp,
        level: s.level,
        averageScore: s.averageScore,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── Add Students to Class ─────────────────────────────────────────────────────
// Student accounts are only created after admin approval (see
// admin.routes.js#/registration-requests). A teacher never approves accounts —
// they search for an already-approved, active student by their student code
// and add them to their own class. A student can belong to more than one
// teacher's class at once (Student.teacherIds is an array).

// GET /api/v1/teacher/students/search?code=STU-2026-0001
router.get('/students/search', requireRole('teacher'), async (req, res, next) => {
  try {
    const code = String(req.query?.code || '').trim();
    if (!code) return res.status(400).json({ error: 'Student code is required.' });

    const student = await Student.findOne({ studentCode: code, status: 'active' })
      .populate('userId', 'username email')
      .populate('schoolYearId', 'name grade')
      .lean();

    if (!student) return res.status(404).json({ error: 'No active student found with that code.' });

    res.json({
      student: {
        id: student._id,
        studentCode: student.studentCode,
        username: student.userId?.username,
        email: student.userId?.email,
        schoolYear: student.schoolYearId,
        section: student.section,
        alreadyAssigned: (student.teacherIds || []).some((id) => id.toString() === req.userId),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/teacher/students/add — add an already-approved student to this
// teacher's class by student code.
router.post('/students/add', requireRole('teacher'), async (req, res, next) => {
  try {
    const code = String(req.body?.studentCode || '').trim();
    if (!code) return res.status(400).json({ error: 'Student code is required.' });

    const teacher = await Teacher.findOne({ userId: req.userId });
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const student = await Student.findOne({ studentCode: code, status: 'active' });
    if (!student) return res.status(404).json({ error: 'No active student found with that code.' });

    if ((student.teacherIds || []).some((id) => id.toString() === req.userId)) {
      return res.status(400).json({ error: 'This student is already in your class.' });
    }

    student.teacherIds = [...(student.teacherIds || []), req.userId];
    await student.save();

    teacher.students = teacher.students || [];
    if (!teacher.students.some((id) => id.toString() === student._id.toString())) {
      teacher.students.push(student._id);
      await teacher.save();
    }

    res.json({ ok: true, studentId: student._id });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/teacher/students/:id — remove a student from this teacher's
// class only (does not affect the student's other teacher assignments).
router.delete('/students/:id', requireRole('teacher'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, teacherIds: req.userId });
    if (!student) return res.status(404).json({ error: 'Student not found in your class.' });

    student.teacherIds = (student.teacherIds || []).filter((id) => id.toString() !== req.userId);
    await student.save();

    await Teacher.updateOne({ userId: req.userId }, { $pull: { students: student._id } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── Teacher-Assigned Challenges ───────────────────────────────────────────────
// GET /api/v1/teacher/challenges — challenges this teacher created.
router.get('/challenges', requireRole('teacher'), async (req, res, next) => {
  try {
    const challenges = await WeeklyChallenge.find({ assignedBy: req.userId })
      .populate('exerciseId', 'title difficulty')
      .populate('assignedTo', 'studentCode')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ challenges });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/teacher/challenges — create a challenge scoped to this teacher's
// assigned students. If `studentIds` is omitted/empty, it applies to every
// student currently assigned to this teacher.
router.post('/challenges', requireRole('teacher'), async (req, res, next) => {
  try {
    const { title, description, exerciseId, rules, startDate, endDate, rewards, studentIds } = req.body;
    if (!title || !exerciseId || !startDate || !endDate) {
      return res.status(400).json({ error: 'Title, exerciseId, startDate, and endDate are required.' });
    }

    let assignedTo = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const owned = await Student.find({ _id: { $in: studentIds }, teacherIds: req.userId }).select('_id').lean();
      assignedTo = owned.map((s) => s._id);
      if (assignedTo.length !== studentIds.length) {
        return res.status(403).json({ error: 'You can only assign challenges to your own students.' });
      }
    }

    const challenge = await WeeklyChallenge.create({
      title,
      description: description || '',
      exerciseId,
      rules: rules || '',
      startDate,
      endDate,
      rewards: rewards || undefined,
      assignedBy: req.userId,
      assignedTo,
      createdBy: req.userId,
      isActive: true,
    });

    res.status(201).json({ ok: true, challenge });
  } catch (err) {
    next(err);
  }
});

export default router;
