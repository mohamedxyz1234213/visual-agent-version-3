import { planLessonSeries } from '../backend/src/services/aiPlanner.js';

const topics = [
  {
    label: 'newton',
    text: "Explain Newton's second law with a ramp example and force diagram.",
  },
  {
    label: 'photosynthesis',
    text: 'Explain photosynthesis using chloroplasts, light-dependent reactions, and glucose production.',
  },
  {
    label: 'cosine',
    text: 'Explain cosine as adjacent over hypotenuse, then connect it to the unit circle.',
  },
  {
    label: 'circuits',
    text: 'Explain electric circuits with voltage, current, resistance, and a simple series circuit.',
  },
];

const presets = [
  { mode: 'full_lesson', intent: 'teach' },
  { mode: 'visual_first', intent: 'teach' },
  { mode: 'step_by_step', intent: 'teach' },
  { mode: 'qa_mode', intent: 'practice' },
  { mode: 'text_focus', intent: 'notes' },
];

function words(text) {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

function sentenceStats(text) {
  const parts = String(text || '')
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const seen = new Set();
  let duplicates = 0;
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) duplicates += 1;
    seen.add(key);
  }
  return { total: parts.length, duplicates };
}

function sceneSignature(part) {
  return (part.visual_sequence || [])
    .slice(0, 18)
    .map((scene) => `${scene.type}:${String(scene.content || scene.label || scene.latex || scene.shape_type || '').slice(0, 40)}`)
    .join(' | ');
}

for (const topic of topics) {
  for (const preset of presets) {
    const { firstLesson } = await planLessonSeries(
      topic.text,
      'Keep it teacher-like, accurate, and visually concrete.',
      'qwen3.6-plus-thinking',
      null,
      'blaze',
      preset.mode,
      'topic',
      preset.intent,
    );

    const contentParts = firstLesson.parts.filter((part) => part.part_type === 'content');
    const allNarration = contentParts.map((part) => part.narration || '').join(' ');
    const duplicateInfo = sentenceStats(allNarration);
    const headers = contentParts.flatMap((part) =>
      (part.visual_sequence || [])
        .filter((scene) => scene.type === 'draw_text' && Array.isArray(scene.position) && scene.position[1] <= 50)
        .map((scene) => scene.content)
    ).slice(0, 12);

    console.log(JSON.stringify({
      topic: topic.label,
      mode: preset.mode,
      intent: preset.intent,
      title: firstLesson.title,
      summaryWords: words(firstLesson.summary),
      contentWords: contentParts.map((part) => words(part.narration)),
      durations: contentParts.map((part) => part.duration_seconds),
      titles: contentParts.map((part) => part.title),
      duplicateSentences: duplicateInfo.duplicates,
      hasMetaLeak: /visual first|lesson intent|student guidance|teaching sequence/i.test(JSON.stringify(firstLesson)),
      hasPromptEcho: /^(explain|teach|describe)\b/i.test(firstLesson.summary || '') || contentParts.some((part) => /understanding explain/i.test(part.title || '')),
      hasRelationshipLeak: /connects to|connected to/i.test(allNarration),
      sceneCounts: contentParts.map((part) => (part.visual_sequence || []).length),
      headers,
      sceneSignature: contentParts.map(sceneSignature),
      sample: (contentParts[0]?.narration || '').slice(0, 220),
    }));
  }
}
