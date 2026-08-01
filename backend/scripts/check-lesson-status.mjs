import http from 'node:http';

function req({ method = 'GET', path = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port: 8000, method, path, headers }, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

async function main() {
  const loginBody = JSON.stringify({ identifier: 'teacher@test.com', password: '123456789' });
  const login = await req({
    method: 'POST',
    path: '/api/v1/auth/login',
    headers: {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(loginBody),
    },
    body: loginBody,
  });
  const token = JSON.parse(login.body).token;

  const payload = JSON.stringify({
    text: 'Arrays versus linked lists in data structures and when to choose each.',
    explanation_mode: 'full_lesson',
    lesson_intent: 'teach',
  });

  const created = await req({
    method: 'POST',
    path: '/api/v1/explain',
    headers: {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload),
      cookie: `wb_session=${token}`,
    },
    body: payload,
  });

  const lessonId = JSON.parse(created.body).id;
  console.log('lesson_id', lessonId);

  for (let i = 1; i <= 30; i++) {
    const statusRes = await req({
      method: 'GET',
      path: `/api/v1/upload/status/${lessonId}`,
      headers: { cookie: `wb_session=${token}` },
    });
    const state = JSON.parse(statusRes.body);
    console.log(`poll ${i}: ${state.status} | ${state.processing_step} | parts=${state.parts_count}`);
    if (state.status === 'ready' || state.status === 'error') {
      console.log(JSON.stringify(state));
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
