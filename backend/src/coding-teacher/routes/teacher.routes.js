import { Router } from 'express';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Teacher, Student, Lesson, Exercise, Exam, Submission, Subject, Progress } from '../models/index.js';
import { User } from '../../auth/models/index.js';

const router = Router();

router.use(requireAuth);

// ── GET /api/v1/teacher/dashboard ─────────────────────────────────────────────
router.get('/dashboard', requireRole('teacher'), async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.userId }).lean();
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const [studentCount, lessonCount, pendingSubmissions, examCount] = await Promise.all([
      Student.countDocuments({ teacherIds: req.userId, status: 'active' }),
      Lesson.countDocuments({ teacherId: req.userId }),
      Submission.countDocuments({ status: 'pending' }).limit(10),
      Exam.countDocuments({ teacherId: req.userId }),
    ]);

    // Average class score
    const avgProgress = await Progress.aggregate([
      { $match: { studentId: { $in: teacher.students } } },
      { $group: { _id: null, avgCompletion: { $avg: '$overallCompletion' } } },
    ]);

    const recentLessons = await Lesson.find({ teacherId: req.userId })
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

    const lessons = await Lesson.find(filter)
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
    const lesson = await Lesson.findOne({ _id: req.params.id, teacherId: req.userId }).lean();
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

    const lesson = await Lesson.create({
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
    const lesson = await Lesson.findOneAndUpdate(
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
    const result = await Lesson.findOneAndDelete({ _id: req.params.id, teacherId: req.userId });
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

export default router;
