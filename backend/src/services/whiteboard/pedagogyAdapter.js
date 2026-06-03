// -----------------------------------------------------------------------------
// Pedagogy → Pscenes adapter
// -----------------------------------------------------------------------------
// Bridges the AI's lesson plan (part-level semantic data) into the concrete
// `pscene` list consumed by the scene composer / template library.
//
// A `pscene` = { intent, goal, title?, data:{...slots}, focus?, template? }
//
// The AI is asked to emit a `board_scenes` array per part. Each board scene is:
//   {
//     intent: "define|compare|process|hierarchy|timeline|cause|data|cluster|
//              cycle|example|recap|formula|map",
//     goal: "what this board teaches (short)",
//     headline / statement / concept / ...   (intent-specific slot fields)
//     points: [...] | steps: [...] | columns: [...] | ...
//     focus: "optional area to zoom"
//   }
//
// If the model omits board_scenes, we degrade gracefully by deriving boards from
// `visual_logic` + narration so a lesson is never empty.
// -----------------------------------------------------------------------------

import { normalizeIntent } from './sceneComposer.js';

function asArray(v) {
  if (Array.isArray(v)) return v.filter((x) => x !== null && x !== undefined && x !== '');
  if (v === null || v === undefined || v === '') return [];
  return [v];
}

function str(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.text || v.title || v.content || v.label || '';
  return String(v);
}

// Map a single AI board scene object into a normalized pscene.
function normalizeBoardScene(b) {
  if (!b || typeof b !== 'object') return null;
  const intent = normalizeIntent(b.intent || b.type || b.semantic_role);
  const goal = str(b.goal || b.objective || b.title || b.scene_goal);

  // The spoken teacher line for this beat (narration), and its word count. The
  // composer uses `weight` to size this board's on-screen window so the drawing
  // advances in lockstep with the voice. `say` is NOT a drawn slot.
  const say = str(b.say || b.narration || b.spoken);
  const weight = say ? say.split(/\s+/).filter(Boolean).length : 0;

  // Pass through ALL slot-bearing fields; templates pick what they need and
  // ignore the rest. We just normalize obvious arrays/objects. Spoken/meta
  // fields are excluded so they never leak into drawn slots.
  const data = {};
  for (const [k, v] of Object.entries(b)) {
    if (['intent', 'type', 'semantic_role', 'goal', 'objective', 'focus', 'template', 'say', 'narration', 'spoken', 'segment'].includes(k)) continue;
    data[k] = v;
  }

  // Normalize nested item arrays so {title,detail} shapes survive.
  const normItems = (arr) => asArray(arr).map((it) => {
    if (it && typeof it === 'object') return it;
    return it;
  });
  for (const key of ['points', 'items', 'steps', 'children', 'events', 'links', 'cards', 'terms', 'satellites', 'stages', 'tiers', 'pillars', 'annotations', 'labels', 'corners', 'stats', 'tiles', 'beats', 'columns', 'cells', 'markers', 'layers', 'branches', 'notes', 'pros', 'cons']) {
    if (data[key] !== undefined) data[key] = normItems(data[key]);
  }

  return {
    intent,
    goal,
    say: say || undefined,
    weight: weight || undefined,
    segment: str(b.segment) || undefined,
    title: str(b.title) || undefined,
    data,
    focus: str(b.focus) || undefined,
    template: typeof b.template === 'string' ? b.template : undefined,
  };
}

// Pick a "how it works" intent from content cues so the middle of the lesson
// isn't always the same template. Looks at visual_logic + narration for signals.
function pickRelationIntent(part, vl, corpus) {
  const cue = (vl.map((e) => str(e?.relationship) + ' ' + str(e?.type) + ' ' + str(e?.semantic_role)).join(' ') + ' ' + corpus).toLowerCase();
  if (/\bcompar|versus|\bvs\b|differ|contrast|pros|cons\b/.test(cue)) return 'compare';
  if (/\bcaus|effect|because|leads to|result|consequen|impact\b/.test(cue)) return 'cause';
  if (/\bcycle|loop|repeat|feedback|recurr|iterat\b/.test(cue)) return 'cycle';
  if (/\btimeline|history|year|era|chronolog|over time|stage\b/.test(cue)) return 'timeline';
  if (/\bhierarch|layer|level|structure|tree|categor|class\b/.test(cue)) return 'hierarchy';
  if (/\bformula|equation|calcul|=|theorem\b/.test(cue)) return 'formula';
  return 'process';
}

// Derive pscenes from legacy visual_logic when board_scenes is missing.
// Builds a teaching arc with intents chosen from content cues AND a content hash
// so different parts never all get define→process→recap.
function deriveFromVisualLogic(part) {
  const vl = asArray(part.visual_logic);
  const concepts = asArray(part.key_concepts).map(str).filter(Boolean);
  const narration = str(part.narration);
  const sentences = narration.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 12);
  const corpus = `${str(part.title)} ${narration}`;
  const title = str(part.title);
  const relIntent = pickRelationIntent(part, vl, corpus);
  const arcSeed = (title + narration).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const arcVariant = Math.abs(arcSeed) % 4;

  const pscenes = [];

  // Arc variants — each opens differently and uses different middle beats.
  const openers = [
    { segment: 'hook', intent: 'recap', goal: 'spark curiosity', data: { statement: str(part.scene_goal || title), sub: sentences[0] || '' } },
    { segment: 'core', intent: 'define', goal: 'core concept', data: { concept: title, headline: concepts[0] || title, definition: sentences[0] || '', points: concepts.slice(0, 4) } },
    { segment: 'core', intent: 'map', goal: 'visual anchor', data: { headline: title, concept: concepts[0] || title, labels: concepts.slice(0, 4), points: concepts.slice(0, 3) } },
    { segment: 'hook', intent: 'cause', goal: 'why it matters', data: { center: title, items: concepts.slice(0, 3).map((c) => ({ title: c, detail: sentences[1] || '' })) } },
  ];
  pscenes.push(openers[arcVariant % openers.length]);

  const middles = [
    { segment: 'mechanism', intent: relIntent, goal: 'how it works', data: { steps: concepts.slice(0, 4).map((c, i) => ({ title: str(c).split(' ').slice(0, 5).join(' '), detail: sentences[i + 1] || '' })), center: title } },
    { segment: 'mechanism', intent: 'cluster', goal: 'connected ideas', data: { center: title, items: concepts.slice(0, 5).map((c) => ({ title: c, detail: '' })) } },
    { segment: 'mechanism', intent: 'formula', goal: 'formal view', data: { formula: concepts[0] || title, terms: concepts.slice(0, 3).map((c) => ({ symbol: str(c).split(' ')[0], meaning: c })) } },
    { segment: 'mechanism', intent: 'data', goal: 'quantitative view', data: { stats: concepts.slice(0, 4).map((c) => ({ label: c, value: '' })), points: concepts.slice(0, 3) } },
  ];
  pscenes.push(middles[(arcVariant + 1) % 4]);

  if (concepts.length >= 2 || sentences.length >= 4) {
    const closers = [
      { segment: 'example', intent: 'compare', goal: 'contrast', data: { columns: [{ title: str(concepts[0] || 'A'), items: sentences.slice(1, 4).map((s) => str(s).split(' ').slice(0, 7).join(' ')) }, { title: str(concepts[1] || 'B'), items: sentences.slice(4, 7).map((s) => str(s).split(' ').slice(0, 7).join(' ')) }] } },
      { segment: 'example', intent: 'example', goal: 'in practice', data: { problem: sentences[2] || `Applying ${title}`, steps: sentences.slice(2, 6).map((s) => ({ text: str(s).split(' ').slice(0, 12).join(' ') })) } },
      { segment: 'reinforcement', intent: 'cycle', goal: 'recurring pattern', data: { stages: concepts.slice(0, 4).map((c) => ({ title: c })) } },
      { segment: 'reinforcement', intent: 'hierarchy', goal: 'structure', data: { root: title, children: concepts.slice(0, 4).map((c) => ({ title: c })) } },
    ];
    pscenes.push(closers[(arcVariant + 2) % 4]);
  }

  pscenes.push({
    segment: 'recap',
    intent: 'recap',
    goal: 'recap',
    data: { points: (concepts.length ? concepts : sentences).slice(0, 4).map(str) },
  });

  const n = pscenes.length;
  pscenes.forEach((ps, i) => {
    const start = Math.floor((i * sentences.length) / n);
    const end = Math.floor(((i + 1) * sentences.length) / n);
    const chunk = sentences.slice(start, end).join(' ');
    ps.say = chunk || ps.goal || title;
    ps.weight = ps.say.split(/\s+/).filter(Boolean).length || 1;
  });

  return pscenes;
}

/**
 * Turn an AI lesson `part` into a list of pscenes ready for composeStoryboard.
 * @param {object} part
 * @returns {Array} pscenes
 */
export function partToPscenes(part) {
  if (!part || typeof part !== 'object') return [];
  const boards = asArray(part.board_scenes || part.boards || part.scenes_plan);
  let pscenes = boards.map(normalizeBoardScene).filter(Boolean);

  if (!pscenes.length) {
    pscenes = deriveFromVisualLogic(part);
  }

  // Guarantee at least an opener and a recap so every part has teaching shape.
  if (pscenes.length === 1) {
    pscenes.push({
      intent: 'recap',
      goal: 'recap',
      data: { points: asArray(part.key_concepts).map(str).slice(0, 4) },
    });
  }

  return pscenes.filter((p) => p && p.data);
}
