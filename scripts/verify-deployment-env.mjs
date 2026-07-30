#!/usr/bin/env node
/**
 * verify-deployment-env.mjs
 * Validates that every required environment variable is set before deployment.
 *
 * Usage:
 *   node scripts/verify-deployment-env.mjs
 *   node scripts/verify-deployment-env.mjs --target vercel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const target = process.argv.includes('--target')
  ? process.argv[process.argv.indexOf('--target') + 1]
  : 'local';

const BACKEND_REQUIRED = [
  'MONGODB_URI',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'ADMIN_USERNAME',
];

const BACKEND_AI_ONE_OF = [
  ['OPENROUTER_API_KEY', 'BLAZE_API_KEY', 'BLAZEAPI_API_KEY', 'OPENAI_API_KEY', 'GEMINI_API_KEY'],
];

const BACKEND_VERCEL_REQUIRED = [
  'NODE_ENV',
  'TRUST_PROXY',
  'BACKEND_PUBLIC_URL',
  'ALLOWED_ORIGINS',
];

const FRONTEND_REQUIRED = ['NEXT_PUBLIC_API_URL'];

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const env = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function checkRequired(label, env, keys) {
  const missing = keys.filter((k) => !env?.[k]?.trim());
  return { label, missing };
}

function checkOneOf(label, env, groups) {
  const failures = [];
  for (const group of groups) {
    const hasAny = group.some((k) => env?.[k]?.trim());
    if (!hasAny) failures.push(group.join(' | '));
  }
  return { label, missing: failures };
}

let pass = 0;
let fail = 0;

function report(name, ok, detail) {
  if (ok) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`);
    fail++;
  }
}

console.log(`\n🔍 Verifying deployment environment (${target})\n`);

// ── Backend ──────────────────────────────────────────────────────────────────
const backendEnvPath = path.join(ROOT, 'backend', '.env');
const backendEnv = parseEnvFile(backendEnvPath);
report('backend/.env exists', !!backendEnv, backendEnvPath);

if (backendEnv) {
  const req = checkRequired('backend', backendEnv, BACKEND_REQUIRED);
  report('backend required vars', req.missing.length === 0, req.missing.join(', ') || undefined);

  const ai = checkOneOf('backend AI', backendEnv, BACKEND_AI_ONE_OF);
  report('backend AI provider key', ai.missing.length === 0, ai.missing.join('; ') || undefined);

  if (target === 'vercel') {
    const vercelReq = checkRequired('backend vercel', backendEnv, BACKEND_VERCEL_REQUIRED);
    report('backend Vercel vars', vercelReq.missing.length === 0, vercelReq.missing.join(', ') || undefined);

    report('NODE_ENV=production', backendEnv.NODE_ENV === 'production');
    report('TRUST_PROXY=true', backendEnv.TRUST_PROXY === 'true');
    report(
      'BACKEND_PUBLIC_URL is HTTPS',
      /^https:\/\/.+/.test(backendEnv.BACKEND_PUBLIC_URL || ''),
      backendEnv.BACKEND_PUBLIC_URL,
    );
    report(
      'ALLOWED_ORIGINS includes Vercel frontends',
      (backendEnv.ALLOWED_ORIGINS || '').includes('vercel.app'),
      backendEnv.ALLOWED_ORIGINS,
    );
  }

  report('MONGODB_URI uses Atlas SRV', (backendEnv.MONGODB_URI || '').startsWith('mongodb+srv://'));
  report('TTS configured or disabled', backendEnv.TTS_PROVIDER === 'none' || !!backendEnv.SPEECHIFY_API_KEY || !!backendEnv.ELEVENLABS_API_KEY);
}

// ── Frontends ────────────────────────────────────────────────────────────────
for (const app of ['Student-Main', 'Admin', 'Teachers-dashboard']) {
  const prodPath = path.join(ROOT, app, '.env.production');
  const prodEnv = parseEnvFile(prodPath);
  report(`${app}/.env.production exists`, !!prodEnv);

  if (prodEnv) {
    const req = checkRequired(app, prodEnv, FRONTEND_REQUIRED);
    report(`${app} NEXT_PUBLIC_API_URL`, req.missing.length === 0);

    const apiUrl = prodEnv.NEXT_PUBLIC_API_URL || '';
    report(
      `${app} API URL is valid`,
      /^https:\/\/.+\/api\/v1$/.test(apiUrl) && !apiUrl.includes('YOUR-'),
      apiUrl,
    );
    report(
      `${app} API URL not dead placeholder`,
      !apiUrl.includes('teacherbackend-three.vercel.app'),
      'Update to your new backend Vercel URL after deploy',
    );
  }
}

// ── FastAPI (optional) ───────────────────────────────────────────────────────
const fastapiEnv = parseEnvFile(path.join(ROOT, 'fastapi_service', '.env'));
report('fastapi_service/.env exists (optional)', !!fastapiEnv);
if (fastapiEnv) {
  report('FastAPI OPENROUTER or Blaze configured', !!(fastapiEnv.OPENROUTER_API_KEY || fastapiEnv.BLAZE_API_KEY));
}

console.log(`\nResult: ${pass} passed, ${fail} failed.\n`);
process.exit(fail === 0 ? 0 : 1);
