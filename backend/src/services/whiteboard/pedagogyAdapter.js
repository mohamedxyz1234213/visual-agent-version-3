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
    if (['intent', 'type', 'semantic_role', 'goal', 'objective', 'focus', 'template', 'say', 'narration', 'spoken'].includes(k)) continue;
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
// Builds a real teaching ARC (hook → define → how-it-works → contrast/example →
// recap) with intents chosen from content cues, so different lessons vary and
// each board carries genuine content — not the same define→recap every time.
function deriveFromVisualLogic(part) {
  const vl = asArray(part.visual_logic);
  const concepts = asArray(part.key_concepts).map(str).filter(Boolean);
  const narration = str(part.narration);
  const sentences = narration.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 12);
  const corpus = `${str(part.title)} ${narration}`;
  const title = str(part.title);
  const pscenes = [];

  // 1 — Hook: the part's central idea as a single strong statement.
  pscenes.push({
    intent: 'recap', goal: 'the big idea',
    data: { statement: str(part.scene_goal || title), sub: sentences[0] || concepts.slice(0, 3).join(' · ') },
  });

  // 2 — Define: the core concept with supporting cards/points.
  if (concepts.length || sentences.length) {
    pscenes.push({
      intent: 'define', goal: 'core concept',
      data: {
        concept: title, headline: concepts[0] || title,
        definition: sentences[1] || sentences[0] || '',
        cards: (concepts.length ? concepts : sentences).slice(0, 3).map((c, i) => ({ title: str(c).split(' ').slice(0, 6).join(' '), detail: sentences[i + 2] || '' })),
        points: concepts.slice(0, 4),
      },
    });
  }

  // 3 — How it works: intent chosen from cues (process / cause / cycle / …).
  const relIntent = pickRelationIntent(part, vl, corpus);
  pscenes.push({
    intent: relIntent, goal: 'how it works',
    data: {
      steps: (concepts.length ? concepts : sentences).slice(0, 4).map((c, i) => ({ title: str(c).split(' ').slice(0, 5).join(' '), detail: sentences[i + 1] || '' })),
      links: (concepts.length ? concepts : sentences).slice(0, 3).map((c) => ({ title: str(c).split(' ').slice(0, 5).join(' ') })),
      stages: (concepts.length ? concepts : sentences).slice(0, 4).map((c) => ({ title: str(c).split(' ').slice(0, 4).join(' ') })),
      center: title, outcome: sentences[sentences.length - 1] || '',
    },
  });

  // 4 — Contrast / apply: a second relational board so the lesson has depth,
  //     only when there's enough material (keeps short parts from padding).
  if (concepts.length >= 2 || sentences.length >= 4) {
    const wantCompare = relIntent !== 'compare' && (concepts.length >= 2);
    pscenes.push(wantCompare
      ? {
        intent: 'compare', goal: 'compare & contrast',
        data: {
          columns: [
            { title: str(concepts[0] || 'This'), items: sentences.slice(1, 4).map((s) => str(s).split(' ').slice(0, 7).join(' ')) },
            { title: str(concepts[1] || 'That'), items: sentences.slice(4, 7).map((s) => str(s).split(' ').slice(0, 7).join(' ')) },
          ],
          items: concepts.slice(0, 4).map((c) => ({ title: c })),
        },
      }
      : {
        intent: 'example', goal: 'in practice',
        data: {
          problem: sentences[2] || `Applying ${title}`,
          steps: sentences.slice(2, 6).map((s) => ({ text: str(s).split(' ').slice(0, 12).join(' ') })),
          points: concepts.slice(0, 3),
        },
      });
  }

  // 5 — Recap: the takeaways.
  pscenes.push({
    intent: 'recap', goal: 'recap',
    data: { points: (concepts.length ? concepts : sentences).slice(0, 4).map(str) },
  });

  // Attach a spoken line to each board (contiguous narration chunks in order).
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
