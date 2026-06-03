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
// so different parts never all get define→process→recap. The `say` text and
// drawn slot content come from the part's actual narration / source-grounded
// comprehension details, NOT from generic prompt-shaped strings — those look
// like AI scaffolding on the board and read as the "super duplicated no
// meaning" the user reported.
function deriveFromVisualLogic(part) {
  const vl = asArray(part.visual_logic);
  const concepts = asArray(part.key_concepts).map(str).filter(Boolean);
  const comprehension = part.comprehension || {};
  const compTopics = Array.isArray(comprehension.key_topics) ? comprehension.key_topics : [];
  const compDetails = collectComprehensionDetails(compTopics);
  const narration = str(part.narration);
  const sentences = narration.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 12);
  const corpus = `${str(part.title)} ${narration}`;
  const title = str(part.title);
  const relIntent = pickRelationIntent(part, vl, corpus);
  const arcSeed = (title + narration).split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  const arcVariant = Math.abs(arcSeed) % 4;

  // The teaching sentences we slice across the beats. Prefer the real part
  // narration; if it's thin, fall back to comprehension details; if even that
  // is empty, return an empty list upstream so we don't fall through to
  // prompt-shaped copy.
  const teachingSentences = sentences.length
    ? sentences
    : compDetails;

  const pscenes = [];

  // Arc variants — each opens differently and uses different middle beats.
  // Drawn slot text (definition / sub / details) is now a clipped SENTENCE
  // from the source narration, not a generic "concept X is the central idea
  // that ties together Y and Z" string.
  const firstSentence = teachingSentences[0] || '';
  const secondSentence = teachingSentences[1] || '';
  const openers = [
    { segment: 'hook', intent: 'recap', goal: 'spark curiosity', data: { statement: str(part.scene_goal || title), sub: anchorOf(firstSentence, 9) } },
    { segment: 'core', intent: 'define', goal: 'core concept', data: { concept: title, headline: concepts[0] || title, definition: anchorOf(firstSentence, 12), points: concepts.slice(0, 4) } },
    { segment: 'core', intent: 'map', goal: 'visual anchor', data: { headline: title, concept: concepts[0] || title, labels: concepts.slice(0, 4), points: concepts.slice(0, 3) } },
    { segment: 'hook', intent: 'cause', goal: 'why it matters', data: { center: title, items: concepts.slice(0, 3).map((c, idx) => ({ title: c, detail: anchorOf(teachingSentences[idx + 1] || secondSentence, 8) })) } },
  ];
  pscenes.push(openers[arcVariant % openers.length]);

  const middles = [
    { segment: 'mechanism', intent: relIntent, goal: 'how it works', data: { steps: concepts.slice(0, 4).map((c, i) => ({ title: str(c).split(' ').slice(0, 5).join(' '), detail: anchorOf(teachingSentences[i + 1] || teachingSentences[0] || '', 8) })), center: title } },
    { segment: 'mechanism', intent: 'cluster', goal: 'connected ideas', data: { center: title, items: concepts.slice(0, 5).map((c, idx) => ({ title: c, detail: anchorOf(teachingSentences[idx + 1] || '', 7) })) } },
    { segment: 'mechanism', intent: 'formula', goal: 'formal view', data: { formula: concepts[0] || title, terms: concepts.slice(0, 3).map((c) => ({ symbol: str(c).split(' ')[0], meaning: c })) } },
    { segment: 'mechanism', intent: 'data', goal: 'quantitative view', data: { stats: concepts.slice(0, 4).map((c) => ({ label: c, value: '' })), points: concepts.slice(0, 3) } },
  ];
  pscenes.push(middles[(arcVariant + 1) % 4]);

  if (concepts.length >= 2 || teachingSentences.length >= 4) {
    const closers = [
      { segment: 'example', intent: 'compare', goal: 'contrast', data: { columns: [{ title: str(concepts[0] || 'A'), items: teachingSentences.slice(1, 4).map((s) => anchorOf(s, 7)) }, { title: str(concepts[1] || 'B'), items: teachingSentences.slice(4, 7).map((s) => anchorOf(s, 7)) }] } },
      { segment: 'example', intent: 'example', goal: 'in practice', data: { problem: teachingSentences[2] || `Applying ${title}`, steps: teachingSentences.slice(2, 6).map((s) => ({ text: anchorOf(s, 12) })) } },
      { segment: 'reinforcement', intent: 'cycle', goal: 'recurring pattern', data: { stages: concepts.slice(0, 4).map((c) => ({ title: c })) } },
      { segment: 'reinforcement', intent: 'hierarchy', goal: 'structure', data: { root: title, children: concepts.slice(0, 4).map((c) => ({ title: c })) } },
    ];
    pscenes.push(closers[(arcVariant + 2) % 4]);
  }

  pscenes.push({
    segment: 'recap',
    intent: 'recap',
    goal: 'recap',
    data: { points: (concepts.length ? concepts : teachingSentences.slice(0, 4)).map((c) => anchorOf(str(c), 6)) },
  });

  // Distribute the teaching sentences across the beats so each beat's `say`
  // is a real chunk of the part's actual narration, not a generic restate.
  const n = pscenes.length;
  pscenes.forEach((ps, i) => {
    const start = Math.floor((i * teachingSentences.length) / n);
    const end = Math.floor(((i + 1) * teachingSentences.length) / n);
    const chunk = teachingSentences.slice(start, end).join(' ');
    ps.say = chunk || anchorOf(firstSentence, 18) || title;
    ps.weight = ps.say.split(/\s+/).filter(Boolean).length || 1;
  });

  return pscenes;
}

// Clip a free sentence to a short, board-safe anchor: keep at most `maxWords`
// words, with a trailing ellipsis if we truncated. Empty / undefined → ''.
function anchorOf(text, maxWords) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const words = t.split(' ').filter(Boolean);
  if (words.length <= maxWords) return t;
  return `${words.slice(0, maxWords).join(' ').replace(/[,.;:]+$/, '')}…`;
}

// Pull source-grounded sentence-shaped detail facts out of the comprehension
// topics (the actual teaching content the comprehension pass collected from
// the user's document). Returns up to N sentence-like strings. Falls back
// to an empty array when no comprehension was built — the caller should then
// hard-fail rather than emit prompt-shaped copy.
function collectComprehensionDetails(compTopics, max = 12) {
  const out = [];
  for (const topic of compTopics) {
    if (!topic || typeof topic !== 'object') continue;
    const details = Array.isArray(topic.details) ? topic.details : [];
    for (const d of details) {
      const s = str(d).replace(/\s+/g, ' ').trim();
      if (s && s.length > 12) out.push(s);
      if (out.length >= max) return out;
    }
  }
  return out;
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

  // Hard-fail guard: if the synthetic path produced pscenes but NONE of them
  // carry real teaching text (no narration, no comprehension details, no
  // concepts to draw on), return empty so the upstream caller falls through
  // to its own syntheticPart path that uses the section_text directly. This
  // stops the renderer from emitting prompt-shaped copy when the input is
  // empty — the user reported seeing exactly this.
  const hasRealContent = (pscenes.length > 0) && pscenes.some((ps) => {
    const s = String(ps.say || '').trim();
    return s.length >= 12;
  });
  if (!hasRealContent && pscenes.length) {
    return [];
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
