// =============================================================================
// Programming-Specific Whiteboard Templates — 100+ boards for coding topics
// =============================================================================
// These templates are registered alongside the main library when the lesson
// field is programming/coding/CS. Each template owns its geometry (800×500
// canvas), uses the same helper utilities as templateLibrary.js, and is
// collision-free by construction.
// =============================================================================

const W = 800, H = 500;

const PALETTES = [
  { accent: '#2563eb', soft: '#dbeafe', deep: '#1e3a8a', glow: '#60a5fa', ink: '#0f172a' },
  { accent: '#0d9488', soft: '#ccfbf1', deep: '#115e59', glow: '#2dd4bf', ink: '#0f172a' },
  { accent: '#7c3aed', soft: '#ede9fe', deep: '#5b21b6', glow: '#a78bfa', ink: '#0f172a' },
  { accent: '#ea580c', soft: '#ffedd5', deep: '#9a3412', glow: '#fb923c', ink: '#0f172a' },
  { accent: '#db2777', soft: '#fce7f3', deep: '#9d174d', glow: '#f472b6', ink: '#0f172a' },
  { accent: '#16a34a', soft: '#dcfce7', deep: '#166534', glow: '#4ade80', ink: '#0f172a' },
  { accent: '#0284c7', soft: '#e0f2fe', deep: '#075985', glow: '#38bdf8', ink: '#0f172a' },
];

function txt(content, x, y, opts = {}) {
  const style = {
    fontSize: opts.fontSize ?? 16,
    color: opts.color ?? '#1e293b',
    fontWeight: opts.fontWeight ?? '600',
    textAnchor: opts.textAnchor ?? 'start',
    fontStyle: opts.fontStyle,
  };
  if (opts.maxWidth != null) style.maxWidth = opts.maxWidth;
  if (opts.maxLines != null) style.maxLines = opts.maxLines;
  return { type: 'draw_text', content: displayText(content), position: [x, y], style };
}

function rect(x, y, w, h, opts = {}) {
  return {
    type: 'draw_rect', x, y, width: w, height: h,
    label: opts.label,
    style: {
      fill: opts.fill ?? '#ffffff', stroke: opts.stroke ?? '#cbd5e1',
      strokeWidth: opts.strokeWidth ?? 1.5, rx: opts.rx ?? 14, flat: opts.flat,
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

function displayText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(displayText).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    if (value.from || value.to) return [value.from, value.to].map(displayText).filter(Boolean).join(' to ');
    return value.title || value.text || value.label || value.name || value.term
      || value.symbol || value.meaning || value.detail || value.value || value.number
      || value.answer || value.question || value.range || value.content || '';
  }
  return '';
}

function anchor(text, maxWords = 7) {
  const words = displayText(text).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

function itemText(it) { return displayText(it); }

function asArr(v) { return Array.isArray(v) ? v : v == null ? [] : [v]; }

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
    fontSize, color: opts.color ?? '#64748b', fontWeight: opts.fontWeight ?? '500',
    textAnchor: opts.textAnchor ?? 'middle', fontStyle: opts.fontStyle, maxWidth, maxLines,
  });
  if (frag && display !== text) frag._fullText = text;
  return frag;
}

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

function clampChars(text, maxChars) {
  const s = String(text);
  if (s.length <= maxChars) return s;
  const cut = s.slice(0, Math.max(1, maxChars - 1));
  const sp = cut.lastIndexOf(' ');
  return (sp > maxChars * 0.5 ? cut.slice(0, sp) : cut).trimEnd() + '\u2026';
}

function tagRole(frag, role) { if (frag) frag._role = role; return frag; }

function header(ctx, accent) {
  const out = [];
  if (ctx.title) {
    out.push(txt(ctx.title, W / 2, 44, { fontSize: 25, fontWeight: '800', color: '#0f172a', textAnchor: 'middle' }));
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
      fs = minFont;
      lines = Math.max(1, Math.floor(maxH / (minFont * lineRatio)));
      const cpl = Math.max(8, Math.floor(maxW / (minFont * 0.55)));
      clamped = clampChars(text, lines * cpl);
      lines = wrapLineCount(clamped, maxW, minFont);
    }
  }
  const blockH = lines * fs * lineRatio;
  const baseline = boxTopY + (boxH - blockH) / 2 + fs;
  const frag = txt(clamped, cx, baseline, {
    fontSize: fs, fontWeight: opts.fontWeight ?? '600', color: opts.color ?? '#0f172a',
    textAnchor: opts.textAnchor ?? 'middle', maxWidth: maxW, maxLines: lines,
  });
  if (frag && clamped !== text) frag._fullText = text;
  return frag;
}

// ── Code block renderer ──────────────────────────────────────────────────────
function codeBlock(lines, x, y, w, h, lang, opts = {}) {
  const list = Array.isArray(lines) ? lines.map(itemText) : String(lines || '').split('\n');
  const highlightLine = Number(opts.highlightLine);
  return [{
    type: 'draw_code_block',
    code: list.slice(0, 14).join('\n'),
    language: lang || 'javascript',
    filename: opts.filename,
    title: opts.title,
    position: [x, y],
    width: w,
    height: h,
    active_line: Number(opts.activeLine) || (Number.isInteger(highlightLine) ? highlightLine + 1 : undefined),
    highlight_lines: Array.isArray(opts.highlightLines)
      ? opts.highlightLines
      : (Number.isInteger(highlightLine) ? [highlightLine + 1] : []),
    visible_lines: opts.visibleLines,
    command: opts.command,
    output: opts.output,
    execution_status: opts.executionStatus,
    test_results: opts.testResults,
  }];
}

// ── Method badge colors ──────────────────────────────────────────────────────
const METHOD_COLORS = { GET: '#16a34a', POST: '#2563eb', PUT: '#f59e0b', DELETE: '#dc2626', PATCH: '#7c3aed' };

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

export function registerProgrammingTemplates(define) {

// ── P1. CODE SNIPPET WITH ANNOTATIONS ────────────────────────────────────────
define({
  id: 'prog_code_annotated', intent: 'example', label: 'Annotated code snippet',
  capacity: { lines: 8, annotations: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const lines = Array.isArray(d.lines) ? d.lines : String(d.code || '').split('\n');
    const codeX = 50, codeY = 120, codeW = 420;
    s.push(...codeBlock(lines, codeX, codeY, codeW, 290, d.language || d.lang || 'javascript', {
      highlightLine: d.highlight_line,
      highlightLines: d.highlight_lines,
      activeLine: d.active_line,
      visibleLines: d.visible_lines,
      filename: d.filename,
      command: d.command,
      output: d.output,
      executionStatus: d.execution_status,
      testResults: d.test_results,
    }));
    const anns = (d.annotations || d.notes || []).slice(0, 3);
    anns.forEach((an, i) => {
      const y = 140 + i * 92;
      s.push(line([codeX + codeW, y + 20], [codeX + codeW + 20, y + 20], { color: p.accent, strokeWidth: 1.4 }));
      s.push(rect(490, y, 260, 76, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft }));
      s.push(badge(String(i + 1), 502, y - 12, { bg: p.accent }));
      s.push(txt(anchor(itemText(an), 9), 506, y + 36, { fontSize: 12, color: '#1e293b', fontWeight: '500' }));
    });
    return s;
  },
});

// ── P2. COMPARISON OF TWO CODE PATTERNS ──────────────────────────────────────
define({
  id: 'prog_code_compare', intent: 'compare', label: 'Code pattern comparison',
  capacity: { left_lines: 6, right_lines: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const left = String(d.left_code || '').split('\n').filter(Boolean).length ? String(d.left_code).split('\n') : (d.left_lines || d.left || []).slice(0, 6);
    const right = String(d.right_code || '').split('\n').filter(Boolean).length ? String(d.right_code).split('\n') : (d.right_lines || d.right || []).slice(0, 6);
    const boxW = 340, gap = 20, y = 120;
    s.push(badge(d.left_title || 'Before', 56, 106, { bg: '#dc2626' }));
    s.push(...codeBlock(left, 50, y, boxW, 310, d.language || d.lang, { highlightLine: d.left_highlight, filename: d.left_title }));
    s.push(badge(d.right_title || 'After', 404, 106, { bg: '#16a34a' }));
    s.push(...codeBlock(right, 410, y, boxW, 310, d.language || d.lang, { highlightLine: d.right_highlight, filename: d.right_title }));
    return s;
  },
});

// ── P3. ALGORITHM PSEUDOCODE ─────────────────────────────────────────────────
define({
  id: 'prog_algorithm_pseudo', intent: 'process', label: 'Algorithm pseudocode',
  capacity: { steps: 6 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.lines || []).slice(0, 6);
    s.push(badge(d.algorithm_name || 'Algorithm', 56, 104, { bg: p.accent }));
    const y0 = 130;
    steps.forEach((st, i) => {
      const y = y0 + i * 48;
      const bg = i % 2 === 0 ? '#f8fafc' : p.soft;
      s.push(rect(60, y, 680, 40, { stroke: p.accent, strokeWidth: 1, fill: bg, rx: 6 }));
      s.push(circle(84, y + 20, 14, { fill: p.accent, stroke: p.accent }));
      s.push(txt(String(i + 1), 84, y + 26, { fontSize: 12, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      const indent = (st.indent || 0) * 20;
      s.push(txt(anchor(itemText(st), 16), 110 + indent, y + 26, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
      if (i < steps.length - 1) s.push(arrow([W / 2, y + 40], [W / 2, y + 48], { color: p.accent, strokeWidth: 1.5 }));
    });
    return s;
  },
});

// ── P4. DATA STRUCTURE — BINARY TREE ─────────────────────────────────────────
define({
  id: 'prog_binary_tree', intent: 'hierarchy', label: 'Binary tree',
  capacity: { nodes: 7 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const nodes = (d.nodes || d.items || d.children || d.values || []).slice(0, 7).map(itemText);
    const cx = W / 2, rootY = 120;
    s.push(circle(cx, rootY, 28, { fill: p.accent, stroke: p.accent }));
    s.push(txt(nodes[0] || 'root', cx, rootY + 5, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    if (nodes.length >= 2) {
      [-1, 1].forEach((side, i) => {
        const nx = cx + side * 180;
        const ny = 210;
        s.push(line([cx, rootY + 28], [nx, ny - 28], { color: p.accent, strokeWidth: 2 }));
        s.push(circle(nx, ny, 24, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
        s.push(txt(nodes[i + 1] || '', nx, ny + 5, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
        if (nodes.length >= 4) {
          [-90, 90].forEach((off, j) => {
            const idx = 3 + i * 2 + j;
            if (idx >= nodes.length) return;
            const gx = nx + off;
            const gy = 310;
            s.push(line([nx, ny + 24], [gx, gy - 24], { color: p.accent, strokeWidth: 1.5 }));
            s.push(circle(gx, gy, 20, { fill: '#ffffff', stroke: p.accent, strokeWidth: 1.5 }));
            s.push(txt(nodes[idx] || '', gx, gy + 5, { fontSize: 10, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
          });
        }
      });
    }
    return s;
  },
});

// ── P5. LINKED LIST ──────────────────────────────────────────────────────────
define({
  id: 'prog_linked_list', intent: 'process', label: 'Linked list visualization',
  capacity: { nodes: 6 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const nodes = (d.nodes || d.items || d.values || []).slice(0, 6).map(itemText);
    s.push({
      type: 'draw_linked_list',
      values: nodes.length ? nodes : ['head'],
      position: [110, 220],
      direction: 'horizontal',
      highlight_indices: asArr(d.highlight_indices).map(Number).filter(Number.isInteger),
      show_null: true,
    });
    s.push(badge(d.head_label || 'HEAD', 62, 220, { bg: p.accent }));
    return s;
  },
});

// ── P6. STACK DATA STRUCTURE ─────────────────────────────────────────────────
define({
  id: 'prog_stack', intent: 'hierarchy', label: 'Stack visualization',
  capacity: { items: 5 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.values || []).slice(0, 5).map(itemText);
    const n = Math.max(items.length, 1);
    s.push(obj('stack', 80, 160, 150, 200, { label: d.label || 'Stack', accent: p.accent }));
    const boxW = 400, x = 280;
    const topLabel = anchor(d.top_label || 'Top', 1);
    items.forEach((it, i) => {
      const y = 400 - i * 50 - 50;
      s.push(rect(x, y, boxW, 44, { stroke: i === 0 ? p.accent : '#cbd5e1', strokeWidth: i === 0 ? 2.5 : 1.5, fill: i === 0 ? p.soft : '#ffffff', rx: 6 }));
      s.push(txt(it, x + boxW / 2, y + 28, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i === 0 && items.length > 0) s.push(txt(topLabel, x + boxW + 26, y + 28, { fontSize: 11, fontWeight: '700', color: p.accent }));
    });
    if (d.bottom_label) s.push(txt(anchor(d.bottom_label, 2), x + boxW / 2, 440, { fontSize: 11, color: '#94a3b8', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P7. QUEUE DATA STRUCTURE ─────────────────────────────────────────────────
define({
  id: 'prog_queue', intent: 'process', label: 'Queue visualization',
  capacity: { items: 5 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.values || []).slice(0, 5).map(itemText);
    const n = Math.max(items.length, 1);
    const boxW = 100, boxH = 56, gap = 12;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2, y = 250;
    s.push(txt(d.front_label || 'Front \u2192', x0 - 80, y + boxH / 2 + 5, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'end' }));
    s.push(txt('\u2190 ' + (d.rear_label || 'Rear'), x0 + total + 20, y + boxH / 2 + 5, { fontSize: 12, fontWeight: '700', color: '#dc2626', textAnchor: 'start' }));
    items.forEach((it, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: i === 0 ? p.accent : (i === n - 1 ? '#dc2626' : '#cbd5e1'), strokeWidth: i === 0 || i === n - 1 ? 2.5 : 1.5, fill: i === 0 ? p.soft : '#ffffff', rx: 8 }));
      s.push(txt(it, x + boxW / 2, y + boxH / 2 + 5, { fontSize: 14, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, y + boxH / 2], [x + boxW + gap - 2, y + boxH / 2], { color: '#94a3b8', strokeWidth: 1.8 }));
    });
    return s;
  },
});

// ── P8. HASH TABLE ────────────────────────────────────────────────────────────
define({
  id: 'prog_hash_table', intent: 'define', label: 'Hash table visualization',
  capacity: { items: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.entries || d.pairs || []).slice(0, 6);
    s.push(badge(d.key_label || 'Key', 60, 112, { bg: p.accent }));
    s.push(badge(d.value_label || 'Value', 220, 112, { bg: p.accent }));
    s.push(badge(d.hash_label || 'Hash', 380, 112, { bg: '#64748b' }));
    items.forEach((it, i) => {
      const y = 144 + i * 48;
      const key = itemText(it.key || it[0] || it);
      const val = itemText(it.value || it[1] || it.detail || '');
      const h = it.hash || Math.abs(key.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 12;
      s.push(line([60, y], [W - 60, y], { color: '#e2e8f0', strokeWidth: 1 }));
      s.push(rect(60, y + 2, 140, 40, { stroke: p.accent, strokeWidth: 1.2, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 4 }));
      s.push(txt(anchor(key, 5), 130, y + 26, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      s.push(rect(210, y + 2, 150, 40, { stroke: '#cbd5e1', strokeWidth: 1.2, fill: '#ffffff', rx: 4 }));
      s.push(txt(anchor(val, 7), 285, y + 26, { fontSize: 12, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      s.push(rect(370, y + 2, 180, 40, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#f8fafc', rx: 4 }));
      s.push(txt(String(h), 460, y + 26, { fontSize: 11, fontWeight: '500', color: '#64748b', fontStyle: 'italic', textAnchor: 'middle' }));
      s.push(line([200, y + 2], [200, y + 42], { color: '#e2e8f0', strokeWidth: 1 }));
      s.push(line([360, y + 2], [360, y + 42], { color: '#e2e8f0', strokeWidth: 1 }));
    });
    return s;
  },
});

// ── P9. SORTING ALGORITHM VISUALIZATION ──────────────────────────────────────
define({
  id: 'prog_sorting_viz', intent: 'process', label: 'Sorting algorithm animation',
  capacity: { items: 8 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.values || []).slice(0, 8);
    s.push(badge(d.algorithm || 'Sorting', 56, 104, { bg: p.accent }));
    s.push({
      type: 'draw_sorting',
      array: items.map((item) => Number(item?.value ?? item) || 0),
      position: [90, 150],
      highlight_indices: items.map((item, index) => item?.highlight || item?.pivot ? index : -1).filter((index) => index >= 0),
      sort_type: d.algorithm || 'sorting',
      title: d.pass_label || d.algorithm || 'Compare and swap',
    });
    if (d.pass_label) s.push(txt(anchor(d.pass_label, 6), W / 2, 420, { fontSize: 13, fontWeight: '700', color: p.accent, textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P10. RECURSION TREE ──────────────────────────────────────────────────────
define({
  id: 'prog_recursion_tree', intent: 'hierarchy', label: 'Recursion tree',
  capacity: { calls: 7 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const calls = (d.calls || d.nodes || d.steps || []).slice(0, 7);
    s.push(badge(d.function_name || 'f(n)', 60, 108, { bg: p.accent }));
    // Root call
    const root = calls[0] ? itemText(calls[0]) : 'f(n)';
    s.push(rect(340, 112, 120, 44, { stroke: p.accent, strokeWidth: 2.5, fill: p.accent, rx: 8 }));
    s.push(txt(anchor(root, 5), 400, 140, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    // Level 2
    const l2 = calls.slice(1, 3);
    l2.forEach((c, i) => {
      const x = i === 0 ? 180 : 540;
      s.push(line([400, 156], [x + 60, 190], { color: p.accent, strokeWidth: 2 }));
      s.push(rect(x, 192, 120, 40, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 6 }));
      s.push(txt(anchor(itemText(c), 5), x + 60, 218, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      s.push(badge(itemText(c.return_val || ''), x + 90, 184, { bg: '#16a34a', fontSize: 9 }));
    });
    // Level 3
    const l3 = calls.slice(3, 7);
    l3.forEach((c, i) => {
      const parentX = i < 2 ? 180 : 540;
      const x = parentX + (i % 2 === 0 ? -80 : 80);
      s.push(line([parentX + 60, 232], [x + 50, 270], { color: p.accent, strokeWidth: 1.5 }));
      s.push(rect(x, 272, 100, 36, { stroke: '#cbd5e1', strokeWidth: 1.5, fill: '#ffffff', rx: 6 }));
      s.push(txt(anchor(itemText(c), 4), x + 50, 294, { fontSize: 10, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P11. API ROUTE MAP ───────────────────────────────────────────────────────
define({
  id: 'prog_api_routes', intent: 'map', label: 'API route map',
  capacity: { endpoints: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const endpoints = (d.endpoints || d.routes || []).slice(0, 5);
    const methodColors = METHOD_COLORS;
    s.push(rect(140, 110, 520, 42, { fill: '#1e293b', stroke: '#1e293b', rx: 8 }));
    s.push(txt('API Routes', 400, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    endpoints.forEach((ep, i) => {
      const y = 168 + i * 52;
      const method = (ep.method || ep.type || 'GET').toUpperCase();
      const mColor = methodColors[method] || '#475569';
      s.push(rect(160, y, 64, 34, { fill: mColor, stroke: mColor, rx: 6 }));
      s.push(txt(method, 192, y + 24, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(rect(236, y, 340, 34, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#f8fafc', rx: 4 }));
      s.push(txt(anchor(ep.path || ep.title || ep, 10), 250, y + 24, { fontSize: 12, fontWeight: '700', color: p.accent }));
      if (ep.detail) s.push(txt(anchor(ep.detail, 8), 590, y + 24, { fontSize: 10, fontWeight: '500', color: '#64748b' }));
    });
    return s;
  },
});

// ── P12. MVC ARCHITECTURE ─────────────────────────────────────────────────────
define({
  id: 'prog_mvc_arch', intent: 'hierarchy', label: 'MVC architecture',
  capacity: { layers: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const layers = (d.layers || []).slice(0, 4);
    s.push(txt(d.title_label || 'MVC Architecture', W / 2, 110, { fontSize: 16, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const labels = ['View', 'Controller', 'Model', 'Database'];
    const colors = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    const n = 4;
    const boxW = 520, boxH = 60, gap = 20;
    const x = (W - boxW) / 2;
    labels.forEach((lb, i) => {
      const y = 140 + i * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { fill: colors[i], stroke: colors[i], rx: 10 }));
      s.push(txt(lb, x + 80, y + boxH / 2 + 5, { fontSize: 15, fontWeight: '800', color: '#ffffff' }));
      const detail = layers[i] ? itemText(layers[i]) : '';
      if (detail) s.push(txt(anchor(detail, 8), x + 100, y + boxH / 2 + 5, { fontSize: 11, fontWeight: '500', color: '#e2e8f0', textAnchor: 'start' }));
      if (i < n - 1) s.push(arrow([W / 2, y + boxH], [W / 2, y + boxH + gap], { color: '#94a3b8', strokeWidth: 2, dashed: true }));
    });
    s.push(txt('\u2191 User action flows through controller to model', 140, 445, { fontSize: 11, color: '#64748b', fontStyle: 'italic' }));
    s.push(txt('\u2193 Data flows back from model to view', 140, 462, { fontSize: 11, color: '#64748b', fontStyle: 'italic' }));
    return s;
  },
});

// ── P13. CLIENT-SERVER ARCHITECTURE ──────────────────────────────────────────
define({
  id: 'prog_client_server', intent: 'map', label: 'Client-server architecture',
  capacity: { clients: 2, servers: 2 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    // Client side
    s.push(rect(50, 140, 200, 230, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft, rx: 12 }));
    s.push(obj('person', 110, 160, 80, 80, { accent: p.accent }));
    s.push(txt(d.clients_title || 'Client', 150, 270, { fontSize: 16, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const clients = (d.clients || []).slice(0, 2);
    clients.forEach((cl, i) => {
      s.push(txt('\u2022 ' + anchor(itemText(cl), 6), 70, 310 + i * 24, { fontSize: 11, color: '#334155', fontWeight: '500' }));
    });
    // Network pipe
    s.push(rect(270, 220, 260, 50, { fill: '#1e293b', stroke: '#1e293b', rx: 25 }));
    s.push(txt(d.network_label || 'Network / Internet', 400, 252, { fontSize: 14, fontWeight: '700', color: '#ffffff', textAnchor: 'middle' }));
    s.push(arrow([250, 245], [270, 245], { color: p.accent, strokeWidth: 2.5 }));
    s.push(arrow([530, 245], [550, 245], { color: '#94a3b8', strokeWidth: 2.5 }));
    // Server side
    s.push(rect(560, 140, 190, 230, { stroke: p.accent, strokeWidth: 2.5, fill: p.soft, rx: 12 }));
    s.push(obj('server', 615, 160, 80, 80, { accent: p.accent }));
    s.push(txt(d.servers_title || 'Server', 655, 270, { fontSize: 16, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const servers = (d.servers || []).slice(0, 2);
    servers.forEach((sv, i) => {
      s.push(txt('\u2022 ' + anchor(itemText(sv), 6), 580, 310 + i * 24, { fontSize: 11, color: '#334155', fontWeight: '500' }));
    });
    // Request/Response labels
    s.push(txt(d.request_label || 'HTTP Request \u2192', 400, 200, { fontSize: 11, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    s.push(txt('\u2190 ' + (d.response_label || 'HTTP Response'), 400, 284, { fontSize: 11, fontWeight: '700', color: '#16a34a', textAnchor: 'middle' }));
    return s;
  },
});

// ── P14. GIT BRANCHING DIAGRAM ───────────────────────────────────────────────
define({
  id: 'prog_git_branches', intent: 'process', label: 'Git branching diagram',
  capacity: { branches: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    s.push(badge('Git History', 56, 104, { bg: p.accent }));
    const branches = (d.branches || d.items || []).slice(0, 4);
    const n = Math.max(branches.length, 1);
    const baseY = 200;
    const colors = ['#2563eb', '#ea580c', '#7c3aed', '#16a34a'];
    // Horizontal baseline (main)
    s.push(line([60, baseY], [740, baseY], { color: '#94a3b8', strokeWidth: 3 }));
    s.push(circle(100, baseY, 10, { fill: '#ffffff', stroke: '#1e293b', strokeWidth: 2.5 }));
    s.push(txt('main', 100, baseY + 26, { fontSize: 11, fontWeight: '800', color: '#475569', textAnchor: 'middle' }));
    branches.forEach((br, i) => {
      const branchY = baseY - 50 - i * 60;
      const startX = 200 + i * 60;
      const col = colors[i % colors.length];
      const title = itemText(br.title || br);
      s.push(circle(startX, baseY, 8, { fill: col, stroke: col }));
      s.push(line([startX, baseY], [startX + 200, branchY], { color: col, strokeWidth: 2.5 }));
      s.push(circle(startX + 200, branchY, 10, { fill: col, stroke: col }));
      s.push(txt(anchor(title, 5), startX + 200, branchY - 20, { fontSize: 12, fontWeight: '800', color: col, textAnchor: 'middle' }));
      if (br.commits) {
        (br.commits || []).slice(0, 3).forEach((cm, j) => {
          const cx = startX + 40 + j * 50;
          s.push(circle(cx, branchY, 6, { fill: '#ffffff', stroke: col, strokeWidth: 1.5 }));
          s.push(txt(anchor(itemText(cm), 2), cx, branchY + 18, { fontSize: 8, color: '#64748b', textAnchor: 'middle' }));
        });
      }
      // Merge back
      if (i < n - 1) {
        s.push(line([startX + 200, branchY], [startX + 300, baseY], { color: col, strokeWidth: 1.5, dashed: true }));
        s.push(circle(startX + 300, baseY, 8, { fill: col, stroke: col }));
      }
    });
    return s;
  },
});

// ── P15. COMPLEXITY ANALYSIS ─────────────────────────────────────────────────
define({
  id: 'prog_complexity', intent: 'formula', label: 'Complexity analysis chart',
  capacity: { notations: 5 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const notations = (d.notations || d.items || d.operations || []).slice(0, 5);
    // Big-O chart
    s.push(rect(60, 120, 320, 200, { stroke: p.accent, strokeWidth: 2, fill: p.soft, rx: 8 }));
    s.push(txt(anchor(d.chart_title || 'Big O Complexity', 4), 220, 150, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    const items = [
      'O(1) \u2014 Constant', 'O(log n) \u2014 Logarithmic', 'O(n) \u2014 Linear',
      'O(n log n) \u2014 Linearithmic', 'O(n\u00b2) \u2014 Quadratic', 'O(2\u207f) \u2014 Exponential',
    ];
    items.forEach((it, i) => {
      const y = 188 + i * 28;
      s.push(circle(88, y, 4, { fill: i < 3 ? '#16a34a' : (i < 4 ? '#f59e0b' : '#dc2626'), stroke: i < 3 ? '#16a34a' : (i < 4 ? '#f59e0b' : '#dc2626') }));
      s.push(txt(it, 104, y + 4, { fontSize: 11, fontWeight: i < 3 ? '700' : '500', color: i < 3 ? '#166534' : (i < 4 ? '#92400e' : '#991b1b') }));
    });
    // Right side: specific notations
    s.push(badge('Your Analysis', 420, 116, { bg: p.accent }));
    notations.forEach((nt, i) => {
      const y = 152 + i * 54;
      s.push(rect(420, y, 340, 44, { stroke: p.accent, strokeWidth: 1.4, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 6 }));
      const symbol = nt.symbol || nt.title || '';
      const desc = nt.detail || nt.description || nt;
      s.push(txt(anchor(symbol, 6), 436, y + 28, { fontSize: 15, fontWeight: '800', color: p.accent }));
      s.push(txt(anchor(itemText(desc), 10), 530, y + 28, { fontSize: 12, fontWeight: '600', color: '#334155' }));
    });
    return s;
  },
});

// ── P16. DEBUGGING WORKFLOW ──────────────────────────────────────────────────
define({
  id: 'prog_debug_flow', intent: 'process', label: 'Debugging workflow',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.items || []).slice(0, 5);
    const defs = ['Reproduce Bug', 'Isolate Cause', 'Fix Code', 'Test Fix', 'Deploy'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const boxW = 160, boxH = 80, gap = 20;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2, y = 230;
    s.push(obj('bug', 40, 140, 80, 80, { accent: '#dc2626' }));
    s.push(txt(anchor(d.headline || 'Debugging', 4), 80, 230, { fontSize: 13, fontWeight: '700', color: '#dc2626', textAnchor: 'middle' }));
    list.forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 10 }));
      s.push(circle(x + boxW / 2, y - 18, 18, { fill: p.accent, stroke: p.accent }));
      s.push(txt(String(i + 1), x + boxW / 2, y - 12, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(itemText(st), 6), x + boxW / 2, y + 40, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < n - 1) {
        s.push(arrow([x + boxW + 4, y + boxH / 2], [x + boxW + gap - 4, y + boxH / 2], { color: p.accent, strokeWidth: 2.5 }));
      }
    });
    if (d.takeaway) s.push(callout(anchor(d.takeaway, 14), 120, 420, 560));
    return s;
  },
});

// ── P17. TESTING PYRAMID ─────────────────────────────────────────────────────
define({
  id: 'prog_testing_pyramid', intent: 'hierarchy', label: 'Testing pyramid',
  capacity: { tiers: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const tiers = (d.tiers || d.items || []).slice(0, 3);
    const defs = [
      { title: 'E2E Tests', detail: 'UI, API, browser' },
      { title: 'Integration Tests', detail: 'Services, DB, API' },
      { title: 'Unit Tests', detail: 'Functions, components' },
    ];
    const list = tiers.length ? tiers : defs;
    const n = 3;
    const baseW = 540, topY = 120, th = 90;
    list.forEach((ti, i) => {
      const wRatio = (n - i) / n;
      const w = Math.round(baseW * wRatio);
      const x = (W - w) / 2;
      const y = topY + i * th;
      const isTop = i === 0;
      s.push(rect(x, y, w, th - 8, { stroke: isTop ? p.accent : '#cbd5e1', strokeWidth: 2, fill: isTop ? p.accent : p.soft, rx: 8 }));
      s.push(txt(anchor(itemText(ti.title || ti), 6), W / 2, y + th / 2 - 6, { fontSize: 15, fontWeight: '800', color: isTop ? '#ffffff' : '#1e293b', textAnchor: 'middle' }));
      const detail = ti.detail || (typeof ti === 'string' ? '' : '');
      if (detail) s.push(txt(anchor(detail, 8), W / 2, y + th / 2 + 18, { fontSize: 11, fontWeight: '500', color: isTop ? '#e2e8f0' : '#475569', textAnchor: 'middle' }));
    });
    s.push(txt(d.speed_label || 'Speed \u2192', 100, 380, { fontSize: 12, fontWeight: '700', color: p.accent }));
    s.push(txt(d.confidence_label || 'Confidence \u2192', 600, 380, { fontSize: 12, fontWeight: '700', color: '#16a34a', textAnchor: 'end' }));
    return s;
  },
});

// ── P18. TDD CYCLE ───────────────────────────────────────────────────────────
define({
  id: 'prog_tdd_cycle', intent: 'cycle', label: 'TDD cycle',
  capacity: { stages: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || d.steps || []).slice(0, 4);
    const defs = ['Write Test', 'Run (fails)', 'Write Code', 'Run (passes)'];
    const list = stages.length ? stages : defs.map((t) => ({ title: t }));
    const cx = W / 2, cy = 300, R = 130;
    list.slice(0, 4).forEach((stg, i) => {
      const ang = (-90 + (360 / 4) * i) * (Math.PI / 180);
      const sx = cx + Math.cos(ang) * R;
      const sy = cy + Math.sin(ang) * R;
      const fill = i === 2 ? p.accent : (i === 0 ? '#16a34a' : p.soft);
      const textColor = i === 0 || i === 2 ? '#ffffff' : '#1e293b';
      s.push(circle(sx, sy, 44, { fill, stroke: p.accent, strokeWidth: 2.5 }));
      s.push(txt(anchor(itemText(stg), 6), sx, sy + 5, { fontSize: 13, fontWeight: '800', color: textColor, textAnchor: 'middle' }));
      const nextAng = (-90 + (360 / 4) * (i + 1)) * (Math.PI / 180);
      const ax = cx + Math.cos(ang) * (R - 44);
      const ay = cy + Math.sin(ang) * (R - 44);
      const bx = cx + Math.cos(nextAng) * (R - 44);
      const by = cy + Math.sin(nextAng) * (R - 44);
      s.push(path(`M ${ax} ${ay} Q ${cx + Math.cos((ang + nextAng) / 2) * (R + 30)} ${cy + Math.sin((ang + nextAng) / 2) * (R + 30)} ${bx} ${by}`, { stroke: p.accent, strokeWidth: 2, markerEnd: 'arrow' }));
    });
    s.push(circle(cx, cy, 32, { fill: '#ffffff', stroke: p.accent, strokeWidth: 2.5 }));
    s.push(txt('TDD', cx, cy + 5, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    return s;
  },
});

// ── P19. DEPLOYMENT PIPELINE ─────────────────────────────────────────────────
define({
  id: 'prog_deploy_pipeline', intent: 'process', label: 'CI/CD deployment pipeline',
  capacity: { stages: 5 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || d.steps || []).slice(0, 5);
    const defs = ['Commit', 'Build', 'Test', 'Deploy', 'Monitor'];
    const list = stages.length ? stages : defs.map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const cy = 270;
    const step = (W - 140) / Math.max(n - 1, 1);
    list.forEach((st, i) => {
      const x = 70 + i * step;
      const yOff = i % 2 === 0 ? 0 : 60;
      const icon = ['git', 'build', 'test', 'deploy', 'monitor'][i % 5];
      s.push(circle(x, cy + yOff, 30, { fill: i % 2 === 0 ? p.accent : p.soft, stroke: p.accent, strokeWidth: 2.5 }));
      s.push(obj(icon, x - 16, cy + yOff - 16, 32, 32, { accent: i % 2 === 0 ? '#ffffff' : p.accent }));
      s.push(txt(anchor(itemText(st), 4), x, cy + yOff + 48, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < n - 1) {
        const nx = 70 + (i + 1) * step;
        const nyOff = (i + 1) % 2 === 0 ? 0 : 60;
        s.push(path(`M ${x + 30} ${cy + yOff} Q ${(x + nx) / 2} ${cy + Math.max(yOff, nyOff) + 40} ${nx - 30} ${cy + nyOff}`, { stroke: p.accent, strokeWidth: 2, markerEnd: 'arrow' }));
      }
    });
    return s;
  },
});

// ── P20. DATABASE SCHEMA ──────────────────────────────────────────────────────
define({
  id: 'prog_db_schema', intent: 'define', label: 'Database schema diagram',
  capacity: { tables: 4 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    s.push(badge(d.title_label || 'Schema', 56, 104, { bg: p.accent }));
    const tables = (d.tables || d.entities || []).slice(0, 4);
    const n = Math.max(tables.length, 1);
    const boxW = 170, gap = (W - 80 - boxW * n) / Math.max(n - 1, 1);
    tables.forEach((tbl, i) => {
      const x = 40 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 240, { stroke: p.accent, strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      const name = itemText(tbl.name || tbl.title || tbl);
      s.push(rect(x, 130, boxW, 40, { fill: p.accent, stroke: p.accent, rx: 8 }));
      s.push(txt(anchor(name, 4), x + boxW / 2, 156, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      const fields = (tbl.fields || tbl.columns || tbl.items || []).slice(0, 5);
      fields.forEach((fld, j) => {
        const y = 186 + j * 38;
        const isPK = fld.pk || fld.primary_key || j === 0;
        s.push(line([x + 8, y], [x + boxW - 8, y], { color: '#e2e8f0', strokeWidth: 1 }));
        const label = isPK ? '\uD83D\uDD11 ' + itemText(fld) : '\u2022 ' + itemText(fld);
        const fw = isPK ? '700' : '500';
        s.push(txt(anchor(label, 5), x + 10, y + 16, { fontSize: 11, fontWeight: fw, color: '#1e293b' }));
        if (fld.type) s.push(txt(fld.type, x + boxW - 10, y + 16, { fontSize: 9, fontWeight: '500', color: '#94a3b8', textAnchor: 'end' }));
      });
      // Foreign key arrows
      if (i > 0) {
        const prevX = 40 + (i - 1) * (boxW + gap);
        s.push(arrow([prevX + boxW, 260], [x, 260], { color: '#94a3b8', strokeWidth: 1.5, dashed: true }));
      }
    });
    return s;
  },
});

// ── P21. SERVERLESS ARCHITECTURE ─────────────────────────────────────────────
define({
  id: 'prog_serverless', intent: 'map', label: 'Serverless architecture',
  capacity: { services: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const services = (d.services || d.items || []).slice(0, 4);
    const defs = ['Auth', 'API Gateway', 'Functions', 'Database'];
    const list = services.length ? services : defs.map((t) => ({ title: t }));
    // Top row: client
    s.push(rect(300, 112, 200, 52, { stroke: p.accent, strokeWidth: 2, fill: p.accent, rx: 10 }));
    s.push(txt(d.client_label || 'Client / App', 400, 146, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(arrow([400, 164], [400, 188], { color: p.accent, strokeWidth: 2 }));
    // Middle row: services
    const n = Math.min(list.length, 4);
    const boxW = 170, gap = (W - 80 - boxW * n) / Math.max(n - 1, 1);
    list.slice(0, n).forEach((svc, i) => {
      const x = 40 + i * (boxW + gap);
      s.push(rect(x, 190, boxW, 110, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
      const icon = ['users', 'cloud', 'cog_icon', 'database'][i % 4];
      s.push(obj(icon, x + 10, 198, 36, 36, { accent: p.accent }));
      s.push(txt(anchor(itemText(svc), 4), x + boxW / 2, 244, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (svc.detail) s.push(txt(anchor(svc.detail, 6), x + boxW / 2, 268, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    });
    // API Gateway label
    s.push(txt(d.gateway_label || 'API Gateway manages all requests', W / 2, 350, { fontSize: 12, fontWeight: '600', color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P22. OBJECT-ORIENTED PROGRAMMING ─────────────────────────────────────────
define({
  id: 'prog_oop_concepts', intent: 'define', label: 'OOP concepts',
  capacity: { concepts: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    s.push(badge(d.title_label || 'OOP Principles', 56, 104, { bg: p.accent }));
    const concepts = (d.concepts || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Encapsulation', detail: 'Data hiding via private fields' },
      { title: 'Inheritance', detail: 'Parent-child class hierarchy' },
      { title: 'Polymorphism', detail: 'Many forms, one interface' },
      { title: 'Abstraction', detail: 'Hide complexity, show intent' },
    ];
    const list = concepts.length ? concepts : defs;
    const boxW = 170, boxH = 140, gap = 20;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    list.slice(0, 4).forEach((c, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, boxH, { stroke: p.accent, strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, 130, boxW, 8, { fill: p.accent, stroke: p.accent, rx: 0 }));
      const icons = ['shield', 'folder', 'star', 'cog_icon'];
      s.push(obj(icons[i], x + boxW / 2 - 18, 152, 36, 36, { accent: p.accent }));
      s.push(txt(anchor(itemText(c.title || c), 4), x + boxW / 2, 214, { fontSize: 14, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      if (c.detail) s.push(txt(anchor(c.detail, 8), x + boxW / 2, 244, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P23. DESIGN PATTERNS OVERVIEW ────────────────────────────────────────────
define({
  id: 'prog_design_patterns', intent: 'cluster', label: 'Design patterns overview',
  capacity: { patterns: 6 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const patterns = (d.patterns || d.items || []).slice(0, 6);
    const defs = ['Singleton', 'Factory', 'Observer', 'Strategy', 'Decorator', 'Adapter'];
    const list = patterns.length ? patterns : defs.map((t) => ({ title: t }));
    const boxW = 220, boxH = 80, gap = 20;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    list.slice(0, 6).forEach((pt, i) => {
      const c = i % 3, r = Math.floor(i / 3);
      const x = x0 + c * (boxW + gap);
      const y = 130 + r * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 8 }));
      s.push(badge(String(i + 1), x + 10, y - 12, { bg: p.accent }));
      const icon = ['cog_icon', 'building', 'globe', 'chart_up', 'star', 'key'][i % 6];
      s.push(obj(icon, x + 14, y + 24, 32, 32, { accent: p.accent }));
      s.push(txt(anchor(itemText(pt), 5), x + 58, y + 42, { fontSize: 14, fontWeight: '700', color: '#1e293b' }));
      if (pt.detail) { const bt = bodyTxt(pt.detail, x + boxW / 2, y + 66, { maxWidth: boxW - 20, maxLines: 1 }); if (bt) s.push(bt); }
    });
    return s;
  },
});

// ── P24. HTTP REQUEST-RESPONSE CYCLE ─────────────────────────────────────────
define({
  id: 'prog_http_cycle', intent: 'process', label: 'HTTP request-response cycle',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.stages || []).slice(0, 5);
    const defs = ['DNS Lookup', 'TCP Handshake', 'Send Request', 'Server Process', 'Response'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const cy = 270;
    const stepW = (W - 120) / n;
    list.forEach((st, i) => {
      const x = 60 + i * stepW;
      s.push(circle(x + stepW / 2, cy, 36, { fill: i === n - 1 ? '#16a34a' : (i === 2 ? p.accent : p.soft), stroke: p.accent, strokeWidth: 2.5 }));
      s.push(txt(String(i + 1), x + stepW / 2, cy + 5, { fontSize: 14, fontWeight: '800', color: i === n - 1 || i === 2 ? '#ffffff' : '#1e293b', textAnchor: 'middle' }));
      s.push(badge(anchor(itemText(st), 3), x + stepW / 2, cy + 58, { bg: i === n - 1 ? '#16a34a' : p.accent, fontSize: 10 }));
      if (i < n - 1) s.push(arrow([x + stepW - 6, cy], [x + stepW + 6, cy], { color: p.accent, strokeWidth: 2.5 }));
    });
    return s;
  },
});

// ── P25. DATABASE INDEXING ────────────────────────────────────────────────────
define({
  id: 'prog_indexing', intent: 'data', label: 'Database indexing concept',
  capacity: { items: 5 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.entries || []).slice(0, 5);
    s.push(badge('Without Index', 60, 112, { bg: '#dc2626' }));
    s.push(badge('With Index', 420, 112, { bg: '#16a34a' }));
    // Left: full scan
    s.push(rect(60, 140, 300, 200, { stroke: '#dc2626', strokeWidth: 1.8, fill: '#fee2e2', rx: 8 }));
    s.push(txt('Full Table Scan', 210, 172, { fontSize: 14, fontWeight: '800', color: '#991b1b', textAnchor: 'middle' }));
    (items.length ? items : ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5']).forEach((it, i) => {
      const y = 192 + i * 26;
      s.push(rect(76, y, 268, 22, { stroke: '#fecaca', strokeWidth: 1, fill: '#ffffff', rx: 4 }));
      s.push(txt('\u2716 ' + anchor(itemText(it), 6), 84, y + 16, { fontSize: 11, fontWeight: '500', color: '#991b1b' }));
    });
    s.push(txt('O(n) \u2014 checks every row', 210, 362, { fontSize: 12, fontWeight: '700', color: '#991b1b', textAnchor: 'middle' }));
    // Right: indexed
    s.push(rect(410, 140, 340, 200, { stroke: '#16a34a', strokeWidth: 1.8, fill: '#f0fdf4', rx: 8 }));
    s.push(txt('B-Tree Index', 580, 172, { fontSize: 14, fontWeight: '800', color: '#166534', textAnchor: 'middle' }));
    const tree = ['[1,10,20]', '5', '15', '25', '35'];
    tree.forEach((it, i) => {
      const y = 192 + i * 26;
      s.push(rect(426, y, 308, 22, { stroke: '#bbf7d0', strokeWidth: 1, fill: '#ffffff', rx: 4 }));
      const icon = i === 0 ? '\uD83C\uDF32' : (i % 2 === 0 ? '\u2192' : '\u2714');
      s.push(txt(icon + ' ' + it, 434, y + 16, { fontSize: 11, fontWeight: '600', color: '#166534' }));
    });
    s.push(txt('O(log n) \u2014 index lookup', 580, 362, { fontSize: 12, fontWeight: '700', color: '#166534', textAnchor: 'middle' }));
    return s;
  },
});

// ── P26. ASYNC / EVENT LOOP ──────────────────────────────────────────────────
define({
  id: 'prog_event_loop', intent: 'process', label: 'Event loop visualization',
  capacity: { phases: 5 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const phases = (d.phases || d.steps || []).slice(0, 5);
    const defs = ['Call Stack', 'Web APIs', 'Callback Queue', 'Microtask Q', 'Event Loop'];
    const list = phases.length ? phases : defs.map((t) => ({ title: t }));
    const boxW = 140, gap = 14, y = 180, boxH = 130;
    const x0 = (W - boxW * 5 - gap * 4) / 2;
    const colors = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#f59e0b'];
    list.slice(0, 5).forEach((ph, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: colors[i], strokeWidth: 2, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 8 }));
      s.push(rect(x, y, boxW, 6, { fill: colors[i], stroke: colors[i], rx: 0 }));
      s.push(txt(anchor(itemText(ph), 4), x + boxW / 2, y + 36, { fontSize: 12, fontWeight: '800', color: colors[i], textAnchor: 'middle' }));
      if (ph.detail) s.push(txt(anchor(ph.detail, 6), x + boxW / 2, y + 68, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (i < 4) s.push(arrow([x + boxW, y + boxH / 2], [x + boxW + gap, y + boxH / 2], { color: '#94a3b8', strokeWidth: 2 }));
    });
    return s;
  },
});

// ── P27. MICROSERVICES VS MONOLITH ────────────────────────────────────────────
define({
  id: 'prog_micro_vs_mono', intent: 'compare', label: 'Microservices vs monolith',
  capacity: { comparisons: 3 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const comparisons = (d.comparisons || d.items || []).slice(0, 3);
    const boxW = 330, gap = 40;
    const x0 = (W - boxW * 2 - gap) / 2;
    // Monolith
    s.push(rect(x0, 120, boxW, 280, { stroke: '#64748b', strokeWidth: 2, fill: '#f8fafc', rx: 10 }));
    s.push(rect(x0, 120, boxW, 44, { fill: '#64748b', stroke: '#64748b', rx: 10 }));
    s.push(txt(d.mono_title || 'Monolith', x0 + boxW / 2, 150, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const mono = ['UI', 'Business Logic', 'Data Access', 'Database'];
    mono.forEach((m, i) => {
      const y = 186 + i * 46;
      s.push(rect(x0 + 20, y, boxW - 40, 36, { stroke: '#cbd5e1', strokeWidth: 1.5, fill: '#ffffff', rx: 6 }));
      s.push(txt(m, x0 + boxW / 2, y + 24, { fontSize: 12, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      if (i < mono.length - 1) s.push(arrow([x0 + boxW / 2, y + 36], [x0 + boxW / 2, y + 46], { color: '#94a3b8', strokeWidth: 1.5 }));
    });
    // Microservices
    s.push(rect(x0 + boxW + gap, 120, boxW, 280, { stroke: p.accent, strokeWidth: 2, fill: p.soft, rx: 10 }));
    s.push(rect(x0 + boxW + gap, 120, boxW, 44, { fill: p.accent, stroke: p.accent, rx: 10 }));
    s.push(txt(d.micro_title || 'Microservices', x0 + boxW + gap + boxW / 2, 150, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const micro = ['Auth Service', 'API Gateway', 'Order Service', 'User Service'];
    micro.forEach((m, i) => {
      const y = 186 + i * 46;
      const colors = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
      s.push(rect(x0 + boxW + gap + 14, y, boxW - 28, 36, { stroke: colors[i], strokeWidth: 1.8, fill: '#ffffff', rx: 6 }));
      s.push(txt(m, x0 + boxW + gap + boxW / 2, y + 24, { fontSize: 12, fontWeight: '600', color: colors[i], textAnchor: 'middle' }));
    });
    comparisons.forEach((cmp, i) => {
      const y = 430 + i * 22;
      s.push(txt('\u2022 ' + anchor(itemText(cmp), 10), W / 2, y, { fontSize: 11, color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P28. JWT AUTH FLOW ────────────────────────────────────────────────────────
define({
  id: 'prog_jwt_auth', intent: 'process', label: 'JWT authentication flow',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.stages || []).slice(0, 5);
    const defs = ['Login', 'Server Validates', 'Issues JWT', 'Client Stores', 'Sends with Requests'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const cy = 240;
    const stepW = (W - 100) / Math.max(n - 1, 1);
    // Top: client + server
    s.push(obj('person', 60, 120, 60, 60, { accent: p.accent }));
    s.push(txt('Client', 90, 190, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    s.push(obj('server', 680, 120, 60, 60, { accent: p.accent }));
    s.push(txt('Server', 710, 190, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    // Steps in a row
    list.forEach((st, i) => {
      const x = 60 + i * stepW;
      const isCentered = n === 1;
      const finalX = isCentered ? W / 2 : x;
      s.push(circle(finalX, cy, 26, { fill: i === n - 1 ? '#16a34a' : p.accent, stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(String(i + 1), finalX, cy + 5, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(itemText(st), 4), finalX, cy + 50, { fontSize: 11, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (i < n - 1 && !isCentered) {
        const nx = 60 + (i + 1) * stepW;
        s.push(arrow([finalX + 26, cy], [nx - 26, cy], { color: p.accent, strokeWidth: 2 }));
      }
    });
    return s;
  },
});

// ── P29. MEMORY MANAGEMENT ────────────────────────────────────────────────────
define({
  id: 'prog_memory', intent: 'define', label: 'Memory layout diagram',
  capacity: { regions: 5 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const regions = (d.regions || d.items || []).slice(0, 5);
    const defs = ['Stack', 'Heap', 'Data (static)', 'Text (code)', 'OS Kernel'];
    const list = regions.length ? regions : defs.map((t) => ({ title: t }));
    const n = Math.max(list.length, 1);
    const boxW = 380, x = (W - boxW) / 2 - 40;
    const baseY = 440;
    const perH = Math.min(60, (320) / n);
    const colors = ['#dc2626', '#f59e0b', '#2563eb', '#16a34a', '#64748b'];
    list.slice(0, 5).forEach((r, i) => {
      const y = baseY - (i + 1) * perH;
      const h = perH - 4;
      s.push(rect(x, y, boxW, h, { fill: colors[i % 5], stroke: colors[i % 5], rx: 4 }));
      s.push(txt(anchor(itemText(r.title || r), 5), x + boxW / 2, y + h / 2 + 4, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (r.detail) s.push(txt(anchor(r.detail, 12), x + boxW + 20, y + h / 2 + 4, { fontSize: 11, fontWeight: '500', color: '#475569' }));
    });
    s.push(txt('\u2191 Higher addresses (0xFFFF...)', x + boxW / 2, 120, { fontSize: 11, color: '#94a3b8', textAnchor: 'middle', fontStyle: 'italic' }));
    s.push(txt('\u2193 Lower addresses (0x0000...)', x + boxW / 2, 460, { fontSize: 11, color: '#94a3b8', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P30. SQL JOIN VISUALIZATION ────────────────────────────────────────────────
define({
  id: 'prog_sql_joins', intent: 'compare', label: 'SQL JOIN visualization',
  capacity: { joins: 4 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const joins = (d.joins || d.items || []).slice(0, 4);
    const defs = [
      { title: 'INNER JOIN', detail: 'Only matching rows from both' },
      { title: 'LEFT JOIN', detail: 'All from left, matching from right' },
      { title: 'RIGHT JOIN', detail: 'All from right, matching from left' },
      { title: 'FULL JOIN', detail: 'All rows from both sides' },
    ];
    const list = joins.length ? joins : defs;
    const boxW = 180, boxH = 170, gap = 12;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    list.slice(0, 4).forEach((jn, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, 130, boxW, 36, { fill: p.accent, stroke: p.accent, rx: 8 }));
      s.push(txt(anchor(itemText(jn.title || jn), 4), x + boxW / 2, 154, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      // Venn circles
      const cx = x + boxW / 2;
      const cy = 240;
      const off = 18;
      if (i === 0) {
        s.push(circle(cx, cy, 32, { fill: p.accent, stroke: p.accent }));
      } else if (i === 1) {
        s.push(circle(cx - off, cy, 30, { fill: p.accent, stroke: p.accent }));
        s.push(circle(cx + off, cy, 30, { fill: '#e2e8f0', stroke: '#94a3b8' }));
      } else if (i === 2) {
        s.push(circle(cx - off, cy, 30, { fill: '#e2e8f0', stroke: '#94a3b8' }));
        s.push(circle(cx + off, cy, 30, { fill: p.accent, stroke: p.accent }));
      } else {
        s.push(circle(cx - off, cy, 30, { fill: p.accent, stroke: p.accent }));
        s.push(circle(cx + off, cy, 30, { fill: p.accent, stroke: p.accent }));
      }
      if (jn.detail) s.push(txt(anchor(jn.detail, 8), x + boxW / 2, 306, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P31. GRAPH (NETWORK) VISUALIZATION ────────────────────────────────────────
define({
  id: 'prog_graph_viz', intent: 'cluster', label: 'Graph data structure',
  capacity: { nodes: 5 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const nodes = (d.nodes || d.items || d.vertices || []).slice(0, 5);
    const positions = [
      { x: 280, y: 150 }, { x: 520, y: 150 }, { x: 400, y: 280 },
      { x: 150, y: 320 }, { x: 650, y: 320 },
    ];
    const colors = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#f59e0b'];
    // Edges
    if (d.edges || nodes.length >= 3) {
      const edges = (d.edges || []).slice(0, 6);
      if (edges.length) {
        edges.forEach((e) => {
          const from = positions[e.from] || positions[0];
          const to = positions[e.to] || positions[1];
          s.push(arrow([from.x, from.y], [to.x, to.y], { color: '#94a3b8', strokeWidth: 1.5, dashed: e.directed === false }));
          if (e.weight) s.push(txt(String(e.weight), (from.x + to.x) / 2, (from.y + to.y) / 2 - 6, { fontSize: 10, fontWeight: '700', color: '#64748b', textAnchor: 'middle' }));
        });
      } else {
        // Connect fully
        for (let i = 0; i < Math.min(nodes.length, 5); i++) {
          for (let j = i + 1; j < Math.min(nodes.length, 5); j++) {
            s.push(line([positions[i].x, positions[i].y], [positions[j].x, positions[j].y], { color: '#e2e8f0', strokeWidth: 1.5 }));
          }
        }
      }
    }
    // Nodes
    nodes.slice(0, 5).forEach((nd, i) => {
      const pos = positions[i];
      s.push(circle(pos.x, pos.y, 36, { fill: colors[i], stroke: colors[i] }));
      s.push(txt(anchor(itemText(nd), 3), pos.x, pos.y + 5, { fontSize: 12, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P32. REST API DESIGN ──────────────────────────────────────────────────────
define({
  id: 'prog_rest_api', intent: 'define', label: 'REST API design principles',
  capacity: { principles: 5 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const principles = (d.principles || d.items || []).slice(0, 5);
    const defs = [
      { title: 'Stateless', detail: 'Each request contains all info' },
      { title: 'Resource-Based', detail: 'URLs identify resources (/users/1)' },
      { title: 'HTTP Methods', detail: 'GET, POST, PUT, DELETE, PATCH' },
      { title: 'Representation', detail: 'JSON / XML as resource format' },
      { title: 'HATEOAS', detail: 'Links drive API navigation' },
    ];
    const list = principles.length ? principles : defs;
    const boxW = 700, boxH = 56, gap = 12;
    const x = (W - boxW) / 2;
    list.slice(0, 5).forEach((pr, i) => {
      const y = 122 + i * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 8 }));
      s.push(badge(String(i + 1), x - 18, y + 12, { bg: p.accent }));
      s.push(txt(anchor(itemText(pr.title || pr), 5), x + 30, y + 24, { fontSize: 14, fontWeight: '800', color: p.accent }));
      const st = '    \u2014  ' + anchor(pr.detail || pr.text || '', 10);
      if (pr.detail) s.push(txt(st, x + 30, y + 44, { fontSize: 11, fontWeight: '500', color: '#475569' }));
    });
    return s;
  },
});

// ── P33. CONCURRENCY MODELS ───────────────────────────────────────────────────
define({
  id: 'prog_concurrency', intent: 'compare', label: 'Concurrency models',
  capacity: { models: 3 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const models = (d.models || d.items || []).slice(0, 3);
    const defs = [
      { title: 'Threading', detail: 'Multiple threads share memory', pros: '+ Shared state, - Race conditions' },
      { title: 'Async / Event-driven', detail: 'Single thread, non-blocking I/O', pros: '+ Scalable, - Callback complexity' },
      { title: 'Actor Model', detail: 'Isolated actors pass messages', pros: '+ No shared state, - Message overhead' },
    ];
    const list = models.length ? models : defs;
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    const colors = ['#2563eb', '#ea580c', '#7c3aed'];
    list.slice(0, 3).forEach((m, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 240, { stroke: colors[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 130, boxW, 44, { fill: colors[i], stroke: colors[i], rx: 10 }));
      s.push(txt(anchor(itemText(m.title || m), 4), x + boxW / 2, 160, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      const icon = ['cog_icon', 'globe', 'users'][i];
      s.push(obj(icon, x + boxW / 2 - 16, 194, 32, 32, { accent: colors[i] }));
      if (m.detail) s.push(txt(anchor(m.detail, 9), x + boxW / 2, 260, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (m.pros) s.push(txt(anchor(m.pros, 12), x + boxW / 2, 300, { fontSize: 10, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P34. DYNAMIC PROGRAMMING ──────────────────────────────────────────────────
define({
  id: 'prog_dp_table', intent: 'formula', label: 'Dynamic programming table',
  capacity: { rows: 4, cols: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const rows = (d.rows || []).slice(0, 4);
    const cols = (d.cols || []).slice(0, 5);
    s.push(badge(d.algorithm || 'DP Table', 56, 104, { bg: p.accent }));
    if (d.problem) {
      s.push(rect(60, 115, 680, 36, { stroke: p.accent, strokeWidth: 1.6, fill: p.soft, rx: 6 }));
      s.push(txt(anchor(d.problem, 16), 80, 140, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
    }
    const rows_list = rows.length ? rows : [
      ['', '0', '1', '2', '3'],
      ['item 1', '0', '1', '1', '1'],
      ['item 2', '0', '1', '1', '2'],
      ['item 3', '0', '1', '2', '3'],
    ];
    const startY = d.problem ? 168 : 120;
    const cellW = Math.min(100, (680) / Math.max(rows_list[0]?.length || 1, 1));
    const cellH = 36;
    const tableW = cellW * (rows_list[0]?.length || 1);
    const x0 = (W - tableW) / 2;
    rows_list.forEach((row, r) => {
      row.forEach((cell, c) => {
        const x = x0 + c * cellW;
        const y = startY + r * cellH;
        const isHeader = r === 0 || c === 0;
        s.push(rect(x, y, cellW, cellH - 2, { stroke: isHeader ? p.accent : '#e2e8f0', strokeWidth: isHeader ? 1.8 : 1, fill: isHeader ? p.soft : '#ffffff', rx: 0 }));
        s.push(txt(anchor(cell, 4), x + cellW / 2, y + cellH / 2, { fontSize: 11, fontWeight: isHeader ? '700' : '500', color: isHeader ? p.accent : '#1e293b', textAnchor: 'middle' }));
      });
    });
    if (d.optimal) {
      s.push(rect(x0, startY + rows_list.length * cellH + 8, tableW, 36, { stroke: '#16a34a', strokeWidth: 2, fill: '#dcfce7', rx: 6 }));
      s.push(txt('Optimal: ' + anchor(d.optimal, 14), x0 + 16, startY + rows_list.length * cellH + 30, { fontSize: 13, fontWeight: '800', color: '#15803d' }));
    }
    return s;
  },
});

// ── P35. WEB SECURITY ─────────────────────────────────────────────────────────
define({
  id: 'prog_web_security', intent: 'define', label: 'Web security threats',
  capacity: { threats: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const threats = (d.threats || d.items || []).slice(0, 4);
    const defs = [
      { title: 'XSS', detail: 'Cross-Site Scripting injection' },
      { title: 'CSRF', detail: 'Cross-Site Request Forgery' },
      { title: 'SQL Injection', detail: 'Malicious DB query injection' },
      { title: 'Sensitive Data', detail: 'Insecure data exposure' },
    ];
    const list = threats.length ? threats : defs;
    const icons = ['warning', 'lock', 'database', 'search'];
    const colors = ['#dc2626', '#ea580c', '#7c3aed', '#2563eb'];
    const boxW = 170, gap = (W - 80 - 170 * 4) / 3;
    list.slice(0, 4).forEach((th, i) => {
      const x = 40 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 180, { stroke: colors[i], strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      s.push(obj(icons[i], x + boxW / 2 - 20, 150, 40, 40, { accent: colors[i] }));
      s.push(txt(anchor(itemText(th.title || th), 4), x + boxW / 2, 224, { fontSize: 15, fontWeight: '800', color: colors[i], textAnchor: 'middle' }));
      if (th.detail) s.push(txt(anchor(th.detail, 6), x + boxW / 2, 254, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      // Mitigation
      if (th.mitigation) {
        s.push(rect(x + 8, 278, boxW - 16, 22, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 }));
        s.push(txt('\u2713 ' + anchor(th.mitigation, 6), x + boxW / 2, 295, { fontSize: 9, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
      }
    });
    return s;
  },
});

// ── P36. FUNCTIONAL PROGRAMMING ───────────────────────────────────────────────
define({
  id: 'prog_functional', intent: 'define', label: 'Functional programming concepts',
  capacity: { concepts: 4 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const concepts = (d.concepts || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Pure Functions', detail: 'No side effects, same input = same output' },
      { title: 'Immutability', detail: 'Data never changes in place' },
      { title: 'Higher-Order', detail: 'Functions that take/return functions' },
      { title: 'Lazy Evaluation', detail: 'Compute only when needed' },
    ];
    const list = concepts.length ? concepts : defs;
    const boxW = 350, boxH = 100, gap = 16;
    const x0 = (W - boxW * 2 - gap) / 2;
    const colors = ['#16a34a', '#2563eb', '#7c3aed', '#ea580c'];
    list.slice(0, 4).forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = x0 + col * (boxW + gap);
      const y = 130 + row * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: colors[i], strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, y, boxW, 6, { fill: colors[i], stroke: colors[i], rx: 0 }));
      s.push(txt(anchor(itemText(c.title || c), 5), x + 16, y + 36, { fontSize: 15, fontWeight: '800', color: colors[i] }));
      if (c.detail) s.push(txt(anchor(c.detail, 11), x + 16, y + 66, { fontSize: 11, fontWeight: '500', color: '#475569' }));
    });
    return s;
  },
});

// ── P37. REGULAR EXPRESSIONS ──────────────────────────────────────────────────
define({
  id: 'prog_regex', intent: 'define', label: 'Regular expression breakdown',
  capacity: { parts: 5 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const parts = (d.parts || d.items || []).slice(0, 5);
    s.push(badge('Pattern', 56, 104, { bg: p.accent }));
    // Pattern display
    const pattern = d.pattern || '/[A-Z]+\\d+/g';
    s.push(rect(60, 120, 680, 48, { fill: '#0f172a', stroke: '#0f172a', rx: 8 }));
    s.push(txt(pattern, 400, 152, { fontSize: 18, fontWeight: '700', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
    // Breakdown
    const defs = [
      { symbol: '/', meaning: 'Delimiter (start)' },
      { symbol: '[A-Z]+', meaning: 'One or more uppercase letters' },
      { symbol: '\\d+', meaning: 'One or more digits' },
      { symbol: '/', meaning: 'Delimiter (end)' },
      { symbol: 'g', meaning: 'Global flag (all matches)' },
    ];
    const list = parts.length ? parts : defs;
    const boxW = 130, gap = 14;
    const x0 = (W - boxW * list.length - gap * (list.length - 1)) / 2;
    list.forEach((pt, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 190, boxW, 100, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
      const sym = itemText(pt.symbol || pt.title || pt);
      s.push(rect(x + 10, 200, boxW - 20, 30, { fill: '#0f172a', stroke: '#0f172a', rx: 4 }));
      s.push(txt(sym, x + boxW / 2, 220, { fontSize: 13, fontWeight: '700', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
      if (pt.meaning || pt.detail) {
        s.push(txt(anchor(pt.meaning || pt.detail, 6), x + boxW / 2, 264, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      }
    });
    // Example match
    if (d.example) {
      s.push(rect(60, 320, 680, 44, { stroke: '#16a34a', strokeWidth: 1.8, fill: '#dcfce7', rx: 8 }));
      s.push(txt('Match: ' + anchor(d.example, 14), 80, 350, { fontSize: 13, fontWeight: '700', color: '#15803d' }));
    }
    return s;
  },
});

// ── P38. GRAPHQL VS REST ──────────────────────────────────────────────────────
define({
  id: 'prog_graphql_vs_rest', intent: 'compare', label: 'GraphQL vs REST comparison',
  capacity: { points: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const points = (d.points || d.items || []).slice(0, 4);
    const boxW = 330, gap = 40, boxH = 300;
    const x0 = (W - boxW * 2 - gap) / 2;
    // REST
    s.push(rect(x0, 120, boxW, boxH, { stroke: '#2563eb', strokeWidth: 2, fill: '#ffffff', rx: 10 }));
    s.push(rect(x0, 120, boxW, 44, { fill: '#2563eb', stroke: '#2563eb', rx: 10 }));
    s.push(txt(d.rest_title || 'REST', x0 + boxW / 2, 150, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const restFeatures = [
      'Multiple endpoints', 'Fixed data shape', 'HTTP caching', 'Over/under-fetching',
    ];
    restFeatures.forEach((rf, i) => {
      const y = 186 + i * 44;
      s.push(circle(x0 + 20, y + 8, 6, { fill: '#2563eb', stroke: '#2563eb' }));
      s.push(txt(rf, x0 + 36, y + 14, { fontSize: 12, fontWeight: '500', color: '#334155' }));
    });
    // GraphQL
    const gx = x0 + boxW + gap;
    s.push(rect(gx, 120, boxW, boxH, { stroke: '#e535ab', strokeWidth: 2, fill: '#ffffff', rx: 10 }));
    s.push(rect(gx, 120, boxW, 44, { fill: '#e535ab', stroke: '#e535ab', rx: 10 }));
    s.push(txt(d.graphql_title || 'GraphQL', gx + boxW / 2, 150, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const gqlFeatures = [
      'Single endpoint', 'Client-defined shape', 'No HTTP caching', 'No over-fetching',
    ];
    gqlFeatures.forEach((gf, i) => {
      const y = 186 + i * 44;
      s.push(circle(gx + 20, y + 8, 6, { fill: '#e535ab', stroke: '#e535ab' }));
      s.push(txt(gf, gx + 36, y + 14, { fontSize: 12, fontWeight: '500', color: '#334155' }));
    });
    // Comparison points
    points.forEach((pt, i) => {
      const y = 440 + i * 18;
      s.push(txt('\u2022 ' + anchor(itemText(pt), 12), W / 2, y, { fontSize: 11, color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P39. CACHING STRATEGIES ───────────────────────────────────────────────────
define({
  id: 'prog_caching', intent: 'process', label: 'Caching strategies',
  capacity: { strategies: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const strategies = (d.strategies || d.items || []).slice(0, 4);
    const defs = ['Cache Aside', 'Read Through', 'Write Through', 'Write Behind'];
    const list = strategies.length ? strategies : defs.map((t) => ({ title: t }));
    const boxW = 180, gap = 14;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    // Application & database as context
    s.push(obj('server', 40, 120, 60, 60, { accent: p.accent }));
    s.push(txt('App', 70, 190, { fontSize: 11, fontWeight: '700', color: '#475569', textAnchor: 'middle' }));
    s.push(obj('database', 700, 120, 60, 60, { accent: p.accent }));
    s.push(txt('DB', 730, 190, { fontSize: 11, fontWeight: '700', color: '#475569', textAnchor: 'middle' }));
    list.slice(0, 4).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 210, boxW, 150, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 8 }));
      s.push(badge(st.title || st, x + 10, 198, { bg: p.accent, fontSize: 10 }));
      const icon = ['star', 'clock', 'lock', 'rocket'][i];
      s.push(obj(icon, x + boxW / 2 - 16, 240, 32, 32, { accent: p.accent }));
      if (st.detail) s.push(txt(anchor(st.detail, 7), x + boxW / 2, 310, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      // Arrow to/from
      s.push(arrow([100, 240], [x, 240], { color: '#94a3b8', strokeWidth: 1.2, dashed: true }));
      s.push(arrow([x + boxW, 280], [700, 280], { color: '#94a3b8', strokeWidth: 1.2, dashed: true }));
    });
    return s;
  },
});

// ── P40. WEB RENDERING PATTERNS ───────────────────────────────────────────────
define({
  id: 'prog_rendering', intent: 'compare', label: 'Web rendering patterns',
  capacity: { patterns: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const patterns = (d.patterns || d.items || []).slice(0, 3);
    const defs = [
      { title: 'SSR', detail: 'Server renders HTML', icons: 'server' },
      { title: 'CSR', detail: 'Browser renders JS', icons: 'person' },
      { title: 'SSG', detail: 'Pre-built static HTML', icons: 'building' },
    ];
    const list = patterns.length ? patterns : defs;
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    const colors = ['#2563eb', '#ea580c', '#16a34a'];
    list.slice(0, 3).forEach((pt, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 250, { stroke: colors[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 130, boxW, 8, { fill: colors[i], stroke: colors[i], rx: 0 }));
      s.push(obj(defs[i].icons, x + boxW / 2 - 20, 160, 40, 40, { accent: colors[i] }));
      s.push(txt(anchor(itemText(pt.title || pt), 4), x + boxW / 2, 230, { fontSize: 18, fontWeight: '800', color: colors[i], textAnchor: 'middle' }));
      if (pt.detail) s.push(txt(anchor(pt.detail, 10), x + boxW / 2, 268, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      const pros = (pt.pros || (i === 0 ? 'SEO-friendly' : i === 1 ? 'Rich interactivity' : 'Fastest TTFB'));
      s.push(rect(x + 14, 300, boxW - 28, 26, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 }));
      s.push(txt('\u2713 ' + anchor(pros, 6), x + boxW / 2, 320, { fontSize: 10, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
      const cons = (pt.cons || (i === 0 ? 'Server load' : i === 1 ? 'Slower TTFB' : 'Less dynamic'));
      s.push(rect(x + 14, 332, boxW - 28, 26, { fill: '#fee2e2', stroke: '#dc2626', strokeWidth: 1, rx: 4 }));
      s.push(txt('\u2717 ' + anchor(cons, 6), x + boxW / 2, 352, { fontSize: 10, fontWeight: '600', color: '#991b1b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P41. ERROR HANDLING PATTERNS ──────────────────────────────────────────────
define({
  id: 'prog_error_handling', intent: 'process', label: 'Error handling patterns',
  capacity: { strategies: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const strategies = (d.strategies || d.items || []).slice(0, 4);
    const defs = ['Try/Catch', 'Result Type', 'Error Middleware', 'Fallback Value'];
    const list = strategies.length ? strategies : defs.map((t) => ({ title: t }));
    const boxW = 170, gap = 14;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    list.slice(0, 4).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 160, boxW, 180, { stroke: p.accent, strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, 160, boxW, 44, { fill: p.accent, stroke: p.accent, rx: 8 }));
      s.push(obj(['shield', 'key', 'building', 'star'][i], x + boxW / 2 - 14, 168, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, 224, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (st.detail) {
        s.push(txt(anchor(st.detail, 7), x + boxW / 2, 264, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      }
      if (st.code) {
        s.push(rect(x + 8, 280, boxW - 16, 40, { fill: '#0f172a', stroke: '#0f172a', rx: 4 }));
        s.push(txt(anchor(st.code, 4), x + boxW / 2, 304, { fontSize: 9, fontWeight: '600', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
      }
    });
    return s;
  },
});

// ── P42. VERSION CONTROL CONCEPTS ─────────────────────────────────────────────
define({
  id: 'prog_version_control', intent: 'define', label: 'Version control concepts',
  capacity: { concepts: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const concepts = (d.concepts || d.items || []).slice(0, 5);
    const defs = ['Repository', 'Commit', 'Branch', 'Merge', 'Remote'];
    const list = concepts.length ? concepts : defs.map((t) => ({ title: t }));
    const boxW = 700, boxH = 50, gap = 12;
    const x = (W - boxW) / 2;
    list.slice(0, 5).forEach((c, i) => {
      const y = 120 + i * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 8 }));
      const icons = ['folder', 'pencil_edit', 'flag', 'handshake', 'globe'];
      s.push(obj(icons[i], x + 14, y + 10, 28, 28, { accent: p.accent }));
      s.push(txt(anchor(itemText(c.title || c), 5), x + 56, y + 30, { fontSize: 15, fontWeight: '800', color: p.accent }));
      if (c.detail) s.push(txt('\u2014 ' + anchor(c.detail, 10), x + 56, y + 30, { fontSize: 12, fontWeight: '500', color: '#475569' }));
    });
    return s;
  },
});

// ── P43. LOAD BALANCING (HASH RING) ────────────────────────────────────────────
define({
  id: 'prog_load_balancing', intent: 'process', label: 'Load balancing (hash ring)',
  capacity: { nodes: 4, requests: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const nodes = (d.nodes || []).slice(0, 4);
    const reqs = (d.requests || []).slice(0, 3);
    const defNodes = ['Node A', 'Node B', 'Node C', 'Node D'];
    const defReqs = ['Req 1', 'Req 2', 'Req 3'];
    const nList = nodes.length ? nodes : defNodes.map((t) => ({ title: t }));
    const rList = reqs.length ? reqs : defReqs.map((t) => ({ title: t }));
    const cx = 400, cy = 280, R = 140;
    const colors = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#f59e0b', '#db2777', '#0284c7'];
    s.push(circle(cx, cy, R, { stroke: p.accent, strokeWidth: 2, fill: 'none' }));
    s.push(circle(cx, cy, 36, { fill: p.accent, stroke: p.accent }));
    s.push(txt('Hash Ring', cx, cy + 5, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    nList.slice(0, 4).forEach((nd, i) => {
      const ang = (360 / nList.length) * i - 90;
      const rad = ang * (Math.PI / 180);
      const nx = cx + Math.cos(rad) * R;
      const ny = cy + Math.sin(rad) * R;
      const col = colors[i % colors.length];
      s.push(circle(nx, ny, 28, { fill: col, stroke: col }));
      s.push(txt(anchor(itemText(nd.title || nd), 3), nx, ny + 5, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    });
    rList.slice(0, 3).forEach((rq, i) => {
      const ang = (360 / rList.length) * i + 20;
      const rad = ang * (Math.PI / 180);
      const rx = cx + Math.cos(rad) * (R - 50);
      const ry = cy + Math.sin(rad) * (R - 50);
      s.push(circle(rx, ry, 16, { fill: '#f8fafc', stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(anchor(itemText(rq.title || rq), 2), rx, ry + 5, { fontSize: 9, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
      const nearest = i % nList.length;
      const nAng = (360 / nList.length) * nearest - 90;
      const nRad = nAng * (Math.PI / 180);
      const nnx = cx + Math.cos(nRad) * R;
      const nny = cy + Math.sin(nRad) * R;
      s.push(arrow([rx + 14, ry], [nnx - 20, nny], { color: p.accent, strokeWidth: 1.5, dashed: true }));
    });
    s.push(txt('Consistent hashing distributes requests evenly', 400, 460, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P44. PROCESS STATES ──────────────────────────────────────────────────────
define({
  id: 'prog_process_states', intent: 'process', label: 'Process states diagram',
  capacity: { states: 5 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const states = (d.states || d.items || []).slice(0, 5);
    const defs = ['New', 'Ready', 'Running', 'Waiting', 'Terminated'];
    const list = states.length ? states : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const positions = [
      { x: 150, y: 160 }, { x: 400, y: 130 }, { x: 650, y: 160 },
      { x: 400, y: 300 }, { x: 400, y: 420 },
    ];
    const cols = ['#64748b', '#2563eb', '#16a34a', '#f59e0b', '#dc2626'];
    list.slice(0, n).forEach((st, i) => {
      const pos = positions[i];
      s.push(rect(pos.x - 60, pos.y - 24, 120, 48, { stroke: cols[i], strokeWidth: 2.5, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 24 }));
      s.push(txt(anchor(itemText(st.title || st), 4), pos.x, pos.y + 5, { fontSize: 13, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
    });
    if (n >= 2) {
      s.push(arrow([210, 160], [340, 145], { color: '#2563eb', strokeWidth: 2 }));
      s.push(arrow([460, 140], [590, 160], { color: '#16a34a', strokeWidth: 2 }));
      s.push(path('M 650 184 Q 710 240 650 290', { stroke: '#f59e0b', strokeWidth: 2, markerEnd: 'arrow' }));
      s.push(arrow([460, 140], [400, 280], { color: '#f59e0b', strokeWidth: 1.8, dashed: true }));
      s.push(path('M 340 145 Q 300 100 240 150', { stroke: '#2563eb', strokeWidth: 1.8, dashed: true }));
      s.push(arrow([400, 348], [400, 400], { color: '#dc2626', strokeWidth: 2 }));
    }
    s.push(txt('Admitted', 320, 115, { fontSize: 9, color: '#64748b', textAnchor: 'middle' }));
    s.push(txt('I/O wait', 430, 260, { fontSize: 9, color: '#64748b', textAnchor: 'middle' }));
    s.push(txt('Exit', 420, 385, { fontSize: 9, color: '#64748b', textAnchor: 'middle' }));
    return s;
  },
});

// ── P45. TCP VS UDP COMPARISON ─────────────────────────────────────────────────
define({
  id: 'prog_tcp_vs_udp', intent: 'compare', label: 'TCP vs UDP comparison',
  capacity: { points: 5 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const points = (d.points || d.items || []).slice(0, 5);
    const defs = ['Connection-oriented', 'Reliable delivery', 'Ordered packets', 'Error checking', 'Slower speed'];
    const udpDefs = ['Connectionless', 'No guarantee', 'No ordering', 'Basic checksum', 'Faster speed'];
    const list = points.length ? points : defs.map((t, i) => ({ title: t, udp: udpDefs[i] }));
    s.push(rect(50, 110, 340, 44, { fill: '#2563eb', stroke: '#2563eb', rx: 8 }));
    s.push(txt('TCP', 220, 140, { fontSize: 18, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(410, 110, 340, 44, { fill: '#ea580c', stroke: '#ea580c', rx: 8 }));
    s.push(txt('UDP', 580, 140, { fontSize: 18, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    list.slice(0, 5).forEach((pt, i) => {
      const y = 172 + i * 52;
      s.push(rect(50, y, 340, 42, { stroke: '#2563eb', strokeWidth: 1.4, fill: i % 2 === 0 ? '#eff6ff' : '#ffffff', rx: 4 }));
      s.push(txt(anchor(itemText(pt.title || pt), 8), 70, y + 26, { fontSize: 12, fontWeight: '600', color: '#1e293b' }));
      s.push(rect(410, y, 340, 42, { stroke: '#ea580c', strokeWidth: 1.4, fill: i % 2 === 0 ? '#fff7ed' : '#ffffff', rx: 4 }));
      s.push(txt(anchor(pt.udp || '', 8), 430, y + 26, { fontSize: 12, fontWeight: '600', color: '#1e293b' }));
    });
    return s;
  },
});

// ── P46. BIT MANIPULATION OPERATORS ────────────────────────────────────────────
define({
  id: 'prog_bit_ops', intent: 'define', label: 'Bit manipulation operators',
  capacity: { ops: 6 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const ops = (d.ops || d.items || []).slice(0, 6);
    const defs = [
      { symbol: '&', name: 'AND', detail: 'Sets bit if both are 1' },
      { symbol: '|', name: 'OR', detail: 'Sets bit if either is 1' },
      { symbol: '^', name: 'XOR', detail: 'Sets bit if different' },
      { symbol: '~', name: 'NOT', detail: 'Flips all bits' },
      { symbol: '<<', name: 'Left Shift', detail: 'Shifts bits left, fills 0' },
      { symbol: '>>', name: 'Right Shift', detail: 'Shifts bits right, sign-extend' },
    ];
    const list = ops.length ? ops : defs;
    const boxW = 220, boxH = 80, gap = 20;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    list.slice(0, 6).forEach((op, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = x0 + col * (boxW + gap);
      const y = 120 + row * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.8, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 8 }));
      s.push(badge(op.symbol || '', x + 8, y - 10, { bg: p.accent }));
      s.push(txt(anchor(op.name || op, 4), x + 70, y + 30, { fontSize: 14, fontWeight: '800', color: p.accent }));
      if (op.detail) s.push(txt(anchor(op.detail, 7), x + 70, y + 58, { fontSize: 10, fontWeight: '500', color: '#475569' }));
    });
    return s;
  },
});

// ── P47. CONTAINERIZATION (DOCKER) ─────────────────────────────────────────────
define({
  id: 'prog_containerization', intent: 'hierarchy', label: 'Docker architecture',
  capacity: { layers: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const layers = (d.layers || d.items || []).slice(0, 4);
    const defs = ['App Container', 'Container Engine', 'Host OS', 'Infrastructure'];
    const list = layers.length ? layers : defs.map((t) => ({ title: t }));
    const boxW = 560, boxH = 70, gap = 16;
    const x = (W - boxW) / 2;
    const icons = ['rocket', 'cog_icon', 'building', 'globe'];
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#64748b'];
    list.slice(0, 4).forEach((l, i) => {
      const y = 112 + i * (boxH + gap);
      const isFirst = i === 0;
      s.push(rect(x, y, boxW, boxH, { stroke: cols[i], strokeWidth: isFirst ? 2.5 : 1.8, fill: isFirst ? p.soft : '#ffffff', rx: 8 }));
      s.push(rect(x, y, boxW, 6, { fill: cols[i], stroke: cols[i], rx: 0 }));
      s.push(obj(icons[i], x + 16, y + 18, 34, 34, { accent: cols[i] }));
      s.push(txt(anchor(itemText(l.title || l), 6), x + 66, y + 42, { fontSize: 15, fontWeight: '800', color: cols[i] }));
      if (l.detail) s.push(txt(anchor(l.detail, 12), x + 66, y + 58, { fontSize: 10, fontWeight: '500', color: '#64748b' }));
    });
    s.push(txt('Containers share host OS kernel', 400, 450, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P48. TIME COMPLEXITY CHEAT SHEET ────────────────────────────────────────────
define({
  id: 'prog_time_complexity', intent: 'formula', label: 'Time complexity cheat sheet',
  capacity: { ops: 6 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const ops = (d.ops || d.items || []).slice(0, 6);
    const defs = [
      { op: 'Array access', bigO: 'O(1)' },
      { op: 'Binary search', bigO: 'O(log n)' },
      { op: 'Linear search', bigO: 'O(n)' },
      { op: 'Merge sort', bigO: 'O(n log n)' },
      { op: 'Bubble sort', bigO: 'O(n\u00b2)' },
      { op: 'Fibonacci (naive)', bigO: 'O(2\u207f)' },
    ];
    const list = ops.length ? ops : defs;
    s.push(badge('Operation', 56, 104, { bg: p.accent }));
    s.push(badge('Big-O', 560, 104, { bg: p.accent }));
    const cols = ['#16a34a', '#16a34a', '#f59e0b', '#f59e0b', '#dc2626', '#dc2626'];
    list.slice(0, 6).forEach((op, i) => {
      const y = 132 + i * 48;
      s.push(rect(56, y, 480, 38, { stroke: '#e2e8f0', strokeWidth: 1, fill: i % 2 === 0 ? '#ffffff' : '#f8fafc', rx: 4 }));
      s.push(circle(76, y + 19, 5, { fill: cols[i], stroke: cols[i] }));
      s.push(txt(anchor(itemText(op.op || op.title || op), 16), 92, y + 26, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
      s.push(rect(560, y, 184, 38, { stroke: cols[i], strokeWidth: 1.8, fill: i % 2 === 0 ? '#ffffff' : '#f8fafc', rx: 4 }));
      s.push(txt(op.bigO || '', 652, y + 26, { fontSize: 14, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
    });
    s.push(txt('Green = fast, Yellow = ok, Red = slow', 400, 460, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P49. COMPONENT TREE ─────────────────────────────────────────────────────────
define({
  id: 'prog_component_tree', intent: 'hierarchy', label: 'React component tree',
  capacity: { components: 7 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const components = (d.components || d.items || []).slice(0, 7);
    const defs = ['App', 'Header', 'Sidebar', 'Main', 'Footer', 'NavItem', 'Content'];
    const list = components.length ? components : defs.map((t) => ({ title: t }));
    const cx = 400, rootY = 110;
    s.push(rect(cx - 50, rootY, 100, 38, { fill: p.accent, stroke: p.accent, rx: 8 }));
    s.push(txt(anchor(itemText(list[0] || 'App'), 4), cx, rootY + 25, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const l2 = list.slice(1, 4);
    const l2x = [180, 400, 620];
    l2x.forEach((lx, i) => {
      const ly = 190;
      s.push(line([cx, rootY + 38], [lx, ly - 6], { color: p.accent, strokeWidth: 2 }));
      s.push(rect(lx - 44, ly, 88, 34, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 6 }));
      s.push(txt(anchor(itemText(l2[i] || ''), 4), lx, ly + 22, { fontSize: 11, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
    });
    s.push(txt('Unidirectional data flow', 400, 440, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P50. WEBHOOK VS POLLING ─────────────────────────────────────────────────────
define({
  id: 'prog_webhook_vs_polling', intent: 'compare', label: 'Webhook vs polling',
  capacity: { points: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const points = (d.points || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Trigger', polling: 'Client asks periodically', webhook: 'Server pushes on event' },
      { title: 'Latency', polling: 'Up to interval delay', webhook: 'Near real-time' },
      { title: 'Efficiency', polling: 'Wasteful if idle', webhook: 'Efficient, event-driven' },
      { title: 'Complexity', polling: 'Simple timer loop', webhook: 'Need endpoint exposure' },
    ];
    const list = points.length ? points : defs;
    s.push(rect(50, 110, 340, 42, { fill: '#f59e0b', stroke: '#f59e0b', rx: 8 }));
    s.push(txt('Polling', 220, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(410, 110, 340, 42, { fill: '#16a34a', stroke: '#16a34a', rx: 8 }));
    s.push(txt('Webhook', 580, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    list.slice(0, 4).forEach((pt, i) => {
      const y = 170 + i * 68;
      s.push(rect(50, y, 340, 56, { stroke: '#f59e0b', strokeWidth: 1.4, fill: i % 2 === 0 ? '#fffbeb' : '#ffffff', rx: 6 }));
      s.push(txt(anchor(itemText(pt.title || pt), 4), 220, y + 14, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
      s.push(txt(anchor(pt.polling || '', 8), 220, y + 36, { fontSize: 10, fontWeight: '500', color: '#64748b', textAnchor: 'middle' }));
      s.push(rect(410, y, 340, 56, { stroke: '#16a34a', strokeWidth: 1.4, fill: i % 2 === 0 ? '#f0fdf4' : '#ffffff', rx: 6 }));
      s.push(txt(anchor(itemText(pt.title || ''), 4), 580, y + 14, { fontSize: 12, fontWeight: '700', color: '#16a34a', textAnchor: 'middle' }));
      s.push(txt(anchor(pt.webhook || '', 8), 580, y + 36, { fontSize: 10, fontWeight: '500', color: '#64748b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P51. GARBAGE COLLECTION ─────────────────────────────────────────────────────
define({
  id: 'prog_gc_mark_sweep', intent: 'process', label: 'Garbage collection (mark & sweep)',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.items || []).slice(0, 4);
    const defs = ['Root Set', 'Mark Phase', 'Sweep Phase', 'Compact'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const icons = ['star', 'search', 'trash', 'folder'];
    const cols = ['#2563eb', '#f59e0b', '#dc2626', '#16a34a'];
    const boxW = 170, gap = 14;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    list.slice(0, 4).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 150, boxW, 200, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 150, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(badge(String(i + 1), x + boxW - 20, 138, { bg: cols[i] }));
      s.push(obj(icons[i], x + boxW / 2 - 18, 210, 36, 36, { accent: cols[i] }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, 272, { fontSize: 13, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 7), x + boxW / 2, 300, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (i < 3) s.push(arrow([x + boxW + 4, 250], [x + boxW + gap - 4, 250], { color: cols[i], strokeWidth: 2 }));
    });
    s.push(txt('Mark live objects, sweep unreachable ones', 400, 450, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P52. SEARCH ALGORITHMS (BFS, DFS, BINARY) ──────────────────────────────────
define({
  id: 'prog_search_algorithms', intent: 'compare', label: 'Search algorithm comparison',
  capacity: { algorithms: 3 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const algorithms = (d.algorithms || d.items || []).slice(0, 3);
    const defs = [
      { title: 'Binary Search', detail: 'Divide & conquer on sorted array', time: 'O(log n)', space: 'O(1)' },
      { title: 'BFS (Breadth-First)', detail: 'Level-by-level traversal', time: 'O(V+E)', space: 'O(V)' },
      { title: 'DFS (Depth-First)', detail: 'Go deep, then backtrack', time: 'O(V+E)', space: 'O(h)' },
    ];
    const list = algorithms.length ? algorithms : defs;
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    const cols = ['#2563eb', '#16a34a', '#7c3aed'];
    list.slice(0, 3).forEach((a, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 120, boxW, 260, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 120, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(txt(anchor(itemText(a.title || a), 5), x + boxW / 2, 150, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      const icon = ['search', 'tree', 'cog_icon'][i];
      s.push(obj(icon, x + boxW / 2 - 18, 182, 36, 36, { accent: cols[i] }));
      if (a.detail) s.push(txt(anchor(a.detail, 9), x + boxW / 2, 250, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (a.time) { s.push(rect(x + 14, 280, boxW - 28, 26, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 })); s.push(txt('Time: ' + (a.time || ''), x + boxW / 2, 298, { fontSize: 10, fontWeight: '700', color: '#166534', textAnchor: 'middle' })); }
      if (a.space) { s.push(rect(x + 14, 312, boxW - 28, 26, { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 1, rx: 4 })); s.push(txt('Space: ' + (a.space || ''), x + boxW / 2, 330, { fontSize: 10, fontWeight: '700', color: '#1e40af', textAnchor: 'middle' })); }
    });
    return s;
  },
});

// ── P53. SDLC (WATERFALL) ──────────────────────────────────────────────────────
define({
  id: 'prog_sdlc_waterfall', intent: 'process', label: 'SDLC waterfall phases',
  capacity: { phases: 6 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const phases = (d.phases || d.steps || []).slice(0, 6);
    const defs = ['Requirements', 'Design', 'Implementation', 'Testing', 'Deployment', 'Maintenance'];
    const list = phases.length ? phases : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 6);
    const boxW = 120, boxH = 60, gap = 10;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#2563eb', '#7c3aed', '#ea580c', '#f59e0b', '#16a34a', '#64748b'];
    list.slice(0, n).forEach((ph, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 220, boxW, boxH, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(txt(anchor(itemText(ph.title || ph), 4), x + boxW / 2, 254, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, 250], [x + boxW + gap - 2, 250], { color: '#94a3b8', strokeWidth: 2.5 }));
      s.push(line([x + boxW / 2, 160], [x + boxW / 2, 218], { color: cols[i], strokeWidth: 2 }));
      s.push(txt(String(i + 1), x + boxW / 2, 148, { fontSize: 12, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
    });
    s.push(txt('Sequential phases, each depends on previous', 400, 340, { fontSize: 12, color: '#64748b', textAnchor: 'middle' }));
    s.push(txt('Water flows downward, no backtracking', 400, 360, { fontSize: 11, color: '#94a3b8', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P54. NULL HANDLING PATTERNS ────────────────────────────────────────────────
define({
  id: 'prog_null_handling', intent: 'compare', label: 'Null handling across languages',
  capacity: { langs: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const langs = (d.langs || d.items || []).slice(0, 5);
    const defs = [
      { lang: 'JavaScript', syntax: 'null / undefined', pattern: '?? || optional chaining' },
      { lang: 'Java', syntax: 'null', pattern: 'Optional<T> or @Nullable' },
      { lang: 'Kotlin', syntax: 'null', pattern: '?., ?:, !! operators' },
      { lang: 'Rust', syntax: 'Option<T>', pattern: 'Some / None enum' },
      { lang: 'Python', syntax: 'None', pattern: 'Optional[T] type hint' },
    ];
    const list = langs.length ? langs : defs;
    s.push(badge('Language', 56, 104, { bg: p.accent }));
    s.push(badge('Null Concept', 260, 104, { bg: '#64748b' }));
    s.push(badge('Safe Pattern', 520, 104, { bg: '#16a34a' }));
    list.slice(0, 5).forEach((l, i) => {
      const y = 130 + i * 58;
      s.push(rect(56, y, 180, 46, { stroke: p.accent, strokeWidth: 1.4, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 4 }));
      s.push(txt(l.lang || '', 146, y + 28, { fontSize: 13, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      s.push(rect(248, y, 250, 46, { stroke: '#e2e8f0', strokeWidth: 1.2, fill: '#ffffff', rx: 4 }));
      s.push(txt(anchor(l.syntax || '', 8), 373, y + 28, { fontSize: 12, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      s.push(rect(510, y, 250, 46, { stroke: '#16a34a', strokeWidth: 1.2, fill: '#f0fdf4', rx: 4 }));
      s.push(txt(anchor(l.pattern || '', 10), 635, y + 28, { fontSize: 11, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P55. PROMISE LIFECYCLE ──────────────────────────────────────────────────────
define({
  id: 'prog_promise_lifecycle', intent: 'process', label: 'Promise lifecycle',
  capacity: { states: 3 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const states = (d.states || d.items || []).slice(0, 3);
    const defs = ['Pending', 'Fulfilled', 'Rejected'];
    const list = states.length ? states : defs.map((t) => ({ title: t }));
    const cx = [180, 400, 620];
    const cols = ['#f59e0b', '#16a34a', '#dc2626'];
    const icons = ['clock', 'star', 'warning'];
    list.slice(0, 3).forEach((st, i) => {
      s.push(circle(cx[i], 240, 48, { fill: cols[i], stroke: cols[i] }));
      s.push(txt(anchor(itemText(st.title || st), 4), cx[i], 245, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(obj(icons[i], cx[i] - 14, 270, 28, 28, { accent: '#ffffff' }));
      if (st.detail) s.push(txt(anchor(st.detail, 8), cx[i], 320, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    });
    s.push(arrow([228, 240], [352, 240], { color: '#16a34a', strokeWidth: 2.5 }));
    s.push(arrow([228, 240], [352, 240], { color: '#dc2626', strokeWidth: 2.5, dashed: true }));
    s.push(txt('resolve()', 290, 216, { fontSize: 11, fontWeight: '700', color: '#16a34a', textAnchor: 'middle' }));
    s.push(txt('reject()', 290, 260, { fontSize: 11, fontWeight: '700', color: '#dc2626', textAnchor: 'middle' }));
    s.push(txt('Once settled, a promise never changes state', 400, 420, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P56. CODE REVIEW CHECKLIST ─────────────────────────────────────────────────
define({
  id: 'prog_code_review', intent: 'define', label: 'Code review checklist',
  capacity: { items: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.checklist || []).slice(0, 6);
    const defs = [
      'Correctness: Does it work as expected?',
      'Readability: Is the code clear?',
      'Performance: Any obvious bottlenecks?',
      'Security: Are inputs sanitized?',
      'Testing: Are there proper tests?',
      'Style: Does it follow conventions?',
    ];
    const list = items.length ? items : defs;
    const cols = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0d9488'];
    list.slice(0, 6).forEach((it, i) => {
      const y = 120 + i * 52;
      s.push(rect(80, y, 640, 42, { stroke: cols[i], strokeWidth: 1.6, fill: i % 2 === 0 ? '#ffffff' : '#f8fafc', rx: 6 }));
      s.push(circle(104, y + 21, 14, { fill: cols[i], stroke: cols[i] }));
      s.push(txt('\u2713', 104, y + 26, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(itemText(it), 18), 132, y + 28, { fontSize: 13, fontWeight: '600', color: '#1e293b' }));
    });
    return s;
  },
});

// ── P57. NETWORK TOPOLOGIES ─────────────────────────────────────────────────────
define({
  id: 'prog_network_topologies', intent: 'compare', label: 'Network topologies',
  capacity: { topologies: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const topologies = (d.topologies || d.items || []).slice(0, 4);
    const defs = ['Star', 'Bus', 'Ring', 'Mesh'];
    const list = topologies.length ? topologies : defs.map((t) => ({ title: t }));
    const boxW = 180, gap = 10;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    const cx = 400, cy = 260;
    list.slice(0, 4).forEach((tp, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 120, boxW, 260, { stroke: p.accent, strokeWidth: 1.8, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, 120, boxW, 36, { fill: p.accent, stroke: p.accent, rx: 8 }));
      s.push(txt(anchor(itemText(tp.title || tp), 4), x + boxW / 2, 144, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    });
    const nodes = [cx - 220, cx - 120, cx, cx + 120, cx + 220];
    const nCols = [p.accent, '#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    nodes.forEach((nx, i) => {
      s.push(circle(nx, cy, 8, { fill: nCols[i], stroke: nCols[i] }));
    });
    for (let i = 0; i < nodes.length - 1; i++) {
      s.push(line([nodes[i], cy], [nodes[i + 1], cy], { color: nCols[i], strokeWidth: 1.5 }));
    }
    s.push(line([nodes[0], cy], [nodes[4], cy], { color: '#7c3aed', strokeWidth: 1.5, dashed: true }));
    s.push(txt('Hybrid topologies combine multiple patterns', 400, 430, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P58. ENCRYPTION TYPES ──────────────────────────────────────────────────────
define({
  id: 'prog_encryption_types', intent: 'compare', label: 'Symmetric vs asymmetric encryption',
  capacity: { points: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const points = (d.points || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Keys', sym: 'Single shared key', asym: 'Public / private key pair' },
      { title: 'Speed', sym: 'Fast', asym: 'Slow (computationally heavy)' },
      { title: 'Use Case', sym: 'Bulk data encryption', asym: 'Key exchange, signatures' },
      { title: 'Algorithms', sym: 'AES, DES, ChaCha20', asym: 'RSA, ECC, DSA' },
    ];
    const list = points.length ? points : defs;
    s.push(rect(50, 110, 340, 42, { fill: '#f59e0b', stroke: '#f59e0b', rx: 8 }));
    s.push(txt('Symmetric', 220, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(410, 110, 340, 42, { fill: '#7c3aed', stroke: '#7c3aed', rx: 8 }));
    s.push(txt('Asymmetric', 580, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(callout('Same key encrypts & decrypts', 60, 163, 330));
    s.push(callout('Different keys for each direction', 420, 163, 330));
    list.slice(0, 4).forEach((pt, i) => {
      const y = 195 + i * 56;
      s.push(rect(50, y, 340, 44, { stroke: '#f59e0b', strokeWidth: 1.4, fill: i % 2 === 0 ? '#fffbeb' : '#ffffff', rx: 4 }));
      s.push(txt(anchor(pt.sym || '', 10), 220, y + 26, { fontSize: 12, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
      s.push(rect(410, y, 340, 44, { stroke: '#7c3aed', strokeWidth: 1.4, fill: i % 2 === 0 ? '#f5f3ff' : '#ffffff', rx: 4 }));
      s.push(txt(anchor(pt.asym || '', 10), 580, y + 26, { fontSize: 12, fontWeight: '600', color: '#1e293b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P59. DEADLOCK CONDITIONS ────────────────────────────────────────────────────
define({
  id: 'prog_deadlock_conditions', intent: 'define', label: 'Deadlock four conditions',
  capacity: { conditions: 4 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const conditions = (d.conditions || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Mutual Exclusion', detail: 'Resources cannot be shared' },
      { title: 'Hold & Wait', detail: 'Process holds resources while waiting' },
      { title: 'No Preemption', detail: 'Resources cannot be forcibly taken' },
      { title: 'Circular Wait', detail: 'Circular chain of processes waiting' },
    ];
    const list = conditions.length ? conditions : defs;
    const cols = ['#dc2626', '#ea580c', '#f59e0b', '#7c3aed'];
    const boxW = 370, boxH = 80, gap = 16;
    const x0 = (W - boxW * 2 - gap) / 2;
    list.slice(0, 4).forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = x0 + col * (boxW + gap);
      const y = 130 + row * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, y, boxW, 6, { fill: cols[i], stroke: cols[i], rx: 0 }));
      s.push(badge(String(i + 1), x + 8, y - 10, { bg: cols[i] }));
      s.push(txt(anchor(itemText(c.title || c), 5), x + 40, y + 34, { fontSize: 15, fontWeight: '800', color: cols[i] }));
      if (c.detail) s.push(txt(anchor(c.detail, 12), x + 40, y + 58, { fontSize: 11, fontWeight: '500', color: '#475569' }));
    });
    s.push(txt('All four must hold simultaneously for deadlock', 400, 440, { fontSize: 12, fontWeight: '700', color: '#dc2626', textAnchor: 'middle' }));
    return s;
  },
});

// ── P60. AGILE VS WATERFALL ─────────────────────────────────────────────────────
define({
  id: 'prog_agile_vs_waterfall', intent: 'compare', label: 'Agile vs waterfall',
  capacity: { points: 4 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const points = (d.points || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Approach', agile: 'Iterative & incremental', waterfall: 'Sequential phases' },
      { title: 'Requirements', agile: 'Evolving, flexible', waterfall: 'Fixed upfront' },
      { title: 'Delivery', agile: 'Continuous small releases', waterfall: 'Single final release' },
      { title: 'Team', agile: 'Cross-functional, self-organizing', waterfall: 'Specialized roles' },
    ];
    const list = points.length ? points : defs;
    s.push(rect(50, 110, 340, 42, { fill: '#0d9488', stroke: '#0d9488', rx: 8 }));
    s.push(txt('Agile', 220, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(410, 110, 340, 42, { fill: '#64748b', stroke: '#64748b', rx: 8 }));
    s.push(txt('Waterfall', 580, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    list.slice(0, 4).forEach((pt, i) => {
      const y = 170 + i * 68;
      s.push(rect(50, y, 340, 56, { stroke: '#0d9488', strokeWidth: 1.4, fill: i % 2 === 0 ? '#ccfbf1' : '#ffffff', rx: 6 }));
      s.push(txt(anchor(itemText(pt.title || pt), 4), 220, y + 14, { fontSize: 12, fontWeight: '700', color: '#0d9488', textAnchor: 'middle' }));
      s.push(txt(anchor(pt.agile || '', 8), 220, y + 38, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(410, y, 340, 56, { stroke: '#64748b', strokeWidth: 1.4, fill: i % 2 === 0 ? '#f8fafc' : '#ffffff', rx: 6 }));
      s.push(txt(anchor(itemText(pt.title || ''), 4), 580, y + 14, { fontSize: 12, fontWeight: '700', color: '#64748b', textAnchor: 'middle' }));
      s.push(txt(anchor(pt.waterfall || '', 8), 580, y + 38, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P61. DATA PIPELINE ARCHITECTURE ─────────────────────────────────────────────
define({
  id: 'prog_data_pipeline', intent: 'process', label: 'Data pipeline architecture',
  capacity: { stages: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || d.steps || []).slice(0, 5);
    const defs = ['Ingest', 'Process', 'Store', 'Analyze', 'Visualize'];
    const list = stages.length ? stages : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const boxW = 130, boxH = 70, gap = 12;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#2563eb', '#ea580c', '#f59e0b', '#16a34a', '#7c3aed'];
    const icons = ['database', 'cog_icon', 'folder', 'search', 'chart_up'];
    list.slice(0, n).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 200;
      s.push(rect(x, y, boxW, boxH, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + 6, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, y + 54, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, y + boxH / 2], [x + boxW + gap - 2, y + boxH / 2], { color: '#94a3b8', strokeWidth: 2.5 }));
    });
    s.push(rect(200, 310, 400, 50, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
    s.push(txt(anchor(d.pipeline_label || 'Data flows through stages', 18), 400, 340, { fontSize: 13, fontWeight: '600', color: p.accent, textAnchor: 'middle' }));
    s.push(txt('Extract -> Transform -> Load (ETL)', 400, 420, { fontSize: 12, fontWeight: '700', color: '#64748b', textAnchor: 'middle' }));
    return s;
  },
});

// ── P62. PROTOTYPE CHAIN ───────────────────────────────────────────────────────
define({
  id: 'prog_prototype_chain', intent: 'hierarchy', label: 'JS prototype chain',
  capacity: { chain: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const chain = (d.chain || d.items || []).slice(0, 4);
    const defs = ['myObject', 'Object.prototype', 'null'];
    const list = chain.length ? chain : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 4);
    const boxW = 260, boxH = 60, gap = 50;
    const total = boxH * n + gap * (n - 1);
    const y0 = (500 - total) / 2 + 30;
    const cols = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626'];
    list.slice(0, n).forEach((c, i) => {
      const y = y0 + i * (boxH + gap);
      s.push(rect(270, y, boxW, boxH, { stroke: cols[i], strokeWidth: 2.5, fill: i === 0 ? p.soft : '#ffffff', rx: 8 }));
      s.push(obj('folder', 286, y + 14, 32, 32, { accent: cols[i] }));
      s.push(txt(anchor(itemText(c.title || c), 5), 330, y + 36, { fontSize: 14, fontWeight: '800', color: cols[i] }));
      if (c.detail) s.push(txt(anchor(c.detail, 8), 330, y + 50, { fontSize: 10, fontWeight: '500', color: '#64748b' }));
      if (i < n - 1) {
        s.push(arrow([400, y + boxH], [400, y + boxH + gap - 10], { color: p.accent, strokeWidth: 2.5 }));
        s.push(txt('[[Prototype]] ->', 415, y + boxH + gap / 2 + 3, { fontSize: 9, fontWeight: '600', color: p.accent }));
      }
    });
    s.push(txt('Prototype chain ends at null', 400, 460, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P63. ERROR BOUNDARY ─────────────────────────────────────────────────────────
define({
  id: 'prog_error_boundary', intent: 'hierarchy', label: 'React error boundary pattern',
  capacity: { parts: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const parts = (d.parts || d.items || []).slice(0, 4);
    const defs = ['App', 'ErrorBoundary', 'Fallback UI', 'Child Component'];
    const list = parts.length ? parts : defs.map((t) => ({ title: t }));
    const cx = 400;
    s.push(rect(cx - 80, 110, 160, 42, { fill: '#64748b', stroke: '#64748b', rx: 8 }));
    s.push(txt(anchor(itemText(list[0] || 'App'), 4), cx, 138, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(line([cx, 152], [cx, 180], { color: '#94a3b8', strokeWidth: 2 }));
    s.push(rect(cx - 90, 180, 180, 100, { stroke: '#dc2626', strokeWidth: 2.5, fill: '#fef2f2', rx: 10 }));
    s.push(txt(anchor(itemText(list[1] || 'ErrorBoundary'), 5), cx, 210, { fontSize: 13, fontWeight: '800', color: '#dc2626', textAnchor: 'middle' }));
    s.push(txt('componentDidCatch', cx, 238, { fontSize: 10, fontWeight: '500', color: '#991b1b', textAnchor: 'middle' }));
    s.push(txt('getDerivedStateFromError', cx, 256, { fontSize: 10, fontWeight: '500', color: '#991b1b', textAnchor: 'middle' }));
    s.push(line([cx - 50, 280], [cx - 50, 310], { color: '#dc2626', strokeWidth: 2 }));
    s.push(line([cx + 50, 280], [cx + 50, 310], { color: '#dc2626', strokeWidth: 2 }));
    s.push(rect(cx - 110, 310, 120, 50, { stroke: '#f59e0b', strokeWidth: 1.8, fill: '#fffbeb', rx: 8 }));
    s.push(txt(anchor(itemText(list[2] || 'Fallback UI'), 4), cx - 50, 340, { fontSize: 12, fontWeight: '700', color: '#92400e', textAnchor: 'middle' }));
    s.push(rect(cx + 40, 310, 120, 50, { stroke: '#2563eb', strokeWidth: 1.8, fill: '#eff6ff', rx: 8 }));
    s.push(txt(anchor(itemText(list[3] || 'Child'), 4), cx + 100, 340, { fontSize: 12, fontWeight: '700', color: '#1e40af', textAnchor: 'middle' }));
    s.push(txt('Error boundary catches rendering errors', 400, 430, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P64. CODE SPLITTING STRATEGIES ──────────────────────────────────────────────
define({
  id: 'prog_code_splitting', intent: 'define', label: 'Code splitting strategies',
  capacity: { strategies: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const strategies = (d.strategies || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Route-based', detail: 'Split by page/route boundaries' },
      { title: 'Component-based', detail: 'Lazy load heavy components' },
      { title: 'Vendor splitting', detail: 'Separate libs from app code' },
      { title: 'Dynamic import', detail: 'import() on demand' },
    ];
    const list = strategies.length ? strategies : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    const boxW = 170, gap = 14;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    list.slice(0, 4).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 150, boxW, 200, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 150, boxW, 6, { fill: cols[i], stroke: cols[i], rx: 0 }));
      const icons = ['star', 'cog_icon', 'folder', 'download'];
      s.push(obj(icons[i], x + boxW / 2 - 16, 180, 32, 32, { accent: cols[i] }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, 244, { fontSize: 14, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 7), x + boxW / 2, 280, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(x + 10, 310, boxW - 20, 22, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 }));
      s.push(txt('Reduces bundle size', x + boxW / 2, 326, { fontSize: 9, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P65. KUBERNETES ARCHITECTURE ───────────────────────────────────────────────
define({
  id: 'prog_kubernetes_arch', intent: 'hierarchy', label: 'Kubernetes architecture',
  capacity: { components: 5 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const components = (d.components || d.items || []).slice(0, 5);
    const defs = ['Pod', 'Service', 'Deployment', 'Node', 'Cluster'];
    const list = components.length ? components : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#64748b'];
    const icons = ['rocket', 'globe', 'cog_icon', 'building', 'cloud'];
    const boxW = 130, gap = 16;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    list.slice(0, n).forEach((c, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 160;
      const isBig = i === 3 || i === 4;
      const h = isBig ? 90 : 70;
      s.push(rect(x, y, boxW, h, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + (isBig ? 12 : 6), 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(c.title || c), 4), x + boxW / 2, y + (isBig ? 64 : 54), { fontSize: 12, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (c.detail && i < 3) s.push(txt(anchor(c.detail, 6), x + boxW / 2, y + h + 16, { fontSize: 9, fontWeight: '500', color: '#64748b', textAnchor: 'middle' }));
    });
    s.push(rect(100, 290, 600, 110, { stroke: p.accent, strokeWidth: 2, fill: p.soft, rx: 12 }));
    s.push(txt('Kubernetes Cluster', 400, 316, { fontSize: 16, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    s.push(txt(d.cluster_detail || 'Self-healing, auto-scaling container orchestration', 400, 348, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    s.push(txt('Master node controls worker nodes', 400, 376, { fontSize: 11, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
    return s;
  },
});

// ── P66. TREE TRAVERSAL PATTERNS ────────────────────────────────────────────────
define({
  id: 'prog_tree_traversal', intent: 'compare', label: 'Tree traversal patterns',
  capacity: { traversals: 4 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const traversals = (d.traversals || d.items || []).slice(0, 4);
    const defs = ['In-order', 'Pre-order', 'Post-order', 'Level-order'];
    const list = traversals.length ? traversals : defs.map((t) => ({ title: t }));
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    const boxW = 180, gap = 10;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    const cx = 400, rootY = 120;
    const orders = ['D-B-E-A-F-C-G', 'A-B-D-E-C-F-G', 'D-E-B-F-G-C-A', 'A-B-C-D-E-F-G'];
    const descs = ['Left-Root-Right', 'Root-Left-Right', 'Left-Right-Root', 'Level by level'];
    s.push(circle(cx, rootY, 20, { fill: p.accent, stroke: p.accent }));
    s.push(txt('A', cx, rootY + 5, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    [-1, 1].forEach((side, i) => {
      const nx = cx + side * 80;
      const ny = 180;
      s.push(line([cx, rootY + 20], [nx, ny - 20], { color: p.accent, strokeWidth: 1.5 }));
      s.push(circle(nx, ny, 16, { fill: p.soft, stroke: p.accent, strokeWidth: 1.5 }));
      s.push(txt(i === 0 ? 'B' : 'C', nx, ny + 5, { fontSize: 10, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      [-90, 90].forEach((off, j) => {
        const gx = nx + off;
        const gy = 250;
        s.push(line([nx, ny + 16], [gx, gy - 16], { color: '#94a3b8', strokeWidth: 1.2 }));
        s.push(circle(gx, gy, 12, { fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 1.2 }));
        const labels = [['D', 'E'], ['F', 'G']];
        s.push(txt(labels[i][j], gx, gy + 4, { fontSize: 9, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
      });
    });
    list.slice(0, 4).forEach((tr, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 310;
      s.push(rect(x, y, boxW, 100, { stroke: cols[i], strokeWidth: 1.8, fill: i % 2 === 0 ? '#ffffff' : '#f8fafc', rx: 8 }));
      s.push(rect(x, y, boxW, 28, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(txt(anchor(itemText(tr.title || tr), 4), x + boxW / 2, y + 19, { fontSize: 12, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(orders[i], x + boxW / 2, y + 60, { fontSize: 11, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      s.push(txt(descs[i], x + boxW / 2, y + 84, { fontSize: 9, fontWeight: '500', color: '#64748b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P67. STATE MANAGEMENT (REDUX) ──────────────────────────────────────────────
define({
  id: 'prog_state_management', intent: 'process', label: 'Redux data flow',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.items || []).slice(0, 5);
    const defs = ['Action', 'Dispatch', 'Reducer', 'Store', 'View'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const cols = ['#7c3aed', '#2563eb', '#ea580c', '#16a34a', '#0d9488'];
    const boxW = 130, gap = 12;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const icons = ['zap', 'send', 'cog_icon', 'folder', 'eye'];
    list.slice(0, n).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 240;
      s.push(rect(x, y, boxW, 70, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(obj(icons[i], x + boxW / 2 - 12, y + 6, 24, 24, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, y + 54, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, y + 35], [x + boxW + gap - 2, y + 35], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(rect(150, 140, 500, 56, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
    s.push(txt('Unidirectional Data Flow', 400, 166, { fontSize: 16, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    s.push(txt('Actions -> Reducers -> Store -> View -> Actions', 400, 455, { fontSize: 11, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
    return s;
  },
});

// ── P68. WEBSOCKET LIFECYCLE ────────────────────────────────────────────────────
define({
  id: 'prog_websocket_lifecycle', intent: 'process', label: 'WebSocket lifecycle',
  capacity: { stages: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || d.steps || []).slice(0, 4);
    const defs = ['Opening', 'Handshake', 'Data Transfer', 'Closing'];
    const list = stages.length ? stages : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 4);
    const boxW = 170, gap = 10;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#f59e0b', '#2563eb', '#16a34a', '#dc2626'];
    const icons = ['globe', 'handshake', 'chat', 'warning'];
    s.push(obj('person', 80, 120, 60, 60, { accent: p.accent }));
    s.push(txt('Client', 110, 190, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    s.push(obj('server', 660, 120, 60, 60, { accent: p.accent }));
    s.push(txt('Server', 690, 190, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    list.slice(0, n).forEach((sg, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 240;
      s.push(rect(x, y, boxW, 90, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, y, boxW, 6, { fill: cols[i], stroke: cols[i], rx: 0 }));
      s.push(badge(String(i + 1), x + boxW - 18, y - 10, { bg: cols[i] }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + 16, 28, 28, { accent: cols[i] }));
      s.push(txt(anchor(itemText(sg.title || sg), 4), x + boxW / 2, y + 66, { fontSize: 12, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, 285], [x + boxW + gap - 2, 285], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(txt('Persistent full-duplex connection', 400, 430, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P69. DEPENDENCY INJECTION ──────────────────────────────────────────────────
define({
  id: 'prog_dependency_injection', intent: 'define', label: 'Dependency injection types',
  capacity: { types: 3 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const types = (d.types || d.items || []).slice(0, 3);
    const defs = [
      { title: 'Constructor Injection', detail: 'Dependencies passed via constructor', example: 'new Service(repo)' },
      { title: 'Setter Injection', detail: 'Dependencies set after construction', example: 'service.setRepo(repo)' },
      { title: 'Interface Injection', detail: 'Dependency injected via interface method', example: 'inject(service, repo)' },
    ];
    const list = types.length ? types : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a'];
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    list.slice(0, 3).forEach((t, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 240, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 130, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(obj('key', x + boxW / 2 - 16, 136, 32, 32, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(t.title || t), 5), x + boxW / 2, 196, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (t.detail) s.push(txt(anchor(t.detail, 9), x + boxW / 2, 248, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (t.example) {
        s.push(rect(x + 10, 280, boxW - 20, 44, { fill: '#0f172a', stroke: '#0f172a', rx: 4 }));
        s.push(txt(t.example, x + boxW / 2, 306, { fontSize: 10, fontWeight: '600', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
      }
    });
    return s;
  },
});

// ── P70. BUBBLE SORT VISUALIZATION ──────────────────────────────────────────────
define({
  id: 'prog_bubble_sort', intent: 'process', label: 'Bubble sort visualization',
  capacity: { items: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.values || []).slice(0, 6);
    const defs = [29, 10, 14, 37, 13, 33];
    const list = items.length ? items : defs.map((v) => ({ value: v }));
    const n = Math.min(list.length, 6);
    const barW = Math.min(80, (W - 120) / n);
    const gap = 20;
    const total = barW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const baseY = 360;
    s.push(badge(d.pass_label || 'Pass 1', 56, 104, { bg: p.accent }));
    s.push(txt('Comparing adjacent and swapping', 400, 115, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
    const maxVal = Math.max(...list.map((v) => Number(v.value ?? v)), 1);
    list.slice(0, n).forEach((it, i) => {
      const x = x0 + i * (barW + gap);
      const val = Number(it.value ?? it) || 1;
      const height = Math.max(20, (val / maxVal) * 200);
      const highlight = it.compare || it.active;
      const sorted = it.sorted;
      const color = sorted ? '#16a34a' : (highlight ? '#dc2626' : p.accent);
      const bg = sorted ? '#dcfce7' : (highlight ? '#fee2e2' : p.soft);
      s.push(rect(x, baseY - height, barW, height, { stroke: color, strokeWidth: 2, fill: bg, rx: 4 }));
      s.push(txt(String(val), x + barW / 2, baseY - height - 8, { fontSize: 12, fontWeight: '800', color: color, textAnchor: 'middle' }));
    });
    s.push(txt('Larger values "bubble" to the top', 400, 430, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P71. STRING ENCODING ───────────────────────────────────────────────────────
define({
  id: 'prog_string_encoding', intent: 'compare', label: 'String encoding comparison',
  capacity: { encodings: 3 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const encodings = (d.encodings || d.items || []).slice(0, 3);
    const defs = [
      { title: 'ASCII', detail: '7-bit, 128 chars, English only', bytes: '1 byte/char', range: '0-127' },
      { title: 'UTF-8', detail: 'Variable-width, universal charset', bytes: '1-4 bytes/char', range: 'All Unicode' },
      { title: 'Base64', detail: 'Binary-to-text encoding for transport', bytes: '~33% overhead', range: 'A-Z, a-z, 0-9, +, /' },
    ];
    const list = encodings.length ? encodings : defs;
    const cols = ['#2563eb', '#16a34a', '#f59e0b'];
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    list.slice(0, 3).forEach((enc, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 120, boxW, 260, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 120, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(txt(anchor(itemText(enc.title || enc), 5), x + boxW / 2, 150, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (enc.detail) s.push(txt(anchor(enc.detail, 10), x + boxW / 2, 206, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (enc.bytes) { s.push(rect(x + 12, 238, boxW - 24, 26, { fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, rx: 4 })); s.push(txt('Bytes: ' + enc.bytes, x + boxW / 2, 256, { fontSize: 10, fontWeight: '600', color: '#334155', textAnchor: 'middle' })); }
      if (enc.range) { s.push(rect(x + 12, 270, boxW - 24, 26, { fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, rx: 4 })); s.push(txt('Range: ' + enc.range, x + boxW / 2, 288, { fontSize: 10, fontWeight: '600', color: '#334155', textAnchor: 'middle' })); }
      s.push(rect(x + 12, 310, boxW - 24, 40, { fill: '#0f172a', stroke: '#0f172a', rx: 4 }));
      const example = enc.title === 'Base64' ? 'SGVsbG8=' : enc.title === 'UTF-8' ? 'U+0048' : '0x48';
      s.push(txt(example, x + boxW / 2, 334, { fontSize: 11, fontWeight: '700', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
    });
    return s;
  },
});

// ── P72. FIBONACCI RECURSION TREE ──────────────────────────────────────────────
define({
  id: 'prog_fib_recursion', intent: 'hierarchy', label: 'Fibonacci recursion tree',
  capacity: { calls: 8 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const calls = (d.calls || d.items || []).slice(0, 8);
    const defs = ['fib(5)', 'fib(4)', 'fib(3)', 'fib(3)', 'fib(2)', 'fib(2)', 'fib(1)', 'fib(2)'];
    const list = calls.length ? calls : defs.map((t) => ({ title: t }));
    s.push(badge(d.function_label || 'fib(n)', 56, 104, { bg: p.accent }));
    const cx = 400, rootY = 108;
    s.push(circle(cx, rootY, 24, { fill: p.accent, stroke: p.accent }));
    s.push(txt(anchor(itemText(list[0] || 'fib(5)'), 4), cx, rootY + 5, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    [-140, 140].forEach((off, i) => {
      const nx = cx + off;
      const ny = 175;
      s.push(line([cx, rootY + 24], [nx, ny - 24], { color: p.accent, strokeWidth: 2 }));
      s.push(circle(nx, ny, 22, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(anchor(itemText(list[1 + i] || 'fib(n)'), 4), nx, ny + 5, { fontSize: 10, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      [-70, 70].forEach((off2, j) => {
        const gx = nx + off2;
        const gy = 250;
        const idx = 3 + i * 2 + j;
        s.push(line([nx, ny + 22], [gx, gy - 22], { color: '#94a3b8', strokeWidth: 1.5 }));
        s.push(circle(gx, gy, 18, { fill: '#ffffff', stroke: '#94a3b8', strokeWidth: 1.5 }));
        s.push(txt(anchor(itemText(list[idx] || 'fib(n)'), 3), gx, gy + 5, { fontSize: 9, fontWeight: '600', color: '#475569', textAnchor: 'middle' }));
        if (idx + 1 < list.length) {
          const hy = gy + 45;
          const hx = gx + (j === 0 ? -30 : 30);
          s.push(line([gx, gy + 18], [hx, hy - 18], { color: '#e2e8f0', strokeWidth: 1 }));
          s.push(circle(hx, hy, 14, { fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1 }));
          s.push(txt(anchor(itemText(list[idx + 1] || ''), 2), hx, hy + 4, { fontSize: 8, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
        }
      });
    });
    s.push(txt('Exponential recursion with repeated subproblems', 400, 460, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P73. ASYNC / AWAIT EXECUTION FLOW ───────────────────────────────────────────
define({
  id: 'prog_async_await', intent: 'process', label: 'Async/await execution flow',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.items || []).slice(0, 5);
    const defs = ['async function', 'await fetch()', 'Pause execution', 'Promise resolves', 'Resume function'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const cols = ['#7c3aed', '#2563eb', '#f59e0b', '#16a34a', '#7c3aed'];
    const boxW = 130, gap = 12;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    list.slice(0, n).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 200;
      const isPaused = i === 2;
      s.push(rect(x, y, boxW, isPaused ? 110 : 80, { stroke: cols[i], strokeWidth: 2, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 8 }));
      s.push(rect(x, y, boxW, 6, { fill: cols[i], stroke: cols[i], rx: 0 }));
      s.push(badge(String(i + 1), x + boxW - 18, y - 8, { bg: cols[i] }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, y + 38, { fontSize: 12, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (isPaused && st.detail) s.push(txt(anchor(st.detail, 8), x + boxW / 2, y + 74, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, y + 40], [x + boxW + gap - 2, y + 40], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(txt('Non-blocking with syntactic sugar over Promises', 400, 430, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P74. CLOUD DEPLOYMENT STRATEGIES ────────────────────────────────────────────
define({
  id: 'prog_cloud_deployment', intent: 'compare', label: 'Cloud deployment strategies',
  capacity: { strategies: 3 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const strategies = (d.strategies || d.items || []).slice(0, 3);
    const defs = [
      { title: 'Blue/Green', detail: 'Two identical environments, switch traffic' },
      { title: 'Canary', detail: 'Roll out to subset, then full release' },
      { title: 'Rolling', detail: 'Gradually replace instances' },
    ];
    const list = strategies.length ? strategies : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a'];
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    const icons = ['globe', 'chart_up', 'cog_icon'];
    const pros = ['Zero downtime', 'Risk mitigated', 'No extra env needed'];
    const cons = ['Costly (2x infra)', 'Slow rollout', 'Rollback complex'];
    list.slice(0, 3).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 240, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 130, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(obj(icons[i], x + boxW / 2 - 16, 136, 32, 32, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 5), x + boxW / 2, 200, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 10), x + boxW / 2, 254, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(x + 14, 290, boxW - 28, 26, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 }));
      s.push(txt('\u2713 ' + pros[i], x + boxW / 2, 310, { fontSize: 10, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
      s.push(rect(x + 14, 322, boxW - 28, 26, { fill: '#fee2e2', stroke: '#dc2626', strokeWidth: 1, rx: 4 }));
      s.push(txt('\u2717 ' + cons[i], x + boxW / 2, 342, { fontSize: 10, fontWeight: '600', color: '#991b1b', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P75. VIRTUAL DOM DIFFING ────────────────────────────────────────────────────
define({
  id: 'prog_virtual_dom', intent: 'process', label: 'Virtual DOM diffing',
  capacity: { steps: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.items || []).slice(0, 4);
    const defs = ['Render VDOM', 'Diff with previous', 'Compute patch', 'Apply to DOM'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    const icons = ['cog_icon', 'search', 'pencil_edit', 'zap'];
    const boxW = 170, gap = 14;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    list.slice(0, 4).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 190;
      s.push(rect(x, y, boxW, 130, { stroke: cols[i], strokeWidth: 2, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 8 }));
      s.push(circle(x + boxW / 2, y + 36, 28, { fill: cols[i], stroke: cols[i] }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + 22, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, y + 86, { fontSize: 12, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 7), x + boxW / 2, y + 112, { fontSize: 9, fontWeight: '500', color: '#64748b', textAnchor: 'middle' }));
      if (i < 3) s.push(arrow([x + boxW + 2, 255], [x + boxW + gap - 2, 255], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(txt('Efficiently updates only changed DOM nodes', 400, 440, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P76. CRUD OPERATIONS ────────────────────────────────────────────────────────
define({
  id: 'prog_crud_http', intent: 'define', label: 'CRUD operations (HTTP mapping)',
  capacity: { ops: 4 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const ops = (d.ops || d.items || []).slice(0, 4);
    const defs = [
      { op: 'Create', http: 'POST', url: '/api/resource', body: 'Yes' },
      { op: 'Read', http: 'GET', url: '/api/resource/:id', body: 'No' },
      { op: 'Update', http: 'PUT / PATCH', url: '/api/resource/:id', body: 'Yes' },
      { op: 'Delete', http: 'DELETE', url: '/api/resource/:id', body: 'Optional' },
    ];
    const list = ops.length ? ops : defs;
    s.push(badge('CRUD', 56, 104, { bg: p.accent }));
    s.push(badge('HTTP', 240, 104, { bg: '#64748b' }));
    s.push(badge('Route', 420, 104, { bg: '#0f172a' }));
    s.push(badge('Body?', 620, 104, { bg: '#16a34a' }));
    const cols = ['#16a34a', '#2563eb', '#f59e0b', '#dc2626'];
    list.slice(0, 4).forEach((op, i) => {
      const y = 130 + i * 72;
      s.push(rect(56, y, 160, 56, { stroke: cols[i], strokeWidth: 2, fill: i % 2 === 0 ? '#ffffff' : '#f8fafc', rx: 6 }));
      s.push(txt(op.op || '', 136, y + 34, { fontSize: 16, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      s.push(rect(228, y, 170, 56, { stroke: cols[i], strokeWidth: 1.5, fill: '#ffffff', rx: 6 }));
      s.push(txt(op.http || '', 313, y + 34, { fontSize: 13, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      s.push(rect(410, y, 190, 56, { fill: '#0f172a', stroke: '#0f172a', rx: 6 }));
      s.push(txt(op.url || '', 505, y + 34, { fontSize: 11, fontWeight: '600', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
      s.push(rect(612, y, 140, 56, { stroke: '#16a34a', strokeWidth: 1.2, fill: '#f0fdf4', rx: 6 }));
      s.push(txt(op.body || '', 682, y + 34, { fontSize: 12, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P77. SHELL COMMANDS CHEAT SHEET ─────────────────────────────────────────────
define({
  id: 'prog_shell_commands', intent: 'define', label: 'Shell commands cheat sheet',
  capacity: { commands: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const commands = (d.commands || d.items || []).slice(0, 6);
    const defs = [
      { cmd: 'ls', desc: 'List directory contents' },
      { cmd: 'cd', desc: 'Change directory' },
      { cmd: 'grep', desc: 'Search text with patterns' },
      { cmd: 'find', desc: 'Find files by name/type' },
      { cmd: 'chmod', desc: 'Change file permissions' },
      { cmd: 'ps', desc: 'List running processes' },
    ];
    const list = commands.length ? commands : defs;
    const boxW = 700, boxH = 46, gap = 10;
    const x = (W - boxW) / 2;
    list.slice(0, 6).forEach((c, i) => {
      const y = 120 + i * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.4, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 6 }));
      s.push(rect(x + 12, y + 6, 140, boxH - 12, { fill: '#0f172a', stroke: '#0f172a', rx: 4 }));
      s.push(txt(c.cmd || '', x + 82, y + 30, { fontSize: 14, fontWeight: '700', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
      s.push(txt(anchor(c.desc || c.detail || '', 10), x + 170, y + 30, { fontSize: 12, fontWeight: '600', color: '#334155' }));
    });
    return s;
  },
});

// ── P78. REACT DATA FLOW ────────────────────────────────────────────────────────
define({
  id: 'prog_react_data_flow', intent: 'process', label: 'React unidirectional data flow',
  capacity: { parts: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const parts = (d.parts || d.items || []).slice(0, 4);
    const defs = ['State', 'Props', 'Render', 'Event Handler'];
    const list = parts.length ? parts : defs.map((t) => ({ title: t }));
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    const boxW = 150, gap = 14;
    const total = boxW * 4 + gap * 3;
    const x0 = (W - total) / 2;
    const icons = ['folder', 'send', 'eye', 'zap'];
    list.slice(0, 4).forEach((pt, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 200;
      s.push(rect(x, y, boxW, 80, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + 10, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(pt.title || pt), 4), x + boxW / 2, y + 54, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (i < 3) s.push(arrow([x + boxW + 2, 240], [x + boxW + gap - 2, 240], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(rect(100, 120, 600, 50, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
    s.push(txt('Data flows down, events flow up', 400, 150, { fontSize: 15, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
    s.push(arrow([400, 310], [400, 340], { color: '#94a3b8', strokeWidth: 1.5, dashed: true }));
    s.push(txt('setState() triggers re-render', 400, 370, { fontSize: 11, color: '#64748b', textAnchor: 'middle' }));
    return s;
  },
});

// ── P79. PROGRAMMING LANGUAGE COMPARISON ────────────────────────────────────────
define({
  id: 'prog_lang_comparison', intent: 'compare', label: 'Programming language comparison',
  capacity: { langs: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const langs = (d.langs || d.items || []).slice(0, 4);
    const defs = [
      { lang: 'JavaScript', typing: 'Dynamic', runtime: 'Node/Browser', speed: 'Medium', use: 'Web' },
      { lang: 'Python', typing: 'Dynamic', runtime: 'CPython', speed: 'Slow', use: 'Data/AI' },
      { lang: 'Java', typing: 'Static', runtime: 'JVM', speed: 'Fast', use: 'Enterprise' },
      { lang: 'Rust', typing: 'Static', runtime: 'Native', speed: 'Very Fast', use: 'Systems' },
    ];
    const list = langs.length ? langs : defs;
    s.push(badge('Language', 56, 104, { bg: p.accent }));
    s.push(badge('Typing', 240, 104, { bg: '#64748b' }));
    s.push(badge('Runtime', 380, 104, { bg: '#0f172a' }));
    s.push(badge('Speed', 520, 104, { bg: '#f59e0b' }));
    s.push(badge('Use Case', 640, 104, { bg: '#16a34a' }));
    const cols = ['#2563eb', '#f59e0b', '#16a34a', '#dc2626'];
    list.slice(0, 4).forEach((l, i) => {
      const y = 130 + i * 72;
      s.push(rect(56, y, 170, 56, { stroke: cols[i], strokeWidth: 2, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 6 }));
      s.push(txt(l.lang || '', 141, y + 34, { fontSize: 15, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      s.push(rect(240, y, 120, 56, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#ffffff', rx: 6 }));
      s.push(txt(l.typing || '', 300, y + 34, { fontSize: 12, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      s.push(rect(380, y, 120, 56, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#ffffff', rx: 6 }));
      s.push(txt(l.runtime || '', 440, y + 34, { fontSize: 12, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      s.push(rect(520, y, 100, 56, { stroke: '#f59e0b', strokeWidth: 1, fill: '#fffbeb', rx: 6 }));
      s.push(txt(l.speed || '', 570, y + 34, { fontSize: 12, fontWeight: '600', color: '#92400e', textAnchor: 'middle' }));
      s.push(rect(630, y, 120, 56, { stroke: '#16a34a', strokeWidth: 1, fill: '#f0fdf4', rx: 6 }));
      s.push(txt(l.use || '', 690, y + 34, { fontSize: 12, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P80. THROTTLE VS DEBOUNCE ───────────────────────────────────────────────────
define({
  id: 'prog_throttle_debounce', intent: 'compare', label: 'Throttle vs debounce',
  capacity: { points: 4 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const points = (d.points || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Behavior', thr: 'Fire at most once per interval', deb: 'Fire after inactivity' },
      { title: 'Timing', thr: 'Regular intervals', deb: 'Delayed until pause' },
      { title: 'Use Case', thr: 'Scroll events, resizing', deb: 'Search input, auto-save' },
      { title: 'Analogy', thr: 'Rate limiter at door', deb: 'Wait until crowd settles' },
    ];
    const list = points.length ? points : defs;
    s.push(rect(50, 110, 340, 42, { fill: '#2563eb', stroke: '#2563eb', rx: 8 }));
    s.push(txt('Throttle', 220, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(410, 110, 340, 42, { fill: '#7c3aed', stroke: '#7c3aed', rx: 8 }));
    s.push(txt('Debounce', 580, 138, { fontSize: 16, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    list.slice(0, 4).forEach((pt, i) => {
      const y = 170 + i * 66;
      s.push(rect(50, y, 340, 54, { stroke: '#2563eb', strokeWidth: 1.4, fill: i % 2 === 0 ? '#eff6ff' : '#ffffff', rx: 6 }));
      s.push(txt(anchor(itemText(pt.title || pt), 4), 220, y + 16, { fontSize: 12, fontWeight: '700', color: '#2563eb', textAnchor: 'middle' }));
      s.push(txt(anchor(pt.thr || '', 8), 220, y + 38, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(410, y, 340, 54, { stroke: '#7c3aed', strokeWidth: 1.4, fill: i % 2 === 0 ? '#f5f3ff' : '#ffffff', rx: 6 }));
      s.push(txt(anchor(itemText(pt.title || ''), 4), 580, y + 16, { fontSize: 12, fontWeight: '700', color: '#7c3aed', textAnchor: 'middle' }));
      s.push(txt(anchor(pt.deb || '', 8), 580, y + 38, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P81. B-TREE STRUCTURE ───────────────────────────────────────────────────────
define({
  id: 'prog_btree', intent: 'hierarchy', label: 'B-tree structure',
  capacity: { nodes: 6 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const nodes = (d.nodes || d.items || []).slice(0, 6);
    const defs = ['10,20', '5', '15', '25', '30,40', '50'];
    const list = nodes.length ? nodes : defs.map((t) => ({ title: t }));
    const cx = 400, rootY = 108;
    s.push(rect(cx - 60, rootY, 120, 40, { fill: p.accent, stroke: p.accent, rx: 8 }));
    s.push(txt(anchor(itemText(list[0] || '10,20'), 5), cx, rootY + 26, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    const l2 = [180, 620];
    l2.forEach((lx, i) => {
      const ly = 190;
      s.push(line([cx - 20 + i * 40, rootY + 40], [lx, ly - 6], { color: p.accent, strokeWidth: 2 }));
      s.push(rect(lx - 40, ly, 80, 40, { fill: p.soft, stroke: p.accent, strokeWidth: 1.8, rx: 6 }));
      s.push(txt(anchor(itemText(list[1 + i] || '...'), 4), lx, ly + 26, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      [-70, 70].forEach((off, j) => {
        const gx = lx + off;
        const gy = 280;
        const idx = 3 + i * 2 + j;
        s.push(line([lx, ly + 40], [gx, gy - 6], { color: '#94a3b8', strokeWidth: 1.5 }));
        s.push(rect(gx - 30, gy, 60, 36, { stroke: '#cbd5e1', strokeWidth: 1.4, fill: '#ffffff', rx: 6 }));
        s.push(txt(anchor(itemText(list[idx] || '...'), 3), gx, gy + 24, { fontSize: 10, fontWeight: '600', color: '#475569', textAnchor: 'middle' }));
      });
    });
    s.push(txt('Self-balancing tree with multiple keys per node', 400, 450, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P82. CODE COVERAGE TYPES ───────────────────────────────────────────────────
define({
  id: 'prog_code_coverage', intent: 'define', label: 'Code coverage types',
  capacity: { types: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const types = (d.types || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Line Coverage', detail: 'What percentage of lines ran?', icon: 'chart_up' },
      { title: 'Branch Coverage', detail: 'Both true/false paths tested?', icon: 'tree' },
      { title: 'Function Coverage', detail: 'Which functions were called?', icon: 'cog_icon' },
      { title: 'Statement Coverage', detail: 'Each statement executed?', icon: 'star' },
    ];
    const list = types.length ? types : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    const boxW = 180, gap = 10;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    list.slice(0, 4).forEach((t, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 150;
      s.push(rect(x, y, boxW, 200, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 8 }));
      s.push(rect(x, y, boxW, 8, { fill: cols[i], stroke: cols[i], rx: 0 }));
      s.push(obj(t.icon || 'star', x + boxW / 2 - 18, 178, 36, 36, { accent: cols[i] }));
      s.push(txt(anchor(itemText(t.title || t), 4), x + boxW / 2, 244, { fontSize: 15, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (t.detail) s.push(txt(anchor(t.detail, 8), x + boxW / 2, 285, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(x + 12, 320, boxW - 24, 22, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 }));
      s.push(txt('> 80% target', x + boxW / 2, 336, { fontSize: 10, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P83. ACCESSIBILITY (ARIA) ──────────────────────────────────────────────────
define({
  id: 'prog_accessibility', intent: 'define', label: 'Accessibility (ARIA roles)',
  capacity: { roles: 5 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const roles = (d.roles || d.items || []).slice(0, 5);
    const defs = [
      { role: 'role="button"', desc: 'Clickable element, not just <div>' },
      { role: 'aria-label', desc: 'Screen reader text for elements' },
      { role: 'aria-hidden', desc: 'Hides decorative elements' },
      { role: 'role="alert"', desc: 'Live region for dynamic updates' },
      { role: 'tabindex', desc: 'Keyboard focus order' },
    ];
    const list = roles.length ? roles : defs;
    const boxW = 700, boxH = 52, gap = 10;
    const x = (W - boxW) / 2;
    list.slice(0, 5).forEach((r, i) => {
      const y = 120 + i * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: p.accent, strokeWidth: 1.6, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 6 }));
      s.push(rect(x + 10, y + 8, 180, boxH - 16, { fill: '#0f172a', stroke: '#0f172a', rx: 4 }));
      s.push(txt(r.role || '', x + 100, y + 32, { fontSize: 12, fontWeight: '700', color: '#22c55e', textAnchor: 'middle', fontFamily: 'monospace' }));
      s.push(txt(anchor(r.desc || r.detail || '', 10), x + 210, y + 32, { fontSize: 12, fontWeight: '600', color: '#334155' }));
    });
    s.push(txt('Web Content Accessibility Guidelines (WCAG)', 400, 450, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P84. WEB VITALS METRICS ─────────────────────────────────────────────────────
define({
  id: 'prog_web_vitals', intent: 'define', label: 'Web vitals metrics',
  capacity: { metrics: 3 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const metrics = (d.metrics || d.items || []).slice(0, 3);
    const defs = [
      { name: 'LCP', full: 'Largest Contentful Paint', target: '< 2.5s', detail: 'Loading performance' },
      { name: 'FID', full: 'First Input Delay', target: '< 100ms', detail: 'Interactivity' },
      { name: 'CLS', full: 'Cumulative Layout Shift', target: '< 0.1', detail: 'Visual stability' },
    ];
    const list = metrics.length ? metrics : defs;
    const cols = ['#16a34a', '#f59e0b', '#dc2626'];
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    list.slice(0, 3).forEach((m, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 250, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 130, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(txt(m.name || '', x + boxW / 2, 160, { fontSize: 22, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (m.full) s.push(txt(anchor(m.full, 7), x + boxW / 2, 208, { fontSize: 12, fontWeight: '700', color: '#1e293b', textAnchor: 'middle' }));
      if (m.target) { s.push(rect(x + 14, 238, boxW - 28, 36, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 6 })); s.push(txt('Target: ' + m.target, x + boxW / 2, 262, { fontSize: 13, fontWeight: '800', color: '#166534', textAnchor: 'middle' })); }
      if (m.detail) { s.push(rect(x + 14, 286, boxW - 28, 36, { fill: '#eff6ff', stroke: '#2563eb', strokeWidth: 1, rx: 6 })); s.push(txt(anchor(m.detail, 6), x + boxW / 2, 310, { fontSize: 11, fontWeight: '600', color: '#1e40af', textAnchor: 'middle' })); }
    });
    s.push(txt('Core Web Vitals impact SEO ranking', 400, 450, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P85. WEB STORAGE COMPARISON ─────────────────────────────────────────────────
define({
  id: 'prog_web_storage', intent: 'compare', label: 'localStorage vs sessionStorage vs cookies',
  capacity: { points: 5 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const points = (d.points || d.items || []).slice(0, 5);
    const defs = [
      { prop: 'Capacity', ls: '5-10 MB', ss: '5-10 MB', ck: '4 KB' },
      { prop: 'Expiration', ls: 'Never', ss: 'Tab close', ck: 'Set by server' },
      { prop: 'Server Access', ls: 'No', ss: 'No', ck: 'Yes (sent)' },
      { prop: 'Scope', ls: 'Origin', ss: 'Tab/window', ck: 'Origin + path' },
      { prop: 'Security', ls: 'Not secure (JS)', ss: 'Not secure (JS)', ck: 'HttpOnly possible' },
    ];
    const list = points.length ? points : defs;
    s.push(rect(50, 110, 160, 36, { fill: '#f59e0b', stroke: '#f59e0b', rx: 6 }));
    s.push(txt('Property', 130, 134, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(220, 110, 170, 36, { fill: '#2563eb', stroke: '#2563eb', rx: 6 }));
    s.push(txt('localStorage', 305, 134, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(400, 110, 170, 36, { fill: '#16a34a', stroke: '#16a34a', rx: 6 }));
    s.push(txt('sessionStorage', 485, 134, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    s.push(rect(580, 110, 170, 36, { fill: '#ea580c', stroke: '#ea580c', rx: 6 }));
    s.push(txt('Cookies', 665, 134, { fontSize: 13, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
    list.slice(0, 5).forEach((pt, i) => {
      const y = 160 + i * 52;
      s.push(rect(50, y, 160, 42, { stroke: p.accent, strokeWidth: 1.4, fill: i % 2 === 0 ? p.soft : '#ffffff', rx: 4 }));
      s.push(txt(anchor(pt.prop || pt.title || '', 5), 130, y + 28, { fontSize: 12, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
      s.push(rect(220, y, 170, 42, { stroke: '#e2e8f0', strokeWidth: 1, fill: i % 2 === 0 ? '#eff6ff' : '#ffffff', rx: 4 }));
      s.push(txt(pt.ls || '', 305, y + 28, { fontSize: 11, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      s.push(rect(400, y, 170, 42, { stroke: '#e2e8f0', strokeWidth: 1, fill: i % 2 === 0 ? '#f0fdf4' : '#ffffff', rx: 4 }));
      s.push(txt(pt.ss || '', 485, y + 28, { fontSize: 11, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      s.push(rect(580, y, 170, 42, { stroke: '#e2e8f0', strokeWidth: 1, fill: i % 2 === 0 ? '#fff7ed' : '#ffffff', rx: 4 }));
      s.push(txt(pt.ck || '', 665, y + 28, { fontSize: 11, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P86. N-TIER ARCHITECTURE ────────────────────────────────────────────────────
define({
  id: 'prog_ntier_arch', intent: 'hierarchy', label: 'N-tier architecture',
  capacity: { tiers: 4 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const tiers = (d.tiers || d.items || []).slice(0, 4);
    const defs = ['Presentation', 'Business Logic', 'Data Access', 'Database'];
    const list = tiers.length ? tiers : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 4);
    const boxW = 520, boxH = 70, gap = 16;
    const x = (W - boxW) / 2;
    const cols = ['#2563eb', '#ea580c', '#f59e0b', '#16a34a'];
    const icons = ['eye', 'cog_icon', 'folder', 'database'];
    list.slice(0, n).forEach((t, i) => {
      const y = 112 + i * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(obj(icons[i], x + 16, y + 18, 34, 34, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(t.title || t), 6), x + 80, y + 42, { fontSize: 15, fontWeight: '800', color: '#ffffff' }));
      if (t.detail) s.push(txt(anchor(t.detail, 10), x + 80, y + 58, { fontSize: 10, fontWeight: '500', color: '#e2e8f0' }));
      if (i < n - 1) s.push(arrow([x + boxW / 2, y + boxH], [x + boxW / 2, y + boxH + gap], { color: '#94a3b8', strokeWidth: 2, dashed: true }));
    });
    s.push(txt('Each tier can be scaled independently', 400, 460, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P87. ARRAY METHODS COMPARISON ──────────────────────────────────────────────
define({
  id: 'prog_array_methods', intent: 'compare', label: 'Array methods (map, filter, reduce)',
  capacity: { methods: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const methods = (d.methods || d.items || []).slice(0, 5);
    const defs = [
      { method: 'map()', returns: 'New array', purpose: 'Transform each element' },
      { method: 'filter()', returns: 'New array', purpose: 'Keep matching elements' },
      { method: 'reduce()', returns: 'Single value', purpose: 'Accumulate values' },
      { method: 'forEach()', returns: 'undefined', purpose: 'Execute side effects' },
      { method: 'find()', returns: 'First match', purpose: 'Locate by condition' },
    ];
    const list = methods.length ? methods : defs;
    s.push(badge('Method', 56, 104, { bg: p.accent }));
    s.push(badge('Returns', 320, 104, { bg: '#64748b' }));
    s.push(badge('Purpose', 520, 104, { bg: '#16a34a' }));
    const cols = ['#2563eb', '#ea580c', '#7c3aed', '#0d9488', '#f59e0b'];
    list.slice(0, 5).forEach((m, i) => {
      const y = 130 + i * 58;
      s.push(rect(56, y, 240, 46, { stroke: cols[i], strokeWidth: 2, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 6 }));
      s.push(txt(m.method || '', 176, y + 28, { fontSize: 14, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      s.push(rect(310, y, 180, 46, { stroke: '#e2e8f0', strokeWidth: 1, fill: '#ffffff', rx: 6 }));
      s.push(txt(m.returns || '', 400, y + 28, { fontSize: 12, fontWeight: '600', color: '#334155', textAnchor: 'middle' }));
      s.push(rect(500, y, 250, 46, { stroke: '#16a34a', strokeWidth: 1, fill: '#f0fdf4', rx: 6 }));
      s.push(txt(anchor(m.purpose || '', 10), 625, y + 28, { fontSize: 11, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P88. QUICKSORT VISUALIZATION ──────────────────────────────────────────────
define({
  id: 'prog_quicksort', intent: 'process', label: 'Quicksort (pivot & partition)',
  capacity: { items: 6 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const items = (d.items || d.values || []).slice(0, 6);
    const defs = [33, 10, 55, 22, 47, 18];
    const list = items.length ? items : defs.map((v) => ({ value: v }));
    const n = Math.min(list.length, 6);
    const barW = 80, gap = 14;
    const total = barW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    s.push(badge('Pivot', 56, 104, { bg: '#dc2626' }));
    s.push(badge('Partition', 160, 104, { bg: p.accent }));
    s.push(badge('Recurse', 300, 104, { bg: '#16a34a' }));
    s.push(txt('Choose pivot, partition, then recursively sort', 580, 115, { fontSize: 11, color: '#64748b', textAnchor: 'start', fontStyle: 'italic' }));
    const maxVal = Math.max(...list.map((v) => Number(v.value ?? v)), 1);
    const baseY = 360;
    list.slice(0, n).forEach((it, i) => {
      const x = x0 + i * (barW + gap);
      const val = Number(it.value ?? it) || 1;
      const height = Math.max(20, (val / maxVal) * 200);
      const isPivot = it.pivot;
      const isPartition = it.partition;
      const color = isPivot ? '#dc2626' : (isPartition ? p.accent : '#94a3b8');
      const bg = isPivot ? '#fee2e2' : (isPartition ? p.soft : '#f8fafc');
      s.push(rect(x, baseY - height, barW, height, { stroke: color, strokeWidth: 2, fill: bg, rx: 4 }));
      s.push(txt(String(val), x + barW / 2, baseY - height - 8, { fontSize: 12, fontWeight: '800', color: color, textAnchor: 'middle' }));
      if (isPivot) s.push(txt('pivot', x + barW / 2, baseY + 16, { fontSize: 9, fontWeight: '700', color: '#dc2626', textAnchor: 'middle' }));
    });
    s.push(txt('Divide & conquer: O(n log n) average', 400, 440, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P89. INFRASTRUCTURE AS CODE ───────────────────────────────────────────────
define({
  id: 'prog_iac_terraform', intent: 'process', label: 'Infrastructure as Code (Terraform)',
  capacity: { steps: 5 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const steps = (d.steps || d.items || []).slice(0, 5);
    const defs = ['Write Config', 'Plan', 'Apply', 'Provision', 'Manage'];
    const list = steps.length ? steps : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const boxW = 130, gap = 12;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#7c3aed', '#2563eb', '#16a34a', '#ea580c', '#0d9488'];
    const icons = ['pencil_edit', 'search', 'zap', 'rocket', 'cog_icon'];
    list.slice(0, n).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 200;
      s.push(rect(x, y, boxW, 70, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + 8, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, y + 54, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, y + 35], [x + boxW + gap - 2, y + 35], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(rect(150, 310, 500, 60, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
    s.push(txt(d.iac_label || 'Declarative config -> Cloud resources', 400, 348, { fontSize: 13, fontWeight: '600', color: p.accent, textAnchor: 'middle' }));
    return s;
  },
});

// ── P90. GRAPH TRAVERSAL (DIJKSTRA, A*) ─────────────────────────────────────────
define({
  id: 'prog_graph_traversal', intent: 'compare', label: 'Graph traversal (Dijkstra, A*)',
  capacity: { algorithms: 3 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const algorithms = (d.algorithms || d.items || []).slice(0, 3);
    const defs = [
      { title: 'Dijkstra', detail: 'Shortest path, no negative edges', time: 'O(V log V + E)' },
      { title: 'A* Search', detail: 'Heuristic-guided shortest path', time: 'O(b^d)' },
      { title: 'Bellman-Ford', detail: 'Handles negative weights', time: 'O(VE)' },
    ];
    const list = algorithms.length ? algorithms : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a'];
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    list.slice(0, 3).forEach((a, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 130, boxW, 240, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 130, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      const icons = ['search', 'star', 'cog_icon'];
      s.push(obj(icons[i], x + boxW / 2 - 16, 138, 32, 32, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(a.title || a), 5), x + boxW / 2, 204, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (a.detail) s.push(txt(anchor(a.detail, 9), x + boxW / 2, 252, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (a.time) { s.push(rect(x + 14, 288, boxW - 28, 36, { fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, rx: 4 })); s.push(txt('Time: ' + a.time, x + boxW / 2, 312, { fontSize: 11, fontWeight: '700', color: '#334155', textAnchor: 'middle' })); }
    });
    return s;
  },
});

// ── P91. WEBPACK BUNDLING PROCESS ──────────────────────────────────────────────
define({
  id: 'prog_webpack_bundling', intent: 'process', label: 'Webpack bundling process',
  capacity: { stages: 5 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || d.steps || []).slice(0, 5);
    const defs = ['Entry', 'Resolve', 'Loaders', 'Plugins', 'Output'];
    const list = stages.length ? stages : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const boxW = 130, gap = 10;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#2563eb', '#7c3aed', '#ea580c', '#16a34a', '#0f172a'];
    const icons = ['folder', 'search', 'cog_icon', 'zap', 'download'];
    list.slice(0, n).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 220;
      s.push(rect(x, y, boxW, 70, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + 6, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, y + 56, { fontSize: 12, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, y + 35], [x + boxW + gap - 2, y + 35], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(rect(150, 140, 500, 44, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
    s.push(txt('Module bundler: JS files -> optimized bundle(s)', 400, 168, { fontSize: 13, fontWeight: '600', color: p.accent, textAnchor: 'middle' }));
    s.push(txt('Code splitting, tree shaking, asset optimization', 400, 440, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P92. MEMOIZATION PATTERNS ──────────────────────────────────────────────────
define({
  id: 'prog_memoization', intent: 'define', label: 'Memoization patterns',
  capacity: { patterns: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const patterns = (d.patterns || d.items || []).slice(0, 4);
    const defs = [
      { title: 'Pure Function', detail: 'Same input -> cached result' },
      { title: 'Recursive DP', detail: 'Top-down with memo table' },
      { title: 'React useMemo', detail: 'Memoize computed values' },
      { title: 'Lru Cache', detail: 'Evict least recently used' },
    ];
    const list = patterns.length ? patterns : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed'];
    const boxW = 180, gap = 10;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    const icons = ['star', 'tree', 'cog_icon', 'clock'];
    list.slice(0, 4).forEach((pt, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 150;
      s.push(rect(x, y, boxW, 200, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, y, boxW, 8, { fill: cols[i], stroke: cols[i], rx: 0 }));
      s.push(obj(icons[i], x + boxW / 2 - 16, 178, 32, 32, { accent: cols[i] }));
      s.push(txt(anchor(itemText(pt.title || pt), 4), x + boxW / 2, 244, { fontSize: 14, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (pt.detail) s.push(txt(anchor(pt.detail, 8), x + boxW / 2, 280, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(x + 10, 314, boxW - 20, 24, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 }));
      s.push(txt('Avoids recomputation', x + boxW / 2, 332, { fontSize: 9, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    return s;
  },
});

// ── P93. EVENT PROPAGATION ──────────────────────────────────────────────────────
define({
  id: 'prog_event_propagation', intent: 'process', label: 'Event propagation (bubble, capture)',
  capacity: { phases: 3 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const phases = (d.phases || d.items || []).slice(0, 3);
    const defs = ['Capture Phase', 'Target Phase', 'Bubble Phase'];
    const list = phases.length ? phases : defs.map((t) => ({ title: t }));
    const cols = ['#2563eb', '#ea580c', '#16a34a'];
    const R = [120, 70, 30];
    const cx = 400, cy = 280;
    list.slice(0, 3).forEach((ph, i) => {
      s.push(circle(cx, cy, R[i], { fill: 'none', stroke: cols[i], strokeWidth: 3 }));
      s.push(txt(anchor(itemText(ph.title || ph), 4), cx, cy - R[i] - 16, { fontSize: 13, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
    });
    s.push(circle(cx, cy, 16, { fill: '#f59e0b', stroke: '#f59e0b' }));
    s.push(txt('Click', cx, cy + 5, { fontSize: 9, fontWeight: '700', color: '#ffffff', textAnchor: 'middle' }));
    s.push(arrow([400, 160], [400, 210], { color: '#2563eb', strokeWidth: 2 }));
    s.push(arrow([400, 350], [400, 310], { color: '#16a34a', strokeWidth: 2 }));
    s.push(txt('window -> document -> element', 400, 180, { fontSize: 10, color: '#64748b', textAnchor: 'middle' }));
    s.push(txt('element -> document -> window', 400, 365, { fontSize: 10, color: '#64748b', textAnchor: 'middle' }));
    return s;
  },
});

// ── P94. MICRO-FRONTENDS ────────────────────────────────────────────────────────
define({
  id: 'prog_micro_frontends', intent: 'hierarchy', label: 'Micro-frontends architecture',
  capacity: { apps: 4 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const apps = (d.apps || d.items || []).slice(0, 4);
    const defs = ['Shell', 'App A', 'App B', 'App C'];
    const list = apps.length ? apps : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 4);
    const boxW = 170, gap = 10;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#64748b', '#2563eb', '#ea580c', '#16a34a'];
    const icons = ['building', 'star', 'cog_icon', 'chart_up'];
    list.slice(0, n).forEach((a, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 180, boxW, 180, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 180, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(obj(icons[i], x + boxW / 2 - 14, 188, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(a.title || a), 4), x + boxW / 2, 244, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (a.detail) s.push(txt(anchor(a.detail, 7), x + boxW / 2, 286, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(x + 14, 310, boxW - 28, 24, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 }));
      s.push(txt('Independent deploy', x + boxW / 2, 327, { fontSize: 9, fontWeight: '600', color: '#166534', textAnchor: 'middle' }));
    });
    s.push(txt('Micro-frontends: independently deployable frontend modules', 400, 440, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P95. RETRY PATTERNS ────────────────────────────────────────────────────────
define({
  id: 'prog_retry_patterns', intent: 'process', label: 'Retry with exponential backoff',
  capacity: { attempts: 4 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const attempts = (d.attempts || d.items || []).slice(0, 4);
    const defs = ['Attempt 1', 'Attempt 2', 'Attempt 3', 'Attempt 4'];
    const list = attempts.length ? attempts : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 4);
    const boxW = 170, gap = 10;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#dc2626', '#f59e0b', '#f59e0b', '#16a34a'];
    const delays = ['100ms', '200ms', '400ms', '800ms'];
    list.slice(0, n).forEach((at, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 190;
      const isSuccess = i === n - 1;
      s.push(rect(x, y, boxW, 160, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, y, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(txt(anchor(itemText(at.title || at), 4), x + boxW / 2, 224, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      const ic = isSuccess ? 'star' : 'warning';
      s.push(obj(ic, x + boxW / 2 - 14, 248, 28, 28, { accent: cols[i] }));
      s.push(rect(x + 14, 290, boxW - 28, 26, { fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, rx: 4 }));
      s.push(txt('Delay: ' + delays[i], x + boxW / 2, 309, { fontSize: 10, fontWeight: '700', color: cols[i], textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, 270], [x + boxW + gap - 2, 270], { color: '#94a3b8', strokeWidth: 1.5 }));
    });
    s.push(txt('Exponential backoff + jitter prevents thundering herd', 400, 440, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P96. RATE LIMITING ALGORITHMS ──────────────────────────────────────────────
define({
  id: 'prog_rate_limiting', intent: 'compare', label: 'Rate limiting algorithms',
  capacity: { algorithms: 3 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const algorithms = (d.algorithms || d.items || []).slice(0, 3);
    const defs = [
      { title: 'Token Bucket', detail: 'Tokens refill at fixed rate, burst allowed', pros: '+ Flexible bursts', cons: '- Memory per user' },
      { title: 'Leaky Bucket', detail: 'Requests processed at constant rate', pros: '+ Smooth output', cons: '- No bursting' },
      { title: 'Sliding Window', detail: 'Count requests in rolling time window', pros: '+ Precise', cons: '- More compute' },
    ];
    const list = algorithms.length ? algorithms : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a'];
    const boxW = 230, gap = 16;
    const x0 = (W - boxW * 3 - gap * 2) / 2;
    list.slice(0, 3).forEach((a, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 120, boxW, 270, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, 120, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(txt(anchor(itemText(a.title || a), 5), x + boxW / 2, 150, { fontSize: 15, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (a.detail) s.push(txt(anchor(a.detail, 9), x + boxW / 2, 212, { fontSize: 11, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      if (a.pros) { s.push(rect(x + 12, 248, boxW - 24, 26, { fill: '#f0fdf4', stroke: '#16a34a', strokeWidth: 1, rx: 4 })); s.push(txt(a.pros, x + boxW / 2, 267, { fontSize: 10, fontWeight: '600', color: '#166534', textAnchor: 'middle' })); }
      if (a.cons) { s.push(rect(x + 12, 280, boxW - 24, 26, { fill: '#fee2e2', stroke: '#dc2626', strokeWidth: 1, rx: 4 })); s.push(txt(a.cons, x + boxW / 2, 299, { fontSize: 10, fontWeight: '600', color: '#991b1b', textAnchor: 'middle' })); }
    });
    s.push(txt('Prevent abuse by controlling request frequency', 400, 450, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P97. CIRCUIT BREAKER PATTERN ───────────────────────────────────────────────
define({
  id: 'prog_circuit_breaker', intent: 'process', label: 'Circuit breaker pattern',
  capacity: { states: 3 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const states = (d.states || d.items || []).slice(0, 3);
    const defs = ['Closed', 'Open', 'Half-Open'];
    const list = states.length ? states : defs.map((t) => ({ title: t }));
    const cols = ['#16a34a', '#dc2626', '#f59e0b'];
    const cx = [180, 400, 620];
    const icons = ['lock', 'warning', 'refresh'];
    list.slice(0, 3).forEach((st, i) => {
      s.push(circle(cx[i], 240, 50, { fill: cols[i], stroke: cols[i] }));
      s.push(obj(icons[i], cx[i] - 14, 222, 28, 28, { accent: '#ffffff' }));
      s.push(txt(anchor(itemText(st.title || st), 4), cx[i], 272, { fontSize: 14, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 8), cx[i], 320, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
    });
    s.push(path('M 230 240 Q 315 180 350 240', { stroke: '#16a34a', strokeWidth: 2, markerEnd: 'arrow' }));
    s.push(txt('Success threshold', 290, 175, { fontSize: 9, fontWeight: '600', color: '#16a34a', textAnchor: 'middle' }));
    s.push(arrow([450, 240], [570, 240], { color: '#dc2626', strokeWidth: 2 }));
    s.push(txt('Failure threshold', 510, 226, { fontSize: 9, fontWeight: '600', color: '#dc2626', textAnchor: 'middle' }));
    s.push(path('M 620 290 Q 580 380 530 295', { stroke: '#f59e0b', strokeWidth: 2, markerEnd: 'arrow', dashed: true }));
    s.push(txt('Timeout expires', 570, 360, { fontSize: 9, fontWeight: '600', color: '#f59e0b', textAnchor: 'middle' }));
    return s;
  },
});

// ── P98. CQRS PATTERN ─────────────────────────────────────────────────────────
define({
  id: 'prog_cqrs', intent: 'process', label: 'CQRS pattern',
  capacity: { parts: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const parts = (d.parts || d.items || []).slice(0, 4);
    const defs = ['Command', 'Command Handler', 'Query', 'Query Handler'];
    const list = parts.length ? parts : defs.map((t) => ({ title: t }));
    const cols = ['#2563eb', '#2563eb', '#16a34a', '#16a34a'];
    const boxW = 170, gap = 14;
    const x0 = (W - boxW * 4 - gap * 3) / 2;
    const icons = ['pencil_edit', 'cog_icon', 'search', 'zap'];
    list.slice(0, 4).forEach((pt, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 190;
      s.push(rect(x, y, boxW, 100, { stroke: cols[i], strokeWidth: 2, fill: i < 2 ? '#eff6ff' : '#f0fdf4', rx: 8 }));
      s.push(rect(x, y, boxW, 6, { fill: cols[i], stroke: cols[i], rx: 0 }));
      s.push(obj(icons[i], x + boxW / 2 - 14, y + 16, 28, 28, { accent: cols[i] }));
      s.push(txt(anchor(itemText(pt.title || pt), 4), x + boxW / 2, y + 66, { fontSize: 12, fontWeight: '800', color: cols[i], textAnchor: 'middle' }));
      if (i === 1 || i === 3) s.push(arrow([x + boxW + 2, y + 50], [x + boxW + gap - 2, y + 50], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(rect(150, 320, 500, 50, { stroke: p.accent, strokeWidth: 1.8, fill: p.soft, rx: 8 }));
    s.push(txt('Separate read and write models for scalability', 400, 350, { fontSize: 13, fontWeight: '600', color: p.accent, textAnchor: 'middle' }));
    s.push(txt('Commands mutate state, Queries read state', 400, 430, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P99. EVENT SOURCING ─────────────────────────────────────────────────────────
define({
  id: 'prog_event_sourcing', intent: 'process', label: 'Event sourcing pattern',
  capacity: { events: 4 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const events = (d.events || d.items || []).slice(0, 4);
    const defs = ['UserCreated', 'EmailVerified', 'OrderPlaced', 'PaymentReceived'];
    const list = events.length ? events : defs.map((t) => ({ title: t }));
    const n = Math.min(list.length, 4);
    const boxW = 170, gap = 10;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed'];
    list.slice(0, n).forEach((ev, i) => {
      const x = x0 + i * (boxW + gap);
      const y = 180;
      s.push(rect(x, y, boxW, 160, { stroke: cols[i], strokeWidth: 2, fill: '#ffffff', rx: 10 }));
      s.push(rect(x, y, boxW, 44, { fill: cols[i], stroke: cols[i], rx: 10 }));
      s.push(badge('Event', x + boxW - 40, y - 10, { bg: cols[i] }));
      s.push(txt(anchor(itemText(ev.title || ev), 4), x + boxW / 2, 244, { fontSize: 12, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (ev.detail) s.push(txt(anchor(ev.detail, 7), x + boxW / 2, 286, { fontSize: 10, fontWeight: '500', color: '#475569', textAnchor: 'middle' }));
      s.push(rect(x + 14, 308, boxW - 28, 22, { fill: '#f8fafc', stroke: '#e2e8f0', strokeWidth: 1, rx: 4 }));
      const labels = ['v1', 'v2', 'v3', 'v4'];
      s.push(txt('Version: ' + labels[i], x + boxW / 2, 324, { fontSize: 9, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, 260], [x + boxW + gap - 2, 260], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(txt('Event store is the source of truth, not the current state', 400, 440, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P100. TWELVE-FACTOR APP ────────────────────────────────────────────────────
define({
  id: 'prog_twelve_factor', intent: 'define', label: 'Twelve-factor app methodology',
  capacity: { factors: 6 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const factors = (d.factors || d.items || []).slice(0, 6);
    const defs = [
      { num: 'I', title: 'Codebase', detail: 'One repo, many deploys' },
      { num: 'II', title: 'Dependencies', detail: 'Explicitly declare & isolate' },
      { num: 'III', title: 'Config', detail: 'Store config in environment' },
      { num: 'IV', title: 'Backing Services', detail: 'Treat as attached resources' },
      { num: 'V', title: 'Build/Release/Run', detail: 'Strict separation of stages' },
      { num: 'VI', title: 'Processes', detail: 'Stateless, share nothing' },
    ];
    const list = factors.length ? factors : defs;
    const cols = ['#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#0d9488', '#f59e0b'];
    const boxW = 350, boxH = 60, gap = 10;
    const x0 = (W - boxW * 2 - gap) / 2;
    list.slice(0, 6).forEach((f, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = x0 + col * (boxW + gap);
      const y = 112 + row * (boxH + gap);
      s.push(rect(x, y, boxW, boxH, { stroke: cols[i], strokeWidth: 1.8, fill: i % 2 === 0 ? '#ffffff' : p.soft, rx: 6 }));
      s.push(badge(f.num || '', x + 8, y - 8, { bg: cols[i] }));
      s.push(txt(anchor(itemText(f.title || f), 5), x + 48, y + 24, { fontSize: 14, fontWeight: '800', color: cols[i] }));
      if (f.detail) s.push(txt(anchor(f.detail, 10), x + 48, y + 44, { fontSize: 10, fontWeight: '500', color: '#64748b' }));
    });
    s.push(txt('Methodology for building SaaS applications', 400, 460, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P101. CPU ARCHITECTURE ───────────────────────────────────────────────────
define({
  id: 'prog_cpu_arch', intent: 'define', label: 'CPU architecture & pipeline',
  capacity: { stages: 5, cores: 4 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || d.items || []).slice(0, 5);
    const defStages = ['Fetch', 'Decode', 'Execute', 'Memory', 'Writeback'];
    const list = stages.length ? stages : defStages.map((t) => ({ title: t }));
    const n = Math.min(list.length, 5);
    const boxW = 130, gap = 8;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const colors = ['#2563eb', '#0d9488', '#ea580c', '#7c3aed', '#16a34a'];
    list.slice(0, n).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 180, boxW, 48, { fill: colors[i], stroke: colors[i], rx: 6 }));
      s.push(txt(anchor(itemText(st.title || st), 5), x + boxW / 2, 210, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, 204], [x + boxW + gap - 2, 204], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(rect(60, 260, 680, 80, { fill: '#0f172a', stroke: '#1e293b', rx: 8 }));
    s.push(txt('Pipeline States', 400, 282, { fontSize: 13, fontWeight: '700', color: '#94a3b8', textAnchor: 'middle' }));
    const stagesList = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    stagesList.forEach((st, i) => {
      const x = 100 + i * 140;
      s.push(rect(x, 294, 110, 30, { fill: p.soft, stroke: p.accent, strokeWidth: 1, rx: 4 }));
      s.push(txt(st, x + 55, 314, { fontSize: 11, fontWeight: '700', color: p.accent, textAnchor: 'middle' }));
    });
    s.push(txt('Clock cycles advance left → right, one instruction per stage', 400, 370, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    s.push(txt('Superscalar: multiple instructions per cycle | Hazards: RAW, WAR, WAW', 400, 450, { fontSize: 10, color: '#94a3b8', textAnchor: 'middle' }));
    return s;
  },
});

// ── P102. COMPILER DESIGN ────────────────────────────────────────────────────
define({
  id: 'prog_compiler_design', intent: 'process', label: 'Compiler stages',
  capacity: { stages: 6 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const stages = (d.stages || d.steps || []).slice(0, 6);
    const defs = [
      { title: 'Lexer', detail: 'Tokenization' },
      { title: 'Parser', detail: 'AST construction' },
      { title: 'Semantic', detail: 'Type checking' },
      { title: 'IR Gen', detail: 'Intermediate code' },
      { title: 'Optimizer', detail: 'Constant folding' },
      { title: 'Codegen', detail: 'Machine code' },
    ];
    const list = stages.length ? stages : defs;
    const n = Math.min(list.length, 6);
    const boxW = 110, gap = 8;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    const cols = ['#7c3aed', '#2563eb', '#0d9488', '#ea580c', '#f59e0b', '#16a34a'];
    list.slice(0, n).forEach((st, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 170, boxW, 70, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(txt(anchor(itemText(st.title || st), 4), x + boxW / 2, 203, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      if (st.detail) s.push(txt(anchor(st.detail, 6), x + boxW / 2, 225, { fontSize: 9, fontWeight: '500', color: 'rgba(255,255,255,0.8)', textAnchor: 'middle' }));
      if (i < n - 1) s.push(arrow([x + boxW + 2, 205], [x + boxW + gap - 2, 205], { color: '#94a3b8', strokeWidth: 2 }));
    });
    s.push(txt('Source code → Token stream → Parse tree → IR → Optimized IR → Assembly', 400, 300, { fontSize: 11, fontWeight: '600', color: p.accent, textAnchor: 'middle' }));
    s.push(rect(180, 320, 440, 36, { fill: p.soft, stroke: p.accent, strokeWidth: 1, rx: 6 }));
    s.push(txt('Frontend (language-specific)  →  Middle-end (optimization)  →  Backend (target)', 400, 344, { fontSize: 10, fontWeight: '600', color: p.deep, textAnchor: 'middle' }));
    s.push(txt('Examples: GCC (RTL), LLVM (LLVM IR), V8 (TurboFan)', 400, 450, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P103. NETWORK PACKET STRUCTURE ───────────────────────────────────────────
define({
  id: 'prog_network_packet', intent: 'define', label: 'TCP/IP packet structure',
  capacity: { headers: 7 },
  fill(d, ctx) {
    const p = PALETTES[6];
    const s = [...header(ctx, p.accent)];
    const headers = (d.headers || d.items || []).slice(0, 7);
    const defs = [
      { field: 'Source Port', bits: 16, color: '#2563eb' },
      { field: 'Dest Port', bits: 16, color: '#0d9488' },
      { field: 'Seq Number', bits: 32, color: '#ea580c' },
      { field: 'Ack Number', bits: 32, color: '#7c3aed' },
      { field: 'Flags (SYN,ACK,FIN)', bits: 9, color: '#f59e0b' },
      { field: 'Window Size', bits: 16, color: '#16a34a' },
      { field: 'Urgent Pointer', bits: 16, color: '#db2777' },
    ];
    const list = headers.length ? headers : defs;
    const n = Math.min(list.length, 7);
    const rowH = 34, gap = 4;
    const startY = 110;
    list.slice(0, n).forEach((h, i) => {
      const y = startY + i * (rowH + gap);
      s.push(rect(140, y, 520, rowH, { fill: h.color || p.soft, stroke: h.color || p.accent, strokeWidth: 1.5, rx: 4 }));
      s.push(txt(anchor(itemText(h.field || h.title), 8), 160, y + rowH / 2 + 5, { fontSize: 12, fontWeight: '700', color: '#ffffff', textAnchor: 'start' }));
      const bits = h.bits || h.size || 32;
      s.push(badge(bits + 'b', 640, y + 2, { bg: 'rgba(255,255,255,0.2)', fontSize: 9 }));
    });
    s.push(rect(140, startY + n * (rowH + gap) + 4, 520, 20, { fill: '#0f172a', stroke: '#334155', rx: 4 }));
    s.push(txt('Total: ' + list.reduce((a, h) => a + (h.bits || h.size || 32), 0) + ' bits (min)', 400, startY + n * (rowH + gap) + 18, { fontSize: 10, color: '#94a3b8', textAnchor: 'middle', fontWeight: '600' }));
    s.push(txt('TCP segment encapsulated in IP packet → Ethernet frame', 400, 450, { fontSize: 11, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P104. STATE MACHINE ──────────────────────────────────────────────────────
define({
  id: 'prog_state_machine', intent: 'process', label: 'Finite state machine',
  capacity: { states: 5, transitions: 6 },
  fill(d, ctx) {
    const p = PALETTES[1];
    const s = [...header(ctx, p.accent)];
    const states = (d.states || d.items || []).slice(0, 5);
    const defStates = [
      { label: 'Idle', x: 120, y: 320 },
      { label: 'Loading', x: 350, y: 180 },
      { label: 'Processing', x: 580, y: 280 },
      { label: 'Success', x: 450, y: 400 },
      { label: 'Error', x: 200, y: 200 },
    ];
    const list = states.length ? states : defStates;
    const n = Math.min(list.length, 5);
    const transitions = [
      [0, 1], [1, 2], [2, 3], [2, 4], [4, 0], [3, 0]
    ];
    transitions.slice(0, 6).forEach(([from, to]) => {
      if (from < n && to < n) {
        const f = list[from], t = list[to];
        const fx = f.x || (typeof f === 'object' && f.position ? f.position[0] : 200 + from * 120);
        const fy = f.y || (typeof f === 'object' && f.position ? f.position[1] : 200 + (from % 2) * 80);
        const tx = t.x || (typeof t === 'object' && t.position ? t.position[0] : 200 + to * 120);
        const ty = t.y || (typeof t === 'object' && t.position ? t.position[1] : 200 + (to % 2) * 80);
        s.push(arrow([fx + 40, fy + 30], [tx - 40, ty + 30], { color: '#94a3b8', strokeWidth: 1.5 }));
      }
    });
    list.slice(0, n).forEach((st, i) => {
      const sx = st.x || (typeof st === 'object' && st.position ? st.position[0] : 120 + i * 140);
      const sy = st.y || (typeof st === 'object' && st.position ? st.position[1] : 180 + (i % 2) * 80);
      const isAccept = i === 3 || i === 0;
      s.push(circle(sx + 40, sy + 30, 36, { fill: p.soft, stroke: isAccept ? '#16a34a' : p.accent, strokeWidth: isAccept ? 3 : 2 }));
      if (isAccept) s.push(circle(sx + 40, sy + 30, 28, { fill: 'none', stroke: '#16a34a', strokeWidth: 1.5 }));
      s.push(txt(anchor(itemText(st.label || st.title || 'S' + i), 4), sx + 40, sy + 34, { fontSize: 9, fontWeight: '700', color: p.deep, textAnchor: 'middle' }));
    });
    s.push(txt('Deterministic finite automaton (DFA): each input triggers exactly one transition', 400, 450, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P105. TURING MACHINE ─────────────────────────────────────────────────────
define({
  id: 'prog_turing_machine', intent: 'define', label: 'Turing machine model',
  capacity: { tape: 10, transitions: 4 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const tape = (d.tape || d.items || '0101 1010').slice(0, 10);
    const tapeStr = Array.isArray(tape) ? tape.join('') : String(tape).replace(/\s/g, '');
    const symbols = tapeStr.split('').slice(0, 10);
    const cellW = 56, cellH = 48;
    const tapeX0 = (W - symbols.length * cellW) / 2;
    symbols.forEach((sym, i) => {
      const x = tapeX0 + i * cellW;
      s.push(rect(x, 200, cellW, cellH, { fill: i === 3 ? '#fef3c7' : '#ffffff', stroke: i === 3 ? '#f59e0b' : '#cbd5e1', strokeWidth: i === 3 ? 2.5 : 1.5, rx: 0 }));
      s.push(txt(sym, x + cellW / 2, 232, { fontSize: 20, fontWeight: '800', color: '#0f172a', textAnchor: 'middle' }));
    });
    s.push(txt('Tape (infinite →)', 400, 188, { fontSize: 11, fontWeight: '600', color: '#64748b', textAnchor: 'middle' }));
    s.push(rect(tapeX0 + 3 * cellW - 8, 260, cellW + 16, 20, { fill: p.accent, stroke: p.accent, rx: 4 }));
    s.push(txt('Read/Write Head', tapeX0 + 3 * cellW, 275, { fontSize: 8, fontWeight: '700', color: '#ffffff', textAnchor: 'middle' }));
    s.push(arrow([tapeX0 + 3 * cellW + cellW / 2, 248], [tapeX0 + 3 * cellW + cellW / 2, 262], { color: p.accent, strokeWidth: 2 }));
    s.push(rect(200, 310, 400, 60, { fill: p.soft, stroke: p.accent, strokeWidth: 1.5, rx: 8 }));
    s.push(txt('Finite Control (States)', 400, 330, { fontSize: 12, fontWeight: '700', color: p.deep, textAnchor: 'middle' }));
    s.push(txt('δ(state, symbol) → (new_state, write_symbol, L|R)', 400, 355, { fontSize: 10, fontWeight: '600', color: '#475569', textAnchor: 'middle' }));
    s.push(txt('Church-Turing thesis: anything computable can be computed by a TM', 400, 450, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P106. BLOCKCHAIN ─────────────────────────────────────────────────────────
define({
  id: 'prog_blockchain', intent: 'process', label: 'Blockchain architecture',
  capacity: { blocks: 5 },
  fill(d, ctx) {
    const p = PALETTES[3];
    const s = [...header(ctx, p.accent)];
    const blocks = (d.blocks || d.items || []).slice(0, 5);
    const defs = [
      { index: 0, data: 'Genesis Block', hash: '0x0000...', nonce: 0 },
      { index: 1, data: 'Transaction A', hash: '0x1a2b...', nonce: 1423 },
      { index: 2, data: 'Transaction B', hash: '0x3c4d...', nonce: 8912 },
      { index: 3, data: 'Contract Call', hash: '0x5e6f...', nonce: 4451 },
      { index: 4, data: 'Mining Reward', hash: '0x7a8b...', nonce: 9203 },
    ];
    const list = blocks.length ? blocks : defs;
    const n = Math.min(list.length, 5);
    const boxW = 130, gap = 12;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    list.slice(0, n).forEach((b, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 150, boxW, 130, { fill: '#ffffff', stroke: p.accent, strokeWidth: 2, rx: 8 }));
      if (i > 0) {
        s.push(arrow([x - gap + 2, 215], [x - 2, 215], { color: '#94a3b8', strokeWidth: 2 }));
        s.push(path('M ' + (x - 6) + ' 215 L ' + (x - 2) + ' 209 M ' + (x - 6) + ' 215 L ' + (x - 2) + ' 221', { stroke: '#94a3b8', strokeWidth: 1.5 }));
      }
      s.push(rect(x + 6, 158, boxW - 12, 22, { fill: p.accent, stroke: p.accent, rx: 4 }));
      s.push(txt('Block #' + (b.index || i), x + boxW / 2, 174, { fontSize: 9, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(itemText(b.data || b.title), 5), x + boxW / 2, 210, { fontSize: 9, fontWeight: '600', color: '#0f172a', textAnchor: 'middle' }));
      const hash = b.hash || (typeof b === 'object' ? b.tx_hash || b.hash_value : '');
      s.push(txt(hash ? 'Hash: ' + String(hash).slice(0, 10) : 'hash: ...', x + boxW / 2, 240, { fontSize: 7, color: '#64748b', textAnchor: 'middle' }));
      s.push(txt('Nonce: ' + (b.nonce || b.id || i * 100), x + boxW / 2, 260, { fontSize: 7, color: '#94a3b8', textAnchor: 'middle' }));
    });
    s.push(txt('Each block contains hash of previous block → immutable chain', 400, 330, { fontSize: 11, fontWeight: '600', color: p.deep, textAnchor: 'middle' }));
    s.push(rect(200, 350, 400, 30, { fill: p.soft, stroke: p.accent, strokeWidth: 1, rx: 6 }));
    s.push(txt('Consensus: PoW / PoS | Immutability: hash chain | Security: 51% attack', 400, 370, { fontSize: 8, fontWeight: '600', color: p.deep, textAnchor: 'middle' }));
    s.push(txt('Applications: cryptocurrencies, smart contracts, supply chain, DAOs', 400, 450, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P107. QUANTUM COMPUTING ───────────────────────────────────────────────────
define({
  id: 'prog_quantum', intent: 'define', label: 'Quantum computing basics',
  capacity: { gates: 5 },
  fill(d, ctx) {
    const p = PALETTES[2];
    const s = [...header(ctx, p.accent)];
    const gates = (d.gates || d.items || []).slice(0, 5);
    const defs = [
      { symbol: 'H', name: 'Hadamard', desc: 'Creates superposition' },
      { symbol: 'X', name: 'Pauli-X (NOT)', desc: 'Bit flip' },
      { symbol: 'Z', name: 'Pauli-Z', desc: 'Phase flip' },
      { symbol: '⊗', name: 'CNOT', desc: 'Controlled-NOT, entangles' },
      { symbol: 'S', name: 'Phase Gate', desc: 'π/2 phase shift' },
    ];
    const list = gates.length ? gates : defs;
    const n = Math.min(list.length, 5);
    const boxW = 140, gap = 8;
    const total = boxW * n + gap * (n - 1);
    const x0 = (W - total) / 2;
    s.push(txt('Fundamental Quantum Gates', 400, 110, { fontSize: 14, fontWeight: '700', color: p.deep, textAnchor: 'middle' }));
    list.slice(0, n).forEach((g, i) => {
      const x = x0 + i * (boxW + gap);
      s.push(rect(x, 140, boxW, 90, { fill: '#ffffff', stroke: p.accent, strokeWidth: 1.5, rx: 8 }));
      s.push(circle(x + boxW / 2, 175, 18, { fill: p.soft, stroke: p.accent, strokeWidth: 2 }));
      s.push(txt(g.symbol || String.fromCharCode(9733), x + boxW / 2, 180, { fontSize: 16, fontWeight: '800', color: p.accent, textAnchor: 'middle' }));
      s.push(txt(anchor(g.name || g.title, 6), x + boxW / 2, 210, { fontSize: 9, fontWeight: '700', color: '#0f172a', textAnchor: 'middle' }));
      if (g.desc) s.push(txt(anchor(g.desc, 6), x + boxW / 2, 224, { fontSize: 7, color: '#64748b', textAnchor: 'middle' }));
    });
    s.push(txt('Qubit: |ψ⟩ = α|0⟩ + β|1⟩, |α|² + |β|² = 1', 400, 280, { fontSize: 12, fontWeight: '700', color: p.deep, textAnchor: 'middle' }));
    s.push(rect(160, 300, 480, 50, { fill: p.soft, stroke: p.accent, strokeWidth: 1, rx: 6 }));
    s.push(txt('Quantum supremacy: tasks impractical for classical computers', 400, 320, { fontSize: 10, fontWeight: '600', color: p.deep, textAnchor: 'middle' }));
    s.push(txt('Applications: cryptography (Shor), search (Grover), simulation', 400, 340, { fontSize: 9, color: '#475569', textAnchor: 'middle' }));
    s.push(txt('Challenges: decoherence, error correction, qubit stability', 400, 450, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P108. CODE DIFF / PR REVIEW ──────────────────────────────────────────────
define({
  id: 'prog_code_diff', intent: 'compare', label: 'Code diff & pull request',
  capacity: { changes: 6 },
  fill(d, ctx) {
    const p = PALETTES[4];
    const s = [...header(ctx, p.accent)];
    const changes = (d.changes || d.lines || d.items || []).slice(0, 6);
    const defs = [
      { type: 'add', text: 'function calculateTotal(items) {' },
      { type: 'add', text: '  return items.reduce((sum, item) => sum + item.price, 0);' },
      { type: 'remove', text: '  let total = 0;' },
      { type: 'remove', text: '  for (let i = 0; i < items.length; i++) {' },
      { type: 'remove', text: '    total += items[i].price;' },
      { type: 'context', text: '  }' },
    ];
    const list = changes.length ? changes : defs;
    const n = Math.min(list.length, 8);
    const lineH = 28;
    const startY = 120;
    const diffW = 600;
    const diffX = (W - diffW) / 2;
    s.push(rect(diffX, 100, diffW, 30, { fill: '#0f172a', stroke: '#334155', rx: 6 }));
    s.push(txt('src/utils.js — Pull Request #42', diffX + 16, 120, { fontSize: 11, fontWeight: '700', color: '#e2e8f0', textAnchor: 'start' }));
    s.push(badge('+2 -3', diffX + diffW - 70, 102, { bg: '#16a34a', fontSize: 10 }));
    list.slice(0, n).forEach((ln, i) => {
      const y = startY + i * lineH;
      const bg = ln.type === 'add' ? '#dcfce7' : ln.type === 'remove' ? '#fee2e2' : '#f8fafc';
      const stroke = ln.type === 'add' ? '#86efac' : ln.type === 'remove' ? '#fca5a5' : '#e2e8f0';
      const textColor = ln.type === 'add' ? '#166534' : ln.type === 'remove' ? '#991b1b' : '#475569';
      const prefix = ln.type === 'add' ? '+ ' : ln.type === 'remove' ? '- ' : '  ';
      s.push(rect(diffX, y, diffW, lineH, { fill: bg, stroke, strokeWidth: 0.5, rx: 0, flat: true }));
      s.push(txt(prefix + anchor(ln.text || ln, 16), diffX + 12, y + 18, { fontSize: 11, fontWeight: '600', color: textColor, textAnchor: 'start' }));
    });
    s.push(txt('Code review: verify correctness, style, security, performance', 400, 450, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P109. MATH FORMULAS (CS FOUNDATIONS) ─────────────────────────────────────
define({
  id: 'prog_math_formulas', intent: 'formula', label: 'CS math foundations',
  capacity: { formulas: 6 },
  fill(d, ctx) {
    const p = PALETTES[0];
    const s = [...header(ctx, p.accent)];
    const formulas = (d.formulas || d.items || []).slice(0, 6);
    const defs = [
      { name: 'Boolean Algebra', formula: 'A · (B + C) = A·B + A·C', detail: 'Distributive law' },
      { name: 'Set Theory', formula: '|A ∪ B| = |A| + |B| - |A ∩ B|', detail: 'Inclusion-exclusion' },
      { name: 'Logarithm', formula: 'log_b (x·y) = log_b x + log_b y', detail: 'Log product identity' },
      { name: 'Summation', formula: '∑ᵢ₌₁ⁿ i = n(n+1)/2', detail: 'Arithmetic series' },
      { name: 'Combinations', formula: 'C(n,k) = n!/(k!(n-k)!)', detail: 'Binomial coefficient' },
      { name: 'Exponential', formula: 'eˣ = ∑ₙ₌₀^∞ xⁿ/n!', detail: 'Taylor series' },
    ];
    const list = formulas.length ? formulas : defs;
    const n = Math.min(list.length, 6);
    const cols = ['#2563eb', '#0d9488', '#ea580c', '#7c3aed', '#f59e0b', '#16a34a'];
    const boxW = 220, gap = 12;
    const colN = 2;
    const x0 = (W - (boxW * colN + gap * (colN - 1))) / 2;
    list.slice(0, n).forEach((f, i) => {
      const col = i % colN, row = Math.floor(i / colN);
      const x = x0 + col * (boxW + gap);
      const y = 100 + row * 110;
      s.push(rect(x, y, boxW, 96, { fill: '#ffffff', stroke: cols[i], strokeWidth: 1.8, rx: 8 }));
      s.push(rect(x, y, boxW, 24, { fill: cols[i], stroke: cols[i], rx: 8 }));
      s.push(txt(anchor(itemText(f.name || f.title), 8), x + boxW / 2, y + 17, { fontSize: 11, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(txt(anchor(f.formula || f.text || String(f), 12), x + boxW / 2, y + 56, { fontSize: 12, fontWeight: '700', color: '#0f172a', textAnchor: 'middle' }));
      if (f.detail) s.push(txt(anchor(f.detail, 10), x + boxW / 2, y + 80, { fontSize: 9, fontWeight: '500', color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    });
    s.push(txt('Foundational math for CS: complexity analysis, cryptography, data science', 400, 455, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});

// ── P110. ADVANCED DB NORMALIZATION ───────────────────────────────────────────
define({
  id: 'prog_db_normalization', intent: 'process', label: 'DB normalization forms',
  capacity: { forms: 5 },
  fill(d, ctx) {
    const p = PALETTES[5];
    const s = [...header(ctx, p.accent)];
    const forms = (d.forms || d.items || []).slice(0, 5);
    const defs = [
      { name: '1NF', title: 'Atomic values', detail: 'No repeating groups, each cell has one value' },
      { name: '2NF', title: 'Partial dependency', detail: 'Every non-key attr fully depends on whole PK' },
      { name: '3NF', title: 'Transitive dependency', detail: 'No non-key attr depends on another non-key' },
      { name: 'BCNF', title: 'Boyce-Codd', detail: 'Every determinant is a candidate key' },
      { name: '4NF', title: 'Multivalued dependency', detail: 'No multi-valued facts about an entity' },
    ];
    const list = forms.length ? forms : defs;
    const n = Math.min(list.length, 5);
    const boxW = 680, rowH = 54, gap = 6;
    const x = (W - boxW) / 2;
    s.push(txt('Normalization: systematically reduce redundancy & avoid anomalies', 400, 100, { fontSize: 13, fontWeight: '600', color: p.deep, textAnchor: 'middle' }));
    list.slice(0, n).forEach((f, i) => {
      const y = 120 + i * (rowH + gap);
      const colors = ['#2563eb', '#0d9488', '#ea580c', '#7c3aed', '#16a34a'];
      s.push(rect(x, y, 60, rowH, { fill: colors[i], stroke: colors[i], rx: 4 }));
      s.push(txt(anchor(f.name || 'NF', 4), x + 30, y + rowH / 2 + 4, { fontSize: 10, fontWeight: '800', color: '#ffffff', textAnchor: 'middle' }));
      s.push(rect(x + 64, y, boxW - 64, rowH, { fill: '#ffffff', stroke: colors[i], strokeWidth: 1.5, rx: 4 }));
      s.push(txt(anchor(f.title || f.name, 8), x + 80, y + 20, { fontSize: 12, fontWeight: '700', color: colors[i], textAnchor: 'start' }));
      if (f.detail) s.push(txt(anchor(f.detail, 16), x + 80, y + 40, { fontSize: 9, fontWeight: '500', color: '#64748b', textAnchor: 'start' }));
      if (i < n - 1) s.push(arrow([x + 30, y + rowH + gap], [x + 30, y + rowH + gap + 12], { color: '#94a3b8', strokeWidth: 1.5 }));
    });
    s.push(txt('Each normal form eliminates a specific type of redundancy', 400, 455, { fontSize: 10, color: '#64748b', textAnchor: 'middle', fontStyle: 'italic' }));
    return s;
  },
});
}
