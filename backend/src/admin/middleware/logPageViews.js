// Lightweight admin page-view logger. Records every hit on /api/v1/admin/* to
// the PageViewLog collection, deduped per (user, path) within a 2s window so
// the noisy automatic refetches don't flood the table.

import { PageViewLog } from '../../auth/models/index.js';

const RECENT = new Map(); // userId|path -> ts
const DEDUP_MS = 2000;

export function logAdminPageViews() {
  return (req, res, next) => {
    res.on('finish', () => {
      // Skip non-admin callers, login-style endpoints, and the page log itself
      if (!req.user) return;
      if (!req.path.startsWith('/api/v1/admin') && !req.originalUrl.startsWith('/api/v1/admin')) return;
      if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'DELETE') return;
      if (req.path.startsWith('/logs/pages')) return;

      const key = `${req.user._id}|${req.originalUrl}`;
      const last = RECENT.get(key) || 0;
      if (Date.now() - last < DEDUP_MS) return;
      RECENT.set(key, Date.now());

      // Best-effort write — never let logging break a request
      PageViewLog.create({
        userId: req.user._id,
        username: req.user.username,
        userEmail: req.user.email,
        path: req.originalUrl.replace(/^https?:\/\/[^/]+/, ''),
        method: req.method,
        statusCode: res.statusCode,
        ip: req.ip || null,
        userAgent: req.headers?.['user-agent'] || null,
      }).catch(() => {});
    });
    next();
  };
}
