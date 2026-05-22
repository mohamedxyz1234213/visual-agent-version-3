import { planLessonSeries } from '../backend/src/services/aiPlanner.js';

const runs = [
  ['Explain Newton\'s second law with a ramp example and force diagram.', 'visual_first'],
  ['Explain photosynthesis through chloroplasts, light-dependent reactions, and glucose production.', 'text_focus'],
  ['Explain cosine as adjacent over hypotenuse, then connect it to the unit circle.', 'step_by_step'],
  ['Explain electric circuits with voltage, current, resistance, and a simple series circuit.', 'visual_first'],
];

for (const [topic, mode] of runs) {
  const { firstLesson } = await planLessonSeries(
    topic,
    'Keep it teacher-like and concrete.',
    'qwen3.6-plus-thinking',
    null,
    'blaze',
    mode,
    'topic',
    'teach',
  );

  const contentParts = firstLesson.parts.filter((part) => part.part_type === 'content');
  console.log(JSON.stringify({
    topic,
    mode,
    title: firstLesson.title,
    partTitles: contentParts.map((part) => part.title),
    contentWords: contentParts.map((part) => (part.narration || '').split(/\s+/).filter(Boolean).length),
  }, null, 2));
}
