import { Router } from 'express';
import { Lesson, LessonPart } from '../models/Lesson.js';
import { Quiz, QuizAttempt } from '../models/Quiz.js';
import { Student } from '../coding-teacher/models/index.js';
import { User } from '../auth/models/index.js';
import { requireAuth } from '../auth/middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ── Cache admin IDs so we don't query the users collection on every request ──
let cachedAdminIds = null;
let adminIdsCachedAt = 0;
const ADMIN_CACHE_TTL = 60_000; // 1 minute

async function getAdminIds() {
  const now = Date.now();
  if (cachedAdminIds && now - adminIdsCachedAt < ADMIN_CACHE_TTL) {
    return cachedAdminIds;
  }
  const adminUsers = await User.find({ role: 'admin' }).select('_id').lean();
  cachedAdminIds = adminUsers.map((u) => u._id);
  adminIdsCachedAt = now;
  return cachedAdminIds;
}

// GET /api/v1/dashboard/teacher — whiteboard lessons from the student's teachers
router.get('/teacher', async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user?._id }).lean();
    if (!student || !student.teacherIds?.length) {
      return res.json({ stats: { total: 0, ready: 0, processing: 0, error: 0, totalAttempts: 0, avgScore: null, passRate: null }, lessons: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    }

    const teacherIds = student.teacherIds;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const search = (req.query.search || '').trim();
    const statusFilter = (req.query.status || '').trim();
    const sort = (req.query.sort || 'recent').trim();

    const adminIds = await getAdminIds();

    // Ownership constraint: teacher's lessons OR admin-created (public) lessons
    const ownerConstraint = {
      $or: [
        { ownerId: { $in: teacherIds } },
        { ownerId: { $in: adminIds } },
      ],
    };

    // Build filter with $and so ownership and search are separate constraints
    const constraints = [{ ...ownerConstraint }, { status: statusFilter || 'ready' }];
    if (search) {
      constraints.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { sourceFilename: { $regex: search, $options: 'i' } },
        ],
      });
    }
    const filter = { $and: constraints };

    let sortObj = {};
    switch (sort) {
      case 'oldest': sortObj = { createdAt: 1 }; break;
      case 'title': sortObj = { title: 1 }; break;
      default: sortObj = { createdAt: -1 }; break;
    }

    // Stats: include both teacher and admin lessons
    const allOwnerIds = [...teacherIds, ...adminIds];
    const [statusCounts, lessons, total] = await Promise.all([
      Lesson.aggregate([
        { $match: { ownerId: { $in: allOwnerIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Lesson.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
      Lesson.countDocuments(filter),
    ]);

    const stats = { total: 0, ready: 0, processing: 0, error: 0, totalAttempts: 0, avgScore: null, passRate: null };
    for (const entry of statusCounts) {
      stats[entry._id] = entry.count;
      stats.total += entry.count;
    }

    const lessonIds = lessons.map((l) => l._id);
    const partCounts = await LessonPart.aggregate([
      { $match: { lessonId: { $in: lessonIds } } },
      { $group: { _id: '$lessonId', count: { $sum: 1 } } },
    ]);
    const partsMap = {};
    for (const pc of partCounts) partsMap[pc._id.toString()] = pc.count;

    const serializedLessons = lessons.map((l) => ({
      id: l._id.toString(),
      title: l.title,
      subject: l.subject ?? null,
      source_filename: l.sourceFilename,
      summary: l.summary ?? null,
      status: l.status,
      processing_step: l.processingStep ?? 'queued',
      error_message: l.errorMessage ?? null,
      parts_count: partsMap[l._id.toString()] || 0,
      series_id: l.seriesId?.toString() ?? null,
      lesson_index: l.lessonIndex ?? 0,
      total_lessons: l.totalLessons ?? 1,
      created_at: l.createdAt,
    }));

    res.json({ stats, lessons: serializedLessons, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard?page=1&limit=12&search=&status=&sort=recent
router.get('/', async (req, res, next) => {
  try {
    // Admin sees everything; everyone else sees their own + admin-owned lessons
    if (req.user?.role === 'admin') {
      // ── Admin: no filter restriction ──────────────────────────────────────
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
      const search = (req.query.search || '').trim();
      const statusFilter = (req.query.status || '').trim();
      const sort = (req.query.sort || 'recent').trim();

      const filter = {};
      if (statusFilter && ['processing', 'ready', 'error'].includes(statusFilter)) {
        filter.status = statusFilter;
      }
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { sourceFilename: { $regex: search, $options: 'i' } },
        ];
      }

      let sortObj = {};
      switch (sort) {
        case 'oldest': sortObj = { createdAt: 1 }; break;
        case 'title': sortObj = { title: 1 }; break;
        default: sortObj = { createdAt: -1 }; break;
      }

      const [statusCounts, quizStats] = await Promise.all([
        Lesson.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        QuizAttempt.aggregate([
          {
            $group: {
              _id: null,
              totalAttempts: { $sum: 1 },
              avgScore: { $avg: '$score' },
              passedCount: { $sum: { $cond: ['$passed', 1, 0] } },
            },
          },
        ]),
      ]);

      const stats = { total: 0, ready: 0, processing: 0, error: 0, totalAttempts: 0, avgScore: null, passRate: null };
      for (const entry of statusCounts) {
        stats[entry._id] = entry.count;
        stats.total += entry.count;
      }
      if (quizStats.length > 0) {
        stats.totalAttempts = quizStats[0].totalAttempts || 0;
        stats.avgScore = quizStats[0].avgScore != null ? Math.round(quizStats[0].avgScore * 10) / 10 : null;
        stats.passRate = stats.totalAttempts > 0 ? Math.round((quizStats[0].passedCount / stats.totalAttempts) * 100) : null;
      }

      const [lessons, total] = await Promise.all([
        Lesson.find(filter).sort(sortObj).skip((page - 1) * limit).limit(limit).lean(),
        Lesson.countDocuments(filter),
      ]);

      const lessonIds = lessons.map((l) => l._id);
      const partCounts = await LessonPart.aggregate([
        { $match: { lessonId: { $in: lessonIds } } },
        { $group: { _id: '$lessonId', count: { $sum: 1 } } },
      ]);
      const partsMap = {};
      for (const pc of partCounts) partsMap[pc._id.toString()] = pc.count;

      const serializedLessons = lessons.map((l) => ({
        id: l._id.toString(),
        title: l.title,
        subject: l.subject ?? null,
        source_filename: l.sourceFilename,
        summary: l.summary ?? null,
        status: l.status,
        processing_step: l.processingStep ?? 'queued',
        error_message: l.errorMessage ?? null,
        parts_count: partsMap[l._id.toString()] || 0,
        series_id: l.seriesId?.toString() ?? null,
        lesson_index: l.lessonIndex ?? 0,
        total_lessons: l.totalLessons ?? 1,
        created_at: l.createdAt,
      }));

      return res.json({ stats, lessons: serializedLessons, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    }

    // ── Non-admin: own lessons + admin-created (public) lessons ─────────────
    //    When ?owner=me is set, only return the current user's own lessons.
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const search = (req.query.search || '').trim();
    const statusFilter = (req.query.status || '').trim();
    const sort = (req.query.sort || 'recent').trim();
    const ownerFilter = (req.query.owner || '').trim();

    const adminIds = await getAdminIds();
    const filterOwnerIds = ownerFilter === 'me'
      ? [req.user?._id].filter(Boolean)
      : [...new Set([req.user?._id, ...adminIds])].filter(Boolean);
    const filter = { ownerId: { $in: filterOwnerIds } };
    if (statusFilter && ['processing', 'ready', 'error'].includes(statusFilter)) {
      filter.status = statusFilter;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { sourceFilename: { $regex: search, $options: 'i' } },
      ];
    }

    let sortObj = {};
    switch (sort) {
      case 'oldest': sortObj = { createdAt: 1 }; break;
      case 'title': sortObj = { title: 1 }; break;
      default: sortObj = { createdAt: -1 }; break;
    }

    // Stats across visible scope
    const [statusCounts, quizStats] = await Promise.all([
      Lesson.aggregate([
        { $match: { ownerId: { $in: filterOwnerIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      QuizAttempt.aggregate([
        { $match: { sessionId: req.user?._id?.toString() } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: '$score' },
            passedCount: { $sum: { $cond: ['$passed', 1, 0] } },
          },
        },
      ]),
    ]);

    const stats = { total: 0, ready: 0, processing: 0, error: 0, totalAttempts: 0, avgScore: null, passRate: null };
    for (const entry of statusCounts) {
      stats[entry._id] = entry.count;
      stats.total += entry.count;
    }
    if (quizStats.length > 0) {
      stats.totalAttempts = quizStats[0].totalAttempts || 0;
      stats.avgScore = quizStats[0].avgScore != null ? Math.round(quizStats[0].avgScore * 10) / 10 : null;
      stats.passRate = stats.totalAttempts > 0 ? Math.round((quizStats[0].passedCount / stats.totalAttempts) * 100) : null;
    }

    // ── Paginated lessons ─────────────────────────────────────────────────────
    const [lessons, total] = await Promise.all([
      Lesson.find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Lesson.countDocuments(filter),
    ]);

    // Attach parts count to each lesson
    const lessonIds = lessons.map((l) => l._id);
    const partCounts = await LessonPart.aggregate([
      { $match: { lessonId: { $in: lessonIds } } },
      { $group: { _id: '$lessonId', count: { $sum: 1 } } },
    ]);
    const partsMap = {};
    for (const pc of partCounts) {
      partsMap[pc._id.toString()] = pc.count;
    }

    const serializedLessons = lessons.map((l) => ({
      id: l._id.toString(),
      title: l.title,
      subject: l.subject ?? null,
      source_filename: l.sourceFilename,
      summary: l.summary ?? null,
      status: l.status,
      processing_step: l.processingStep ?? 'queued',
      error_message: l.errorMessage ?? null,
      parts_count: partsMap[l._id.toString()] || 0,
      series_id: l.seriesId?.toString() ?? null,
      lesson_index: l.lessonIndex ?? 0,
      total_lessons: l.totalLessons ?? 1,
      created_at: l.createdAt,
    }));

    res.json({
      stats,
      lessons: serializedLessons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;