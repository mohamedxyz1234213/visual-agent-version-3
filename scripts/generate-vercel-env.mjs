#!/usr/bin/env node
/**
 * generate-vercel-env.mjs
 * Reads backend/.env and prints key=value pairs ready to paste into Vercel
 * Dashboard → Settings → Environment Variables (Production).
 *
 * Usage:
 *   node scripts/generate-vercel-env.mjs
 *   node scripts/generate-vercel-env.mjs > vercel-env.txt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(ROOT, 'backend', '.env');

if (!fs.existsSync(envPath)) {
  console.error('backend/.env not found. Copy backend/.env.example and fill in values first.');
  process.exit(1);
}

const VERCEL_OVERRIDES = {
  NODE_ENV: 'production',
  TRUST_PROXY: 'true',
  // Replace after first deploy with your actual backend URL:
  BACKEND_PUBLIC_URL: 'https://YOUR-BACKEND-PROJECT.vercel.app',
  ALLOWED_ORIGINS:
    'https://YOUR-STUDENT-PROJECT.vercel.app,https://YOUR-ADMIN-PROJECT.vercel.app,https://YOUR-TEACHER-PROJECT.vercel.app',
  PUBLIC_BASE_URL: 'https://YOUR-STUDENT-PROJECT.vercel.app',
  SMTP_TEST_MODE: 'false',
};

const SKIP = new Set(['PORT']);

const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!SKIP.has(key)) env[key] = val;
}

Object.assign(env, VERCEL_OVERRIDES);

console.log('# Paste these into Vercel → backend project → Settings → Environment Variables');
console.log('# Update BACKEND_PUBLIC_URL, ALLOWED_ORIGINS, PUBLIC_BASE_URL after you know your URLs\n');

for (const [key, val] of Object.entries(env)) {
  console.log(`${key}=${val}`);
}
