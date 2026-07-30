#!/usr/bin/env node
/**
 * test-deployment.mjs
 * Full pre/post deployment test suite for the Visual Agent Teacher platform.
 *
 * Usage:
 *   node scripts/test-deployment.mjs                    # build + env checks only
 *   node scripts/test-deployment.mjs --local            # also start backend + smoke test
 *   node scripts/test-deployment.mjs --url https://your-backend.vercel.app
 */

import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const localMode = args.includes('--local');
const urlIdx = args.indexOf('--url');
const deployUrl = urlIdx !== -1 ? args[urlIdx + 1]?.replace(/\/$/, '') : null;

let pass = 0;
let fail = 0;

function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✅ ${name}`);
    pass++;
  } else {
    console.log(`  ❌ ${name}${detail ? `\n     ${detail}` : ''}`);
    fail++;
  }
}

function run(cmd, cwd, label) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, { shell: true, cwd, stdio: 'pipe', encoding: 'utf8' });
  if (result.status !== 0) {
    check(label, false, (result.stderr || result.stdout || '').slice(-800));
    return false;
  }
  check(label, true);
  return true;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch {}
  return { status: res.status, body, headers: res.headers };
}

async function smokeTestApi(base) {
  console.log(`\n== API smoke test: ${base} ==`);

  let r = await fetchJson(`${base}/health`);
  check('GET /health → 200', r.status === 200, JSON.stringify(r.body));
  check('health status ok', r.body?.status === 'ok');

  r = await fetchJson(`${base}/api/v1/auth/bootstrap-info`);
  check('GET /auth/bootstrap-info → 200', r.status === 200, JSON.stringify(r.body));
  check('bootstrap-info has has_admin', typeof r.body?.has_admin === 'boolean');

  r = await fetchJson(`${base}/api/v1/upload/providers`);
  check('GET /upload/providers → 401 (auth required)', r.status === 401);

  r = await fetchJson(`${base}/api/v1/lessons/`);
  check('GET /lessons → 401 (auth required)', r.status === 401);

  r = await fetchJson(`${base}/api/v1/admin/stats`);
  check('GET /admin/stats → 401 (auth required)', r.status === 401);

  // Coding teacher routes
  r = await fetchJson(`${base}/api/v1/student/dashboard`);
  check('GET /student/dashboard → 401', r.status === 401);

  r = await fetchJson(`${base}/api/v1/teacher/dashboard`);
  check('GET /teacher/dashboard → 401', r.status === 401);
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(`${url}/health`);
        if (res.ok) return resolve();
      } catch {}
      if (Date.now() - start > timeoutMs) return reject(new Error('Server did not start in time'));
      setTimeout(tick, 500);
    };
    tick();
  });
}

console.log('\n══════════════════════════════════════════════════════════');
console.log('  Visual Agent Teacher — Deployment Test Suite');
console.log('══════════════════════════════════════════════════════════\n');

// Phase 1: Project structure
console.log('== Phase 1: Project structure ==');
for (const dir of ['backend', 'Student-Main', 'Admin', 'Teachers-dashboard', 'fastapi_service']) {
  check(`${dir}/ exists`, fs.existsSync(path.join(ROOT, dir)));
}
check('backend/vercel.json exists', fs.existsSync(path.join(ROOT, 'backend', 'vercel.json')));
check('backend/api/index.js exists', fs.existsSync(path.join(ROOT, 'backend', 'api', 'index.js')));

// Phase 2: Environment verification
console.log('\n== Phase 2: Environment variables ==');
const envCheck = spawnSync('node', ['scripts/verify-deployment-env.mjs'], {
  cwd: ROOT,
  encoding: 'utf8',
});
console.log(envCheck.stdout || envCheck.stderr);
check('env verification', envCheck.status === 0);

// Phase 3: Backend dependency + import check
console.log('\n== Phase 3: Backend sanity ==');
run('npm install --omit=dev', path.join(ROOT, 'backend'), 'backend npm install');
run('node --check src/index.js', path.join(ROOT, 'backend'), 'backend syntax check');
run('node --check api/index.js', path.join(ROOT, 'backend'), 'vercel entry syntax check');
run('node --check src/utils/backgroundTask.js', path.join(ROOT, 'backend'), 'backgroundTask module check');

// Phase 4: Frontend builds
console.log('\n== Phase 4: Frontend builds ==');
for (const app of ['Student-Main', 'Admin', 'Teachers-dashboard']) {
  const dir = path.join(ROOT, app);
  run('npm install', dir, `${app} npm install`);
  run('npm run build', dir, `${app} next build`);
}

// Phase 5: Live or local API tests
if (deployUrl) {
  await smokeTestApi(deployUrl);
} else if (localMode) {
  console.log('\n== Phase 5: Local backend smoke test ==');
  const backendDir = path.join(ROOT, 'backend');
  const child = spawn('node', ['src/index.js'], {
    cwd: backendDir,
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverLogs = '';
  child.stdout.on('data', (d) => { serverLogs += d; });
  child.stderr.on('data', (d) => { serverLogs += d; });

  try {
    await waitForServer('http://localhost:8000');
    check('backend started on :8000', true);
    await smokeTestApi('http://localhost:8000');
  } catch (err) {
    check('backend started on :8000', false, err.message + '\n' + serverLogs.slice(-500));
  } finally {
    child.kill('SIGTERM');
  }
} else {
  console.log('\n== Phase 5: API smoke test (skipped) ==');
  console.log('  ℹ️  Pass --local to test against localhost:8000');
  console.log('  ℹ️  Pass --url https://your-backend.vercel.app after deploy');
}

console.log('\n══════════════════════════════════════════════════════════');
console.log(`  Result: ${pass} passed, ${fail} failed`);
console.log('══════════════════════════════════════════════════════════\n');

process.exit(fail === 0 ? 0 : 1);
