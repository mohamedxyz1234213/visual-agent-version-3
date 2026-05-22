import { planLessonSeries } from '../backend/src/services/aiPlanner.js';

const { firstLesson } = await planLessonSeries(
  'Explain electric circuits with voltage, current, resistance, and a simple series circuit.',
  'Keep it teacher-like, accurate, and visually concrete.',
  'qwen3.6-plus-thinking',
  null,
  'blaze',
  'full_lesson',
  'topic',
  'teach',
);

const parts = firstLesson.parts
  .filter((part) => part.part_type === 'content')
  .map((part) => ({
    title: part.title,
    sentences: String(part.narration || '')
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean),
  }));

const counts = new Map();
for (const part of parts) {
  for (const sentence of part.sentences) {
    const key = sentence.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
}

const duplicates = [...counts.entries()]
  .filter(([, count]) => count > 1)
  .map(([sentence, count]) => ({ count, sentence }))
  .sort((left, right) => right.count - left.count || left.sentence.localeCompare(right.sentence));

console.log(JSON.stringify({ parts, duplicates }, null, 2));
