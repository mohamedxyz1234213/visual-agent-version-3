const cases = [
  {
    topic: "Explain Newton's second law with a ramp example and force diagram.",
    mode: 'visual_first',
    intent: 'teach',
    guidance: 'Use a clear force diagram and keep the explanation teacher-like.',
  },
  {
    topic: 'Explain photosynthesis using chloroplasts, light-dependent reactions, and glucose production.',
    mode: 'text_focus',
    intent: 'notes',
    guidance: 'Write concise but complete study notes with clean structure.',
  },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

for (const testCase of cases) {
  const createRes = await fetch('http://localhost:8000/api/v1/explain/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: testCase.topic,
      user_instructions: testCase.guidance,
      explanation_mode: testCase.mode,
      ai_provider: 'blaze',
      analysis_model: 'qwen3.6-plus-thinking',
      lesson_intent: testCase.intent,
    }),
  });

  const created = await createRes.json();
  const lessonId = created.id;
  const startedAt = Date.now();
  let lesson = null;

  while (Date.now() - startedAt < 480000) {
    await sleep(5000);
    const lessonRes = await fetch(`http://localhost:8000/api/v1/lessons/${lessonId}`);
    lesson = await lessonRes.json();
    if (lesson.status === 'ready' || lesson.status === 'error') break;
  }

  console.log(JSON.stringify({
    topic: testCase.topic,
    mode: testCase.mode,
    intent: testCase.intent,
    id: lessonId,
    status: lesson?.status,
    title: lesson?.title,
    summary: lesson?.summary,
    partTitles: lesson?.parts?.map((part) => part.title) || [],
  }));
}
