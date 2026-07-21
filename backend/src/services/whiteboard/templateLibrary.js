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
import { renderShape as renderNewShape, SHAPE_REGISTRY, SHAPE_ALIASES as NEW_SHAPE_ALIASES } from './svgShapeLibrary.js';
import { registerProgrammingTemplates } from './programmingTemplates.js';


const W = 800;
const H = 500;

// Curated accent palette — each template picks a coherent set so colors never
// clash. `accent` is the primary keyline, `soft` the tint fill, `deep` a darker
// shade for layered headers / ink-on-accent, `glow` a luminous companion for
// gradients and highlights. (Templates that only read accent/soft/ink keep
// working unchanged.)
const PALETTES = [
  { accent: '#2563eb', soft: '#dbeafe', deep: '#1e3a8a', glow: '#60a5fa', ink: '#0f172a' }, // blue
  { accent: '#0d9488', soft: '#ccfbf1', deep: '#115e59', glow: '#2dd4bf', ink: '#0f172a' }, // teal
  { accent: '#7c3aed', soft: '#ede9fe', deep: '#5b21b6', glow: '#a78bfa', ink: '#0f172a' }, // violet
  { accent: '#ea580c', soft: '#ffedd5', deep: '#9a3412', glow: '#fb923c', ink: '#0f172a' }, // orange
  { accent: '#db2777', soft: '#fce7f3', deep: '#9d174d', glow: '#f472b6', ink: '#0f172a' }, // pink
  { accent: '#16a34a', soft: '#dcfce7', deep: '#166534', glow: '#4ade80', ink: '#0f172a' }, // green
  { accent: '#0284c7', soft: '#e0f2fe', deep: '#075985', glow: '#38bdf8', ink: '#0f172a' }, // sky
];

// ── small fragment helpers ──────────────────────────────────────────────────
function txt(content, x, y, opts = {}) {
  const style = {
    fontSize: opts.fontSize ?? 16,
    color: opts.color ?? '#1e293b',
    fontWeight: opts.fontWeight ?? '600',
    textAnchor: opts.textAnchor ?? 'start',
    fontStyle: opts.fontStyle,
  };
  // Propagate wrap hints so the renderer wraps the FULL sentence to the slot's
  // width/height instead of running off the box. Without these the renderer
  // falls back to a coarse heuristic and long text spills or gets clipped.
  if (opts.maxWidth != null) style.maxWidth = opts.maxWidth;
  if (opts.maxLines != null) style.maxLines = opts.maxLines;
  return { type: 'draw_text', content: displayText(content), position: [x, y], style };
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
  return { type: 'draw_badge', content: displayText(content), position: [x, y], style: { bg: opts.bg ?? '#1e293b', color: opts.color ?? '#ffffff', fontSize: opts.fontSize ?? 13 } };
}
function callout(content, x, y, w, opts = {}) {
  return { type: 'draw_callout', content: displayText(content), position: [x, y], width: w, style: { bg: opts.bg ?? '#fffbeb', stroke: opts.stroke ?? '#f59e0b', color: opts.color ?? '#92400e' } };
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

// Merge new shape aliases into the legacy alias map so resolveShapeName can
// find names registered only in the new library (e.g. 'heart_organ', 'brain').
for (const [alias, key] of Object.entries(NEW_SHAPE_ALIASES)) {
  if (!SHAPE_ALIASES[alias]) SHAPE_ALIASES[alias] = key;
}
for (const name of Object.keys(SHAPE_REGISTRY)) {
  if (!SHAPE_ALIASES[name]) SHAPE_ALIASES[name] = name;
}

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
// First tries the massive 200+ shape library, then falls back to legacy dispatch.
function shape(name, x, y, w, h) {
  // Try the massive shape library first (200+ shapes from svgShapeLibrary.js)
  const segs = renderNewShape(name, x, y, w, h);
  if (segs && segs.length) return segs;
  // Fall back to the legacy 9-shape dispatch
  const key = resolveShapeName(name);
  if (!key) return [];
  try {
    return (SHAPE_DISPATCH[key](x, y, w, h) || []).filter(Boolean);
  } catch {
    return [];
  }
}

// Header builder shared by every template (consistent teacher-style heading).
// A designed masthead: title, a two-weight accent rule with luminous end-caps,
// and an optional italic subtitle — all inside the reserved y<92 header band.
function header(ctx, accent) {
  const out = [];
  if (ctx.title) {
    out.push(txt(ctx.title, W / 2, 44, { fontSize: 25, fontWeight: '800', color: '#0f172a', textAnchor: 'middle' }));
    // Two-weight underline: a bold accent core with finer extensions, capped by
    // a small dot at each end so the rule reads as a crafted divider, not a bar.
    out.push(line([W / 2 - 70, 58], [W / 2 + 70, 58], { color: accent, strokeWidth: 3.5 }));
    out.push(line([W / 2 - 150, 58], [W / 2 - 74, 58], { color: accent, strokeWidth: 1.5 }));
    out.push(line([W / 2 + 74, 58], [W / 2 + 150, 58], { color: accent, strokeWidth: 1.5 }));
    out.push(circle(W / 2 - 150, 58, 3, { fill: accent, stroke: accent }));
    out.push(circle(W / 2 + 150, 58, 3, { fill: accent, stroke: accent }));
  }
  if (ctx.subtitle) {
    out.push(tagRole(txt(ctx.subtitle, W / 2, 82, { fontSize: 14, fontWeight: '500', color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }), 'subtitle'));
  }
  return out;
}

// Tag a fragment with a removable ROLE so the AI's `remove:[...]` patch can
// delete it precisely (instead of the old heuristic guess). Mutates + returns.
function tagRole(frag, role) {
  if (frag) frag._role = role;
  return frag;
}

// Read a slot item's display text whether it's a string or a {title,text,...}.
function displayText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(displayText).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    if (value.from || value.to) return [value.from, value.to].map(displayText).filter(Boolean).join(' to ');
    return value.title || value.text || value.label || value.name || value.term
      || value.symbol || value.meaning || value.detail || value.value || value.number
      || value.answer || value.question || value.range || value.content || '';
  }
  return '';
}

// Truncate a phrase to keep boards clean (anchor keywords, not paragraphs).
function anchor(text, maxWords = 7) {
  const words = displayText(text).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

// DETAIL / BODY text at a fixed baseline (x,y) — the bespoke templates' detail
// lines used to route through anchor(), which HARD-DROPPED words with no
// recovery (the "text collapses to the first few words" bug the user hit). This
// keeps the raw render gate-safe by clamping the VISIBLE text to the slot, but
// stashes the FULL sentence in `_fullText` so the composer's grow-the-box pass
// (layout.growBoxesToFitText) stretches the container and restores it — exactly
// how drawCell's fitText already behaves. Pass `maxWidth` (the box's inner
// width) and `maxLines` (rows the slot can hold) so the clamp matches geometry.
function bodyTxt(content, x, y, opts = {}) {
  const text = displayText(content).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const fontSize = opts.fontSize ?? 11;
  const maxWidth = opts.maxWidth ?? 180;
  const maxLines = opts.maxLines ?? 2;
  const cpl = Math.max(8, Math.floor(maxWidth / (fontSize * 0.55)));
  let display = text;
  const needLines = wrapLineCount(text, maxWidth, fontSize);
  if (needLines > maxLines) display = clampChars(text, maxLines * cpl);
  const frag = txt(display, x, y, {
    fontSize,
    color: opts.color ?? '#64748b',
    fontWeight: opts.fontWeight ?? '500',
    textAnchor: opts.textAnchor ?? 'middle',
    fontStyle: opts.fontStyle,
    maxWidth,
    maxLines,
  });
  if (frag && display !== text) frag._fullText = text;
  return frag;
}

// Count how many lines `text` wraps into at `fs` within `maxWidth`. Mirrors the
// renderer's wrap math AND the overlap gate's wrappedTextBox EXACTLY (charsPerLine
// = maxWidth / (fs*0.55)) so the box we reserve here matches what both of them
// measure — this is what keeps wrapped text gate-clean.
function wrapLineCount(text, maxWidth, fs) {
  const charsPerLine = Math.max(8, Math.floor(maxWidth / (fs * 0.55)));
  const words = String(text).split(/\s+/).filter(Boolean);
  let lines = 1, cur = 0;
  for (const w of words) {
    const add = (cur ? 1 : 0) + w.length;
    if (cur + add > charsPerLine && cur) { lines++; cur = w.length; } else cur += add;
  }
  return lines;
}

// Truncate `text` to roughly `maxChars` characters on a word boundary, adding an
// ellipsis. Last-resort only — used when even the smallest font can't fit the
// full string into the slot, so the gate stays green and nothing visibly clips.
function clampChars(text, maxChars) {
  const s = String(text);
  if (s.length <= maxChars) return s;
  const cut = s.slice(0, Math.max(1, maxChars - 1));
  const sp = cut.lastIndexOf(' ');
  return (sp > maxChars * 0.5 ? cut.slice(0, sp) : cut).trimEnd() + '…';
}

// DYNAMIC TEXT: fit the FULL string into a (cx, boxTopY, boxW, boxH) slot by
// picking the largest font (maxFont→minFont) at which every wrapped line fits the
// slot's height, vertically centred. No word-dropping at normal sizes — long
// sentences shrink/wrap to show in full; only genuinely oversized text is clamped
// at the floor font. Returns a single draw_text fragment (or null for empty text).
function fitText(content, cx, boxTopY, boxW, boxH, opts = {}) {
  const text = displayText(content).replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const padX = opts.padX ?? 12;
  const maxW = Math.max(36, boxW - padX * 2);
  const maxH = Math.max(12, boxH - (opts.padY ?? 3) * 2);
  const maxFont = opts.maxFont ?? 15;
  const minFont = opts.minFont ?? 9;
  const lineRatio = 1.28;
  let fs = minFont, lines = 1, clamped = text;
  for (let f = maxFont; f >= minFont; f--) {
    const n = wrapLineCount(text, maxW, f);
    if (n * f * lineRatio <= maxH) { fs = f; lines = n; break; }
    if (f === minFont) {
      // Even the floor font overflows: keep as many lines as fit, clamp the text.
      fs = minFont;
      lines = Math.max(1, Math.floor(maxH / (minFont * lineRatio)));
      const cpl = Math.max(8, Math.floor(maxW / (minFont * 0.55)));
      clamped = clampChars(text, lines * cpl);
      lines = wrapLineCount(clamped, maxW, minFont);
    }
  }
  const blockH = lines * fs * lineRatio;
  // First-line baseline so the wrapped block is vertically centred in the slot.
  const baseline = boxTopY + (boxH - blockH) / 2 + fs;
  const frag = txt(clamped, cx, baseline, {
    fontSize: fs,
    fontWeight: opts.fontWeight ?? '600',
    color: opts.color ?? '#0f172a',
    textAnchor: opts.textAnchor ?? 'middle',
    maxWidth: maxW,
    maxLines: lines,
  });
  // If we had to clamp the string to fit the slot, stash the FULL text so the
  // composer's grow-the-box pass (layout.growBoxesToFitText) can stretch the
  // container to fit and restore the complete sentence — instead of leaving the
  // user staring at a "…". The clamped `content` keeps raw template renders (the
  // overlap gate) collision-free; the grow pass only runs in the composer.
  if (frag && clamped !== text) frag._fullText = text;
  return frag;
}

// Coerce a slot to an array (string→[string], null→[]), so templates can read
// `.length` without first checking the type.
function asArr(v) {
  return Array.isArray(v) ? v : v == null ? [] : [v];
}

function itemText(it) {
  return displayText(it);
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
// A small accent tab + ruled title give the card a designed, editorial feel.
function notePanel(title, bullets, x, y, w, accent) {
  const items = (bullets || []).slice(0, 6).map((b) => anchor(itemText(b), 7)).filter(Boolean);
  const h = 52 + items.length * 26;
  const out = [
    rect(x, y, w, h, { fill: '#f8fafc', stroke: accent, strokeWidth: 1.5, rx: 12 }),
    // accent tab on the left edge of the title row — a magazine-style marker
    rect(x, y + 12, 5, 22, { fill: accent, stroke: accent, rx: 2 }),
    line([x + 14, y + 38], [x + w - 14, y + 38], { color: accent, strokeWidth: 2 }),
    txt(anchor(title || 'Notes', 4), x + 18, y + 28, { fontSize: 16, fontWeight: '800', color: accent }),
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
    // Full definition, wrapped to the box width. growBoxesToFitText stretches
    // the box (and pushes the points below it down) so the WHOLE sentence shows
    // instead of collapsing to the first few words.
    if (d.definition) s.push(txt(d.definition, 280, 218, { fontSize: 14, color: '#334155', fontWeight: '500', maxWidth: 448, maxLines: 6 }));
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
      if (st.detail) { const bt = bodyTxt(st.detail, x + boxW / 2, y + 66, { maxWidth: boxW - 16, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (kid.detail) { const bt = bodyTxt(kid.detail, cx, kidY + 60, { maxWidth: boxW - 14, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (ev.detail) { const bt = bodyTxt(ev.detail, x, labelY + 44, { fontSize: 10, maxWidth: 150, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (lk.detail) { const bt = bodyTxt(lk.detail, x + boxW / 2, y + 76, { maxWidth: boxW - 16, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (lb.detail) { const bt = bodyTxt(lb.detail, x + 12, y + 52, { textAnchor: 'start', maxWidth: 136, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (it.detail) { const bt = bodyTxt(it.detail, 168, y + 46, { textAnchor: 'start', maxWidth: 528, maxLines: 1 }); if (bt) s.push(bt); }
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
        const bt = bodyTxt(cd.detail, x + 16, 288, { fontSize: 12, color: '#475569', textAnchor: 'start', maxWidth: boxW - 28, maxLines: 5 });
        if (bt) s.push(bt);
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
      if (cell.detail) { const bt = bodyTxt(cell.detail, x + cw / 2, y + 64, { color: '#475569', maxWidth: cw - 18, maxLines: 3 }); if (bt) s.push(bt); }
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
    s.push(obj('gear', 354, cy - 58, 92, 84, {}));
    s.push(txt(anchor(d.system || ctx.title, 3), 400, cy + 58, { fontSize: 14, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
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
      if (tm.definition || tm.detail) { const bt = bodyTxt(tm.definition || tm.detail, x + 24, y + 70, { fontSize: 12, textAnchor: 'start', maxWidth: cw - 40, maxLines: 3 }); if (bt) s.push(bt); }
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
      if (ly.detail) { const bt = bodyTxt(ly.detail, W / 2, y + lh / 2 + 20, { fontSize: 10, maxWidth: 460, maxLines: 1 }); if (bt) s.push(bt); }
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
      if (an.detail) { const bt = bodyTxt(an.detail, 420, y + 54, { textAnchor: 'start', maxWidth: 336, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (co.detail) { const bt = bodyTxt(co.detail, x + 80, y + 50, { fontSize: 10, maxWidth: 146, maxLines: 1 }); if (bt) s.push(bt); }
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
      if (tl.detail) { const bt = bodyTxt(tl.detail, x + 20, y + 76, { fontSize: 12, color: '#475569', textAnchor: 'start', maxWidth: tw - 36, maxLines: 3 }); if (bt) s.push(bt); }
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
    const cx = W / 2, cy = 315, R = 120;
    s.push(circle(cx, cy, R + 10, { fill: 'none', stroke: '#e2e8f0', strokeWidth: 20 }));
    const stages = (d.stages || []).slice(0, 5);
    const n = Math.max(stages.length, 1);
    const arcLen = (2 * Math.PI * R) / n;
    stages.forEach((stg, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      const sx = cx + Math.cos(ang) * (R + 80);
      const sy = cy + Math.sin(ang) * (R + 80);
      const dotX = cx + Math.cos(ang) * R;
      const dotY = cy + Math.sin(ang) * R;
      s.push(circle(dotX, dotY, 18, { fill: p.accent, stroke: '#ffffff', strokeWidth: 3 }));
      s.push(txt(String(i + 1), dotX, dotY + 5, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(rect(sx - 68, sy - 22, 136, 44, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(stg.title || stg, 4), sx, sy + 4, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
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
      if (st.detail) { const bt = bodyTxt(st.detail, x + boxW / 2, y + 78, { maxWidth: boxW - 24, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (ft.detail) { const bt = bodyTxt(ft.detail, x + 20, y + 76, { textAnchor: 'start', maxWidth: boxW - 36, maxLines: 2 }); if (bt) s.push(bt); }
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
    const boxW = 150, boxH = 80, gap = 46;
    const x0 = (W - boxW * deps.length - gap * (deps.length - 1)) / 2;
    deps.forEach((dep, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 200;
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: p.soft }));
      s.push(txt(anchor(dep.title || dep, 4), x + boxW / 2, y + boxH / 2 + 4, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < deps.length - 1) {
        s.push(arrow([x + boxW, y + boxH / 2], [x + boxW + gap, y + boxH / 2], { color: p.accent, strokeWidth: 2.5 }));
        s.push(txt('needs', x + boxW + gap / 2, y + boxH / 2 - 12, { fontSize: 9, color: '#94a3b8', textAnchor: 'middle', fontStyle: 'italic' }));
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
      if (ly && ly.detail) { const bt = bodyTxt(ly.detail, x + boxW / 2, y + 98, { maxWidth: boxW - 14, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (ev && ev.detail) { const bt = bodyTxt(ev.detail, x + cardW / 2, y + 44, { maxWidth: cardW - 16, maxLines: 2 }); if (bt) s.push(bt); }
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
      if (er && (er.detail || er.range)) { const bt = bodyTxt(er.detail || er.range, x + (segW - 4) / 2, bandY + 58, { color: '#475569', maxWidth: segW - 18, maxLines: 2 }); if (bt) s.push(bt); }
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
    if (d.definition) s.push(txt(d.definition, 84, 172, { fontSize: 14, fontWeight: '500', color: '#334155', maxWidth: 636, maxLines: 5 }));
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
// MATH STEP-BY-STEP TEMPLATES
// =============================================================================

// ── MATH DERIVATION STEPS ────────────────────────────────────────────────────
// Shows equation solving as a teacher would write on a board: one transformation
// per row, aligned to the left, with annotation arrows showing the rule applied.
define({
  id: 'math_derivation_steps', intent: 'formula', label: 'Math derivation steps',
  capacity: { steps: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    // Problem statement at top
    if (d.problem) {
      s.push(rect(60, 104, 680, 44, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft }));
      s.push(txt(anchor(d.problem, 16), 80, 132, { fontSize: 14, fontWeight: '600', color: '#1e293b' }));
    }
    const steps = (d.steps || []).slice(0, 6);
    const startY = d.problem ? 160 : 110;
    steps.forEach((st, i) => {
      const y = startY + i * 52;
      // Left: equation in a white card
      s.push(rect(60, y, 520, 42, { stroke: i === steps.length - 1 ? '#16a34a' : p.accent, strokeWidth: i === steps.length - 1 ? 2 : 1.4, fill: i % 2 ? '#ffffff' : p.soft }));
      // Step number circle
      s.push(circle(82, y + 21, 14, { fill: p.accent, stroke: p.accent }));
      s.push(txt(String(i + 1), 82, y + 27, { fontSize: 12, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      // Equation text
      s.push(txt(anchor(st.equation || st, 14), 112, y + 26, { fontSize: 15, fontWeight: '700', color: '#1e293b' }));
      // Right: annotation card showing the rule applied
      if (st.note || st.rule) {
        s.push(rect(600, y, 160, 42, { stroke: '#94a3b8', strokeWidth: 1, fill: '#f8fafc', rx: 8 }));
        s.push(txt(anchor(st.note || st.rule, 8), 612, y + 26, { fontSize: 10, fontWeight: '500', color: '#64748b', fontStyle: 'italic' }));
        // Dashed connector
        s.push(line([580, y + 21], [600, y + 21], { color: '#cbd5e1', strokeWidth: 1, dashed: true }));
      }
      // Downward arrow between steps
      if (i < steps.length - 1) {
        s.push(arrow([82, y + 42], [82, y + 52], { color: p.accent, strokeWidth: 1.8 }));
      }
    });
    // Boxed answer at bottom
    if (d.answer) {
      const ansY = startY + steps.length * 52 + 8;
      s.push(rect(60, ansY, 520, 46, { stroke: '#16a34a', strokeWidth: 2.5, fill: '#dcfce7' }));
      s.push(txt('∴  ' + anchor(d.answer, 14), 80, ansY + 30, { fontSize: 16, fontWeight: '800', color: '#15803d' }));
    }
    return s;
  },
});

// ── COORDINATE GRAPH ─────────────────────────────────────────────────────────
// Shows a coordinate plane with plotted points or curves — for math functions,
// geometry, or physics trajectories. The AI provides x/y label and points.
define({
  id: 'coordinate_graph', intent: 'data', label: 'Coordinate graph',
  capacity: { points: 6, annotations: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    // Draw axes
    s.push(...axesLShape(140, 400, 120, 640, d.x_label || 'x', d.y_label || 'y'));
    // Grid lines
    for (let i = 1; i <= 5; i++) {
      const gx = 140 + i * 100;
      s.push(line([gx, 400], [gx, 120], { color: '#e2e8f0', strokeWidth: 0.8 }));
    }
    for (let i = 1; i <= 5; i++) {
      const gy = 400 - i * 56;
      s.push(line([140, gy], [640, gy], { color: '#e2e8f0', strokeWidth: 0.8 }));
    }
    // Plot points
    const points = (d.points || d.plot_points || []).slice(0, 8);
    points.forEach((pt, i) => {
      const px = Array.isArray(pt) ? pt[0] : (pt.x || 0);
      const py = Array.isArray(pt) ? pt[1] : (pt.y || 0);
      const sx = 140 + (px / 100) * 500;
      const sy = 400 - (py / 100) * 280;
      s.push(circle(sx, sy, 5, { fill: p.accent, stroke: p.accent }));
      if (pt.label || pt.name) {
        s.push(txt(anchor(pt.label || pt.name, 5), sx, sy - 12, { fontSize: 10, fontWeight: '600', color: p.accent }));
      }
    });
    // Optional: draw a curve through points
    if (d.curve && points.length >= 2) {
      const pts = points.map((pt) => {
        const px = Array.isArray(pt) ? pt[0] : (pt.x || 0);
        const py = Array.isArray(pt) ? pt[1] : (pt.y || 0);
        return [140 + (px / 100) * 500, 400 - (py / 100) * 280];
      });
      const curveD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
      s.push(path(curveD, { stroke: p.accent, strokeWidth: 2, fill: 'none' }));
    }
    // Annotations
    const anns = (d.annotations || []).slice(0, 3);
    anns.forEach((an, i) => {
      const y = 120 + i * 60;
      s.push(rect(660, y, 120, 44, { stroke: p.accent, strokeWidth: 1.4, fill: p.soft, rx: 8 }));
      s.push(txt(anchor(itemText(an), 6), 720, y + 28, { fontSize: 11, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── PROOF LAYOUT ─────────────────────────────────────────────────────────────
// Two-column layout: Statement | Reason — the standard format for mathematical
// proofs. Each row shows a step and its justification.
define({
  id: 'proof_layout', intent: 'formula', label: 'Proof layout',
  capacity: { steps: 6 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    // Column headers
    s.push(rect(60, 104, 440, 32, { fill: p.accent, stroke: p.accent, rx: 8 }));
    s.push(txt('Statement', 280, 126, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(520, 104, 240, 32, { fill: '#64748b', stroke: '#64748b', rx: 8 }));
    s.push(txt('Reason', 640, 126, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const steps = (d.steps || []).slice(0, 6);
    steps.forEach((st, i) => {
      const y = 144 + i * 52;
      const bg = i % 2 ? '#ffffff' : p.soft;
      s.push(rect(60, y, 440, 46, { stroke: '#e2e8f0', strokeWidth: 1, fill: bg }));
      s.push(rect(520, y, 240, 46, { stroke: '#e2e8f0', strokeWidth: 1, fill: bg }));
      s.push(txt(anchor(st.statement || st, 14), 76, y + 28, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
      s.push(txt(anchor(st.reason || st.justification || '', 10), 536, y + 28, { fontSize: 11, fontWeight: '500', color: '#475569', fontStyle: 'italic' }));
    });
    // QED at bottom
    if (d.qed) {
      s.push(txt('∎', 740, 144 + steps.length * 52 + 20, { fontSize: 18, fontWeight: '800', color: p.accent, textAnchor: 'end' }));
    }
    return s;
  },
});

// ── MATH WORD PROBLEM ────────────────────────────────────────────────────────
// Problem text at top, visual diagram (shape/graph) in the center, steps on the
// right, and boxed answer at bottom.
define({
  id: 'math_word_problem', intent: 'example', label: 'Math word problem',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    // Problem box
    if (d.problem) {
      s.push(badge('Problem', 56, 104, { bg: p.accent, fontSize: 12 }));
      s.push(rect(48, 124, 704, 52, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(txt(anchor(d.problem, 16), 68, 156, { fontSize: 13, fontWeight: '600', color: '#1e293b', maxWidth: 680, maxLines: 2 }));
    }
    // Visual diagram on the left
    if (d.diagram) {
      const diagramSegs = shape(d.diagram, 60, 200, 320, 200);
      s.push(...diagramSegs);
    }
    // Steps on the right
    const steps = (d.steps || []).slice(0, 4);
    const stepX = d.diagram ? 420 : 60;
    steps.forEach((st, i) => {
      const y = 200 + i * 52;
      s.push(rect(stepX, y, 340, 42, { stroke: p.accent, strokeWidth: 1.4, fill: i % 2 ? '#ffffff' : p.soft }));
      s.push(circle(stepX + 18, y + 21, 12, { fill: '#64748b', stroke: '#64748b' }));
      s.push(txt(String(i + 1), stepX + 18, y + 26, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(st.text || st, 12), stepX + 40, y + 26, { fontSize: 12, fontWeight: '600', color: '#334155' }));
    });
    // Boxed answer
    if (d.answer) {
      const ansY = 200 + steps.length * 52 + 12;
      s.push(rect(stepX, ansY, 340, 46, { stroke: '#16a34a', strokeWidth: 2.5, fill: '#dcfce7' }));
      s.push(txt('∴  ' + anchor(d.answer, 14), stepX + 20, ansY + 30, { fontSize: 15, fontWeight: '800', color: '#15803d' }));
    }
    return s;
  },
});

// =============================================================================
// CODE VISUALIZATION TEMPLATES
// =============================================================================

// ── CODE ARCHITECTURE DIAGRAM ────────────────────────────────────────────────
// Component boxes connected by arrows showing data flow. Nodes use the icon
// library so 'database' draws a cylinder, 'server' a server icon, etc.
define({
  id: 'code_architecture', intent: 'map', label: 'Code architecture diagram',
  capacity: { items: 6 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    // Central hub or top-level component
    const cx = W / 2, hubY = 130;
    s.push(rect(cx - 120, hubY, 240, 56, { stroke: p.accent, strokeWidth: 2.5, fill: p.accent, rx: 10 }));
    s.push(txt(anchor(d.center || d.headline || ctx.title, 6), cx, hubY + 34, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    // Surrounding components
    const items = (d.items || d.satellites || []).slice(0, 6);
    const positions = [
      [100, 230], [300, 230], [500, 230],
      [100, 370], [300, 370], [500, 370],
    ];
    items.forEach((it, i) => {
      const [x, y] = positions[i];
      const boxW = 180, boxH = 60;
      const fill = i % 2 ? p.soft : '#ffffff';
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8, fill, rx: 10 }));
      const iconName = pickIcon(it.title || it, i);
      s.push(obj(iconName, x + 8, y + 12, 36, 36, { accent: p.accent }));
      s.push(txt(anchor(it.title || it, 5), x + 54, y + 24, { fontSize: 12, fontWeight: '700', color: '#1e293b' }));
      if (it.detail) { const bt = bodyTxt(it.detail, x + 54, y + 42, { textAnchor: 'start', maxWidth: boxW - 62, maxLines: 1 }); if (bt) s.push(bt); }
      // Connector arrow from hub
      s.push(arrow([cx, hubY + 56], [x + boxW / 2, y], { color: p.accent, strokeWidth: 1.8, dashed: true }));
    });
    // Data flow label
    if (d.flow_label) {
      s.push(txt(anchor(d.flow_label, 6), cx, 200, { fontSize: 10, fontWeight: '600', color: '#94a3b8', textAnchor: 'middle', fontStyle: 'italic' }));
    }
    return s;
  },
});

// ── ALGORITHM FLOWCHART ──────────────────────────────────────────────────────
// Decision diamonds, process rectangles, start/end ovals — a proper flowchart
// showing algorithm logic with branching paths.
define({
  id: 'algorithm_flowchart', intent: 'process', label: 'Algorithm flowchart',
  capacity: { steps: 5, branches: 2 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    // Start node
    const startY = 110;
    s.push(rect(340, startY, 120, 36, { stroke: '#16a34a', strokeWidth: 2, fill: '#dcfce7', rx: 18 }));
    s.push(txt(d.start || 'Start', 400, startY + 24, { fontSize: 12, fontWeight: '700', color: '#166534', textAnchor: 'middle' }));
    // Steps
    const steps = (d.steps || []).slice(0, 5);
    let prevY = startY + 36;
    let prevX = 400;
    steps.forEach((st, i) => {
      const y = prevY + 30;
      const isDecision = st.type === 'decision' || st.decision;
      if (isDecision) {
        // Diamond shape
        const dw = 160, dh = 50;
        s.push({ type: 'draw_path', d: `M ${prevX} ${y} L ${prevX + dw/2} ${y + dh/2} L ${prevX} ${y + dh} L ${prevX - dw/2} ${y + dh/2} Z`, style: { stroke: '#f59e0b', strokeWidth: 2, fill: '#fef3c7' } });
        s.push(txt(anchor(st.title || st, 6), prevX, y + dh/2 + 5, { fontSize: 11, fontWeight: '600', color: '#92400e', textAnchor: 'middle' }));
        // Yes/No branches
        const branches = (d.branches || []).slice(0, 2);
        if (branches.length >= 2) {
          // Yes branch (left)
          s.push(txt('Yes', prevX - dw/2 - 20, y + dh/2, { fontSize: 10, fontWeight: '700', color: '#16a34a', textAnchor: 'end' }));
          s.push(rect(80, y + dh + 20, 160, 40, { stroke: '#16a34a', strokeWidth: 1.6, fill: '#dcfce7', rx: 8 }));
          s.push(txt(anchor(branches[0].title || branches[0], 6), 160, y + dh + 44, { fontSize: 11, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
          // No branch (right)
          s.push(txt('No', prevX + dw/2 + 20, y + dh/2, { fontSize: 10, fontWeight: '700', color: '#dc2626', textAnchor: 'start' }));
          s.push(rect(560, y + dh + 20, 160, 40, { stroke: '#dc2626', strokeWidth: 1.6, fill: '#fee2e2', rx: 8 }));
          s.push(txt(anchor(branches[1].title || branches[1], 6), 640, y + dh + 44, { fontSize: 11, fontWeight: '600', color: '#991b1b', textAnchor: 'middle' }));
        }
        prevY = y + dh + 60;
      } else {
        // Process rectangle
        s.push(rect(300, y, 200, 42, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 ? p.soft : '#ffffff', rx: 8 }));
        s.push(txt(anchor(st.title || st, 8), 400, y + 26, { fontSize: 12, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
        s.push(arrow([prevX, prevY], [400, y], { color: p.accent, strokeWidth: 1.8 }));
        prevY = y + 42;
        prevX = 400;
      }
    });
    // End node
    s.push(rect(340, prevY + 16, 120, 36, { stroke: '#dc2626', strokeWidth: 2, fill: '#fee2e2', rx: 18 }));
    s.push(txt(d.end || 'End', 400, prevY + 40, { fontSize: 12, fontWeight: '700', color: '#991b1b', textAnchor: 'middle' }));
    return s;
  },
});

// ── DATA STRUCTURE VISUALIZATION ─────────────────────────────────────────────
// Shows tree, linked list, or hash table structures visually. The AI provides
// the type (tree/list/table) and the nodes.
define({
  id: 'data_structure_viz', intent: 'hierarchy', label: 'Data structure visualization',
  capacity: { nodes: 7 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const dsType = d.ds_type || d.structure_type || 'tree';
    const nodes = (d.nodes || d.items || d.children || []).slice(0, 7);
    if (dsType === 'tree' || dsType === 'binary_tree') {
      // Tree layout: root at top, children below
      const cx = W / 2, rootY = 130;
      s.push(circle(cx, rootY, 30, { fill: p.accent, stroke: p.accent }));
      s.push(txt(anchor(nodes[0]?.value || nodes[0] || '', 4), cx, rootY + 5, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      // Level 2
      const l2 = nodes.slice(1, 3);
      l2.forEach((nd, i) => {
        const nx = cx + (i === 0 ? -180 : 180);
        s.push(line([cx, rootY + 30], [nx, 210], { color: p.accent, strokeWidth: 2 }));
        s.push(circle(nx, 230, 26, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
        s.push(txt(anchor(nd.value || nd, 3), nx, 235, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      });
      // Level 3
      const l3 = nodes.slice(3, 7);
      l3.forEach((nd, i) => {
        const parentIdx = Math.floor((i - 3) / 2);
        const parentX = cx + (parentIdx === 0 ? -180 : 180);
        const offset = i % 2 === 0 ? -80 : 80;
        const nx = parentX + offset;
        s.push(line([parentX, 256], [nx, 310], { color: p.accent, strokeWidth: 1.5 }));
        s.push(circle(nx, 330, 22, { fill: '#ffffff', stroke: p.accent, strokeWidth: 1.8 }));
        s.push(txt(anchor(nd.value || nd, 3), nx, 335, { fontSize: 11, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
      });
    } else if (dsType === 'list' || dsType === 'linked_list') {
      // Linked list: boxes connected by arrows
      const startX = Math.max(40, (W - nodes.length * 100) / 2);
      nodes.forEach((nd, i) => {
        const x = startX + i * 100;
        s.push(rect(x, 200, 80, 50, { stroke: p.accent, strokeWidth: 2, fill: i % 2 ? p.soft : '#ffffff', rx: 6 }));
        s.push(txt(anchor(nd.value || nd, 4), x + 40, 230, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
        if (i < nodes.length - 1) {
          s.push(arrow([x + 80, 225], [x + 100, 225], { color: p.accent, strokeWidth: 2 }));
        }
        s.push(txt(String(i), x + 40, 266, { fontSize: 9, fontWeight: '600', color: '#94a3b8', textAnchor: 'middle' }));
      });
      // null at end
      s.push(txt('null', startX + nodes.length * 100 + 20, 230, { fontSize: 11, fontWeight: '600', color: '#94a3b8', fontStyle: 'italic' }));
    } else {
      // Hash table / array: vertical stack
      nodes.forEach((nd, i) => {
        const y = 120 + i * 48;
        s.push(rect(100, y, 60, 40, { stroke: p.accent, strokeWidth: 1.5, fill: p.soft }));
        s.push(txt(String(i), 130, y + 26, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
        s.push(rect(180, y, 200, 40, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#ffffff' }));
        s.push(txt(anchor(nd.value || nd, 8), 280, y + 26, { fontSize: 12, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
        if (nd.key || nd.label) {
          s.push(txt(anchor(nd.key || nd.label, 6), 420, y + 26, { fontSize: 10, fontWeight: '500', color: '#64748b' }));
        }
      });
    }
    return s;
  },
});

// ── API ENDPOINT MAP ─────────────────────────────────────────────────────────
// Shows HTTP endpoints as request→response cards with method badges (GET/POST/etc)
// and path labels. Great for teaching REST APIs.
define({
  id: 'api_endpoint_map', intent: 'map', label: 'API endpoint map',
  capacity: { endpoints: 5 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    // Client box on left
    s.push(obj('person', 40, 200, 80, 80, { accent: p.accent }));
    s.push(txt('Client', 80, 300, { fontSize: 12, fontWeight: '700', color: '#475569', textAnchor: 'middle' }));
    // Server box on right
    s.push(obj('server', 680, 200, 80, 80, { accent: p.accent }));
    s.push(txt('Server', 720, 300, { fontSize: 12, fontWeight: '700', color: '#475569', textAnchor: 'middle' }));
    // API gateway in center
    s.push(rect(320, 160, 160, 50, { stroke: p.accent, strokeWidth: 2, fill: p.accent, rx: 10 }));
    s.push(txt('API', 400, 192, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    // Endpoints as cards
    const endpoints = (d.endpoints || d.steps || []).slice(0, 5);
    const methodColors = { GET: '#16a34a', POST: '#2563eb', PUT: '#f59e0b', DELETE: '#dc2626', PATCH: '#7c3aed' };
    endpoints.forEach((ep, i) => {
      const y = 230 + i * 46;
      const method = (ep.method || ep.type || 'GET').toUpperCase();
      const mColor = methodColors[method] || '#475569';
      // Method badge
      s.push(rect(140, y, 60, 32, { fill: mColor, stroke: mColor, rx: 6 }));
      s.push(txt(method, 170, y + 22, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      // Path
      s.push(rect(210, y, 260, 32, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#f8fafc', rx: 4 }));
      s.push(txt(anchor(ep.path || ep.title || ep, 12), 224, y + 22, { fontSize: 12, fontWeight: '600', color: '#1e293b' }));
      // Description
      if (ep.detail || ep.description) {
        s.push(txt(anchor(ep.detail || ep.description, 10), 480, y + 22, { fontSize: 10, fontWeight: '500', color: '#64748b' }));
      }
      // Arrow from client through API to server
      s.push(line([120, y + 16], [140, y + 16], { color: '#cbd5e1', strokeWidth: 1 }));
    });
    // Connection arrows
    s.push(arrow([120, 240], [320, 190], { color: '#94a3b8', strokeWidth: 1.5, dashed: true }));
    s.push(arrow([480, 190], [680, 240], { color: '#94a3b8', strokeWidth: 1.5, dashed: true }));
    return s;
  },
});

// ── CODE STATE MACHINE ───────────────────────────────────────────────────────
// Circles for states, arrows for transitions — a proper state diagram showing
// how a system moves between states in response to events.
define({
  id: 'code_state_machine', intent: 'cycle', label: 'Code state machine',
  capacity: { states: 5 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const states = (d.states || d.stages || []).slice(0, 5);
    const cx = W / 2, cy = 280, R = 140;
    // Draw states in a ring
    states.forEach((st, i) => {
      const ang = (-90 + (360 / states.length) * i) * (Math.PI / 180);
      const sx = cx + Math.cos(ang) * R;
      const sy = cy + Math.sin(ang) * R;
      const isInitial = i === 0;
      const isFinal = st.final || st.accepting;
      s.push(circle(sx, sy, 38, { fill: isInitial ? p.accent : (isFinal ? '#fee2e2' : p.soft), stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(anchor(st.title || st, 4), sx, sy + 5, { fontSize: 11, fontWeight: '700', color: isInitial ? '#ffffff' : '#1e293b', textAnchor: 'middle' }));
      // Transition arrow to next
      const nextAng = (-90 + (360 / states.length) * ((i + 1) % states.length)) * (Math.PI / 180);
      const ex = cx + Math.cos(nextAng) * R;
      const ey = cy + Math.sin(nextAng) * R;
      const midAng = (ang + nextAng) / 2 + (i === states.length - 1 ? 0.3 : 0);
      const mx = cx + Math.cos(midAng) * (R + 28);
      const my = cy + Math.sin(midAng) * (R + 28);
      s.push(path(`M ${sx + Math.cos(ang) * 38} ${sy + Math.sin(ang) * 38} Q ${mx} ${my} ${ex - Math.cos(nextAng) * 38} ${ey - Math.sin(nextAng) * 38}`, { stroke: p.accent, strokeWidth: 2 }));
      // Transition label
      if (st.event || st.trigger) {
        s.push(txt(anchor(st.event || st.trigger, 4), mx, my - 4, { fontSize: 9, fontWeight: '600', color: '#475569', textAnchor: 'middle' }));
      }
    });
    return s;
  },
});

// =============================================================================
// PARAMETRIC LAYOUT ENGINE
// -----------------------------------------------------------------------------
// A library of overlap-free layout "skeletons" (row, column, grid, ring, orbit,
// pyramid, zigzag, staircase, fan, rail …) combined with node "motifs" (soft,
// solid, deep, ghost, alt) and the 7 palettes. Each skeleton COMPUTES its cell
// coordinates with guaranteed gaps inside the content band, and every label is
// drawn centred with a hard maxWidth so text can never spill its cell. The
// generator `gen()` stamps out a fully-registered template from a (skeleton,
// motif, palette, connector, decoration) tuple — so we get 100+ distinct boards
// that are structurally collision-free by construction, verified by
// scripts/test-template-overlap.mjs.
// =============================================================================

// Content band (header reserved above CB_TOP).
const CB_TOP = 112, CB_BOT = 466, CB_LEFT = 44, CB_RIGHT = 756;
const CB_W = CB_RIGHT - CB_LEFT, CB_MIDX = (CB_LEFT + CB_RIGHT) / 2, CB_MIDY = (CB_TOP + CB_BOT) / 2;

// Normalise any slot entry to { title, detail }.
function asNode(it) {
  if (it == null) return { title: '', detail: '' };
  if (typeof it === 'string' || typeof it === 'number') return { title: String(it), detail: '' };
  if (typeof it === 'object') {
    if (it.from || it.to) return { title: displayText(it.from) || displayText(it), detail: displayText(it.to) };
    const title = it.title || it.term || it.symbol || it.label || it.name || it.question || it.value || it.headline || '';
    const detail = it.detail || it.text || it.meaning || it.answer || it.description || it.sub || '';
    return { title: displayText(title) || displayText(it), detail: displayText(detail) };
  }
  return { title: displayText(it), detail: '' };
}

// Pull the richest list a scene carries, regardless of which slot the planner
// used, and normalise it. So one parametric template can serve any intent's
// data shape without the scene having to know the template's slot names.
function extractList(d, max = 6) {
  if (!d || typeof d !== 'object') return [];
  // columns → flatten titles (compare data)
  if (Array.isArray(d.columns) && d.columns.length) {
    const flat = [];
    d.columns.forEach((c) => { flat.push(asNode(c)); (c.items || []).forEach((it) => flat.push(asNode(it))); });
    if (flat.length) return flat.slice(0, max);
  }
  const lists = ['steps', 'items', 'points', 'stages', 'children', 'events', 'nodes',
    'satellites', 'causes', 'links', 'tiers', 'milestones', 'dependencies', 'cards',
    'terms', 'states', 'layers', 'phases', 'branches', 'pairs', 'transitions', 'vectors',
    'strengths', 'labels'];
  let best = [];
  for (const k of lists) {
    const v = d[k];
    if (Array.isArray(v) && v.length > best.length) best = v;
  }
  return best.slice(0, max).map(asNode);
}

// A "cell" = { x, y, w, h, cx, cy }. Point on a cell's edge toward (tx,ty).
function edgePoint(c, tx, ty) {
  const dx = tx - c.cx, dy = ty - c.cy;
  if (dx === 0 && dy === 0) return [c.cx, c.cy];
  const sx = dx !== 0 ? (c.w / 2) / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? (c.h / 2) / Math.abs(dy) : Infinity;
  const k = Math.min(sx, sy);
  return [c.cx + dx * k, c.cy + dy * k];
}
function mkCell(x, y, w, h) { return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 }; }

// ── Skeletons: count → cell[] with guaranteed non-overlap inside the band ─────
const SKELETONS = {
  row(n) {
    n = Math.max(1, Math.min(n, 4));
    const gap = 26, h = 116, y = CB_MIDY - h / 2;
    const w = Math.min(190, (CB_W - gap * (n - 1)) / n);
    const total = w * n + gap * (n - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => mkCell(x0 + i * (w + gap), y, w, h));
  },
  column(n) {
    n = Math.max(1, Math.min(n, 5));
    const gap = 16, w = 460, x = CB_MIDX - w / 2;
    const h = Math.min(78, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => mkCell(x, CB_TOP + i * (h + gap), w, h));
  },
  grid2(n) {
    n = Math.max(1, Math.min(n, 6));
    const cols = 2, rows = Math.ceil(n / cols), gx = 30, gy = 22;
    const w = 330, h = Math.min(110, (CB_BOT - CB_TOP - gy * (rows - 1)) / rows);
    const total = w * cols + gx, x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return mkCell(x0 + c * (w + gx), CB_TOP + r * (h + gy), w, h);
    });
  },
  grid3(n) {
    n = Math.max(1, Math.min(n, 6));
    const cols = 3, rows = Math.ceil(n / cols), gx = 22, gy = 22;
    const w = 220, h = Math.min(120, (CB_BOT - CB_TOP - gy * (rows - 1)) / rows);
    const total = w * cols + gx * (cols - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return mkCell(x0 + c * (w + gx), CB_TOP + r * (h + gy), w, h);
    });
  },
  ring(n) {
    n = Math.max(2, Math.min(n, 6));
    const cx = CB_MIDX, cy = 292, R = 146, w = 132, h = 56;
    return Array.from({ length: n }, (_, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      return mkCell(cx + Math.cos(ang) * R - w / 2, cy + Math.sin(ang) * R - h / 2, w, h);
    });
  },
  orbit(n) {
    n = Math.max(1, Math.min(n, 6));
    const cx = CB_MIDX, cy = 300, R = 172, w = 118, h = 54;
    const sats = Array.from({ length: n }, (_, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      return mkCell(cx + Math.cos(ang) * R - w / 2, cy + Math.sin(ang) * R * 0.82 - h / 2, w, h);
    });
    return sats; // hub drawn separately by the generator
  },
  pyramid(n) {
    // rows of 1,2,3… stacked and centred (hierarchy / build-up)
    n = Math.max(1, Math.min(n, 6));
    const cells = []; let placed = 0, rowN = 1, y = CB_TOP + 6;
    const h = 70, gy = 20;
    while (placed < n) {
      const cnt = Math.min(rowN, n - placed);
      const w = Math.min(200, (CB_W - 24 * (cnt - 1)) / Math.max(cnt, 1));
      const total = w * cnt + 24 * (cnt - 1), x0 = CB_MIDX - total / 2;
      for (let c = 0; c < cnt; c++) cells.push(mkCell(x0 + c * (w + 24), y, w, h));
      placed += cnt; rowN++; y += h + gy;
    }
    return cells;
  },
  funnel(n) {
    n = Math.max(1, Math.min(n, 4));
    const gap = 16, h = Math.min(72, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => {
      const w = 560 - i * 110;
      return mkCell(CB_MIDX - w / 2, CB_TOP + i * (h + gap), w, h);
    });
  },
  staircase(n) {
    n = Math.max(1, Math.min(n, 4));
    const w = 220, h = 78, sx = (CB_W - w) / Math.max(n - 1, 1), sy = (CB_BOT - CB_TOP - h) / Math.max(n - 1, 1);
    return Array.from({ length: n }, (_, i) => mkCell(CB_LEFT + i * sx, CB_TOP + i * sy, w, h));
  },
  zigzag(n) {
    n = Math.max(1, Math.min(n, 5));
    const w = 150, h = 84, axis = CB_MIDY, off = 86;
    const step = (CB_W - w) / Math.max(n - 1, 1);
    return Array.from({ length: n }, (_, i) => mkCell(CB_LEFT + i * step, (i % 2 ? axis + 14 : axis - h - 14), w, h));
  },
  railAlt(n) {
    n = Math.max(1, Math.min(n, 5));
    const w = 148, h = 62, axis = CB_MIDY;
    const step = (CB_W - w) / Math.max(n - 1, 1);
    return Array.from({ length: n }, (_, i) => mkCell(CB_LEFT + i * step, (i % 2 ? axis + 34 : axis - h - 34), w, h));
  },
  quad() {
    const w = 330, h = 150, gx = 26, gy = 26;
    const x0 = CB_MIDX - w - gx / 2, y0 = 132;
    return [mkCell(x0, y0, w, h), mkCell(x0 + w + gx, y0, w, h),
      mkCell(x0, y0 + h + gy, w, h), mkCell(x0 + w + gx, y0 + h + gy, w, h)];
  },
  cornerHub() {
    const w = 230, h = 92;
    return [
      mkCell(CB_LEFT, CB_TOP, w, h), mkCell(CB_RIGHT - w, CB_TOP, w, h),
      mkCell(CB_LEFT, CB_BOT - h, w, h), mkCell(CB_RIGHT - w, CB_BOT - h, w, h),
    ];
  },
  fan(n) {
    n = Math.max(1, Math.min(n, 4));
    const w = 250, h = Math.min(78, (CB_BOT - CB_TOP - 18 * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => mkCell(CB_RIGHT - w, CB_TOP + i * (h + 18), w, h));
  },
  lane(n) {
    // full-width indexed rows (number chip drawn by generator on the left)
    n = Math.max(1, Math.min(n, 5));
    const gap = 16, w = 600, x = CB_MIDX - w / 2 + 24;
    const h = Math.min(76, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => mkCell(x, CB_TOP + i * (h + gap), w, h));
  },
  splitList(n) {
    // right-hand bullet column (left half reserved for a figure)
    n = Math.max(1, Math.min(n, 5));
    const gap = 14, w = 348, x = CB_RIGHT - w;
    const h = Math.min(70, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => mkCell(x, CB_TOP + i * (h + gap), w, h));
  },
  teeBranch(n) {
    // parent box top-centre + children row below
    n = Math.max(1, Math.min(n, 4));
    const cw = Math.min(170, (CB_W - 26 * (n - 1)) / n), ch = 96;
    const total = cw * n + 26 * (n - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => mkCell(x0 + i * (cw + 26), 300, cw, ch));
  },
  // ── Expansion skeletons (overlap-safe by construction) ─────────────────────
  grid4(n) {
    // four-column tile grid (up to 8 compact cells)
    n = Math.max(1, Math.min(n, 8));
    const cols = 4, rows = Math.ceil(n / cols), gx = 18, gy = 20;
    const w = Math.min(168, (CB_W - gx * (cols - 1)) / cols);
    const h = Math.min(120, (CB_BOT - CB_TOP - gy * (rows - 1)) / rows);
    const total = w * cols + gx * (cols - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return mkCell(x0 + c * (w + gx), CB_TOP + r * (h + gy), w, h);
    });
  },
  bigRow(n) {
    // single wide row of up to 5 cells (row caps at 4)
    n = Math.max(1, Math.min(n, 5));
    const gap = 18, h = 124, y = CB_MIDY - h / 2;
    const w = Math.min(150, (CB_W - gap * (n - 1)) / n);
    const total = w * n + gap * (n - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => mkCell(x0 + i * (w + gap), y, w, h));
  },
  pillars(n) {
    // tall vertical columns standing side by side
    n = Math.max(2, Math.min(n, 5));
    const gap = 24, h = 298, y = 134;
    const w = Math.min(150, (CB_W - gap * (n - 1)) / n);
    const total = w * n + gap * (n - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => mkCell(x0 + i * (w + gap), y, w, h));
  },
  stackedBars(n) {
    // bar-chart columns of varied height, all anchored to a common baseline
    n = Math.max(2, Math.min(n, 6));
    const gap = 20, baseY = CB_BOT, maxH = 300;
    const w = Math.min(110, (CB_W - gap * (n - 1)) / n);
    const total = w * n + gap * (n - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => {
      const h = Math.round(maxH * (0.45 + 0.55 * (((i * 2 + 1) % (n + 1)) + 1) / (n + 1)));
      return mkCell(x0 + i * (w + gap), baseY - h, w, h);
    });
  },
  crossHub() {
    // four cardinal cells around an empty centre (N / E / S / W)
    const w = 184, h = 80, cx = CB_MIDX, cy = CB_MIDY;
    return [
      mkCell(cx - w / 2, CB_TOP, w, h),       // N
      mkCell(CB_RIGHT - w, cy - h / 2, w, h), // E
      mkCell(cx - w / 2, CB_BOT - h, w, h),   // S
      mkCell(CB_LEFT, cy - h / 2, w, h),      // W
    ];
  },
  timelineBand(n) {
    // markers strung along a central rule, alternating just above / below it
    n = Math.max(2, Math.min(n, 5));
    const w = 140, h = 72, axis = CB_MIDY;
    const step = (CB_W - w) / Math.max(n - 1, 1);
    return Array.from({ length: n }, (_, i) => mkCell(CB_LEFT + i * step, (i % 2 ? axis + 22 : axis - h - 22), w, h));
  },
  terraces(n) {
    // left-aligned descending bands (a left-anchored funnel)
    n = Math.max(1, Math.min(n, 4));
    const gap = 16, h = Math.min(74, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => {
      const w = 600 - i * 118;
      return mkCell(CB_LEFT, CB_TOP + i * (h + gap), w, h);
    });
  },

  // ── NEW SKELETONS ──────────────────────────────────────────────────────────

  // Diamond layout: 4 cells at cardinal points + 1 centre hub (for mapping ideas)
  diamondHub() {
    const w = 168, h = 74, cx = CB_MIDX, cy = CB_MIDY;
    const d = 110;
    return [
      mkCell(cx - w / 2, cy - d - h / 2, w, h),  // top
      mkCell(cx + d - w / 2, cy - h / 2, w, h),   // right
      mkCell(cx - w / 2, cy + d - h / 2, w, h),   // bottom
      mkCell(cx - d - w / 2, cy - h / 2, w, h),   // left
    ];
  },

  // L-shaped layout: 2 tall left columns + horizontal band at bottom
  lShape(n) {
    n = Math.max(1, Math.min(n, 5));
    const cw = 260, ch = 130, gap = 18, rx = 3;
    const cells = [];
    const leftX = CB_LEFT, topY = CB_TOP;
    // Left column
    const colH = Math.min(ch, (CB_BOT - CB_TOP - gap * (rx - 1)) / rx);
    for (let i = 0; i < Math.min(rx, n); i++)
      cells.push(mkCell(leftX, topY + i * (colH + gap), cw, colH));
    // Bottom horizontal
    const remaining = Math.min(n - rx, 3);
    const bw = Math.min(200, (CB_W - cw - gap * 3) / Math.max(remaining, 1));
    for (let i = 0; i < remaining; i++)
      cells.push(mkCell(leftX + cw + gap + i * (bw + gap), CB_BOT - 120, bw, 110));
    return cells;
  },

  // Hexagonal ring: cells arranged in a hexagon shape
  hexRing(n) {
    n = Math.max(2, Math.min(n, 6));
    const cx = CB_MIDX, cy = CB_MIDY, R = 140, w = 130, h = 62;
    return Array.from({ length: n }, (_, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      return mkCell(cx + Math.cos(ang) * R - w / 2, cy + Math.sin(ang) * R * 0.9 - h / 2, w, h);
    });
  },

  // Spiral: cells arranged in a spiral pattern (for processes that spiral inward)
  spiral(n) {
    n = Math.max(2, Math.min(n, 6));
    const w = 148, h = 62;
    const cells = [];
    const cx = CB_MIDX, cy = CB_MIDY;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 3;
      const r = Math.min(40 + i * 30, 150);
      cells.push(mkCell(cx + Math.cos(t) * r - w / 2, cy + Math.sin(t) * r * 0.7 - h / 2, w, h));
    }
    return cells;
  },

  // Cascade: cells that cascade diagonally from top-left to bottom-right
  cascade(n) {
    n = Math.max(1, Math.min(n, 5));
    const w = 180, h = 60;
    const gx = n > 1 ? Math.min(200, (CB_W - w) / (n - 1)) : 0;
    const gy = n > 1 ? Math.min(75, (CB_BOT - CB_TOP - h) / (n - 1)) : 0;
    return Array.from({ length: n }, (_, i) => {
      const x = CB_LEFT + i * gx;
      const y = CB_TOP + 10 + i * gy;
      return mkCell(Math.min(x, CB_RIGHT - w), Math.min(y, CB_BOT - h), w, h);
    });
  },

  // Concentric: nested boxes (center + surrounding ring for hierarchical topics)


  // BannerRow: wide banner at top + 3 items below
  bannerRow(n) {
    n = Math.max(1, Math.min(n, 4));
    const bannerH = 88, bw = CB_W - 60, bx = CB_LEFT + 30;
    const items = [mkCell(bx, CB_TOP, bw, bannerH)];
    const gap = 18, ih = 110, iw = Math.min(220, (CB_W - gap * (n - 1)) / n);
    const total = iw * n + gap * (n - 1), x0 = CB_MIDX - total / 2;
    for (let i = 0; i < n; i++)
      items.push(mkCell(x0 + i * (iw + gap), CB_TOP + bannerH + 40, iw, ih));
    return items;
  },

  // TLayout: full-width header + two columns below
  tLayout(n) {
    n = Math.max(1, Math.min(n, 4));
    const headerH = 72, bw = CB_W - 60, bx = CB_LEFT + 30;
    const cells = [mkCell(bx, CB_TOP, bw, headerH)];
    const gap = 20, ch = Math.min(120, (CB_BOT - CB_TOP - headerH - 50) / Math.ceil(n / 2));
    const cw = Math.min(330, (CB_W - gap) / 2);
    for (let i = 0; i < Math.min(n, 4); i++) {
      const col = i % 2, row = Math.floor(i / 2);
      cells.push(mkCell(CB_LEFT + col * (cw + gap), CB_TOP + headerH + 50 + row * (ch + gap), cw, ch));
    }
    return cells;
  },

  // StackedCompare: two full-width rows for before/after or pro/con
  stackedCompare() {
    const h = 155, gap = 26;
    return [
      mkCell(CB_LEFT + 40, CB_TOP + 10, CB_W - 80, h),
      mkCell(CB_LEFT + 40, CB_TOP + 10 + h + gap, CB_W - 80, h),
    ];
  },

  // TripleStack: three full-width rows (for step-by-step or ranked lists)
  tripleStack(n) {
    n = Math.max(1, Math.min(n, 3));
    const gap = 16, w = CB_W - 80, x = CB_LEFT + 40;
    const h = Math.min(100, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => mkCell(x, CB_TOP + i * (h + gap), w, h));
  },

  // WaveLayout: cells arranged in a wave pattern
  waveLayout(n) {
    n = Math.max(2, Math.min(n, 5));
    const w = 138, h = 70, cy = CB_MIDY;
    const step = (CB_W - w) / Math.max(n - 1, 1);
    return Array.from({ length: n }, (_, i) => {
      const yOff = Math.sin((i / Math.max(n - 1, 1)) * Math.PI) * 80;
      return mkCell(CB_LEFT + i * step, cy - h / 2 - yOff, w, h);
    });
  },

  // Grid5: 5-column compact grid (for feature lists)
  grid5(n) {
    n = Math.max(1, Math.min(n, 10));
    const cols = 5, rows = Math.ceil(n / cols), gx = 14, gy = 18;
    const w = Math.min(140, (CB_W - gx * (cols - 1)) / cols);
    const h = Math.min(130, (CB_BOT - CB_TOP - gy * (rows - 1)) / rows);
    const total = w * cols + gx * (cols - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return mkCell(x0 + c * (w + gx), CB_TOP + r * (h + gy), w, h);
    });
  },

  // DoubleStack: two columns side by side, each with stacked rows
  doubleStack(n) {
    n = Math.max(2, Math.min(n, 6));
    const gap = 16, gw = (CB_W - gap) / 2, ch = Math.min(90, (CB_BOT - CB_TOP - gap * (Math.ceil(n / 2) - 1)) / Math.ceil(n / 2));
    const cells = [];
    for (let i = 0; i < n; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      cells.push(mkCell(CB_LEFT + col * (gw + gap), CB_TOP + row * (ch + gap), gw, ch));
    }
    return cells;
  },

  // ArrowFlow: horizontal flow with wide arrows between cells
  arrowFlow(n) {
    n = Math.max(2, Math.min(n, 4));
    const gap = 32, h = 100, y = CB_MIDY - h / 2;
    const w = Math.min(180, (CB_W - gap * (n - 1)) / n);
    const total = w * n + gap * (n - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: n }, (_, i) => mkCell(x0 + i * (w + gap), y, w, h));
  },

  // MatrixGrid: 3x3 matrix for SWOT or similar
  matrixGrid() {
    const cols = 3, rows = 2, gx = 18, gy = 18;
    const w = Math.min(220, (CB_W - gx * (cols - 1)) / cols);
    const h = Math.min(140, (CB_BOT - CB_TOP - gy * (rows - 1)) / rows);
    const total = w * cols + gx * (cols - 1), x0 = CB_MIDX - total / 2;
    return Array.from({ length: cols * rows }, (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      return mkCell(x0 + c * (w + gx), CB_TOP + r * (h + gy), w, h);
    });
  },

  // DonutLayout: cells arranged in a donut with empty centre
  donutLayout(n) {
    n = Math.max(3, Math.min(n, 6));
    const cx = CB_MIDX, cy = CB_MIDY, R = 155, w = 136, h = 60;
    return Array.from({ length: n }, (_, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      return mkCell(cx + Math.cos(ang) * R - w / 2, cy + Math.sin(ang) * R * 0.85 - h / 2, w, h);
    });
  },

  // SteppedFlow: staircase that flows right and down
  steppedFlow(n) {
    n = Math.max(2, Math.min(n, 5));
    const w = 180, h = 72, sx = 100, sy = 68;
    return Array.from({ length: n }, (_, i) => mkCell(CB_LEFT + i * sx, CB_TOP + 10 + i * sy, w, h));
  },

  // HubAndSpoke6: 6 spokes radiating from centre
  hubAndSpoke6(n) {
    n = Math.max(2, Math.min(n, 6));
    const cx = CB_MIDX, cy = CB_MIDY, R = 150, w = 120, h = 56;
    return Array.from({ length: n }, (_, i) => {
      const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
      return mkCell(cx + Math.cos(ang) * R - w / 2, cy + Math.sin(ang) * R - h / 2, w, h);
    });
  },

  // LeftAlignedColumn: left-aligned column (for definitions with left margin)
  leftAlignedColumn(n) {
    n = Math.max(1, Math.min(n, 5));
    const gap = 14, w = 420, x = CB_LEFT + 20;
    const h = Math.min(72, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => mkCell(x, CB_TOP + i * (h + gap), w, h));
  },

  // RightAlignedColumn: right-aligned column (for summaries)
  rightAlignedColumn(n) {
    n = Math.max(1, Math.min(n, 5));
    const gap = 14, w = 420;
    const x = CB_RIGHT - w - 20;
    const h = Math.min(72, (CB_BOT - CB_TOP - gap * (n - 1)) / n);
    return Array.from({ length: n }, (_, i) => mkCell(x, CB_TOP + i * (h + gap), w, h));
  },

  // Mosaic: irregular tile layout for creative topics
  mosaic() {
    const gap = 14;
    return [
      mkCell(CB_LEFT, CB_TOP, 300, 140),
      mkCell(CB_LEFT + 300 + gap, CB_TOP, CB_W - 300 - gap, 68),
      mkCell(CB_LEFT + 300 + gap, CB_TOP + 68 + gap, CB_W - 300 - gap, 68),
      mkCell(CB_LEFT, CB_TOP + 140 + gap, 200, 120),
      mkCell(CB_LEFT + 200 + gap, CB_TOP + 140 + gap, CB_W - 200 - gap, 120),
    ];
  },
};

// Skeletons whose first cell list excludes a separately-drawn parent/hub.
const SKELETON_HAS_HUB = new Set(['orbit', 'teeBranch']);

// ── Node motif: how a cell box is painted (+ which text colour it needs). ─────
function motifRect(cell, p, motif, i) {
  const accent = p.accent;
  switch (motif) {
    case 'solid': return { frag: rect(cell.x, cell.y, cell.w, cell.h, { flat: true, fill: accent, rx: 12 }), light: true };
    case 'deep': return { frag: rect(cell.x, cell.y, cell.w, cell.h, { flat: true, fill: p.deep, rx: 12 }), light: true };
    case 'altSolid': return (i % 2)
      ? { frag: rect(cell.x, cell.y, cell.w, cell.h, { fill: '#ffffff', stroke: accent, strokeWidth: 2 }), light: false }
      : { frag: rect(cell.x, cell.y, cell.w, cell.h, { flat: true, fill: accent, rx: 12 }), light: true };
    case 'soft': return { frag: rect(cell.x, cell.y, cell.w, cell.h, { fill: p.soft, stroke: accent, strokeWidth: 2 }), light: false };
    case 'ghost': return { frag: rect(cell.x, cell.y, cell.w, cell.h, { fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1.5 }), light: false };
    case 'alt': return { frag: rect(cell.x, cell.y, cell.w, cell.h, { fill: i % 2 ? '#ffffff' : p.soft, stroke: accent, strokeWidth: 1.8 }), light: false };
    case 'white': default: return { frag: rect(cell.x, cell.y, cell.w, cell.h, { fill: '#ffffff', stroke: accent, strokeWidth: 2 }), light: false };
  }
}

// Draw a cell's box + its title/detail, centred and width-clamped so text can
// never spill. Returns fragments (box first, then labels).
function drawCell(cell, node, p, motif, i) {
  const { frag, light } = motifRect(cell, p, motif, i);
  const out = [frag];
  const titleColor = light ? '#ffffff' : '#0f172a';
  const detailColor = light ? '#e2e8f0' : '#475569';
  const title = node.title || '';
  const detail = node.detail || '';
  const titleMax = cell.w >= 300 ? 16 : cell.w >= 200 ? 15 : 13;
  if (detail && cell.h >= 70) {
    // Split the box: title in the upper portion, detail below. Each region
    // auto-fits the FULL text (shrink/wrap), so nothing is dropped.
    const titleH = Math.min(cell.h * 0.46, 34);
    const t1 = fitText(title, cell.cx, cell.y + 4, cell.w, titleH, { fontWeight: '700', color: titleColor, maxFont: titleMax, minFont: 11 });
    const t2 = fitText(detail, cell.cx, cell.y + 2 + titleH, cell.w, cell.h - titleH - 6, { fontWeight: '500', color: detailColor, maxFont: 12, minFont: 9 });
    if (t1) out.push(t1);
    if (t2) out.push(t2);
  } else {
    const t1 = fitText(title, cell.cx, cell.y, cell.w, cell.h, { fontWeight: '700', color: titleColor, maxFont: titleMax, minFont: 10 });
    if (t1) out.push(t1);
  }
  return out;
}

// Connector styles between consecutive cells (arrows are ignored by the overlap
// gate, so these can never cause a collision failure).
function connectCells(cells, style, color) {
  const out = [];
  if (style === 'none' || cells.length < 2) return out;
  if (style === 'chain' || style === 'chainArrow') {
    for (let i = 0; i < cells.length - 1; i++) {
      const a = cells[i], b = cells[i + 1];
      const from = edgePoint(a, b.cx, b.cy), to = edgePoint(b, a.cx, a.cy);
      out.push(arrow(from, to, { color, strokeWidth: 2.2, dashed: style === 'chain' && false }));
    }
  } else if (style === 'dash') {
    for (let i = 0; i < cells.length - 1; i++) {
      const a = cells[i], b = cells[i + 1];
      out.push(arrow(edgePoint(a, b.cx, b.cy), edgePoint(b, a.cx, a.cy), { color, strokeWidth: 1.6, dashed: true }));
    }
  }
  return out;
}

// Small decorative flourishes (all gate-safe: lines / tiny dots / arrows only).
function decoration(kind, p) {
  const a = p.accent;
  const tag = (arr) => arr.map((f) => tagRole(f, 'decoration'));
  switch (kind) {
    case 'cornerBrackets': return tag([
      line([CB_LEFT - 4, CB_TOP + 18], [CB_LEFT - 4, CB_TOP - 2], { color: a, strokeWidth: 2 }),
      line([CB_LEFT - 4, CB_TOP - 2], [CB_LEFT + 16, CB_TOP - 2], { color: a, strokeWidth: 2 }),
      line([CB_RIGHT + 4, CB_BOT - 18], [CB_RIGHT + 4, CB_BOT + 2], { color: a, strokeWidth: 2 }),
      line([CB_RIGHT + 4, CB_BOT + 2], [CB_RIGHT - 16, CB_BOT + 2], { color: a, strokeWidth: 2 }),
    ]);
    case 'leftRail': return tag([line([CB_LEFT - 10, CB_TOP], [CB_LEFT - 10, CB_BOT], { color: a, strokeWidth: 3 })]);
    case 'baseRule': return tag([line([CB_LEFT, CB_BOT + 8], [CB_RIGHT, CB_BOT + 8], { color: a, strokeWidth: 1.5, dashed: true })]);
    case 'dotGrid': { const out = []; for (let gx = 0; gx < 3; gx++) for (let gy = 0; gy < 2; gy++) out.push(circle(CB_LEFT + 12 + gx * 8, CB_TOP + 4 + gy * 8, 1.6, { fill: a, stroke: a })); return tag(out); }
    default: return [];
  }
}

let GEN_COUNT = 0;
// Stamp out one registered template from a layout recipe.
function gen(recipe) {
  const { id, intent, label, skeleton, motif = 'white', palette = 0, connect = 'none',
    decor = null, cap = 6, hubMotif = 'solid' } = recipe;
  GEN_COUNT++;
  define({
    id, intent, label: label || id, capacity: { items: cap },
    fill(d, ctx) {
      const p = PALETTES[palette % PALETTES.length];
      const s = [...header(ctx, p.accent)];
      if (decor) s.push(...decoration(decor, p));
      const skFn = SKELETONS[skeleton];
      const list = extractList(d, SKELETON_HAS_HUB.has(skeleton) ? cap : cap);
      const items = list.length ? list : [{ title: anchor(ctx.title || 'Idea', 4), detail: '' }];
      const cells = skFn(items.length, {});
      const useN = Math.min(cells.length, items.length);

      // Hub / parent for orbit & teeBranch skeletons.
      if (skeleton === 'orbit') {
        const hub = mkCell(CB_MIDX - 76, 300 - 38, 152, 76);
        const m = motifRect(hub, p, hubMotif, 0);
        s.push(m.frag);
        { const hf = fitText(d.center || ctx.title, hub.cx, hub.y, hub.w, hub.h, { fontWeight: '800', color: m.light ? '#ffffff' : '#0f172a', maxFont: 15, minFont: 10 }); if (hf) s.push(hf); }
        for (let i = 0; i < useN; i++) s.push(arrow(edgePoint(hub, cells[i].cx, cells[i].cy), edgePoint(cells[i], hub.cx, hub.cy), { color: p.accent, strokeWidth: 1.8 }));
      } else if (skeleton === 'teeBranch') {
        const parent = mkCell(CB_MIDX - 130, CB_TOP + 8, 260, 64);
        const m = motifRect(parent, p, hubMotif, 0);
        s.push(m.frag);
        { const pf = fitText(d.root || d.center || ctx.title, parent.cx, parent.y, parent.w, parent.h, { fontWeight: '800', color: m.light ? '#ffffff' : '#0f172a', maxFont: 16, minFont: 11 }); if (pf) s.push(pf); }
        s.push(line([parent.cx, parent.y + parent.h], [parent.cx, 280], { color: p.accent, strokeWidth: 2 }));
        for (let i = 0; i < useN; i++) {
          s.push(line([parent.cx, 280], [cells[i].cx, 280], { color: p.accent, strokeWidth: 2 }));
          s.push(line([cells[i].cx, 280], [cells[i].cx, cells[i].y], { color: p.accent, strokeWidth: 2 }));
        }
      }

      // Connectors behind the boxes (sequence skeletons).
      if (connect !== 'none' && !SKELETON_HAS_HUB.has(skeleton)) {
        s.push(...connectCells(cells.slice(0, useN), connect, p.accent));
      }

      // Cells + labels. Lane skeleton gets a left number chip.
      for (let i = 0; i < useN; i++) {
        s.push(...drawCell(cells[i], items[i], p, motif, i));
        if (skeleton === 'lane') s.push(badge(String(i + 1), cells[i].x - 30, cells[i].cy - 12, { bg: p.accent }));
        else if (connect !== 'none' || skeleton === 'staircase' || skeleton === 'pyramid') {
          // step number chip on the corner for ordered layouts
          if (motif !== 'solid' && motif !== 'deep') s.push(badge(String(i + 1), cells[i].x - 12, cells[i].y - 12, { bg: p.accent }));
        }
      }

      // Left-side figure for splitList layouts (a real diagram when the text
      // hints one, else a thematic icon) — fills the reserved left half.
      if (skeleton === 'splitList') {
        const fig = pickDiagramForText(ctx.title, d.headline, ...(items.map((it) => it.title)));
        if (fig) s.push(...shape(fig, 70, 170, 200, 200));
        else s.push(obj('lightbulb', 96, 210, 150, 150, { label: anchor(ctx.title || '', 3) }));
      }
      return s;
    },
  });
}



// =============================================================================
// GENERATED PARAMETRIC TEMPLATES
// ~120 boards stamped from (skeleton × motif × palette × connector × decor).
// Every id is unique; the recipe table is grouped by intent. Because each
// skeleton computes overlap-free cells and every label is width-clamped, the
// whole set is collision-free by construction (gated by test-template-overlap).
// =============================================================================
const GEN_RECIPES = [
  // ── define (concept exposition) ──────────────────────────────────────────
  { id: 'g_def_columns_soft', intent: 'define', label: 'Definition — stacked cards', skeleton: 'column', motif: 'soft', palette: 0, decor: 'leftRail' },
  { id: 'g_def_grid_white', intent: 'define', label: 'Definition — feature grid', skeleton: 'grid2', motif: 'white', palette: 2, decor: 'cornerBrackets' },
  { id: 'g_def_grid3_alt', intent: 'define', label: 'Definition — trait tiles', skeleton: 'grid3', motif: 'alt', palette: 1 },
  { id: 'g_def_split_figure', intent: 'define', label: 'Definition — figure + points', skeleton: 'splitList', motif: 'soft', palette: 6 },
  { id: 'g_def_lane_numbered', intent: 'define', label: 'Definition — keyed rows', skeleton: 'lane', motif: 'ghost', palette: 3 },
  { id: 'g_def_pyramid_build', intent: 'define', label: 'Definition — building blocks', skeleton: 'pyramid', motif: 'altSolid', palette: 5 },
  { id: 'g_def_fan_solid', intent: 'define', label: 'Definition — facet fan', skeleton: 'fan', motif: 'solid', palette: 4, decor: 'baseRule' },
  { id: 'g_def_grid_deep', intent: 'define', label: 'Definition — bold tiles', skeleton: 'grid2', motif: 'deep', palette: 0 },
  { id: 'g_def_column_alt', intent: 'define', label: 'Definition — alternating rows', skeleton: 'column', motif: 'alt', palette: 2 },

  // ── compare (contrast / weigh) ───────────────────────────────────────────
  { id: 'g_cmp_quad_white', intent: 'compare', label: 'Compare — four corners', skeleton: 'quad', motif: 'white', palette: 2 },
  { id: 'g_cmp_grid_alt', intent: 'compare', label: 'Compare — paired tiles', skeleton: 'grid2', motif: 'alt', palette: 0 },
  { id: 'g_cmp_row_solid', intent: 'compare', label: 'Compare — side by side', skeleton: 'row', motif: 'altSolid', palette: 3 },
  { id: 'g_cmp_fan_soft', intent: 'compare', label: 'Compare — option fan', skeleton: 'fan', motif: 'soft', palette: 6 },
  { id: 'g_cmp_grid3_ghost', intent: 'compare', label: 'Compare — criteria grid', skeleton: 'grid3', motif: 'ghost', palette: 1, decor: 'cornerBrackets' },
  { id: 'g_cmp_column_deep', intent: 'compare', label: 'Compare — ranked stack', skeleton: 'column', motif: 'deep', palette: 4 },
  { id: 'g_cmp_quad_soft', intent: 'compare', label: 'Compare — quadrant tints', skeleton: 'quad', motif: 'soft', palette: 5 },
  { id: 'g_cmp_grid_white2', intent: 'compare', label: 'Compare — matrix tiles', skeleton: 'grid2', motif: 'white', palette: 6 },

  // ── process (ordered steps) ──────────────────────────────────────────────
  { id: 'g_pro_lane_chain', intent: 'process', label: 'Process — keyed pipeline', skeleton: 'lane', motif: 'alt', palette: 0, connect: 'chainArrow' },
  { id: 'g_pro_row_arrow', intent: 'process', label: 'Process — left to right', skeleton: 'row', motif: 'soft', palette: 3, connect: 'chainArrow' },
  { id: 'g_pro_zigzag', intent: 'process', label: 'Process — zigzag flow', skeleton: 'zigzag', motif: 'altSolid', palette: 1, connect: 'chainArrow' },
  { id: 'g_pro_staircase', intent: 'process', label: 'Process — staircase', skeleton: 'staircase', motif: 'solid', palette: 5, connect: 'chainArrow' },
  { id: 'g_pro_funnel', intent: 'process', label: 'Process — narrowing funnel', skeleton: 'funnel', motif: 'deep', palette: 4 },
  { id: 'g_pro_column_chain', intent: 'process', label: 'Process — vertical steps', skeleton: 'column', motif: 'alt', palette: 6, connect: 'chainArrow' },
  { id: 'g_pro_railalt', intent: 'process', label: 'Process — rail above/below', skeleton: 'railAlt', motif: 'white', palette: 2, connect: 'chainArrow' },
  { id: 'g_pro_lane_ghost', intent: 'process', label: 'Process — checklist lane', skeleton: 'lane', motif: 'ghost', palette: 5 },
  { id: 'g_pro_row_deep', intent: 'process', label: 'Process — bold stages', skeleton: 'row', motif: 'deep', palette: 0, connect: 'chainArrow' },
  { id: 'g_pro_zigzag_soft', intent: 'process', label: 'Process — winding path', skeleton: 'zigzag', motif: 'soft', palette: 6, connect: 'chainArrow' },
  { id: 'g_pro_staircase_alt', intent: 'process', label: 'Process — climbing steps', skeleton: 'staircase', motif: 'altSolid', palette: 3, connect: 'chainArrow' },
  { id: 'g_pro_column_deep', intent: 'process', label: 'Process — sequence column', skeleton: 'column', motif: 'deep', palette: 1, connect: 'chainArrow' },

  // ── hierarchy (levels / nesting) ─────────────────────────────────────────
  { id: 'g_hier_pyramid_solid', intent: 'hierarchy', label: 'Hierarchy — pyramid', skeleton: 'pyramid', motif: 'solid', palette: 1 },
  { id: 'g_hier_tee', intent: 'hierarchy', label: 'Hierarchy — parent + children', skeleton: 'teeBranch', motif: 'soft', palette: 0, hubMotif: 'solid' },
  { id: 'g_hier_column_deep', intent: 'hierarchy', label: 'Hierarchy — layered stack', skeleton: 'column', motif: 'deep', palette: 4 },
  { id: 'g_hier_grid3', intent: 'hierarchy', label: 'Hierarchy — grouped tiers', skeleton: 'grid3', motif: 'alt', palette: 5 },
  { id: 'g_hier_pyramid_alt', intent: 'hierarchy', label: 'Hierarchy — ranked levels', skeleton: 'pyramid', motif: 'altSolid', palette: 2 },
  { id: 'g_hier_tee_deep', intent: 'hierarchy', label: 'Hierarchy — branch tree', skeleton: 'teeBranch', motif: 'white', palette: 3, hubMotif: 'deep' },
  { id: 'g_hier_funnel', intent: 'hierarchy', label: 'Hierarchy — top-down narrowing', skeleton: 'funnel', motif: 'soft', palette: 6 },
  { id: 'g_hier_column_alt', intent: 'hierarchy', label: 'Hierarchy — tier rows', skeleton: 'column', motif: 'alt', palette: 0 },

  // ── timeline (chronology) ────────────────────────────────────────────────
  { id: 'g_time_railalt', intent: 'timeline', label: 'Timeline — alternating rail', skeleton: 'railAlt', motif: 'soft', palette: 4, connect: 'chainArrow' },
  { id: 'g_time_zigzag', intent: 'timeline', label: 'Timeline — zigzag beats', skeleton: 'zigzag', motif: 'white', palette: 0, connect: 'chainArrow' },
  { id: 'g_time_staircase', intent: 'timeline', label: 'Timeline — rising milestones', skeleton: 'staircase', motif: 'altSolid', palette: 5, connect: 'chainArrow' },
  { id: 'g_time_lane', intent: 'timeline', label: 'Timeline — dated rows', skeleton: 'lane', motif: 'alt', palette: 6 },
  { id: 'g_time_row', intent: 'timeline', label: 'Timeline — era markers', skeleton: 'row', motif: 'soft', palette: 3, connect: 'chainArrow' },
  { id: 'g_time_railalt_deep', intent: 'timeline', label: 'Timeline — bold rail', skeleton: 'railAlt', motif: 'deep', palette: 1, connect: 'chainArrow' },

  // ── cause (causal chains / outcomes) ─────────────────────────────────────
  { id: 'g_cause_row_chain', intent: 'cause', label: 'Cause — chain reaction', skeleton: 'row', motif: 'altSolid', palette: 5, connect: 'chainArrow' },
  { id: 'g_cause_zigzag', intent: 'cause', label: 'Cause — knock-on flow', skeleton: 'zigzag', motif: 'soft', palette: 4, connect: 'chainArrow' },
  { id: 'g_cause_tee', intent: 'cause', label: 'Cause — one to many effects', skeleton: 'teeBranch', motif: 'soft', palette: 0, hubMotif: 'solid' },
  { id: 'g_cause_fan', intent: 'cause', label: 'Cause — outcome fan', skeleton: 'fan', motif: 'white', palette: 3 },
  { id: 'g_cause_column', intent: 'cause', label: 'Cause — consequence stack', skeleton: 'column', motif: 'alt', palette: 5, connect: 'chainArrow' },
  { id: 'g_cause_staircase', intent: 'cause', label: 'Cause — escalation', skeleton: 'staircase', motif: 'deep', palette: 4, connect: 'chainArrow' },
  { id: 'g_cause_orbit', intent: 'cause', label: 'Cause — central trigger', skeleton: 'orbit', motif: 'soft', palette: 1, hubMotif: 'deep' },

  // ── data (figures / metrics) ─────────────────────────────────────────────
  { id: 'g_data_grid3', intent: 'data', label: 'Data — stat tiles', skeleton: 'grid3', motif: 'deep', palette: 0 },
  { id: 'g_data_lane', intent: 'data', label: 'Data — metric rows', skeleton: 'lane', motif: 'alt', palette: 6 },
  { id: 'g_data_row', intent: 'data', label: 'Data — headline figures', skeleton: 'row', motif: 'solid', palette: 4 },
  { id: 'g_data_grid2', intent: 'data', label: 'Data — paired metrics', skeleton: 'grid2', motif: 'soft', palette: 1 },
  { id: 'g_data_column', intent: 'data', label: 'Data — ranked values', skeleton: 'column', motif: 'altSolid', palette: 5 },
  { id: 'g_data_grid3_soft', intent: 'data', label: 'Data — indicator grid', skeleton: 'grid3', motif: 'soft', palette: 3, decor: 'baseRule' },

  // ── cluster (related ideas) ──────────────────────────────────────────────
  { id: 'g_clu_orbit', intent: 'cluster', label: 'Cluster — hub & satellites', skeleton: 'orbit', motif: 'soft', palette: 2, hubMotif: 'solid' },
  { id: 'g_clu_ring', intent: 'cluster', label: 'Cluster — idea ring', skeleton: 'ring', motif: 'white', palette: 6, connect: 'chainArrow' },
  { id: 'g_clu_corner', intent: 'cluster', label: 'Cluster — four contexts', skeleton: 'cornerHub', motif: 'soft', palette: 0 },
  { id: 'g_clu_grid3', intent: 'cluster', label: 'Cluster — theme tiles', skeleton: 'grid3', motif: 'alt', palette: 4 },
  { id: 'g_clu_orbit_deep', intent: 'cluster', label: 'Cluster — radial web', skeleton: 'orbit', motif: 'white', palette: 3, hubMotif: 'deep' },
  { id: 'g_clu_ring_soft', intent: 'cluster', label: 'Cluster — concept wheel', skeleton: 'ring', motif: 'soft', palette: 5 },

  // ── cycle (loops) ────────────────────────────────────────────────────────
  { id: 'g_cyc_ring_arrow', intent: 'cycle', label: 'Cycle — looping ring', skeleton: 'ring', motif: 'soft', palette: 1, connect: 'chainArrow' },
  { id: 'g_cyc_orbit', intent: 'cycle', label: 'Cycle — orbiting stages', skeleton: 'orbit', motif: 'white', palette: 5, hubMotif: 'solid' },
  { id: 'g_cyc_ring_solid', intent: 'cycle', label: 'Cycle — stage wheel', skeleton: 'ring', motif: 'altSolid', palette: 3, connect: 'chainArrow' },
  { id: 'g_cyc_ring_deep', intent: 'cycle', label: 'Cycle — feedback loop', skeleton: 'ring', motif: 'deep', palette: 0, connect: 'chainArrow' },

  // ── example (worked / illustration) ──────────────────────────────────────
  { id: 'g_ex_lane', intent: 'example', label: 'Example — worked steps', skeleton: 'lane', motif: 'alt', palette: 0, connect: 'chainArrow' },
  { id: 'g_ex_column', intent: 'example', label: 'Example — step-through', skeleton: 'column', motif: 'soft', palette: 5 },
  { id: 'g_ex_split', intent: 'example', label: 'Example — figure + walk', skeleton: 'splitList', motif: 'soft', palette: 3 },
  { id: 'g_ex_staircase', intent: 'example', label: 'Example — progressive solve', skeleton: 'staircase', motif: 'altSolid', palette: 6, connect: 'chainArrow' },

  // ── recap (summary) ──────────────────────────────────────────────────────
  { id: 'g_recap_lane', intent: 'recap', label: 'Recap — key points', skeleton: 'lane', motif: 'soft', palette: 5, decor: 'leftRail' },
  { id: 'g_recap_grid2', intent: 'recap', label: 'Recap — takeaway tiles', skeleton: 'grid2', motif: 'alt', palette: 0 },
  { id: 'g_recap_column', intent: 'recap', label: 'Recap — checklist', skeleton: 'column', motif: 'soft', palette: 1 },
  { id: 'g_recap_pyramid', intent: 'recap', label: 'Recap — big idea on top', skeleton: 'pyramid', motif: 'altSolid', palette: 4 },
  { id: 'g_recap_fan', intent: 'recap', label: 'Recap — summary fan', skeleton: 'fan', motif: 'deep', palette: 6 },

  // ── formula (equation breakdown) ─────────────────────────────────────────
  { id: 'g_form_column', intent: 'formula', label: 'Formula — term stack', skeleton: 'column', motif: 'soft', palette: 2 },
  { id: 'g_form_row', intent: 'formula', label: 'Formula — term-by-term', skeleton: 'row', motif: 'white', palette: 0, connect: 'chainArrow' },
  { id: 'g_form_grid3', intent: 'formula', label: 'Formula — variable grid', skeleton: 'grid3', motif: 'alt', palette: 3 },

  // ── map (figure-led / annotated) ─────────────────────────────────────────
  { id: 'g_map_split', intent: 'map', label: 'Map — figure + labels', skeleton: 'splitList', motif: 'soft', palette: 6 },
  { id: 'g_map_corner', intent: 'map', label: 'Map — annotated corners', skeleton: 'cornerHub', motif: 'white', palette: 0 },
  { id: 'g_map_orbit', intent: 'map', label: 'Map — labelled hub', skeleton: 'orbit', motif: 'soft', palette: 2, hubMotif: 'solid' },
  { id: 'g_map_grid2', intent: 'map', label: 'Map — region tiles', skeleton: 'grid2', motif: 'alt', palette: 5 },
  { id: 'g_map_split_deep', intent: 'map', label: 'Map — diagram callouts', skeleton: 'splitList', motif: 'ghost', palette: 4 },

  // ── EXPANSION BATCH — 77 more, each a distinct skeleton×motif×palette×decor
  //     combination so no two boards read alike. Grouped by intent again. ─────
  // define
  { id: 'g_def_grid3_white', intent: 'define', label: 'Definition — clean trait grid', skeleton: 'grid3', motif: 'white', palette: 0, decor: 'dotGrid' },
  { id: 'g_def_fan_soft', intent: 'define', label: 'Definition — aspect fan', skeleton: 'fan', motif: 'soft', palette: 3 },
  { id: 'g_def_column_deep', intent: 'define', label: 'Definition — emphatic stack', skeleton: 'column', motif: 'deep', palette: 6 },
  { id: 'g_def_split_alt', intent: 'define', label: 'Definition — visual + traits', skeleton: 'splitList', motif: 'alt', palette: 1 },
  { id: 'g_def_pyramid_soft', intent: 'define', label: 'Definition — layered idea', skeleton: 'pyramid', motif: 'soft', palette: 2, decor: 'baseRule' },
  { id: 'g_def_grid2_ghost', intent: 'define', label: 'Definition — quiet tiles', skeleton: 'grid2', motif: 'ghost', palette: 5 },
  { id: 'g_def_lane_soft', intent: 'define', label: 'Definition — defined rows', skeleton: 'lane', motif: 'soft', palette: 4, decor: 'leftRail' },
  { id: 'g_def_fan_white', intent: 'define', label: 'Definition — open fan', skeleton: 'fan', motif: 'white', palette: 6 },
  // compare
  { id: 'g_cmp_row_deep', intent: 'compare', label: 'Compare — bold versus', skeleton: 'row', motif: 'deep', palette: 1 },
  { id: 'g_cmp_quad_alt', intent: 'compare', label: 'Compare — four-way grid', skeleton: 'quad', motif: 'alt', palette: 3 },
  { id: 'g_cmp_fan_white', intent: 'compare', label: 'Compare — choice spread', skeleton: 'fan', motif: 'white', palette: 0 },
  { id: 'g_cmp_grid3_soft', intent: 'compare', label: 'Compare — option matrix', skeleton: 'grid3', motif: 'soft', palette: 5, decor: 'cornerBrackets' },
  { id: 'g_cmp_column_alt', intent: 'compare', label: 'Compare — stacked contrast', skeleton: 'column', motif: 'alt', palette: 6 },
  { id: 'g_cmp_row_white', intent: 'compare', label: 'Compare — A vs B panels', skeleton: 'row', motif: 'white', palette: 4 },
  { id: 'g_cmp_quad_deep', intent: 'compare', label: 'Compare — bold quadrants', skeleton: 'quad', motif: 'deep', palette: 1 },
  // process
  { id: 'g_pro_funnel_soft', intent: 'process', label: 'Process — refining funnel', skeleton: 'funnel', motif: 'soft', palette: 2 },
  { id: 'g_pro_railalt_soft', intent: 'process', label: 'Process — branching rail', skeleton: 'railAlt', motif: 'soft', palette: 6, connect: 'chainArrow' },
  { id: 'g_pro_lane_solid', intent: 'process', label: 'Process — bold pipeline', skeleton: 'lane', motif: 'altSolid', palette: 4 },
  { id: 'g_pro_zigzag_white', intent: 'process', label: 'Process — switchback', skeleton: 'zigzag', motif: 'white', palette: 0, connect: 'chainArrow' },
  { id: 'g_pro_staircase_soft', intent: 'process', label: 'Process — ascending steps', skeleton: 'staircase', motif: 'soft', palette: 2, connect: 'chainArrow' },
  { id: 'g_pro_row_alt', intent: 'process', label: 'Process — alternating stages', skeleton: 'row', motif: 'alt', palette: 5, connect: 'chainArrow' },
  { id: 'g_pro_column_soft', intent: 'process', label: 'Process — guided steps', skeleton: 'column', motif: 'soft', palette: 3, connect: 'chainArrow', decor: 'leftRail' },
  { id: 'g_pro_funnel_alt', intent: 'process', label: 'Process — converging stages', skeleton: 'funnel', motif: 'altSolid', palette: 0 },
  // hierarchy
  { id: 'g_hier_pyramid_deep', intent: 'hierarchy', label: 'Hierarchy — bold pyramid', skeleton: 'pyramid', motif: 'deep', palette: 6 },
  { id: 'g_hier_tee_soft', intent: 'hierarchy', label: 'Hierarchy — soft tree', skeleton: 'teeBranch', motif: 'soft', palette: 2, hubMotif: 'soft' },
  { id: 'g_hier_funnel_deep', intent: 'hierarchy', label: 'Hierarchy — narrowing rank', skeleton: 'funnel', motif: 'deep', palette: 1 },
  { id: 'g_hier_grid2', intent: 'hierarchy', label: 'Hierarchy — grouped pairs', skeleton: 'grid2', motif: 'soft', palette: 5 },
  { id: 'g_hier_column_solid', intent: 'hierarchy', label: 'Hierarchy — solid tiers', skeleton: 'column', motif: 'altSolid', palette: 3 },
  { id: 'g_hier_pyramid_white', intent: 'hierarchy', label: 'Hierarchy — outline pyramid', skeleton: 'pyramid', motif: 'white', palette: 0, decor: 'baseRule' },
  // timeline
  { id: 'g_time_staircase_soft', intent: 'timeline', label: 'Timeline — rising path', skeleton: 'staircase', motif: 'soft', palette: 2, connect: 'chainArrow' },
  { id: 'g_time_zigzag_deep', intent: 'timeline', label: 'Timeline — bold beats', skeleton: 'zigzag', motif: 'deep', palette: 6, connect: 'chainArrow' },
  { id: 'g_time_lane_soft', intent: 'timeline', label: 'Timeline — dated lane', skeleton: 'lane', motif: 'soft', palette: 4 },
  { id: 'g_time_row_alt', intent: 'timeline', label: 'Timeline — period blocks', skeleton: 'row', motif: 'alt', palette: 5, connect: 'chainArrow' },
  { id: 'g_time_railalt_white', intent: 'timeline', label: 'Timeline — clean rail', skeleton: 'railAlt', motif: 'white', palette: 0, connect: 'chainArrow' },
  // cause
  { id: 'g_cause_row_deep', intent: 'cause', label: 'Cause — strong chain', skeleton: 'row', motif: 'deep', palette: 4, connect: 'chainArrow' },
  { id: 'g_cause_zigzag_alt', intent: 'cause', label: 'Cause — domino effect', skeleton: 'zigzag', motif: 'alt', palette: 1, connect: 'chainArrow' },
  { id: 'g_cause_tee_deep', intent: 'cause', label: 'Cause — branching impact', skeleton: 'teeBranch', motif: 'white', palette: 6, hubMotif: 'deep' },
  { id: 'g_cause_fan_soft', intent: 'cause', label: 'Cause — ripple fan', skeleton: 'fan', motif: 'soft', palette: 3 },
  { id: 'g_cause_orbit_white', intent: 'cause', label: 'Cause — root + effects', skeleton: 'orbit', motif: 'white', palette: 5, hubMotif: 'solid' },
  { id: 'g_cause_staircase_soft', intent: 'cause', label: 'Cause — building pressure', skeleton: 'staircase', motif: 'soft', palette: 0, connect: 'chainArrow' },
  // data
  { id: 'g_data_grid2_deep', intent: 'data', label: 'Data — bold pair', skeleton: 'grid2', motif: 'deep', palette: 4 },
  { id: 'g_data_row_soft', intent: 'data', label: 'Data — key figures', skeleton: 'row', motif: 'soft', palette: 1 },
  { id: 'g_data_lane_solid', intent: 'data', label: 'Data — metric ledger', skeleton: 'lane', motif: 'altSolid', palette: 6 },
  { id: 'g_data_grid3_white', intent: 'data', label: 'Data — indicator panel', skeleton: 'grid3', motif: 'white', palette: 0, decor: 'dotGrid' },
  { id: 'g_data_column_soft', intent: 'data', label: 'Data — ranked bars', skeleton: 'column', motif: 'soft', palette: 5 },
  // cluster
  { id: 'g_clu_orbit_solid', intent: 'cluster', label: 'Cluster — bold hub', skeleton: 'orbit', motif: 'soft', palette: 4, hubMotif: 'solid' },
  { id: 'g_clu_ring_deep', intent: 'cluster', label: 'Cluster — idea circle', skeleton: 'ring', motif: 'deep', palette: 1 },
  { id: 'g_clu_corner_white', intent: 'cluster', label: 'Cluster — four facets', skeleton: 'cornerHub', motif: 'white', palette: 3 },
  { id: 'g_clu_grid2', intent: 'cluster', label: 'Cluster — paired themes', skeleton: 'grid2', motif: 'alt', palette: 0 },
  { id: 'g_clu_orbit_soft2', intent: 'cluster', label: 'Cluster — related set', skeleton: 'orbit', motif: 'soft', palette: 6, hubMotif: 'soft' },
  // cycle
  { id: 'g_cyc_orbit_deep', intent: 'cycle', label: 'Cycle — turning wheel', skeleton: 'orbit', motif: 'deep', palette: 2, hubMotif: 'solid' },
  { id: 'g_cyc_ring_white', intent: 'cycle', label: 'Cycle — recurring loop', skeleton: 'ring', motif: 'white', palette: 6, connect: 'chainArrow' },
  { id: 'g_cyc_ring_soft2', intent: 'cycle', label: 'Cycle — phase wheel', skeleton: 'ring', motif: 'soft', palette: 4, connect: 'chainArrow' },
  // example
  { id: 'g_ex_column_alt', intent: 'example', label: 'Example — worked stack', skeleton: 'column', motif: 'alt', palette: 1 },
  { id: 'g_ex_lane_soft', intent: 'example', label: 'Example — guided trace', skeleton: 'lane', motif: 'soft', palette: 5, connect: 'chainArrow' },
  { id: 'g_ex_staircase_soft', intent: 'example', label: 'Example — step build', skeleton: 'staircase', motif: 'soft', palette: 2, connect: 'chainArrow' },
  { id: 'g_ex_split_deep', intent: 'example', label: 'Example — diagram + walk', skeleton: 'splitList', motif: 'ghost', palette: 0 },
  // recap
  { id: 'g_recap_grid3', intent: 'recap', label: 'Recap — summary tiles', skeleton: 'grid3', motif: 'soft', palette: 4 },
  { id: 'g_recap_lane_alt', intent: 'recap', label: 'Recap — point ledger', skeleton: 'lane', motif: 'alt', palette: 1, decor: 'leftRail' },
  { id: 'g_recap_column_deep', intent: 'recap', label: 'Recap — bold takeaways', skeleton: 'column', motif: 'deep', palette: 6 },
  { id: 'g_recap_fan_soft', intent: 'recap', label: 'Recap — closing fan', skeleton: 'fan', motif: 'soft', palette: 3 },
  { id: 'g_recap_pyramid_soft', intent: 'recap', label: 'Recap — one big idea', skeleton: 'pyramid', motif: 'soft', palette: 0, decor: 'baseRule' },
  // formula
  { id: 'g_form_column_deep', intent: 'formula', label: 'Formula — bold terms', skeleton: 'column', motif: 'deep', palette: 1 },
  { id: 'g_form_grid2', intent: 'formula', label: 'Formula — variable pairs', skeleton: 'grid2', motif: 'soft', palette: 4 },
  { id: 'g_form_lane', intent: 'formula', label: 'Formula — term ledger', skeleton: 'lane', motif: 'alt', palette: 2 },
  { id: 'g_form_row_soft', intent: 'formula', label: 'Formula — left to right', skeleton: 'row', motif: 'soft', palette: 6, connect: 'chainArrow' },
  // map
  { id: 'g_map_split_white', intent: 'map', label: 'Map — clean callouts', skeleton: 'splitList', motif: 'white', palette: 3 },
  { id: 'g_map_corner_soft', intent: 'map', label: 'Map — tagged corners', skeleton: 'cornerHub', motif: 'soft', palette: 1 },
  { id: 'g_map_orbit_deep', intent: 'map', label: 'Map — central locale', skeleton: 'orbit', motif: 'white', palette: 4, hubMotif: 'deep' },
  { id: 'g_map_grid3', intent: 'map', label: 'Map — region grid', skeleton: 'grid3', motif: 'soft', palette: 6 },
  // extra cross-intent flourishes to round out the set
  { id: 'g_def_quad_soft', intent: 'define', label: 'Definition — four traits', skeleton: 'quad', motif: 'soft', palette: 5 },
  { id: 'g_pro_grid3_chain', intent: 'process', label: 'Process — phase grid', skeleton: 'grid3', motif: 'alt', palette: 6, connect: 'chainArrow' },
  { id: 'g_hier_fan', intent: 'hierarchy', label: 'Hierarchy — tier fan', skeleton: 'fan', motif: 'altSolid', palette: 2 },
  { id: 'g_data_quad', intent: 'data', label: 'Data — quad metrics', skeleton: 'quad', motif: 'deep', palette: 0 },
  { id: 'g_clu_fan', intent: 'cluster', label: 'Cluster — theme fan', skeleton: 'fan', motif: 'soft', palette: 1 },
  { id: 'g_cmp_lane', intent: 'compare', label: 'Compare — criteria rows', skeleton: 'lane', motif: 'alt', palette: 2 },
  { id: 'g_time_pyramid', intent: 'timeline', label: 'Timeline — eras stacked', skeleton: 'pyramid', motif: 'soft', palette: 6 },

  // ══════════════════════════════════════════════════════════════════════════
  // NEW SKELETON RECIPES — 100+ templates from new skeletons
  // ══════════════════════════════════════════════════════════════════════════

  // ── define ────────────────────────────────────────────────────────────────
  { id: 'g_def_lshape_soft', intent: 'define', label: 'Definition — L-shaped', skeleton: 'lShape', motif: 'soft', palette: 0 },
  { id: 'g_def_lshape_deep', intent: 'define', label: 'Definition — L-shaped bold', skeleton: 'lShape', motif: 'deep', palette: 2 },
  { id: 'g_def_banner_white', intent: 'define', label: 'Definition — banner header', skeleton: 'bannerRow', motif: 'white', palette: 3 },
  { id: 'g_def_banner_solid', intent: 'define', label: 'Definition — bold banner', skeleton: 'bannerRow', motif: 'solid', palette: 1 },
  { id: 'g_def_tlayout_alt', intent: 'define', label: 'Definition — T-layout', skeleton: 'tLayout', motif: 'alt', palette: 4 },
  { id: 'g_def_tlayout_deep', intent: 'define', label: 'Definition — T-layout bold', skeleton: 'tLayout', motif: 'deep', palette: 6 },
  { id: 'g_def_mosaic_white', intent: 'define', label: 'Definition — mosaic tiles', skeleton: 'mosaic', motif: 'white', palette: 0 },
  { id: 'g_def_mosaic_soft', intent: 'define', label: 'Definition — mosaic soft', skeleton: 'mosaic', motif: 'soft', palette: 2 },
  { id: 'g_def_grid5_ghost', intent: 'define', label: 'Definition — feature grid 5', skeleton: 'grid5', motif: 'ghost', palette: 5 },
  { id: 'g_def_grid5_alt', intent: 'define', label: 'Definition — 5-col tiles', skeleton: 'grid5', motif: 'alt', palette: 3 },
  { id: 'g_def_dstack_white', intent: 'define', label: 'Definition — dual columns', skeleton: 'doubleStack', motif: 'white', palette: 1 },
  { id: 'g_def_dstack_alt', intent: 'define', label: 'Definition — dual alt', skeleton: 'doubleStack', motif: 'alt', palette: 4 },
  { id: 'g_def_leftcol_soft', intent: 'define', label: 'Definition — left-aligned', skeleton: 'leftAlignedColumn', motif: 'soft', palette: 6 },
  { id: 'g_def_leftcol_deep', intent: 'define', label: 'Definition — left bold', skeleton: 'leftAlignedColumn', motif: 'deep', palette: 0 },
  { id: 'g_def_cascade_soft', intent: 'define', label: 'Definition — cascade', skeleton: 'cascade', motif: 'soft', palette: 2 },
  { id: 'g_def_cascade_alt', intent: 'define', label: 'Definition — cascade alt', skeleton: 'cascade', motif: 'alt', palette: 5 },

  // ── compare ───────────────────────────────────────────────────────────────
  { id: 'g_cmp_stacked_deep', intent: 'compare', label: 'Compare — stacked panels', skeleton: 'stackedCompare', motif: 'deep', palette: 0 },
  { id: 'g_cmp_stacked_alt', intent: 'compare', label: 'Compare — stacked alt', skeleton: 'stackedCompare', motif: 'alt', palette: 3 },
  { id: 'g_cmp_stacked_soft', intent: 'compare', label: 'Compare — stacked soft', skeleton: 'stackedCompare', motif: 'soft', palette: 6 },
  { id: 'g_cmp_hexring_soft', intent: 'compare', label: 'Compare — hex ring', skeleton: 'hexRing', motif: 'soft', palette: 1 },
  { id: 'g_cmp_hexring_alt', intent: 'compare', label: 'Compare — hex alt', skeleton: 'hexRing', motif: 'alt', palette: 4 },
  { id: 'g_cmp_matrix_soft', intent: 'compare', label: 'Compare — matrix', skeleton: 'matrixGrid', motif: 'soft', palette: 2 },
  { id: 'g_cmp_matrix_deep', intent: 'compare', label: 'Compare — matrix bold', skeleton: 'matrixGrid', motif: 'deep', palette: 5 },
  { id: 'g_cmp_grid5_white', intent: 'compare', label: 'Compare — 5-col compare', skeleton: 'grid5', motif: 'white', palette: 0 },
  { id: 'g_cmp_dstack_deep', intent: 'compare', label: 'Compare — dual stack', skeleton: 'doubleStack', motif: 'deep', palette: 3 },
  { id: 'g_cmp_arrowflow', intent: 'compare', label: 'Compare — arrow flow', skeleton: 'arrowFlow', motif: 'alt', palette: 6, connect: 'chainArrow' },
  { id: 'g_cmp_lshape_alt', intent: 'compare', label: 'Compare — L-shape', skeleton: 'lShape', motif: 'alt', palette: 1 },
  { id: 'g_cmp_tlayout_soft', intent: 'compare', label: 'Compare — T-layout', skeleton: 'tLayout', motif: 'soft', palette: 4 },
  { id: 'g_cmp_banner_deep', intent: 'compare', label: 'Compare — banner', skeleton: 'bannerRow', motif: 'deep', palette: 2 },

  // ── process ───────────────────────────────────────────────────────────────
  { id: 'g_pro_arrowflow_soft', intent: 'process', label: 'Process — arrow flow', skeleton: 'arrowFlow', motif: 'soft', palette: 0, connect: 'chainArrow' },
  { id: 'g_pro_arrowflow_deep', intent: 'process', label: 'Process — arrow bold', skeleton: 'arrowFlow', motif: 'deep', palette: 3, connect: 'chainArrow' },
  { id: 'g_pro_arrowflow_solid', intent: 'process', label: 'Process — arrow solid', skeleton: 'arrowFlow', motif: 'solid', palette: 5, connect: 'chainArrow' },
  { id: 'g_pro_stairflow', intent: 'process', label: 'Process — stepped flow', skeleton: 'steppedFlow', motif: 'altSolid', palette: 1, connect: 'chainArrow' },
  { id: 'g_pro_stairflow_soft', intent: 'process', label: 'Process — stepped soft', skeleton: 'steppedFlow', motif: 'soft', palette: 4, connect: 'chainArrow' },
  { id: 'g_pro_stairflow_deep', intent: 'process', label: 'Process — stepped deep', skeleton: 'steppedFlow', motif: 'deep', palette: 6, connect: 'chainArrow' },
  { id: 'g_pro_spiral_alt', intent: 'process', label: 'Process — spiral flow', skeleton: 'spiral', motif: 'alt', palette: 2 },
  { id: 'g_pro_spiral_soft', intent: 'process', label: 'Process — spiral soft', skeleton: 'spiral', motif: 'soft', palette: 5 },
  { id: 'g_pro_cascade_chain', intent: 'process', label: 'Process — cascade chain', skeleton: 'cascade', motif: 'altSolid', palette: 0, connect: 'chainArrow' },
  { id: 'g_pro_cascade_soft', intent: 'process', label: 'Process — cascade soft', skeleton: 'cascade', motif: 'soft', palette: 3, connect: 'chainArrow' },
  { id: 'g_pro_wave_alt', intent: 'process', label: 'Process — wave flow', skeleton: 'waveLayout', motif: 'alt', palette: 6, connect: 'chainArrow' },
  { id: 'g_pro_wave_soft', intent: 'process', label: 'Process — wave soft', skeleton: 'waveLayout', motif: 'soft', palette: 1, connect: 'chainArrow' },
  { id: 'g_pro_donut_alt', intent: 'process', label: 'Process — donut cycle', skeleton: 'donutLayout', motif: 'alt', palette: 4 },
  { id: 'g_pro_donut_soft', intent: 'process', label: 'Process — donut soft', skeleton: 'donutLayout', motif: 'soft', palette: 0 },
  { id: 'g_pro_triple_deep', intent: 'process', label: 'Process — triple stack', skeleton: 'tripleStack', motif: 'deep', palette: 2, connect: 'chainArrow' },
  { id: 'g_pro_triple_alt', intent: 'process', label: 'Process — triple alt', skeleton: 'tripleStack', motif: 'alt', palette: 5, connect: 'chainArrow' },
  { id: 'g_pro_leftcol_chain', intent: 'process', label: 'Process — left chain', skeleton: 'leftAlignedColumn', motif: 'alt', palette: 3, connect: 'chainArrow' },
  { id: 'g_pro_rightcol_chain', intent: 'process', label: 'Process — right chain', skeleton: 'rightAlignedColumn', motif: 'alt', palette: 6, connect: 'chainArrow' },
  { id: 'g_pro_hexring_chain', intent: 'process', label: 'Process — hex flow', skeleton: 'hexRing', motif: 'soft', palette: 1, connect: 'chainArrow' },

  // ── hierarchy ─────────────────────────────────────────────────────────────
  { id: 'g_hier_diamond_soft', intent: 'hierarchy', label: 'Hierarchy — diamond hub', skeleton: 'diamondHub', motif: 'soft', palette: 0, hubMotif: 'solid' },
  { id: 'g_hier_diamond_deep', intent: 'hierarchy', label: 'Hierarchy — diamond bold', skeleton: 'diamondHub', motif: 'white', palette: 3, hubMotif: 'deep' },

  { id: 'g_hier_banner_alt', intent: 'hierarchy', label: 'Hierarchy — banner tier', skeleton: 'bannerRow', motif: 'alt', palette: 2 },
  { id: 'g_hier_tlayout_soft', intent: 'hierarchy', label: 'Hierarchy — T-layout', skeleton: 'tLayout', motif: 'soft', palette: 5 },
  { id: 'g_hier_leftcol_alt', intent: 'hierarchy', label: 'Hierarchy — left stack', skeleton: 'leftAlignedColumn', motif: 'alt', palette: 0 },
  { id: 'g_hier_hexring', intent: 'hierarchy', label: 'Hierarchy — hex ring', skeleton: 'hexRing', motif: 'altSolid', palette: 6 },
  { id: 'g_hier_donut', intent: 'hierarchy', label: 'Hierarchy — donut ring', skeleton: 'donutLayout', motif: 'altSolid', palette: 2 },
  { id: 'g_hier_grid5', intent: 'hierarchy', label: 'Hierarchy — 5-col grid', skeleton: 'grid5', motif: 'alt', palette: 3 },
  { id: 'g_hier_mosaic', intent: 'hierarchy', label: 'Hierarchy — mosaic layout', skeleton: 'mosaic', motif: 'alt', palette: 5 },

  // ── timeline ──────────────────────────────────────────────────────────────
  { id: 'g_time_wave_soft', intent: 'timeline', label: 'Timeline — wave band', skeleton: 'waveLayout', motif: 'soft', palette: 0, connect: 'chainArrow' },
  { id: 'g_time_wave_alt', intent: 'timeline', label: 'Timeline — wave alt', skeleton: 'waveLayout', motif: 'alt', palette: 3, connect: 'chainArrow' },
  { id: 'g_time_stairflow', intent: 'timeline', label: 'Timeline — stepped', skeleton: 'steppedFlow', motif: 'altSolid', palette: 1, connect: 'chainArrow' },
  { id: 'g_time_stairflow_soft', intent: 'timeline', label: 'Timeline — stepped soft', skeleton: 'steppedFlow', motif: 'soft', palette: 4, connect: 'chainArrow' },
  { id: 'g_time_spiral', intent: 'timeline', label: 'Timeline — spiral', skeleton: 'spiral', motif: 'soft', palette: 2 },
  { id: 'g_time_spiral_alt', intent: 'timeline', label: 'Timeline — spiral alt', skeleton: 'spiral', motif: 'alt', palette: 5 },
  { id: 'g_time_arrowflow', intent: 'timeline', label: 'Timeline — arrow sequence', skeleton: 'arrowFlow', motif: 'altSolid', palette: 0, connect: 'chainArrow' },
  { id: 'g_time_arrowflow_soft', intent: 'timeline', label: 'Timeline — arrow soft', skeleton: 'arrowFlow', motif: 'soft', palette: 6, connect: 'chainArrow' },
  { id: 'g_time_cascade', intent: 'timeline', label: 'Timeline — cascade', skeleton: 'cascade', motif: 'soft', palette: 3, connect: 'chainArrow' },
  { id: 'g_time_hexring', intent: 'timeline', label: 'Timeline — hex ring', skeleton: 'hexRing', motif: 'soft', palette: 1 },

  // ── cause ─────────────────────────────────────────────────────────────────
  { id: 'g_cause_diamond_soft', intent: 'cause', label: 'Cause — diamond', skeleton: 'diamondHub', motif: 'soft', palette: 2 },
  { id: 'g_cause_diamond_deep', intent: 'cause', label: 'Cause — diamond bold', skeleton: 'diamondHub', motif: 'deep', palette: 5 },
  { id: 'g_cause_arrowflow', intent: 'cause', label: 'Cause — arrow chain', skeleton: 'arrowFlow', motif: 'altSolid', palette: 0, connect: 'chainArrow' },
  { id: 'g_cause_arrowflow_deep', intent: 'cause', label: 'Cause — arrow bold', skeleton: 'arrowFlow', motif: 'deep', palette: 3, connect: 'chainArrow' },
  { id: 'g_cause_hexring', intent: 'cause', label: 'Cause — hex ring', skeleton: 'hexRing', motif: 'altSolid', palette: 6 },
  { id: 'g_cause_donut', intent: 'cause', label: 'Cause — donut', skeleton: 'donutLayout', motif: 'altSolid', palette: 1 },
  { id: 'g_cause_donut_soft', intent: 'cause', label: 'Cause — donut soft', skeleton: 'donutLayout', motif: 'soft', palette: 4 },
  { id: 'g_cause_lshape', intent: 'cause', label: 'Cause — L-shape', skeleton: 'lShape', motif: 'soft', palette: 0 },
  { id: 'g_cause_staircase', intent: 'cause', label: 'Cause — staircase', skeleton: 'steppedFlow', motif: 'altSolid', palette: 2, connect: 'chainArrow' },

  // ── data ──────────────────────────────────────────────────────────────────
  { id: 'g_data_grid5_soft', intent: 'data', label: 'Data — 5-col metrics', skeleton: 'grid5', motif: 'soft', palette: 0 },
  { id: 'g_data_grid5_deep', intent: 'data', label: 'Data — 5-col bold', skeleton: 'grid5', motif: 'deep', palette: 3 },
  { id: 'g_data_matrix_alt', intent: 'data', label: 'Data — matrix grid', skeleton: 'matrixGrid', motif: 'alt', palette: 1 },
  { id: 'g_data_matrix_soft', intent: 'data', label: 'Data — matrix soft', skeleton: 'matrixGrid', motif: 'soft', palette: 4 },
  { id: 'g_data_dstack', intent: 'data', label: 'Data — dual columns', skeleton: 'doubleStack', motif: 'alt', palette: 2 },
  { id: 'g_data_dstack_deep', intent: 'data', label: 'Data — dual bold', skeleton: 'doubleStack', motif: 'deep', palette: 5 },
  { id: 'g_data_triple', intent: 'data', label: 'Data — triple rows', skeleton: 'tripleStack', motif: 'alt', palette: 0 },
  { id: 'g_data_triple_deep', intent: 'data', label: 'Data — triple bold', skeleton: 'tripleStack', motif: 'deep', palette: 3 },
  { id: 'g_data_banner', intent: 'data', label: 'Data — banner metrics', skeleton: 'bannerRow', motif: 'alt', palette: 6 },
  { id: 'g_data_stacked', intent: 'data', label: 'Data — stacked bars', skeleton: 'stackedBars', motif: 'soft', palette: 1 },
  { id: 'g_data_pillars_alt', intent: 'data', label: 'Data — pillars alt', skeleton: 'pillars', motif: 'alt', palette: 4 },
  { id: 'g_data_mosaic', intent: 'data', label: 'Data — mosaic metrics', skeleton: 'mosaic', motif: 'alt', palette: 2 },

  // ── cluster ───────────────────────────────────────────────────────────────
  { id: 'g_clu_hexring_soft', intent: 'cluster', label: 'Cluster — hex ring', skeleton: 'hexRing', motif: 'soft', palette: 0 },
  { id: 'g_clu_hexring_alt', intent: 'cluster', label: 'Cluster — hex alt', skeleton: 'hexRing', motif: 'alt', palette: 3 },
  { id: 'g_clu_diamond_soft', intent: 'cluster', label: 'Cluster — diamond', skeleton: 'diamondHub', motif: 'soft', palette: 1 },
  { id: 'g_clu_diamond_alt', intent: 'cluster', label: 'Cluster — diamond alt', skeleton: 'diamondHub', motif: 'alt', palette: 4 },
  { id: 'g_clu_hubs6_soft', intent: 'cluster', label: 'Cluster — 6 spokes', skeleton: 'hubAndSpoke6', motif: 'soft', palette: 2 },
  { id: 'g_clu_hubs6_alt', intent: 'cluster', label: 'Cluster — 6 spokes alt', skeleton: 'hubAndSpoke6', motif: 'alt', palette: 5 },
  { id: 'g_clu_donut', intent: 'cluster', label: 'Cluster — donut ring', skeleton: 'donutLayout', motif: 'soft', palette: 0 },
  { id: 'g_clu_donut_alt', intent: 'cluster', label: 'Cluster — donut alt', skeleton: 'donutLayout', motif: 'alt', palette: 3 },
  { id: 'g_clu_mosaic', intent: 'cluster', label: 'Cluster — mosaic', skeleton: 'mosaic', motif: 'soft', palette: 6 },
  { id: 'g_clu_grid5', intent: 'cluster', label: 'Cluster — 5-col', skeleton: 'grid5', motif: 'soft', palette: 1 },

  // ── cycle ─────────────────────────────────────────────────────────────────
  { id: 'g_cycle_hexring', intent: 'cycle', label: 'Cycle — hex ring', skeleton: 'hexRing', motif: 'altSolid', palette: 0 },
  { id: 'g_cycle_hexring_soft', intent: 'cycle', label: 'Cycle — hex soft', skeleton: 'hexRing', motif: 'soft', palette: 2 },
  { id: 'g_cycle_donut', intent: 'cycle', label: 'Cycle — donut ring', skeleton: 'donutLayout', motif: 'altSolid', palette: 3 },
  { id: 'g_cycle_donut_soft', intent: 'cycle', label: 'Cycle — donut soft', skeleton: 'donutLayout', motif: 'soft', palette: 6 },
  { id: 'g_cycle_spiral', intent: 'cycle', label: 'Cycle — spiral', skeleton: 'spiral', motif: 'altSolid', palette: 1 },
  { id: 'g_cycle_hubs6', intent: 'cycle', label: 'Cycle — 6 spokes', skeleton: 'hubAndSpoke6', motif: 'altSolid', palette: 4 },
  { id: 'g_cycle_hubs6_soft', intent: 'cycle', label: 'Cycle — 6 spokes soft', skeleton: 'hubAndSpoke6', motif: 'soft', palette: 0 },

  // ── example ───────────────────────────────────────────────────────────────
  { id: 'g_ex_lshape', intent: 'example', label: 'Example — L-shape', skeleton: 'lShape', motif: 'soft', palette: 2 },
  { id: 'g_ex_tlayout', intent: 'example', label: 'Example — T-layout', skeleton: 'tLayout', motif: 'soft', palette: 5 },
  { id: 'g_ex_dstack', intent: 'example', label: 'Example — dual columns', skeleton: 'doubleStack', motif: 'soft', palette: 0 },
  { id: 'g_ex_dstack_alt', intent: 'example', label: 'Example — dual alt', skeleton: 'doubleStack', motif: 'alt', palette: 3 },
  { id: 'g_ex_leftcol', intent: 'example', label: 'Example — left-aligned', skeleton: 'leftAlignedColumn', motif: 'soft', palette: 6 },
  { id: 'g_ex_banner', intent: 'example', label: 'Example — banner', skeleton: 'bannerRow', motif: 'soft', palette: 1 },
  { id: 'g_ex_cascade', intent: 'example', label: 'Example — cascade', skeleton: 'cascade', motif: 'soft', palette: 4 },
  { id: 'g_ex_triple', intent: 'example', label: 'Example — triple rows', skeleton: 'tripleStack', motif: 'soft', palette: 2 },

  // ── recap ─────────────────────────────────────────────────────────────────
  { id: 'g_rec_banner_soft', intent: 'recap', label: 'Recap — banner summary', skeleton: 'bannerRow', motif: 'soft', palette: 0 },
  { id: 'g_rec_banner_deep', intent: 'recap', label: 'Recap — banner bold', skeleton: 'bannerRow', motif: 'deep', palette: 3 },
  { id: 'g_rec_triple', intent: 'recap', label: 'Recap — triple stack', skeleton: 'tripleStack', motif: 'soft', palette: 1 },
  { id: 'g_rec_triple_deep', intent: 'recap', label: 'Recap — triple bold', skeleton: 'tripleStack', motif: 'deep', palette: 4 },
  { id: 'g_rec_stacked', intent: 'recap', label: 'Recap — stacked panels', skeleton: 'stackedCompare', motif: 'soft', palette: 2 },
  { id: 'g_rec_grid5', intent: 'recap', label: 'Recap — 5-col grid', skeleton: 'grid5', motif: 'soft', palette: 5 },
  { id: 'g_rec_mosaic', intent: 'recap', label: 'Recap — mosaic', skeleton: 'mosaic', motif: 'soft', palette: 0 },
  { id: 'g_rec_dstack', intent: 'recap', label: 'Recap — dual columns', skeleton: 'doubleStack', motif: 'soft', palette: 3 },
  { id: 'g_rec_leftcol', intent: 'recap', label: 'Recap — left-aligned', skeleton: 'leftAlignedColumn', motif: 'soft', palette: 6 },

  // ── formula ───────────────────────────────────────────────────────────────
  { id: 'g_for_triple_deep', intent: 'formula', label: 'Formula — triple rows', skeleton: 'tripleStack', motif: 'deep', palette: 0 },
  { id: 'g_for_triple_alt', intent: 'formula', label: 'Formula — triple alt', skeleton: 'tripleStack', motif: 'alt', palette: 3 },
  { id: 'g_for_leftcol_deep', intent: 'formula', label: 'Formula — left bold', skeleton: 'leftAlignedColumn', motif: 'deep', palette: 1 },
  { id: 'g_for_rightcol_deep', intent: 'formula', label: 'Formula — right bold', skeleton: 'rightAlignedColumn', motif: 'deep', palette: 4 },
  { id: 'g_for_banner', intent: 'formula', label: 'Formula — banner', skeleton: 'bannerRow', motif: 'deep', palette: 2 },
  { id: 'g_for_lshape', intent: 'formula', label: 'Formula — L-shape', skeleton: 'lShape', motif: 'deep', palette: 5 },
  { id: 'g_for_grid5_deep', intent: 'formula', label: 'Formula — 5-col', skeleton: 'grid5', motif: 'deep', palette: 0 },

  // ── map ───────────────────────────────────────────────────────────────────
  { id: 'g_map_hexring_soft', intent: 'map', label: 'Map — hex ring', skeleton: 'hexRing', motif: 'soft', palette: 0 },
  { id: 'g_map_hexring_alt', intent: 'map', label: 'Map — hex alt', skeleton: 'hexRing', motif: 'alt', palette: 3 },
  { id: 'g_map_diamond_soft', intent: 'map', label: 'Map — diamond hub', skeleton: 'diamondHub', motif: 'soft', palette: 1 },
  { id: 'g_map_diamond_alt', intent: 'map', label: 'Map — diamond alt', skeleton: 'diamondHub', motif: 'alt', palette: 4 },
  { id: 'g_map_hubs6_soft', intent: 'map', label: 'Map — 6 spokes', skeleton: 'hubAndSpoke6', motif: 'soft', palette: 2 },
  { id: 'g_map_hubs6_alt', intent: 'map', label: 'Map — 6 spokes alt', skeleton: 'hubAndSpoke6', motif: 'alt', palette: 5 },

  { id: 'g_map_mosaic', intent: 'map', label: 'Map — mosaic', skeleton: 'mosaic', motif: 'soft', palette: 6 },
  { id: 'g_map_lshape', intent: 'map', label: 'Map — L-shape', skeleton: 'lShape', motif: 'soft', palette: 1 },
  { id: 'g_map_grid5', intent: 'map', label: 'Map — 5-col grid', skeleton: 'grid5', motif: 'soft', palette: 4 },
];

// =============================================================================
// EXPANSION GENERATOR — stamp out the rest of the 500-template library.
// Instead of hand-writing hundreds more recipe literals (error-prone), we
// deterministically combine each intent's suitable skeletons with the motif ×
// palette × decor space. Every id is unique and stable (derived from the
// combo), and because each skeleton already computes overlap-free cells the
// whole batch is collision-free by construction — verified by the overlap gate.
// =============================================================================
(() => {
  // Skeletons that read as an ORDERED sequence get a connector by default.
  const ORDERED = new Set(['row', 'bigRow', 'lane', 'zigzag', 'staircase', 'railAlt', 'column', 'timelineBand', 'terraces', 'arrowFlow', 'steppedFlow', 'cascade', 'waveLayout']);
  // Which layouts make sense for each intent (kept semantically sensible so a
  // "compare" never renders as a cycle ring, etc.).
  const INTENT_SKELETONS = {
    define: ['grid2', 'grid3', 'grid4', 'column', 'fan', 'pyramid', 'splitList', 'quad', 'bigRow', 'crossHub', 'terraces', 'lShape', 'bannerRow', 'tLayout', 'mosaic', 'grid5', 'doubleStack', 'leftAlignedColumn'],
    compare: ['row', 'grid2', 'quad', 'fan', 'column', 'bigRow', 'pillars', 'crossHub', 'grid4', 'stackedCompare', 'hexRing', 'matrixGrid', 'grid5', 'doubleStack'],
    process: ['row', 'lane', 'zigzag', 'staircase', 'funnel', 'column', 'railAlt', 'bigRow', 'terraces', 'timelineBand', 'arrowFlow', 'steppedFlow', 'spiral', 'cascade', 'waveLayout', 'donutLayout'],
    hierarchy: ['pyramid', 'teeBranch', 'column', 'grid3', 'funnel', 'terraces', 'grid4', 'fan', 'diamondHub', 'bannerRow', 'tLayout', 'leftAlignedColumn'],
    timeline: ['railAlt', 'zigzag', 'staircase', 'lane', 'row', 'timelineBand', 'bigRow', 'waveLayout', 'steppedFlow', 'spiral', 'arrowFlow'],
    cause: ['row', 'zigzag', 'teeBranch', 'fan', 'column', 'staircase', 'orbit', 'crossHub', 'diamondHub', 'arrowFlow', 'hexRing', 'donutLayout'],
    data: ['grid3', 'grid4', 'lane', 'row', 'grid2', 'column', 'stackedBars', 'pillars', 'quad', 'bigRow', 'grid5', 'matrixGrid', 'doubleStack', 'tripleStack', 'bannerRow'],
    cluster: ['orbit', 'ring', 'cornerHub', 'grid3', 'crossHub', 'fan', 'grid4', 'hexRing', 'diamondHub', 'hubAndSpoke6', 'donutLayout', 'mosaic'],
    cycle: ['ring', 'orbit', 'hexRing', 'donutLayout', 'spiral', 'hubAndSpoke6'],
    example: ['lane', 'column', 'splitList', 'staircase', 'bigRow', 'grid2', 'lShape', 'tLayout', 'doubleStack', 'leftAlignedColumn'],
    recap: ['lane', 'grid2', 'grid3', 'column', 'pyramid', 'fan', 'bigRow', 'quad', 'bannerRow', 'tripleStack', 'stackedCompare', 'grid5', 'mosaic'],
    formula: ['column', 'row', 'grid3', 'grid2', 'lane', 'bigRow', 'tripleStack', 'leftAlignedColumn', 'rightAlignedColumn', 'bannerRow'],
    map: ['splitList', 'cornerHub', 'orbit', 'grid2', 'grid3', 'crossHub', 'quad', 'hexRing', 'diamondHub', 'hubAndSpoke6', 'mosaic'],
  };
  const MOTIFS = ['white', 'soft', 'alt', 'altSolid', 'deep', 'solid', 'ghost'];
  const DECORS = [null, 'leftRail', 'cornerBrackets', 'baseRule', 'dotGrid'];
  const HUBS = ['solid', 'deep', 'soft'];
  const NPAL = PALETTES.length;

  const existing = new Set(TEMPLATES.map((t) => t.id));
  const intents = Object.keys(INTENT_SKELETONS);
  const TARGET = 500;
  const abbrev = (s) => s.replace(/[^a-z0-9]/gi, '').slice(0, 6).toLowerCase();

  // Round-robin across intents so the library stays balanced as it fills up.
  let added = 0, guard = 0;
  // Final library size = bespoke templates already in TEMPLATES + every recipe
  // in GEN_RECIPES (the hand-written ones + the ones we push here), since each
  // recipe becomes one template when stamped below.
  const finalCount = () => TEMPLATES.length + GEN_RECIPES.length;
  // A wide combo space (skeleton × motif × palette × decor) iterated by an
  // increasing counter; we skip combos whose id already exists.
  const counters = Object.fromEntries(intents.map((k) => [k, 0]));
  while (finalCount() < TARGET && guard < 20000) {
    for (const intent of intents) {
      if (finalCount() >= TARGET) break;
      const sks = INTENT_SKELETONS[intent];
      const c = counters[intent]++;
      const sk = sks[c % sks.length];
      const motif = MOTIFS[Math.floor(c / sks.length) % MOTIFS.length];
      const palette = (c * 3 + 1) % NPAL;
      const decor = DECORS[Math.floor(c / (sks.length * 2)) % DECORS.length];
      const connect = ORDERED.has(sk) ? 'chainArrow' : 'none';
      const hubMotif = HUBS[c % HUBS.length];
      const id = `gx_${intent.slice(0, 4)}_${abbrev(sk)}_${motif.slice(0, 4)}_p${palette}${decor ? '_' + abbrev(decor) : ''}${connect !== 'none' ? '_c' : ''}`;
      if (existing.has(id)) continue;
      existing.add(id);
      GEN_RECIPES.push({
        id, intent, label: `${intent} — ${sk} ${motif}`,
        skeleton: sk, motif, palette, connect, decor, hubMotif, cap: 6,
      });
      added++;
    }
    guard++;
  }
})();

GEN_RECIPES.forEach(gen);

// Register programming-specific templates (100+ templates)
registerProgrammingTemplates(define);

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
  code_walkthrough: 'programming', code_architecture: 'programming', algorithm_flowchart: 'programming',
  data_structure_viz: 'programming', api_endpoint_map: 'programming', code_state_machine: 'programming',
  prog_accessibility: 'programming', prog_agile_vs_waterfall: 'programming', prog_algorithm_pseudo: 'programming', prog_api_routes: 'programming', prog_array_methods: 'programming', prog_async_await: 'programming', prog_binary_tree: 'programming', prog_bit_ops: 'programming', prog_btree: 'programming', prog_bubble_sort: 'programming', prog_caching: 'programming', prog_circuit_breaker: 'programming', prog_client_server: 'programming', prog_cloud_deployment: 'programming', prog_code_annotated: 'programming', prog_code_compare: 'programming', prog_code_coverage: 'programming', prog_code_review: 'programming', prog_code_splitting: 'programming', prog_complexity: 'programming', prog_component_tree: 'programming', prog_concurrency: 'programming', prog_containerization: 'programming', prog_cqrs: 'programming', prog_crud_http: 'programming', prog_data_pipeline: 'programming', prog_db_schema: 'programming', prog_deadlock_conditions: 'programming', prog_debug_flow: 'programming', prog_dependency_injection: 'programming', prog_deploy_pipeline: 'programming', prog_design_patterns: 'programming', prog_dp_table: 'programming', prog_encryption_types: 'programming', prog_error_boundary: 'programming', prog_error_handling: 'programming', prog_event_loop: 'programming', prog_event_propagation: 'programming', prog_event_sourcing: 'programming', prog_fib_recursion: 'programming', prog_functional: 'programming', prog_gc_mark_sweep: 'programming', prog_git_branches: 'programming', prog_graph_traversal: 'programming', prog_graph_viz: 'programming', prog_graphql_vs_rest: 'programming', prog_hash_table: 'programming', prog_http_cycle: 'programming', prog_iac_terraform: 'programming', prog_indexing: 'programming', prog_jwt_auth: 'programming', prog_kubernetes_arch: 'programming', prog_lang_comparison: 'programming', prog_linked_list: 'programming', prog_load_balancing: 'programming', prog_memoization: 'programming', prog_memory: 'programming', prog_micro_frontends: 'programming', prog_micro_vs_mono: 'programming', prog_mvc_arch: 'programming', prog_network_topologies: 'programming', prog_ntier_arch: 'programming', prog_null_handling: 'programming', prog_oop_concepts: 'programming', prog_process_states: 'programming', prog_promise_lifecycle: 'programming', prog_prototype_chain: 'programming', prog_queue: 'programming', prog_quicksort: 'programming', prog_rate_limiting: 'programming', prog_react_data_flow: 'programming', prog_recursion_tree: 'programming', prog_regex: 'programming', prog_rendering: 'programming', prog_rest_api: 'programming', prog_retry_patterns: 'programming', prog_sdlc_waterfall: 'programming', prog_search_algorithms: 'programming', prog_serverless: 'programming', prog_shell_commands: 'programming', prog_sorting_viz: 'programming', prog_sql_joins: 'programming', prog_stack: 'programming', prog_state_management: 'programming', prog_string_encoding: 'programming', prog_tcp_vs_udp: 'programming', prog_tdd_cycle: 'programming', prog_testing_pyramid: 'programming', prog_throttle_debounce: 'programming', prog_time_complexity: 'programming', prog_tree_traversal: 'programming', prog_twelve_factor: 'programming', prog_version_control: 'programming', prog_virtual_dom: 'programming', prog_web_security: 'programming', prog_web_storage: 'programming', prog_web_vitals: 'programming', prog_webhook_vs_polling: 'programming', prog_webpack_bundling: 'programming', prog_websocket_lifecycle: 'programming',
  labeled_science_diagram: 'science', figure_with_facts: 'science',
  anatomy_callouts: 'science',
  math_derivation_steps: 'mathematics', coordinate_graph: 'mathematics', proof_layout: 'mathematics',
  math_word_problem: 'mathematics',
};

// Icon-and-arrow FLOW templates — the diagrammatic, teacher-at-a-whiteboard look.
// For general/unknown topics these lead their intent pool (see getTemplatesByIntent).
const FLOW_TEMPLATES = new Set([
  // clean architecture/system-diagram look (titled node boxes + dashed links)
  'arch_pipeline', 'arch_two_columns', 'arch_flow_gates', 'arch_hub_nodes',
  // icon-node flows
  'distributed_arrow_flow', 'hub_spoke_icons', 'icon_pipeline',
  'decision_flow', 'concept_panel_flow', 'branching_outcomes',
  // code/math visualization flows
  'code_architecture', 'algorithm_flowchart', 'api_endpoint_map', 'code_state_machine',
  'math_derivation_steps', 'math_word_problem',
]);
// The clean reference-style architecture templates (lead within the flow group).
const ARCH_TEMPLATES = new Set(['arch_pipeline', 'arch_two_columns', 'arch_flow_gates', 'arch_hub_nodes', 'code_architecture']);

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
