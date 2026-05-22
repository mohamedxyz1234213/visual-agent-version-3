import { planLessonSeries } from '../backend/src/services/aiPlanner.js';

const cases = [
  { topic: "Ohm's law", mode: 'full_lesson', intent: 'teach' },
  { topic: "Ohm's law", mode: 'visual_first', intent: 'teach' },
  { topic: "Ohm's law", mode: 'step_by_step', intent: 'teach' },
  { topic: "Ohm's law", mode: 'qa_mode', intent: 'practice' },
  { topic: "Ohm's law", mode: 'text_focus', intent: 'notes' },
  { topic: 'DevOps workflow', mode: 'full_lesson', intent: 'teach' },
  { topic: 'DevOps workflow', mode: 'visual_first', intent: 'teach' },
  { topic: 'DevOps workflow', mode: 'step_by_step', intent: 'teach' },
  { topic: 'DevOps workflow', mode: 'qa_mode', intent: 'practice' },
  { topic: 'DevOps workflow', mode: 'text_focus', intent: 'notes' },
];

for (const testCase of cases) {
  const { firstLesson } = await planLessonSeries(
    testCase.topic,
    '',
    null,
    null,
    null,
    testCase.mode,
    'topic',
    testCase.intent,
  );

  const contentParts = firstLesson.parts.filter((part) => part.part_type === 'content');
  const sceneTexts = contentParts.flatMap((part) =>
    part.visual_sequence.map((scene) => scene.content || scene.label || scene.title || scene.latex || '').filter(Boolean)
  );
  const topHeaders = contentParts.flatMap((part) =>
    part.visual_sequence
      .filter((scene) => scene.type === 'draw_text' && Array.isArray(scene.position) && scene.position[1] <= 50)
      .map((scene) => scene.content)
  ).slice(0, 10);

  console.log(JSON.stringify({
    topic: testCase.topic,
    mode: testCase.mode,
    intent: testCase.intent,
    hasVisualFirst: /visual first/i.test(JSON.stringify(firstLesson)),
    hasCycle: sceneTexts.some((text) => /^Cycle:/i.test(text)),
    hasExamples: sceneTexts.some((text) => /^Examples:/i.test(text)),
    visualStepCounts: contentParts.map((part) => part.visual_sequence.length),
    topHeaders,
    firstNarration: contentParts[0]?.narration?.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ') || '',
    firstConcepts: contentParts[0]?.key_concepts?.slice(0, 4) || [],
  }));
}
