import 'dotenv/config';

const BASE = 'http://localhost:8001/api/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(email, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json();
  return j.token || j.accessToken || j.data?.token;
}

async function main() {
  const token = await login('teacher@test.com', '123456789');
  if (!token) { console.log('LOGIN FAILED'); return; }
  const auth = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  const start = Date.now();
  const create = await fetch(`${BASE}/explain`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ text: 'Explain what an array is in JavaScript with a simple example.' }),
  });
  const created = await create.json();
  console.log('created:', created.id, 'status', created.status);
  const lessonId = created.id;

  // Poll status every 10s for up to 8 min. The lesson should advance step by
  // step as the server self-triggers fresh invocations.
  const seen = new Set();
  for (let i = 0; i < 48; i++) {
    await sleep(10_000);
    const sr = await fetch(`${BASE}/upload/status/${lessonId}`, { headers: auth });
    const s = await sr.json();
    if (!seen.has(s.processing_step)) { seen.add(s.processing_step); console.log(`[${((Date.now()-start)/1000).toFixed(0)}s] step=${s.processing_step} parts=${s.parts_count} status=${s.status}`); }
    if (s.status === 'ready') {
      console.log('READY after', ((Date.now()-start)/1000).toFixed(0), 's, parts:', s.parts_count);
      // verify parts have audio
      const lr = await fetch(`${BASE}/lessons/${lessonId}`, { headers: auth });
      const l = await lr.json();
      const withAudio = (l.parts || []).filter((p) => p.audio_url || p.audioUrl || p.narration).length;
      console.log('parts with audio/narration:', withAudio, '/', (l.parts || []).length);
      return;
    }
    if (s.status === 'error') {
      console.log('ERROR:', s.error_message);
      return;
    }
    if (i % 6 === 5) console.log(`...still ${s.status} at step ${s.processing_step} (${((Date.now()-start)/1000).toFixed(0)}s)`);
  }
  console.log('TIMEOUT waiting for lesson');
}

await main();
process.exit(0);