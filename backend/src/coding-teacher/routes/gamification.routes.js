import { Router } from 'express';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Student, Achievement, Badge, StudentBadge, WeeklyChallenge, Submission } from '../models/index.js';
import { User } from '../../auth/models/index.js';

const router = Router();

router.use(requireAuth);

// ── GET /api/v1/gamification/leaderboard ──────────────────────────────────────
router.get('/leaderboard', async (req, res, next) => {
  try {
    const { type = 'xp', limit = 50, timeframe = 'all-time' } = req.query;

    let sortField = 'xp';
    if (type === 'streak') sortField = 'streak';
    else if (type === 'weekly') sortField = 'weeklyXP';

    // Only include students (exclude teacher users)
    const studentUserIds = await User.find({ role: 'student' }).distinct('_id').lean();

    // Build filter: only active students with a real student User account
    const filter = {
      userId: { $in: studentUserIds },
      status: 'active',
    };

    // For weekly timeframe, add a weeklyXPWeek filter
    if (timeframe === 'weekly') {
      const currentWeek = getWeekNumber(new Date());
      filter.weeklyXPWeek = currentWeek;
    }

    const leaders = await Student.find(filter)
      .sort({ [sortField]: -1 })
      .limit(Math.min(parseInt(limit) || 50, 100))
      .populate('userId', 'username avatar')
      .lean();

    const currentStudent = await Student.findOne({ userId: req.userId }).lean();
    let myRank = null;
    if (currentStudent) {
      myRank = await Student.countDocuments({
        ...filter,
        [sortField]: { $gt: currentStudent[sortField] || 0 },
      }) + 1;
    }

    res.json({
      leaderboard: leaders.map((s, i) => ({
        rank: i + 1,
        username: s.userId?.username || 'Anonymous',
        avatar: s.userId?.avatar || null,
        xp: s.xp,
        level: s.level,
        streak: s.streak,
        coins: s.coins,
        weeklyXP: s.weeklyXP || 0,
        weeklyXPWeek: s.weeklyXPWeek || null,
      })),
      myRank,
      myStats: currentStudent
        ? {
            xp: currentStudent.xp,
            level: currentStudent.level,
            streak: currentStudent.streak,
            weeklyXP: currentStudent.weeklyXP || 0,
            longestStreak: currentStudent.longestStreak || 0,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// Helper: get ISO week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ── GET /api/v1/gamification/badges ───────────────────────────────────────────
router.get('/badges', async (req, res, next) => {
  try {
    const badges = await Badge.find({ isActive: true }).lean();

    // Get student's earned badges
    let earnedBadgeIds = [];
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (student) {
      const earned = await StudentBadge.find({ studentId: student._id }).lean();
      earnedBadgeIds = earned.map((e) => e.badgeId.toString());
    }

    res.json({
      badges: badges.map((b) => ({
        ...b,
        earned: earnedBadgeIds.includes(b._id.toString()),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/gamification/achievements ─────────────────────────────────────
router.get('/achievements', async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId }).lean();
    if (!student) return res.json({ achievements: [] });

    const achievements = await Achievement.find({ studentId: student._id })
      .sort({ unlockedAt: -1 })
      .lean();

    res.json({ achievements });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/gamification/challenges ───────────────────────────────────────
// Visible challenges = school-wide (no assignedBy) OR assigned to this exact
// student OR created by one of this student's assigned teachers.
router.get('/challenges', async (req, res, next) => {
  try {
    const now = new Date();
    const student = await Student.findOne({ userId: req.userId }).lean();

    const scopeFilter = student
      ? {
          $or: [
            { assignedBy: { $exists: false } },
            { assignedBy: null },
            { assignedTo: student._id },
            { $and: [{ assignedBy: { $in: student.teacherIds || [] } }, { assignedTo: { $size: 0 } }] },
          ],
        }
      : { $or: [{ assignedBy: { $exists: false } }, { assignedBy: null }] };

    const challenges = await WeeklyChallenge.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      ...scopeFilter,
    })
      .populate('exerciseId', 'title difficulty')
      .lean();

    res.json({
      challenges: challenges.map((c) => ({
        ...c,
        isParticipating: student ? c.participants.includes(student._id) : false,
        participantCount: c.participants.length,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/gamification/challenges/:id/join ─────────────────────────────
router.post('/challenges/:id/join', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const challenge = await WeeklyChallenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (challenge.participants.includes(student._id)) {
      return res.status(400).json({ error: 'Already participating' });
    }

    challenge.participants.push(student._id);
    await challenge.save();

    res.json({ ok: true, message: 'Joined challenge successfully' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/gamification/challenges/:id/submit ───────────────────────────
router.post('/challenges/:id/submit', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const challenge = await WeeklyChallenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (!challenge.participants.includes(student._id)) {
      return res.status(400).json({ error: 'Must join challenge first' });
    }

    const { score, time } = req.body;

    // Calculate rank among participants
    const existingSubmissions = challenge.submissions || [];
    const rank = existingSubmissions.filter((s) => s.score > score).length + 1;

    challenge.submissions.push({
      studentId: student._id,
      score,
      time,
      rank,
      submittedAt: new Date(),
    });

    await challenge.save();

    // Award rewards
    let xpEarned = challenge.rewards?.xp || 20;
    let coinsEarned = challenge.rewards?.coins || 10;
    if (rank === 1) { xpEarned *= 2; coinsEarned *= 2; }
    else if (rank <= 3) { xpEarned = Math.round(xpEarned * 1.5); }

    student.addXP(xpEarned);
    student.coins += coinsEarned;
    student.lastActivityDate = new Date();
    await student.save();

    res.json({ ok: true, rank, xpEarned, coinsEarned });
  } catch (err) {
    next(err);
  }
});

export default router;
