import { Router } from 'express';
import { StudentRegistrationRequest, SchoolYear } from '../models/index.js';
import { User } from '../../auth/models/index.js';
import { hashPassword } from '../../auth/services/crypto.js';
import { getClientIp, getUserAgent } from '../../auth/services/request.js';
import { calculateAge } from '../../utils/age.js';

const router = Router();

const USERNAME_RE = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NATIONAL_ID_RE = /^\d{10,20}$/;
const PHONE_RE = /^[\d+\-\s()]{7,20}$/;

const RATE_LIMIT = new Map(); // ip -> { count, windowStart }
function rateLimit(ip, key, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = RATE_LIMIT.get(`${ip}:${key}`);
  if (!entry || now - entry.windowStart > windowMs) {
    RATE_LIMIT.set(`${ip}:${key}`, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

function bad(res, msg, code = 400) {
  return res.status(code).json({ error: msg });
}

// ── POST /api/v1/registration/student ─────────────────────────────────────────
// Public. A prospective student submits their school email, parent phone,
// national ID, and date of birth. This does NOT create a login-capable account
// — it sits in a pending queue until a teacher (matched by the student's age)
// reviews and approves it.
router.post('/student', async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(ip, 'student-register', 5, 60_000)) {
      return bad(res, 'Too many requests. Please wait a minute.', 429);
    }

    const fullName = String(req.body?.fullName || '').trim();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const schoolEmail = String(req.body?.schoolEmail || '').trim().toLowerCase();
    const parentPhone = String(req.body?.parentPhone || '').trim();
    const nationalId = String(req.body?.nationalId || '').trim();
    const dateOfBirth = req.body?.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
    const password = String(req.body?.password || '');

    if (fullName.length < 2) return bad(res, 'Please provide your full name.');
    if (!USERNAME_RE.test(username)) {
      return bad(res, 'Username must be 3\u201332 characters: lowercase letters, digits, dot, dash, or underscore.');
    }
    if (!EMAIL_RE.test(schoolEmail)) return bad(res, 'Please provide a valid school email address.');
    if (!PHONE_RE.test(parentPhone)) return bad(res, 'Please provide a valid parent phone number.');
    if (!NATIONAL_ID_RE.test(nationalId)) return bad(res, 'Please provide a valid national ID number.');
    if (!dateOfBirth || Number.isNaN(dateOfBirth.getTime())) return bad(res, 'Please provide a valid date of birth.');
    if (calculateAge(dateOfBirth) < 5 || calculateAge(dateOfBirth) > 20) {
      return bad(res, 'This platform is designed for school-age students.');
    }
    if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');

    const existingUser = await User.findOne({ $or: [{ email: schoolEmail }, { username }] }).lean();
    if (existingUser) return bad(res, 'An account with this email or username already exists.', 409);

    const existingRequest = await StudentRegistrationRequest.findOne({
      $or: [{ schoolEmail }, { nationalId }],
      status: 'pending',
    }).lean();
    if (existingRequest) {
      return bad(res, 'A registration request with this email or national ID is already pending review.', 409);
    }

    // Best-effort match to a school year by age, so the reviewing teacher has
    // a sensible default; the teacher can still override it on approval.
    const age = calculateAge(dateOfBirth);
    const matchedYear = await SchoolYear.findOne({
      isActive: true,
      minAge: { $lte: age },
      maxAge: { $gte: age },
    }).lean();

    const request = await StudentRegistrationRequest.create({
      fullName,
      username,
      schoolEmail,
      parentPhone,
      nationalId,
      dateOfBirth,
      schoolYearId: matchedYear?._id,
      passwordHash: hashPassword(password),
      status: 'pending',
      ip,
      userAgent: getUserAgent(req),
    });

    return res.status(201).json({
      ok: true,
      message: 'Your registration has been submitted. A teacher will review and approve your account shortly.',
      request_id: request._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/registration/student/status ───────────────────────────────────
// Public. Lets a prospective student check their request status without
// exposing any other applicant's data.
router.get('/student/status', async (req, res, next) => {
  try {
    const schoolEmail = String(req.query?.schoolEmail || '').trim().toLowerCase();
    const nationalId = String(req.query?.nationalId || '').trim();
    if (!EMAIL_RE.test(schoolEmail) || !NATIONAL_ID_RE.test(nationalId)) {
      return bad(res, 'Please provide the school email and national ID used at registration.');
    }

    const request = await StudentRegistrationRequest.findOne({ schoolEmail, nationalId })
      .sort({ createdAt: -1 })
      .select('status rejectionReason createdAt reviewedAt')
      .lean();

    if (!request) return bad(res, 'No registration request found for those details.', 404);
    return res.json({ status: request.status, rejectionReason: request.rejectionReason, submittedAt: request.createdAt, reviewedAt: request.reviewedAt });
  } catch (err) {
    next(err);
  }
});

export default router;
