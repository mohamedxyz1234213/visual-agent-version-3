const BASE = process.env.BASE || 'https://backend-teaching.vercel.app';

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function main() {
  const login = await jsonFetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier: 'teacher@test.com', password: '123456789' }),
  });

  console.log('login_status', login.status);
  if (login.status !== 200) {
    console.log('login_body', JSON.stringify(login.body).slice(0, 500));
    process.exit(1);
  }

  const token = login.body?.token;
  const explain = await jsonFetch(`${BASE}/api/v1/explain`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: `wb_session=${token}`,
    },
    body: JSON.stringify({
      text: 'Explain breadth-first search and depth-first search with a practical graph example.',
      lesson_intent: 'teach',
      explanation_mode: 'full_lesson',
      ai_provider: 'openrouter',
    }),
  });

  console.log('explain_status', explain.status);
  console.log('explain_body', JSON.stringify(explain.body).slice(0, 500));
  if (explain.status !== 202) {
    process.exit(1);
  }

  const lessonId = explain.body.id;
  for (let i = 1; i <= 50; i += 1) {
    const status = await jsonFetch(`${BASE}/api/v1/upload/status/${lessonId}`, {
      headers: { cookie: `wb_session=${token}` },
    });
    const s = status.body;
    console.log(`poll ${i}: ${s?.status} / ${s?.processing_step} / parts=${s?.parts_count}`);
    if (s?.status === 'ready' || s?.status === 'error') {
      console.log('final', JSON.stringify(s));
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
