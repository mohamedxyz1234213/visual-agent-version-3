const payload = {
  text: 'Explain electric circuits with voltage, current, resistance, and a simple series circuit.',
  user_instructions: 'Keep it teacher-like and concrete.',
  ai_provider: 'blaze',
  analysis_model: 'qwen3.6-plus-thinking',
  explanation_mode: 'visual_first',
  lesson_intent: 'teach',
};

const createRes = await fetch('http://localhost:8000/api/v1/explain/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const created = await createRes.json();
if (!createRes.ok) {
  console.error(JSON.stringify(created, null, 2));
  process.exit(1);
}

const lessonId = created.id;
console.log(JSON.stringify({ lessonId, status: created.status }, null, 2));

let status = null;
for (let attempt = 0; attempt < 180; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const statusRes = await fetch(`http://localhost:8000/api/v1/upload/status/${lessonId}`);
  status = await statusRes.json();
  if (status.status === 'ready' || status.status === 'error') {
    break;
  }
}

console.log(JSON.stringify(status, null, 2));
if (!status || status.status !== 'ready') {
  process.exit(2);
}

const lessonRes = await fetch(`http://localhost:8000/api/v1/lessons/${lessonId}`);
const lesson = await lessonRes.json();
const contentParts = lesson.parts.filter((part) => part.part_type === 'content');
console.log(JSON.stringify({
  title: lesson.title,
  summary: lesson.summary,
  partTitles: contentParts.map((part) => part.title),
  contentWords: contentParts.map((part) => (part.narration || '').split(/\s+/).filter(Boolean).length),
  firstPartSample: (contentParts[0]?.narration || '').slice(0, 280),
}, null, 2));
