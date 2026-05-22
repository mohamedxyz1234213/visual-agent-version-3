const BASE = 'http://localhost:8000/api/v1';

const cases = [
  { topic: 'Explain mitosis with chromosomes, spindle fibers, and daughter cells.', mode: 'visual_first', intent: 'teach' },
  { topic: 'Explain blockchain consensus with validators, blocks, and transactions.', mode: 'visual_first', intent: 'teach' },
  { topic: 'Explain supply and demand with equilibrium, shortages, and surplus.', mode: 'visual_first', intent: 'teach' },
  { topic: 'Explain the French Revolution through causes, phases, and outcomes.', mode: 'visual_first', intent: 'teach' },
  { topic: 'Explain the water cycle with evaporation, condensation, and precipitation.', mode: 'visual_first', intent: 'teach' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, init) {
  const response = await fetch(`${BASE}${path}`, init);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${init?.method || 'GET'} ${path} failed: ${response.status} ${response.statusText} ${JSON.stringify(data)}`);
  }
  return data;
}

function splitSentences(text) {
  return String(text || '').split(/[.!?]\s+/).map((s) => s.trim()).filter(Boolean);
}

function summarizeLesson(topic, lesson) {
  const contentParts = lesson.parts.filter((part) => part.part_type === 'content');
  const allNarration = contentParts.map((part) => part.narration || '').join(' ');
  const allScenes = contentParts.flatMap((part) => part.scenes || []);
  const headers = contentParts.flatMap((part) =>
    (part.scenes || [])
      .filter((scene) => scene.action_type === 'draw_text' && Array.isArray(scene.payload?.position) && scene.payload.position[1] <= 50)
      .map((scene) => scene.payload?.content)
  ).slice(0, 8);

  return {
    topic,
    lessonId: lesson.id,
    title: lesson.title,
    partTitles: contentParts.map((part) => part.title),
    headers,
    sceneCounts: contentParts.map((part) => (part.scenes || []).length),
    hasDrawObject: allScenes.some((scene) => scene.action_type === 'draw_object'),
    objectTypes: Array.from(new Set(allScenes.filter((scene) => scene.action_type === 'draw_object').map((scene) => scene.payload?.object_type))).filter(Boolean),
    hasTimelineLike: allScenes.some((scene) => scene.action_type === 'draw_path') && allScenes.some((scene) => scene.action_type === 'draw_circle'),
    hasEconomicsGraphLike: allScenes.some((scene) => scene.action_type === 'draw_line') && allScenes.some((scene) => scene.action_type === 'draw_table'),
    genericPhraseHits: splitSentences(allNarration)
      .filter((s) => /core element|visible anchors inside|concrete elements used to explain|bigger idea/i.test(s))
      .slice(0, 6),
    lessonUrl: `http://localhost:3000/lesson/${lesson.id}`,
  };
}

const results = [];
for (const testCase of cases) {
  const created = await request('/explain/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: testCase.topic,
      user_instructions: 'Be highly visual, accurate, and avoid templated phrasing.',
      explanation_mode: testCase.mode,
      lesson_intent: testCase.intent,
      ai_provider: 'blaze',
      analysis_model: 'qwen3.6-plus-thinking',
    }),
  });

  for (let i = 0; i < 180; i += 1) {
    const status = await request(`/upload/status/${created.id}`);
    if (status.status === 'ready') {
      break;
    }
    if (status.status === 'error') {
      throw new Error(`Lesson ${created.id} failed: ${status.error_message || 'unknown error'}`);
    }
    await sleep(2000);
  }

  const lesson = await request(`/lessons/${created.id}`);
  results.push(summarizeLesson(testCase.topic, lesson));
}

console.log(JSON.stringify(results, null, 2));
