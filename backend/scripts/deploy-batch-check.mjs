const BASE = process.env.BASE || 'https://backend-teaching.vercel.app';
const LOGIN_IDENTIFIER = process.env.LOGIN_IDENTIFIER || 'teacher@test.com';
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || '123456789';
const TOPICS = process.env.TOPICS_JSON ? JSON.parse(process.env.TOPICS_JSON) : [
  'Explain stack vs queue with practical coding examples.',
  'Teach binary search with a worked array example and complexity intuition.',
  'Explain recursion with base case, recursive case, and call stack tracing.',
  'Explain hash tables, collisions, and load factor using real examples.',
  'Explain BFS vs DFS traversal on a graph and when each is preferred.',
];

async function jsonFetch(url, opts = {}) {
  const startedAt = Date.now();
  const res = await fetch(url, opts);
  const text = await res.text();
  const elapsedMs = Date.now() - startedAt;
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body, elapsedMs };
}

async function login() {
  const login = await jsonFetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: LOGIN_IDENTIFIER, password: LOGIN_PASSWORD }),
  });

  if (login.status !== 200 || !login.body?.token) {
    throw new Error(`Login failed: ${login.status} ${JSON.stringify(login.body).slice(0, 200)}`);
  }

  return login.body.token;
}

async function generateOne(token, topic, index) {
  const create = await jsonFetch(`${BASE}/api/v1/explain`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `wb_session=${token}`,
    },
    body: JSON.stringify({
      text: topic,
      lesson_intent: 'teach',
      explanation_mode: 'full_lesson',
      ai_provider: 'openrouter',
    }),
  });

  if (create.status !== 202) {
    return {
      index,
      topic,
      ok: false,
      stage: 'create',
      httpStatus: create.status,
      detail: create.body,
    };
  }

  const lessonId = create.body.id;
  const startedAt = Date.now();
  let finalStatus = null;
  let finalPayload = null;

  for (let i = 1; i <= 60; i += 1) {
    const status = await jsonFetch(`${BASE}/api/v1/upload/status/${lessonId}`, {
      headers: { cookie: `wb_session=${token}` },
    });
    const s = status.body;

    if (s?.status === 'ready' || s?.status === 'error') {
      finalStatus = s.status;
      finalPayload = s;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  const durationMs = Date.now() - startedAt;
  if (finalStatus !== 'ready') {
    return {
      index,
      topic,
      ok: false,
      stage: 'poll',
      lessonId,
      durationMs,
      finalPayload,
    };
  }

  const lesson = await jsonFetch(`${BASE}/api/v1/lessons/${lessonId}`, {
    headers: { cookie: `wb_session=${token}` },
  });

  return {
    index,
    topic,
    lessonId,
    ok: lesson.status === 200,
    createMs: create.elapsedMs,
    durationMs,
    parts: finalPayload?.parts_count,
    processingStep: finalPayload?.processing_step,
    lessonHttpStatus: lesson.status,
    title: lesson.body?.title,
  };
}

async function main() {
  const token = await login();
  const results = [];

  for (let i = 0; i < TOPICS.length; i += 1) {
    const result = await generateOne(token, TOPICS[i], i + 1);
    results.push(result);
    console.log(JSON.stringify(result));
  }

  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  const durations = results.filter((r) => r.ok).map((r) => r.durationMs);
  const avgMs = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
  const maxMs = durations.length ? Math.max(...durations) : null;

  console.log('summary', JSON.stringify({
    total: results.length,
    ok,
    failed,
    avgMs,
    maxMs,
  }));

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
