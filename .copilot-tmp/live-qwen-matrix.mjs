import { planLessonSeries } from '../backend/src/services/aiPlanner.js';

const cases = [
  { topic: "Explain Newton's second law with a ramp example and force diagram.", mode: 'full_lesson', intent: 'teach' },
  { topic: "Explain Newton's second law with a ramp example and force diagram.", mode: 'visual_first', intent: 'teach' },
  { topic: "Explain Newton's second law with a ramp example and force diagram.", mode: 'step_by_step', intent: 'teach' },
  { topic: "Explain Newton's second law with a ramp example and force diagram.", mode: 'qa_mode', intent: 'practice' },
  { topic: "Explain Newton's second law with a ramp example and force diagram.", mode: 'text_focus', intent: 'notes' },
  { topic: 'Explain photosynthesis using chloroplasts, light-dependent reactions, and glucose production.', mode: 'full_lesson', intent: 'teach' },
  { topic: 'Explain photosynthesis using chloroplasts, light-dependent reactions, and glucose production.', mode: 'visual_first', intent: 'teach' },
  { topic: 'Explain photosynthesis using chloroplasts, light-dependent reactions, and glucose production.', mode: 'step_by_step', intent: 'teach' },
  { topic: 'Explain photosynthesis using chloroplasts, light-dependent reactions, and glucose production.', mode: 'qa_mode', intent: 'practice' },
  { topic: 'Explain photosynthesis using chloroplasts, light-dependent reactions, and glucose production.', mode: 'text_focus', intent: 'notes' },
];

for (const testCase of cases) {
  const { firstLesson } = await planLessonSeries(
    testCase.topic,
    '',
    'qwen3.6-plus-thinking',
    null,
    'blaze',
    testCase.mode,
    'topic',
    testCase.intent,
  );

  const contentParts = firstLesson.parts.filter((part) => part.part_type === 'content');
  const topHeaders = contentParts.flatMap((part) =>
    (part.visual_sequence || [])
      .filter((scene) => scene.type === 'draw_text' && Array.isArray(scene.position) && scene.position[1] <= 50)
      .map((scene) => scene.content)
  ).slice(0, 8);

  console.log(JSON.stringify({
    topic: testCase.topic,
    mode: testCase.mode,
    intent: testCase.intent,
    title: firstLesson.title,
    summaryWords: (firstLesson.summary || '').split(/\s+/).filter(Boolean).length,
    contentWords: contentParts.map((part) => (part.narration || '').split(/\s+/).filter(Boolean).length),
    titles: contentParts.map((part) => part.title),
    topHeaders,
    hasPromptEcho: /^(explain|teach|describe)\b/i.test(firstLesson.summary || '') || contentParts.some((part) => /understanding explain/i.test(part.title || '')),
    hasMetaLeak: /visual first|lesson intent|student guidance|teaching sequence/i.test(JSON.stringify(firstLesson)),
  }));
}
