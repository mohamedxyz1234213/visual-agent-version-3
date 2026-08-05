import { Router } from 'express';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { callAIRace } from '../../services/aiPlanner.js';
import { getOpenRouterConfig, OPENROUTER_DEFAULT_MODEL, resolveOpenRouterModel } from '../../services/openrouterConfig.js';
import { Student, Progress, Submission, Exercise, CodingLesson, Achievement, AIConversation, Notification, ExerciseBlock, Exam, LessonPath } from '../models/index.js';
import { executeCode, calculateScore, determineStatus } from '../services/code-execution/sandbox.service.js';
import { User } from '../../auth/models/index.js';

const router = Router();
const publicRouter = Router();

// ── Public search endpoint (no auth required) ──────────────────────────────────
// Public search for students/parents by phone, nationalId, or studentCode
// Returns complete student insights for the dashboard view
publicRouter.get('/search', async (req, res, next) => {
  try {
    const { q, type } = req.query;
    if (!q || !type) {
      return res.status(400).json({ error: 'Search query (q) and type (phone|nationalId|code) are required' });
    }

    let filter = {};
    const query = String(q).trim();

    if (type === 'phone') {
      filter = { parentPhone: query, status: 'active' };
    } else if (type === 'nationalId') {
      if (!/^\d{14}$/.test(query)) {
        return res.status(400).json({ error: 'National ID must be exactly 14 digits' });
      }
      filter = { nationalId: query, status: 'active' };
    } else if (type === 'code') {
      filter = { studentCode: query.toUpperCase(), status: 'active' };
    } else {
      return res.status(400).json({ error: 'Invalid search type. Use: phone, nationalId, or code' });
    }

    const student = await Student.findOne(filter)
      .populate('userId', 'username email')
      .populate('schoolYearId', 'name grade')
      .lean();

    if (!student) {
      return res.status(404).json({ error: 'No active student found with those details' });
    }

    // Full insights
    const [progress, submissions, achievements] = await Promise.all([
      Progress.find({ studentId: student._id })
        .populate('subjectId', 'name color')
        .lean(),
      Submission.find({ studentId: student._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('exerciseId', 'title difficulty type')
        .lean(),
      Achievement.find({ studentId: student._id })
        .sort({ unlockedAt: -1 })
        .lean(),
    ]);

    // Calculate stats
    const passedSubmissions = submissions.filter((s) => s.status === 'passed');
    const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgScore = submissions.length > 0 ? Math.round(totalScore / submissions.length) : 0;

    // Weekly activity
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyActivity = await Submission.aggregate([
      { $match: { studentId: student._id, createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
    ]);

    const countMap = {};
    weeklyActivity.forEach((d) => { countMap[d._id] = d.count; });
    const dailyActivity = [];
    for (let i = 0; i < 7; i++) {
      const mongoDay = ((i + 1) % 7) + 1;
      dailyActivity.push({ day: i, count: countMap[mongoDay] || 0 });
    }

    // Subject progress breakdown
    const subjectProgress = progress.map((p) => ({
      subjectId: p.subjectId,
      completion: p.overallCompletion || 0,
      timeSpent: p.timeSpent || 0,
      exercisesCompleted: p.exercisesCompleted || 0,
    }));

    // Last 7 days scores for mini chart
    const recentScores = submissions.slice(0, 7).map((s) => ({
      date: s.createdAt,
      score: s.score,
      title: s.exerciseId?.title || 'Exercise',
      status: s.status,
    }));

    // Consistency score
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaySubmissions = await Submission.find({
      studentId: student._id,
      createdAt: { $gte: thirtyDaysAgo },
    }).lean();
    const uniqueDays = new Set(thirtyDaySubmissions.map((s) => new Date(s.createdAt).toDateString()));
    const consistencyScore = Math.round((uniqueDays.size / 30) * 100);

    // Strengths & weaknesses from submissions
    const subjectScores = {};
    submissions.forEach((s) => {
      const name = s.exerciseId?.title || 'General';
      if (!subjectScores[name]) subjectScores[name] = { total: 0, count: 0 };
      subjectScores[name].total += s.score || 0;
      subjectScores[name].count += 1;
    });

    const topicStrengths = [];
    const topicWeaknesses = [];
    Object.entries(subjectScores).forEach(([name, data]) => {
      const avg = Math.round(data.total / data.count);
      if (avg >= 70) topicStrengths.push({ topic: name, score: avg });
      else topicWeaknesses.push({ topic: name, score: avg });
    });

    res.json({
      student: {
        code: student.studentCode,
        username: student.userId?.username || 'Unknown',
        email: student.userId?.email || '',
        parentPhone: student.parentPhone,
        schoolYear: student.schoolYearId,
        section: student.section,
        dateOfBirth: student.dateOfBirth,
        createdAt: student.createdAt,
      },
      stats: {
        xp: student.xp,
        level: student.level,
        streak: student.streak,
        longestStreak: student.longestStreak,
        coins: student.coins,
        totalLessonsCompleted: student.totalLessonsCompleted,
        totalExercisesCompleted: student.totalExercisesCompleted,
        averageScore: avgScore,
        totalTimeSpent: student.totalTimeSpent,
        consistencyScore,
        passedSubmissions: passedSubmissions.length,
        totalSubmissions: submissions.length,
        weeklyXP: student.weeklyXP || 0,
      },
      progress: subjectProgress,
      achievements,
      recentSubmissions: submissions.slice(0, 10),
      recentScores,
      weeklyActivity: dailyActivity,
      strengths: topicStrengths.slice(0, 5),
      weaknesses: topicWeaknesses.slice(0, 5),
    });
  } catch (err) {
    next(err);
  }
});

// All student routes require auth + student role
router.use(requireAuth);

// ── Helper: resolve student by studentCode or auth ────────────────────────────
async function resolveStudent(req, studentCode) {
  if (studentCode) {
    const student = await Student.findOne({ studentCode: String(studentCode).toUpperCase(), status: 'active' });
    if (!student) throw new Error('Student not found with that code');
    return student;
  }
  const student = await Student.findOne({ userId: req.userId });
  if (!student) throw new Error('Student profile not found');
  return student;
}

// ── POST /api/v1/student/identify ─────────────────────────────────────────────
// Identify a student by their studentCode (used before exercises/exams)
router.post('/identify', async (req, res, next) => {
  try {
    const { studentCode } = req.body;
    if (!studentCode) return res.status(400).json({ error: 'Student code is required' });

    const student = await Student.findOne({ studentCode: String(studentCode).toUpperCase(), status: 'active' })
      .populate('userId', 'username email')
      .populate('schoolYearId', 'name grade')
      .lean();

    if (!student) return res.status(404).json({ error: 'No active student found with that code' });

    res.json({
      ok: true,
      student: {
        id: student._id,
        code: student.studentCode,
        username: student.userId?.username || 'Unknown',
        email: student.userId?.email || '',
        schoolYear: student.schoolYearId,
        section: student.section,
        level: student.level,
        xp: student.xp,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/dashboard ─────────────────────────────────────────────
router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    let student = await Student.findOne({ userId: req.userId });
    if (!student) {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      student = await Student.create({ userId: user._id, status: 'active' });
    }
    // Ensure studentCode exists (may be missing for legacy students)
    if (!student.studentCode) {
      student.studentCode = undefined; // triggers pre('save') hook to generate
      await student.save();
    }
    const studentLean = student.toObject();

    const progress = await Progress.find({ studentId: student._id }).lean();
    const recentSubmissions = await Submission.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const unreadNotifications = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });
    const recentAchievements = await Achievement.find({ studentId: student._id })
      .sort({ unlockedAt: -1 })
      .limit(5)
      .lean();

    // Weekly activity — lessons completed per day of week
    const weeklyActivity = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dailyCounts = await Submission.aggregate([
      {
        $match: {
          studentId: student._id,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          count: { $sum: 1 },
        },
      },
    ]);
    const countMap = {};
    dailyCounts.forEach((d) => { countMap[d._id] = d.count; });
    // Normalize MongoDB dayOfWeek (1=Sun..7=Sat) to 0=Mon..6=Sun
    for (let i = 0; i < 7; i++) {
      const mongoDay = ((i + 1) % 7) + 1; // Mon=2, Tue=3, ..., Sun=1
      weeklyActivity.push({ day: i, count: countMap[mongoDay] || 0 });
    }

    res.json({
      student: {
        id: studentLean._id,
        studentCode: studentLean.studentCode,
        xp: studentLean.xp,
        level: studentLean.level,
        streak: studentLean.streak,
        coins: studentLean.coins,
        totalLessonsCompleted: studentLean.totalLessonsCompleted,
        totalExercisesCompleted: studentLean.totalExercisesCompleted,
        averageScore: studentLean.averageScore,
        totalTimeSpent: studentLean.totalTimeSpent,
      },
      progress: progress.map((p) => ({
        subjectId: p.subjectId,
        completion: p.overallCompletion,
        timeSpent: p.timeSpent,
      })),
      recentSubmissions,
      unreadNotifications,
      recentAchievements,
      weeklyActivity,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/lessons ───────────────────────────────────────────────
router.get('/lessons', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const { subjectId, difficulty } = req.query;
    const filter = { isPublished: true };
    if (subjectId) filter.subjectId = subjectId;
    if (difficulty) filter.difficulty = difficulty;

    const lessons = await CodingLesson.find(filter)
      .sort({ order: 1 })
      .select('title subjectId duration difficulty tags totalExercises isPublished order avatarLessonId')
      .lean();

    res.json({ lessons });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/lessons/:id ───────────────────────────────────────────
router.get('/lessons/:id', requireRole('student'), async (req, res, next) => {
  try {
    const lesson = await CodingLesson.findById(req.params.id).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Increment view count
    await CodingLesson.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({ lesson });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/student/lessons/:id/complete ─────────────────────────────────
router.post('/lessons/:id/complete', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const lesson = await CodingLesson.findById(req.params.id).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Add XP
    const xpResult = student.addXP(50);
    await student.save();

    // Update progress
    await Progress.findOneAndUpdate(
      { studentId: student._id, subjectId: lesson.subjectId },
      {
        $push: {
          lessonCompletions: {
            lessonId: lesson._id,
            completedAt: new Date(),
            score: 100,
            timeSpent: req.body.timeSpent || 0,
          },
        },
        $inc: { timeSpent: (req.body.timeSpent || 0) / 60 },
        lastUpdated: new Date(),
      },
      { upsert: true }
    );

    // Update student stats
    await Student.findByIdAndUpdate(student._id, {
      $inc: { totalLessonsCompleted: 1, totalTimeSpent: (req.body.timeSpent || 0) / 60 },
      lastActivityDate: new Date(),
    });

    // Check for first-lesson achievement
    const existingAchievement = await Achievement.findOne({
      studentId: student._id,
      type: 'first-lesson',
    });
    if (!existingAchievement) {
      await Achievement.create({
        studentId: student._id,
        type: 'first-lesson',
        title: 'First Lesson',
        description: 'Completed your first lesson',
        icon: 'BookOpen',
        xpBonus: 25,
        coinBonus: 10,
      });
    }

    res.json({
      ok: true,
      xpEarned: 50,
      leveledUp: xpResult.leveledUp,
      newLevel: xpResult.newLevel,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/exercises ─────────────────────────────────────────────
router.get('/exercises', requireRole('student'), async (req, res, next) => {
  try {
    const { subjectId, difficulty, type } = req.query;
    const filter = { isPublished: true };
    if (subjectId) filter.subjectId = subjectId;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    const exercises = await Exercise.find(filter)
      .sort({ createdAt: -1 })
      .select('title type difficulty xpReward coinReward estimatedTime tags totalAttempts successRate')
      .lean();

    res.json({ exercises });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/exercises/:id ─────────────────────────────────────────
router.get('/exercises/:id', requireRole('student'), async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id).lean();
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    // Don't send solution to student
    const { solution, solutionExplanation, ...safeExercise } = exercise;
    res.json({ exercise: safeExercise });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/lessons/:id/exercises ─────────────────────────────────
// Get exercise blocks for a specific lesson
router.get('/lessons/:id/exercises', requireRole('student'), async (req, res, next) => {
  try {
    const blocks = await ExerciseBlock.find({ lessonId: req.params.id })
      .sort({ order: 1 })
      .select('-solution')  // Don't send solutions to students
      .lean();
    res.json({ blocks });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/student/lessons/:id/lesson-exercises/:blockId/submit ─────────
// Submit a solution to an exercise block within a lesson
router.post('/lessons/:id/lesson-exercises/:blockId/submit', requireRole('student'), async (req, res, next) => {
  try {
    const student = await resolveStudent(req, req.body.studentCode);
    const block = await ExerciseBlock.findById(req.params.blockId).lean();
    if (!block) return res.status(404).json({ error: 'Exercise block not found' });

    const { code, language, timeSpent } = req.body;
    const lang = language || block.language || 'javascript';

    // Real code execution via sandbox
    const results = await executeCode(code, lang, block.testCases || []);

    const passedCount = results.filter((r) => r.passed).length;
    const allPassed = passedCount === results.length;
    const score = calculateScore(results);
    const status = determineStatus(results);

    const submission = await Submission.create({
      studentId: student._id,
      exerciseId: block._id,
      code,
      language: lang,
      status,
      results,
      score,
      maxScore: 100,
      timeSpent: timeSpent || 0,
      attemptNumber: 1,
    });

    // Award XP
    let xpReward = 0;
    if (allPassed) {
      xpReward = block.xpReward || 10;
      student.addXP(xpReward);
      await student.save();
    }

    res.json({
      ok: true,
      submission: { id: submission._id, status: submission.status, score },
      xpEarned: xpReward,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/student/exercises/:id/submit ─────────────────────────────────
router.post('/exercises/:id/submit', requireRole('student'), async (req, res, next) => {
  try {
    const student = await resolveStudent(req, req.body.studentCode);
    const exercise = await Exercise.findById(req.params.id).lean();
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    const { code, language, timeSpent } = req.body;
    const lang = language || 'javascript';

    // Real code execution via sandbox
    const results = await executeCode(code, lang, exercise.testCases || []);

    const passedCount = results.filter((r) => r.passed).length;
    const allPassed = passedCount === results.length;
    const score = calculateScore(results);
    const status = determineStatus(results);

    const submission = await Submission.create({
      studentId: student._id,
      exerciseId: exercise._id,
      code,
      language: lang,
      status,
      results,
      score,
      maxScore: 100,
      timeSpent: timeSpent || 0,
      attemptNumber: 1,
    });

    // Award XP
    let xpReward = 0;
    if (allPassed) {
      xpReward = exercise.xpReward || 10;
      if (exercise.difficulty === 'medium') xpReward = Math.round(xpReward * 2.5);
      if (exercise.difficulty === 'hard') xpReward = Math.round(xpReward * 5);
      student.addXP(xpReward);
      student.coins += exercise.coinReward || 5;
    }
    student.lastActivityDate = new Date();
    student.totalExercisesCompleted += 1;
    await student.save();

    // Update exercise stats
    await Exercise.findByIdAndUpdate(exercise._id, {
      $inc: { totalAttempts: 1, totalPasses: allPassed ? 1 : 0 },
    });

    res.json({
      ok: true,
      submission: {
        id: submission._id,
        status: submission.status,
        score,
        results,
      },
      xpEarned: xpReward,
      leveledUp: false,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/submissions ───────────────────────────────────────────
router.get('/submissions', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const submissions = await Submission.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('exerciseId', 'title difficulty')
      .lean();

    res.json({ submissions });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/progress ──────────────────────────────────────────────
router.get('/progress', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const progress = await Progress.find({ studentId: student._id })
      .populate('subjectId', 'name color icon')
      .lean();

    res.json({ progress });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/achievements ──────────────────────────────────────────
router.get('/achievements', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const achievements = await Achievement.find({ studentId: student._id })
      .sort({ unlockedAt: -1 })
      .lean();

    res.json({ achievements });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/leaderboard ───────────────────────────────────────────
router.get('/leaderboard', requireRole('student'), async (req, res, next) => {
  try {
    const { type = 'xp', limit = 50 } = req.query;
    const sortField = type === 'xp' ? 'xp' : type === 'streak' ? 'streak' : 'xp';

    const leaders = await Student.find({ status: 'active' })
      .sort({ [sortField]: -1 })
      .limit(Math.min(parseInt(limit) || 50, 100))
      .populate('userId', 'username')
      .lean();

    const currentStudent = await Student.findOne({ userId: req.userId }).lean();
    const rank = currentStudent
      ? await Student.countDocuments({ [sortField]: { $gt: currentStudent[sortField] }, status: 'active' }) + 1
      : null;

    res.json({
      leaderboard: leaders.map((s, i) => ({
        rank: i + 1,
        username: s.userId?.username || 'Unknown',
        xp: s.xp,
        level: s.level,
        streak: s.streak,
      })),
      myRank: rank,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/notifications ─────────────────────────────────────────
// Note: uses requireAuth only (not requireRole('student')) so that teachers
// can also read their own notifications via this route.
router.get('/notifications', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      isRead: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/v1/student/notifications/:id/read ────────────────────────────────
router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true, readAt: new Date() }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/v1/student/notifications/read-all ────────────────────────────────
router.put('/notifications/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/settings ──────────────────────────────────────────────
router.get('/settings', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });
    res.json({ settings: student.preferences });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/v1/student/settings ──────────────────────────────────────────────
router.put('/settings', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    if (req.body.preferences) {
      student.preferences = { ...student.preferences, ...req.body.preferences };
      await student.save();
    }

    res.json({ ok: true, settings: student.preferences });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/exams ────────────────────────────────────────────────────
// List exams assigned to the current student
router.get('/exams', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const exams = await Exam.find({
      assignedTo: student._id,
      isPublished: true,
    })
      .populate('subjectId', 'name color')
      .select('-questions.correctAnswer -questions.explanation')
      .sort({ createdAt: -1 })
      .lean();

    // Check if the student already has submissions for each exam
    const examIds = exams.map((e) => e._id);
    const submissions = await Submission.find({
      studentId: student._id,
      examId: { $in: examIds },
    }).lean();

    const submittedMap = {};
    submissions.forEach((s) => {
      submittedMap[s.examId.toString()] = s;
    });

    const result = exams.map((exam) => ({
      _id: exam._id,
      title: exam.title,
      type: exam.type,
      subjectId: exam.subjectId,
      duration: exam.duration,
      totalPoints: exam.totalPoints,
      questionCount: exam.questions?.length || 0,
      instructions: exam.instructions,
      attemptsAllowed: exam.attemptsAllowed,
      status: submittedMap[exam._id.toString()]
        ? submittedMap[exam._id.toString()].status === 'passed'
          ? 'passed'
          : 'attempted'
        : 'pending',
      submission: submittedMap[exam._id.toString()]
        ? {
            score: submittedMap[exam._id.toString()].score,
            maxScore: submittedMap[exam._id.toString()].maxScore || exam.totalPoints,
            status: submittedMap[exam._id.toString()].status,
          }
        : null,
    }));

    res.json({ exams: result });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/exams/:id ──────────────────────────────────────────────
// Get full exam details (without correct answers) for taking
router.get('/exams/:id', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const exam = await Exam.findOne({
      _id: req.params.id,
      assignedTo: student._id,
      isPublished: true,
    })
      .populate('subjectId', 'name color')
      .lean();

    if (!exam) return res.status(404).json({ error: 'Exam not found or not assigned to you' });

    // Check existing submission
    const existingSubmission = await Submission.findOne({
      studentId: student._id,
      examId: exam._id,
    }).lean();

    if (existingSubmission && existingSubmission.status !== 'pending') {
      // Already completed — send results instead
      return res.json({
        exam: {
          _id: exam._id,
          title: exam.title,
          type: exam.type,
          subjectId: exam.subjectId,
          instructions: exam.instructions,
          duration: exam.duration,
          totalPoints: exam.totalPoints,
          questionCount: exam.questions?.length || 0,
          questions: exam.questions.map((q) => ({
            id: q.id,
            type: q.type,
            question: q.question,
            code: q.code,
            codeLanguage: q.codeLanguage,
            options: q.options,
            points: q.points,
            difficulty: q.difficulty,
            tags: q.tags,
            // Include correct answer & explanation only in results view
            correctAnswer: exam.showCorrectAnswers ? q.correctAnswer : undefined,
            explanation: exam.showCorrectAnswers ? q.explanation : undefined,
          })),
        },
        submission: {
          id: existingSubmission._id,
          score: existingSubmission.score,
          maxScore: existingSubmission.maxScore || exam.totalPoints,
          status: existingSubmission.status,
          results: existingSubmission.results,
          timeSpent: existingSubmission.timeSpent,
          submittedAt: existingSubmission.createdAt,
        },
        completed: true,
      });
    }

    // Strip correct answers for taking
    const safeQuestions = exam.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      code: q.code,
      codeLanguage: q.codeLanguage,
      options: q.options,
      points: q.points,
      difficulty: q.difficulty,
      tags: q.tags,
    }));

    res.json({
      exam: {
        _id: exam._id,
        title: exam.title,
        type: exam.type,
        subjectId: exam.subjectId,
        instructions: exam.instructions,
        duration: exam.duration,
        totalPoints: exam.totalPoints,
        questions: safeQuestions,
      },
      completed: false,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/student/exams/:id/start ────────────────────────────────────────
// Start an exam attempt (creates a pending submission if none exists)
router.post('/exams/:id/start', requireRole('student'), async (req, res, next) => {
  try {
    const student = await resolveStudent(req, req.body.studentCode);

    const exam = await Exam.findOne({
      _id: req.params.id,
      assignedTo: student._id,
      isPublished: true,
    }).lean();

    if (!exam) return res.status(404).json({ error: 'Exam not found or not assigned to you' });

    // Check for existing submission
    let submission = await Submission.findOne({
      studentId: student._id,
      examId: exam._id,
    });

    if (submission) {
      if (submission.status !== 'pending') {
        // Check attempts allowed
        const attemptsUsed = await Submission.countDocuments({
          studentId: student._id,
          examId: exam._id,
          status: { $ne: 'pending' },
        });
        if (attemptsUsed >= (exam.attemptsAllowed || 1)) {
          return res.status(400).json({ error: 'No more attempts allowed for this exam' });
        }
      }
    } else {
      // Create new pending submission
      submission = await Submission.create({
        studentId: student._id,
        examId: exam._id,
        status: 'pending',
        score: 0,
        maxScore: exam.totalPoints,
        timeSpent: 0,
        attemptNumber: 1,
      });
    }

    res.json({
      ok: true,
      submissionId: submission._id,
      duration: exam.duration,
      startedAt: submission.createdAt || new Date(),
      attemptNumber: submission.attemptNumber,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/student/exams/:id/submit ───────────────────────────────────────
// Submit exam answers for grading
router.post('/exams/:id/submit', requireRole('student'), async (req, res, next) => {
  try {
    const student = await resolveStudent(req, req.body.studentCode);

    const exam = await Exam.findOne({
      _id: req.params.id,
      assignedTo: student._id,
      isPublished: true,
    }).lean();

    if (!exam) return res.status(404).json({ error: 'Exam not found or not assigned to you' });

    const submission = await Submission.findOne({
      studentId: student._id,
      examId: exam._id,
      status: 'pending',
    });

    if (!submission) {
      return res.status(400).json({ error: 'No active exam attempt found. Start the exam first.' });
    }

    const { answers, timeSpent } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers object is required' });
    }

    // Grade each question
    let totalScore = 0;
    const maxScore = exam.totalPoints || 0;
    const results = exam.questions.map((q) => {
      const studentAnswer = answers[q.id] || '';
      let correct = false;

      if (q.type === 'mcq') {
        correct = studentAnswer.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
      } else if (q.type === 'fill-blank') {
        correct = studentAnswer.trim().toLowerCase() === (q.correctAnswer || '').trim().toLowerCase();
      } else if (q.type === 'predict-output') {
        correct = studentAnswer.trim() === (q.correctAnswer || '').trim();
      } else if (q.type === 'code' || q.type === 'bug-fix') {
        // For code questions, use the sandbox to run against test cases
        // For now, do a basic comparison — will enhance with sandbox
        correct = studentAnswer.trim() === (q.correctAnswer || '').trim();
        // Try to match loosely
        if (!correct) {
          const norm = (s) => s.replace(/\s+/g, ' ').trim();
          correct = norm(studentAnswer) === norm(q.correctAnswer || '');
        }
      }

      const points = correct ? (q.points || 1) : 0;
      totalScore += points;

      return {
        questionId: q.id,
        questionType: q.type,
        question: q.question,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        correct,
        points,
        maxPoints: q.points || 1,
        explanation: q.explanation || '',
      };
    });

    // Calculate percentage score
    const percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = percentageScore >= (exam.passingScore || 60);
    const status = passed ? 'passed' : 'failed';

    // Update submission
    submission.score = totalScore;
    submission.maxScore = maxScore;
    submission.status = status;
    submission.results = results;
    submission.timeSpent = timeSpent || submission.timeSpent || 0;
    await submission.save();

    // Award XP if passed
    let xpEarned = 0;
    let coinsEarned = 0;
    if (passed) {
      xpEarned = exam.type === 'final' ? 100 : exam.type === 'midterm' ? 60 : 30;
      coinsEarned = xpEarned;
      student.addXP(xpEarned);
      student.coins += coinsEarned;
      student.totalExamsCompleted = (student.totalExamsCompleted || 0) + 1;
      await student.save();
    }

    res.json({
      ok: true,
      submission: {
        id: submission._id,
        score: totalScore,
        maxScore,
        percentage: percentageScore,
        status,
        passed,
        results,
      },
      xpEarned,
      coinsEarned,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/exams/:id/results ───────────────────────────────────────
// Get exam results after submission
router.get('/exams/:id/results', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const [exam, submission] = await Promise.all([
      Exam.findById(req.params.id)
        .populate('subjectId', 'name color')
        .lean(),
      Submission.findOne({
        studentId: student._id,
        examId: req.params.id,
        status: { $ne: 'pending' },
      }).lean(),
    ]);

    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    if (!submission) return res.status(404).json({ error: 'No completed submission found for this exam' });

    res.json({
      exam: {
        _id: exam._id,
        title: exam.title,
        type: exam.type,
        subjectId: exam.subjectId,
        totalPoints: exam.totalPoints,
        passingScore: exam.passingScore,
        questionCount: exam.questions?.length || 0,
        showCorrectAnswers: exam.showCorrectAnswers,
      },
      submission: {
        id: submission._id,
        score: submission.score,
        maxScore: submission.maxScore,
        percentage: submission.maxScore > 0 ? Math.round((submission.score / submission.maxScore) * 100) : 0,
        status: submission.status,
        passed: submission.status === 'passed',
        results: submission.results,
        timeSpent: submission.timeSpent,
        submittedAt: submission.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/adaptive-onboarding-status ────────────────────────────
// Check if the student has completed their learning style onboarding
router.get('/adaptive-onboarding-status', requireAuth, async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();

    res.json({
      onboardingCompleted: student?.onboardingCompleted || false,
      learningProfile: student?.learningProfile || {},
      completedAt: student?.onboardingCompletedAt || null,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/student/adaptive-onboarding ───────────────────────────────────
// Submit the 5 learning style questions to create the student's adaptive profile
router.post('/adaptive-onboarding', requireAuth, async (req, res, next) => {
  try {
    // Try to find existing student profile; auto-create if missing
    let student = await Student.findOne({ userId: req.userId });
    if (!student) {
      const { User } = await import('../../auth/models/index.js');
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      student = await Student.create({
        userId: user._id,
        status: 'active',
      });
    }

    const { learningStyle, pacing, practiceFrequency, problemSolvingApproach, experienceLevel } = req.body;

    // Validate required fields
    if (!learningStyle || !pacing || !practiceFrequency || !problemSolvingApproach || !experienceLevel) {
      return res.status(400).json({ error: 'All 5 learning profile fields are required' });
    }

    // Save learning profile
    student.learningProfile = {
      learningStyle,
      pacing,
      practiceFrequency,
      problemSolvingApproach,
      experienceLevel,
    };
    student.onboardingCompleted = true;
    student.onboardingCompletedAt = new Date();

    // Set initial preferences based on learning profile
    student.preferences = {
      ...student.preferences,
      difficulty: experienceLevel === 'absolute-beginner' ? 'beginner'
        : experienceLevel === 'some-experience' ? 'beginner'
        : experienceLevel === 'intermediate' ? 'intermediate'
        : 'advanced',
    };

    await student.save();

    res.json({
      ok: true,
      learningProfile: student.learningProfile,
      message: 'Learning profile saved successfully!',
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/adaptive-path ──────────────────────────────────────────
// Get personalized learning recommendations based on the student's learning profile
router.get('/adaptive-path', requireAuth, async (req, res, next) => {
  try {
    let student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const doc = await Student.create({ userId: user._id, status: 'active' });
      student = doc.toObject();
    }

    const profile = student.learningProfile || {};
    const weaknesses = student.weaknesses || [];
    const strengths = student.strengths || [];

    // ── AI-first: generate truly personalized recommendations via LLM ──────────
    // Falls back to the deterministic rule-based logic below if the LLM is
    // unreachable, times out, or returns malformed JSON.
    const aiRecommendations = await generateAIRecs(profile, weaknesses, strengths, student);
    const recommendations = aiRecommendations || buildRuleBasedRecs(profile, weaknesses);

    res.json({
      profile: {
        learningStyle: profile.learningStyle || 'Not set',
        pacing: profile.pacing || 'Not set',
        practiceFrequency: profile.practiceFrequency || 'Not set',
        problemSolvingApproach: profile.problemSolvingApproach || 'Not set',
        experienceLevel: profile.experienceLevel || 'Not set',
        completed: student.onboardingCompleted || false,
      },
      recommendations,
      weaknesses,
      strengths,
      stats: {
        totalLessonsCompleted: student.totalLessonsCompleted,
        totalExercisesCompleted: student.totalExercisesCompleted,
        averageScore: student.averageScore,
        level: student.level,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Adaptive helpers ───────────────────────────────────────────────────────────
// Deterministic fallback used when the LLM is unavailable. Reproduces the
// original rule-based recommendations so the endpoint never depends on the AI.
function buildRuleBasedRecs(profile, weaknesses) {
  const recommendations = [];

  if (profile.pacing === 'slow') {
    recommendations.push({
      type: 'pacing',
      title: 'Take Your Time',
      description: 'We recommend shorter lessons with plenty of breaks. Master each concept before moving on.',
      icon: 'clock',
      action: 'Set study sessions to 20-30 minutes',
    });
  } else if (profile.pacing === 'fast') {
    recommendations.push({
      type: 'pacing',
      title: 'Accelerated Path',
      description: 'You learn fast! We recommend skipping the basics and jumping into advanced topics.',
      icon: 'zap',
      action: 'Start with intermediate difficulty',
    });
  } else {
    recommendations.push({
      type: 'pacing',
      title: 'Balanced Approach',
      description: 'A steady mix of theory and practice at a moderate pace works best for you.',
      icon: 'trending',
      action: 'Try 40-minute study sessions',
    });
  }

  if (profile.learningStyle === 'visual') {
    recommendations.push({
      type: 'style',
      title: 'Visual Learning',
      description: 'We will use diagrams, flowcharts, and visual explanations to help you understand concepts.',
      icon: 'eye',
      action: 'Enable visual whiteboard mode',
    });
  } else if (profile.learningStyle === 'reading') {
    recommendations.push({
      type: 'style',
      title: 'Reading & Text',
      description: 'We will provide detailed written explanations and documentation-style lessons.',
      icon: 'book',
      action: 'Explore text-heavy lessons',
    });
  } else if (profile.learningStyle === 'hands-on') {
    recommendations.push({
      type: 'style',
      title: 'Hands-On Learning',
      description: 'Jump straight into coding! We emphasize exercises, projects, and real code from the start.',
      icon: 'code',
      action: 'Start with coding exercises',
    });
  } else if (profile.learningStyle === 'video') {
    recommendations.push({
      type: 'style',
      title: 'Video & Narration',
      description: 'We recommend video explanations and the AI teacher feature for narrated lessons.',
      icon: 'play',
      action: 'Try the AI avatar teacher',
    });
  }

  if (profile.practiceFrequency === 'high') {
    recommendations.push({
      type: 'practice',
      title: 'Practice Heavy',
      description: 'You need lots of practice. We will generate extra exercises for every concept you learn.',
      icon: 'target',
      action: 'Complete 5+ exercises per lesson',
    });
  } else if (profile.practiceFrequency === 'low') {
    recommendations.push({
      type: 'practice',
      title: 'Light Practice',
      description: 'A few key exercises will be enough. Focus more on understanding the concepts.',
      icon: 'check',
      action: 'Complete 1-2 key exercises per lesson',
    });
  } else {
    recommendations.push({
      type: 'practice',
      title: 'Moderate Practice',
      description: 'A balanced mix of concept learning and practice exercises.',
      icon: 'star',
      action: 'Complete 3 exercises per lesson',
    });
  }

  if (profile.problemSolvingApproach === 'research') {
    recommendations.push({
      type: 'approach',
      title: 'Research & Learn',
      description: 'You prefer finding answers yourself. We will provide links to documentation and resources.',
      icon: 'search',
      action: 'Try self-guided research challenges',
    });
  } else if (profile.problemSolvingApproach === 'ask-help') {
    recommendations.push({
      type: 'approach',
      title: 'Collaborative',
      description: 'You learn by asking questions. The AI teacher avatar is perfect for you!',
      icon: 'message',
      action: 'Chat with the AI teacher',
    });
  } else if (profile.problemSolvingApproach === 'debug') {
    recommendations.push({
      type: 'approach',
      title: 'Debugger Mindset',
      description: 'You learn by fixing broken code. We will give you buggy code to debug.',
      icon: 'terminal',
      action: 'Try find-bug type exercises',
    });
  } else if (profile.problemSolvingApproach === 'break') {
    recommendations.push({
      type: 'approach',
      title: 'Reflective Learner',
      description: 'You learn best after stepping away. We recommend spaced repetition for your study plan.',
      icon: 'clock',
      action: 'Try spaced repetition schedule',
    });
  }

  (weaknesses || []).slice(0, 3).forEach((w) => {
    recommendations.push({
      type: 'weakness',
      title: `Review: ${w}`,
      description: `This area needs practice. We recommend reviewing the fundamentals of ${w}.`,
      icon: 'target',
      action: 'Start review lesson',
    });
  });

  return recommendations;
}

// Ask the LLM to synthesize a genuinely personalized learning plan from the
// student's profile, strengths, weaknesses, and progress history. Returns an
// array of recommendations, or null on any failure so the caller falls back
// to buildRuleBasedRecs. Never throws.
async function generateAIRecs(profile, weaknesses, strengths, student) {
  const model = resolveOpenRouterModel(process.env.OPENROUTER_MODEL);
  if (!getOpenRouterConfig().apiKey) return null;

  const prompt =
    'You are an adaptive learning platform that designs personalized study plans. ' +
    'Based on the student data below, produce 4-5 focused, specific recommendations ' +
    'that will help them improve. Each recommendation must be an object with: ' +
    '"type" (one of pacing/style/practice/approach/weakness), "title" (short, specific, ' +
    'max 6 words), "description" (one sentence, actionable, must reference the specific ' +
    'weakness/concept it targets), "icon" (one of clock/zap/trending/eye/book/code/play/' +
    'target/check/star/search/message/terminal), "action" (one concrete next step, max 8 words).\n\n' +
    'Return ONLY a JSON array. No markdown, no other text.\n\n' +
    'STUDENT PROFILE:\n' +
    JSON.stringify({
      learningStyle: profile.learningStyle,
      pacing: profile.pacing,
      practiceFrequency: profile.practiceFrequency,
      problemSolvingApproach: profile.problemSolvingApproach,
      experienceLevel: profile.experienceLevel,
    }) +
    '\n\nSTRENGTHS: ' + (strengths || []).join(', ') +
    '\nWEAKNESSES: ' + (weaknesses || []).join(', ') +
    '\n\nPROGRESS: ' + JSON.stringify({
      totalLessonsCompleted: student.totalLessonsCompleted,
      totalExercisesCompleted: student.totalExercisesCompleted,
      averageScore: student.averageScore,
      level: student.level,
    });

  try {
    const aiResp = await callAIRace(prompt, 2048, 30000, 'openrouter', model);
    let parsed = aiResp;
    // callAIRace returns pre-parsed JSON via parseJSON; tolerate a wrapped/text form too.
    if (Array.isArray(parsed)) {
      // already good
    } else if (typeof parsed === 'string') {
      parsed = parseRecJSON(parsed);
    } else if (parsed && typeof parsed.text === 'string') {
      parsed = parseRecJSON(parsed.text);
    } else if (parsed && Array.isArray(parsed.recommendations)) {
      parsed = parsed.recommendations;
    } else {
      return null;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .filter(r => r && typeof r === 'object' && r.title && r.description)
      .map(r => ({
        type: ['pacing', 'style', 'practice', 'approach', 'weakness'].includes(r.type) ? r.type : 'practice',
        title: String(r.title).slice(0, 60),
        description: String(r.description).slice(0, 200),
        icon: r.icon || 'target',
        action: String(r.action || 'Start learning').slice(0, 40),
      }));
  } catch (err) {
    console.warn('[adaptive-path] LLM failed, using rule-based fallback:', err.message);
    return null;
  }
}

function parseRecJSON(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ── GET /api/v1/student/lesson-paths ───────────────────────────────────────────
// Returns lesson paths assigned to this student, with full lesson materials
router.get('/lesson-paths', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const paths = await LessonPath.find({
      assignedStudentIds: student._id,
      isActive: true,
    })
      .populate({
        path: 'lessons.lessonId',
        model: 'CodingLesson',
        select: 'title content difficulty duration attachments codeSnippets videoUrl',
      })
      .sort({ createdAt: -1 })
      .lean();

    const result = paths.map(path => ({
      id: path._id,
      title: path.title,
      description: path.description,
      difficulty: path.difficulty,
      estimatedWeeks: path.estimatedWeeks,
      lessons: (path.lessons || [])
        .filter(l => l.lessonId)
        .sort((a, b) => a.order - b.order)
        .map(l => ({
          id: l.lessonId._id,
          title: l.lessonId.title,
          difficulty: l.lessonId.difficulty,
          duration: l.lessonId.duration,
          hasVideo: !!l.lessonId.videoUrl,
          attachments: l.lessonId.attachments || [],
          codeSnippets: l.lessonId.codeSnippets || [],
          mandatory: l.mandatory,
          order: l.order,
        })),
      totalLessons: (path.lessons || []).filter(l => l.lessonId).length,
    }));

    res.json({ paths: result });
  } catch (err) {
    next(err);
  }
});

export default function studentRoutes(req, res, next) {
  publicRouter(req, res, (err) => {
    if (err) return next(err);
    router(req, res, next);
  });
}
