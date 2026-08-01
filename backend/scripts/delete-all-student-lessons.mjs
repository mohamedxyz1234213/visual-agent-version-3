const BASE = process.env.BASE || 'https://backend-teaching.vercel.app';
const IDENTIFIER = process.env.LOGIN_IDENTIFIER || 'student@test.com';
const PASSWORD = process.env.LOGIN_PASSWORD || '12345678';

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

async function main() {
  const token = await login();
  const list = await jsonFetch(`${BASE}/api/v1/lessons`, {
    headers: { cookie: `wb_session=${token}` },
  });

  if (list.status !== 200) {
    throw new Error(`List lessons failed: ${list.status} ${JSON.stringify(list.body)}`);
  }

  const lessons = Array.isArray(list.body) ? list.body : [];
  let deleted = 0;

  for (const lesson of lessons) {
    const res = await jsonFetch(`${BASE}/api/v1/lessons/${lesson.id}`, {
      method: 'DELETE',
      headers: { cookie: `wb_session=${token}` },
    });

    if (res.status === 204 || res.status === 200 || res.status === 404) {
      deleted += 1;
    }
  }

  console.log(JSON.stringify({ ok: true, deletedCount: deleted, remainingCount: lessons.length - deleted }));
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }));
  process.exit(1);
});
