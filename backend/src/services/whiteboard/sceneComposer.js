// -----------------------------------------------------------------------------
// Scene Composer — turns a pedagogical plan into a timed whiteboard storyboard.
// -----------------------------------------------------------------------------
// Responsibilities:
//   1. Template selection: map each scene's pedagogical `intent` to a concrete
//      template from the library, VARYING choices so no two scenes (and no two
//      lessons) feel identical.
//   2. Rendering: fill the chosen template's slots with the scene's data.
//      Templates own all geometry, so output is overlap-free by construction.
//   3. Sequencing: assign times with teacher-like pacing, insert `clear` between
//      scenes (fresh board per teaching beat), add progressive reveal ordering,
//      and attach camera/zoom hints for cinematic focus.
//
// A pedagogical scene (input) looks like:
//   { goal, intent, narration, data: { ...slot data }, focus?: "string" }
//
// Output: a flat array of scene fragments each carrying a numeric `time`,
//         compatible with storyboardGenerator.saveLessonPlan.
// -----------------------------------------------------------------------------

import {
  getTemplate,
  getTemplatesByIntent,
} from './templateLibrary.js';
import { fitTextToSlots, pruneEmptyContainers, dropCollidingText, CAPTION_TOP } from './layout.js';

const CANVAS = { w: 800, h: 500 };

// Intent normalization: accept many synonyms the model might emit.
const INTENT_ALIASES = {
  definition: 'define', define: 'define', concept: 'define', term: 'define', meaning: 'define',
  comparison: 'compare', compare: 'compare', versus: 'compare', vs: 'compare', contrast: 'compare',
  process: 'process', steps: 'process', procedure: 'process', sequence: 'process', workflow: 'process', flow: 'process', pipeline: 'process',
  hierarchy: 'hierarchy', tree: 'hierarchy', structure: 'hierarchy', breakdown: 'hierarchy', taxonomy: 'hierarchy', layers: 'hierarchy',
  timeline: 'timeline', chronology: 'timeline', history: 'timeline', evolution: 'timeline',
  cause: 'cause', effect: 'cause', causality: 'cause', consequence: 'cause', impact: 'cause', relationship: 'cause',
  data: 'data', graph: 'data', chart: 'data', statistics: 'data', stats: 'data', plot: 'data', numbers: 'data',
  cluster: 'cluster', mindmap: 'cluster', map: 'map', overview: 'cluster', themes: 'cluster', categories: 'cluster',
  cycle: 'cycle', loop: 'cycle', circular: 'cycle', recurring: 'cycle',
  example: 'example', worked: 'example', application: 'example', practice: 'example', problem: 'cause',
  recap: 'recap', summary: 'recap', review: 'recap', takeaways: 'recap', conclusion: 'recap', hook: 'recap', intro: 'recap',
  formula: 'formula', equation: 'formula', math: 'formula', calculation: 'formula',
  diagram: 'map', labeled: 'map', anatomy: 'map', parts: 'map',
};

function normalizeIntent(intent) {
  const key = String(intent || '').trim().toLowerCase().replace(/[^a-z]/g, '');
  return INTENT_ALIASES[key] || 'define';
}

// Small stable string hash → non-negative int, used to seed per-topic template
// variety so different lessons don't render with identical template choices.
function hashStr(s) {
  let h = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h + str.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

// Templates that render real SVG scientific figures (atom, cell, DNA, etc.)
const SCIENCE_DIAGRAM_TEMPLATES = new Set([
  'labeled_science_diagram', 'figure_with_facts', 'anatomy_callouts',
]);

// Icon-and-arrow flow templates — diagrammatic teaching, not bullet lists.
const FLOW_DIAGRAM_TEMPLATES = new Set([
  'arch_pipeline', 'arch_two_columns', 'arch_flow_gates', 'arch_hub_nodes',
  'distributed_arrow_flow', 'hub_spoke_icons', 'icon_pipeline',
  'decision_flow', 'concept_panel_flow', 'branching_outcomes',
]);

// A scene-fragment "kind" → entrance animation ordering weight so that the
// renderer reveals scaffolding (frames, axes) before content (labels, text).
function revealOrder(frag) {
  switch (frag.type) {
    case 'draw_line': return 0;
    case 'draw_rect': return 1;
    case 'draw_circle': return 1;
    case 'draw_path': return 1;
    case 'draw_coordinate_system': return 1;
    case 'draw_object':
    case 'draw_physics_shape':
    case 'draw_table':
    case 'draw_graph': return 2;
    case 'draw_arrow': return 3;
    case 'draw_badge': return 4;
    case 'draw_text':
    case 'show_equation':
    case 'draw_callout': return 5;
    default: return 3;
  }
}

/**
 * Coerce loose model slot data into the shape each template expects.
 *
 * IMPORTANT: we only normalize slots that the scene ACTUALLY carries. We must
 * never pre-create an empty array for an absent slot — templates fall back
 * across synonym slots with `(d.links || d.steps || [])`, and an empty array is
 * truthy, so a pre-filled `[]` silently defeats every such fallback and leaves
 * the board empty. Absent slots therefore stay `undefined`.
 */
const ARRAY_SLOTS = [
  'points', 'items', 'steps', 'children', 'events', 'links', 'cards', 'terms',
  'satellites', 'stages', 'tiers', 'pillars', 'annotations', 'labels', 'corners',
  'stats', 'tiles', 'beats', 'columns', 'cells', 'markers', 'layers', 'branches',
  'nodes', 'features', 'sectors', 'dependencies', 'perspectives', 'tasks',
  'levels', 'causes', 'phases', 'states', 'milestones', 'vectors', 'lines',
  'notes', 'facts', 'pros', 'cons', 'why', 'pairs', 'mappings', 'transitions',
  'eras', 'sectors', 'metrics',
];

function coerceData(intent, raw) {
  const d = { ...(raw || {}) };
  const arr = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
  for (const slot of ARRAY_SLOTS) {
    if (d[slot] !== undefined) d[slot] = arr(d[slot]);
  }
  return d;
}

// Slots a template might read for its MAIN list of teaching items, grouped by
// the kind of content they carry. Whichever one the scene actually filled, we
// mirror it into the others so any template the rotation picks for this intent
// finds its data — this is the primary guard against empty boards.
const LIST_SLOTS_BY_INTENT = {
  define: ['points', 'items', 'cards', 'terms', 'features', 'why'],
  compare: ['columns', 'items', 'cards', 'pros', 'cons', 'cells', 'perspectives'],
  process: ['steps', 'items', 'stages', 'phases', 'states', 'branches', 'lines', 'milestones'],
  hierarchy: ['children', 'layers', 'tiers', 'pillars', 'levels', 'nodes', 'items'],
  timeline: ['events', 'beats', 'eras', 'milestones', 'stages', 'tasks', 'items'],
  cause: ['links', 'events', 'steps', 'causes', 'items', 'branches'],
  data: ['stats', 'values', 'notes', 'markers', 'sectors', 'annotations', 'items'],
  cluster: ['satellites', 'items', 'points', 'branches', 'nodes', 'corners'],
  cycle: ['stages', 'steps', 'events', 'items'],
  example: ['steps', 'points', 'items'],
  recap: ['points', 'tiles', 'items'],
  formula: ['terms', 'steps', 'items'],
  map: ['labels', 'annotations', 'points', 'items', 'satellites'],
};

// Read a list item's display text whether it's a string or {title,text,...}.
function listText(it) {
  if (it && typeof it === 'object') return it.title || it.text || it.label || it.name || it.term || it.symbol || '';
  return it == null ? '' : String(it);
}

/**
 * Cross-populate synonym list slots so the chosen template is never starved of
 * data. We find the richest list the scene already carries for this intent and
 * mirror it (shape-preserved) into the other list slots that template family
 * reads. Singular anchors (headline/center/concept/title…) are also harmonized
 * so header-only templates still show their main term.
 */
function enrichData(intent, data, ctx) {
  const d = { ...data };
  const candidates = LIST_SLOTS_BY_INTENT[intent] || ['items', 'points', 'steps'];

  // Pick the longest existing list among this intent's known slots, or any
  // array slot at all as a last resort, so we always have SOMETHING to mirror.
  let source = null;
  for (const slot of [...candidates, ...ARRAY_SLOTS]) {
    const v = d[slot];
    if (Array.isArray(v) && v.length && (!source || v.length > source.length)) source = v;
  }

  if (source && source.length) {
    // Mirror into every list slot this intent's templates may read, unless the
    // scene already supplied that exact slot.
    for (const slot of candidates) {
      if (!Array.isArray(d[slot]) || !d[slot].length) d[slot] = source;
    }
    // `columns` needs a {title,items} shape; synthesize one if a template wants
    // it but the scene only gave a flat list.
    if (candidates.includes('columns') && (!Array.isArray(d.columns) || !d.columns.length)) {
      const mid = Math.ceil(source.length / 2);
      d.columns = [
        { title: d.left_title || ctx.title || 'A', items: source.slice(0, mid).map(listText) },
        { title: d.right_title || 'B', items: source.slice(mid).map(listText) },
      ];
    }
  }

  // Harmonize the singular "headline/center" anchors so spotlight/hook/cluster
  // templates always have a term to show even when the scene named it elsewhere.
  const anchorVal = d.headline || d.concept || d.center || d.root || d.term
    || d.statement || d.subject || ctx.title;
  for (const k of ['headline', 'concept', 'center', 'statement', 'subject']) {
    if (!d[k]) d[k] = anchorVal;
  }

  // BACKFILL content panels from the beat's own narration so a template's
  // definition/example/detail regions are FULL of real explanation rather than
  // empty (which would otherwise be pruned, leaving a thin board). Distinct
  // sentences per slot so panels don't repeat the same line.
  const sentences = String(ctx.say || '')
    .split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 18);
  if (sentences.length) {
    let si = 0;
    const next = () => sentences[si++ % sentences.length];
    for (const slot of ['definition', 'sub', 'outcome', 'takeaway', 'answer', 'example', 'problem']) {
      if (!d[slot]) d[slot] = next();
    }
    // Give bare list items a supporting detail line so cards aren't one-word.
    for (const slot of candidates) {
      if (!Array.isArray(d[slot])) continue;
      d[slot] = d[slot].map((it) => {
        if (it && typeof it === 'object') { if (!it.detail && !it.text && sentences.length > 2) return { ...it, detail: next() }; return it; }
        return it;
      });
    }
  }

  return d;
}

// A board is "empty" if, after rendering, it produced essentially nothing
// beyond the shared header (a title text + an underline line, ≈2 fragments).
function isHeaderOnly(fragments) {
  const meaningful = fragments.filter(
    (f) => !(f.type === 'draw_line') // header underline + connector lines
  );
  // header contributes 1 title text (+ maybe a subtitle). Anything teaching
  // adds rects/circles/objects/badges/arrows/multiple texts.
  const hasShape = fragments.some((f) => /rect|circle|object|badge|callout|graph|table|equation|coordinate|physics|path/.test(f.type));
  return !hasShape && meaningful.length <= 3;
}

/**
 * Compose one pedagogical scene into timed fragments.
 * Returns { fragments, templateId }.
 *
 * Renders defensively: if the chosen template comes back header-only (its slot
 * expectations didn't match the scene's data), we try the next templates in the
 * intent's pool before giving up — so a board is never left blank.
 */
function composeScene(pscene, ctx, used, seed) {
  const intent = normalizeIntent(pscene.intent);
  const baseData = enrichData(intent, coerceData(intent, pscene.data), {
    title: pscene.title || ctx.title,
    say: pscene.say,
  });
  const sceneCtx = {
    title: pscene.title || ctx.title,
    subtitle: pscene.goal || pscene.subtitle || '',
  };

  // Build the candidate order: explicit template first (if valid), then the
  // seed-rotated intent pool with templates NOT yet used in this lesson tried
  // first (variety), used ones kept as later fallbacks. The render-and-retry
  // loop below walks this order until a template actually has data to show.
  const pool = getTemplatesByIntent(intent, ctx.field);
  const rot = pool.length ? seed % pool.length : 0;
  const rotated = pool.length ? [...pool.slice(rot), ...pool.slice(0, rot)] : [];
  const fresh = rotated.filter((t) => !used.has(t.id));
  const stale = rotated.filter((t) => used.has(t.id));
  const order = [];
  if (pscene.template && getTemplate(pscene.template)) order.push(getTemplate(pscene.template));
  for (const t of [...fresh, ...stale]) if (!order.includes(t)) order.push(t);

  // Boost diagram templates when the scene carries figure hints or the intent
  // is inherently visual — so biology/math lessons get SVG figures, not bullets.
  const hasFigureHint = !!(baseData.diagram || baseData.shape || baseData.figure);
  const wantsDiagram = hasFigureHint || intent === 'map' || intent === 'formula';
  if (wantsDiagram && order.length > 1) {
    const diagramFirst = order.filter((t) => SCIENCE_DIAGRAM_TEMPLATES.has(t.id));
    const flowNext = order.filter((t) => FLOW_DIAGRAM_TEMPLATES.has(t.id) && !SCIENCE_DIAGRAM_TEMPLATES.has(t.id));
    const rest = order.filter((t) => !SCIENCE_DIAGRAM_TEMPLATES.has(t.id) && !FLOW_DIAGRAM_TEMPLATES.has(t.id));
    if (diagramFirst.length || flowNext.length) {
      order.length = 0;
      for (const t of [...diagramFirst, ...flowNext, ...rest]) if (!order.includes(t)) order.push(t);
    }
  } else if ((intent === 'cluster' || intent === 'cause' || intent === 'process') && order.length > 1) {
    const flowFirst = order.filter((t) => FLOW_DIAGRAM_TEMPLATES.has(t.id));
    const rest = order.filter((t) => !FLOW_DIAGRAM_TEMPLATES.has(t.id));
    if (flowFirst.length) {
      order.length = 0;
      for (const t of [...flowFirst, ...rest]) if (!order.includes(t)) order.push(t);
    }
  }

  let chosen = null;
  let fragments = [];
  let fallback = null; // best non-empty result if none is "rich"

  for (const tmpl of order) {
    if (!tmpl) continue;
    let frags = [];
    try {
      frags = (tmpl.fill(baseData, sceneCtx) || []).filter(Boolean);
    } catch (err) {
      console.warn(`[sceneComposer] template ${tmpl.id} failed: ${err.message}`);
      continue;
    }
    if (isHeaderOnly(frags)) {
      if (!fallback) fallback = { tmpl, frags };
      continue; // try the next template — this one had no data to show
    }
    chosen = tmpl;
    fragments = frags;
    break;
  }

  if (!chosen && fallback) { chosen = fallback.tmpl; fragments = fallback.frags; }
  if (!chosen && order.length) { chosen = order[0]; }

  const templateId = chosen ? chosen.id : (pscene.template || 'definition_spotlight');
  used.add(templateId);

  // Make every drawn text fit its slot so it can never spill onto a neighbour,
  // then drop any container left empty + purely-decorative shapes (no empty
  // boxes, no meaningless flashing svg), and finally drop text fragments that
  // heavily overlap a previously-kept one (e.g. a title landing on the subtitle).
  fragments = fitTextToSlots(fragments);
  fragments = pruneEmptyContainers(fragments);
  fragments = dropCollidingText(fragments);

  const hasDiagram = fragments.some(
    (f) => f.type === 'draw_path' || f.type === 'draw_physics_shape'
      || (f.type === 'draw_object' && f.object_type),
  );

  return { fragments, templateId, intent, say: pscene.say, segment: pscene.segment, headerOnly: isHeaderOnly(fragments), hasDiagram, fragmentCount: fragments.length };
}

// Reading speed for caption dwell (~240 wpm) and segment pacing multipliers.
const WORDS_PER_MINUTE = 240;
const SEGMENT_PACE = { hook: 1.0, prerequisite: 1.05, core: 1.0, mechanism: 1.35, example: 1.15, reinforcement: 1.4, recap: 1.1 };
const SEGMENT_TAIL = { hook: 2.0, prerequisite: 2.2, core: 2.4, mechanism: 3.2, example: 2.8, reinforcement: 3.5, recap: 2.6 };

function sayDwellSeconds(say) {
  const words = String(say || '').split(/\s+/).filter(Boolean).length;
  return Math.max(2.5, (words / WORDS_PER_MINUTE) * 60);
}

function dwellForCaptionChunk(chunk) {
  const words = String(chunk || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1.2, (words / WORDS_PER_MINUTE) * 60);
}

/**
 * Build a full storyboard `visual_sequence` from a list of pedagogical scenes.
 *
 * @param {Array} pscenes  - [{ goal, intent, data, focus }]
 * @param {object} ctx     - { title }
 * @param {number} durationSeconds
 * @returns {Array} timed scene fragments (with `time`)
 */
export function composeStoryboard(pscenes, ctx, durationSeconds) {
  const scenes = Array.isArray(pscenes) ? pscenes.filter(Boolean) : [];
  if (!scenes.length) return [];

  const used = new Set();
  const boards = [];
  // Seed from lesson title + part index + field so different parts/lessons
  // never open with the same template rotation.
  const seedBase = hashStr(`${ctx.lessonTitle || ctx.title || ''}|p${ctx.partIndex ?? 0}|${ctx.field || ''}`);
  scenes.forEach((ps, i) => {
    const sceneSeed = seedBase + hashStr(`${ps.intent}|${ps.goal}|${i}`) + i * 17;
    const { fragments, templateId, intent, say, segment } = composeScene(ps, ctx, used, sceneSeed);
    if (fragments.length) boards.push({ fragments, focus: ps.focus, say: ps.say || say, weight: ps.weight, segment: ps.segment || segment });
    // allow template reuse only after the pool is exhausted
    if (used.size >= 12) used.clear();
  });

  if (!boards.length) return [];

  // ── Continuous, content-driven pacing (no audio) ────────────────────────────
  // There is no narration audio, so the BOARD itself must teach: it has to keep
  // DRAWING the whole time (something new every ~PACE seconds — never a frozen
  // gap) and WRITE the explanation as on-board captions the student reads. The
  // lesson ends when the drawing ends — duration follows explanation length.
  const round = (x) => Math.round(x * 10) / 10;
  const CLEAR = 0.7;
  const CAMERA = 0.4;
  const PACE_MIN = 0.9;
  const PACE_MAX = 2.4;

  const out = [];
  let t = 0;

  boards.forEach((board, bi) => {
    if (bi > 0) { out.push({ time: round(t), type: 'clear' }); t += CLEAR; }
    out.push({ time: round(t), type: 'camera', mode: 'enter', zoom: 1.0 });
    t += CAMERA;

    const ordered = board.fragments
      .map((f, idx) => ({ f, idx, order: revealOrder(f) }))
      .sort((a, b) => (a.order - b.order) || (a.idx - b.idx))
      .map((x) => x.f);
    const n = ordered.length || 1;

    const captions = splitCaption(board.say);
    const capAt = captions.map((_, ci) => Math.floor((n * ci) / Math.max(captions.length, 1)));

    // Pace this board so drawing fills the spoken explanation (explanation creates the visual).
    const seg = String(board.segment || '').toLowerCase();
    const segMult = SEGMENT_PACE[seg] || 1.0;
    const boardDwell = sayDwellSeconds(board.say) * segMult;
    const drawBudget = Math.max(n * PACE_MIN, boardDwell * 0.6);
    const basePace = Math.min(PACE_MAX, Math.max(PACE_MIN, drawBudget / n));

    ordered.forEach((frag, i) => {
      const ci = capAt.indexOf(i);
      if (ci >= 0) out.push({ type: 'draw_caption', content: captions[ci], index: ci, total: captions.length, time: round(t) });
      out.push({ ...frag, time: round(t), step_index: out.length });
      t += basePace;
    });
    for (let ci = 0; ci < captions.length; ci++) {
      if (capAt[ci] >= n) out.push({ type: 'draw_caption', content: captions[ci], index: ci, total: captions.length, time: round(t) });
    }

    if (board.focus && typeof board.focus === 'string' && board.focus.length > 1) {
      out.push({ time: round(t), type: 'camera', mode: 'focus', zoom: 1.15, hint: board.focus });
    }
    t += SEGMENT_TAIL[seg] || 2.2;
    out.push({ time: round(t), type: 'camera', mode: 'reset', zoom: 1.0 });
    t += CAMERA;
  });

  return out;
}

// Split a beat's narration into short, readable caption chunks (≤ ~14 words)
// that are written along the bottom band as the board draws.
function splitCaption(say) {
  const text = String(say || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    if (words.length <= 16) { chunks.push(sentence); continue; }
    for (let i = 0; i < words.length; i += 14) chunks.push(words.slice(i, i + 14).join(' '));
  }
  return chunks.slice(0, 6);
}

/**
 * Render a SINGLE template directly (used by fallback paths and quizzes that
 * want a clean, known-good board without the full pacing machinery).
 */
export function composeSingleBoard(templateId, slotData, ctx, startTime = 0) {
  const tmpl = getTemplate(templateId);
  if (!tmpl) return [];
  const data = coerceData(tmpl.intent, slotData);
  let fragments = [];
  try {
    fragments = (tmpl.fill(data, ctx || {}) || []).filter(Boolean);
  } catch {
    return [];
  }
  const ordered = fragments
    .map((f, idx) => ({ f, idx, order: revealOrder(f) }))
    .sort((a, b) => (a.order - b.order) || (a.idx - b.idx))
    .map((x) => x.f);
  let t = startTime;
  return ordered.map((frag) => {
    const s = { ...frag, time: Math.round(t * 10) / 10 };
    t += 1.0;
    return s;
  });
}

/**
 * Dry-run composition for one part's pscenes — returns metadata about what
 * templates would render, without building the full timed sequence. Used by
 * the AI visual-editing pass to diagnose thin/repetitive boards.
 */
export function previewPartComposition(pscenes, ctx = {}) {
  const scenes = Array.isArray(pscenes) ? pscenes.filter(Boolean) : [];
  if (!scenes.length) return { boards: [] };

  const used = new Set();
  const seedBase = hashStr(`${ctx.lessonTitle || ctx.title || ''}|p${ctx.partIndex ?? 0}|${ctx.field || ''}`);
  const boards = scenes.map((ps, i) => {
    const sceneSeed = seedBase + hashStr(`${ps.intent}|${ps.goal}|${i}`) + i * 17;
    const result = composeScene(ps, ctx, used, sceneSeed);
    if (used.size >= 12) used.clear();
    return {
      index: i,
      intent: result.intent,
      goal: ps.goal,
      templateId: result.templateId,
      fragmentCount: result.fragmentCount,
      headerOnly: result.headerOnly,
      hasDiagram: result.hasDiagram,
      say: result.say || ps.say,
    };
  });
  return { boards };
}

export { normalizeIntent, CANVAS };
