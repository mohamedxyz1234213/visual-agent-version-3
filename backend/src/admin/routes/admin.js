import { Router } from 'express';
import { User, Session, EarlyAccessRequest, LoginLog, AiRequestLog, PageViewLog } from '../../auth/models/index.js';
import { Lesson, LessonPart, StoryboardScene } from '../../models/Lesson.js';
import { Quiz, QuizAttempt, QuizQuestion } from '../../models/Quiz.js';
import { hashPassword, generateToken, generateInviteCode } from '../../auth/services/crypto.js';
import { sendInviteEmail, getEmailMode } from '../../auth/services/emailService.js';
import { requireAdmin } from '../../auth/middleware/auth.js';
import { getClientIp, getUserAgent } from '../../auth/services/request.js';
import { logAdminPageViews } from '../middleware/logPageViews.js';

const router = Router();
router.use(requireAdmin);
router.use(logAdminPageViews());

// ── Validation helpers ────────────────────────────────────────────────────────
const USERNAME_RE = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

// ── GET /api/v1/admin/stats ───────────────────────────────────────────────────
router.get('/stats', async (_req, res, next) => {
  try {
    const [users, requestsByStatus, lessons, aiLogs] = await Promise.all([
      User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      EarlyAccessRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lesson.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      AiRequestLog.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const userCount = users.reduce((a, b) => a + b.count, 0);
    const lessonCount = lessons.reduce((a, b) => a + b.count, 0);
    const aiCount = aiLogs.reduce((a, b) => a + b.count, 0);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recentLogins, recentAi, recentEarly] = await Promise.all([
      LoginLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      AiRequestLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      EarlyAccessRequest.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    res.json({
      users: {
        total: userCount,
        by_status: Object.fromEntries(users.map((u) => [u._id, u.count])),
      },
      early_access: {
        total: requestsByStatus.reduce((a, b) => a + b.count, 0),
        pending: requestsByStatus.find((r) => r._id === 'pending')?.count || 0,
        approved: requestsByStatus.find((r) => r._id === 'approved')?.count || 0,
        completed: requestsByStatus.find((r) => r._id === 'completed')?.count || 0,
        rejected: requestsByStatus.find((r) => r._id === 'rejected')?.count || 0,
      },
      lessons: {
        total: lessonCount,
        by_status: Object.fromEntries(lessons.map((l) => [l._id, l.count])),
      },
      ai_requests: {
        total: aiCount,
        by_status: Object.fromEntries(aiLogs.map((a) => [a._id, a.count])),
      },
      activity_7d: {
        logins: recentLogins,
        ai_requests: recentAi,
        early_access: recentEarly,
      },
    });
  } catch (err) { next(err); }
});

// ── GET /api/v1/admin/email-mode ───────────────────────────────────────────────
router.get('/email-mode', async (_req, res, next) => {
  try {
    res.json({ mode: getEmailMode() });
  } catch (err) { next(err); }
});

// ── POST /api/v1/admin/test-email ──────────────────────────────────────────────
router.post('/test-email', async (req, res, next) => {
  try {
    const to = (req.body?.to || '').trim().toLowerCase() || req.user.email;
    const token = generateToken(24);
    const result = await sendInviteEmail({ to, username: req.user.username, token });
    res.json({
      ok: true,
      mode: getEmailMode(),
      to,
      delivered: result.delivered,
      channel: result.channel,
      previewUrl: result.previewUrl || null,
      inviteUrl: result.inviteUrl,
    });
  } catch (err) { next(err); }
});

// ── GET /api/v1/admin/early-access ────────────────────────────────────────────
router.get('/early-access', async (req, res, next) => {
  try {
    const status = (req.query.status || '').trim();
    const search = (req.query.search || '').trim();
    const filter = {};
    if (status && ['pending', 'approved', 'rejected', 'completed', 'expired'].includes(status)) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await EarlyAccessRequest.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    res.json(items.map(serializeRequest));
  } catch (err) { next(err); }
});

router.get('/early-access/:id', async (req, res, next) => {
  try {
    const doc = await EarlyAccessRequest.findById(req.params.id).lean();
    if (!doc) return bad(res, 'Request not found', 404);
    res.json(serializeRequest(doc));
  } catch (err) { next(err); }
});

router.post('/early-access/:id/approve', async (req, res, next) => {
  try {
    const doc = await EarlyAccessRequest.findById(req.params.id);
    if (!doc) return bad(res, 'Request not found', 404);
    if (!['pending', 'rejected'].includes(doc.status)) {
      return bad(res, `Cannot approve a request in "${doc.status}" state.`, 409);
    }

    const token = generateToken(24);
    doc.status = 'approved';
    doc.inviteToken = token;
    doc.inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    doc.approvedBy = req.user._id;
    doc.approvedAt = new Date();
    doc.rejectedAt = undefined;
    doc.rejectionReason = undefined;
    await doc.save();

    const result = await sendInviteEmail({ to: doc.email, username: doc.username, token });

    res.json({
      ok: true,
      request: serializeRequest(doc.toObject()),
      invite: { url: result.inviteUrl, delivered: result.delivered, channel: result.channel, previewUrl: result.previewUrl || null },
    });
  } catch (err) { next(err); }
});

router.post('/early-access/:id/reject', async (req, res, next) => {
  try {
    const doc = await EarlyAccessRequest.findById(req.params.id);
    if (!doc) return bad(res, 'Request not found', 404);
    if (!['pending', 'approved'].includes(doc.status)) {
      return bad(res, `Cannot reject a request in "${doc.status}" state.`, 409);
    }
    doc.status = 'rejected';
    doc.rejectedAt = new Date();
    doc.rejectionReason = String(req.body?.reason || '').slice(0, 500);
    doc.inviteToken = undefined;
    doc.inviteExpiresAt = undefined;
    await doc.save();
    res.json({ ok: true, request: serializeRequest(doc.toObject()) });
  } catch (err) { next(err); }
});

router.delete('/early-access/:id', async (req, res, next) => {
  try {
    const doc = await EarlyAccessRequest.findByIdAndDelete(req.params.id);
    if (!doc) return bad(res, 'Request not found', 404);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /api/v1/admin/users ───────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    const ids = users.map((u) => u._id);
    const [lessonCounts, sessionCounts] = await Promise.all([
      Lesson.aggregate([{ $match: { ownerId: { $in: ids } } }, { $group: { _id: '$ownerId', count: { $sum: 1 } } }]),
      Session.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: '$userId', count: { $sum: 1 } } }]),
    ]);
    const lessonMap = Object.fromEntries(lessonCounts.map((l) => [String(l._id), l.count]));
    const sessionMap = Object.fromEntries(sessionCounts.map((s) => [String(s._id), s.count]));

    res.json(users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      username: u.username,
      role: u.role,
      status: u.status,
      max_ai_requests: u.maxAiRequests,
      ai_requests_used: u.aiRequestsUsed,
      last_login_at: u.lastLoginAt ?? null,
      last_login_ip: u.lastLoginIp ?? null,
      lessons_count: lessonMap[u._id.toString()] || 0,
      active_sessions: sessionMap[u._id.toString()] || 0,
      created_at: u.createdAt,
    })));
  } catch (err) { next(err); }
});

// POST /api/v1/admin/users — create a user directly (no invite required)
router.post('/users', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = req.body?.role === 'admin' ? 'admin' : req.body?.role === 'teacher' ? 'teacher' : req.body?.role === 'student' ? 'student' : 'user';
    const maxAiRequests = Number.isFinite(Number(req.body?.max_ai_requests))
      ? Math.max(0, Math.min(1000, Number(req.body?.max_ai_requests)))
      : 3;

    if (!EMAIL_RE.test(email)) return bad(res, 'Please provide a valid email address.');
    if (!USERNAME_RE.test(username)) return bad(res, 'Username must be 3–32 characters: lowercase letters, digits, dot, dash, or underscore.');
    if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');

    const dupe = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (dupe) return bad(res, 'An account with this email or username already exists.', 409);

    const user = await User.create({
      email,
      username,
      passwordHash: hashPassword(password),
      role,
      status: 'active',
      maxAiRequests,
    });

    // Create student/teacher profile if needed
    if (role === 'student') {
      const { Student } = await import('../../coding-teacher/models/index.js');
      await Student.create({ userId: user._id, status: 'active' });
    } else if (role === 'teacher') {
      const { Teacher } = await import('../../coding-teacher/models/index.js');
      await Teacher.create({ userId: user._id });
    }

    res.status(201).json({ ok: true, user: user.toSafeJSON() });
  } catch (err) { next(err); }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return bad(res, 'User not found', 404);

    if (req.body?.max_ai_requests !== undefined) {
      const n = Number(req.body.max_ai_requests);
      if (!Number.isFinite(n) || n < 0 || n > 1000) return bad(res, 'max_ai_requests must be 0–1000.');
      user.maxAiRequests = Math.floor(n);
    }
    if (req.body?.ai_requests_used !== undefined) {
      const n = Number(req.body.ai_requests_used);
      if (!Number.isFinite(n) || n < 0) return bad(res, 'ai_requests_used must be ≥ 0.');
      user.aiRequestsUsed = Math.floor(n);
    }
    if (req.body?.status && ['active', 'disabled'].includes(req.body.status)) {
      user.status = req.body.status;
    }
    if (req.body?.role && ['user', 'admin', 'teacher', 'student'].includes(req.body.role)) {
      // Don't allow the last admin to demote themselves
      if (user._id.toString() === req.user._id.toString() && req.body.role !== 'admin') {
        return bad(res, 'You cannot demote your own admin account.', 409);
      }
      user.role = req.body.role;
    }
    if (typeof req.body?.password === 'string' && req.body.password.length > 0) {
      if (req.body.password.length < 8) return bad(res, 'Password must be at least 8 characters.');
      user.passwordHash = hashPassword(req.body.password);
    }

    await user.save();
    res.json({ ok: true, user: user.toSafeJSON() });
  } catch (err) { next(err); }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return bad(res, 'You cannot delete your own admin account.', 409);
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return bad(res, 'User not found', 404);
    // Cascade: sessions
    await Session.deleteMany({ userId: user._id });
    // Lessons stay (so we can audit) but are detached from the user
    await Lesson.updateMany({ ownerId: user._id }, { $unset: { ownerId: 1 } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/users/:id/lessons — list a single user's lessons
router.get('/users/:id/lessons', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return bad(res, 'User not found', 404);
    const lessons = await Lesson.find({ ownerId: user._id }).sort({ createdAt: -1 }).lean();
    const ids = lessons.map((l) => l._id);
    const partCounts = await LessonPart.aggregate([
      { $match: { lessonId: { $in: ids } } },
      { $group: { _id: '$lessonId', count: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(partCounts.map((p) => [String(p._id), p.count]));
    res.json({
      user: { id: user._id.toString(), email: user.email, username: user.username },
      lessons: lessons.map((l) => ({
        id: l._id.toString(),
        title: l.title,
        subject: l.subject ?? null,
        source_filename: l.sourceFilename,
        status: l.status,
        processing_step: l.processingStep ?? 'queued',
        error_message: l.errorMessage ?? null,
        parts_count: map[String(l._id)] || 0,
        series_id: l.seriesId?.toString() ?? null,
        lesson_index: l.lessonIndex ?? 0,
        total_lessons: l.totalLessons ?? 1,
        created_at: l.createdAt,
      })),
    });
  } catch (err) { next(err); }
});

// ── GET /api/v1/admin/lessons — all lessons with owner info ───────────────────
router.get('/lessons', async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const filter = {};
    if (status && ['processing', 'ready', 'error'].includes(status)) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { sourceFilename: { $regex: search, $options: 'i' } },
      ];
    }
    const lessons = await Lesson.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    const ownerIds = [...new Set(lessons.map((l) => l.ownerId?.toString()).filter(Boolean))];
    const owners = await User.find({ _id: { $in: ownerIds } }, 'email username').lean();
    const ownerMap = Object.fromEntries(owners.map((o) => [o._id.toString(), o]));
    const partCounts = await LessonPart.aggregate([
      { $match: { lessonId: { $in: lessons.map((l) => l._id) } } },
      { $group: { _id: '$lessonId', count: { $sum: 1 } } },
    ]);
    const partMap = Object.fromEntries(partCounts.map((p) => [String(p._id), p.count]));

    res.json(lessons.map((l) => ({
      id: l._id.toString(),
      title: l.title,
      subject: l.subject ?? null,
      source_filename: l.sourceFilename,
      status: l.status,
      processing_step: l.processingStep ?? 'queued',
      error_message: l.errorMessage ?? null,
      parts_count: partMap[String(l._id)] || 0,
      series_id: l.seriesId?.toString() ?? null,
      lesson_index: l.lessonIndex ?? 0,
      total_lessons: l.totalLessons ?? 1,
      created_at: l.createdAt,
      owner: l.ownerId
        ? {
            id: l.ownerId.toString(),
            email: ownerMap[l.ownerId.toString()]?.email ?? null,
            username: ownerMap[l.ownerId.toString()]?.username ?? null,
          }
        : null,
    })));
  } catch (err) { next(err); }
});

// GET /api/v1/admin/lessons/:id — full lesson preview (incl. parts, scenes, quiz)
router.get('/lessons/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) return bad(res, 'Lesson not found', 404);

    const owner = lesson.ownerId
      ? await User.findById(lesson.ownerId, 'email username').lean()
      : null;

    const parts = await LessonPart.find({ lessonId: lesson._id }).sort({ orderIndex: 1 }).lean();
    const detailedParts = await Promise.all(parts.map(async (p) => {
      const scenes = await StoryboardScene.find({ partId: p._id }).sort({ timeOffset: 1 }).lean();
      let quiz = null;
      if (['quiz', 'final_quiz'].includes(p.partType)) {
        const q = await Quiz.findOne({ partId: p._id }).lean();
        if (q) {
          const questions = await QuizQuestion.find({ quizId: q._id }).sort({ orderIndex: 1 }).lean();
          quiz = {
            id: q._id.toString(),
            part_id: q.partId.toString(),
            questions: questions.map((qq) => ({
              id: qq._id.toString(),
              order_index: qq.orderIndex,
              question_type: qq.questionType,
              question_text: qq.questionText,
              options: qq.options ?? null,
              correct_answer: qq.correctAnswer ?? null,
              explanation: qq.explanation ?? null,
              difficulty: qq.difficulty,
            })),
          };
        }
      }
      return {
        id: p._id.toString(),
        lesson_id: p.lessonId.toString(),
        order_index: p.orderIndex,
        title: p.title,
        narration: p.narration ?? null,
        duration_seconds: p.durationSeconds,
        audio_url: p.audioUrl ?? null,
        part_type: p.partType,
        scenes: scenes.map((s) => ({
          id: s._id.toString(),
          time_offset: s.timeOffset,
          action_type: s.actionType,
          payload: s.payload,
        })),
        quiz,
      };
    }));

    res.json({
      id: lesson._id.toString(),
      title: lesson.title,
      subject: lesson.subject ?? null,
      source_filename: lesson.sourceFilename,
      source_file_url: lesson.sourceFileUrl ?? null,
      summary: lesson.summary ?? null,
      status: lesson.status,
      processing_step: lesson.processingStep ?? 'queued',
      error_message: lesson.errorMessage ?? null,
      created_at: lesson.createdAt,
      series_id: lesson.seriesId?.toString() ?? null,
      lesson_index: lesson.lessonIndex ?? 0,
      total_lessons: lesson.totalLessons ?? 1,
      ai_provider: lesson.aiProvider ?? null,
      analysis_model: lesson.analysisModel ?? null,
      owner: owner ? { id: owner._id.toString(), email: owner.email, username: owner.username } : null,
      parts: detailedParts,
    });
  } catch (err) { next(err); }
});

router.delete('/lessons/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return bad(res, 'Lesson not found', 404);
    const parts = await LessonPart.find({ lessonId: lesson._id }).lean();
    const partIds = parts.map((p) => p._id);
    await LessonPart.deleteMany({ lessonId: lesson._id });
    await StoryboardScene.deleteMany({ partId: { $in: partIds } });
    const quizzes = await Quiz.find({ partId: { $in: partIds } }).lean();
    const quizIds = quizzes.map((q) => q._id);
    await Quiz.deleteMany({ partId: { $in: partIds } });
    await QuizQuestion.deleteMany({ quizId: { $in: quizIds } });
    await QuizAttempt.deleteMany({ quizId: { $in: quizIds } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── LOGS ──────────────────────────────────────────────────────────────────────
router.get('/logs/login', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const successOnly = req.query.success === 'true';
    const filter = {};
    if (successOnly) filter.success = true;
    if (req.query.user_id) filter.userId = req.query.user_id;
    const [items, total] = await Promise.all([
      LoginLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      LoginLog.countDocuments(filter),
    ]);
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.get('/logs/ai-requests', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const filter = {};
    if (req.query.user_id) filter.userId = req.query.user_id;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const [items, total] = await Promise.all([
      AiRequestLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      AiRequestLog.countDocuments(filter),
    ]);
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

router.get('/logs/pages', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const filter = {};
    if (req.query.path) filter.path = { $regex: req.query.path, $options: 'i' };
    if (req.query.user_id) filter.userId = req.query.user_id;
    const [items, total] = await Promise.all([
      PageViewLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      PageViewLog.countDocuments(filter),
    ]);
    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

function serializeRequest(doc) {
  return {
    id: doc._id.toString(),
    email: doc.email,
    username: doc.username,
    reason: doc.reason ?? '',
    status: doc.status,
    invite_token: doc.inviteToken ?? null,
    invite_expires_at: doc.inviteExpiresAt ?? null,
    approved_by: doc.approvedBy?.toString() ?? null,
    approved_at: doc.approvedAt ?? null,
    rejected_at: doc.rejectedAt ?? null,
    rejection_reason: doc.rejectionReason ?? null,
    completed_at: doc.completedAt ?? null,
    completed_user_id: doc.completedUserId?.toString() ?? null,
    created_at: doc.createdAt,
    ip: doc.ip ?? null,
  };
}

export default router;
