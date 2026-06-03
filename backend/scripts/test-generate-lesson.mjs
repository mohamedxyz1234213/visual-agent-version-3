// Generate a REAL lesson end-to-end against the running backend (port 8000):
// POST a topic → poll status → fetch full lesson → save to /tmp/lesson_<slug>.json.
// Then run `node scripts/test-real-lesson.mjs` (set LESSON=...) to grade it.
const BASE = process.env.BASE || 'http://localhost:8000/api/v1';
const TOPIC = process.env.TOPIC || 'How vaccines train the immune system';
const OUT = process.env.OUT || '/tmp/lesson_full.json';
const { writeFileSync } = await import('node:fs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log(`▶ generating lesson for: "${TOPIC}"`);
  const post = await fetch(`${BASE}/explain`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: TOPIC, explanation_mode: 'visual_first', lesson_intent: 'teach' }),
  });
  if (!post.ok) { console.error('POST failed', post.status, await post.text()); process.exit(1); }
  const { id } = await post.json();
  console.log(`  lesson id: ${id}`);

  let last = '';
  for (let i = 0; i < 180; i++) {
    await sleep(2500);
    const s = await fetch(`${BASE}/upload/status/${id}`).then((r) => r.json()).catch(() => ({}));
    if (s.processing_step && s.processing_step !== last) { last = s.processing_step; process.stdout.write(`  · ${last}\n`); }
    if (s.status === 'ready') break;
    if (s.status === 'error') { console.error('  ✗ error:', s.error_message); process.exit(1); }
  }

  const lesson = await fetch(`${BASE}/lessons/${id}`).then((r) => r.json());
  writeFileSync(OUT, JSON.stringify(lesson, null, 1));
  const parts = lesson.parts || [];
  const content = parts.filter((p) => p.part_type === 'content');
  const quiz = parts.filter((p) => p.part_type !== 'content');
  console.log(`✔ saved ${OUT}`);
  console.log(`  title: ${lesson.title}`);
  console.log(`  parts: ${parts.length} (${content.length} content, ${quiz.length} quiz)`);
  content.forEach((p) => {
    const sc = (p.scenes || []).filter((s) => !['camera', 'clear', 'draw_caption'].includes(s.action_type)).length;
    const caps = (p.scenes || []).filter((s) => s.action_type === 'draw_caption').length;
    console.log(`    · "${(p.title || '').slice(0, 36)}"  scenes=${sc} captions=${caps} dur=${p.duration_seconds}s`);
  });
  const q = quiz[0];
  if (q && q.quiz) console.log(`  quiz Qs: ${JSON.stringify((q.quiz.questions || []).map((x) => (x.question_text || '').slice(0, 60)))}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
