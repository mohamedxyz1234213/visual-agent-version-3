import { User, Session } from '../models/index.js';
import { getClientIp, getUserAgent } from '../services/request.js';

// ── Cookie / token helpers ────────────────────────────────────────────────────
export const SESSION_COOKIE = 'wb_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function setSessionCookie(res, token) {
  // Lax so top-level navigations from email links work
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

// ── loadUser (idempotent, never blocks) ───────────────────────────────────────
// Pulls session cookie → resolves user → attaches to req. Always calls next().
export async function loadUser(req, _res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE] || extractBearerToken(req);
    if (!token) return next();

    const session = await Session.findOne({ token, expiresAt: { $gt: new Date() } }).lean();
    if (!session) return next();

    const user = await User.findById(session.userId);
    if (!user || user.status !== 'active') return next();

    req.session = { id: session._id.toString(), token: session.token };
    req.user = user;
    req.userId = user._id.toString();
    return next();
  } catch (err) {
    return next();
  }
}

// ── requireAuth (blocks when no user) ─────────────────────────────────────────
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return next();
}

// ── requireAdmin ──────────────────────────────────────────────────────────────
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin privileges required' });
  return next();
}

function extractBearerToken(req) {
  const h = req.headers?.authorization || req.headers?.Authorization;
  if (!h || typeof h !== 'string') return null;
  const [scheme, value] = h.split(' ');
  if (scheme && scheme.toLowerCase() === 'bearer' && value) return value;
  return null;
}
