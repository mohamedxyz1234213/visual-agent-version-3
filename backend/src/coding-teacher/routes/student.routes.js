import { Router } from 'express';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Student, Progress, Submission, Exercise, Lesson, Achievement, AIConversation, Notification } from '../models/index.js';
import { User } from '../../auth/models/index.js';

const router = Router();

// All student routes require auth + student role
router.use(requireAuth);

// ── GET /api/v1/student/dashboard ─────────────────────────────────────────────
router.get('/dashboard', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

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

    res.json({
      student: {
        id: student._id,
        studentCode: student.studentCode,
        xp: student.xp,
        level: student.level,
        streak: student.streak,
        coins: student.coins,
        totalLessonsCompleted: student.totalLessonsCompleted,
        totalExercisesCompleted: student.totalExercisesCompleted,
        averageScore: student.averageScore,
        totalTimeSpent: student.totalTimeSpent,
      },
      progress: progress.map((p) => ({
        subjectId: p.subjectId,
        completion: p.overallCompletion,
        timeSpent: p.timeSpent,
      })),
      recentSubmissions,
      unreadNotifications,
      recentAchievements,
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

    const lessons = await Lesson.find(filter)
      .sort({ order: 1 })
      .select('title subjectId duration difficulty tags totalExercises isPublished order')
      .lean();

    res.json({ lessons });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/student/lessons/:id ───────────────────────────────────────────
router.get('/lessons/:id', requireRole('student'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Increment view count
    await Lesson.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

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

    const lesson = await Lesson.findById(req.params.id).lean();
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

// ── POST /api/v1/student/exercises/:id/submit ─────────────────────────────────
router.post('/exercises/:id/submit', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const exercise = await Exercise.findById(req.params.id).lean();
    if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

    const { code, language, timeSpent } = req.body;

    // Simple evaluation (in production, use sandbox)
    const results = exercise.testCases.map((tc) => ({
      testCaseId: tc.id,
      passed: true, // placeholder — real eval in sandbox
      output: '',
      expectedOutput: tc.expectedOutput,
      executionTime: 0,
      memoryUsed: 0,
    }));

    const passedCount = results.filter((r) => r.passed).length;
    const allPassed = passedCount === results.length;
    const score = Math.round((passedCount / results.length) * 100);

    const submission = await Submission.create({
      studentId: student._id,
      exerciseId: exercise._id,
      code,
      language: language || 'javascript',
      status: allPassed ? 'passed' : 'failed',
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
router.get('/notifications', requireRole('student'), async (req, res, next) => {
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
router.put('/notifications/:id/read', requireRole('student'), async (req, res, next) => {
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
router.put('/notifications/read-all', requireRole('student'), async (req, res, next) => {
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

export default router;
