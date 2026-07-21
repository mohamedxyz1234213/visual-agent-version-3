// ── Bootstrap the very first admin from environment variables ─────────────────
// Triggered on server start. Idempotent: a re-run is a no-op.

import { User } from '../models/index.js';
import { hashPassword } from './crypto.js';

export async function bootstrapAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.log('[bootstrap] No ADMIN_EMAIL/ADMIN_PASSWORD set — admin user must be created via the admin panel or the signup flow.');
    return null;
  }
  if (password.length < 8) {
    console.warn('[bootstrap] ADMIN_PASSWORD is shorter than 8 characters; ignoring.');
    return null;
  }

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    // Make sure they're an admin, then update the password if it was provided
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      existing.status = 'active';
      await existing.save();
      console.log(`[bootstrap] Promoted existing user ${existing.email} to admin.`);
    } else if (process.env.ADMIN_PASSWORD_FORCE === 'true') {
      existing.passwordHash = hashPassword(password);
      await existing.save();
      console.log(`[bootstrap] Reset admin password for ${existing.email} (ADMIN_PASSWORD_FORCE=true).`);
    }
    return existing;
  }

  const admin = await User.create({
    email,
    username,
    passwordHash: hashPassword(password),
    role: 'admin',
    status: 'active',
    maxAiRequests: 999,
    aiRequestsUsed: 0,
  });
  console.log(`[bootstrap] ✅ Initial admin created: ${admin.email} (username: ${admin.username})`);
  return admin;
}
