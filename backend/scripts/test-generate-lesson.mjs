// Generate a REAL lesson end-to-end against the running backend (port 8000):
// POST a topic → poll status → fetch full lesson → save to /tmp/lesson_<slug>.json.
// Then run `node scripts/test-real-lesson.mjs` (set LESSON=...) to grade it.
const BASE = process.env.BASE || 'http://localhost:8000/api/v1';
const TOPIC = process.env.TOPIC || 'How vaccines train the immune system';
const OUT = process.env.OUT || '/tmp/lesson_full.json';
const TOKEN = process.env.TEACHER_TOKEN || process.env.TOKEN || '';
const TOPICS = process.env.TOPICS
  ? process.env.TOPICS.split('||').map((topic) => topic.trim()).filter(Boolean)
  : [TOPIC];
const OUT_DIR = process.env.OUT_DIR || '/tmp/visual-agent-lessons';
const { mkdirSync, writeFileSync } = await import('node:fs');
const { join } = await import('node:path');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const authHeaders = TOKEN ? { authorization: `Bearer ${TOKEN}` } : {};

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'lesson';
}

async function generateLesson(topic, outputPath) {
  console.log(`▶ generating lesson for: "${topic}"`);
  const post = await fetch(`${BASE}/explain`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders },
    body: JSON.stringify({ text: topic, explanation_mode: 'visual_first', lesson_intent: 'teach' }),
  });
  if (!post.ok) throw new Error(`POST failed ${post.status}: ${await post.text()}`);
  const { id } = await post.json();
  console.log(`  lesson id: ${id}`);

  let last = '';
  let ready = false;
  for (let i = 0; i < 180; i++) {
    await sleep(2500);
    const s = await fetch(`${BASE}/upload/status/${id}`, { headers: authHeaders }).then((r) => r.json()).catch(() => ({}));
    if (s.processing_step && s.processing_step !== last) { last = s.processing_step; process.stdout.write(`  · ${last}\n`); }
    if (s.status === 'ready') { ready = true; break; }
    if (s.status === 'error') throw new Error(`generation failed: ${s.error_message || 'unknown error'}`);
  }
  if (!ready) throw new Error(`generation timed out for lesson ${id}`);

  const lessonResponse = await fetch(`${BASE}/lessons/${id}`, { headers: authHeaders });
  if (!lessonResponse.ok) throw new Error(`lesson fetch failed ${lessonResponse.status}: ${await lessonResponse.text()}`);
  const lesson = await lessonResponse.json();
  writeFileSync(outputPath, JSON.stringify(lesson, null, 1));
  const parts = lesson.parts || [];
  const content = parts.filter((p) => p.part_type === 'content');
  const quiz = parts.filter((p) => p.part_type !== 'content');
  console.log(`✔ saved ${outputPath}`);
  console.log(`  title: ${lesson.title}`);
  console.log(`  parts: ${parts.length} (${content.length} content, ${quiz.length} quiz)`);
  content.forEach((p) => {
    const sc = (p.scenes || []).filter((s) => !['camera', 'clear', 'draw_caption'].includes(s.action_type)).length;
    const caps = (p.scenes || []).filter((s) => s.action_type === 'draw_caption').length;
    console.log(`    · "${(p.title || '').slice(0, 36)}"  scenes=${sc} captions=${caps} dur=${p.duration_seconds}s`);
  });
  const q = quiz[0];
  if (q && q.quiz) console.log(`  quiz Qs: ${JSON.stringify((q.quiz.questions || []).map((x) => (x.question_text || '').slice(0, 60)))}`);
  return outputPath;
}

async function main() {
  if (!TOKEN) throw new Error('Set TEACHER_TOKEN (or TOKEN); /explain is authenticated.');
  mkdirSync(OUT_DIR, { recursive: true });
  const outputs = [];
  for (let index = 0; index < TOPICS.length; index++) {
    const topic = TOPICS[index];
    const outputPath = TOPICS.length === 1 ? OUT : join(OUT_DIR, `${String(index + 1).padStart(2, '0')}-${slug(topic)}.json`);
    outputs.push(await generateLesson(topic, outputPath));
  }
  console.log(`\n✔ generated ${outputs.length} authenticated lesson fixture(s)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
