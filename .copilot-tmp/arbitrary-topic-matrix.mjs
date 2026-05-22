import { planLessonSeries } from '../backend/src/services/aiPlanner.js';

const cases = [
  ['Explain mitosis with chromosomes, spindle fibers, and daughter cells.', 'visual_first'],
  ['Explain blockchain consensus with validators, blocks, and transactions.', 'visual_first'],
  ['Explain supply and demand with equilibrium, shortages, and surplus.', 'visual_first'],
  ['Explain the French Revolution through causes, phases, and outcomes.', 'visual_first'],
  ['Explain the water cycle with evaporation, condensation, and precipitation.', 'visual_first'],
];

function splitSentences(text) {
  return String(text || '')
    .split(/[.!?]\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function sceneSignature(part) {
  return (part.visual_sequence || [])
    .slice(0, 18)
    .map((scene) => `${scene.type}:${String(scene.content || scene.label || scene.title || scene.object_type || scene.shape_type || '').slice(0, 36)}`)
    .join(' | ');
}

for (const [topic, mode] of cases) {
  const { firstLesson } = await planLessonSeries(
    topic,
    'Be concrete and visual.',
    'qwen3.6-plus-thinking',
    null,
    'blaze',
    mode,
    'topic',
    'teach',
  );

  const contentParts = firstLesson.parts.filter((part) => part.part_type === 'content');
  const allNarration = contentParts.map((part) => part.narration || '').join(' ');

  console.log(JSON.stringify({
    topic,
    title: firstLesson.title,
    partTitles: contentParts.map((part) => part.title),
    headers: contentParts.flatMap((part) =>
      (part.visual_sequence || [])
        .filter((scene) => scene.type === 'draw_text' && Array.isArray(scene.position) && scene.position[1] <= 50)
        .map((scene) => scene.content)
    ).slice(0, 8),
    hasObject: contentParts.some((part) => (part.visual_sequence || []).some((scene) => scene.type === 'draw_object')),
    objectTypes: Array.from(new Set(contentParts.flatMap((part) =>
      (part.visual_sequence || [])
        .filter((scene) => scene.type === 'draw_object')
        .map((scene) => scene.object_type)
    ))),
    hasGraph: contentParts.some((part) => (part.visual_sequence || []).some((scene) => scene.type === 'draw_graph')),
    hasCoordinateSystem: contentParts.some((part) => (part.visual_sequence || []).some((scene) => scene.type === 'draw_coordinate_system')),
    sceneCounts: contentParts.map((part) => (part.visual_sequence || []).length),
    sceneTypes: contentParts.map((part) => Array.from(new Set((part.visual_sequence || []).map((scene) => scene.type))).slice(0, 12)),
    sceneSignature: contentParts.map(sceneSignature),
    genericPhraseHits: splitSentences(allNarration).filter((sentence) => /core element|concrete elements used to explain|visible anchors inside|coordinated system|bigger idea/i.test(sentence)).slice(0, 8),
    firstNarration: splitSentences(contentParts[0]?.narration || '').slice(0, 5),
  }, null, 2));
}
