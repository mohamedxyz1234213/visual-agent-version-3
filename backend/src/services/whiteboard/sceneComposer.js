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

  return { fragments, templateId, intent, say: pscene.say };
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
  // Seed the template rotation from the lesson TITLE so two different lessons
  // don't both open their first `define` board with the same template (the main
  // reason every lesson looked identical). Deterministic per topic, varied across.
  const seedBase = hashStr(ctx.title || '');
  scenes.forEach((ps, i) => {
    const { fragments, templateId } = composeScene(ps, ctx, used, seedBase + i);
    if (fragments.length) boards.push({ fragments, focus: ps.focus, say: ps.say, weight: ps.weight });
    // allow template reuse only after the pool is exhausted
    if (used.size >= 12) used.clear();
  });

  if (!boards.length) return [];

  // ── Continuous, content-driven pacing (no audio) ────────────────────────────
  // There is no narration audio, so the BOARD itself must teach: it has to keep
  // DRAWING the whole time (something new every ~PACE seconds — never a frozen
  // gap) and WRITE the explanation as on-board captions the student reads. The
  // lesson ends when the drawing ends — we report the true duration so the
  // player never sits on a dead, finished board.
  const round = (x) => Math.round(x * 10) / 10;
  const CLEAR = 0.7;         // fresh-board wipe between beats
  const CAMERA = 0.4;        // enter / reset camera move
  const TAIL = 2.2;          // brief read-hold after a board completes
  const PACE_MIN = 1.0;      // never faster than this between draws
  const PACE_MAX = 2.6;      // never slower than this (keeps the board alive)

  const totalEls = boards.reduce((s, b) => s + Math.max(1, b.fragments.length), 0);
  // Aim for a continuous draw of ~2s/element, but keep the whole part in a sane
  // band (~70–170s) by nudging the pace; gap therefore stays under the 3.2s gate.
  const targetDraw = Math.min(170, Math.max(70, totalEls * 2.0));
  const PACE = Math.min(PACE_MAX, Math.max(PACE_MIN, targetDraw / totalEls));

  const out = [];
  let t = 0;

  boards.forEach((board, bi) => {
    if (bi > 0) { out.push({ time: round(t), type: 'clear' }); t += CLEAR; }
    out.push({ time: round(t), type: 'camera', mode: 'enter', zoom: 1.0 });
    t += CAMERA;

    // Reveal scaffold → content → labels so the board builds like a teacher draws.
    const ordered = board.fragments
      .map((f, idx) => ({ f, idx, order: revealOrder(f) }))
      .sort((a, b) => (a.order - b.order) || (a.idx - b.idx))
      .map((x) => x.f);
    const n = ordered.length || 1;

    // The beat's explanation, written progressively along the bottom caption band.
    const captions = splitCaption(board.say);
    const capAt = captions.map((_, ci) => Math.floor((n * ci) / captions.length));

    ordered.forEach((frag, i) => {
      const ci = capAt.indexOf(i);
      if (ci >= 0) out.push({ type: 'draw_caption', content: captions[ci], index: ci, total: captions.length, time: round(t) });
      out.push({ ...frag, time: round(t) });
      t += PACE;
    });
    // Any caption chunks not yet placed (e.g. more chunks than elements) land now.
    for (let ci = 0; ci < captions.length; ci++) {
      if (capAt[ci] >= n) { out.push({ type: 'draw_caption', content: captions[ci], index: ci, total: captions.length, time: round(t) }); t += PACE; }
    }

    // Brief focus zoom + read-hold so the finished board lands before the wipe.
    if (board.focus && typeof board.focus === 'string' && board.focus.length > 1) {
      out.push({ time: round(t), type: 'camera', mode: 'focus', zoom: 1.15, hint: board.focus });
    }
    t += TAIL;
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

export { normalizeIntent, CANVAS };
