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
if (createRes.ok === false) {
  console.error(JSON.stringify(created, null, 2));
  process.exit(1);
}

let status = null;
for (let attempt = 0; attempt < 180; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const statusRes = await fetch(`http://localhost:8000/api/v1/upload/status/${created.id}`);
  status = await statusRes.json();
  if (status.status === 'ready' || status.status === 'error') {
    break;
  }
}

if (!status || status.status !== 'ready') {
  console.error(JSON.stringify(status, null, 2));
  process.exit(2);
}

const lessonRes = await fetch(`http://localhost:8000/api/v1/lessons/${created.id}`);
const lesson = await lessonRes.json();
const contentParts = lesson.parts.filter((part) => part.part_type === 'content');
console.log(JSON.stringify({
  lessonId: created.id,
  title: lesson.title,
  durations: contentParts.map((part) => part.duration_seconds),
  partTitles: contentParts.map((part) => part.title),
  contentWords: contentParts.map((part) => (part.narration || '').split(/\s+/).filter(Boolean).length),
}, null, 2));
