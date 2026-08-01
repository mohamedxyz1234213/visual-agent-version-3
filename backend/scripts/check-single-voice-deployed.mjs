const BASE = process.env.BASE || 'https://backend-teaching.vercel.app';
const LESSON_ID = process.env.LESSON_ID || '6a6e6d1a98fe5cf3db6decb6';

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

async function main() {
  const login = await jsonFetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: 'teacher@test.com', password: '123456789' }),
  });

  if (login.status !== 200 || !login.body?.token) {
    console.log(JSON.stringify({ ok: false, stage: 'login', status: login.status, body: login.body }));
    process.exit(1);
  }

  const token = login.body.token;
  const lesson = await jsonFetch(`${BASE}/api/v1/lessons/${LESSON_ID}`, {
    headers: { cookie: `wb_session=${token}` },
  });

  if (lesson.status !== 200) {
    console.log(JSON.stringify({ ok: false, stage: 'lesson_fetch', status: lesson.status, body: lesson.body }));
    process.exit(1);
  }

  const parts = lesson.body.parts || [];
  const content = parts.filter((p) => p.part_type === 'content');
  const partAudioPresence = content.map((p) => Boolean(p.audio_url || p.audioUrl));

  let captionCount = 0;
  let captionAudioCount = 0;
  for (const p of content) {
    for (const s of (p.scenes || [])) {
      if (s.action_type !== 'draw_caption') continue;
      captionCount += 1;
      if (s.payload?.audioUrl || s.payload?.audio_url) captionAudioCount += 1;
    }
  }

  console.log(JSON.stringify({
    ok: true,
    lessonId: LESSON_ID,
    contentParts: content.length,
    partAudioPresence,
    captionCount,
    captionAudioCount,
  }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
