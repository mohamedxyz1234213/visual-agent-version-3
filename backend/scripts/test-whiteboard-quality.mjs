// -----------------------------------------------------------------------------
// Whiteboard diagnostic harness.
//
// Unlike the smoke test, this MEASURES the three problems the user reports:
//   1. OVERLAP    — drawn boxes/labels that intersect within a single board.
//   2. EMPTY      — boards that render almost nothing (chosen template had no
//                   data to fill, or the scene carried no usable slots).
//   3. LIFETIME   — how long each shape stays on screen, derived from the real
//                   composeStoryboard timing + the frontend `clear` semantics.
//   4. DENSITY    — shapes per board and per lesson.
//
// It feeds REALISTIC, multi-intent board_scenes (the kind the AI emits) through
// the real pipeline and prints a per-board report + global verdict.
//
// Run: node scripts/diagnose-whiteboard.mjs
// -----------------------------------------------------------------------------

import { buildWhiteboardForPart } from '../src/services/whiteboard/index.js';
import { validateBoardScenes } from '../src/services/whiteboard/validator.js';
import { partToPscenes } from '../src/services/whiteboard/pedagogyAdapter.js';
import { getTemplate, getTemplatesByIntent } from '../src/services/whiteboard/templateLibrary.js';
import { normalizeIntent } from '../src/services/whiteboard/sceneComposer.js';

const TRACE = process.argv.includes('--trace');

// Replica of sceneComposer.chooseTemplate so the harness can report which
// template each board picked and how many fragments it produced (root-causes
// EMPTY boards: a chosen template read a slot the scene never filled).
function traceTemplates(part, field) {
  const ps = partToPscenes(part);
  const used = new Set();
  ps.forEach((p, i) => {
    const intent = normalizeIntent(p.intent);
    const pool = getTemplatesByIntent(intent, field);
    const fresh = pool.filter((t) => !used.has(t.id));
    const cands = fresh.length ? fresh : pool;
    const id = (p.template && getTemplate(p.template)) ? p.template : cands[i % cands.length].id;
    used.add(id);
    if (used.size >= 12) used.clear();
    const tmpl = getTemplate(id);
    let n = 0;
    try { n = (tmpl.fill(p.data || {}, { title: part.title, subtitle: p.goal || '' }) || []).filter(Boolean).length; } catch { n = -1; }
    console.log(`     trace board ${i}: intent=${intent} → ${id}  frags=${n}  slots=[${Object.keys(p.data || {}).join(',')}]`);
  });
}

// ── Sample topics: each is a full content part with the variety of board_scenes
// the AI produces in the wild. We deliberately include scenes whose intent the
// template pool can satisfy AND scenes that are thin, to surface empty boards.
// The first topic uses LONG text at the validator's caps (48-char anchors,
// 90-char lines) — the lengths that wrapped and overlapped in the real lesson —
// so the layout/fit pass is actually stressed, not just short demo strings.
const TOPICS = [
  {
    title: 'Cellular Respiration and the Mitochondrial Electron Transport Chain',
    field: 'biology',
    duration_seconds: 300,
    board_scenes: [
      { intent: 'define', goal: 'define respiration', headline: 'Cellular Respiration: Energy Release Pathway', definition: 'A multi-stage metabolic pathway that oxidises glucose to release usable chemical energy as ATP.', points: ['Breaks glucose down across several coordinated enzymatic stages', 'Transfers electrons to oxygen, the final electron acceptor', 'Captures released energy in the bonds of ATP molecules'], say: 'Cellular respiration is the pathway cells use to break down glucose and capture its energy as ATP.' },
      { intent: 'process', goal: 'three stages', steps: [{ title: 'Glycolysis in the cytoplasm', detail: 'Glucose splits into two pyruvate molecules, yielding a small net ATP gain' }, { title: 'Krebs cycle in the matrix', detail: 'Pyruvate is fully oxidised, releasing carbon dioxide and high-energy carriers' }, { title: 'Electron transport chain', detail: 'Carriers donate electrons that pump protons and drive ATP synthase' }], say: 'It proceeds through glycolysis, the Krebs cycle, and the electron transport chain.' },
      { intent: 'compare', goal: 'aerobic vs anaerobic', columns: [{ title: 'Aerobic respiration with oxygen present', items: ['Uses oxygen as the final electron acceptor', 'Yields roughly thirty-six ATP per glucose molecule', 'Produces carbon dioxide and water as products'] }, { title: 'Anaerobic respiration without oxygen', items: ['Proceeds without any oxygen available', 'Yields only two ATP per glucose molecule', 'Produces lactate or ethanol depending on organism'] }], say: 'With oxygen the yield is high; without it, cells fall back on a far less efficient route.' },
      { intent: 'recap', goal: 'summary', points: ['Glucose is oxidised in three linked stages', 'Electrons flow down the chain to oxygen', 'The proton gradient powers ATP synthase', 'Aerobic respiration vastly out-yields anaerobic'], say: 'In summary, respiration oxidises glucose in stages and uses the electron flow to make ATP.' },
    ],
  },
  {
    title: 'How Neural Networks Learn',
    field: 'programming',
    duration_seconds: 300,
    board_scenes: [
      { intent: 'define', goal: 'what is a neuron', headline: 'Artificial Neuron', definition: 'A unit that weighs inputs and fires an output.', points: ['Takes many inputs', 'Applies weights', 'Outputs one signal'], say: 'A neural network is built from tiny units called neurons, each taking several inputs, weighing them, and producing a single output.' },
      { intent: 'process', goal: 'forward pass', steps: [{ title: 'Input', detail: 'Data enters' }, { title: 'Weighted sum', detail: 'Multiply and add' }, { title: 'Activation', detail: 'Squash result' }, { title: 'Output', detail: 'Prediction' }], say: 'During the forward pass, data flows from the input, through a weighted sum, an activation function, and out as a prediction.' },
      { intent: 'cause', goal: 'why error matters', links: [{ title: 'Wrong prediction' }, { title: 'Compute loss' }, { title: 'Adjust weights' }], say: 'When the prediction is wrong we compute a loss, and that loss tells us how to adjust the weights.' },
      { intent: 'cycle', goal: 'training loop', stages: [{ title: 'Predict' }, { title: 'Measure loss' }, { title: 'Backprop' }, { title: 'Update' }], say: 'Training is a loop: predict, measure loss, backpropagate, and update, over and over.' },
      { intent: 'recap', goal: 'summary', points: ['Neurons weigh inputs', 'Forward pass predicts', 'Loss drives learning', 'Repeat until good'], say: 'To recap, neurons weigh inputs, the forward pass makes a prediction, the loss drives learning, and we repeat until the network is good.' },
    ],
  },
  {
    title: 'The French Revolution',
    field: 'history',
    duration_seconds: 280,
    board_scenes: [
      { intent: 'timeline', goal: 'key events', events: [{ label: '1789 Estates-General' }, { label: '1789 Bastille' }, { label: '1792 Republic' }, { label: '1793 Terror' }, { label: '1799 Napoleon' }], say: 'The revolution unfolded across a decade of dramatic events.' },
      { intent: 'cause', goal: 'why it happened', links: [{ title: 'Debt & taxes' }, { title: 'Inequality' }, { title: 'Revolution' }], say: 'Crushing debt and deep inequality lit the fuse of revolution.' },
      { intent: 'compare', goal: 'estates', columns: [{ title: 'First & Second', items: ['Clergy & nobles', 'Few taxes', 'Privilege'] }, { title: 'Third Estate', items: ['Everyone else', 'All the taxes', 'No power'] }], say: 'French society was split between the privileged estates and everyone else.' },
      { intent: 'recap', goal: 'legacy', points: ['Ended absolute monarchy', 'Spread liberty ideas', 'Reshaped Europe'], say: 'Its legacy ended absolute monarchy and spread ideas of liberty across Europe.' },
    ],
  },
  {
    title: 'Photosynthesis',
    field: 'biology',
    duration_seconds: 300,
    board_scenes: [
      { intent: 'map', goal: 'inside a leaf', headline: 'Chloroplast', diagram: 'cell', labels: ['Thylakoid', 'Stroma', 'Membrane'], say: 'Photosynthesis happens inside the chloroplast, a tiny green machine in plant cells.' },
      { intent: 'formula', goal: 'the equation', formula: '6CO2 + 6H2O -> C6H12O6 + 6O2', terms: [{ symbol: 'CO2', meaning: 'carbon dioxide' }, { symbol: 'H2O', meaning: 'water' }, { symbol: 'O2', meaning: 'oxygen' }], say: 'The overall reaction turns carbon dioxide and water into glucose and oxygen.' },
      { intent: 'process', goal: 'two stages', steps: [{ title: 'Light reactions', detail: 'Capture energy' }, { title: 'Calvin cycle', detail: 'Build sugar' }], say: 'It proceeds in two linked stages: the light reactions and the Calvin cycle.' },
      { intent: 'define', goal: 'thin scene', headline: 'Glucose', say: 'Glucose is the sugar the plant builds and uses for energy.' },
      { intent: 'recap', goal: 'summary', points: ['Light + water + CO2', 'Stored in glucose', 'Oxygen released'], say: 'In short, light, water, and CO2 become glucose, releasing oxygen.' },
    ],
  },
];

// ── Geometry: HONEST bounding boxes, including wrapped TEXT.
// The earlier version excluded text from overlap — which hid the exact bug the
// user reported (text on boxes / text on text). Here text is a first-class box,
// sized for the lines it actually wraps to, and text collisions ARE counted.
const CANVAS_W = 800, CANVAS_H = 500;

// Mirror the frontend's wrap: chars-per-line from width, then line count → height.
function wrappedTextBox(content, x, y, fs, anchor, maxWidthHint) {
  const text = String(content || '');
  const maxWidth = maxWidthHint ?? (anchor === 'middle' ? 560 : anchor === 'end' ? x : 720 - x);
  const charsPerLine = Math.max(8, Math.floor(maxWidth / (fs * 0.55)));
  const words = text.split(/\s+/).filter(Boolean);
  let lines = 1, cur = 0;
  for (const w of words) {
    const add = (cur ? 1 : 0) + w.length;
    if (cur + add > charsPerLine && cur) { lines++; cur = w.length; } else cur += add;
  }
  const lineH = fs * 1.35;
  const widestLine = Math.min(maxWidth, Math.max(...words.map((w) => w.length), text.length / lines) * fs * 0.55);
  const w = lines === 1 ? Math.min(maxWidth, text.length * fs * 0.55) : maxWidth * 0.92;
  const h = lines * lineH;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { x0, y0: y - fs, x1: x0 + w, y1: y - fs + h, kind: 'text', lines };
}

function bbox(f) {
  const t = f.type;
  if (t === 'draw_rect' || t === 'draw_highlight') {
    const x = f.x ?? (f.position && f.position[0]) ?? 0;
    const y = f.y ?? (f.position && f.position[1]) ?? 0;
    const fill = f.style && f.style.fill;
    if (t === 'draw_rect' && (!fill || fill === 'none')) return null; // outline/frame
    return { x0: x, y0: y, x1: x + (f.width || 0), y1: y + (f.height || 0), kind: 'box' };
  }
  if (t === 'draw_circle') {
    const [cx, cy] = f.center || [0, 0];
    const r = f.radius || 0;
    const fill = f.style && f.style.fill;
    if (!fill || fill === 'none') return null; // guide ring
    if (r < 24) return null; // step-number dot / node marker — ornament
    return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, kind: 'box', isCircle: true };
  }
  if (t === 'draw_text') {
    const [x, y] = f.position || [0, 0];
    const fs = (f.style && f.style.fontSize) || 14;
    const anchor = (f.style && f.style.textAnchor) || 'start';
    // honor the explicit fit width the layout pass assigned (renderer does too)
    const mw = f.style && f.style.maxWidth;
    return wrappedTextBox(f.content, x, y, fs, anchor, mw);
  }
  if (t === 'show_equation' || t === 'draw_badge') {
    const [x, y] = f.position || [0, 0];
    const fs = (f.style && f.style.fontSize) || 14;
    const len = String(f.content || f.latex || '').length;
    const w = Math.min(len * fs * 0.6 + 20, 760);
    // Badges are small number/label CHIPS designed to straddle a card corner —
    // they are ornaments, not body text, so classify them separately so a chip
    // sitting on a box edge isn't a false "overlap".
    const kind = t === 'draw_badge' ? 'badge' : 'text';
    const anchor = (f.style && f.style.textAnchor) || (t === 'draw_badge' ? 'start' : 'middle');
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    return { x0, y0: y - fs, x1: x0 + w, y1: y + fs * 0.5, kind };
  }
  if (t === 'draw_callout') {
    const [x, y] = f.position || [0, 0];
    return { x0: x, y0: y, x1: x + (f.width || 240), y1: y + 60, kind: 'box' };
  }
  if (t === 'draw_object' || t === 'draw_physics_shape') {
    const [x, y] = f.position || [0, 0];
    const [w, h] = f.size || [120, 100];
    return { x0: x, y0: y, x1: x + w, y1: y + h, kind: 'object' };
  }
  if (t === 'draw_caption') {
    // caption band element — its own reserved zone, excluded from board overlap
    return null;
  }
  return null; // lines/arrows/paths/graphs: connectors, skip
}

function area(b) { return Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0); }
function intersectArea(a, b) {
  const x = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const y = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  return x * y;
}
// Is `txt` a legitimate label OF container `c`? True when the text's CENTER is
// inside the container and it doesn't overflow the container much — this covers
// both a paragraph inside a panel and a number centred on a small node, while
// still flagging text that spilled beyond its box or onto a non-parent.
function isLabelOf(txt, c) {
  const cx = (txt.x0 + txt.x1) / 2, cy = (txt.y0 + txt.y1) / 2;
  const centerIn = cx >= c.x0 - 2 && cx <= c.x1 + 2 && cy >= c.y0 - 2 && cy <= c.y1 + 6;
  if (!centerIn) return false;
  const lineH = (txt.y1 - txt.y0) / Math.max(1, txt.lines || 1);
  const fitsX = txt.x1 <= c.x1 + 16 && txt.x0 >= c.x0 - 16;
  const fitsY = txt.y1 <= c.y1 + lineH * 0.6;
  return fitsX && fitsY;
}

// HONEST overlap: count collisions the user would SEE as a mess.
//  • text↔text overlap (labels never legitimately stack) — always bad.
//  • text↔box/object where the text is NOT contained inside that box
//    (i.e. it spilled out of its own slot onto a neighbor) — bad.
//  • box↔box peer overlap (excluding nesting) — bad.
//  • any element overflowing the canvas — bad.
function countOverlaps(frags) {
  const boxes = frags
    .map((f, i) => { const b = bbox(f); return b ? { ...b, i } : null; })
    .filter(Boolean);
  let bad = 0;
  const pairs = [];
  for (let a = 0; a < boxes.length; a++) {
    for (let b = a + 1; b < boxes.length; b++) {
      const A = boxes[a], B = boxes[b];
      const inter = intersectArea(A, B);
      if (inter <= 0) continue;
      const areaA = area(A) || 1, areaB = area(B) || 1;
      const ratio = inter / Math.min(areaA, areaB);
      const larger = Math.max(areaA, areaB) / Math.min(areaA, areaB);

      // Badge chips are corner ornaments — allowed to straddle a box/object
      // edge. Only flag a badge when it lands on actual TEXT (covering words).
      if (A.kind === 'badge' || B.kind === 'badge') {
        const other = A.kind === 'badge' ? B : A;
        if (other.kind === 'text' && ratio > 0.45) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'badge-text']); }
        continue;
      }

      // text↔(box/object): OK only if the text fits inside that container.
      if ((A.kind === 'text') !== (B.kind === 'text')) {
        const txt = A.kind === 'text' ? A : B;
        const cont = A.kind === 'text' ? B : A;
        if (cont.kind === 'box' || cont.kind === 'object') {
          if (isLabelOf(txt, cont)) continue;        // legit label of this box — fine
          if (ratio > 0.18) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'text-spill']); }
          continue;
        }
      }
      // text↔text — never legitimate.
      if (A.kind === 'text' && B.kind === 'text') {
        if (ratio > 0.15) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'text-text']); }
        continue;
      }
      // box↔box / object — exclude intentional nesting.
      if (ratio > 0.8 && larger > 1.6) continue;
      // Venn / lens: two filled circles overlapping is intentional teaching
      if (A.isCircle && B.isCircle) continue;
      if (ratio > 0.35) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'box-box']); }
    }
  }
  return { bad, pairs };
}

// Continuity: the largest gap between consecutive DRAW events on a board (with
// no audio, a long gap = a frozen, dead board the user reads as "empty").
function maxDrawGap(frags) {
  const times = frags.map((f) => f.time).filter((t) => typeof t === 'number').sort((a, b) => a - b);
  let g = 0;
  for (let i = 1; i < times.length; i++) g = Math.max(g, times[i] - times[i - 1]);
  return g;
}


// Split a flat timed visual_sequence back into per-board windows using the
// `clear` markers, then compute, for each drawn shape, how long it lives until
// the next clear (the frontend wipes everything at the next clear).
function analyzeTiming(seq) {
  const clears = seq.filter((s) => s.type === 'clear').map((s) => s.time);
  const lastTime = seq.reduce((m, s) => Math.max(m, s.time || 0), 0);
  const drawables = seq.filter((s) => !['clear', 'camera'].includes(s.type));
  const lifetimes = drawables.map((s) => {
    const nextClear = clears.find((c) => c > s.time);
    const end = nextClear ?? lastTime;
    return end - s.time;
  });
  // window per board = gap between successive clears (and the tails)
  const bounds = [0, ...clears, lastTime];
  const windows = [];
  for (let i = 0; i < bounds.length - 1; i++) windows.push(+(bounds[i + 1] - bounds[i]).toFixed(1));
  return { lifetimes, windows, lastTime };
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return +s[Math.floor((p / 100) * (s.length - 1))].toFixed(1);
}

console.log('═══════════════════════════════════════════════════════════════');
console.log(' WHITEBOARD DIAGNOSTIC — overlap · empty · lifetime · density');
console.log('═══════════════════════════════════════════════════════════════');

const global = { boards: 0, empty: 0, overlapBoards: 0, totalOverlaps: 0, shapes: 0, flashy: 0, lifetimes: [], shapesPerBoard: [], windows: [], maxWindow: 0, worstSkew: 0, worstGap: 0 };

for (const topic of TOPICS) {
  console.log(`\n▌ ${topic.title}  (field=${topic.field}, ${topic.board_scenes.length} scenes, ${topic.duration_seconds}s)`);
  // run through the REAL validator + builder
  const cleaned = validateBoardScenes(topic.board_scenes);
  const part = { ...topic, part_type: 'content', board_scenes: cleaned, narration: cleaned.map((c) => c.say).join(' ') };
  const seq = buildWhiteboardForPart(part, { lessonTitle: topic.title, field: topic.field });
  if (TRACE) traceTemplates(part, topic.field);

  // group fragments per board via clears
  const boards = [];
  let cur = [];
  for (const s of seq) {
    if (s.type === 'clear') { boards.push(cur); cur = []; continue; }
    if (s.type === 'camera') continue;
    cur.push(s);
  }
  boards.push(cur);

  const timing = analyzeTiming(seq);

  boards.forEach((frags, bi) => {
    global.boards++;
    const drawn = frags.length;
    global.shapes += drawn;
    global.shapesPerBoard.push(drawn);
    const { bad, pairs } = countOverlaps(frags);
    const win = timing.windows[bi] ?? 0;
    const isEmpty = drawn <= 4; // header(2) + maybe 1-2 = effectively blank teaching board
    if (isEmpty) global.empty++;
    if (bad > 0) { global.overlapBoards++; global.totalOverlaps += bad; }
    const flag = [
      isEmpty ? 'EMPTY' : '',
      bad > 0 ? `OVERLAP×${bad}` : '',
      win < 6 ? `FLASH(${win}s)` : '',
      win > 90 ? `STALL(${win}s)` : '',
    ].filter(Boolean).join(' ');
    console.log(`   board ${bi}: ${String(drawn).padStart(3)} shapes · window ${String(win).padStart(6)}s  ${flag}`);
    if (TRACE) {
      const hist = {};
      frags.forEach((f) => { hist[f.type] = (hist[f.type] || 0) + 1; });
      console.log(`             types: ${JSON.stringify(hist)}`);
    }
    if (bad > 0) {
      console.log(`             overlap pairs (idx,idx,ratio): ${JSON.stringify(pairs.slice(0, 6))}`);
      if (TRACE) {
        const idxs = new Set(pairs.flatMap((p) => [p[0], p[1]]));
        idxs.forEach((ix) => {
          const f = frags[ix]; const b = bbox(f);
          const where = b ? `(${Math.round(b.x0)},${Math.round(b.y0)})-(${Math.round(b.x1)},${Math.round(b.y1)})` : 'no-box';
          console.log(`               [${ix}] ${f.type} ${where} "${String(f.content || f.label || '').slice(0, 24)}"`);
        });
      }
    }
  });

  // lifetimes
  global.lifetimes.push(...timing.lifetimes);
  const flashy = timing.lifetimes.filter((l) => l < 2).length;
  global.flashy += flashy;
  // window band: ratio of widest to narrowest board window (skew indicator)
  if (timing.windows.length) {
    global.windows.push(...timing.windows);
    const wmin = Math.min(...timing.windows), wmax = Math.max(...timing.windows);
    global.maxWindow = Math.max(global.maxWindow, wmax);
    global.worstSkew = Math.max(global.worstSkew, wmax / Math.max(wmin, 0.1));
  }
  // continuity: largest gap between consecutive draws WITHIN a board (a frozen
  // mid-board board reads as "empty"). Board-transition pauses (a wipe + camera
  // move between beats) are intentional and excluded by measuring per board.
  const partGap = Math.max(0, ...boards.map(maxDrawGap));
  global.worstGap = Math.max(global.worstGap, partGap);
  console.log(`   ── shapes:${seq.filter(s=>!['clear','camera'].includes(s.type)).length}  windows:${JSON.stringify(timing.windows)}  total:${timing.lastTime}s  flashy(<2s):${flashy}  maxGap:${partGap.toFixed(1)}s`);
}

console.log('\n───────────────────────────────────────────────────────────────');
console.log(' GLOBAL VERDICT');
console.log('───────────────────────────────────────────────────────────────');
console.log(` boards total ............ ${global.boards}`);
console.log(` empty boards ............ ${global.empty}   ${global.empty ? '❌' : '✅'}`);
console.log(` boards w/ overlap ....... ${global.overlapBoards} (${global.totalOverlaps} pairs)  ${global.overlapBoards ? '❌' : '✅'}`);
console.log(` shapes total ............ ${global.shapes}   (target ≥150/lesson-ish)`);
console.log(` shapes/board p50 ........ ${pct(global.shapesPerBoard, 50)}   min ${Math.min(...global.shapesPerBoard)}  max ${Math.max(...global.shapesPerBoard)}`);
console.log(` shape lifetime p10 ...... ${pct(global.lifetimes, 10)}s   p50 ${pct(global.lifetimes, 50)}s   p90 ${pct(global.lifetimes, 90)}s`);
console.log(` flashy shapes (<2s) ..... ${global.flashy}   ${global.flashy ? '❌' : '✅'}`);
console.log(` board window p50 ........ ${pct(global.windows, 50)}s   min ${Math.min(...global.windows).toFixed(1)}s  max ${global.maxWindow.toFixed(1)}s`);
console.log(` worst window skew ....... ${global.worstSkew.toFixed(1)}×   ${global.worstSkew > 4.5 ? '❌ (boards flash / stall)' : '✅'}`);
console.log(` worst draw gap .......... ${global.worstGap.toFixed(1)}s   ${global.worstGap > 3.2 ? '❌ (board freezes — dead air)' : '✅'}`);
console.log('');

// ─────────────────────────────────────────────────────────────────────────────
// STRESS PASS — every intent × adversarial slot shapes, run through the FULL
// pipeline so the render-and-retry guard + every template are exercised. This
// is where empties/overlaps actually bite in production (AI uses synonym slots,
// sparse data, or wrong slot names). We assert NO empty/overlap board survives.
// ─────────────────────────────────────────────────────────────────────────────
console.log('───────────────────────────────────────────────────────────────');
console.log(' STRESS PASS — every intent with mismatched / sparse slots');
console.log('───────────────────────────────────────────────────────────────');

const INTENTS = ['define', 'compare', 'process', 'hierarchy', 'timeline', 'cause', 'data', 'cluster', 'cycle', 'example', 'recap', 'formula', 'map'];
const FIELDS = ['general', 'programming', 'biology', 'history', 'mathematics', 'economics'];
// Each scene gives ONE generic list under a deliberately "wrong" slot name plus
// a headline, mimicking the AI naming things loosely. The pipeline must still
// fill whatever template the rotation picks.
// Long text at the validator's caps (≈48-char titles, ≈90-char details) — the
// realistic worst case that wraps to multiple lines and exposes overflow.
const SAMPLE_LIST = [
  { title: 'First key idea that runs the full anchor width', detail: 'A supporting clause long enough to wrap to two lines inside a normal card' },
  { title: 'Second idea spanning the whole label region', detail: 'Another detailed supporting clause that pushes against the box height limit' },
  { title: 'Third idea that also fills the label slot', detail: 'A third clause of comparable length to stress the vertical fit inside boxes' },
  { title: 'Fourth idea occupying the full anchor line', detail: 'A closing supporting clause written long on purpose to test wrapping fit' },
];
const WRONG_SLOTS = ['items', 'points', 'steps', 'links', 'events', 'stages', 'children', 'cards'];

const stress = { boards: 0, empty: 0, overlap: 0 };
let seedCounter = 0;
for (const field of FIELDS) {
  for (const intent of INTENTS) {
    // vary which slot the data lands in, and include a SPARSE (1-item) case
    for (const slot of [WRONG_SLOTS[seedCounter % WRONG_SLOTS.length], '__sparse__']) {
      seedCounter++;
      const data = { headline: `${intent} concept`, concept: `${intent} concept`, center: `${intent} concept`, statement: `${intent} concept` };
      if (slot === '__sparse__') data.points = [SAMPLE_LIST[0]];
      else data[slot] = SAMPLE_LIST;
      const part = {
        title: `${intent} board`, part_type: 'content', duration_seconds: 120, field,
        board_scenes: [{ intent, goal: `teach ${intent}`, say: 'A teaching beat of moderate length so timing is sane.', ...data }],
      };
      const cleaned = validateBoardScenes(part.board_scenes);
      if (!cleaned.length) continue;
      const seq = buildWhiteboardForPart({ ...part, board_scenes: cleaned, narration: 'x' }, { field });
      // Split into per-board groups on `clear` — partToPscenes may append a
      // recap board, and overlap must be measured WITHIN a board, never across
      // the wipe boundary (two boards legitimately reuse the same canvas area).
      const groups = [];
      let g = [];
      for (const s of seq) {
        if (s.type === 'clear') { groups.push(g); g = []; continue; }
        if (s.type === 'camera') continue;
        g.push(s);
      }
      groups.push(g);

      for (const frags of groups) {
        stress.boards++;
        const hasShape = frags.some((f) => /rect|circle|object|badge|callout|graph|table|equation|coordinate|physics|path/.test(f.type));
        const meaningful = frags.filter((f) => f.type !== 'draw_line').length;
        const empty = !hasShape && meaningful <= 3;
        const { bad, pairs } = countOverlaps(frags);
        if (empty) { stress.empty++; console.log(`   EMPTY: intent=${intent} field=${field} slot=${slot} (frags=${frags.length})`); }
        if (bad) {
          stress.overlap++;
          console.log(`   OVERLAP×${bad}: intent=${intent} field=${field} slot=${slot}`);
          if (TRACE && stress.overlap <= 4) {
            const idxs = new Set(pairs.flatMap((p) => [p[0], p[1]]));
            const boxes = frags.map(bbox);
            idxs.forEach((ix) => {
              const f = frags[ix]; const b = boxes[ix];
              if (!b) { console.log(`        [${ix}] ${f.type} (no-box)`); return; }
              console.log(`        [${ix}] ${f.type} box=(${Math.round(b.x0)},${Math.round(b.y0)})-(${Math.round(b.x1)},${Math.round(b.y1)}) ${f.type === 'draw_rect' ? `fill=${f.style && f.style.fill}` : ''}`);
            });
          }
        }
      }
    }
  }
}
console.log(`\n stress boards .......... ${stress.boards}`);
console.log(` stress empty ........... ${stress.empty}   ${stress.empty ? '❌' : '✅'}`);
console.log(` stress overlap ......... ${stress.overlap}   ${stress.overlap ? '❌' : '✅'}`);

const allPass = global.empty === 0 && global.overlapBoards === 0 && global.flashy === 0
  && stress.empty === 0 && stress.overlap === 0 && global.worstSkew <= 4.5
  && global.worstGap <= 3.2;
console.log(`\n${allPass ? '✅ WHITEBOARD QUALITY: PASS' : '❌ WHITEBOARD QUALITY: FAIL'}\n`);
process.exit(allPass ? 0 : 1);
