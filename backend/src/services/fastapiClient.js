const FASTAPI_BASE_URL = (process.env.FASTAPI_BASE_URL || 'http://localhost:8001').replace(/\/+$/, '');
const FASTAPI_API_KEY = process.env.FASTAPI_API_KEY || '';

async function request(method, path, body = null) {
  const url = `${FASTAPI_BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (FASTAPI_API_KEY) headers['Authorization'] = `Bearer ${FASTAPI_API_KEY}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`FastAPI ${res.status} on ${method} ${path}: ${text.slice(0, 200)}`);
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export async function startSession(data = {}) {
  return request('POST', '/session/start', data);
}

export async function processVoice(audioData) {
  return request('POST', '/voice', audioData);
}

export async function submitCode(code, exerciseId) {
  return request('POST', '/code', { code, exercise_id: exerciseId });
}

export async function getState() {
  return request('GET', '/state');
}

export default { startSession, processVoice, submitCode, getState };
