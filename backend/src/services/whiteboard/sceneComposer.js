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
import { cleanString } from './validator.js';

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

  // BACKFILL only a SINGLE primary content panel from the beat's narration so a
  // template's main definition/takeaway region isn't empty. We deliberately do
  // NOT spray narration across many slots or into list-item details: the board
  // shows keyword ANCHORS, the full teaching lives in the spoken `say`. Reusing
  // sentences across slots is what produced the "super duplicated, no meaning"
  // on-board text — so each sentence is consumed at most once and we stop as
  // soon as we run out.
  const sentences = String(ctx.say || '')
    .split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 18);
  if (sentences.length) {
    let si = 0;
    const next = () => (si < sentences.length ? sentences[si++] : undefined);
    // Fill at most one genuinely-empty primary slot, in priority order. Once a
    // sentence is placed, later slots stay empty (templates prune them).
    for (const slot of ['definition', 'takeaway', 'outcome', 'answer', 'example', 'problem', 'sub']) {
      if (!d[slot]) {
        const s = next();
        if (s) d[slot] = s;
        break;
      }
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
    // `goal` is a planner directive ("Contrast X with Y"), never teaching
    // content — never put it on the board. Only a genuine `subtitle` survives.
    subtitle: cleanString(pscene.subtitle, 80) || '',
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
const SEGMENT_TAIL = { hook: 0.7, prerequisite: 0.8, core: 0.8, mechanism: 1.0, example: 0.9, reinforcement: 1.0, recap: 0.9 };

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
  const CLEAR = 0.4;
  const CAMERA = 0.3;
  // Per-unit base time. Units are the "draw one concept together" beats — a
  // shape + its label(s) all share the same timestamp so they appear in
  // lockstep rather than the box being drawn, then the label 1.2s later.
  const UNIT_MIN = 1.1;
  const UNIT_MAX = 3.2;
  const CONNECTOR_TIME = 0.55;

  const out = [];
  let t = 0;

  boards.forEach((board, bi) => {
    if (bi > 0) { out.push({ time: round(t), type: 'clear' }); t += CLEAR; }
    out.push({ time: round(t), type: 'camera', mode: 'enter', zoom: 1.0 });
    t += CAMERA;

    const seg = String(board.segment || '').toLowerCase();
    const segMult = SEGMENT_PACE[seg] || 1.0;

    // Group the template-authored fragments into "units" — each unit is a single
    // teaching beat: a shape (box/circle/callout) plus every fragment that lives
    // inside it (badge, title text, detail text). Connectors (arrow/line) sit
    // between units. The header band (title + underline + subtitle) is its own
    // opening unit. This makes the user see "box 1 with its label, then box 2
    // with its label" instead of "every box, then every label".
    const ordered = board.fragments;
    const units = groupIntoUnits(ordered);

    // The unit's time window scales with the amount of `say` text it carries —
    // a heavily-explained unit earns more screen time, a quick one doesn't
    // drag. We weight by the caption slot the unit owns, not raw fragment count.
    const captions = splitCaption(board.say);
    const captionByUnit = distributeCaptions(units, captions);

    // Sum total time the board needs = sum of (per-unit time) + connector gaps.
    const perUnitTime = units.map((u, ui) => {
      const cap = captionByUnit[ui] || '';
      const capWords = cap ? cap.split(/\s+/).filter(Boolean).length : 0;
      // Decorative single-fragment units (a header underline, a divider
      // line) are quick — they don't carry teaching content, so giving
      // them a full UNIT_MIN would leave 1.1s of dead air. Pin them to a
      // short dwell so the next content unit appears promptly.
      const isDecorative = u.fragments.length === 1
        && /^draw_(line|path)$/.test(String(u.fragments[0].type));
      if (isDecorative) return 0.3;
      // Each unit gets at least UNIT_MIN; bigger `say` → up to UNIT_MAX.
      const dwell = sayDwellSeconds(cap) * segMult;
      return Math.min(UNIT_MAX, Math.max(UNIT_MIN, dwell));
    });
    const boardDwell = sayDwellSeconds(board.say) * segMult;
    const totalUnitTime = perUnitTime.reduce((a, b) => a + b, 0);
    const connectorCount = countConnectors(units);
    const naturalBudget = totalUnitTime + connectorCount * CONNECTOR_TIME;
    // Don't expand the board past the spoken budget — but don't shrink below
    // the units' per-element minimums either.
    const targetBudget = Math.max(naturalBudget, boardDwell * 0.85);
    const scale = targetBudget / Math.max(naturalBudget, 0.001);

    // Emit each unit in order. The container shape (box/circle/callout) draws
    // first, then its primary label as ONE tight beat; any extra fragments
    // (badge, detail line) trickle across the dwell so the board keeps moving.
    //
    // Critical for MUTED playback: a unit that draws everything early (e.g. the
    // header, or a bare box+label) must NOT then hold for its full narration
    // dwell — that reads as a frozen board. So we advance to the next unit no
    // later than MAX_DEAD_GAP past the unit's actual LAST draw (accounting for
    // the connector lead-in), even if the spoken budget is longer. Units rich
    // enough to keep drawing through their dwell are unaffected.
    const FRAG_STAGGER = 0.16;
    const MAX_DEAD_GAP = 2.6;   // ceiling on frozen-board time between draws
    let prevUnitEnd = t;
    const unitStartTimes = [];
    units.forEach((unit, ui) => {
      if (ui > 0) prevUnitEnd += CONNECTOR_TIME;
      const uTime = prevUnitEnd;
      unitStartTimes[ui] = uTime;
      const uDwell = perUnitTime[ui] * scale;
      // Order: containers (rect/circle/callout/object) first, then labels
      // (text/badge) — "draw the box, then label it", not "label a void".
      const ordered = unit.fragments.slice().sort((a, b) => {
        const aw = /draw_(rect|circle|callout|object|physics_shape)/.test(String(a.type)) ? 0 : 1;
        const bw = /draw_(rect|circle|callout|object|physics_shape)/.test(String(b.type)) ? 0 : 1;
        return aw - bw;
      });
      const HEAD = Math.min(2, ordered.length);            // container + primary label
      const head = ordered.slice(0, HEAD);
      const tail = ordered.slice(HEAD);
      const headEnd = (HEAD - 1) * FRAG_STAGGER;
      head.forEach((frag, fi) => {
        out.push({ ...frag, time: round(uTime + fi * FRAG_STAGGER), step_index: out.length });
      });
      let lastOffset = headEnd;
      if (tail.length) {
        // Spread the remainder over up to 80% of the unit dwell, but never
        // leave a gap larger than ~2.4s between successive draws.
        const tailSpan = Math.max(0, uDwell * 0.8 - headEnd);
        const tailStride = Math.min(2.4, tail.length ? tailSpan / tail.length : 0);
        tail.forEach((frag, fi) => {
          const offset = headEnd + (fi + 1) * tailStride;
          out.push({ ...frag, time: round(uTime + offset), step_index: out.length });
          lastOffset = offset;
        });
      }
      // Hold for the narration, but cap the frozen tail so the board never
      // sits longer than MAX_DEAD_GAP after its last draw (minus the connector
      // lead-in to the next unit's first draw). The LAST unit gets a tighter
      // cap because the board-level SEGMENT_TAIL + clear + camera already add a
      // read pause after it — without this the board freezes ~7s at the seam.
      const isLastUnit = ui === units.length - 1;
      const deadGap = isLastUnit ? 1.2 : MAX_DEAD_GAP;
      const maxAdvance = lastOffset + deadGap - CONNECTOR_TIME;
      prevUnitEnd = uTime + Math.min(uDwell, Math.max(lastOffset, maxAdvance));
    });
    const finalT = prevUnitEnd;
    // The board's last REAL draw (excludes the narration hold). Captions must
    // not land after this — a caption with nothing drawing under it is dead air
    // and would inflate the part's content-driven duration past the last shape.
    const lastRealDraw = out.reduce((m, s) => (
      /^draw_/.test(String(s.type)) && s.type !== 'draw_caption' ? Math.max(m, Number(s.time) || 0) : m
    ), t);

    // Lay the narration caption chunks evenly across the board's draw window so
    // the subtitle band updates continuously — one short clause at a time, at a
    // readable pace — instead of dumping a paragraph at one unit and freezing.
    // Because the window is sized from the same word count, evenly spreading the
    // chunks yields a natural ~2-3s cadence that also fills the holds between
    // widely-spaced unit draws, so the board never sits frozen (audio muted).
    // Show each caption clause at the exact moment its unit draws, so the
    // sentence the student reads describes the shape appearing under it
    // (caption ⇄ drawing coupling). `distributeCaptions` decided which unit
    // owns which clause; we anchor that clause to that unit's start time.
    // Any clause not owned by a drawn unit (extras folded into the last unit)
    // is spread across the remaining window so nothing is dropped silently.
    if (captions.length) {
      const winStart = t;
      const span = Math.max(0.001, finalT - winStart);
      // Build unit→clauses map from the same distribution used for dwell.
      const clausesByUnit = units.map(() => []);
      const contentIdx = [];
      units.forEach((u, ui) => { if (u.role !== 'connector') contentIdx.push(ui); });
      if (!contentIdx.length) contentIdx.push(0);
      captions.forEach((cap, ci) => {
        const ui = contentIdx[Math.min(ci, contentIdx.length - 1)];
        clausesByUnit[ui].push(cap);
      });
      let ci = 0;
      clausesByUnit.forEach((clauses, ui) => {
        if (!clauses.length) return;
        const base = unitStartTimes[ui] != null ? unitStartTimes[ui] : winStart + (ui / units.length) * span;
        const nextStart = unitStartTimes[ui + 1] != null ? unitStartTimes[ui + 1] : finalT;
        const slot = Math.max(0.001, nextStart - base);
        clauses.forEach((cap, k) => {
          const frac = clauses.length > 1 ? k / clauses.length : 0;
          out.push({
            type: 'draw_caption',
            content: cap,
            index: ci,
            total: captions.length,
            time: round(Math.min(base + frac * slot, lastRealDraw)),
          });
          ci += 1;
        });
      });
    }

    t = finalT;

    if (board.focus && typeof board.focus === 'string' && board.focus.length > 1) {
      out.push({ time: round(t), type: 'camera', mode: 'focus', zoom: 1.15, hint: board.focus });
    }
    t += SEGMENT_TAIL[seg] || 2.2;
    out.push({ time: round(t), type: 'camera', mode: 'reset', zoom: 1.0 });
    t += CAMERA;
  });

  return out;
}

/**
 * Group a template's fragment list into "draw units" — one shape + its inner
 * labels per unit. Connectors (arrow/line) become their own micro-units so
 * the user sees "shape, arrow, shape" rather than "every shape, then every
 * arrow". The header band (title text + underline + subtitle) is always the
 * first unit; any pre-container decoration joins it.
 *
 * Rules (applied in template-authored order):
 *   - A filled `draw_rect` / `draw_circle` / `draw_object` / `draw_callout`
 *     starts a new unit and owns the fragments that follow it until the next
 *     filled container begins.
 *   - A header-anchored `draw_text` (y < 110, fontSize ≥ 18, centered) starts
 *     the header unit; everything before any container goes there.
 *   - `draw_arrow` and `draw_line` (other than the header underline) form a
 *     single connector unit each.
 *   - Everything else (badges, text, equations, tables, graphs) attaches to
 *     the unit that contains its spatial position; if it doesn't fit any unit
 *     and isn't a header, it falls into the most-recent unit so it doesn't
 *     drift in after the next unit starts.
 */
export function groupIntoUnits(fragments) {
  if (!Array.isArray(fragments) || !fragments.length) return [];

  const HEADER_BAND_Y = 110;
  const HEADER_MIN_FONT = 16;
  const HEADER_CENTER = 760; // near canvas x-center → header band

  const isFilledContainer = (f) => {
    if (!f || typeof f !== 'object') return false;
    if (f.type === 'draw_rect') {
      const fill = f.style && f.style.style && f.style.style.fill;
      const ff = f.style && f.style.fill;
      const realFill = fill || ff;
      if (!realFill || realFill === 'none') return false;
      const w = Number(f.width) || 0;
      const h = Number(f.height) || 0;
      // Skip the full-canvas background and tiny accent strips.
      if (w >= 740 && h >= 430) return false;
      if (h < 16 || w < 40) return false;
      return true;
    }
    if (f.type === 'draw_circle') {
      const ff = f.style && f.style.fill;
      if (!ff || ff === 'none') return false;
      const r = Number(f.radius) || 0;
      if (r < 16) return false;
      return true;
    }
    if (f.type === 'draw_object') return !!(f.object_type);
    if (f.type === 'draw_physics_shape') return !!(f.shape_type);
    if (f.type === 'draw_callout') return true;
    return false;
  };

  const isHeaderText = (f) => {
    if (!f || f.type !== 'draw_text') return false;
    const [x, y] = f.position || [0, 0];
    const fs = (f.style && f.style.fontSize) || 14;
    const anchor = (f.style && f.style.textAnchor) || 'start';
    if (anchor !== 'middle') return false;
    if (y > HEADER_BAND_Y) return false;
    if (fs < HEADER_MIN_FONT) return false;
    if (Math.abs(x - 400) > HEADER_CENTER) return false;
    return true;
  };

  const isConnector = (f) => {
    if (!f || typeof f !== 'object') return false;
    if (f.type !== 'draw_arrow' && f.type !== 'draw_line') return false;
    // The header underline is a draw_line, not a connector — let it join the
    // header unit (it lives in y ≤ 60).
    if (f.type === 'draw_line' && Array.isArray(f.from) && Array.isArray(f.to)) {
      const avgY = (f.from[1] + f.to[1]) / 2;
      if (avgY <= 70) return false;
    }
    return true;
  };

  const units = [];
  let headerFragments = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.fragments.length) units.push(current);
    current = null;
  };

  for (const frag of fragments) {
    if (!frag || typeof frag !== 'object') continue;

    // Camera / clear / draw_caption never appear here (the composer filters
    // them out before), but if any sneak in, skip them.
    if (frag.type === 'camera' || frag.type === 'clear' || frag.type === 'draw_caption') continue;

    if (isHeaderText(frag)) {
      // First header text opens the header unit.
      if (current && current.role !== 'header') pushCurrent();
      if (!current) {
        current = { role: 'header', fragments: [...headerFragments] };
        headerFragments = [];
      }
      current.fragments.push(frag);
      continue;
    }

    if (isFilledContainer(frag)) {
      // Sub-element check: a colored header strip drawn *inside* the current
      // unit's container (e.g. a column's accent bar at its top) is part of
      // that same unit — not a new one. We require the new rect to fit
      // *inside* the current unit's open container (≤20 px margin) AND
      // overlap horizontally. This stops compare_two / compare_three
      // templates from splitting each column into 2 units.
      if (current && current.role === 'content' && current.openContainer) {
        const oc = current.openContainer;
        if (frag.type === 'draw_rect') {
          const fx = Number(frag.x) || 0;
          const fy = Number(frag.y) || 0;
          const fw = Number(frag.width) || 0;
          const fh = Number(frag.height) || 0;
          const inside =
            fx >= oc.x - 20 &&
            fy >= oc.y - 20 &&
            fx + fw <= oc.x + oc.w + 20 &&
            fy + fh <= oc.y + oc.h + 20;
          if (inside) {
            current.fragments.push(frag);
            continue;
          }
        }
      }

      // A new top-level container closes the prior unit and opens a new one.
      if (current && current.role !== 'header') pushCurrent();
      if (current && current.role === 'header') {
        // Promote header into its own unit before opening a content unit.
        pushCurrent();
      }
      if (!current) current = { role: 'content', fragments: [] };
      // Remember the open container so subsequent sub-element rects can
      // recognize they belong to this unit.
      if (frag.type === 'draw_rect') {
        current.openContainer = {
          x: Number(frag.x) || 0,
          y: Number(frag.y) || 0,
          w: Number(frag.width) || 0,
          h: Number(frag.height) || 0,
        };
      } else if (frag.type === 'draw_circle') {
        const [cx, cy] = frag.center || [0, 0];
        const r = Number(frag.radius) || 0;
        current.openContainer = { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
      }
      current.fragments.push(frag);
      continue;
    }

    if (isConnector(frag)) {
      // A connector is its own micro-unit sitting between the two content
      // units it connects — gives the user a "→" beat between ideas.
      if (current) pushCurrent();
      units.push({ role: 'connector', fragments: [frag] });
      continue;
    }

    // Anything else (text, badge, callout already handled above, equation,
    // table, graph, highlight) attaches to the most recent open unit so it
    // doesn't dangle. If no unit is open yet (no header, no container seen),
    // start a header/lead unit so early labels don't trail.
    if (!current) current = { role: 'header', fragments: [...headerFragments] };
    if (current.role === 'header') {
      current.fragments.push(frag);
      continue;
    }
    current.fragments.push(frag);
  }

  if (current) pushCurrent();
  if (headerFragments.length && !units.length) {
    units.unshift({ role: 'header', fragments: headerFragments });
  }

  // If the result is one giant unit (e.g. a single-shape template), still
  // return it — the timing loop will pace it normally.
  return units;
}

/**
 * Evenly distribute caption chunks across the units of a board. Caption 0
 * goes to the first content unit (or the only unit, if there's just one).
 * Captions span the full teaching arc of the beat, so the first chunk lands
 * at the opening unit and the last lands at the closing unit. Each unit
 * gets at most one chunk; extras fold into the last unit so we never lose
 * teaching text silently.
 */
function distributeCaptions(units, captions) {
  const out = units.map(() => '');
  if (!captions.length || !units.length) return out;

  // Identify the content units (skip connectors for caption placement — the
  // student is reading the explanation, not the arrow between concepts).
  const contentIdx = [];
  units.forEach((u, i) => { if (u.role !== 'connector') contentIdx.push(i); });
  if (!contentIdx.length) contentIdx.push(0);

  captions.forEach((cap, ci) => {
    const target = contentIdx[Math.min(ci, contentIdx.length - 1)];
    out[target] = out[target] ? `${out[target]} ${cap}` : cap;
  });
  return out;
}

function countConnectors(units) {
  return units.filter((u) => u.role === 'connector').length;
}

// Split a beat's narration into short, readable caption clauses (≤ ~12 words)
// that scroll along the bottom band as the board draws. These ARE the narration
// the student reads (no audio), so we keep enough chunks to avoid truncating
// the explanation, but each chunk stays short so the band never becomes a wall.
function splitCaption(say) {
  const text = String(say || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    if (words.length <= 12) { chunks.push(sentence); continue; }
    for (let i = 0; i < words.length; i += 11) chunks.push(words.slice(i, i + 11).join(' '));
  }
  return chunks.slice(0, 14);
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
  const ordered = fragments;
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
