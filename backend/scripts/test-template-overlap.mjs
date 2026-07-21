// -----------------------------------------------------------------------------
// Per-template overlap gate.
//
// Renders EVERY template in the library with representative sample data and
// FAILS if any single template produces a text/box collision or overflows the
// canvas. This is the safety net for mass-producing templates: a new template
// can never silently reintroduce the text-on-box / text-on-text overlaps the
// real lessons were cleaned of.
//
//   node scripts/test-template-overlap.mjs           -> grade all templates
//   node scripts/test-template-overlap.mjs --intent process
//   node scripts/test-template-overlap.mjs --list    -> also print clean ones
//
// The bbox + overlap logic is copied verbatim from test-whiteboard-quality.mjs
// so a template that passes here passes there. (Dev tool — ships nothing.)
// -----------------------------------------------------------------------------

import { allTemplates, renderTemplate } from '../src/services/whiteboard/templateLibrary.js';

const intentFilter = (() => {
  const i = process.argv.indexOf('--intent');
  return i !== -1 ? process.argv[i + 1] : null;
})();
const SHOW_CLEAN = process.argv.includes('--list');

const CANVAS_W = 800, CANVAS_H = 500;

// Representative data so every slot a template might read is populated. Mirrors
// scripts/preview-templates.mjs SAMPLE (kept in sync intentionally).
const SAMPLE = {
  headline: 'Photosynthesis', concept: 'Energy Conversion',
  definition: 'The process plants use to turn light into chemical energy stored as sugar.',
  statement: 'Light powers life on Earth', sub: 'A quick orientation before we dive in',
  formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
  problem: 'Solve 2x + 3 = 11', answer: 'x = 4', outcome: 'Glucose stored, oxygen released',
  takeaway: 'Plants are solar-powered sugar factories', question: 'How do leaves capture light?',
  diagram: 'cell',
  points: ['Occurs in chloroplasts', 'Needs sunlight and water', 'Produces glucose', 'Releases oxygen'],
  items: ['Chlorophyll', 'Thylakoid', 'Stroma', 'Granum'],
  labels: ['Nucleus', 'Chloroplast', 'Vacuole', 'Membrane'],
  steps: [
    { title: 'Light absorption', detail: 'Chlorophyll captures photons' },
    { title: 'Water splitting', detail: 'H₂O breaks into H⁺ and O₂' },
    { title: 'Carbon fixation', detail: 'CO₂ becomes glucose' },
    { title: 'Energy storage', detail: 'Sugar holds the energy' },
  ],
  columns: [
    { title: 'Light reactions', items: ['Need light', 'In thylakoid', 'Make ATP'] },
    { title: 'Calvin cycle', items: ['No light', 'In stroma', 'Make sugar'] },
  ],
  children: [{ title: 'Producers' }, { title: 'Consumers' }, { title: 'Decomposers' }],
  events: [
    { title: '1771', detail: 'Priestley finds O₂' },
    { title: '1779', detail: 'Light needed' },
    { title: '1845', detail: 'Energy from sun' },
    { title: '1937', detail: 'Hill reaction' },
  ],
  cards: [{ title: 'Input', detail: 'Light + CO₂' }, { title: 'Output', detail: 'Sugar + O₂' }, { title: 'Site', detail: 'Chloroplast' }],
  stats: [{ title: 'Efficiency', value: '~3-6%' }, { title: 'O₂ share', value: '~50%' }, { title: 'Species', value: '300k+' }],
  values: [12, 28, 35, 22, 40, 18], graph_type: 'bar',
  pros: ['Renewable', 'Clean', 'Abundant'], cons: ['Slow', 'Diffuse'],
  strengths: ['Scalable'], weaknesses: ['Weather-dependent'], opportunities: ['Biofuels'], threats: ['Land use'],
  terms: [{ symbol: 'CO₂', meaning: 'Carbon dioxide' }, { symbol: 'H₂O', meaning: 'Water' }],
  milestones: [{ title: 'Basics' }, { title: 'Light stage' }, { title: 'Dark stage' }, { title: 'Mastery' }],
  causes: [{ title: 'More light' }, { title: 'More CO₂' }], effect: 'Faster growth',
  center: 'Photosynthesis', satellites: ['Light', 'Water', 'CO₂', 'Chlorophyll'],
  tiers: [{ title: 'Sun' }, { title: 'Plants' }, { title: 'Animals' }],
  branches: [{ title: 'Inputs' }, { title: 'Process' }, { title: 'Outputs' }],
  dependencies: [{ title: 'Light' }, { title: 'Pigments' }, { title: 'Sugar' }],
  before_title: 'Before', after_title: 'After', left_title: 'Reactants', right_title: 'Products',
  pros_title: 'Benefits', cons_title: 'Limits', transform: 'converts to',
  x_label: 'Time', y_label: 'Output', low_label: 'Low', high_label: 'High', start: 'Seed', roof: 'Goal',
  supply_label: 'Supply', demand_label: 'Demand', eq_label: 'Equilibrium',
  shift_label: 'Demand rises', cause: 'Incomes increase',
  on_label: 'Efficient', inside_label: 'Wasteful', outside_label: 'Unattainable',
  layers: [
    { title: 'Client', detail: 'Browser / app' },
    { title: 'API Gateway', detail: 'Routing + auth' },
    { title: 'Service', detail: 'Business logic' },
    { title: 'Database', detail: 'Persistent store' },
  ],
  flow_label: 'request', return_label: 'response', reset_label: 'reset',
  decision: 'Valid?', question: 'Is input valid?', yes_label: 'Yes', no_label: 'No',
  lines: ['const x = readInput()', 'if (!x) return null', 'return transform(x)'],
  code: 'function add(a, b) {\n  return a + b\n}',
  annotations: ['Reads the request', 'Guards against null', 'Returns the result'],
  notes: ['Entry point', 'Validation', 'Output'],
  states: [{ title: 'Idle' }, { title: 'Active' }, { title: 'Done' }],
  nodes: [{ title: 'Start' }, { title: 'Running' }, { title: 'Finished' }],
  transitions: [{ from: 'Idle', to: 'Active' }, { from: 'Active', to: 'Done' }],
  links: [{ from: 'Heart', to: 'Pump' }, { from: 'Lungs', to: 'Gas exchange' }],
  pairs: [{ from: 'Recursion', to: 'Russian dolls' }, { from: 'Stack', to: 'Plate pile' }],
  stages: [{ title: 'Light absorption' }, { title: 'Water splitting' }, { title: 'Carbon fixation' }],
  eras: [
    { title: 'Ancient', detail: '3000 BC', range: '3000–500 BC' },
    { title: 'Medieval', detail: '500 AD', range: '500–1500 AD' },
    { title: 'Modern', detail: '1500 AD', range: '1500–now' },
  ],
  why_title: 'Why it matters', why: ['Powers the food chain', 'Releases the oxygen we breathe'],
  example: 'A single tree can release ~100 kg of oxygen per year.',
  analogy: 'Russian nesting dolls',
  top_label: 'Goods & services', bottom_label: 'Money',
  vectors: [{ title: 'Force A' }, { title: 'Force B' }],
  markers: ['-2', '0', '3', '5'],
};

// ── Geometry: HONEST bounding boxes, including wrapped TEXT (copied verbatim
// from test-whiteboard-quality.mjs so the two gates agree exactly). ──────────
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
    if (t === 'draw_rect' && (!fill || fill === 'none')) return null;
    return { x0: x, y0: y, x1: x + (f.width || 0), y1: y + (f.height || 0), kind: 'box' };
  }
  if (t === 'draw_circle') {
    const [cx, cy] = f.center || [0, 0];
    const r = f.radius || 0;
    const fill = f.style && f.style.fill;
    if (!fill || fill === 'none') return null;
    if (r < 24) return null;
    return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, kind: 'box', isCircle: true };
  }
  if (t === 'draw_text') {
    const [x, y] = f.position || [0, 0];
    const fs = (f.style && f.style.fontSize) || 14;
    const anchor = (f.style && f.style.textAnchor) || 'start';
    const mw = f.style && f.style.maxWidth;
    return wrappedTextBox(f.content, x, y, fs, anchor, mw);
  }
  if (t === 'show_equation' || t === 'draw_badge') {
    const [x, y] = f.position || [0, 0];
    const fs = (f.style && f.style.fontSize) || 14;
    const len = String(f.content || f.latex || '').length;
    const charW = t === 'show_equation' ? fs * 0.55 : fs * 0.6;
    const w = Math.min(len * charW + 16, 480);
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
  return null;
}

function area(b) { return Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0); }
function intersectArea(a, b) {
  const x = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0));
  const y = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  return x * y;
}
function isLabelOf(txt, c) {
  const cx = (txt.x0 + txt.x1) / 2, cy = (txt.y0 + txt.y1) / 2;
  const centerIn = cx >= c.x0 - 2 && cx <= c.x1 + 2 && cy >= c.y0 - 2 && cy <= c.y1 + 6;
  if (!centerIn) return false;
  const lineH = (txt.y1 - txt.y0) / Math.max(1, txt.lines || 1);
  const fitsX = txt.x1 <= c.x1 + 16 && txt.x0 >= c.x0 - 16;
  const fitsY = txt.y1 <= c.y1 + lineH * 0.6;
  return fitsX && fitsY;
}

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
      if (A.kind === 'badge' || B.kind === 'badge') {
        const other = A.kind === 'badge' ? B : A;
        if (other.kind === 'text' && ratio > 0.45) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'badge-text']); }
        continue;
      }
      if ((A.kind === 'text') !== (B.kind === 'text')) {
        const txt = A.kind === 'text' ? A : B;
        const cont = A.kind === 'text' ? B : A;
        if (cont.kind === 'box' || cont.kind === 'object') {
          if (isLabelOf(txt, cont)) continue;
          if (ratio > 0.18) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'text-spill']); }
          continue;
        }
      }
      if (A.kind === 'text' && B.kind === 'text') {
        if (ratio > 0.15) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'text-text']); }
        continue;
      }
      if (ratio > 0.8 && larger > 1.6) continue;
      if (A.isCircle && B.isCircle) continue;
      if (ratio > 0.35) { bad++; pairs.push([A.i, B.i, +ratio.toFixed(2), 'box-box']); }
    }
  }
  return { bad, pairs };
}

// Off-canvas overflow: any drawable bbox poking outside the 800×500 board.
function countOverflow(frags) {
  let n = 0; const hits = [];
  frags.forEach((f, i) => {
    const b = bbox(f);
    if (!b) return;
    const m = 4; // small tolerance for halos/strokes
    if (b.x0 < -m || b.y0 < -m || b.x1 > CANVAS_W + m || b.y1 > CANVAS_H + m) {
      n++; hits.push([i, f.type, Math.round(b.x0), Math.round(b.y0), Math.round(b.x1), Math.round(b.y1)]);
    }
  });
  return { n, hits };
}

// ── Run ──────────────────────────────────────────────────────────────────────
const templates = allTemplates().filter((t) => !intentFilter || t.intent === intentFilter);

let failTemplates = 0;
let totalOverlaps = 0;
let totalOverflow = 0;
const failures = [];

for (const t of templates) {
  const ctx = { title: t.label || t.id, subtitle: `intent: ${t.intent}` };
  let frags = [];
  let err = '';
  try {
    frags = renderTemplate(t.id, SAMPLE, ctx).filter(Boolean);
  } catch (e) {
    err = e.message;
  }
  if (err) {
    failTemplates++;
    failures.push({ id: t.id, intent: t.intent, err });
    console.log(`❌ ${t.id.padEnd(28)} ${('[' + t.intent + ']').padEnd(12)} THREW: ${err}`);
    continue;
  }
  const { bad, pairs } = countOverlaps(frags);
  const { n: ovf, hits } = countOverflow(frags);
  if (bad > 0 || ovf > 0) {
    failTemplates++;
    totalOverlaps += bad;
    totalOverflow += ovf;
    failures.push({ id: t.id, intent: t.intent, bad, ovf, pairs, hits });
    console.log(`❌ ${t.id.padEnd(28)} ${('[' + t.intent + ']').padEnd(12)} overlaps:${bad} overflow:${ovf}`);
    if (bad) pairs.slice(0, 4).forEach((p) => console.log(`     · ${p[3]} ratio=${p[2]} (frags ${p[0]}↔${p[1]})`));
    if (ovf) hits.slice(0, 4).forEach((h) => console.log(`     · off-canvas ${h[1]} [${h[2]},${h[3]} → ${h[4]},${h[5]}]`));
  } else if (SHOW_CLEAN) {
    console.log(`✅ ${t.id.padEnd(28)} ${('[' + t.intent + ']').padEnd(12)} ${frags.length} frags`);
  }
}

console.log('\n───────────────────────────────────────────────────────────────');
console.log(` templates checked ...... ${templates.length}`);
console.log(` templates clean ........ ${templates.length - failTemplates}`);
console.log(` templates failing ...... ${failTemplates}   ${failTemplates ? '❌' : '✅'}`);
console.log(` total overlaps ......... ${totalOverlaps}`);
console.log(` total off-canvas ....... ${totalOverflow}`);
console.log('───────────────────────────────────────────────────────────────');
const pass = failTemplates === 0;
console.log(`\n${pass ? '✅ TEMPLATE OVERLAP GATE: PASS' : '❌ TEMPLATE OVERLAP GATE: FAIL'}\n`);
process.exit(pass ? 0 : 1);
