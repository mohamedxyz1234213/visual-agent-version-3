import { Router } from 'express';
import { User, Session, EarlyAccessRequest, LoginLog } from '../models/index.js';
import { hashPassword, verifyPassword, generateToken } from '../services/crypto.js';
import { sendInviteEmail } from '../services/emailService.js';
import { setSessionCookie, clearSessionCookie, requireAuth } from '../middleware/auth.js';
import { getClientIp, getUserAgent } from '../services/request.js';

const router = Router();

const USERNAME_RE = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const INVITE_TTL_HOURS = 72;
const RATE_LIMIT = new Map(); // ip -> { count, windowStart }

function rateLimit(ip, key, max = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = RATE_LIMIT.get(`${ip}:${key}`);
  if (!entry || now - entry.windowStart > windowMs) {
    RATE_LIMIT.set(`${ip}:${key}`, { count: 1, windowStart: now });
    return true;
  }
  entry.count += 1;
  if (entry.count > max) return false;
  return true;
}

function bad(res, msg, code = 400) {
  return res.status(code).json({ error: msg });
}

async function createSession(user, req, res) {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const ip = getClientIp(req);
  const ua = getUserAgent(req);

  await Session.create({
    token,
    userId: user._id,
    role: user.role,
    ip,
    userAgent: ua,
    expiresAt,
  });

  await User.findByIdAndUpdate(user._id, {
    lastLoginAt: new Date(),
    lastLoginIp: ip,
  });

  setSessionCookie(res, token);
  return token;
}

// ── POST /api/v1/auth/request-access ──────────────────────────────────────────
// Public. Anyone can submit their email + username. Goes to admin queue.
router.post('/request-access', async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(ip, 'request-access', 5, 60_000)) {
      return bad(res, 'Too many requests. Please wait a minute.', 429);
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const reason = String(req.body?.reason || '').trim().slice(0, 500);

    if (!EMAIL_RE.test(email)) return bad(res, 'Please provide a valid email address.');
    if (!USERNAME_RE.test(username)) {
      return bad(res, 'Username must be 3–32 characters: lowercase letters, digits, dot, dash, or underscore.');
    }
    if (username.length < 3) return bad(res, 'Username must be at least 3 characters.');

    // Reject if a user with that email already exists
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return bad(res, 'An account with this email already exists. Try logging in instead.', 409);
    }

    // Replace any existing pending request with a fresh one
    await EarlyAccessRequest.deleteMany({ email, status: 'pending' });

    // Reject duplicate of an already-approved-but-not-completed invite
    const openInvite = await EarlyAccessRequest.findOne({
      email,
      status: 'approved',
      inviteExpiresAt: { $gt: new Date() },
    }).lean();
    if (openInvite) {
      return bad(res, 'An invite has already been sent to this email. Check your inbox (or ask admin for a new one).', 409);
    }

    const doc = await EarlyAccessRequest.create({
      email,
      username,
      reason,
      status: 'pending',
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return res.status(201).json({
      ok: true,
      message: 'Your request has been received. You will get an email when an administrator approves it.',
      request_id: doc._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/auth/verify-invite/:token ─────────────────────────────────────
// Public. Returns the email/username bound to a valid, unexpired invite token.
// Used by the /signup/[token] page to pre-fill the form.
router.get('/verify-invite/:token', async (req, res, next) => {
  try {
    const token = String(req.params.token || '').trim();
    if (!token) return bad(res, 'Invalid token.', 400);

    const invite = await EarlyAccessRequest.findOne({ inviteToken: token }).lean();
    if (!invite) return bad(res, 'Invite link is invalid or has been revoked.', 404);
    if (invite.status !== 'approved') return bad(res, 'This invite is no longer active.', 410);
    if (!invite.inviteExpiresAt || new Date(invite.inviteExpiresAt) < new Date()) {
      return bad(res, 'This invite has expired. Please request early access again.', 410);
    }

    return res.json({
      email: invite.email,
      username: invite.username,
      expires_at: invite.inviteExpiresAt,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/auth/complete-signup ─────────────────────────────────────────
// Public. Validates that the supplied email+username MATCH the invite exactly;
// any mismatch sends the user back to the early-access page.
router.post('/complete-signup', async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(ip, 'signup', 10, 60_000)) {
      return bad(res, 'Too many attempts. Try again shortly.', 429);
    }

    const token = String(req.body?.token || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!token) return bad(res, 'Missing invite token.', 400);
    if (!EMAIL_RE.test(email)) return bad(res, 'Please provide a valid email address.');
    if (!USERNAME_RE.test(username)) return bad(res, 'Username must be 3–32 characters: lowercase letters, digits, dot, dash, or underscore.');
    if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');

    const invite = await EarlyAccessRequest.findOne({ inviteToken: token });
    if (!invite) return bad(res, 'Invite link is invalid or has been revoked.', 404);
    if (invite.status !== 'approved') return bad(res, 'This invite is no longer active.', 410);
    if (!invite.inviteExpiresAt || new Date(invite.inviteExpiresAt) < new Date()) {
      invite.status = 'expired';
      await invite.save();
      return bad(res, 'This invite has expired. Please request early access again.', 410);
    }

    // ── Hard requirement: email + username must match the invite exactly ──
    if (invite.email !== email || invite.username !== username) {
      return bad(
        res,
        'The email or username you entered does not match this invite. Please request early access again from the start.',
        403,
      );
    }

    // Reject if a user with this email/username already exists
    const dupe = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (dupe) {
      return bad(res, 'An account with this email or username already exists. Try logging in.', 409);
    }

    const user = await User.create({
      email,
      username,
      passwordHash: hashPassword(password),
      role: 'user',
      status: 'active',
      maxAiRequests: 3,
      aiRequestsUsed: 0,
    });

    invite.status = 'completed';
    invite.completedAt = new Date();
    invite.completedUserId = user._id;
    await invite.save();

    await LoginLog.create({
      userId: user._id,
      email,
      username,
      success: true,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    const token = await createSession(user, req, res);

    return res.json({ ok: true, user: user.toSafeJSON(), token });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(ip, 'login', 10, 60_000)) {
      return bad(res, 'Too many attempts. Try again in a minute.', 429);
    }

    const identifier = String(req.body?.identifier || req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!identifier) return bad(res, 'Email or username is required.');
    if (!password) return bad(res, 'Password is required.');

    const isEmail = identifier.includes('@');
    const user = await User.findOne(isEmail ? { email: identifier } : { username: identifier });
    const ua = getUserAgent(req);

    if (!user || user.status !== 'active' || !verifyPassword(password, user.passwordHash)) {
      await LoginLog.create({
        email: isEmail ? identifier : null,
        username: !isEmail ? identifier : null,
        success: false,
        failureReason: !user ? 'no_such_user' : user.status !== 'active' ? 'disabled' : 'bad_password',
        ip,
        userAgent: ua,
      });
      return bad(res, 'Invalid credentials.', 401);
    }

    await LoginLog.create({
      userId: user._id,
      email: user.email,
      username: user.username,
      success: true,
      ip,
      userAgent: ua,
    });

    const token = await createSession(user, req, res);
    return res.json({ ok: true, user: user.toSafeJSON(), token });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await Session.deleteOne({ token: req.session.token });
    clearSessionCookie(res);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.user) return res.json({ user: null });
  return res.json({ user: req.user.toSafeJSON() });
});

// ── GET /api/v1/auth/bootstrap-info ───────────────────────────────────────────
// Public. Reports whether the system has at least one admin yet. Used by the
// login page to surface a "no admins yet — set up first admin" call to action.
router.get('/bootstrap-info', async (_req, res, next) => {
  try {
    const hasAdmin = await User.exists({ role: 'admin', status: 'active' });
    const hasUsers = await User.exists({});
    res.json({
      has_admin: Boolean(hasAdmin),
      has_users: Boolean(hasUsers),
      bootstrap_email_configured: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD),
    });
  } catch (err) { next(err); }
});

// ── POST /api/v1/auth/bootstrap-first-admin ───────────────────────────────────
// Public. ONLY works when the system has zero users. Creates the first admin
// account. If any user already exists, the request is refused.
router.post('/bootstrap-first-admin', async (req, res, next) => {
  try {
    const existing = await User.exists({});
    if (existing) return bad(res, 'Bootstrap is only available before any users exist.', 409);

    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!EMAIL_RE.test(email)) return bad(res, 'Please provide a valid email address.');
    if (!USERNAME_RE.test(username)) return bad(res, 'Username must be 3–32 characters: lowercase letters, digits, dot, dash, or underscore.');
    if (password.length < 8) return bad(res, 'Password must be at least 8 characters.');

    const admin = await User.create({
      email,
      username,
      passwordHash: hashPassword(password),
      role: 'admin',
      status: 'active',
      maxAiRequests: 999,
      aiRequestsUsed: 0,
    });

    await LoginLog.create({
      userId: admin._id,
      email,
      username,
      success: true,
      ip: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    const token = await createSession(admin, req, res);
    res.json({ ok: true, user: admin.toSafeJSON(), token });
  } catch (err) { next(err); }
});

export default router;
