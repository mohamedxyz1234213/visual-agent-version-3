// -----------------------------------------------------------------------------
// Whiteboard Scene Template Library
// -----------------------------------------------------------------------------
// A curated library of distinct, collision-free whiteboard scene LAYOUTS.
//
// CORE PRINCIPLE (from edits.md):
//   - The AI NEVER invents x/y coordinates.
//   - The AI only chooses a semantic intent + supplies text for named SLOTS.
//   - Each template owns its geometry: every slot has a fixed, pre-validated
//     position that is guaranteed not to overlap any other slot.
//   - Templates carry decorative-but-meaningful SVG "props" (shapes, arrows,
//     frames) so each board feels hand-drawn by a teacher, not generated.
//
// Canvas is 800 x 500. Header band: y < 92 is reserved for title/subtitle.
// Content band: y in [104, 470].
//
// A template is:
//   {
//     id, intent, label, capacity, accent,
//     slots: [ { name, role, x, y, w, h, kind, ... } ],
//     props: [ raw scene fragments drawn as scaffolding ],
//     fill(slotData, ctx) -> array of scene fragments
//   }
//
// `intent` is the pedagogical relationship the template expresses:
//   define | compare | process | hierarchy | timeline | cause | data |
//   cluster | cycle | example | recap | formula | map
// -----------------------------------------------------------------------------

import { SVG_SHAPES } from './svgShapes.js';

const W = 800;
const H = 500;

// Curated accent palette — each template picks a coherent set so colors never clash.
const PALETTES = [
  { accent: '#2563eb', soft: '#dbeafe', ink: '#0f172a' }, // blue
  { accent: '#0f766e', soft: '#ccfbf1', ink: '#0f172a' }, // teal
  { accent: '#7c3aed', soft: '#ede9fe', ink: '#0f172a' }, // violet
  { accent: '#ea580c', soft: '#ffedd5', ink: '#0f172a' }, // orange
  { accent: '#db2777', soft: '#fce7f3', ink: '#0f172a' }, // pink
  { accent: '#16a34a', soft: '#dcfce7', ink: '#0f172a' }, // green
  { accent: '#0284c7', soft: '#e0f2fe', ink: '#0f172a' }, // sky
];

// ── small fragment helpers ──────────────────────────────────────────────────
function txt(content, x, y, opts = {}) {
  return {
    type: 'draw_text',
    content: String(content || ''),
    position: [x, y],
    style: {
      fontSize: opts.fontSize ?? 16,
      color: opts.color ?? '#1e293b',
      fontWeight: opts.fontWeight ?? '600',
      textAnchor: opts.textAnchor ?? 'start',
      fontStyle: opts.fontStyle,
    },
  };
}
function rect(x, y, w, h, opts = {}) {
  return {
    type: 'draw_rect',
    x, y, width: w, height: h,
    label: opts.label,
    style: {
      fill: opts.fill ?? '#ffffff',
      stroke: opts.stroke ?? '#cbd5e1',
      strokeWidth: opts.strokeWidth ?? 1.5,
      rx: opts.rx ?? 14,
      flat: opts.flat,
    },
  };
}
function arrow(from, to, opts = {}) {
  return { type: 'draw_arrow', from, to, label: opts.label, style: { color: opts.color ?? '#475569', strokeWidth: opts.strokeWidth ?? 2, dashed: opts.dashed } };
}
function line(from, to, opts = {}) {
  return { type: 'draw_line', from, to, style: { color: opts.color ?? '#cbd5e1', strokeWidth: opts.strokeWidth ?? 1.5, dashed: opts.dashed } };
}
function circle(cx, cy, r, opts = {}) {
  return { type: 'draw_circle', center: [cx, cy], radius: r, label: opts.label, style: { fill: opts.fill ?? '#ffffff', stroke: opts.stroke ?? '#cbd5e1', strokeWidth: opts.strokeWidth ?? 2 } };
}
function badge(content, x, y, opts = {}) {
  return { type: 'draw_badge', content: String(content || ''), position: [x, y], style: { bg: opts.bg ?? '#1e293b', color: opts.color ?? '#ffffff', fontSize: opts.fontSize ?? 13 } };
}
function callout(content, x, y, w, opts = {}) {
  return { type: 'draw_callout', content: String(content || ''), position: [x, y], width: w, style: { bg: opts.bg ?? '#fffbeb', stroke: opts.stroke ?? '#f59e0b', color: opts.color ?? '#92400e' } };
}
function obj(object_type, x, y, w, h, opts = {}) {
  return { type: 'draw_object', object_type, position: [x, y], size: [w, h], label: opts.label, annotations: opts.annotations, accent: opts.accent };
}
function path(d, opts = {}) {
  return { type: 'draw_path', d, markerEnd: opts.markerEnd, style: { stroke: opts.stroke ?? '#94a3b8', strokeWidth: opts.strokeWidth ?? 2, fill: opts.fill ?? 'none', dashed: opts.dashed } };
}

// ── Rich scientific figures (from the SVG shape library) ─────────────────────
// Each entry adapts the shape library's varied call signatures to one uniform
// shape(name, x, y, w, h) call, so templates can drop in a real diagram (atom,
// DNA, neuron, cell, wave, gear, battery, magnet) instead of a generic box.
// Center a square of side `sz` inside the (x,y,w,h) box (for size-based shapes).
function centeredSquare(x, y, w, h, sz) {
  return [x + (w - sz) / 2, y + (h - sz) / 2];
}
const SHAPE_DISPATCH = {
  // width/height-based shapes draw within their box exactly — pass through.
  dna: (x, y, w, h) => SVG_SHAPES.dnaHelix(x, y, w, h),
  cell: (x, y, w, h) => SVG_SHAPES.plantCell(x, y, w, h),
  wave: (x, y, w, h) => SVG_SHAPES.sineWave(x, y, w, h),
  battery: (x, y, w, h) => SVG_SHAPES.battery(x, y, w, h),
  magnet: (x, y, w, h) => SVG_SHAPES.magnet(x, y, w, h),
  field: (x, y, w, h) => SVG_SHAPES.magneticFieldLines(x, y, w, h),
  // size-based shapes whose drawn extent exceeds the nominal size box:
  // shrink + center so electrons/axons/teeth stay inside the region.
  atom: (x, y, w, h) => { const sz = Math.min(w, h) / 1.5; const [cx, cy] = centeredSquare(x, y, w, h, sz); return SVG_SHAPES.atom(cx, cy, sz); },
  neuron: (x, y, w, h) => { const sz = Math.min(w, h) * 0.62; const [cx, cy] = centeredSquare(x, y, w, h, sz); return SVG_SHAPES.neuron(cx, cy, sz); },
  gear: (x, y, w, h) => { const sz = Math.min(w, h); const [cx, cy] = centeredSquare(x, y, w, h, sz); return SVG_SHAPES.gear(cx, cy, sz); },
};

// Synonyms the model (or a scene's text) might use for each figure.
const SHAPE_ALIASES = {
  dna: 'dna', 'double helix': 'dna', helix: 'dna', genome: 'dna', nucleotide: 'dna',
  neuron: 'neuron', nerve: 'neuron', synapse: 'neuron', axon: 'neuron', dendrite: 'neuron', 'nervous system': 'neuron',
  atom: 'atom', atomic: 'atom', electron: 'atom', proton: 'atom', nucleus: 'atom', 'periodic': 'atom', isotope: 'atom',
  cell: 'cell', 'plant cell': 'cell', chloroplast: 'cell', organelle: 'cell', mitochondria: 'cell', cytoplasm: 'cell', vacuole: 'cell',
  wave: 'wave', sine: 'wave', sinusoid: 'wave', oscillation: 'wave', frequency: 'wave', amplitude: 'wave', waveform: 'wave',
  gear: 'gear', cog: 'gear', mechanism: 'gear', machine: 'gear', torque: 'gear',
  battery: 'battery', cell_charge: 'battery', voltage: 'battery', charge: 'battery',
  magnet: 'magnet', magnetic: 'magnet', 'magnetic field': 'field', poles: 'magnet',
  field: 'field', 'field lines': 'field', flux: 'field',
};

// Resolve an explicit shape name (with alias support) to a dispatch key.
function resolveShapeName(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  if (SHAPE_DISPATCH[key]) return key;
  if (SHAPE_ALIASES[key]) return SHAPE_ALIASES[key];
  return null;
}

// Content-aware auto-detection: scan free text for a figure that fits, so a
// template can render a real diagram even when the model didn't name one.
function pickDiagramForText(...texts) {
  const corpus = texts.filter(Boolean).join(' ').toLowerCase();
  if (!corpus) return null;
  // Longest aliases first so "magnetic field" beats "magnet".
  const aliases = Object.keys(SHAPE_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const re = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (re.test(corpus)) return SHAPE_ALIASES[alias];
  }
  return null;
}

// Render a named figure's fragments positioned within (x,y,w,h). Returns [] if
// the name doesn't resolve, so callers can fall back gracefully.
function shape(name, x, y, w, h) {
  const key = resolveShapeName(name);
  if (!key) return [];
  try {
    return (SHAPE_DISPATCH[key](x, y, w, h) || []).filter(Boolean);
  } catch {
    return [];
  }
}

// Header builder shared by every template (consistent teacher-style heading).
function header(ctx, accent) {
  const out = [];
  if (ctx.title) {
    out.push(txt(ctx.title, W / 2, 44, { fontSize: 25, fontWeight: '800', color: '#0f172a', textAnchor: 'middle' }));
    out.push(line([W / 2 - 150, 58], [W / 2 + 150, 58], { color: accent, strokeWidth: 3 }));
  }
  if (ctx.subtitle) {
    out.push(txt(ctx.subtitle, W / 2, 82, { fontSize: 14, fontWeight: '500', color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
  }
  return out;
}

// Truncate a phrase to keep boards clean (anchor keywords, not paragraphs).
function anchor(text, maxWords = 7) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

// Coerce a slot to an array (string→[string], null→[]), so templates can read
// `.length` without first checking the type.
function asArr(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

// Read a slot item's display text whether it's a string or a {title,text,...}.
function itemText(it) {
  if (it && typeof it === 'object') return it.title || it.text || it.label || it.name || '';
  return it == null ? '' : String(it);
}

// Shared L-shaped axes for graph/economics templates. Returns fragments for a
// y-axis (up) and x-axis (right) with arrowheads, plus optional axis labels.
function axesLShape(ox, oy, top, right, xLabel, yLabel) {
  const out = [
    line([ox, top], [ox, oy], { color: '#475569', strokeWidth: 2 }),
    line([ox, oy], [right, oy], { color: '#475569', strokeWidth: 2 }),
    path(`M ${ox} ${top} l -6 12 l 12 0 z`, { fill: '#475569', stroke: '#475569' }),
    path(`M ${right} ${oy} l -12 -6 l 0 12 z`, { fill: '#475569', stroke: '#475569' }),
  ];
  if (yLabel) out.push(txt(anchor(yLabel, 2), ox + 6, top - 10, { fontSize: 13, fontWeight: '700', color: '#475569', textAnchor: 'start' }));
  if (xLabel) out.push(txt(anchor(xLabel, 2), right, oy + 26, { fontSize: 13, fontWeight: '700', color: '#475569', textAnchor: 'end' }));
  return out;
}

// ── Flow-diagram helpers (icon nodes + smooth connectors + status marks) ─────
// Keyword → bare line-art icon. Lets a flow node show a meaningful icon picked
// from its own label text, so "database" draws a cylinder, "user" a person, etc.
const ICON_KEYWORDS = [
  [/\b(team|people|group|users|audience|community|stakeholder|customer)/, 'users'],
  [/\b(user|person|actor|client|individual|student|teacher|human)/, 'person'],
  [/\b(database|data ?store|sql|records|storage|table)/, 'database'],
  [/\b(server|backend|host|compute|node|vm)/, 'server'],
  [/\b(cloud|internet|web|online|saas)/, 'cloud'],
  [/\b(file|folder|document|directory|archive)/, 'folder'],
  [/\b(secur|protect|defen|guard|safe)/, 'shield'],
  [/\b(lock|encrypt|private|password|restrict)/, 'lock'],
  [/\b(key|access|token|credential|auth)/, 'key'],
  [/\b(approve|valid|correct|success|pass|yes|done|complete|verified)/, 'check'],
  [/\b(reject|invalid|error|fail|no|wrong|denied|blocked)/, 'cross'],
  [/\b(idea|think|learn|knowledge|brain|cognit|mind|memor)/, 'brain'],
  [/\b(money|cost|price|revenue|profit|budget|fund|payment|economic)/, 'money'],
  [/\b(company|business|organi|firm|office|institut|bank|building)/, 'building'],
  [/\b(global|world|geograph|country|region|map|earth)/, 'globe'],
  [/\b(email|message|mail|send|notify|inbox)/, 'envelope'],
  [/\b(chip|processor|cpu|hardware|circuit|device|sensor)/, 'chip'],
  [/\b(goal|flag|milestone|target|finish|objective)/, 'flag'],
  [/\b(star|favorite|rating|quality|best|premium|highlight)/, 'star'],
  [/\b(warn|caution|risk|danger|alert|hazard|problem)/, 'warning'],
  [/\b(speed|performance|metric|measure|rate|level|gauge)/, 'gauge'],
  [/\b(launch|deploy|start|grow|boost|rocket|ship)/, 'rocket'],
  [/\b(deal|agree|partner|contract|collaborat|negotiat|handshake)/, 'handshake'],
  [/\b(growth|increase|trend|chart|analytics|statistic|profit|sales)/, 'chart_up'],
  [/\b(write|edit|author|note|draft|compose|content)/, 'pencil_edit'],
  [/\b(process|engine|system|mechanism|config|setting|operat)/, 'cog_icon'],
  [/\b(time|schedule|deadline|duration|clock|history|when)/, 'clock'],
  [/\b(search|find|explore|discover|analy|research|investigat|examine)/, 'search'],
];
const ICON_CYCLE = ['person', 'database', 'cloud', 'cog_icon', 'chart_up', 'shield', 'globe', 'brain'];
function pickIcon(text, idx = 0) {
  const t = String(text || '').toLowerCase();
  for (const [re, name] of ICON_KEYWORDS) if (re.test(t)) return name;
  return ICON_CYCLE[idx % ICON_CYCLE.length];
}

// Icon node = colored-ring bare icon with a label/detail panel beside it.
// Returns fragments. `accent` colors the ring + panel keyline.
function iconNode(iconType, cx, cy, r, accent, opts = {}) {
  const out = [obj(iconType, cx - r, cy - r, r * 2, r * 2, { accent })];
  if (opts.caption) out.push(txt(anchor(opts.caption, 4), cx, cy + r + 22, { fontSize: 13, fontWeight: '800', color: accent, textAnchor: 'middle' }));
  return out;
}

// A smooth quadratic connector between two points, bowed toward `bow`.
function curveArrow(x1, y1, x2, y2, opts = {}) {
  const mx = (x1 + x2) / 2 + (opts.bowX || 0);
  const my = (y1 + y2) / 2 + (opts.bowY || 0);
  return path(`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`, { stroke: opts.color ?? '#64748b', strokeWidth: opts.strokeWidth ?? 2.4, markerEnd: true });
}

// Status mark: a small green-check / red-cross bare icon at (cx,cy).
function statusMark(ok, cx, cy, size = 30) {
  return obj(ok ? 'check' : 'cross', cx - size / 2, cy - size / 2, size, size, { accent: ok ? '#16a34a' : '#dc2626' });
}

// Side notes panel (light card) with a title and bullet lines, like the
// reference's "Side A" column. Returns fragments; height auto-fits the bullets.
function notePanel(title, bullets, x, y, w, accent) {
  const items = (bullets || []).slice(0, 6).map((b) => anchor(itemText(b), 7)).filter(Boolean);
  const h = 52 + items.length * 26;
  const out = [
    rect(x, y, w, h, { fill: '#f8fafc', stroke: accent, strokeWidth: 1.5, rx: 12 }),
    line([x + 14, y + 38], [x + w - 14, y + 38], { color: accent, strokeWidth: 2 }),
    txt(anchor(title || 'Notes', 4), x + 16, y + 28, { fontSize: 16, fontWeight: '800', color: accent }),
  ];
  items.forEach((it, i) => {
    const ly = y + 60 + i * 26;
    out.push(circle(x + 20, ly - 4, 3.5, { fill: accent, stroke: accent }));
    out.push(txt(it, x + 32, ly, { fontSize: 13, color: '#334155', fontWeight: '500' }));
  });
  return out;
}

// =============================================================================
// TEMPLATE DEFINITIONS
// Each template is intentionally distinct in geometry and decoration so that
// no two templates — and therefore no two scenes — feel the same.
// =============================================================================

const TEMPLATES = [];

function define(t) { TEMPLATES.push(t); }

// ── 1. DEFINITION SPOTLIGHT ──────────────────────────────────────────────────
define({
  id: 'definition_spotlight', intent: 'define', label: 'Definition spotlight',
  capacity: { points: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    s.push(obj('lightbulb', 70, 150, 150, 150, { label: anchor(d.headline || ctx.title, 3) }));
    const term = anchor(d.headline || ctx.title, 4);
    s.push(rect(260, 150, 480, 90, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push(txt(term, 280, 185, { fontSize: 22, fontWeight: '800', color: p.accent }));
    if (d.definition) s.push(txt(anchor(d.definition, 9), 280, 218, { fontSize: 14, color: '#334155', fontWeight: '500' }));
    const pts = (d.points || []).slice(0, 3);
    pts.forEach((pt, i) => {
      const y = 280 + i * 58;
      s.push(circle(290, y + 16, 9, { fill: p.accent, stroke: p.accent }));
      s.push(txt(anchor(pt, 9), 312, y + 21, { fontSize: 14, color: '#1e293b', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 2. SIDE-BY-SIDE COMPARISON ───────────────────────────────────────────────
define({
  id: 'compare_two', intent: 'compare', label: 'Two-column comparison',
  capacity: { columns: 2, rows: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const cols = (d.columns || []).slice(0, 2);
    const left = cols[0] || { title: 'A', items: [] };
    const right = cols[1] || { title: 'B', items: [] };
    const boxW = 320, boxH = 300, gap = 40;
    const x0 = (W - boxW * 2 - gap) / 2;
    [left, right].forEach((col, ci) => {
      const x = x0 + ci * (boxW + gap);
      const acc = ci === 0 ? p.accent : '#0f766e';
      s.push(rect(x, 110, boxW, boxH, { stroke: acc, strokeWidth: 2 }));
      s.push(rect(x, 110, boxW, 44, { fill: acc, stroke: acc, rx: 14 }));
      s.push(txt(anchor(col.title, 4), x + boxW / 2, 138, { fontSize: 17, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      (col.items || []).slice(0, 4).forEach((it, i) => {
        const y = 178 + i * 54;
        s.push(circle(x + 24, y, 6, { fill: acc, stroke: acc }));
        s.push(txt(anchor(it, 7), x + 40, y + 5, { fontSize: 13, color: '#334155', fontWeight: '500' }));
      });
    });
    s.push(txt('vs', W / 2, 270, { fontSize: 18, fontWeight: '800', color: '#94a3b8', textAnchor: 'middle' }));
    return s;
  },
});

// ── 3. HORIZONTAL PROCESS PIPELINE ───────────────────────────────────────────
define({
  id: 'process_pipeline', intent: 'process', label: 'Process pipeline',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || []).slice(0, 4);
    const n = Math.max(steps.length, 1);
    const boxW = 150, boxH = 96, gap = (W - 80 - boxW * n) / Math.max(n - 1, 1);
    const y = 230;
    steps.forEach((st, i) => {
      const x = 40 + i * (boxW + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(badge(String(i + 1), x + 16, y - 14, { bg: p.accent }));
      s.push(txt(anchor(st.title || st, 5), x + boxW / 2, y + 42, { fontSize: 14, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 6), x + boxW / 2, y + 66, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
      if (i < steps.length - 1) s.push(arrow([x + boxW + 4, y + boxH / 2], [x + boxW + gap - 4, y + boxH / 2], { color: p.accent, strokeWidth: 2.5 }));
    });
    if (d.outcome) s.push(callout(anchor(d.outcome, 12), 120, 370, 560));
    return s;
  },
});

// ── 4. VERTICAL HIERARCHY TREE ───────────────────────────────────────────────
define({
  id: 'hierarchy_tree', intent: 'hierarchy', label: 'Concept hierarchy tree',
  capacity: { root: 1, children: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const root = anchor(d.root || ctx.title, 4);
    const rootW = 220, rootX = (W - rootW) / 2;
    s.push(rect(rootX, 110, rootW, 56, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft }));
    s.push(txt(root, W / 2, 144, { fontSize: 18, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const kids = (d.children || []).slice(0, 4);
    const n = Math.max(kids.length, 1);
    const boxW = 158, boxH = 90;
    const totalW = boxW * n + 26 * (n - 1);
    const x0 = (W - totalW) / 2;
    const branchY = 200, kidY = 290;
    s.push(line([W / 2, 166], [W / 2, branchY], { color: p.accent, strokeWidth: 2 }));
    kids.forEach((kid, i) => {
      const x = x0 + i * (boxW + 26);
      const cx = x + boxW / 2;
      s.push(line([W / 2, branchY], [cx, branchY], { color: p.accent, strokeWidth: 2 }));
      s.push(line([cx, branchY], [cx, kidY], { color: p.accent, strokeWidth: 2 }));
      s.push(rect(x, kidY, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8 }));
      s.push(txt(anchor(kid.title || kid, 4), cx, kidY + 34, { fontSize: 14, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (kid.detail) s.push(txt(anchor(kid.detail, 5), cx, kidY + 60, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 5. TIMELINE ──────────────────────────────────────────────────────────────
define({
  id: 'timeline_horizontal', intent: 'timeline', label: 'Horizontal timeline',
  capacity: { events: 5 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const events = (d.events || []).slice(0, 5);
    const n = Math.max(events.length, 1);
    const y = 270;
    s.push(line([60, y], [740, y], { color: p.accent, strokeWidth: 3 }));
    s.push(path(`M 740 ${y} l -12 -6 l 0 12 z`, { fill: p.accent, stroke: p.accent }));
    const step = 660 / Math.max(n, 1);
    events.forEach((ev, i) => {
      const x = 80 + i * step + step / 2;
      const up = i % 2 === 0;
      const labelY = up ? y - 92 : y + 30;
      s.push(circle(x, y, 10, { fill: '#ffffff', stroke: p.accent, strokeWidth: 3 }));
      s.push(line([x, y], [x, up ? y - 40 : y + 40], { color: p.accent, strokeWidth: 1.5, dashed: true }));
      s.push(rect(x - 78, labelY, 156, 56, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(ev.label || ev.title || ev, 5), x, labelY + 24, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (ev.detail) s.push(txt(anchor(ev.detail, 5), x, labelY + 44, { fontSize: 10, color: '#64748b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 6. CAUSE → EFFECT CHAIN ──────────────────────────────────────────────────
define({
  id: 'cause_effect', intent: 'cause', label: 'Cause and effect',
  capacity: { links: 3 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const links = (d.links || d.steps || []).slice(0, 3);
    const n = Math.max(links.length, 1);
    const boxW = 196, boxH = 110, y = 220;
    const gap = (W - 60 - boxW * n) / Math.max(n - 1, 1);
    links.forEach((lk, i) => {
      const x = 30 + i * (boxW + gap);
      const isLast = i === n - 1;
      s.push(rect(x, y, boxW, boxH, { stroke: isLast ? '#dc2626' : p.accent, strokeWidth: 2, fill: isLast ? '#fee2e2' : p.soft }));
      s.push(badge(i === 0 ? 'cause' : isLast ? 'effect' : 'leads to', x + 14, y - 14, { bg: isLast ? '#dc2626' : p.accent }));
      s.push(txt(anchor(lk.title || lk, 6), x + boxW / 2, y + 50, { fontSize: 14, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (lk.detail) s.push(txt(anchor(lk.detail, 7), x + boxW / 2, y + 76, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
      if (!isLast) s.push(arrow([x + boxW + 2, y + boxH / 2], [x + boxW + gap - 2, y + boxH / 2], { color: '#dc2626', strokeWidth: 2.5, label: '→' }));
    });
    if (d.takeaway) s.push(callout(anchor(d.takeaway, 12), 120, 370, 560, { bg: '#ecfdf5', stroke: p.accent, color: '#065f46' }));
    return s;
  },
});

// ── 7. DATA / BAR GRAPH FOCUS ────────────────────────────────────────────────
define({
  id: 'data_graph', intent: 'data', label: 'Data graph board',
  capacity: { bars: 6 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const values = (d.values || []).slice(0, 6);
    const labels = (d.labels || []).slice(0, 6);
    s.push({ type: 'draw_graph', graph_type: d.graph_type === 'line' ? 'line' : 'bar', title: anchor(d.graph_title || '', 6), position: [60, 130], size: [440, 300], data: { values, labels } });
    const notes = (d.notes || []).slice(0, 3);
    notes.forEach((note, i) => {
      const y = 150 + i * 86;
      s.push(rect(540, y, 220, 70, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(badge(String(i + 1), 552, y - 12, { bg: p.accent }));
      s.push(txt(anchor(note, 9), 556, y + 32, { fontSize: 12, color: '#1e293b', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 8. CLUSTER / MIND MAP ────────────────────────────────────────────────────
define({
  id: 'cluster_map', intent: 'cluster', label: 'Cluster mind map',
  capacity: { satellites: 5 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const cx = W / 2, cy = 300, R = 150;
    s.push(circle(cx, cy, 60, { fill: p.accent, stroke: p.accent }));
    s.push(txt(anchor(d.center || ctx.title, 3), cx, cy + 5, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const sats = (d.satellites || []).slice(0, 5);
    const n = Math.max(sats.length, 1);
    sats.forEach((sat, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      const sx = cx + Math.cos(ang) * R;
      const sy = cy + Math.sin(ang) * R * 0.78;
      s.push(line([cx + Math.cos(ang) * 60, cy + Math.sin(ang) * 60 * 0.78], [sx, sy], { color: p.accent, strokeWidth: 1.8 }));
      s.push(circle(sx, sy, 40, { fill: p.soft, stroke: p.accent, strokeWidth: 1.8 }));
      s.push(txt(anchor(sat.title || sat, 3), sx, sy + 4, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 9. CYCLE / LOOP ──────────────────────────────────────────────────────────
define({
  id: 'cycle_loop', intent: 'cycle', label: 'Cyclical process',
  capacity: { stages: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const cx = W / 2, cy = 300, R = 130;
    const stages = (d.stages || []).slice(0, 4);
    const n = Math.max(stages.length, 1);
    // draw a circular guide
    s.push(circle(cx, cy, R, { fill: 'none', stroke: '#e2e8f0', strokeWidth: 1.5 }));
    stages.forEach((stg, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      const sx = cx + Math.cos(ang) * R;
      const sy = cy + Math.sin(ang) * R;
      s.push(circle(sx, sy, 46, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(anchor(stg.title || stg, 4), sx, sy + 4, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      // curved arrow to next
      const nextAng = (-90 + (360 / n) * (i + 1)) * (Math.PI / 180);
      const ex = cx + Math.cos(nextAng) * R;
      const ey = cy + Math.sin(nextAng) * R;
      const midAng = (ang + nextAng) / 2;
      const mx = cx + Math.cos(midAng) * (R + 30);
      const my = cy + Math.sin(midAng) * (R + 30);
      s.push(path(`M ${sx + Math.cos(ang) * 46} ${sy + Math.sin(ang) * 46} Q ${mx} ${my} ${ex - Math.cos(nextAng) * 46} ${ey - Math.sin(nextAng) * 46}`, { stroke: p.accent, strokeWidth: 2, markerEnd: 'arrow' }));
    });
    return s;
  },
});

// ── 10. WORKED EXAMPLE ───────────────────────────────────────────────────────
define({
  id: 'worked_example', intent: 'example', label: 'Worked example',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    s.push(badge('Example', 56, 104, { bg: p.accent, fontSize: 13 }));
    if (d.problem) {
      s.push(rect(48, 130, 704, 52, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft }));
      s.push(txt(anchor(d.problem, 16), 64, 162, { fontSize: 14, fontWeight: '600', color: '#1e293b' }));
    }
    const steps = (d.steps || []).slice(0, 4);
    steps.forEach((st, i) => {
      const y = 200 + i * 54;
      s.push(badge(String(i + 1), 56, y, { bg: '#64748b' }));
      s.push(txt(anchor(st.text || st, 13), 96, y + 16, { fontSize: 13, color: '#334155', fontWeight: '500' }));
    });
    if (d.answer) {
      s.push(rect(48, 200 + steps.length * 54 + 8, 704, 46, { stroke: '#16a34a', strokeWidth: 2, fill: '#dcfce7' }));
      s.push(txt('Answer: ' + anchor(d.answer, 12), 64, 200 + steps.length * 54 + 36, { fontSize: 14, fontWeight: '800', color: '#15803d' }));
    }
    return s;
  },
});

// ── 11. RECAP / KEY TAKEAWAYS ────────────────────────────────────────────────
define({
  id: 'recap_takeaways', intent: 'recap', label: 'Recap & takeaways',
  capacity: { points: 4 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    s.push(obj('checklist', 70, 150, 150, 180, { label: 'Recap' }));
    const pts = (d.points || []).slice(0, 4);
    pts.forEach((pt, i) => {
      const y = 140 + i * 78;
      s.push(rect(260, y, 480, 64, { stroke: p.accent, strokeWidth: 1.6, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push({ type: 'draw_path', d: `M ${278} ${y + 32} l 8 8 l 16 -18`, markerEnd: null, style: { stroke: '#16a34a', strokeWidth: 3, fill: 'none' } });
      s.push(txt(anchor(pt, 11), 312, y + 38, { fontSize: 14, fontWeight: '600', color: '#1e293b' }));
    });
    return s;
  },
});

// ── 12. FORMULA BREAKDOWN ────────────────────────────────────────────────────
define({
  id: 'formula_breakdown', intent: 'formula', label: 'Formula breakdown',
  capacity: { terms: 3 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    s.push(rect(150, 130, 500, 80, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push({ type: 'show_equation', latex: anchor(d.formula || ctx.title, 12), position: [W / 2, 178], style: { fontSize: 28, color: p.accent } });
    const terms = (d.terms || []).slice(0, 3);
    const n = Math.max(terms.length, 1);
    const boxW = 200, gap = (W - 80 - boxW * n) / Math.max(n - 1, 1);
    terms.forEach((tm, i) => {
      const x = 40 + i * (boxW + gap);
      s.push(line([x + boxW / 2, 210], [x + boxW / 2, 270], { color: p.accent, strokeWidth: 1.5, dashed: true }));
      s.push(rect(x, 270, boxW, 110, { stroke: p.accent, strokeWidth: 1.6 }));
      s.push(txt(anchor(tm.symbol || tm.title || tm, 3), x + boxW / 2, 304, { fontSize: 18, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      if (tm.meaning) s.push(txt(anchor(tm.meaning, 8), x + boxW / 2, 336, { fontSize: 12, color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 13. LABELED DIAGRAM ──────────────────────────────────────────────────────
define({
  id: 'labeled_diagram', intent: 'map', label: 'Labeled diagram',
  capacity: { labels: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const objectType = d.object_type || 'cell';
    s.push(obj(objectType, 250, 150, 300, 230, { label: anchor(d.subject || ctx.title, 3) }));
    const labels = (d.labels || []).slice(0, 4);
    labels.forEach((lb, i) => {
      const right = i % 2 === 1;
      const row = Math.floor(i / 2);
      const x = right ? 600 : 40;
      const y = 170 + row * 110;
      s.push(rect(x, y, 160, 76, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(lb.title || lb, 4), x + 12, y + 28, { fontSize: 13, fontWeight: '700', color: p.accent }));
      if (lb.detail) s.push(txt(anchor(lb.detail, 6), x + 12, y + 52, { fontSize: 11, color: '#64748b' }));
      const tx = right ? 600 : 200;
      const ty = y + 38;
      s.push(arrow(right ? [tx, ty] : [200, ty], right ? [560, 250] : [x + 160, ty], { color: p.accent, strokeWidth: 1.5 }));
    });
    return s;
  },
});

// ── 14. PROS & CONS ──────────────────────────────────────────────────────────
define({
  id: 'pros_cons', intent: 'compare', label: 'Pros and cons',
  capacity: { pros: 4, cons: 4 },
  fill(d, ctx) {
    const s = [...header(ctx, '#16a34a')];
    const boxW = 330, boxH = 290, gap = 60;
    const x0 = (W - boxW * 2 - gap) / 2;
    const sides = [
      { title: d.pros_title || 'Strengths', items: d.pros || [], acc: '#16a34a', soft: '#dcfce7', sign: '+' },
      { title: d.cons_title || 'Limits', items: d.cons || [], acc: '#dc2626', soft: '#fee2e2', sign: '−' },
    ];
    sides.forEach((side, ci) => {
      const x = x0 + ci * (boxW + gap);
      s.push(rect(x, 110, boxW, boxH, { stroke: side.acc, strokeWidth: 2, fill: '#ffffff' }));
      s.push(rect(x, 110, boxW, 42, { fill: side.acc, stroke: side.acc, rx: 14 }));
      s.push(txt(side.title, x + boxW / 2, 137, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      (side.items || []).slice(0, 4).forEach((it, i) => {
        const y = 174 + i * 56;
        s.push(circle(x + 26, y, 11, { fill: side.soft, stroke: side.acc, strokeWidth: 1.6 }));
        s.push(txt(side.sign, x + 26, y + 5, { fontSize: 15, fontWeight: '800', color: side.acc, textAnchor: 'middle' }));
        s.push(txt(anchor(it, 7), x + 46, y + 5, { fontSize: 13, color: '#334155', fontWeight: '500' }));
      });
    });
    return s;
  },
});

// ── 15. NUMBERED STACK (vertical list) ───────────────────────────────────────
define({
  id: 'numbered_stack', intent: 'process', label: 'Numbered vertical stack',
  capacity: { items: 5 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.steps || []).slice(0, 5);
    items.forEach((it, i) => {
      const y = 116 + i * 70;
      s.push(circle(110, y + 26, 24, { fill: p.accent, stroke: p.accent }));
      s.push(txt(String(i + 1), 110, y + 32, { fontSize: 18, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(rect(150, y, 560, 56, { stroke: p.accent, strokeWidth: 1.4, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(txt(anchor(it.title || it, 12), 168, y + 26, { fontSize: 14, fontWeight: '700', color: '#1e293b' }));
      if (it.detail) s.push(txt(anchor(it.detail, 12), 168, y + 46, { fontSize: 11, color: '#64748b' }));
      if (i < items.length - 1) s.push(line([110, y + 50], [110, y + 70], { color: p.accent, strokeWidth: 2, dashed: true }));
    });
    return s;
  },
});

// ── 16. CONCEPT + 3 SUPPORTING CARDS ─────────────────────────────────────────
define({
  id: 'concept_cards', intent: 'define', label: 'Concept with cards',
  capacity: { cards: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    s.push(rect(220, 110, 360, 70, { stroke: p.accent, strokeWidth: 2.5, fill: p.accent }));
    s.push(txt(anchor(d.concept || ctx.title, 5), W / 2, 152, { fontSize: 19, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const cards = (d.cards || []).slice(0, 3);
    const n = Math.max(cards.length, 1);
    const boxW = 220, gap = (W - 80 - boxW * n) / Math.max(n - 1, 1);
    cards.forEach((cd, i) => {
      const x = 40 + i * (boxW + gap);
      s.push(line([W / 2, 180], [x + boxW / 2, 220], { color: p.accent, strokeWidth: 1.5 }));
      s.push(rect(x, 220, boxW, 150, { stroke: p.accent, strokeWidth: 1.6, fill: '#ffffff' }));
      s.push(rect(x, 220, boxW, 6, { fill: p.accent, stroke: p.accent, rx: 0 }));
      s.push(txt(anchor(cd.title || cd, 5), x + boxW / 2, 256, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      if (cd.detail) {
        const words = anchor(cd.detail, 14);
        s.push(txt(words, x + 16, 288, { fontSize: 12, color: '#475569', fontWeight: '500' }));
      }
    });
    return s;
  },
});

// ── 17. BEFORE / AFTER ───────────────────────────────────────────────────────
define({
  id: 'before_after', intent: 'cause', label: 'Before and after',
  capacity: { },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const boxW = 290, boxH = 220, y = 150;
    s.push(rect(40, y, boxW, boxH, { stroke: '#94a3b8', strokeWidth: 2, fill: '#f8fafc' }));
    s.push(badge('Before', 56, y - 14, { bg: '#64748b' }));
    s.push(txt(anchor(d.before_title || 'Before', 5), 40 + boxW / 2, y + 36, { fontSize: 15, fontWeight: '800', color: '#475569', textAnchor: 'middle' }));
    (d.before || []).slice(0, 3).forEach((it, i) => s.push(txt('• ' + anchor(it, 8), 60, y + 76 + i * 36, { fontSize: 12, color: '#64748b', fontWeight: '500' })));
    s.push(arrow([340, y + boxH / 2], [460, y + boxH / 2], { color: p.accent, strokeWidth: 3, label: anchor(d.transform || '', 4) }));
    const x2 = W - 40 - boxW;
    s.push(rect(x2, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft }));
    s.push(badge('After', x2 + 16, y - 14, { bg: p.accent }));
    s.push(txt(anchor(d.after_title || 'After', 5), x2 + boxW / 2, y + 36, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    (d.after || []).slice(0, 3).forEach((it, i) => s.push(txt('• ' + anchor(it, 8), x2 + 20, y + 76 + i * 36, { fontSize: 12, color: '#1e293b', fontWeight: '500' })));
    return s;
  },
});

// ── 18. QUADRANT / 2x2 MATRIX ────────────────────────────────────────────────
define({
  id: 'quadrant_matrix', intent: 'compare', label: 'Quadrant matrix',
  capacity: { cells: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const x0 = 180, y0 = 120, cw = 220, ch = 150;
    const cells = (d.cells || []).slice(0, 4);
    const colors = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3'];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
      const idx = r * 2 + c;
      const cell = cells[idx] || {};
      const x = x0 + c * cw, y = y0 + r * ch;
      s.push(rect(x, y, cw, ch, { stroke: p.accent, strokeWidth: 1.5, fill: colors[idx] }));
      s.push(txt(anchor(cell.title || '', 4), x + cw / 2, y + 32, { fontSize: 14, fontWeight: '800', color: '#1e293b', textAnchor: 'middle' }));
      if (cell.detail) s.push(txt(anchor(cell.detail, 8), x + cw / 2, y + 64, { fontSize: 11, color: '#475569', textAnchor: 'middle' }));
    }
    if (d.x_label) s.push(txt(anchor(d.x_label, 4), x0 + cw, y0 + ch * 2 + 24, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    if (d.y_label) s.push(txt(anchor(d.y_label, 4), x0 - 16, y0 + ch, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'end' }));
    return s;
  },
});

// ── 19. INPUT → SYSTEM → OUTPUT ──────────────────────────────────────────────
define({
  id: 'io_system', intent: 'process', label: 'Input-system-output',
  capacity: { inputs: 3, outputs: 3 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const cy = 250;
    s.push(rect(300, cy - 70, 200, 140, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft }));
    s.push(obj('gear', 350, cy - 50, 100, 100, {}));
    s.push(txt(anchor(d.system || ctx.title, 3), 400, cy + 56, { fontSize: 14, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    (d.inputs || []).slice(0, 3).forEach((inp, i) => {
      const y = 150 + i * 70;
      s.push(rect(40, y, 200, 52, { stroke: '#64748b', strokeWidth: 1.5, fill: '#f8fafc' }));
      s.push(txt(anchor(inp, 6), 56, y + 30, { fontSize: 12, fontWeight: '600', color: '#475569' }));
      s.push(arrow([240, y + 26], [298, cy], { color: '#64748b', strokeWidth: 1.6 }));
    });
    (d.outputs || []).slice(0, 3).forEach((out, i) => {
      const y = 150 + i * 70;
      s.push(rect(560, y, 200, 52, { stroke: '#16a34a', strokeWidth: 1.6, fill: '#dcfce7' }));
      s.push(txt(anchor(out, 6), 576, y + 30, { fontSize: 12, fontWeight: '600', color: '#15803d' }));
      s.push(arrow([502, cy], [558, y + 26], { color: '#16a34a', strokeWidth: 1.6 }));
    });
    return s;
  },
});

// ── 20. KEY TERMS GLOSSARY GRID ──────────────────────────────────────────────
define({
  id: 'terms_grid', intent: 'define', label: 'Key terms grid',
  capacity: { terms: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const terms = (d.terms || []).slice(0, 4);
    const cw = 350, ch = 130, gap = 24;
    const x0 = (W - cw * 2 - gap) / 2, y0 = 120;
    terms.forEach((tm, i) => {
      const c = i % 2, r = Math.floor(i / 2);
      const x = x0 + c * (cw + gap), y = y0 + r * (ch + gap);
      s.push(rect(x, y, cw, ch, { stroke: p.accent, strokeWidth: 1.6, fill: '#ffffff' }));
      s.push(rect(x, y, 8, ch, { fill: p.accent, stroke: p.accent, rx: 0 }));
      s.push(txt(anchor(tm.term || tm.title || tm, 4), x + 24, y + 36, { fontSize: 16, fontWeight: '800', color: p.accent }));
      if (tm.definition || tm.detail) s.push(txt(anchor(tm.definition || tm.detail, 14), x + 24, y + 70, { fontSize: 12, color: '#475569', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 21. SPLIT — DEFINITION + EXAMPLE ─────────────────────────────────────────
define({
  id: 'def_plus_example', intent: 'define', label: 'Definition plus example',
  capacity: {},
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    s.push(rect(40, 120, 350, 290, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push(badge('Idea', 56, 106, { bg: p.accent }));
    s.push(txt(anchor(d.term || ctx.title, 5), 64, 162, { fontSize: 18, fontWeight: '800', color: p.accent }));
    (d.definition_points || (d.definition ? [d.definition] : [])).slice(0, 4).forEach((dp, i) => {
      s.push(circle(72, 200 + i * 46, 5, { fill: p.accent, stroke: p.accent }));
      s.push(txt(anchor(dp, 8), 88, 205 + i * 46, { fontSize: 13, color: '#334155', fontWeight: '500' }));
    });
    s.push(rect(410, 120, 350, 290, { stroke: '#16a34a', strokeWidth: 2, fill: '#f0fdf4' }));
    s.push(badge('In practice', 426, 106, { bg: '#16a34a' }));
    (d.example_points || (d.example ? [d.example] : [])).slice(0, 5).forEach((ep, i) => {
      s.push(txt('→ ' + anchor(ep, 9), 430, 168 + i * 48, { fontSize: 13, color: '#15803d', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 22. LAYERED STACK (architecture) ─────────────────────────────────────────
define({
  id: 'layered_stack', intent: 'hierarchy', label: 'Layered architecture',
  capacity: { layers: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const layers = (d.layers || []).slice(0, 4);
    const n = Math.max(layers.length, 1);
    const lh = Math.min(72, (370 - 110) / n - 10);
    layers.forEach((ly, i) => {
      const y = 116 + i * (lh + 12);
      const inset = i * 24;
      s.push(rect(150 + inset, y, 500 - inset * 2, lh, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 ? p.soft : '#ffffff' }));
      s.push(txt(anchor(ly.title || ly, 6), W / 2, y + lh / 2 + 2, { fontSize: 14, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (ly.detail) s.push(txt(anchor(ly.detail, 6), W / 2, y + lh / 2 + 20, { fontSize: 10, color: '#64748b', textAnchor: 'middle' }));
    });
    s.push(txt('top', 690, 130, { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }));
    s.push(txt('base', 690, 116 + (n - 1) * (lh + 12) + lh - 10, { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }));
    return s;
  },
});

// ── 23. VENN-LIKE OVERLAP ────────────────────────────────────────────────────
define({
  id: 'overlap_venn', intent: 'compare', label: 'Overlap comparison',
  capacity: {},
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const cy = 270;
    s.push(circle(330, cy, 130, { fill: '#dbeafe', stroke: '#2563eb', strokeWidth: 2 }));
    s.push(circle(470, cy, 130, { fill: '#fce7f3', stroke: '#db2777', strokeWidth: 2 }));
    s.push(txt(anchor(d.left_title || 'A', 3), 250, cy - 70, { fontSize: 15, fontWeight: '800', color: '#2563eb', textAnchor: 'middle' }));
    s.push(txt(anchor(d.right_title || 'B', 3), 550, cy - 70, { fontSize: 15, fontWeight: '800', color: '#db2777', textAnchor: 'middle' }));
    (d.left || []).slice(0, 2).forEach((it, i) => s.push(txt(anchor(it, 4), 270, cy - 10 + i * 30, { fontSize: 11, color: '#1e40af', textAnchor: 'middle' })));
    (d.right || []).slice(0, 2).forEach((it, i) => s.push(txt(anchor(it, 4), 530, cy - 10 + i * 30, { fontSize: 11, color: '#9d174d', textAnchor: 'middle' })));
    (d.shared || []).slice(0, 2).forEach((it, i) => s.push(txt(anchor(it, 3), 400, cy - 6 + i * 28, { fontSize: 11, fontWeight: '700', color: '#6d28d9', textAnchor: 'middle' })));
    s.push(txt('shared', 400, cy - 36, { fontSize: 10, fontWeight: '800', color: '#6d28d9', textAnchor: 'middle' }));
    return s;
  },
});

// ── 24. QUESTION → ANSWER REVEAL ─────────────────────────────────────────────
define({
  id: 'question_answer', intent: 'example', label: 'Question and answer',
  capacity: { points: 3 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    s.push(obj('dialogue', 50, 140, 130, 110, { label: 'Q' }));
    s.push(rect(200, 130, 560, 80, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push(txt(anchor(d.question || ctx.title, 16), 218, 176, { fontSize: 15, fontWeight: '700', color: '#1e293b' }));
    s.push(arrow([W / 2, 212], [W / 2, 248], { color: p.accent, strokeWidth: 2.5 }));
    s.push(rect(120, 254, 560, 150, { stroke: '#16a34a', strokeWidth: 2, fill: '#f0fdf4' }));
    s.push(badge('Answer', 136, 240, { bg: '#16a34a' }));
    (d.points || (d.answer ? [d.answer] : [])).slice(0, 3).forEach((pt, i) => {
      s.push(txt('✓ ' + anchor(pt, 14), 140, 290 + i * 36, { fontSize: 13, color: '#15803d', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 25. RANKED PYRAMID ───────────────────────────────────────────────────────
define({
  id: 'ranked_pyramid', intent: 'hierarchy', label: 'Ranked pyramid',
  capacity: { tiers: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const tiers = (d.tiers || []).slice(0, 4);
    const n = Math.max(tiers.length, 1);
    const baseW = 520, topY = 120, th = (380 - topY) / n;
    tiers.forEach((ti, i) => {
      const wRatio = (i + 1) / n;
      const w = baseW * wRatio;
      const x = (W - w) / 2;
      const y = topY + i * th;
      s.push(rect(x, y, w, th - 8, { stroke: p.accent, strokeWidth: 1.8, fill: i === 0 ? p.accent : p.soft, rx: 8 }));
      s.push(txt(anchor(ti.title || ti, 6), W / 2, y + th / 2, { fontSize: 13, fontWeight: '700', color: i === 0 ? '#ffffff' : '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 26. ANNOTATED SINGLE FOCUS ───────────────────────────────────────────────
define({
  id: 'annotated_focus', intent: 'map', label: 'Annotated focus object',
  capacity: { annotations: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const objectType = d.object_type || 'target';
    s.push(obj(objectType, 90, 150, 230, 230, { label: anchor(d.subject || ctx.title, 3), annotations: (d.annotations || []).slice(0, 3).map((a) => anchor(typeof a === 'string' ? a : (a.title || ''), 4)) }));
    (d.annotations || []).slice(0, 3).forEach((an, i) => {
      const y = 150 + i * 88;
      s.push(rect(400, y, 360, 72, { stroke: p.accent, strokeWidth: 1.6, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(badge(String(i + 1), 414, y - 12, { bg: p.accent }));
      s.push(txt(anchor((an.title || an), 5), 420, y + 30, { fontSize: 14, fontWeight: '700', color: p.accent }));
      if (an.detail) s.push(txt(anchor(an.detail, 8), 420, y + 54, { fontSize: 11, color: '#64748b' }));
    });
    return s;
  },
});

// ── 27. CHECKLIST / STEPS TO DO ──────────────────────────────────────────────
define({
  id: 'action_checklist', intent: 'process', label: 'Action checklist',
  capacity: { items: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    s.push(rect(140, 110, 520, 300, { stroke: p.accent, strokeWidth: 1.6, fill: '#ffffff' }));
    const items = (d.items || []).slice(0, 5);
    items.forEach((it, i) => {
      const y = 134 + i * 56;
      s.push(rect(160, y, 24, 24, { stroke: p.accent, strokeWidth: 2, fill: p.soft, rx: 6 }));
      s.push({ type: 'draw_path', d: `M 165 ${y + 12} l 5 6 l 11 -12`, style: { stroke: p.accent, strokeWidth: 2.5, fill: 'none' } });
      s.push(txt(anchor(it.title || it, 13), 200, y + 18, { fontSize: 14, fontWeight: '600', color: '#1e293b' }));
      if (i < items.length - 1) s.push(line([172, y + 30], [172, y + 56], { color: '#e2e8f0', strokeWidth: 1.5 }));
    });
    return s;
  },
});

// ── 28. SPECTRUM / SCALE ─────────────────────────────────────────────────────
define({
  id: 'spectrum_scale', intent: 'compare', label: 'Spectrum scale',
  capacity: { markers: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const y = 280;
    s.push({ type: 'draw_path', d: `M 80 ${y} L 720 ${y}`, style: { stroke: 'url', strokeWidth: 10, fill: 'none' } });
    s.push(line([80, y], [720, y], { color: p.accent, strokeWidth: 8 }));
    s.push(txt(anchor(d.low_label || 'Low', 3), 80, y + 40, { fontSize: 13, fontWeight: '700', color: '#64748b', textAnchor: 'start' }));
    s.push(txt(anchor(d.high_label || 'High', 3), 720, y + 40, { fontSize: 13, fontWeight: '700', color: p.accent, textAnchor: 'end' }));
    const markers = (d.markers || []).slice(0, 4);
    const n = Math.max(markers.length, 1);
    markers.forEach((mk, i) => {
      const x = 80 + (640 / Math.max(n - 1, 1)) * i;
      const up = i % 2 === 0;
      s.push(circle(x, y, 12, { fill: '#ffffff', stroke: p.accent, strokeWidth: 3 }));
      s.push(line([x, y], [x, up ? y - 40 : y + 40], { color: p.accent, strokeWidth: 1.5, dashed: true }));
      s.push(rect(x - 70, up ? y - 96 : y + 56, 140, 48, { stroke: p.accent, strokeWidth: 1.5, fill: p.soft }));
      s.push(txt(anchor(mk.title || mk, 5), x, up ? y - 66 : y + 86, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 29. COORDINATE / GRAPH PLOT ──────────────────────────────────────────────
define({
  id: 'coordinate_plot', intent: 'data', label: 'Coordinate plot',
  capacity: { notes: 3 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    s.push({ type: 'draw_coordinate_system', origin: [120, 380], size: [380, 250], x_label: anchor(d.x_label || 'x', 3), y_label: anchor(d.y_label || 'y', 3), plot_points: Array.isArray(d.plot_points) ? d.plot_points.slice(0, 24) : [] });
    (d.notes || []).slice(0, 3).forEach((note, i) => {
      const y = 150 + i * 84;
      s.push(rect(540, y, 220, 68, { stroke: p.accent, strokeWidth: 1.5, fill: p.soft }));
      s.push(badge(String(i + 1), 552, y - 12, { bg: p.accent }));
      s.push(txt(anchor(note, 9), 556, y + 32, { fontSize: 12, color: '#1e293b', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 30. TWO-ROW FLOW WITH BRANCH ─────────────────────────────────────────────
define({
  id: 'branch_flow', intent: 'process', label: 'Branching flow',
  capacity: { branches: 2 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    s.push(rect(320, 110, 160, 64, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push(txt(anchor(d.start || ctx.title, 4), 400, 148, { fontSize: 14, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const branches = (d.branches || []).slice(0, 2);
    branches.forEach((br, i) => {
      const x = i === 0 ? 110 : 510;
      s.push(line([400, 174], [x + 90, 220], { color: p.accent, strokeWidth: 1.8 }));
      s.push(badge(anchor(br.condition || (i === 0 ? 'if' : 'else'), 3), x + 30, 200, { bg: i === 0 ? '#16a34a' : '#dc2626' }));
      (br.steps || []).slice(0, 3).forEach((st, j) => {
        const y = 240 + j * 56;
        s.push(rect(x, y, 180, 44, { stroke: i === 0 ? '#16a34a' : '#dc2626', strokeWidth: 1.5, fill: i === 0 ? '#f0fdf4' : '#fef2f2' }));
        s.push(txt(anchor(st, 6), x + 90, y + 26, { fontSize: 12, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
        if (j < (br.steps || []).length - 1) s.push(arrow([x + 90, y + 44], [x + 90, y + 56], { color: '#94a3b8', strokeWidth: 1.5 }));
      });
    });
    return s;
  },
});

// ── 31. SINGLE BIG STATEMENT (HOOK) ──────────────────────────────────────────
define({
  id: 'hook_statement', intent: 'recap', label: 'Hook statement',
  capacity: {},
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    s.push(circle(W / 2, 250, 14, { fill: p.accent, stroke: p.accent }));
    s.push(rect(120, 200, 560, 130, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    const big = anchor(d.statement || ctx.subtitle || ctx.title, 12);
    s.push(txt(big, W / 2, 260, { fontSize: 20, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    if (d.sub) s.push(txt(anchor(d.sub, 14), W / 2, 300, { fontSize: 13, color: '#475569', textAnchor: 'middle', fontStyle: 'italic' }));
    s.push(obj('compass', 60, 360, 90, 90, {}));
    s.push(obj('lightbulb', 650, 360, 90, 90, {}));
    return s;
  },
});

// ── 32. MATRIX TABLE ─────────────────────────────────────────────────────────
define({
  id: 'matrix_table', intent: 'compare', label: 'Comparison table',
  capacity: { rows: 4, cols: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const headers = (d.headers || []).slice(0, 3).map((h) => anchor(h, 4));
    const rows = (d.rows || []).slice(0, 4).map((r) => (Array.isArray(r) ? r.slice(0, 3).map((c) => anchor(c, 5)) : []));
    s.push({ type: 'draw_table', headers, rows, position: [Math.max(60, (W - (headers.length * 200)) / 2), 130], cell_width: 200, cell_height: 56 });
    return s;
  },
});

// ── 33. PROBLEM → SOLUTION ───────────────────────────────────────────────────
define({
  id: 'problem_solution', intent: 'cause', label: 'Problem and solution',
  capacity: {},
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    s.push(rect(40, 120, 330, 280, { stroke: '#dc2626', strokeWidth: 2, fill: '#fef2f2' }));
    s.push(badge('Problem', 56, 106, { bg: '#dc2626' }));
    (d.problems || (d.problem ? [d.problem] : [])).slice(0, 4).forEach((it, i) => s.push(txt('• ' + anchor(it, 9), 60, 162 + i * 50, { fontSize: 13, color: '#991b1b', fontWeight: '500' })));
    s.push(arrow([378, 260], [430, 260], { color: p.accent, strokeWidth: 3 }));
    s.push(rect(438, 120, 322, 280, { stroke: '#16a34a', strokeWidth: 2, fill: '#f0fdf4' }));
    s.push(badge('Solution', 454, 106, { bg: '#16a34a' }));
    (d.solutions || (d.solution ? [d.solution] : [])).slice(0, 4).forEach((it, i) => s.push(txt('→ ' + anchor(it, 9), 458, 162 + i * 50, { fontSize: 13, color: '#15803d', fontWeight: '500' })));
    return s;
  },
});

// ── 34. THREE PILLARS ────────────────────────────────────────────────────────
define({
  id: 'three_pillars', intent: 'hierarchy', label: 'Supporting pillars',
  capacity: { pillars: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    s.push(rect(150, 110, 500, 50, { stroke: p.accent, strokeWidth: 2, fill: p.accent }));
    s.push(txt(anchor(d.roof || ctx.title, 6), W / 2, 142, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const pillars = (d.pillars || []).slice(0, 3);
    const n = Math.max(pillars.length, 1);
    const pw = 150, gap = (500 - pw * n) / Math.max(n - 1, 1);
    pillars.forEach((pi, i) => {
      const x = 150 + i * (pw + gap);
      s.push(rect(x, 170, pw, 200, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft }));
      s.push(txt(anchor(pi.title || pi, 4), x + pw / 2, 204, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      (pi.points || []).slice(0, 3).forEach((pt, j) => s.push(txt('• ' + anchor(pt, 5), x + 14, 244 + j * 40, { fontSize: 11, color: '#475569', fontWeight: '500' })));
    });
    s.push(rect(140, 376, 520, 16, { stroke: p.accent, strokeWidth: 2, fill: p.accent, rx: 4 }));
    return s;
  },
});

// ── 35. EQUATION STEPS (math solve) ──────────────────────────────────────────
define({
  id: 'equation_steps', intent: 'formula', label: 'Equation solving steps',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || []).slice(0, 4);
    steps.forEach((st, i) => {
      const y = 130 + i * 68;
      s.push(rect(160, y, 480, 52, { stroke: p.accent, strokeWidth: 1.5, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push({ type: 'show_equation', latex: anchor(st.equation || st, 14), position: [400, y + 34], style: { fontSize: 18, color: '#1e293b' } });
      if (st.note) s.push(txt(anchor(st.note, 5), 650, y + 32, { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }));
      if (i < steps.length - 1) s.push(arrow([400, y + 52], [400, y + 68], { color: p.accent, strokeWidth: 1.8 }));
    });
    return s;
  },
});

// ── 36. FUNNEL ───────────────────────────────────────────────────────────────
define({
  id: 'funnel_stages', intent: 'process', label: 'Funnel stages',
  capacity: { stages: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || []).slice(0, 4);
    const n = Math.max(stages.length, 1);
    const topY = 120, sh = (380 - topY) / n;
    stages.forEach((st, i) => {
      const wTop = 520 - i * (440 / n);
      const wBot = 520 - (i + 1) * (440 / n);
      const y = topY + i * sh;
      const x1 = (W - wTop) / 2, x2 = (W - wBot) / 2;
      s.push({ type: 'draw_path', d: `M ${x1} ${y} L ${x1 + wTop} ${y} L ${x2 + wBot} ${y + sh - 6} L ${x2} ${y + sh - 6} Z`, style: { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 ? p.soft : '#ffffff' } });
      s.push(txt(anchor(st.title || st, 6), W / 2, y + sh / 2, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 37. CONTEXT MAP (center + corners) ───────────────────────────────────────
define({
  id: 'context_corners', intent: 'cluster', label: 'Context map',
  capacity: { corners: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const cx = W / 2, cy = 270;
    s.push(rect(cx - 90, cy - 40, 180, 80, { stroke: p.accent, strokeWidth: 2.5, fill: p.accent }));
    s.push(txt(anchor(d.center || ctx.title, 4), cx, cy + 5, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const positions = [[120, 130], [560, 130], [120, 350], [560, 350]];
    (d.corners || []).slice(0, 4).forEach((co, i) => {
      const [x, y] = positions[i];
      s.push(rect(x, y, 160, 70, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(co.title || co, 5), x + 80, y + 28, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (co.detail) s.push(txt(anchor(co.detail, 6), x + 80, y + 50, { fontSize: 10, color: '#64748b', textAnchor: 'middle' }));
      s.push(arrow([x + 80, y < cy ? y + 70 : y], [cx + (x < cx ? -90 : 90), cy + (y < cy ? -20 : 20)], { color: p.accent, strokeWidth: 1.4 }));
    });
    return s;
  },
});

// ── 38. STAT HIGHLIGHTS ──────────────────────────────────────────────────────
define({
  id: 'stat_highlights', intent: 'data', label: 'Key statistics',
  capacity: { stats: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const stats = (d.stats || []).slice(0, 3);
    const n = Math.max(stats.length, 1);
    const bw = 210, gap = (W - 80 - bw * n) / Math.max(n - 1, 1);
    stats.forEach((stt, i) => {
      const x = 40 + i * (bw + gap);
      s.push(rect(x, 150, bw, 200, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
      s.push(txt(anchor(stt.value || stt.number || '', 3), x + bw / 2, 230, { fontSize: 38, fontWeight: '900', color: p.accent, textAnchor: 'middle' }));
      s.push(line([x + 30, 250], [x + bw - 30, 250], { color: p.accent, strokeWidth: 1.5 }));
      s.push(txt(anchor(stt.label || stt.title || stt, 7), x + bw / 2, 290, { fontSize: 13, fontWeight: '600', color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 39. STORY / NARRATIVE BEATS ──────────────────────────────────────────────
define({
  id: 'story_beats', intent: 'timeline', label: 'Story beats',
  capacity: { beats: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const beats = (d.beats || []).slice(0, 4);
    beats.forEach((bt, i) => {
      const y = 120 + i * 72;
      s.push(obj('book', 60, y, 56, 56, {}));
      s.push(rect(140, y, 580, 56, { stroke: p.accent, strokeWidth: 1.5, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(badge(anchor(bt.tag || `Beat ${i + 1}`, 3), 152, y - 10, { bg: p.accent }));
      s.push(txt(anchor(bt.text || bt, 13), 200, y + 32, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
      if (i < beats.length - 1) s.push(line([88, y + 56], [88, y + 72], { color: p.accent, strokeWidth: 2, dashed: true }));
    });
    return s;
  },
});

// ── 40. SUMMARY DASHBOARD ────────────────────────────────────────────────────
define({
  id: 'summary_dashboard', intent: 'recap', label: 'Summary dashboard',
  capacity: { tiles: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const tiles = (d.tiles || d.points || []).slice(0, 4);
    const tw = 350, th = 130, gap = 24;
    const x0 = (W - tw * 2 - gap) / 2, y0 = 120;
    tiles.forEach((tl, i) => {
      const c = i % 2, r = Math.floor(i / 2);
      const x = x0 + c * (tw + gap), y = y0 + r * (th + gap);
      const acc = PALETTES[i % PALETTES.length].accent;
      const soft = PALETTES[i % PALETTES.length].soft;
      s.push(rect(x, y, tw, th, { stroke: acc, strokeWidth: 1.8, fill: '#ffffff' }));
      s.push(rect(x, y, tw, 8, { fill: acc, stroke: acc, rx: 0 }));
      s.push(badge(String(i + 1), x + 16, y - 10, { bg: acc }));
      s.push(txt(anchor(tl.title || tl, 6), x + 20, y + 44, { fontSize: 15, fontWeight: '800', color: acc }));
      if (tl.detail) s.push(txt(anchor(tl.detail, 12), x + 20, y + 76, { fontSize: 12, color: '#475569', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 41. RADIAL CONCEPT WEB ───────────────────────────────────────────────────
define({
  id: 'radial_web', intent: 'cluster', label: 'Radial concept web',
  capacity: { satellites: 6 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const cx = W / 2, cy = 280;
    s.push(rect(cx - 100, cy - 35, 200, 70, { stroke: p.accent, strokeWidth: 3, fill: p.accent }));
    s.push(txt(anchor(d.center || ctx.title, 4), cx, cy + 5, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const sats = (d.satellites || []).slice(0, 6);
    const n = Math.max(sats.length, 1);
    sats.forEach((sat, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      const R = 170;
      const sx = cx + Math.cos(ang) * R;
      const sy = cy + Math.sin(ang) * R * 0.7;
      s.push(line([cx, cy], [sx, sy], { color: p.accent, strokeWidth: 2, dashed: true }));
      s.push(rect(sx - 70, sy - 28, 140, 56, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft }));
      s.push(txt(anchor(sat.title || sat, 4), sx, sy + 4, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 42. DECISION TREE ────────────────────────────────────────────────────────
define({
  id: 'decision_tree', intent: 'process', label: 'Decision tree',
  capacity: { branches: 2 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    s.push(rect(300, 110, 200, 60, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft }));
    s.push(txt(anchor(d.question || ctx.title, 5), 400, 146, { fontSize: 14, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const branches = (d.branches || []).slice(0, 2);
    branches.forEach((br, i) => {
      const x = i === 0 ? 100 : 520;
      const branchColor = i === 0 ? '#16a34a' : '#dc2626';
      s.push(line([400, 170], [x + 80, 220], { color: p.accent, strokeWidth: 2 }));
      s.push(badge(anchor(br.label || (i === 0 ? 'Yes' : 'No'), 3), x + 50, 200, { bg: branchColor }));
      s.push(rect(x, 230, 160, 140, { stroke: branchColor, strokeWidth: 2, fill: i === 0 ? '#f0fdf4' : '#fef2f2' }));
      s.push(txt(anchor(br.title || '', 5), x + 80, 260, { fontSize: 14, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      (br.points || []).slice(0, 3).forEach((pt, j) => {
        s.push(txt('• ' + anchor(pt, 6), x + 16, 290 + j * 28, { fontSize: 11, color: '#475569', fontWeight: '500' }));
      });
    });
    return s;
  },
});

// ── 43. CIRCULAR PROGRESS ────────────────────────────────────────────────────
define({
  id: 'circular_progress', intent: 'timeline', label: 'Circular progress',
  capacity: { stages: 5 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const cx = W / 2, cy = 280, R = 140;
    s.push(circle(cx, cy, R + 10, { fill: 'none', stroke: '#e2e8f0', strokeWidth: 20 }));
    const stages = (d.stages || []).slice(0, 5);
    const n = Math.max(stages.length, 1);
    const arcLen = (2 * Math.PI * R) / n;
    stages.forEach((stg, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      const sx = cx + Math.cos(ang) * (R + 60);
      const sy = cy + Math.sin(ang) * (R + 60);
      const dotX = cx + Math.cos(ang) * R;
      const dotY = cy + Math.sin(ang) * R;
      s.push(circle(dotX, dotY, 18, { fill: p.accent, stroke: '#ffffff', strokeWidth: 3 }));
      s.push(txt(String(i + 1), dotX, dotY + 5, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(rect(sx - 70, sy - 24, 140, 48, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(stg.title || stg, 5), sx, sy + 4, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 44. SWOT ANALYSIS ────────────────────────────────────────────────────────
define({
  id: 'swot_analysis', intent: 'compare', label: 'SWOT analysis',
  capacity: { strengths: 3, weaknesses: 3, opportunities: 3, threats: 3 },
  fill(d, ctx) {
    const s = [...header(ctx, '#7c3aed')];
    const boxW = 360, boxH = 170, gap = 20;
    const x0 = (W - boxW * 2 - gap) / 2, y0 = 120;
    const quadrants = [
      { title: 'Strengths', items: d.strengths || [], color: '#16a34a', soft: '#dcfce7', x: x0, y: y0 },
      { title: 'Weaknesses', items: d.weaknesses || [], color: '#dc2626', soft: '#fee2e2', x: x0 + boxW + gap, y: y0 },
      { title: 'Opportunities', items: d.opportunities || [], color: '#2563eb', soft: '#dbeafe', x: x0, y: y0 + boxH + gap },
      { title: 'Threats', items: d.threats || [], color: '#ea580c', soft: '#ffedd5', x: x0 + boxW + gap, y: y0 + boxH + gap },
    ];
    quadrants.forEach((q) => {
      s.push(rect(q.x, q.y, boxW, boxH, { stroke: q.color, strokeWidth: 2, fill: '#ffffff' }));
      s.push(rect(q.x, q.y, boxW, 36, { fill: q.color, stroke: q.color, rx: 14 }));
      s.push(txt(q.title, q.x + boxW / 2, q.y + 24, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      (q.items || []).slice(0, 3).forEach((it, i) => {
        s.push(txt('• ' + anchor(it, 9), q.x + 16, q.y + 64 + i * 32, { fontSize: 12, color: '#334155', fontWeight: '500' }));
      });
    });
    return s;
  },
});

// ── 45. FISHBONE DIAGRAM ─────────────────────────────────────────────────────
define({
  id: 'fishbone_cause', intent: 'cause', label: 'Fishbone cause analysis',
  capacity: { causes: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const spineY = 280;
    s.push(line([80, spineY], [680, spineY], { color: p.accent, strokeWidth: 3 }));
    s.push(rect(680, spineY - 30, 100, 60, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft }));
    s.push(txt(anchor(d.effect || 'Effect', 3), 730, spineY + 5, { fontSize: 14, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const causes = (d.causes || []).slice(0, 4);
    causes.forEach((cause, i) => {
      const isTop = i % 2 === 0;
      const x = 140 + i * 130;
      const y = isTop ? spineY - 80 : spineY + 80;
      s.push(line([x, spineY], [x, y], { color: p.accent, strokeWidth: 2 }));
      s.push(rect(x - 60, y - 24, 120, 48, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(cause.title || cause, 4), x, y + 4, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 46. GANTT TIMELINE ───────────────────────────────────────────────────────
define({
  id: 'gantt_timeline', intent: 'timeline', label: 'Gantt timeline',
  capacity: { tasks: 4 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const tasks = (d.tasks || []).slice(0, 4);
    const rowH = 60, startX = 200, barW = 480;
    tasks.forEach((task, i) => {
      const y = 130 + i * rowH;
      s.push(txt(anchor(task.title || task, 5), 60, y + 26, { fontSize: 13, fontWeight: '700', color: '#1e293b' }));
      const start = Number(task.start || 0) / 100;
      const duration = Number(task.duration || 25) / 100;
      const barX = startX + start * barW;
      const barLen = duration * barW;
      s.push(rect(startX, y, barW, 40, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#f8fafc' }));
      s.push(rect(barX, y + 4, barLen, 32, { stroke: p.accent, strokeWidth: 1.5, fill: p.accent, rx: 4 }));
    });
    return s;
  },
});

// ── 47. CONCEPT LADDER ───────────────────────────────────────────────────────
define({
  id: 'concept_ladder', intent: 'hierarchy', label: 'Concept ladder',
  capacity: { levels: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const levels = (d.levels || []).slice(0, 5);
    const stepH = 56, stepW = 500, x = (W - stepW) / 2;
    levels.forEach((lv, i) => {
      const y = 380 - i * stepH;
      s.push(rect(x, y, stepW, stepH - 8, { stroke: p.accent, strokeWidth: 1.8, fill: i === levels.length - 1 ? p.accent : p.soft }));
      s.push(badge(String(i + 1), x + 16, y - 12, { bg: p.accent }));
      s.push(txt(anchor(lv.title || lv, 10), x + 60, y + 30, { fontSize: 14, fontWeight: '700', color: i === levels.length - 1 ? '#ffffff' : '#1e293b' }));
    });
    return s;
  },
});

// ── 48. MIND MAP BRANCHES ────────────────────────────────────────────────────
define({
  id: 'mind_map_branches', intent: 'cluster', label: 'Mind map with branches',
  capacity: { branches: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const cx = W / 2, cy = 260;
    s.push(circle(cx, cy, 70, { fill: p.accent, stroke: p.accent }));
    s.push(txt(anchor(d.center || ctx.title, 3), cx, cy + 5, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const branches = (d.branches || []).slice(0, 4);
    const positions = [[120, 160], [560, 160], [120, 340], [560, 340]];
    branches.forEach((br, i) => {
      const [x, y] = positions[i];
      s.push(path(`M ${cx} ${cy} Q ${(cx + x) / 2} ${(cy + y) / 2} ${x + 80} ${y + 24}`, { stroke: p.accent, strokeWidth: 2.5, fill: 'none' }));
      s.push(rect(x, y, 160, 48, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft }));
      s.push(txt(anchor(br.title || br, 5), x + 80, y + 28, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 49. PRIORITY MATRIX ──────────────────────────────────────────────────────
define({
  id: 'priority_matrix', intent: 'compare', label: 'Priority matrix',
  capacity: { items: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const x0 = 200, y0 = 140, w = 400, h = 280;
    s.push(rect(x0, y0, w, h, { stroke: '#cbd5e1', strokeWidth: 2, fill: '#ffffff' }));
    s.push(line([x0, y0 + h / 2], [x0 + w, y0 + h / 2], { color: '#cbd5e1', strokeWidth: 1.5 }));
    s.push(line([x0 + w / 2, y0], [x0 + w / 2, y0 + h], { color: '#cbd5e1', strokeWidth: 1.5 }));
    s.push(txt('High Impact', x0 + w / 2, y0 - 10, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    s.push(txt('Low Impact', x0 + w / 2, y0 + h + 20, { fontSize: 12, fontWeight: '700', color: '#94a3b8', textAnchor: 'middle' }));
    s.push(txt('Low Effort', x0 - 10, y0 + h / 2, { fontSize: 12, fontWeight: '700', color: '#94a3b8', textAnchor: 'end' }));
    s.push(txt('High Effort', x0 + w + 10, y0 + h / 2, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'start' }));
    // When items don't carry impact/effort, scatter them one-per-quadrant so
    // they never stack on the centre (a flat list still reads as a 2×2 spread).
    const quad = [[0.28, 0.74], [0.72, 0.74], [0.28, 0.26], [0.72, 0.26]];
    (d.items || []).slice(0, 4).forEach((it, i) => {
      const hasCoords = it && (it.impact != null || it.effort != null);
      const effort = hasCoords ? Number(it.effort || 50) / 100 : quad[i % 4][0];
      const impact = hasCoords ? Number(it.impact || 50) / 100 : quad[i % 4][1];
      const px = x0 + effort * w;
      const py = y0 + (1 - impact) * h;
      s.push(circle(px, py, 32, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(anchor(it.title || it, 2), px, py + 4, { fontSize: 11, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 50. VERTICAL FLOW ────────────────────────────────────────────────────────
define({
  id: 'vertical_flow', intent: 'process', label: 'Vertical flow diagram',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || []).slice(0, 5);
    const boxW = 600, boxH = 54, x = (W - boxW) / 2;
    steps.forEach((st, i) => {
      const y = 120 + i * 68;
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(circle(x - 30, y + boxH / 2, 16, { fill: p.accent, stroke: p.accent }));
      s.push(txt(String(i + 1), x - 30, y + boxH / 2 + 5, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(st.title || st, 12), x + 20, y + boxH / 2 + 5, { fontSize: 14, fontWeight: '700', color: '#1e293b' }));
      if (i < steps.length - 1) s.push(arrow([x + boxW / 2, y + boxH], [x + boxW / 2, y + boxH + 14], { color: p.accent, strokeWidth: 2.5 }));
    });
    return s;
  },
});

// ── 51. KNOWLEDGE PYRAMID ────────────────────────────────────────────────────
define({
  id: 'knowledge_pyramid', intent: 'hierarchy', label: 'Knowledge pyramid',
  capacity: { tiers: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const tiers = (d.tiers || []).slice(0, 4);
    const n = Math.max(tiers.length, 1);
    const baseW = 600, topY = 130, totalH = 280;
    tiers.forEach((ti, i) => {
      const wRatio = (n - i) / n;
      const w = baseW * wRatio;
      const h = totalH / n - 8;
      const x = (W - w) / 2;
      const y = topY + i * (totalH / n);
      s.push(rect(x, y, w, h, { stroke: p.accent, strokeWidth: 2, fill: i === 0 ? p.accent : p.soft, rx: 6 }));
      s.push(txt(anchor(ti.title || ti, 8), W / 2, y + h / 2 + 4, { fontSize: 14, fontWeight: '700', color: i === 0 ? '#ffffff' : '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 52. CIRCULAR SECTORS ─────────────────────────────────────────────────────
define({
  id: 'circular_sectors', intent: 'data', label: 'Circular sectors',
  capacity: { sectors: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const cx = 280, cy = 280, R = 120;
    const sectors = (d.sectors || []).slice(0, 4);
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed'];
    let startAngle = -90;
    sectors.forEach((sec, i) => {
      const value = Number(sec.value || 25);
      const angle = (value / 100) * 360;
      const endAngle = startAngle + angle;
      const midAngle = (startAngle + endAngle) / 2 * (Math.PI / 180);
      const labelX = cx + Math.cos(midAngle) * (R + 60);
      const labelY = cy + Math.sin(midAngle) * (R + 60);
      s.push(rect(labelX - 60, labelY - 20, 120, 40, { stroke: colors[i], strokeWidth: 1.6, fill: '#ffffff' }));
      s.push(txt(anchor(sec.title || sec, 4), labelX, labelY - 4, { fontSize: 12, fontWeight: '700', color: colors[i], textAnchor: 'middle' }));
      s.push(txt(value + '%', labelX, labelY + 12, { fontSize: 11, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
      startAngle = endAngle;
    });
    s.push(circle(cx, cy, R, { fill: 'none', stroke: p.accent, strokeWidth: 2 }));
    return s;
  },
});

// ── 53. HORIZONTAL COMPARISON ────────────────────────────────────────────────
define({
  id: 'horizontal_comparison', intent: 'compare', label: 'Horizontal comparison',
  capacity: { items: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || []).slice(0, 3);
    const boxW = 220, gap = 30, x0 = (W - boxW * items.length - gap * (items.length - 1)) / 2;
    items.forEach((it, i) => {
      const x = x0 + i * (boxW + gap);
      const color = PALETTES[i % PALETTES.length].accent;
      const soft = PALETTES[i % PALETTES.length].soft;
      s.push(rect(x, 140, boxW, 240, { stroke: color, strokeWidth: 2, fill: '#ffffff' }));
      s.push(rect(x, 140, boxW, 50, { fill: color, stroke: color, rx: 14 }));
      s.push(txt(anchor(it.title || it, 4), x + boxW / 2, 170, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      (it.points || []).slice(0, 4).forEach((pt, j) => {
        s.push(circle(x + 20, 210 + j * 44, 6, { fill: color, stroke: color }));
        s.push(txt(anchor(pt, 6), x + 36, 215 + j * 44, { fontSize: 12, color: '#334155', fontWeight: '500' }));
      });
    });
    return s;
  },
});

// ── 54. STEP PROGRESSION ─────────────────────────────────────────────────────
define({
  id: 'step_progression', intent: 'process', label: 'Step progression',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || []).slice(0, 4);
    const boxW = 160, boxH = 200, gap = 20, x0 = (W - boxW * steps.length - gap * (steps.length - 1)) / 2;
    steps.forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 140 + i * 20;
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(circle(x + boxW / 2, y - 20, 20, { fill: p.accent, stroke: p.accent }));
      s.push(txt(String(i + 1), x + boxW / 2, y - 14, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(st.title || st, 5), x + boxW / 2, y + 40, { fontSize: 14, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 8), x + 12, y + 80, { fontSize: 11, color: '#64748b', fontWeight: '500' }));
      if (i < steps.length - 1) s.push(arrow([x + boxW, y + boxH / 2], [x + boxW + gap, y + boxH / 2 + 20], { color: p.accent, strokeWidth: 2.5 }));
    });
    return s;
  },
});

// ── 55. CONCEPT CONSTELLATION ────────────────────────────────────────────────
define({
  id: 'concept_constellation', intent: 'cluster', label: 'Concept constellation',
  capacity: { nodes: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const nodes = (d.nodes || []).slice(0, 6);
    const positions = [[150, 180], [400, 150], [650, 180], [200, 320], [400, 350], [600, 320]];
    nodes.forEach((node, i) => {
      const [x, y] = positions[i];
      s.push(circle(x, y, 50, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(anchor(node.title || node, 3), x, y + 4, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < nodes.length - 1) {
        const [nx, ny] = positions[i + 1];
        s.push(line([x, y], [nx, ny], { color: p.accent, strokeWidth: 1.5, dashed: true }));
      }
    });
    return s;
  },
});

// ── 56. FEATURE GRID ─────────────────────────────────────────────────────────
define({
  id: 'feature_grid', intent: 'define', label: 'Feature grid',
  capacity: { features: 6 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const features = (d.features || []).slice(0, 6);
    const boxW = 240, boxH = 110, gap = 20;
    const x0 = (W - boxW * 3 - gap * 2) / 2, y0 = 130;
    features.forEach((ft, i) => {
      const c = i % 3, r = Math.floor(i / 3);
      const x = x0 + c * (boxW + gap), y = y0 + r * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.6, fill: '#ffffff' }));
      s.push(circle(x + 20, y + 20, 12, { fill: p.accent, stroke: p.accent }));
      s.push(txt(anchor(ft.title || ft, 5), x + 20, y + 50, { fontSize: 14, fontWeight: '700', color: '#1e293b' }));
      if (ft.detail) s.push(txt(anchor(ft.detail, 10), x + 20, y + 76, { fontSize: 11, color: '#64748b', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 57. WATERFALL SEQUENCE ───────────────────────────────────────────────────
define({
  id: 'waterfall_sequence', intent: 'process', label: 'Waterfall sequence',
  capacity: { phases: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const phases = (d.phases || []).slice(0, 5);
    const boxW = 180, boxH = 60;
    phases.forEach((ph, i) => {
      const x = 80 + i * 40;
      const y = 130 + i * 50;
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(txt(anchor(ph.title || ph, 5), x + boxW / 2, y + boxH / 2 + 4, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < phases.length - 1) s.push(arrow([x + boxW / 2, y + boxH], [x + boxW / 2 + 40, y + boxH + 50], { color: p.accent, strokeWidth: 2.5 }));
    });
    return s;
  },
});

// ── 58. BALANCED SCORECARD ───────────────────────────────────────────────────
define({
  id: 'balanced_scorecard', intent: 'compare', label: 'Balanced scorecard',
  capacity: { perspectives: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const boxW = 360, boxH = 150, gap = 20;
    const x0 = (W - boxW * 2 - gap) / 2, y0 = 130;
    const perspectives = (d.perspectives || []).slice(0, 4);
    const colors = ['#2563eb', '#16a34a', '#ea580c', '#7c3aed'];
    perspectives.forEach((per, i) => {
      const c = i % 2, r = Math.floor(i / 2);
      const x = x0 + c * (boxW + gap), y = y0 + r * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: colors[i], strokeWidth: 2, fill: '#ffffff' }));
      s.push(rect(x, y, boxW, 40, { fill: colors[i], stroke: colors[i], rx: 14 }));
      s.push(txt(anchor(per.title || per, 4), x + boxW / 2, y + 26, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      (per.metrics || []).slice(0, 3).forEach((m, j) => {
        s.push(txt('• ' + anchor(m, 9), x + 16, y + 66 + j * 26, { fontSize: 11, color: '#334155', fontWeight: '500' }));
      });
    });
    return s;
  },
});

// ── 59. DEPENDENCY CHAIN ─────────────────────────────────────────────────────
define({
  id: 'dependency_chain', intent: 'process', label: 'Dependency chain',
  capacity: { dependencies: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const deps = (d.dependencies || []).slice(0, 4);
    const boxW = 160, boxH = 80, gap = 30;
    const x0 = (W - boxW * deps.length - gap * (deps.length - 1)) / 2;
    deps.forEach((dep, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 200;
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
      s.push(txt(anchor(dep.title || dep, 4), x + boxW / 2, y + boxH / 2 + 4, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < deps.length - 1) {
        s.push(arrow([x + boxW, y + boxH / 2], [x + boxW + gap, y + boxH / 2], { color: p.accent, strokeWidth: 2.5 }));
        s.push(txt('depends on', x + boxW + gap / 2, y + boxH / 2 - 12, { fontSize: 9, color: '#94a3b8', textAnchor: 'middle', fontStyle: 'italic' }));
      }
    });
    return s;
  },
});

// ── 60. LEARNING PATH ────────────────────────────────────────────────────────
define({
  id: 'learning_path', intent: 'timeline', label: 'Learning path',
  capacity: { milestones: 5 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const milestones = (d.milestones || []).slice(0, 5);
    const pathY = 280;
    s.push(path(`M 80 ${pathY} Q 240 ${pathY - 60} 400 ${pathY} T 720 ${pathY}`, { stroke: p.accent, strokeWidth: 3, fill: 'none' }));
    milestones.forEach((ms, i) => {
      const x = 80 + i * 160;
      const y = i % 2 === 0 ? pathY - 60 : pathY;
      s.push(circle(x, y, 16, { fill: '#ffffff', stroke: p.accent, strokeWidth: 3 }));
      s.push(txt(String(i + 1), x, y + 5, { fontSize: 13, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      s.push(rect(x - 70, y + 30, 140, 50, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(ms.title || ms, 5), x, y + 58, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 61. LABELED SCIENCE DIAGRAM (dynamic figure) ─────────────────────────────
// Renders a REAL scientific figure (atom, DNA, neuron, cell, wave, gear,
// battery, magnet, field) chosen from the scene's explicit `diagram` slot or
// auto-detected from its text, with a legend of key parts beside it. This is
// the "dynamic object generation" path: the drawn object adapts to the content.
define({
  id: 'labeled_science_diagram', intent: 'map', label: 'Labeled science diagram',
  capacity: { labels: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const name = d.diagram || d.shape || d.figure
      || pickDiagramForText(ctx.title, ctx.subtitle, d.headline, d.concept, (d.labels || []).join(' '), (d.points || []).join(' '));

    const figX = 95, figY = 140, figW = 300, figH = 280;
    const figFrags = shape(name, figX, figY, figW, figH);
    if (figFrags.length) {
      s.push(...figFrags);
    } else {
      // Never render empty: fall back to a captioned concept frame.
      s.push(rect(figX, figY + 60, figW, 160, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
      s.push(txt(anchor(d.headline || d.concept || ctx.title, 5), figX + figW / 2, figY + 145, { fontSize: 18, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    }

    // Caption under the figure.
    const caption = anchor(d.headline || d.concept || ctx.title, 6);
    if (caption) s.push(txt(caption, figX + figW / 2, figY + figH + 30, { fontSize: 15, fontWeight: '700', color: '#334155', textAnchor: 'middle' }));

    // Legend of key parts on the right.
    const labels = (d.labels || d.annotations || d.points || []).slice(0, 4);
    if (labels.length) {
      s.push(txt('Key parts', 470, 150, { fontSize: 14, fontWeight: '800', color: p.accent }));
      s.push(line([470, 160], [560, 160], { color: p.accent, strokeWidth: 2 }));
      labels.forEach((lb, i) => {
        const y = 185 + i * 56;
        s.push(circle(480, y + 6, 7, { fill: p.accent, stroke: p.accent }));
        s.push(rect(498, y - 14, 232, 40, { stroke: '#e2e8f0', strokeWidth: 1.2, fill: '#ffffff' }));
        s.push(txt(anchor(typeof lb === 'object' ? (lb.title || lb.text || '') : lb, 7), 510, y + 10, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
      });
      // Single guide arrow from the legend toward the figure.
      s.push(arrow([466, 210], [402, 280], { color: '#94a3b8', strokeWidth: 2 }));
    }
    return s;
  },
});

// ── 62. FIGURE WITH FACTS ────────────────────────────────────────────────────
define({
  id: 'figure_with_facts', intent: 'map', label: 'Figure with facts',
  capacity: { points: 4 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const name = d.diagram || d.shape || d.figure
      || pickDiagramForText(ctx.title, ctx.subtitle, d.headline, d.concept, (d.points || []).join(' '));

    const figX = 70, figY = 130, figW = 300, figH = 290;
    const figFrags = shape(name, figX, figY, figW, figH);
    if (figFrags.length) {
      s.push(...figFrags);
    } else {
      s.push(...shape('atom', figX, figY, figW, figH)); // visually-rich default
    }
    const caption = anchor(d.headline || d.concept || ctx.title, 6);
    if (caption) s.push(txt(caption, figX + figW / 2, figY + figH + 24, { fontSize: 15, fontWeight: '700', color: '#334155', textAnchor: 'middle' }));

    // Fact cards on the right.
    const facts = (d.points || d.facts || d.items || []).slice(0, 4);
    facts.forEach((ft, i) => {
      const y = 140 + i * 74;
      s.push(rect(410, y, 320, 62, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft, rx: 12 }));
      s.push(circle(438, y + 31, 13, { fill: p.accent, stroke: p.accent }));
      s.push(txt(String(i + 1), 438, y + 36, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(typeof ft === 'object' ? (ft.title || ft.text || '') : ft, 8), 462, y + 36, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
    });
    return s;
  },
});

// =============================================================================
// DOMAIN-SPECIFIC TEMPLATES (economics · programming · biology · history · math)
// Each owns its geometry and stays within the 800x500 canvas. Slots are filled
// from the AI's named fields; sensible defaults keep every board non-empty.
// =============================================================================

// ── 63. SUPPLY & DEMAND ──────────────────────────────────────────────────────
define({
  id: 'supply_demand', intent: 'data', label: 'Supply & demand curves',
  capacity: { points: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const ox = 150, oy = 420, top = 150, right = 660;
    s.push(...axesLShape(ox, oy, top, right, d.x_label || 'Quantity', d.y_label || 'Price'));
    // Demand slopes down, supply slopes up.
    s.push(line([185, 165], [610, 405], { color: '#2563eb', strokeWidth: 3 }));
    s.push(line([185, 405], [610, 165], { color: '#ea580c', strokeWidth: 3 }));
    const ex = 397, ey = 285;
    s.push(line([ox, ey], [ex, ey], { color: '#94a3b8', strokeWidth: 1.2, dashed: true }));
    s.push(line([ex, ey], [ex, oy], { color: '#94a3b8', strokeWidth: 1.2, dashed: true }));
    s.push(circle(ex, ey, 7, { fill: '#16a34a', stroke: '#16a34a' }));
    s.push(txt(anchor(d.supply_label || 'Supply', 2), 618, 168, { fontSize: 13, fontWeight: '800', color: '#ea580c' }));
    s.push(txt(anchor(d.demand_label || 'Demand', 2), 618, 405, { fontSize: 13, fontWeight: '800', color: '#2563eb' }));
    s.push(badge(anchor(d.eq_label || 'Equilibrium', 2), ex + 12, ey - 16, { bg: '#16a34a' }));
    return s;
  },
});

// ── 64. CIRCULAR FLOW ────────────────────────────────────────────────────────
define({
  id: 'circular_flow', intent: 'cycle', label: 'Circular flow of the economy',
  capacity: {},
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const lh = { x: 110, y: 230, w: 200, h: 110 };
    const fm = { x: 490, y: 230, w: 200, h: 110 };
    s.push(rect(lh.x, lh.y, lh.w, lh.h, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft }));
    s.push(txt(anchor(d.left_title || 'Households', 2), lh.x + lh.w / 2, lh.y + lh.h / 2 + 6, { fontSize: 17, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    s.push(rect(fm.x, fm.y, fm.w, fm.h, { stroke: '#ea580c', strokeWidth: 2.5, fill: '#ffedd5' }));
    s.push(txt(anchor(d.right_title || 'Firms', 2), fm.x + fm.w / 2, fm.y + fm.h / 2 + 6, { fontSize: 17, fontWeight: '800', color: '#ea580c', textAnchor: 'middle' }));
    s.push(path('M 310 252 Q 400 152 490 252', { stroke: p.accent, strokeWidth: 2.5, markerEnd: 'arr-gray' }));
    s.push(txt(anchor(d.top_label || 'Goods & labor', 3), 400, 150, { fontSize: 13, fontWeight: '700', color: '#334155', textAnchor: 'middle' }));
    s.push(path('M 490 320 Q 400 420 310 320', { stroke: '#ea580c', strokeWidth: 2.5, markerEnd: 'arr-orange' }));
    s.push(txt(anchor(d.bottom_label || 'Spending & wages', 3), 400, 436, { fontSize: 13, fontWeight: '700', color: '#334155', textAnchor: 'middle' }));
    return s;
  },
});

// ── 65. MARKET SHIFT ─────────────────────────────────────────────────────────
define({
  id: 'market_shift', intent: 'data', label: 'Market curve shift',
  capacity: {},
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const ox = 150, oy = 420, top = 150, right = 660;
    s.push(...axesLShape(ox, oy, top, right, d.x_label || 'Quantity', d.y_label || 'Price'));
    s.push(line([185, 410], [600, 175], { color: '#ea580c', strokeWidth: 3 })); // supply
    s.push(line([185, 175], [560, 405], { color: '#2563eb', strokeWidth: 3 }));  // D1
    s.push(line([285, 175], [660, 405], { color: '#7c3aed', strokeWidth: 3, dashed: true })); // D2 shifted right
    s.push(arrow([360, 300], [450, 280], { color: '#16a34a', strokeWidth: 2.5 }));
    s.push(txt(anchor(d.shift_label || 'Shift', 2), 405, 270, { fontSize: 13, fontWeight: '800', color: '#16a34a', textAnchor: 'middle' }));
    s.push(txt('D₁', 545, 415, { fontSize: 14, fontWeight: '800', color: '#2563eb' }));
    s.push(txt('D₂', 648, 415, { fontSize: 14, fontWeight: '800', color: '#7c3aed' }));
    s.push(txt('S', 600, 168, { fontSize: 14, fontWeight: '800', color: '#ea580c' }));
    if (d.cause || d.takeaway) s.push(callout(anchor(d.cause || d.takeaway, 12), 150, 442, 500, { bg: '#eef2ff', stroke: p.accent, color: '#3730a3' }));
    return s;
  },
});

// ── 66. PRODUCTION POSSIBILITY FRONTIER ──────────────────────────────────────
define({
  id: 'ppf_curve', intent: 'data', label: 'Production possibility frontier',
  capacity: {},
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const ox = 150, oy = 420, top = 150, right = 640;
    s.push(...axesLShape(ox, oy, top, right, d.x_label || 'Good A', d.y_label || 'Good B'));
    // Concave frontier bowed away from the origin.
    s.push(path('M 175 170 Q 540 195 615 415', { stroke: p.accent, strokeWidth: 3, fill: 'none' }));
    s.push(circle(470, 250, 7, { fill: '#16a34a', stroke: '#16a34a' }));
    s.push(badge(anchor(d.on_label || 'Efficient', 2), 482, 234, { bg: '#16a34a' }));
    s.push(circle(330, 350, 7, { fill: '#94a3b8', stroke: '#94a3b8' }));
    s.push(badge(anchor(d.inside_label || 'Inefficient', 2), 250, 360, { bg: '#64748b' }));
    s.push(circle(600, 200, 7, { fill: '#dc2626', stroke: '#dc2626' }));
    s.push(badge(anchor(d.outside_label || 'Unattainable', 2), 560, 184, { bg: '#dc2626' }));
    return s;
  },
});

// ── 67. SYSTEM ARCHITECTURE ──────────────────────────────────────────────────
define({
  id: 'system_architecture', intent: 'hierarchy', label: 'System architecture',
  capacity: { layers: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const layers = (d.layers || d.nodes || d.tiers || d.steps || []).slice(0, 4);
    const defs = ['Client', 'API', 'Service', 'Database'];
    const list = layers.length ? layers : defs.map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const boxW = 150, boxH = 130, y = 210;
    const gap = (W - 80 - boxW * n) / Math.max(n - 1, 1);
    s.push(txt(anchor(d.flow_label || 'Request flows →', 4), 40, 184, { fontSize: 12, fontWeight: '700', color: '#64748b' }));
    list.forEach((ly, i) => {
      const x = 40 + i * (boxW + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: '#ffffff' }));
      s.push(rect(x, y, boxW, 34, { fill: p.accent, stroke: p.accent, rx: 14 }));
      s.push(txt(String.fromCharCode(65 + i), x + 18, y + 23, { fontSize: 14, fontWeight: '800', color: '#ffffff' }));
      s.push(txt(anchor(itemText(ly), 4), x + boxW / 2, y + 70, { fontSize: 14, fontWeight: '800', color: '#1e293b', textAnchor: 'middle' }));
      if (ly && ly.detail) s.push(txt(anchor(ly.detail, 6), x + boxW / 2, y + 98, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 3, y + boxH / 2], [x + boxW + gap - 3, y + boxH / 2], { color: p.accent, strokeWidth: 2.5 }));
    });
    return s;
  },
});

// ── 68. FLOWCHART (with decision diamond) ────────────────────────────────────
define({
  id: 'flowchart_diagram', intent: 'process', label: 'Flowchart with decision',
  capacity: { branches: 2 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const cx = 300;
    s.push(rect(cx - 75, 108, 150, 42, { stroke: p.accent, strokeWidth: 2, fill: p.accent, rx: 20 }));
    s.push(txt(anchor(d.start || 'Start', 3), cx, 134, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(arrow([cx, 150], [cx, 176], { color: '#64748b', strokeWidth: 2 }));
    const step0 = itemText((d.steps || [])[0]) || d.process || 'Process';
    s.push(rect(cx - 78, 176, 156, 50, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push(txt(anchor(step0, 5), cx, 206, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    s.push(arrow([cx, 226], [cx, 252], { color: '#64748b', strokeWidth: 2 }));
    // Decision diamond
    s.push(path(`M ${cx} 252 L ${cx + 78} 300 L ${cx} 348 L ${cx - 78} 300 Z`, { stroke: '#ea580c', strokeWidth: 2, fill: '#ffedd5' }));
    s.push(txt(anchor(d.decision || d.question || 'Decision?', 4), cx, 304, { fontSize: 12, fontWeight: '700', color: '#9a3412', textAnchor: 'middle' }));
    const br = (d.branches || []).slice(0, 2);
    const yesText = (br[0] && itemText(br[0])) || d.yes_label || 'Yes';
    const noText = (br[1] && itemText(br[1])) || d.no_label || 'No';
    // Yes → right
    s.push(arrow([cx + 78, 300], [560, 300], { color: '#16a34a', strokeWidth: 2.5, label: 'Yes' }));
    s.push(rect(560, 274, 200, 52, { stroke: '#16a34a', strokeWidth: 2, fill: '#dcfce7' }));
    s.push(txt(anchor(yesText, 6), 660, 304, { fontSize: 13, fontWeight: '700', color: '#166534', textAnchor: 'middle' }));
    // No → down
    s.push(arrow([cx, 348], [cx, 392], { color: '#dc2626', strokeWidth: 2.5, label: 'No' }));
    s.push(rect(cx - 100, 392, 200, 52, { stroke: '#dc2626', strokeWidth: 2, fill: '#fee2e2' }));
    s.push(txt(anchor(noText, 6), cx, 422, { fontSize: 13, fontWeight: '700', color: '#991b1b', textAnchor: 'middle' }));
    return s;
  },
});

// ── 69. REQUEST LIFECYCLE ────────────────────────────────────────────────────
define({
  id: 'request_lifecycle', intent: 'process', label: 'Request lifecycle',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const stages = (d.steps || d.stages || []).slice(0, 5);
    const list = stages.length ? stages : ['Browser', 'DNS', 'Server', 'Database', 'Response'].map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const y = 280;
    const left = 110, span = (680 - left * 0 + 680) ? Math.min(620, 700 - 100) : 600;
    const step = (700 - 100) / Math.max(n - 1, 1);
    list.forEach((st, i) => {
      const x = 100 + i * step;
      if (i < n - 1) s.push(arrow([x + 30, y], [x + step - 30, y], { color: p.accent, strokeWidth: 2.5 }));
      s.push(circle(x, y, 28, { fill: p.soft, stroke: p.accent, strokeWidth: 2.5 }));
      s.push(txt(String(i + 1), x, y + 5, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      s.push(txt(anchor(itemText(st), 3), x, y + 62, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    // Return path arc (response).
    const lastX = 100 + (n - 1) * step;
    s.push(path(`M ${lastX} ${y - 28} Q ${(100 + lastX) / 2} 150 100 ${y - 28}`, { stroke: '#94a3b8', strokeWidth: 2, dashed: true, markerEnd: 'arr-gray' }));
    s.push(txt(anchor(d.return_label || 'response', 2), (100 + lastX) / 2, 150, { fontSize: 12, fontWeight: '700', color: '#64748b', textAnchor: 'middle' }));
    return s;
  },
});

// ── 70. STATE MACHINE ────────────────────────────────────────────────────────
define({
  id: 'state_machine', intent: 'process', label: 'State machine',
  capacity: { states: 3 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const states = (d.states || d.nodes || d.steps || []).slice(0, 3);
    const list = states.length ? states : ['Idle', 'Active', 'Done'].map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const ys = 280, r = 46;
    const xs = [180, 400, 620].slice(0, n);
    const labels = (d.links || d.transitions || []).map(itemText);
    s.push(arrow([90, ys], [xs[0] - r - 4, ys], { color: '#64748b', strokeWidth: 2, label: 'start' }));
    list.forEach((st, i) => {
      const x = xs[i] ?? (180 + i * 220);
      s.push(circle(x, ys, r, { fill: p.soft, stroke: p.accent, strokeWidth: 2.5 }));
      s.push(txt(anchor(itemText(st), 3), x, ys + 5, { fontSize: 13, fontWeight: '800', color: '#1e293b', textAnchor: 'middle' }));
      if (i < n - 1) {
        const nx = xs[i + 1] ?? (x + 220);
        s.push(arrow([x + r + 3, ys], [nx - r - 3, ys], { color: p.accent, strokeWidth: 2.5, label: labels[i] ? anchor(labels[i], 3) : '' }));
      }
    });
    if (n > 1) {
      const a = xs[0], b = xs[n - 1];
      s.push(path(`M ${b} ${ys + r} Q ${(a + b) / 2} ${ys + 120} ${a} ${ys + r}`, { stroke: '#94a3b8', strokeWidth: 2, dashed: true, markerEnd: 'arr-gray' }));
      s.push(txt(anchor(labels[n - 1] || d.reset_label || 'reset', 3), (a + b) / 2, ys + 120, { fontSize: 12, fontWeight: '700', color: '#64748b', textAnchor: 'middle' }));
    }
    return s;
  },
});

// ── 71. CODE WALKTHROUGH ─────────────────────────────────────────────────────
define({
  id: 'code_walkthrough', intent: 'define', label: 'Annotated code block',
  capacity: { lines: 6 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const lines = (d.lines || d.code || d.steps || d.points || []).slice(0, 6).map(itemText);
    const panelX = 60, panelY = 120, panelW = 440;
    const panelH = Math.max(120, 30 + lines.length * 30 + 16);
    s.push(rect(panelX, panelY, panelW, panelH, { fill: '#0f172a', stroke: '#0f172a', rx: 10 }));
    s.push(circle(panelX + 18, panelY + 18, 5, { fill: '#ef4444', stroke: '#ef4444' }));
    s.push(circle(panelX + 36, panelY + 18, 5, { fill: '#f59e0b', stroke: '#f59e0b' }));
    s.push(circle(panelX + 54, panelY + 18, 5, { fill: '#22c55e', stroke: '#22c55e' }));
    lines.forEach((ln, i) => {
      const y = panelY + 50 + i * 30;
      s.push(txt(String(i + 1), panelX + 16, y, { fontSize: 12, color: '#475569', fontWeight: '600', textAnchor: 'end' }));
      s.push(txt(anchor(ln, 8), panelX + 28, y, { fontSize: 13, color: '#e2e8f0', fontWeight: '500' }));
    });
    const notes = (d.annotations || d.notes || d.items || []).slice(0, 3);
    notes.forEach((nt, i) => {
      const y = 140 + i * 92;
      s.push(rect(530, y, 220, 76, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(badge(String(i + 1), 542, y - 12, { bg: p.accent }));
      s.push(txt(anchor(itemText(nt), 9), 546, y + 34, { fontSize: 12, color: '#1e293b', fontWeight: '500' }));
    });
    return s;
  },
});

// ── 72. LABELED CYCLE (center label + stages) ────────────────────────────────
define({
  id: 'labeled_cycle', intent: 'cycle', label: 'Labeled cycle',
  capacity: { stages: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const cx = 400, cy = 300, R = 135;
    const stages = (d.stages || d.steps || d.events || []).slice(0, 5);
    const n = Math.max(stages.length, 1);
    s.push(circle(cx, cy, R, { fill: 'none', stroke: '#e2e8f0', strokeWidth: 1.5 }));
    s.push(circle(cx, cy, 56, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
    s.push(txt(anchor(d.center || ctx.title, 3), cx, cy + 5, { fontSize: 14, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    stages.forEach((stg, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      const sx = cx + Math.cos(ang) * R;
      const sy = cy + Math.sin(ang) * R;
      s.push(circle(sx, sy, 40, { fill: '#ffffff', stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(anchor(itemText(stg), 3), sx, sy + 4, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      const nextAng = (-90 + (360 / n) * (i + 1)) * (Math.PI / 180);
      const ax = cx + Math.cos(ang) * R, ay = cy + Math.sin(ang) * R;
      const bx = cx + Math.cos(nextAng) * R, by = cy + Math.sin(nextAng) * R;
      const mx = cx + Math.cos((ang + nextAng) / 2) * (R + 26);
      const my = cy + Math.sin((ang + nextAng) / 2) * (R + 26);
      if (n > 1) s.push(path(`M ${ax + Math.cos(ang) * 40} ${ay + Math.sin(ang) * 40} Q ${mx} ${my} ${bx - Math.cos(nextAng) * 40} ${by - Math.sin(nextAng) * 40}`, { stroke: p.accent, strokeWidth: 2, markerEnd: 'arr-green' }));
    });
    return s;
  },
});

// ── 73. ANATOMY CALLOUTS (figure + bilateral leader labels) ──────────────────
define({
  id: 'anatomy_callouts', intent: 'map', label: 'Anatomy callouts',
  capacity: { labels: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const name = d.diagram || d.shape || d.figure
      || pickDiagramForText(ctx.title, ctx.subtitle, d.headline, d.concept, (d.labels || []).map(itemText).join(' '));
    const figX = 290, figY = 150, figW = 230, figH = 240;
    const figFrags = shape(name, figX, figY, figW, figH);
    if (figFrags.length) s.push(...figFrags);
    else { s.push(obj('generic', figX + 20, figY + 30, figW - 40, figH - 60, { label: anchor(d.headline || ctx.title, 3) })); }
    const labels = (d.labels || d.annotations || d.points || []).slice(0, 4).map(itemText);
    const slots = [
      { bx: 40, by: 150, lx1: 220, ly1: 175, lx2: 320, ly2: 200, anc: 'start' },
      { bx: 40, by: 320, lx1: 220, ly1: 345, lx2: 320, ly2: 330, anc: 'start' },
      { bx: 580, by: 150, lx1: 580, ly1: 175, lx2: 500, ly2: 200, anc: 'start' },
      { bx: 580, by: 320, lx1: 580, ly1: 345, lx2: 500, ly2: 330, anc: 'start' },
    ];
    labels.forEach((lb, i) => {
      const c = slots[i];
      s.push(rect(c.bx, c.by, 180, 50, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(lb, 6), c.bx + 12, c.by + 30, { fontSize: 12, fontWeight: '600', color: '#1e293b' }));
      s.push(line([c.lx1, c.ly1], [c.lx2, c.ly2], { color: '#94a3b8', strokeWidth: 1.6 }));
      s.push(circle(c.lx2, c.ly2, 4, { fill: p.accent, stroke: p.accent }));
    });
    return s;
  },
});

// ── 74. CAUSAL CHAIN (vertical, highlighted outcome) ─────────────────────────
define({
  id: 'causal_chain', intent: 'cause', label: 'Causal chain',
  capacity: { events: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const events = (d.events || d.links || d.steps || []).slice(0, 4);
    const n = Math.max(events.length, 1);
    const cardW = 380, cardH = 56, x = (W - cardW) / 2;
    let y = 112;
    events.forEach((ev, i) => {
      const isLast = i === n - 1;
      s.push(rect(x, y, cardW, cardH, { stroke: isLast ? '#16a34a' : p.accent, strokeWidth: 2, fill: isLast ? '#dcfce7' : p.soft }));
      s.push(badge(isLast ? 'outcome' : String(i + 1), x + 14, y - 12, { bg: isLast ? '#16a34a' : p.accent }));
      s.push(txt(anchor(itemText(ev), 7), x + cardW / 2, y + (ev && ev.detail ? 26 : 33), { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (ev && ev.detail) s.push(txt(anchor(ev.detail, 8), x + cardW / 2, y + 44, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
      if (!isLast) s.push(arrow([W / 2, y + cardH], [W / 2, y + cardH + 24], { color: '#dc2626', strokeWidth: 2.5 }));
      y += cardH + 24;
    });
    return s;
  },
});

// ── 75. ERA BANDS (timeline split into labeled eras) ─────────────────────────
define({
  id: 'era_bands', intent: 'timeline', label: 'Era bands',
  capacity: { events: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const eras = (d.events || d.eras || d.stages || d.steps || []).slice(0, 4);
    const n = Math.max(eras.length, 1);
    const x0 = 60, totalW = 680, bandY = 200, bandH = 76;
    const segW = totalW / n;
    const fills = ['#dbeafe', '#fce7f3', '#dcfce7', '#ffedd5'];
    const strokes = ['#2563eb', '#db2777', '#16a34a', '#ea580c'];
    eras.forEach((er, i) => {
      const x = x0 + i * segW;
      s.push(rect(x, bandY, segW - 4, bandH, { stroke: strokes[i % 4], strokeWidth: 2, fill: fills[i % 4], rx: 8 }));
      s.push(txt(anchor(itemText(er), 4), x + (segW - 4) / 2, bandY + 34, { fontSize: 14, fontWeight: '800', color: '#1e293b', textAnchor: 'middle' }));
      if (er && (er.detail || er.range)) s.push(txt(anchor(er.detail || er.range, 5), x + (segW - 4) / 2, bandY + 58, { fontSize: 11, color: '#475569', textAnchor: 'middle' }));
      const note = er && (er.note || er.text);
      if (note) s.push(txt(anchor(note, 7), x + (segW - 4) / 2, bandY + bandH + 28, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 76. CONCEPT ANALOGY (X is like Y) ────────────────────────────────────────
define({
  id: 'concept_analogy', intent: 'compare', label: 'Concept analogy',
  capacity: { links: 3 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    s.push(rect(60, 120, 300, 150, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push(txt(anchor(d.left_title || d.concept || 'Concept', 4), 210, 154, { fontSize: 16, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    s.push(rect(440, 120, 300, 150, { stroke: '#ea580c', strokeWidth: 2, fill: '#ffedd5' }));
    s.push(txt(anchor(d.right_title || d.analogy || 'Like…', 4), 590, 154, { fontSize: 16, fontWeight: '800', color: '#ea580c', textAnchor: 'middle' }));
    s.push(badge('is like', 372, 188, { bg: '#1e293b' }));
    s.push(arrow([360, 195], [440, 195], { color: '#94a3b8', strokeWidth: 2 }));
    const pairs = (d.links || d.pairs || d.mappings || []).slice(0, 3);
    pairs.forEach((pr, i) => {
      const y = 320 + i * 44;
      const from = itemText(pr.from || pr.left || pr.title || pr);
      const to = itemText(pr.to || pr.right || pr.detail || '');
      s.push(txt(anchor(from, 5), 200, y, { fontSize: 13, fontWeight: '600', color: '#1e293b', textAnchor: 'end' }));
      s.push(arrow([214, y - 5], [320, y - 5], { color: p.accent, strokeWidth: 1.8 }));
      if (to) s.push(txt(anchor(to, 5), 334, y, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
    });
    return s;
  },
});

// ── 77. EXPLAINED DEFINITION (term + why it matters + example) ───────────────
define({
  id: 'explained_definition', intent: 'define', label: 'Explained definition',
  capacity: { points: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    s.push(rect(60, 112, 680, 78, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
    s.push(txt(anchor(d.headline || d.term || ctx.title, 5), 84, 144, { fontSize: 21, fontWeight: '800', color: p.accent }));
    if (d.definition) s.push(txt(anchor(d.definition, 11), 84, 172, { fontSize: 14, fontWeight: '500', color: '#334155' }));
    s.push(txt(anchor(d.why_title || 'Why it matters', 3), 80, 222, { fontSize: 14, fontWeight: '800', color: '#1e293b' }));
    const why = (d.points || d.why || d.items || []).slice(0, 3).map(itemText);
    why.forEach((w, i) => {
      const y = 252 + i * 46;
      s.push(circle(92, y - 4, 7, { fill: p.accent, stroke: p.accent }));
      s.push(txt(anchor(w, 7), 110, y, { fontSize: 13, fontWeight: '500', color: '#1e293b' }));
    });
    if (d.example) s.push(callout(anchor(d.example, 14), 440, 240, 300, { bg: '#fffbeb', stroke: '#f59e0b', color: '#92400e' }));
    return s;
  },
});

// ── 78. ANNOTATED GRAPH (curve + region callouts) ────────────────────────────
define({
  id: 'annotated_graph', intent: 'data', label: 'Annotated graph',
  capacity: { annotations: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const ox = 120, oy = 420, top = 140, right = 700;
    s.push(...axesLShape(ox, oy, top, right, d.x_label || 'Time', d.y_label || 'Value'));
    s.push(path('M 140 380 Q 280 170 420 300 T 690 210', { stroke: p.accent, strokeWidth: 3, fill: 'none' }));
    const pts = [[280, 205], [470, 285], [640, 225]];
    const notes = (d.annotations || d.notes || d.points || []).slice(0, 3).map(itemText);
    notes.forEach((nt, i) => {
      const [px, py] = pts[i];
      s.push(circle(px, py, 6, { fill: '#dc2626', stroke: '#dc2626' }));
      const boxY = i % 2 === 0 ? py - 64 : py + 18;
      s.push(line([px, py], [px, boxY + (i % 2 === 0 ? 46 : 0)], { color: '#94a3b8', strokeWidth: 1.4, dashed: true }));
      s.push(rect(px - 70, boxY, 150, 46, { stroke: p.accent, strokeWidth: 1.4, fill: p.soft }));
      s.push(txt(anchor(nt, 6), px, boxY + 28, { fontSize: 11, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── 79. NUMBER LINE ──────────────────────────────────────────────────────────
define({
  id: 'number_line', intent: 'data', label: 'Number line',
  capacity: { markers: 5 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const y = 290, x0 = 80, x1 = 720;
    s.push(line([x0, y], [x1, y], { color: '#475569', strokeWidth: 2.5 }));
    s.push(path(`M ${x1} ${y} l -12 -6 l 0 12 z`, { fill: '#475569', stroke: '#475569' }));
    s.push(path(`M ${x0} ${y} l 12 -6 l 0 12 z`, { fill: '#475569', stroke: '#475569' }));
    const ticks = 8;
    for (let i = 0; i <= ticks; i++) {
      const x = x0 + (i * (x1 - x0)) / ticks;
      s.push(line([x, y - 7], [x, y + 7], { color: '#94a3b8', strokeWidth: 1.4 }));
    }
    const markers = (d.markers || d.points || d.items || []).slice(0, 5);
    markers.forEach((mk, i) => {
      const frac = markers.length > 1 ? i / (markers.length - 1) : 0.5;
      const x = x0 + 60 + frac * (x1 - x0 - 120);
      s.push(circle(x, y, 9, { fill: p.accent, stroke: p.accent }));
      s.push(rect(x - 64, y - 70, 128, 44, { stroke: p.accent, strokeWidth: 1.5, fill: p.soft }));
      s.push(txt(anchor(itemText(mk), 5), x, y - 43, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      s.push(line([x, y - 26], [x, y - 9], { color: p.accent, strokeWidth: 1.4, dashed: true }));
    });
    return s;
  },
});

// ── 80. VECTOR DIAGRAM ───────────────────────────────────────────────────────
define({
  id: 'vector_diagram', intent: 'map', label: 'Vector diagram',
  capacity: { vectors: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const cx = 400, cy = 300;
    s.push(line([130, cy], [670, cy], { color: '#cbd5e1', strokeWidth: 1.6 }));
    s.push(line([cx, 140], [cx, 440], { color: '#cbd5e1', strokeWidth: 1.6 }));
    s.push(circle(cx, cy, 4, { fill: '#475569', stroke: '#475569' }));
    const vectors = (d.vectors || d.items || d.points || []).slice(0, 3);
    const list = vectors.length ? vectors : [{ title: 'A' }, { title: 'B' }];
    const dirs = [[150, -90], [170, 40], [-140, -70]];
    const colors = ['#2563eb', '#ea580c', '#16a34a'];
    list.forEach((v, i) => {
      const [dx, dy] = dirs[i % dirs.length];
      const ex = cx + dx, ey = cy + dy;
      s.push(arrow([cx, cy], [ex, ey], { color: colors[i % 3], strokeWidth: 3 }));
      s.push(txt(anchor(itemText(v), 3), ex + (dx > 0 ? 10 : -10), ey + (dy > 0 ? 16 : -8), { fontSize: 13, fontWeight: '800', color: colors[i % 3], textAnchor: dx > 0 ? 'start' : 'end' }));
    });
    return s;
  },
});

// Small centered two-line note under a node (keeps detail short, wraps once).
function wrapNote(text, cx, y) {
  const words = String(text || '').split(' ').filter(Boolean);
  if (words.length <= 4) return [txt(words.join(' '), cx, y, { fontSize: 12, color: '#64748b', fontWeight: '500', textAnchor: 'middle' })];
  const mid = Math.ceil(words.length / 2);
  return [
    txt(words.slice(0, mid).join(' '), cx, y, { fontSize: 12, color: '#64748b', fontWeight: '500', textAnchor: 'middle' }),
    txt(words.slice(mid).join(' '), cx, y + 16, { fontSize: 12, color: '#64748b', fontWeight: '500', textAnchor: 'middle' }),
  ];
}

// =============================================================================
// FLOW-DIAGRAM TEMPLATES (icon nodes + smooth connectors + notes panel)
// Inspired by professional "distributed arrow" / actor-flow slides, but each
// is geometrically distinct so no two boards look alike. Icons are picked from
// each node's own text, so they always carry meaning for the topic at hand.
// =============================================================================

// ── F1. DISTRIBUTED ARROW FLOW — hub icon branches to up to 4 outputs ────────
define({
  id: 'distributed_arrow_flow', intent: 'cluster', label: 'Distributed arrow flow',
  capacity: { items: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const ringCols = ['#ea580c', '#7c3aed', '#16a34a', '#0284c7'];
    const hubX = 200, hubY = 300, hubR = 46;
    // Hub node (center-left), icon from title.
    s.push(...iconNode(pickIcon(d.center || ctx.title, 0), hubX, hubY, hubR, p.accent, { caption: anchor(d.center || ctx.title, 3) }));
    const outs = (asArr(d.items).length ? d.items : asArr(d.points)).slice(0, 4);
    // Outputs stack as evenly-spaced rows on the right; rings share a column so
    // their label panels never collide. Arrows fan out from the hub to each row.
    const ringX = 470, ringR = 32;
    const top = 150, bottom = 450;
    const n = Math.max(outs.length, 1);
    outs.forEach((it, i) => {
      const ry = n === 1 ? (top + bottom) / 2 : top + ((bottom - top) * i) / (n - 1);
      const col = ringCols[i % ringCols.length];
      const label = itemText(it); const detail = (it && typeof it === 'object') ? (it.detail || it.text || '') : '';
      s.push(curveArrow(hubX + hubR + 4, hubY, ringX - ringR - 6, ry, { color: col, bowY: (ry - hubY) * 0.16 }));
      s.push(...iconNode(pickIcon(label, i), ringX, ry, ringR, col));
      const panelX = ringX + ringR + 14; const panelW = 800 - panelX - 16;
      s.push(rect(panelX, ry - 26, panelW, detail ? 56 : 36, { fill: '#f8fafc', stroke: col, strokeWidth: 1.4, rx: 10 }));
      s.push(txt(anchor(label, 5), panelX + 12, ry - 4, { fontSize: 14, fontWeight: '800', color: col }));
      if (detail) s.push(txt(anchor(detail, 7), panelX + 12, ry + 18, { fontSize: 12, color: '#475569', fontWeight: '500' }));
    });
    return s;
  },
});

// ── F2. HUB & SPOKE ICONS — central concept, radial satellite icon nodes ─────
define({
  id: 'hub_spoke_icons', intent: 'map', label: 'Hub & spoke icons',
  capacity: { satellites: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const cx = 400, cy = 290, R = 150;
    const sats = (asArr(d.satellites).length ? d.satellites : (asArr(d.items).length ? d.items : asArr(d.points))).slice(0, 6);
    const cols = ['#2563eb', '#16a34a', '#ea580c', '#db2777', '#0891b2', '#7c3aed'];
    const n = Math.max(sats.length, 1);
    sats.forEach((it, i) => {
      const ang = -Math.PI / 2 + (Math.PI * 2 * i) / n;
      const sx = cx + Math.cos(ang) * R, sy = cy + Math.sin(ang) * R;
      const col = cols[i % cols.length]; const label = itemText(it);
      s.push(curveArrow(cx + Math.cos(ang) * 54, cy + Math.sin(ang) * 54, sx - Math.cos(ang) * 34, sy - Math.sin(ang) * 34, { color: col }));
      s.push(...iconNode(pickIcon(label, i), sx, sy, 30, col, { caption: anchor(label, 3) }));
    });
    // center hub last so it sits on top
    s.push(circle(cx, cy, 50, { fill: p.soft, stroke: p.accent, strokeWidth: 2.5 }));
    s.push(txt(anchor(d.center || ctx.title, 3), cx, cy + 5, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    return s;
  },
});

// ── F3. ICON PIPELINE — horizontal icon nodes joined by arrows ───────────────
define({
  id: 'icon_pipeline', intent: 'process', label: 'Icon pipeline',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const steps = (asArr(d.steps).length ? d.steps : (asArr(d.items).length ? d.items : asArr(d.points))).slice(0, 4);
    const cols = ['#2563eb', '#0f766e', '#ea580c', '#7c3aed'];
    const n = Math.max(steps.length, 1);
    const gap = 700 / n; const r = 38; const cy = 240;
    steps.forEach((it, i) => {
      const cx = 60 + gap * i + gap / 2;
      const col = cols[i % cols.length];
      const title = itemText(it); const detail = (it && typeof it === 'object') ? (it.detail || it.text || '') : '';
      if (i > 0) {
        const prev = 60 + gap * (i - 1) + gap / 2;
        s.push(arrow([prev + r + 6, cy], [cx - r - 6, cy], { color: '#94a3b8', strokeWidth: 2.4 }));
      }
      s.push(badge(String(i + 1), cx - r + 6, cy - r - 4, { bg: col }));
      s.push(...iconNode(pickIcon(title, i), cx, cy, r, col));
      s.push(txt(anchor(title, 3), cx, cy + r + 24, { fontSize: 14, fontWeight: '800', color: col, textAnchor: 'middle' }));
      if (detail) s.push(...wrapNote(anchor(detail, 8), cx, cy + r + 44));
    });
    return s;
  },
});

// ── F4. DECISION FLOW — start → decision diamond → yes/no branches ───────────
define({
  id: 'decision_flow', intent: 'process', label: 'Decision flow',
  capacity: { items: 2 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const startX = 130, midY = 200;
    s.push(...iconNode(pickIcon(d.center || ctx.title, 0), startX, midY, 38, p.accent, { caption: anchor(d.center || d.start || 'Start', 3) }));
    // decision diamond
    const dx = 360, dy = midY;
    s.push(path(`M ${dx} ${dy - 46} L ${dx + 60} ${dy} L ${dx} ${dy + 46} L ${dx - 60} ${dy} Z`, { fill: '#fef9c3', stroke: '#ca8a04', strokeWidth: 2.4 }));
    s.push(txt(anchor(d.decision || d.question || 'Decision?', 3), dx, dy + 5, { fontSize: 13, fontWeight: '800', color: '#854d0e', textAnchor: 'middle' }));
    s.push(arrow([startX + 42, midY], [dx - 62, dy], { color: '#64748b', strokeWidth: 2.4 }));
    const branches = (asArr(d.items).length ? d.items : asArr(d.points)).slice(0, 2);
    const yesBranch = branches[0] != null ? itemText(branches[0]) : (d.yes_label || 'Proceed');
    const noBranch = branches[1] != null ? itemText(branches[1]) : (d.no_label || 'Stop');
    // YES (up-right)
    s.push(curveArrow(dx + 10, dy - 40, 600, 150, { color: '#16a34a', bowY: -30 }));
    s.push(...iconNode('check', 640, 150, 30, '#16a34a'));
    s.push(rect(686, 122, 100, 56, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1.4, rx: 10 }));
    s.push(txt(anchor(yesBranch, 4), 696, 154, { fontSize: 13, fontWeight: '700', color: '#166534' }));
    // NO (down-right)
    s.push(curveArrow(dx + 10, dy + 40, 600, 360, { color: '#dc2626', bowY: 30 }));
    s.push(...iconNode('cross', 640, 360, 30, '#dc2626'));
    s.push(rect(686, 332, 100, 56, { fill: '#fef2f2', stroke: '#dc2626', strokeWidth: 1.4, rx: 10 }));
    s.push(txt(anchor(noBranch, 4), 696, 364, { fontSize: 13, fontWeight: '700', color: '#991b1b' }));
    return s;
  },
});

// ── F5. CONCEPT PANEL FLOW — side notes panel + icon flow on the right ───────
define({
  id: 'concept_panel_flow', intent: 'map', label: 'Concept panel + flow',
  capacity: { points: 6, items: 3 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    // Left: notes panel built from points.
    s.push(...notePanel(anchor(d.center || ctx.title, 4), asArr(d.points).length ? d.points : asArr(d.items), 40, 130, 300, p.accent));
    // Right: vertical icon flow of key items.
    const items = (asArr(d.items).length ? d.items : asArr(d.points)).slice(0, 3);
    const cols = ['#2563eb', '#16a34a', '#ea580c'];
    const colX = 560; const startY = 170; const stepY = 110;
    items.forEach((it, i) => {
      const cy = startY + i * stepY; const col = cols[i % cols.length];
      const label = itemText(it);
      if (i > 0) s.push(arrow([colX, cy - stepY + 38], [colX, cy - 38], { color: '#94a3b8', strokeWidth: 2.4 }));
      s.push(...iconNode(pickIcon(label, i), colX, cy, 32, col));
      s.push(rect(colX + 44, cy - 24, 196, 48, { fill: '#f8fafc', stroke: col, strokeWidth: 1.4, rx: 10 }));
      s.push(txt(anchor(label, 4), colX + 56, cy + 4, { fontSize: 14, fontWeight: '800', color: col }));
    });
    return s;
  },
});

// ── F6. BRANCHING OUTCOMES — one cause icon → several effect icon nodes ──────
define({
  id: 'branching_outcomes', intent: 'cause', label: 'Branching outcomes',
  capacity: { items: 3 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const srcX = 150, srcY = 290, r = 44;
    s.push(...iconNode(pickIcon(d.center || ctx.title, 0), srcX, srcY, r, p.accent, { caption: anchor(d.center || ctx.title, 3) }));
    const effects = (asArr(d.items).length ? d.items : asArr(d.points)).slice(0, 3);
    const cols = ['#2563eb', '#ea580c', '#7c3aed'];
    const targets = [{ y: 165 }, { y: 290 }, { y: 415 }];
    const ex = 560;
    effects.forEach((it, i) => {
      const ty = targets[i] ? targets[i].y : 165 + i * 125;
      const col = cols[i % cols.length]; const label = itemText(it);
      const detail = (it && typeof it === 'object') ? (it.detail || it.text || '') : '';
      s.push(curveArrow(srcX + r + 4, srcY, ex - 34, ty, { color: col, bowY: (ty - srcY) * 0.18 }));
      s.push(...iconNode(pickIcon(label, i + 1), ex, ty, 30, col));
      s.push(rect(ex + 42, ty - 28, 196, detail ? 60 : 40, { fill: '#f8fafc', stroke: col, strokeWidth: 1.4, rx: 10 }));
      s.push(txt(anchor(label, 4), ex + 54, ty - 4, { fontSize: 14, fontWeight: '800', color: col }));
      if (detail) s.push(txt(anchor(detail, 6), ex + 54, ty + 18, { fontSize: 12, color: '#475569', fontWeight: '500' }));
    });
    return s;
  },
});

// =============================================================================
// ARCHITECTURE / SYSTEM-DIAGRAM TEMPLATES
// Clean flat node boxes (bold title + lighter subtitle on a solid accent fill),
// arranged in labelled columns and joined by thin dashed connectors — the
// "system architecture" look: titled boxes + arrows + section headers.
// =============================================================================

// Solid accent fills (flat, no gradient) cycled across nodes.
const ARCH_FILLS = ['#4f46e5', '#0f766e', '#1d4ed8', '#b45309', '#15803d', '#6d28d9', '#0e7490', '#b91c1c'];
const ARCH_SUB = '#e2e8f0';   // subtitle text on a dark fill
const ARCH_HEADER = '#94a3b8'; // small grey section label
const ARCH_LINK = '#cbd5e1';   // dashed connector grey

// A small left-aligned section label above a column ("Six-stage pipeline").
function archHeader(label, x, y) {
  return txt(anchor(String(label || '').toUpperCase(), 5), x, y, { fontSize: 12, fontWeight: '700', color: ARCH_HEADER, textAnchor: 'start' });
}

// A flat node box: solid rounded rect + bold white title + lighter subtitle,
// emitted as separate text fragments so the fit/prune passes treat them as real
// content. Returns an array of fragments.
function nodeBox(x, y, w, h, fill, title, subtitle) {
  const out = [rect(x, y, w, h, { flat: true, fill, rx: 10 })];
  if (title) out.push(txt(anchor(title, 7), x + 14, y + (subtitle ? 24 : h / 2 + 4), { fontSize: 14, fontWeight: '800', color: '#ffffff' }));
  if (subtitle) out.push(txt(anchor(subtitle, 9), x + 14, y + 43, { fontSize: 11, fontWeight: '500', color: ARCH_SUB }));
  return out;
}

function dashTo(from, to, color = ARCH_LINK) {
  return arrow(from, to, { color, strokeWidth: 1.6, dashed: true });
}

// ── A1. VERTICAL PIPELINE — a single column of titled node boxes + down arrows ─
define({
  id: 'arch_pipeline', intent: 'process', label: 'Architecture pipeline',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const s = [...header(ctx, ARCH_FILLS[0])];
    s.push(archHeader(d.flow_label || ctx.subtitle || 'Pipeline', 70, 110));
    const steps = (d.steps || d.items || d.stages || d.phases || []).slice(0, 5);
    const n = Math.max(steps.length, 1);
    const boxW = 420, x = (W - boxW) / 2, boxH = Math.min(58, (300 - 0) / n - 10), gap = 14;
    let y = 126;
    steps.forEach((st, i) => {
      const fill = ARCH_FILLS[i % ARCH_FILLS.length];
      s.push(...nodeBox(x, y, boxW, boxH, fill, itemText(st), (st && st.detail) || (st && st.text) || ''));
      s.push(badge(String(i + 1), x - 14, y + 6, { bg: fill }));
      if (i < steps.length - 1) s.push(dashTo([x + boxW / 2, y + boxH], [x + boxW / 2, y + boxH + gap], fill));
      y += boxH + gap;
    });
    return s;
  },
});

// ── A2. TWO LABELLED COLUMNS — node boxes joined by dashed cross-links ────────
define({
  id: 'arch_two_columns', intent: 'hierarchy', label: 'Architecture two columns',
  capacity: { columns: 2, items: 6 },
  fill(d, ctx) {
    const s = [...header(ctx, ARCH_FILLS[2])];
    // derive two lists + their column titles
    let leftTitle = 'Group A', rightTitle = 'Group B', left = [], right = [];
    const cols = (d.columns || []).filter(Boolean);
    if (cols.length >= 2) {
      leftTitle = itemText(cols[0]) || leftTitle; rightTitle = itemText(cols[1]) || rightTitle;
      left = (cols[0].items || []); right = (cols[1].items || []);
    } else {
      const list = (d.children || d.layers || d.nodes || d.items || d.points || d.tiers || []).slice(0, 8);
      const mid = Math.ceil(list.length / 2);
      left = list.slice(0, mid); right = list.slice(mid);
      leftTitle = d.left_title || ctx.subtitle || 'Concepts'; rightTitle = d.right_title || 'Details';
    }
    const colW = 300, lx = 60, rx = W - 60 - colW;
    s.push(archHeader(leftTitle, lx, 110));
    s.push(archHeader(rightTitle, rx, 110));
    const rows = Math.max(left.length, right.length, 1);
    const boxH = Math.min(64, (300) / rows - 14), gap = 14;
    const place = (list, x, y0) => list.slice(0, 4).map((it, i) => { const y = y0 + i * (boxH + gap); return { y, frags: nodeBox(x, y, colW, boxH, ARCH_FILLS[(i + (x > 400 ? 4 : 0)) % ARCH_FILLS.length], itemText(it), (it && (it.detail || it.text)) || '') }; });
    const L = place(left, lx, 128), R = place(right, rx, 128);
    L.forEach((b) => s.push(...b.frags));
    R.forEach((b) => s.push(...b.frags));
    // dashed cross links left[i] → right[i]
    const m = Math.min(L.length, R.length);
    for (let i = 0; i < m; i++) s.push(dashTo([lx + colW, L[i].y + boxH / 2], [rx, R[i].y + boxH / 2]));
    return s;
  },
});

// ── A3. FLOW WITH GATES — three labelled columns: input → process → output ───
define({
  id: 'arch_flow_gates', intent: 'cause', label: 'Architecture flow with gates',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const s = [...header(ctx, ARCH_FILLS[0])];
    const src = (d.links || d.events || d.causes || d.steps || d.items || []).slice(0, 3);
    const list = src.length ? src : [{ title: 'Input' }, { title: 'Process' }, { title: 'Output' }];
    const colW = 220, x1 = 40, x2 = 290, x3 = 540;
    s.push(archHeader(d.left_label || 'Inputs', x1, 110));
    s.push(archHeader(d.mid_label || 'Process', x2, 110));
    s.push(archHeader(d.right_label || 'Result', x3, 110));
    const n = Math.max(list.length, 1);
    const boxH = Math.min(70, 300 / n - 12), gap = 16;
    const y0 = 132;
    const col = (items, x, fillIdx, makeText) => items.slice(0, 3).map((it, i) => { const y = y0 + i * (boxH + gap); const frags = nodeBox(x, y, colW, boxH, ARCH_FILLS[(fillIdx + i) % ARCH_FILLS.length], makeText(it, i), (it && (it.detail || it.text)) || ''); return { y, frags }; });
    const c1 = col(list, x1, 0, (it) => itemText(it));
    const c2 = col(list, x2, 2, (it, i) => (i === 0 ? (d.process || 'Transform') : `Step ${i + 1}`));
    // gates column uses a red accent like the reference
    const gates = list.map((it, i) => ({ title: i === n - 1 ? 'Result' : `Check ${i + 1}` }));
    const c3 = gates.slice(0, 3).map((it, i) => { const y = y0 + i * (boxH + gap); const frags = nodeBox(x3, y, colW, boxH, '#b91c1c', it.title, ''); return { y, frags }; });
    [c1, c2, c3].forEach((c) => c.forEach((b) => s.push(...b.frags)));
    for (let i = 0; i < Math.min(c1.length, c2.length); i++) s.push(dashTo([x1 + colW, c1[i].y + boxH / 2], [x2, c2[i].y + boxH / 2]));
    for (let i = 0; i < Math.min(c2.length, c3.length); i++) s.push(dashTo([x2 + colW, c2[i].y + boxH / 2], [x3, c3[i].y + boxH / 2]));
    return s;
  },
});

// ── A4. HUB + NODE CARDS — a centre concept linked to titled node boxes ──────
define({
  id: 'arch_hub_nodes', intent: 'map', label: 'Architecture hub and nodes',
  capacity: { items: 4 },
  fill(d, ctx) {
    const s = [...header(ctx, ARCH_FILLS[5])];
    const cx = W / 2, cyTop = 120, hubW = 240, hubH = 60, hubX = cx - hubW / 2;
    s.push(...nodeBox(hubX, cyTop, hubW, hubH, ARCH_FILLS[5], anchor(d.center || d.headline || ctx.title, 6), ''));
    const items = (d.items || d.satellites || d.nodes || d.points || d.labels || []).slice(0, 4);
    const boxW = 330, boxH = 64, gap = 26;
    const x0 = (W - boxW * 2 - gap) / 2, y0 = 220;
    items.forEach((it, i) => {
      const c = i % 2, r = Math.floor(i / 2);
      const x = x0 + c * (boxW + gap), y = y0 + r * (boxH + 18);
      const fill = ARCH_FILLS[i % ARCH_FILLS.length];
      s.push(...nodeBox(x, y, boxW, boxH, fill, itemText(it), (it && (it.detail || it.text)) || ''));
      s.push(dashTo([cx, cyTop + hubH], [x + boxW / 2, y]));
    });
    return s;
  },
});

// =============================================================================
// PUBLIC API
// =============================================================================

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));
const BY_INTENT = new Map();
for (const t of TEMPLATES) {
  if (!BY_INTENT.has(t.intent)) BY_INTENT.set(t.intent, []);
  BY_INTENT.get(t.intent).push(t);
}

// ── Domain locking ───────────────────────────────────────────────────────────
// A handful of templates draw a figure that only makes sense in ONE subject
// (an economics supply/demand chart in a physics lesson is the canonical bug).
// These are "locked" to a domain; every other template is universal and may be
// used for any field. A lock only applies when we actually know the lesson's
// field AND that field maps to a different domain — otherwise the template stays
// eligible, so locking can never empty a pool.
const DOMAIN_LOCK = {
  supply_demand: 'economics', circular_flow: 'economics', market_shift: 'economics', ppf_curve: 'economics',
  code_walkthrough: 'programming',
  labeled_science_diagram: 'science', figure_with_facts: 'science',
  anatomy_callouts: 'science',
};

// Icon-and-arrow FLOW templates — the diagrammatic, teacher-at-a-whiteboard look.
// For general/unknown topics these lead their intent pool (see getTemplatesByIntent).
const FLOW_TEMPLATES = new Set([
  // clean architecture/system-diagram look (titled node boxes + dashed links)
  'arch_pipeline', 'arch_two_columns', 'arch_flow_gates', 'arch_hub_nodes',
  // icon-node flows
  'distributed_arrow_flow', 'hub_spoke_icons', 'icon_pipeline',
  'decision_flow', 'concept_panel_flow', 'branching_outcomes',
]);
// The clean reference-style architecture templates (lead within the flow group).
const ARCH_TEMPLATES = new Set(['arch_pipeline', 'arch_two_columns', 'arch_flow_gates', 'arch_hub_nodes']);

// Map a free-text lesson field to the set of locked domains it may use.
function domainsForField(field) {
  const f = String(field || '').trim().toLowerCase();
  if (!f || f === 'general') return null; // unknown → allow everything
  if (/econ|business|finance|market|trade|money|macro|micro/.test(f)) return new Set(['economics']);
  if (/program|coding|software|computer|\bcs\b|engineering|devops|web|data structure|algorithm/.test(f)) return new Set(['programming']);
  if (/bio|medic|anatom|chem|physic|science|geolog|astronom|ecolog|health|botan|zoolog|neuro/.test(f)) return new Set(['science']);
  return new Set(); // a known but unrelated field (history, math, language…) → no locked templates
}

// Is template `id` eligible for a lesson in `field`?
export function isTemplateAllowedForField(id, field) {
  const lock = DOMAIN_LOCK[id];
  if (!lock) return true;                 // universal template
  const allowed = domainsForField(field);
  if (allowed === null) return true;      // field unknown → don't restrict
  return allowed.has(lock);
}

export function getTemplate(id) {
  return BY_ID.get(id) || null;
}

export function getTemplatesByIntent(intent, field) {
  const pool = BY_INTENT.get(intent) || [];
  if (field === undefined) return pool;
  const filtered = pool.filter((t) => isTemplateAllowedForField(t.id, field));
  const base = filtered.length ? filtered : pool; // never empty a pool by filtering
  // Lead with the clean architecture / icon-and-arrow FLOW templates (connected
  // titled boxes + dashed links) for general topics AND for inherently
  // diagrammatic fields (software, engineering, business, systems) where that
  // look is the natural representation. Science/maths keep domain figures first
  // (a labelled cell or a graph teaches better there), but the flow templates
  // stay in the pool so the rotation still surfaces them.
  const f = String(field || '').trim().toLowerCase();
  const diagrammatic = !f || f === 'general'
    || /program|coding|software|computer|\bcs\b|engineering|devops|web|data|algorithm|network|system|tech|business|finance|econom|management|process|product/.test(f);
  if (diagrammatic) {
    const flow = base.filter((t) => FLOW_TEMPLATES.has(t.id));
    const rest = base.filter((t) => !FLOW_TEMPLATES.has(t.id));
    if (flow.length) {
      // clean architecture node-box templates first (the reference look), then
      // the icon-node flows, then everything else.
      const arch = flow.filter((t) => ARCH_TEMPLATES.has(t.id));
      const icons = flow.filter((t) => !ARCH_TEMPLATES.has(t.id));
      return [...arch, ...icons, ...rest];
    }
  }
  return base;
}

export function allTemplateIds() {
  return TEMPLATES.map((t) => t.id);
}

export function allTemplates() {
  return TEMPLATES.slice();
}

/**
 * Render a chosen template with slot data into raw scene fragments
 * (each fragment is { type, ...payload }, no time assigned yet).
 *
 * @param {string} templateId
 * @param {object} slotData  - data keyed to the template's fill() contract
 * @param {object} ctx       - { title, subtitle }
 * @returns {Array<object>}  raw scene fragments
 */
export function renderTemplate(templateId, slotData, ctx) {
  const t = BY_ID.get(templateId);
  if (!t) return [];
  try {
    const fragments = t.fill(slotData || {}, ctx || {}) || [];
    return fragments.filter(Boolean);
  } catch (err) {
    console.warn(`[templateLibrary] render failed for ${templateId}: ${err.message}`);
    return [];
  }
}

export const TEMPLATE_INTENTS = [...BY_INTENT.keys()];
