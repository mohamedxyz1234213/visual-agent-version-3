import { Router } from 'express';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Student, Progress, Submission, Achievement, Lesson } from '../models/index.js';
import { User } from '../../auth/models/index.js';

const router = Router();

// ── POST /api/v1/parent/search ────────────────────────────────────────────────
// Public — rate-limited, no auth required
router.post('/search', async (req, res, next) => {
  try {
    const { studentCode, nationalId } = req.body;
    if (!studentCode || !nationalId) {
      return res.status(400).json({ error: 'Student code and national ID are required' });
    }
    if (!/^\d{14}$/.test(nationalId)) {
      return res.status(400).json({ error: 'National ID must be exactly 14 digits' });
    }

    const student = await Student.findOne({ studentCode })
      .populate('userId', 'username email')
      .lean();

    if (!student || student.nationalId !== nationalId) {
      return res.status(404).json({ error: 'No student found with those credentials' });
    }

    // Generate a temporary JWT for parent access
    const crypto = await import('crypto');
    const tempToken = crypto.default.randomBytes(32).toString('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store temp token (in production, use Redis)
    if (!global.parentTempTokens) global.parentTempTokens = new Map();
    global.parentTempTokens.set(tempToken, {
      studentId: student._id.toString(),
      expires,
    });

    res.json({
      ok: true,
      tempToken,
      studentId: student._id,
      student: {
        code: student.studentCode,
        username: student.userId?.username,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/child/:id/progress ─────────────────────────────────────
router.get('/child/:id/progress', async (req, res, next) => {
  try {
    const tempToken = req.headers['x-parent-token'] || req.query.token;
    if (!tempToken || !global.parentTempTokens?.has(tempToken)) {
      return res.status(401).json({ error: 'Valid parent access token required' });
    }

    const tokenData = global.parentTempTokens.get(tempToken);
    if (Date.now() > tokenData.expires) {
      global.parentTempTokens.delete(tempToken);
      return res.status(401).json({ error: 'Token expired. Please search again.' });
    }
    if (tokenData.studentId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

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

    const achievements = await Achievement.find({ studentId: student._id })
      .sort({ unlockedAt: -1 })
      .limit(5)
      .lean();

    // Consistency score — days active in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const daysActive = await Submission.distinct('createdAt', {
      studentId: student._id,
      createdAt: { $gte: thirtyDaysAgo },
    }).then((dates) => {
      const uniqueDays = new Set(dates.map((d) => new Date(d).toDateString()));
      return uniqueDays.size;
    });

    res.json({
      student: {
        code: student.studentCode,
        username: student.userId?.username,
        xp: student.xp,
        level: student.level,
        streak: student.streak,
        totalLessonsCompleted: student.totalLessonsCompleted,
        totalExercisesCompleted: student.totalExercisesCompleted,
        averageScore: student.averageScore,
        totalTimeSpent: student.totalTimeSpent,
      },
      progress,
      recentSubmissions,
      achievements,
      consistencyScore: Math.round((daysActive / 30) * 100),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/parent/child/:id/activity ─────────────────────────────────────
router.get('/child/:id/activity', async (req, res, next) => {
  try {
    const tempToken = req.headers['x-parent-token'] || req.query.token;
    if (!tempToken || !global.parentTempTokens?.has(tempToken)) {
      return res.status(401).json({ error: 'Valid parent access token required' });
    }

    const submissions = await Submission.find({ studentId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('exerciseId', 'title')
      .lean();

    res.json({ activity: submissions });
  } catch (err) {
    next(err);
  }
});

export default router;
