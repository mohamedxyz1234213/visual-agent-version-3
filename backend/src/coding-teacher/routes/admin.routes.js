import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../auth/middleware/auth.js';
import { Student, Teacher, Subject, Lesson, Exercise, Exam, Submission, Notification } from '../models/index.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, EarlyAccessRequest, LoginLog, AiRequestLog, PageViewLog } from '../../auth/models/index.js';

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
      pendingEarlyAccess,
      activeStudents,
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Lesson.countDocuments(),
      Exercise.countDocuments(),
      Exam.countDocuments(),
      Submission.countDocuments(),
      EarlyAccessRequest.countDocuments({ status: 'pending' }),
      Student.countDocuments({ status: 'active', lastActivityDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    // Total AI cost
    const aiCost = await AiRequestLog.aggregate([
      { $group: { _id: null, totalCost: { $sum: '$cost' }, totalRequests: { $sum: 1 } } },
    ]);

    // User growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalLessons,
        totalExercises,
        totalExams,
        totalSubmissions,
        pendingEarlyAccess,
        activeStudents,
        aiCostToday: aiCost[0]?.totalCost || 0,
        aiRequestsTotal: aiCost[0]?.totalRequests || 0,
      },
      userGrowth,
    });
  } catch (err) {
    next(err);
  }
});

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { role, status, search, page = 1, limit = 25 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter),
    ]);

    // Enrich with student/teacher data
    const enriched = await Promise.all(
      users.map(async (u) => {
        if (u.role === 'student') {
          const student = await Student.findOne({ userId: u._id }).lean();
          return { ...u, studentData: student };
        }
        if (u.role === 'teacher') {
          const teacher = await Teacher.findOne({ userId: u._id }).lean();
          return { ...u, teacherData: teacher };
        }
        return u;
      })
    );

    res.json({
      users: enriched,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { email, username, password, role, fullName } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const user = await User.create({
      email,
      username,
      passwordHash: bcrypt.hashSync(password, 10),
      role: role || 'student',
      status: 'active',
    });

    // Create student/teacher profile if needed
    if (role === 'student') {
      await Student.create({ userId: user._id, status: 'active' });
    } else if (role === 'teacher') {
      await Teacher.create({ userId: user._id });
    }

    res.status(201).json({ ok: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { password, ...updates } = req.body;
    if (password) {
      updates.passwordHash = bcrypt.hashSync(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ ok: true, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Clean up related data
    await Student.deleteOne({ userId: req.params.id });
    await Teacher.deleteOne({ userId: req.params.id });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── Early Access Management ───────────────────────────────────────────────────
router.get('/early-access', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await EarlyAccessRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post('/early-access/:id/approve', async (req, res, next) => {
  try {
    const doc = await EarlyAccessRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Request not found' });

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    doc.status = 'approved';
    doc.inviteToken = inviteToken;
    doc.inviteExpiresAt = inviteExpiresAt;
    doc.approvedBy = req.userId;
    doc.approvedAt = new Date();
    await doc.save();

    // Generate invite URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/signup/${inviteToken}`;

    res.json({
      ok: true,
      request: doc,
      invite: { url: inviteUrl, delivered: false, channel: 'url', previewUrl: null },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/early-access/:id/reject', async (req, res, next) => {
  try {
    const doc = await EarlyAccessRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectedAt: new Date(), rejectionReason: req.body.reason || '' },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Request not found' });
    res.json({ ok: true, request: doc });
  } catch (err) {
    next(err);
  }
});

router.delete('/early-access/:id', async (req, res, next) => {
  try {
    await EarlyAccessRequest.findByIdAndDelete(req.params.id);
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

router.get('/lessons', async (req, res, next) => {
  try {
    const { search, status, subjectId } = req.query;
    const filter = {};
    if (status) filter.isPublished = status === 'published';
    if (subjectId) filter.subjectId = subjectId;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const lessons = await Lesson.find(filter)
      .sort({ createdAt: -1 })
      .populate('subjectId', 'name')
      .populate('teacherId', 'username email')
      .lean();

    res.json({ lessons });
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

// ── Logs & Monitoring ─────────────────────────────────────────────────────────
router.get('/logs/login', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      LoginLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LoginLog.countDocuments(),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/logs/ai-requests', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AiRequestLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AiRequestLog.countDocuments(),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/logs/pages', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PageViewLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PageViewLog.countDocuments(),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// ── System Stats ──────────────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [users, earlyAccess, lessons] = await Promise.all([
      User.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      EarlyAccessRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const userStats = { total: 0, by_status: {} };
    users.forEach((u) => { userStats.by_status[u._id] = u.count; userStats.total += u.count; });

    const eaStats = { total: 0, pending: 0, approved: 0, completed: 0, rejected: 0 };
    earlyAccess.forEach((e) => {
      eaStats.total += e.count;
      if (e._id in eaStats) eaStats[e._id] = e.count;
    });

    res.json({
      users: userStats,
      early_access: eaStats,
      lessons: { total: await Lesson.countDocuments() },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
