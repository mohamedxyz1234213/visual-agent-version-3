// ── AI request quota guard ────────────────────────────────────────────────────
// Enforces the per-user limit configured on the User document and writes an
// AiRequestLog entry covering the lifecycle of the call.

import { User, AiRequestLog } from '../models/index.js';
import { getClientIp, getUserAgent } from './request.js';

const ERROR = (status, message) => Object.assign(new Error(message), { status });

/**
 * Atomically check that the user has remaining AI quota and bump the counter.
 * Returns the AiRequestLog document (status: 'started') so the caller can
 * mark it completed/failed once the request finishes.
 */
export async function reserveAiRequest({ user, type, provider, model, sourceFilename, lessonId, seriesId, req }) {
  if (!user) throw ERROR(401, 'Authentication required.');

  // Atomic increment: only succeeds if used < max
  const updated = await User.findOneAndUpdate(
    {
      _id: user._id,
      status: 'active',
      $expr: { $lt: ['$aiRequestsUsed', '$maxAiRequests'] },
    },
    { $inc: { aiRequestsUsed: 1 } },
    { new: true },
  );

  if (!updated) {
    const fresh = await User.findById(user._id).lean();
    if (!fresh) throw ERROR(401, 'Authentication required.');
    if (fresh.status !== 'active') throw ERROR(403, 'Your account is disabled.');
    throw ERROR(403, `You have used all ${fresh.maxAiRequests} of your AI lesson generations. Ask an admin to raise your limit.`);
  }

  const log = await AiRequestLog.create({
    userId: user._id,
    userEmail: user.email,
    username: user.username,
    type,
    provider,
    model,
    sourceFilename,
    lessonId,
    seriesId,
    status: 'started',
    ip: getClientIp(req),
    userAgent: getUserAgent(req),
  });

  return { user: updated, log };
}

export async function markAiRequestFinished(log, { status, errorMessage } = {}) {
  if (!log) return;
  await AiRequestLog.updateOne(
    { _id: log._id },
    {
      $set: {
        status: status || 'completed',
        errorMessage: errorMessage || undefined,
      },
    },
  );
}

/**
 * Roll back a reserved AI request (e.g. when the file is empty and we never
 * actually called the model). Decrements both the counter and the log status.
 */
export async function releaseAiRequest(log) {
  if (!log) return;
  await AiRequestLog.updateOne({ _id: log._id }, { $set: { status: 'failed', errorMessage: 'released (no AI call made)' } });
  await User.updateOne({ _id: log.userId }, { $inc: { aiRequestsUsed: -1 } });
}
