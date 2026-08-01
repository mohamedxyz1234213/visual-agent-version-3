const BASE = process.env.BASE || 'https://backend-teaching.vercel.app';
const IDENTIFIER = process.env.LOGIN_IDENTIFIER || 'student@test.com';
const PASSWORD = process.env.LOGIN_PASSWORD || '12345678';
const TOPIC = process.env.TOPIC || 'BFS vs DFS traversal on a graph and when each is preferred.';

async function jsonFetch(url, opts = {}) {
  const startedAt = Date.now();
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body, elapsedMs: Date.now() - startedAt };
}

async function login() {
  const login = await jsonFetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: IDENTIFIER, password: PASSWORD }),
  });
  if (login.status !== 200 || !login.body?.token) {
    throw new Error(`Login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }
  return login.body.token;
}

async function deleteAllLessons(token) {
  const list = await jsonFetch(`${BASE}/api/v1/lessons`, { headers: { cookie: `wb_session=${token}` } });
  if (list.status !== 200) {
    throw new Error(`List lessons failed: ${list.status} ${JSON.stringify(list.body)}`);
  }
  const lessons = Array.isArray(list.body) ? list.body : [];
  let deleted = 0;
  for (const lesson of lessons) {
    const del = await jsonFetch(`${BASE}/api/v1/lessons/${lesson.id}`, {
      method: 'DELETE',
      headers: { cookie: `wb_session=${token}` },
    });
    if (del.status === 204 || del.status === 200 || del.status === 404) {
      deleted += 1;
    }
  }
  return deleted;
}

async function generateLesson(token) {
  const create = await jsonFetch(`${BASE}/api/v1/explain`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `wb_session=${token}`,
    },
    body: JSON.stringify({
      text: TOPIC,
      lesson_intent: 'teach',
      explanation_mode: 'full_lesson',
      ai_provider: 'openrouter',
    }),
  });

  if (create.status !== 202) {
    throw new Error(`Create failed: ${create.status} ${JSON.stringify(create.body)}`);
  }

  const lessonId = create.body.id;
  for (let i = 0; i < 75; i += 1) {
    const status = await jsonFetch(`${BASE}/api/v1/upload/status/${lessonId}`, {
      headers: { cookie: `wb_session=${token}` },
    });
    if (status.status === 200 && (status.body?.status === 'ready' || status.body?.status === 'error')) {
      return { lessonId, statusBody: status.body };
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  throw new Error(`Timed out waiting for lesson ${lessonId}`);
}

function countCaptionAudio(parts) {
  let captionCount = 0;
  let captionAudioCount = 0;
  for (const part of parts || []) {
    if (part.part_type !== 'content') continue;
    for (const scene of part.scenes || []) {
      if (scene.action_type !== 'draw_caption') continue;
      captionCount += 1;
      if (scene.payload?.audioUrl || scene.payload?.audio_url) captionAudioCount += 1;
    }
  }
  return { captionCount, captionAudioCount };
}

async function main() {
  const token = await login();
  const deleted = await deleteAllLessons(token);
  const generated = await generateLesson(token);
  const lesson = await jsonFetch(`${BASE}/api/v1/lessons/${generated.lessonId}`, {
    headers: { cookie: `wb_session=${token}` },
  });

  if (lesson.status !== 200) {
    throw new Error(`Fetch lesson failed: ${lesson.status} ${JSON.stringify(lesson.body)}`);
  }

  const parts = lesson.body.parts || [];
  const partAudioPresence = parts.filter((p) => p.part_type === 'content').map((p) => Boolean(p.audio_url || p.audioUrl));
  const captionStats = countCaptionAudio(parts);

  console.log(JSON.stringify({
    ok: true,
    deletedLessonCount: deleted,
    lessonId: generated.lessonId,
    lessonTitle: lesson.body.title,
    status: generated.statusBody?.status,
    processingStep: generated.statusBody?.processing_step,
    partAudioPresence,
    captionCount: captionStats.captionCount,
    captionAudioCount: captionStats.captionAudioCount,
    singleVoiceOk: captionStats.captionAudioCount === 0,
  }));
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }));
  process.exit(1);
});
