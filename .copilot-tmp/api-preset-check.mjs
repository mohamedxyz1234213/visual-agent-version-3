const BASE = 'http://localhost:8000/api/v1';

const presets = [
  { mode: 'full_lesson', intent: 'teach' },
  { mode: 'visual_first', intent: 'teach' },
  { mode: 'step_by_step', intent: 'teach' },
  { mode: 'qa_mode', intent: 'practice' },
  { mode: 'text_focus', intent: 'notes' },
];

const text = 'Explain electric circuits with voltage, current, resistance, and Ohm\'s law using a simple series circuit example.';

const svgLikeActions = new Set([
  'draw_text',
  'draw_rect',
  'draw_circle',
  'draw_arrow',
  'draw_path',
  'draw_badge',
  'draw_callout',
  'draw_line',
  'show_equation',
  'draw_graph',
  'draw_coordinate_system',
  'draw_physics_shape',
  'draw_table',
]);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, init) {
  const response = await fetch(`${BASE}${path}`, init);
  if (!response.ok) {
    throw new Error(`${init?.method || 'GET'} ${path} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function createLesson(mode, intent) {
  return request('/explain/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      subject: 'Physics',
      user_instructions: 'Be accurate, non-duplicative, and visually concrete.',
      explanation_mode: mode,
      lesson_intent: intent,
      ai_provider: 'blaze',
      analysis_model: 'qwen3.6-plus-thinking',
    }),
  });
}

async function waitForLesson(id) {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    const status = await request(`/upload/status/${id}`);
    if (status.status === 'ready') return status;
    if (status.status === 'error') {
      throw new Error(`Lesson ${id} failed: ${status.error_message || 'unknown error'}`);
    }
    await wait(2000);
  }
  throw new Error(`Lesson ${id} timed out`);
}

function summarizeLesson(mode, intent, lesson) {
  const contentParts = lesson.parts.filter((part) => part.part_type === 'content');
  return {
    mode,
    intent,
    lessonId: lesson.id,
    seriesId: lesson.series_id,
    title: lesson.title,
    partTitles: contentParts.map((part) => part.title),
    partTypes: lesson.parts.map((part) => part.part_type),
    sceneCounts: contentParts.map((part) => part.scenes.length),
    sceneActionTypes: contentParts.map((part) => Array.from(new Set(part.scenes.map((scene) => scene.action_type))).slice(0, 10)),
    hasSvgLikeScenes: contentParts.every((part) => part.scenes.some((scene) => svgLikeActions.has(scene.action_type))),
    narrationPreview: contentParts.map((part) => String(part.narration || '').slice(0, 140)),
    lessonUrl: `http://localhost:3000/lesson/${lesson.id}`,
  };
}

const results = [];
for (const preset of presets) {
  const created = await createLesson(preset.mode, preset.intent);
  await waitForLesson(created.id);
  const lesson = await request(`/lessons/${created.id}`);
  results.push(summarizeLesson(preset.mode, preset.intent, lesson));
}

console.log(JSON.stringify(results, null, 2));