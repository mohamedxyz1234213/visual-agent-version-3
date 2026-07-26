// =============================================================================
// Programming SVG Shape Library — 300+ shapes for coding/CS whiteboards
// =============================================================================
// Adds to the existing svgShapeLibrary.js without modifying original shapes.
// Call registerProgrammingShapes(SHAPE_REGISTRY, SHAPE_ALIASES) to wire in.
// =============================================================================

function _circle(cx, cy, r, fill = '#ffffff', stroke = '#475569', sw = 2) {
  return { type: 'draw_circle', center: [cx, cy], radius: r, style: { fill, stroke, strokeWidth: sw } };
}
function _rect(x, y, w, h, fill = '#ffffff', stroke = '#475569', sw = 2, rx = 8) {
  return { type: 'draw_rect', x, y, width: w, height: h, style: { fill, stroke, strokeWidth: sw, rx } };
}
function _text(content, x, y, opts = {}) {
  return { type: 'draw_text', content, position: [x, y], style: { fontSize: opts.fs ?? 14, color: opts.color ?? '#1e293b', fontWeight: opts.fw ?? '600', textAnchor: opts.anchor ?? 'middle' } };
}
function _line(x1, y1, x2, y2, color = '#475569', sw = 2, dashed = false) {
  const style = { color, strokeWidth: sw };
  if (dashed) style.strokeDasharray = '8,5';
  return { type: 'draw_line', from: [x1, y1], to: [x2, y2], style };
}
function _arrow(x1, y1, x2, y2, color = '#475569', sw = 2, dashed = false) {
  const style = { color, strokeWidth: sw };
  if (dashed) style.strokeDasharray = '8,5';
  return { type: 'draw_arrow', from: [x1, y1], to: [x2, y2], style };
}
function _path(d, stroke = '#475569', fill = 'none', sw = 2) {
  return { type: 'draw_path', d, style: { stroke, fill, strokeWidth: sw } };
}

// =============================================================================
// PREMIUM HELPERS — gradient, shadow, layered rendering
// =============================================================================
function _gradRect(x, y, w, h, gradId, stroke = '#475569', sw = 1.5, rx = 8) {
  return { type: 'draw_rect', x, y, width: w, height: h, style: { fill: `url(#${gradId})`, stroke, strokeWidth: sw, rx } };
}
function _gradCircle(cx, cy, r, gradId, stroke = '#475569', sw = 1.5) {
  return { type: 'draw_circle', center: [cx, cy], radius: r, style: { fill: `url(#${gradId})`, stroke, strokeWidth: sw } };
}
function _shadowRect(x, y, w, h, fill = '#ffffff', stroke = '#475569', sw = 1.5, rx = 10) {
  return { type: 'draw_rect', x, y, width: w, height: h, style: { fill, stroke, strokeWidth: sw, rx, filter: 'url(#shadow-depth)' } };
}
function _depthBox(x, y, w, h, gradId) {
  const segs = [];
  segs.push({ type: 'draw_rect', x, y, width: w, height: h, style: { fill: `url(#${gradId})`, rx: 10, filter: 'url(#shadow-depth)' } });
  segs.push({ type: 'draw_rect', x: x + 4, y: y + 4, width: w - 8, height: h - 8, style: { fill: 'none', stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.5, rx: 8 } });
  return segs;
}
function _badge(content, x, y, bg = '#3b82f6', color = '#ffffff') {
  return { type: 'draw_badge', content, position: [x, y], style: { bg, color, fontSize: 10 } };
}
function _callout(content, x, y, w = 120, bg = '#f8fafc', stroke = '#94a3b8') {
  return { type: 'draw_callout', content, position: [x, y], width: w, style: { bg, stroke, color: '#1e293b' } };
}

// =============================================================================
// DATA STRUCTURES (20 shapes)
// =============================================================================

function shapeArrayLinear(x, y, w, h) {
  const segs = []; const n = 8; const cw = w / n; const cy = y + h * 0.25;
  for (let i = 0; i < n; i++) {
    segs.push(_rect(x + i * cw, cy, cw - 1, 40, i % 2 === 0 ? '#dbeafe' : '#ffffff', '#64748b', 1.5, 2));
    segs.push(_text(String(i), x + i * cw + cw / 2, cy + 24, { fs: 13, color: '#1e293b', anchor: 'middle' }));
  }
  segs.push(_text('Array - contiguous memory, O(1) index access', x + w / 2, y + h * 0.85, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeArray2D(x, y, w, h) {
  const segs = []; const rows = 4; const cols = 5; const cw = w / cols; const ch = 28; const oy = y + h * 0.1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      segs.push(_rect(x + c * cw, oy + r * ch, cw - 1, ch - 1, (r + c) % 2 === 0 ? '#ede9fe' : '#ffffff', '#8b5cf6', 1, 2));
      segs.push(_text(`[${r}][${c}]`, x + c * cw + cw / 2, oy + r * ch + ch / 2 + 4, { fs: 8, color: '#5b21b6', anchor: 'middle' }));
    }
  }
  segs.push(_text('2D Matrix - row-major layout', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeLinkedListSingle(x, y, w, h) {
  const segs = []; const n = 5; const bw = 70; const gap = 30; const sx = x + (w - (bw + gap) * n + gap) / 2;
  for (let i = 0; i < n; i++) {
    const bx = sx + i * (bw + gap);
    segs.push(_rect(bx, y + h * 0.2, bw, 40, '#dbeafe', '#2563eb', 2, 6));
    segs.push(_text(`N${i}`, bx + 20, y + h * 0.38, { fs: 10, color: '#64748b', anchor: 'middle' }));
    segs.push(_rect(bx + 32, y + h * 0.2, 38, 40, '#eff6ff', '#93c5fd', 1.5, 6));
    segs.push(_text('next', bx + 51, y + h * 0.38, { fs: 8, color: '#3b82f6', anchor: 'middle' }));
    segs.push(_text(`[${100 + i}]`, bx + bw / 2, y + h * 0.58, { fs: 8, color: '#94a3b8', anchor: 'middle' }));
    if (i < n - 1) segs.push(_arrow(bx + bw - 4, y + h * 0.4, bx + bw + gap - 16, y + h * 0.4, '#2563eb', 2));
  }
  segs.push(_text('Singly Linked List - O(n) traversal, O(1) insert', x + w / 2, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeLinkedListDouble(x, y, w, h) {
  const segs = []; const n = 4; const bw = 85; const gap = 25; const sx = x + (w - (bw + gap) * n + gap) / 2;
  for (let i = 0; i < n; i++) {
    const bx = sx + i * (bw + gap);
    segs.push(_rect(bx, y + h * 0.18, bw, 45, '#fce7f3', '#db2777', 2, 6));
    segs.push(_rect(bx, y + h * 0.18, 25, 45, '#fdf2f8', '#f9a8d4', 1.5, 6));
    segs.push(_text('p', bx + 9, y + h * 0.4, { fs: 10, color: '#db2777', anchor: 'middle' }));
    segs.push(_text(`N${i}`, bx + 48, y + h * 0.4, { fs: 11, color: '#4a044e', anchor: 'middle' }));
    segs.push(_rect(bx + 60, y + h * 0.18, 25, 45, '#fdf2f8', '#f9a8d4', 1.5, 6));
    segs.push(_text('n', bx + 72, y + h * 0.4, { fs: 10, color: '#db2777', anchor: 'middle' }));
    if (i < n - 1) {
      segs.push(_arrow(bx + bw - 2, y + h * 0.35, bx + bw + gap - 14, y + h * 0.35, '#db2777', 1.5));
      segs.push(_arrow(bx + bw + gap - 14, y + h * 0.55, bx + bw - 2, y + h * 0.55, '#db2777', 1.5));
    }
  }
  segs.push(_text('Doubly Linked List - bidirectional traversal', x + w / 2, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeStackDiagram(x, y, w, h) {
  const segs = []; const n = 5; const bw = w * 0.5; const bh = 30; const sx = x + w * 0.25;
  for (let i = 0; i < n; i++) {
    const by = y + h * 0.7 - i * (bh + 4);
    segs.push(_rect(sx, by, bw, bh, i === n - 1 ? '#fef3c7' : '#ffffff', '#f59e0b', 1.5, 4));
    segs.push(_text(`Item ${n - i}`, sx + bw / 2, by + bh / 2 + 5, { fs: 11, color: i === n - 1 ? '#92400e' : '#475569', anchor: 'middle' }));
  }
  segs.push(_arrow(x + w * 0.85, y + h * 0.68, x + w * 0.85, y + h * 0.25, '#f59e0b', 2));
  segs.push(_text('TOP', x + w * 0.85, y + h * 0.2, { fs: 10, color: '#f59e0b', anchor: 'middle' }));
  segs.push(_text('push/pop O(1)', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeQueueDiagram(x, y, w, h) {
  const segs = []; const n = 5; const bw = 65; const bh = 38; const qy = y + h * 0.3;
  for (let i = 0; i < n; i++) {
    const bx = x + w * 0.15 + i * (bw + 4);
    segs.push(_rect(bx, qy, bw, bh, i === 0 ? '#fef3c7' : i === n - 1 ? '#dbeafe' : '#ffffff', '#2563eb', 1.5, 4));
    segs.push(_text(`J${i + 1}`, bx + bw / 2, qy + bh / 2 + 5, { fs: 12, color: i === n - 1 ? '#1e40af' : '#475569', anchor: 'middle' }));
  }
  segs.push(_arrow(x + w * 0.05, qy + bh / 2, x + w * 0.13, qy + bh / 2, '#059669', 2));
  segs.push(_text('dequeue', x + w * 0.08, qy - 8, { fs: 8, color: '#059669', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.15 + n * (bw + 4) - 4, qy + bh / 2, x + w * 0.15 + n * (bw + 4) + 4, qy + bh / 2, '#2563eb', 2));
  segs.push(_text('enqueue', x + w * 0.15 + n * (bw + 4) + 2, qy - 8, { fs: 8, color: '#2563eb', anchor: 'middle' }));
  segs.push(_text('Queue - FIFO', x + w / 2, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapePriorityQueue(x, y, w, h) {
  const segs = []; const n = 6; const bw = w * 0.55; const bh = 24; const sx = x + w * 0.25;
  const items = [{ v: 15, p: 'High' }, { v: 10, p: 'High' }, { v: 8, p: 'Med' }, { v: 6, p: 'Med' }, { v: 3, p: 'Low' }, { v: 1, p: 'Low' }];
  for (let i = 0; i < n; i++) {
    const by = y + h * 0.2 + i * (bh + 3);
    const col = items[i].p === 'High' ? '#fef2f2' : items[i].p === 'Med' ? '#fffbeb' : '#f0fdf4';
    const ac = items[i].p === 'High' ? '#dc2626' : items[i].p === 'Med' ? '#f59e0b' : '#16a34a';
    segs.push(_rect(sx, by, bw, bh, col, ac, 1.5, 4));
    segs.push(_text(`Priority: ${items[i].v} (${items[i].p})`, sx + bw / 2, by + bh / 2 + 4, { fs: 9, color: ac, anchor: 'middle', fw: '700' }));
  }
  segs.push(_text('Priority Queue - highest priority dequeued first', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeBinaryTree(x, y, w, h) {
  const segs = []; const levels = 4; const nodes = []; const cx = x + w / 2;
  for (let l = 0; l < levels; l++) {
    const count = Math.pow(2, l); const rowY = y + h * 0.08 + l * (h * 0.2);
    for (let i = 0; i < count; i++) {
      const nx = cx + (i - (count - 1) / 2) * (w / (count + 1));
      nodes.push({ x: nx, y: rowY });
      segs.push(_circle(nx, rowY, 14, l === 0 ? '#fef3c7' : '#ffffff', '#f59e0b', 2));
      segs.push(_text(`${l}`, nx, rowY + 5, { fs: 10, color: '#92400e', anchor: 'middle' }));
      if (nodes.length > 1) { const pi = Math.floor((nodes.length - 2) / 2); const p = nodes[pi]; if (p) segs.push(_line(p.x, p.y + 14, nx, rowY - 14, '#f59e0b', 1.5)); }
    }
  }
  segs.push(_text('Binary Tree - each node has 0, 1, or 2 children', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeBSTDiagram(x, y, w, h) {
  const segs = []; const vals = [[50], [30, 70], [20, 40, 60, 80]]; const cx = x + w / 2;
  const nodes = [];
  vals.forEach((row, l) => {
    row.forEach((v, i) => {
      const nx = cx + (i - (row.length - 1) / 2) * (w / (row.length + 1.5));
      const ny = y + h * 0.15 + l * (h * 0.25);
      nodes.push({ x: nx, y: ny, v });
      segs.push(_circle(nx, ny, 16, l < 2 ? '#dbeafe' : '#ffffff', '#2563eb', 2));
      segs.push(_text(String(v), nx, ny + 5, { fs: 10, color: '#1e40af', anchor: 'middle' }));
      if (nodes.length > 1) { const pi = Math.floor((nodes.length - 2) / 2); const p = nodes[pi]; if (p) segs.push(_line(p.x, p.y + 16, nx, ny - 16, '#60a5fa', 1.5)); }
    });
  });
  segs.push(_text('BST - left < root < right, O(log n) average', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeAVLTree(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  const data = [{ v: 40, b: 0 }, { v: 20, b: 1 }, { v: 60, b: 0 }, { v: 10, b: 0 }, { v: 30, b: 0 }, { v: 50, b: -1 }, { v: 70, b: 0 }];
  const pos = [{ x: cx, y: y + h * 0.15 }, { x: cx - w * 0.2, y: y + h * 0.35 }, { x: cx + w * 0.2, y: y + h * 0.35 },
    { x: cx - w * 0.3, y: y + h * 0.55 }, { x: cx - w * 0.1, y: y + h * 0.55 }, { x: cx + w * 0.1, y: y + h * 0.55 }, { x: cx + w * 0.3, y: y + h * 0.55 }];
  data.forEach((n, i) => {
    const p = pos[i];
    segs.push(_circle(p.x, p.y, 16, '#f0fdf4', '#16a34a', 2));
    segs.push(_text(String(n.v), p.x, p.y + 4, { fs: 10, color: '#166534', anchor: 'middle' }));
    if (n.b !== 0) segs.push(_text(`BF:${n.b > 0 ? '+' : ''}${n.b}`, p.x + 22, p.y + 4, { fs: 7, color: '#059669', anchor: 'start' }));
    if (i > 0) { const pi = Math.floor((i - 1) / 2); segs.push(_line(pos[pi].x, pos[pi].y + 16, p.x, p.y - 16, '#86efac', 1.5)); }
  });
  segs.push(_text('AVL Tree - self-balancing with BF tracking', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeHeapMin(x, y, w, h) {
  const segs = []; const vals = [3, 7, 5, 12, 10, 8, 6, 15, 14, 11]; const cx = x + w / 2;
  const pos = [{ x: cx, y: y + h * 0.1 }, { x: cx - w * 0.18, y: y + h * 0.28 }, { x: cx + w * 0.18, y: y + h * 0.28 },
    { x: cx - w * 0.3, y: y + h * 0.46 }, { x: cx - w * 0.1, y: y + h * 0.46 }, { x: cx + w * 0.1, y: y + h * 0.46 },
    { x: cx + w * 0.3, y: y + h * 0.46 }, { x: cx - w * 0.35, y: y + h * 0.64 }, { x: cx - w * 0.22, y: y + h * 0.64 }, { x: cx - w * 0.1, y: y + h * 0.64 }];
  vals.forEach((v, i) => {
    const p = pos[i]; if (!p) return;
    segs.push(_circle(p.x, p.y, 14, '#fef3c7', '#f59e0b', 2));
    segs.push(_text(String(v), p.x, p.y + 5, { fs: 9, color: '#92400e', anchor: 'middle' }));
    if (i > 0) { const pi = Math.floor((i - 1) / 2); const pp = pos[pi]; if (pp) segs.push(_line(pp.x, pp.y + 14, p.x, p.y - 14, '#fbbf24', 1.5)); }
  });
  segs.push(_text('Min-Heap - parent <= children, root is minimum', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeHeapMax(x, y, w, h) {
  const segs = []; const vals = [50, 30, 40, 20, 10, 25, 35, 5, 15, 8]; const cx = x + w / 2;
  const pos = [{ x: cx, y: y + h * 0.1 }, { x: cx - w * 0.18, y: y + h * 0.28 }, { x: cx + w * 0.18, y: y + h * 0.28 },
    { x: cx - w * 0.3, y: y + h * 0.46 }, { x: cx - w * 0.1, y: y + h * 0.46 }, { x: cx + w * 0.1, y: y + h * 0.46 },
    { x: cx + w * 0.3, y: y + h * 0.46 }, { x: cx - w * 0.35, y: y + h * 0.64 }, { x: cx - w * 0.22, y: y + h * 0.64 }, { x: cx - w * 0.1, y: y + h * 0.64 }];
  vals.forEach((v, i) => {
    const p = pos[i]; if (!p) return;
    segs.push(_circle(p.x, p.y, 14, '#dbeafe', '#2563eb', 2));
    segs.push(_text(String(v), p.x, p.y + 5, { fs: 9, color: '#1e40af', anchor: 'middle' }));
    if (i > 0) { const pi = Math.floor((i - 1) / 2); const pp = pos[pi]; if (pp) segs.push(_line(pp.x, pp.y + 14, p.x, p.y - 14, '#93c5fd', 1.5)); }
  });
  segs.push(_text('Max-Heap - parent >= children, root is maximum', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeTrieDiagram(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  const n = [{ x: cx, y: y + h * 0.12 }, { x: cx - w * 0.15, y: y + h * 0.32 }, { x: cx + w * 0.18, y: y + h * 0.32 },
    { x: cx - w * 0.25, y: y + h * 0.52 }, { x: cx - w * 0.05, y: y + h * 0.52 }, { x: cx + w * 0.08, y: y + h * 0.52 }, { x: cx + w * 0.28, y: y + h * 0.52 }];
  const labels = ['', 'c', 'a', 't', 'd', 'o', 'g'];
  n.forEach((p, i) => {
    segs.push(_circle(p.x, p.y, 14, i < 2 ? '#fffbeb' : '#f0fdf4', i === 0 ? '#1e293b' : '#f59e0b', 2));
    if (labels[i]) segs.push(_text(labels[i], p.x, p.y + 5, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
    if (i > 0) {
      const pi = i <= 2 ? 0 : (i <= 4 ? 1 : 2);
      segs.push(_line(n[pi].x, n[pi].y + 14, p.x, p.y - 14, '#f59e0b', 1.5));
    }
  });
  segs.push(_text('Trie - prefix tree, O(k) search, space efficient', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeGraphUndirected(x, y, w, h) {
  const segs = []; const cx = x + w / 2, cy = y + h / 2;
  const pts = [{ x: cx - w * 0.25, y: cy - h * 0.2, l: 'A' }, { x: cx + w * 0.25, y: cy - h * 0.2, l: 'B' },
    { x: cx - w * 0.3, y: cy + h * 0.25, l: 'C' }, { x: cx, y: cy + h * 0.3, l: 'D' }, { x: cx + w * 0.3, y: cy + h * 0.25, l: 'E' }];
  [[0, 1], [0, 2], [1, 3], [1, 4], [2, 3], [3, 4]].forEach(([a, b]) => segs.push(_line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, '#94a3b8', 2)));
  pts.forEach(p => { segs.push(_circle(p.x, p.y, 18, '#ede9fe', '#7c3aed', 2.5)); segs.push(_text(p.l, p.x, p.y + 5, { fs: 13, color: '#5b21b6', anchor: 'middle', fw: '800' })); });
  segs.push(_text('Undirected Graph - symmetric edges', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeGraphDirected(x, y, w, h) {
  const segs = []; const cx = x + w / 2, cy = y + h / 2;
  const pts = [{ x: cx, y: cy - h * 0.3, l: 'A' }, { x: cx - w * 0.3, y: cy + h * 0.15, l: 'B' },
    { x: cx + w * 0.3, y: cy + h * 0.15, l: 'C' }, { x: cx, y: cy + h * 0.35, l: 'D' }];
  [[0, 1], [0, 2], [1, 3], [2, 3], [2, 1]].forEach(([a, b]) => {
    const dx = pts[b].x - pts[a].x, dy = pts[b].y - pts[a].y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist, uy = dy / dist;
    segs.push({ type: 'draw_arrow', from: [pts[a].x + ux * 18, pts[a].y + uy * 18], to: [pts[b].x - ux * 18, pts[b].y - uy * 18], style: { color: '#7c3aed', strokeWidth: 2 } });
  });
  pts.forEach(p => { segs.push(_circle(p.x, p.y, 18, '#fce7f3', '#db2777', 2.5)); segs.push(_text(p.l, p.x, p.y + 5, { fs: 13, color: '#9d174d', anchor: 'middle', fw: '800' })); });
  segs.push(_text('Directed Graph - edges have direction', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeGraphWeighted(x, y, w, h) {
  const segs = []; const cx = x + w / 2, cy = y + h / 2;
  const pts = [{ x: cx - w * 0.25, y: cy - h * 0.2, l: 'A' }, { x: cx + w * 0.25, y: cy - h * 0.2, l: 'B' },
    { x: cx - w * 0.3, y: cy + h * 0.3, l: 'C' }, { x: cx + w * 0.3, y: cy + h * 0.3, l: 'D' }];
  [[0, 1, 4], [0, 2, 2], [1, 3, 1], [2, 3, 5], [2, 1, 8]].forEach(([a, b, wgt]) => {
    const mx = (pts[a].x + pts[b].x) / 2, my = (pts[a].y + pts[b].y) / 2;
    segs.push(_line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, '#64748b', 2));
    segs.push(_circle(mx + 4, my - 8, 12, '#ffffff', '#f59e0b', 1.5));
    segs.push(_text(String(wgt), mx + 4, my - 4, { fs: 9, color: '#92400e', anchor: 'middle', fw: '800' }));
  });
  pts.forEach(p => { segs.push(_circle(p.x, p.y, 18, '#fffbeb', '#f59e0b', 2.5)); segs.push(_text(p.l, p.x, p.y + 5, { fs: 13, color: '#92400e', anchor: 'middle', fw: '800' })); });
  segs.push(_text('Weighted Graph - edges have associated costs', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeAdjacencyMatrix(x, y, w, h) {
  const segs = []; const n = 5; const cs = 28; const ox = x + w * 0.1, oy = y + h * 0.15;
  const mat = [[0, 1, 1, 0, 0], [1, 0, 0, 1, 1], [1, 0, 0, 1, 0], [0, 1, 1, 0, 1], [0, 1, 0, 1, 0]];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    segs.push(_rect(ox + c * cs, oy + r * cs, cs - 1, cs - 1, mat[r][c] ? '#dbeafe' : '#ffffff', '#93c5fd', 1, 2));
    segs.push(_text(String(mat[r][c]), ox + c * cs + cs / 2, oy + r * cs + cs / 2 + 4, { fs: 11, color: '#1e40af', anchor: 'middle' }));
  }
  segs.push(_text('Adjacency Matrix - O(V^2) space', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeBloomFilter(x, y, w, h) {
  const segs = []; const n = 16; const bw = w / n; const bh = h * 0.35; const by = y + h * 0.25;
  const bits = [1, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1];
  bits.forEach((b, i) => {
    segs.push(_rect(x + i * bw, by, bw - 1, bh, b ? '#dbeafe' : '#f8fafc', b ? '#2563eb' : '#e2e8f0', 1.5, 2));
    segs.push(_text(String(b), x + i * bw + bw / 2, by + bh / 2 + 4, { fs: 10, color: b ? '#1e40af' : '#94a3b8', anchor: 'middle' }));
  });
  segs.push(_text('Bloom Filter - probabilistic, no false negatives', x + w / 2, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeLruCache(x, y, w, h) {
  const segs = []; const n = 6; const bw = w * 0.5; const bh = 22; const sx = x + w * 0.25;
  const keys = ['user:42 h:3', 'session:x7 h:1', 'config:v2 h:8', 'posts:15 h:2', 'cache:me h:5', 'rate:usr h:1'];
  keys.forEach((k, i) => {
    const by = y + h * 0.2 + i * (bh + 2);
    const hot = k.includes('h:8') || k.includes('h:5');
    segs.push(_rect(sx, by, bw, bh, hot ? '#fef3c7' : '#ffffff', '#f59e0b', 1, 4));
    segs.push(_text(k, sx + bw / 2, by + bh / 2 + 4, { fs: 8, color: hot ? '#92400e' : '#64748b', anchor: 'middle' }));
  });
  segs.push(_text('LRU Cache - evicts least recently used', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeDisjointSet(x, y, w, h) {
  const segs = []; const n = 4; const bw = w * 0.45; const bh = 28; const sx = x + w * 0.1;
  const sets = [{ r: 'A', s: 3, e: 'A <- B <- C' }, { r: 'D', s: 4, e: 'D <- E <- F <- G' }, { r: 'H', s: 2, e: 'H <- I' }, { r: 'J', s: 1, e: 'J' }];
  sets.forEach((s, i) => {
    const by = y + h * 0.2 + i * (bh + 4);
    segs.push(_rect(sx, by, bw, bh, i < 2 ? '#dbeafe' : '#f0fdf4', '#2563eb', 1.5, 6));
    segs.push(_text(`Root: ${s.r} | size:${s.s}`, sx + 8, by + 10, { fs: 8, color: '#1e40af', anchor: 'start', fw: '700' }));
    segs.push(_text(s.e, sx + bw / 2, by + bh - 4, { fs: 8, color: '#64748b', anchor: 'middle' }));
  });
  segs.push(_text('Disjoint Set (Union-Find) - near O(alpha(n))', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeSkipList(x, y, w, h) {
  const segs = []; const levels = 4; const bw = w * 0.55; const bh = 18; const sx = x + w * 0.25;
  for (let l = 0; l < levels; l++) {
    const by = y + h * 0.15 + l * (bh + 3);
    segs.push(_rect(sx, by, bw, bh, l === 0 ? '#fef3c7' : '#ffffff', '#f59e0b', 1, 4));
    const vals = Array.from({ length: Math.max(1, 7 - l * 2) }, (_, i) => (i + 1) * 5 + (l * 3));
    segs.push(_text(`L${l}: ${vals.join('->')}->null`.substring(0, 50), sx + bw / 2, by + bh / 2 + 4, { fs: 7, color: '#92400e', anchor: 'middle' }));
  }
  segs.push(_text('Skip List - probabilistic O(log n) search', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// ALGORITHMS (20 shapes)
// =============================================================================

function shapeBinarySearch(x, y, w, h) {
  const segs = []; const n = 8; const cw = w / n; const cy = y + h * 0.35;
  const arr = [3, 7, 11, 18, 25, 33, 42, 50]; const target = 25;
  segs.push(_text(`Search: ${target}`, x + w / 2, y + h * 0.08, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  arr.forEach((v, i) => {
    const fill = v === target ? '#dcfce7' : '#ffffff', stroke = v === target ? '#16a34a' : '#64748b';
    segs.push(_rect(x + i * cw, cy, cw - 1, 40, fill, stroke, 2, 4));
    segs.push(_text(String(v), x + i * cw + cw / 2, cy + 24, { fs: 12, color: '#1e293b', anchor: 'middle' }));
    segs.push(_text(String(i), x + i * cw + cw / 2, cy - 8, { fs: 8, color: '#94a3b8', anchor: 'middle' }));
  });
  segs.push(_text('Binary Search - O(log n), requires sorted array', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeLinearSearch(x, y, w, h) {
  const segs = []; const n = 8; const cw = w / n; const cy = y + h * 0.35;
  const arr = [5, 12, 3, 19, 7, 14, 9, 2]; const target = 7; const found = 4;
  segs.push(_text(`Search: ${target}`, x + w / 2, y + h * 0.08, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  arr.forEach((v, i) => {
    const fill = i < found ? '#fef3c7' : i === found ? '#dcfce7' : '#ffffff';
    const stroke = i === found ? '#16a34a' : i < found ? '#f59e0b' : '#cbd5e1';
    segs.push(_rect(x + i * cw, cy, cw - 1, 40, fill, stroke, 2, 4));
    segs.push(_text(String(v), x + i * cw + cw / 2, cy + 24, { fs: 12, color: '#1e293b', anchor: 'middle' }));
  });
  segs.push(_text('Linear Search - O(n), scans each element', x + w / 2, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeBubbleSort(x, y, w, h) {
  const segs = []; const n = 8; const bh = 25; const arr = [12, 3, 7, 19, 5, 14, 9, 2];
  for (let step = 0; step < 3; step++) {
    const ay = y + h * 0.18 + step * (bh + 6);
    for (let i = 0; i < n - step; i++) {
      const cw = w / n;
      const fill = i === n - step - 1 ? '#dcfce7' : i < n - step - 1 && arr[i] > arr[i + 1] ? '#fef3c7' : '#ffffff';
      const stroke = i === n - step - 1 ? '#16a34a' : i < n - step - 1 && arr[i] > arr[i + 1] ? '#f59e0b' : '#cbd5e1';
      segs.push(_rect(x + i * cw, ay, cw - 1, bh, fill, stroke, 1.5, 2));
      segs.push(_text(String(arr[i]), x + i * cw + cw / 2, ay + bh / 2 + 4, { fs: 9, color: '#1e293b', anchor: 'middle' }));
    }
  }
  segs.push(_text('Bubble Sort - O(n^2) adjacent comparisons', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeSelectionSort(x, y, w, h) {
  const segs = []; const n = 7; const cw = w / n; const bh = 26; const arr = [8, 3, 12, 5, 19, 7, 14];
  for (let step = 0; step < 3; step++) {
    const ay = y + h * 0.2 + step * (bh + 5);
    arr.forEach((v, i) => {
      const fill = i === step ? '#dbeafe' : i > step ? '#ffffff' : '#dcfce7';
      const stroke = i === step ? '#2563eb' : i > step ? '#cbd5e1' : '#16a34a';
      segs.push(_rect(x + i * cw, ay, cw - 1, bh, fill, stroke, 1.5, 2));
      segs.push(_text(String(v), x + i * cw + cw / 2, ay + bh / 2 + 4, { fs: 9, color: '#1e293b', anchor: 'middle' }));
    });
  }
  segs.push(_text('Selection Sort - O(n^2), selects minimum each pass', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeInsertionSort(x, y, w, h) {
  const segs = []; const n = 7; const cw = w / n; const bh = 26; const arr = [12, 3, 8, 5, 19, 7, 14];
  for (let step = 0; step < 4; step++) {
    const ay = y + h * 0.15 + step * (bh + 5);
    arr.forEach((v, i) => {
      const fill = i <= step ? (i === step ? '#fef3c7' : '#dcfce7') : '#ffffff';
      const stroke = i === step ? '#f59e0b' : i < step ? '#16a34a' : '#cbd5e1';
      segs.push(_rect(x + i * cw, ay, cw - 1, bh, fill, stroke, 1.5, 2));
      segs.push(_text(String(v), x + i * cw + cw / 2, ay + bh / 2 + 4, { fs: 9, color: '#1e293b', anchor: 'middle' }));
    });
  }
  segs.push(_text('Insertion Sort - O(n^2), builds sorted left portion', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeMergeSort(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  const levels = [
    [{ x: cx, y: y + h * 0.88, t: '[5, 2, 8, 3, 1, 7, 4, 6]' }],
    [{ x: cx - w * 0.25, y: y + h * 0.7, t: '[5, 2, 8, 3]' }, { x: cx + w * 0.25, y: y + h * 0.7, t: '[1, 7, 4, 6]' }],
    [{ x: cx - w * 0.35, y: y + h * 0.52, t: '[5, 2]' }, { x: cx - w * 0.15, y: y + h * 0.52, t: '[8, 3]' }, { x: cx + w * 0.15, y: y + h * 0.52, t: '[1, 7]' }, { x: cx + w * 0.35, y: y + h * 0.52, t: '[4, 6]' }],
    [{ x: cx - w * 0.4, y: y + h * 0.34, t: '[5][2]' }, { x: cx - w * 0.25, y: y + h * 0.34, t: '[8][3]' }, { x: cx - w * 0.1, y: y + h * 0.34, t: '[1][7]' }, { x: cx + w * 0.1, y: y + h * 0.34, t: '[4][6]' }, { x: cx + w * 0.3, y: y + h * 0.34, t: '...' }],
    [{ x: cx, y: y + h * 0.16, t: '5  2  8  3  1  7  4  6' }],
  ];
  levels.forEach((row, li) => {
    row.forEach(n => {
      segs.push(_rect(n.x - 46, n.y - 8, 92, 16, li < 2 ? '#dbeafe' : '#f0fdf4', li < 2 ? '#2563eb' : '#16a34a', 1, 4));
      segs.push(_text(n.t, n.x, n.y + 4, { fs: 7, color: '#1e293b', anchor: 'middle', fw: '600' }));
      if (li > 0) {
        const pidx = Math.floor(row.indexOf(n) / 2);
        const p = levels[li - 1][pidx];
        if (p) segs.push(_line(p.x, p.y + 8, n.x, n.y - 8, '#94a3b8', 1));
      }
    });
  });
  segs.push(_text('Merge Sort - O(n log n) divide and conquer', x + w / 2, y + h * 0.06, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeQuickSort(x, y, w, h) {
  const segs = []; const arr = [9, 3, 7, 5, 2, 8, 1, 4]; const n = 8; const cw = w / n; const bh = 30; const cy = y + h * 0.4;
  segs.push(_text('Quick Sort - pivot and partition', x + w / 2, y + h * 0.08, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  arr.forEach((v, i) => {
    const fill = i === 4 ? '#fef3c7' : i < 4 ? '#dbeafe' : '#ffffff';
    segs.push(_rect(x + i * cw, cy, cw - 1, bh, fill, '#64748b', 2, 4));
    segs.push(_text(String(v), x + i * cw + cw / 2, cy + bh / 2 + 4, { fs: 12, color: '#1e293b', anchor: 'middle' }));
  });
  segs.push(_text('pivot', x + 4.5 * cw, cy - 10, { fs: 8, color: '#f59e0b', anchor: 'middle' }));
  segs.push(_text('O(n log n) average, O(n^2) worst', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeHeapSort(x, y, w, h) {
  const segs = []; const cw = w / 7; const bh = 26; const cy = y + h * 0.3;
  const arr = [50, 30, 40, 20, 10, 25, 35];
  segs.push(_text('Heap Sort - build heap then extract max', x + w / 2, y + h * 0.08, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  arr.forEach((v, i) => {
    segs.push(_rect(x + i * cw, cy, cw - 1, bh, i === 0 ? '#fef3c7' : '#ffffff', i === 0 ? '#f59e0b' : '#cbd5e1', 2, 4));
    segs.push(_text(String(v), x + i * cw + cw / 2, cy + bh / 2 + 4, { fs: 11, color: '#1e293b', anchor: 'middle' }));
  });
  segs.push(_text('O(n log n) in-place sort', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeBFSGraph(x, y, w, h) {
  const segs = []; const cx = x + w / 2, cy = y + h * 0.4;
  const pts = [{ x: cx, y: cy - h * 0.3, l: 'A', o: 0 }, { x: cx - w * 0.3, y: cy, l: 'B', o: 1 },
    { x: cx + w * 0.3, y: cy, l: 'C', o: 1 }, { x: cx - w * 0.35, y: cy + h * 0.3, l: 'D', o: 2 },
    { x: cx, y: cy + h * 0.35, l: 'E', o: 3 }, { x: cx + w * 0.35, y: cy + h * 0.3, l: 'F', o: 2 }];
  [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 4], [4, 5]].forEach(([a, b]) => segs.push(_line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, '#94a3b8', 1.5)));
  const colors = ['#2563eb', '#f59e0b', '#f59e0b', '#16a34a', '#7c3aed', '#16a34a'];
  pts.forEach(p => { segs.push(_circle(p.x, p.y, 20, '#ffffff', colors[p.o], 3)); segs.push(_text(p.l, p.x, p.y + 5, { fs: 14, color: '#1e293b', anchor: 'middle', fw: '800' })); });
  segs.push(_text('BFS - expands layer by layer, O(V+E)', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeDFSGraph(x, y, w, h) {
  const segs = []; const cx = x + w / 2, cy = y + h * 0.4;
  const pts = [{ x: cx, y: cy - h * 0.3, l: 'A' }, { x: cx - w * 0.25, y: cy - h * 0.1, l: 'B' },
    { x: cx + w * 0.3, y: cy - h * 0.1, l: 'C' }, { x: cx - w * 0.35, y: cy + h * 0.2, l: 'D' },
    { x: cx, y: cy + h * 0.35, l: 'E' }, { x: cx + w * 0.35, y: cy + h * 0.2, l: 'F' }];
  [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [3, 4], [4, 5]].forEach(([a, b]) => segs.push(_line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, '#94a3b8', 1.5)));
  const order = [0, 1, 3, 4, 5, 2];
  order.forEach((idx, step) => {
    const p = pts[idx];
    segs.push(_circle(p.x, p.y, 20, '#fef3c7', '#f59e0b', 3));
    segs.push(_text(p.l, p.x, p.y + 5, { fs: 14, color: '#92400e', anchor: 'middle', fw: '800' }));
    segs.push(_text(String(step + 1), p.x + 24, p.y - 6, { fs: 8, color: '#f59e0b', anchor: 'middle', fw: '700' }));
  });
  segs.push(_text('DFS - explores branch fully before backtracking', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeDijkstra(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  const pts = [{ x: cx - w * 0.3, y: y + h * 0.5, l: 'A', d: 0 }, { x: cx - w * 0.1, y: y + h * 0.2, l: 'B', d: 4 },
    { x: cx + w * 0.2, y: y + h * 0.25, l: 'C', d: 2 }, { x: cx - w * 0.15, y: y + h * 0.75, l: 'D', d: 5 }, { x: cx + w * 0.3, y: y + h * 0.6, l: 'E', d: 7 }];
  [[0, 1, 4], [0, 2, 2], [1, 2, 1], [1, 3, 3], [2, 4, 5], [3, 4, 2], [1, 4, 6]].forEach(([a, b, wgt]) => {
    segs.push(_line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, '#94a3b8', 1.5));
    segs.push(_circle((pts[a].x + pts[b].x) / 2 + 4, (pts[a].y + pts[b].y) / 2 - 8, 10, '#ffffff', '#f59e0b', 1.5));
    segs.push(_text(String(wgt), (pts[a].x + pts[b].x) / 2 + 4, (pts[a].y + pts[b].y) / 2 - 4, { fs: 8, color: '#92400e', anchor: 'middle', fw: '800' }));
  });
  pts.forEach(p => {
    const col = p.d === 0 ? '#2563eb' : p.d < 6 ? '#16a34a' : '#f59e0b';
    segs.push(_circle(p.x, p.y, 18, '#ffffff', col, 2.5));
    segs.push(_text(p.l, p.x, p.y + 4, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
    segs.push(_text(`d=${p.d}`, p.x, p.y - 26, { fs: 8, color: col, anchor: 'middle', fw: '700' }));
  });
  segs.push(_text("Dijkstra's SPF - O((V+E) log V) greedy", x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeRecursionTree(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  const nodes = [
    { x: cx, y: y + h * 0.12, t: 'fib(5)' }, { x: cx - w * 0.18, y: y + h * 0.34, t: 'fib(4)' },
    { x: cx + w * 0.18, y: y + h * 0.34, t: 'fib(3)' }, { x: cx - w * 0.28, y: y + h * 0.56, t: 'fib(3)' },
    { x: cx - w * 0.08, y: y + h * 0.56, t: 'fib(2)' }, { x: cx + w * 0.08, y: y + h * 0.56, t: 'fib(2)' },
    { x: cx + w * 0.28, y: y + h * 0.56, t: 'fib(1)' }, { x: cx - w * 0.34, y: y + h * 0.76, t: 'fib(2)' },
    { x: cx - w * 0.2, y: y + h * 0.76, t: 'fib(1)' }, { x: cx - w * 0.06, y: y + h * 0.76, t: 'fib(1)' },
  ];
  nodes.forEach((n, i) => {
    segs.push(_rect(n.x - 28, n.y - 8, 56, 16, i === 0 ? '#fef3c7' : '#ffffff', '#f59e0b', 1.5, 4));
    segs.push(_text(n.t, n.x, n.y + 4, { fs: 8, color: '#92400e', anchor: 'middle', fw: '700' }));
    if (i > 0) { const pi = Math.floor((i - 1) / 2); if (nodes[pi]) segs.push(_line(nodes[pi].x, nodes[pi].y + 8, n.x, n.y - 8, '#fbbf24', 1)); }
  });
  segs.push(_text('Recursion Tree - visualize recursive call stack', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeDPTable(x, y, w, h) {
  const segs = []; const rows = 5, cols = 6; const cw = w / cols, ch = h * 0.45 / rows; const oy = y + h * 0.12;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    segs.push(_rect(x + c * cw, oy + r * ch, cw - 1, ch - 1, '#ffffff', '#cbd5e1', 1, 2));
    segs.push(_text(String(r === 0 ? c : c === 0 ? r : r + c), x + c * cw + cw / 2, oy + r * ch + ch / 2 + 3, { fs: 9, color: r === 0 || c === 0 ? '#2563eb' : '#1e293b', anchor: 'middle' }));
  }
  segs.push(_text('DP Table - tabulation, O(m*n) space/time', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeSlidingWindow(x, y, w, h) {
  const segs = []; const n = 8; const cw = w / n; const cy = y + h * 0.35;
  const arr = [2, 6, 1, 8, 3, 5, 4, 7];
  arr.forEach((v, i) => {
    const inWin = i >= 1 && i <= 3;
    segs.push(_rect(x + i * cw, cy, cw - 1, 40, inWin ? '#dbeafe' : '#ffffff', inWin ? '#2563eb' : '#cbd5e1', 2, 4));
    segs.push(_text(String(v), x + i * cw + cw / 2, cy + 24, { fs: 12, color: '#1e293b', anchor: 'middle' }));
  });
  segs.push(_rect(x + cw, cy + 48, 3 * cw - 1, 16, 'transparent', '#2563eb', 2, 0));
  segs.push(_text('Sliding Window - O(n) subarray problems', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeTwoPointer(x, y, w, h) {
  const segs = []; const n = 7; const cw = w / n; const cy = y + h * 0.35;
  const arr = [-5, -3, 0, 1, 2, 4, 7];
  arr.forEach((v, i) => {
    const hl = i === 0 || i === n - 1;
    segs.push(_rect(x + i * cw, cy, cw - 1, 40, hl ? '#fef3c7' : '#ffffff', hl ? '#f59e0b' : '#cbd5e1', 2, 4));
    segs.push(_text(String(v), x + i * cw + cw / 2, cy + 24, { fs: 12, color: '#1e293b', anchor: 'middle' }));
  });
  segs.push(_text('L', x + cw / 2, cy + 50, { fs: 9, color: '#f59e0b', anchor: 'middle', fw: '800' }));
  segs.push(_text('R', x + (n - 1) * cw + cw / 2, cy + 50, { fs: 9, color: '#f59e0b', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + cw, cy + 56, x + (n - 1) * cw, cy + 56, '#f59e0b', 2));
  segs.push(_text('Two Pointers - converge to find target, O(n)', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeKnapsack(x, y, w, h) {
  const segs = []; const bw = w * 0.4; const bh = 26; const sx = x + w * 0.05;
  const items = [{ w: 2, v: '$12' }, { w: 1, v: '$10' }, { w: 3, v: '$20' }, { w: 2, v: '$15' }];
  segs.push(_text('0/1 Knapsack', x + w / 2, y + h * 0.08, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  items.forEach((it, i) => {
    const by = y + h * 0.2 + i * (bh + 4);
    segs.push(_rect(sx, by, bw, bh, i % 2 === 0 ? '#fef3c7' : '#ffffff', '#f59e0b', 1.5, 6));
    segs.push(_text(`Item${i + 1}: wt=${it.w} val=${it.v}`, sx + 8, by + bh / 2 + 4, { fs: 9, color: '#92400e', anchor: 'start' }));
  });
  segs.push(_rect(x + w * 0.6, y + h * 0.3, w * 0.32, h * 0.35, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('KNAPSACK', x + w * 0.76, y + h * 0.42, { fs: 12, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('cap: 5', x + w * 0.76, y + h * 0.55, { fs: 9, color: '#1e40af', anchor: 'middle' }));
  segs.push(_text('DP: O(n * capacity)', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeCountingSort(x, y, w, h) {
  const segs = []; const cw = w / 7; const bh = 24;
  const arr = [4, 2, 2, 8, 3, 3, 5]; const count = [0, 0, 2, 2, 1, 1, 0, 0, 1];
  segs.push(_text('Counting Sort - O(n + k)', x + w / 2, y + h * 0.08, { fs: 12, color: '#1e293b', anchor: 'middle', fw: '800' }));
  arr.forEach((v, i) => {
    segs.push(_rect(x + i * cw, y + h * 0.22, cw - 1, bh, '#ffffff', '#64748b', 1.5, 2));
    segs.push(_text(String(v), x + i * cw + cw / 2, y + h * 0.22 + bh / 2 + 4, { fs: 10, color: '#1e293b', anchor: 'middle' }));
  });
  count.forEach((c, i) => {
    const cbw = w / 9;
    segs.push(_rect(x + i * cbw, y + h * 0.6, cbw - 1, bh, c > 0 ? '#dbeafe' : '#f8fafc', '#93c5fd', 1.5, 2));
    if (c > 0) segs.push(_text(String(c), x + i * cbw + cbw / 2, y + h * 0.6 + bh / 2 + 4, { fs: 9, color: '#1e40af', anchor: 'middle' }));
  });
  segs.push(_text('Count frequencies, then output sorted', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// CODE & SYNTAX (20 shapes)
// =============================================================================

function shapeCodeBlock(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#0f172a', '#334155', 2, 8)];
  const lines = ['function hello(name) {', '  const msg = `Hi, ${name}!`;', '  console.log(msg);', '  return msg;', '}', '', 'hello("World");'];
  const lh = h / (lines.length + 1);
  lines.forEach((l, i) => {
    const c = l.includes('function') || l.includes('return') ? '#60a5fa' : l.includes('console') ? '#fbbf24' : l.includes('const') ? '#a78bfa' : '#e2e8f0';
    segs.push(_text(l, x + 12, y + (i + 1) * lh, { fs: 10, color: c, anchor: 'start', fw: l.includes('function') || l.includes('return') ? '700' : '400' }));
  });
  return segs;
}

function shapeFunctionDeclaration(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f8fafc', '#94a3b8', 2, 8), _rect(x + 4, y + 4, 4, h - 8, '#3b82f6', 'none', 0, 0),
    _text('function greet(name) {', x + 18, y + h * 0.22, { fs: 12, color: '#2563eb', anchor: 'start', fw: '700' }),
    _text('  return "Hello, " + name;', x + 18, y + h * 0.45, { fs: 12, color: '#1e293b', anchor: 'start' }),
    _text('}', x + 18, y + h * 0.68, { fs: 12, color: '#2563eb', anchor: 'start', fw: '700' }),
    _text('keyword | name | params | body | return', x + w / 2, y + h * 0.92, { fs: 10, color: '#64748b', anchor: 'middle' }),
  ];
}

function shapeVariableDeclaration(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fffbeb', '#f59e0b', 2, 8),
    _text('let count = 42;', x + w / 2, y + h * 0.28, { fs: 14, color: '#92400e', anchor: 'middle', fw: '800' }),
    _text('const name = "Alice";', x + w / 2, y + h * 0.52, { fs: 14, color: '#92400e', anchor: 'middle', fw: '800' }),
    _text('scope rules differ by keyword', x + w / 2, y + h * 0.82, { fs: 10, color: '#92400e', anchor: 'middle' }),
  ];
}

function shapeIfElseDiagram(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_rect(x + w * 0.15, y + h * 0.05, w * 0.7, 32, '#f8fafc', '#64748b', 2, 6));
  segs.push(_text('if (condition)', x + w / 2, y + h * 0.05 + 20, { fs: 12, color: '#1e293b', anchor: 'middle', fw: '700' }));
  segs.push(_arrow(x + w / 2, y + h * 0.05 + 32, cx - w * 0.15, y + h * 0.32, '#16a34a', 2));
  segs.push(_arrow(x + w / 2, y + h * 0.05 + 32, cx + w * 0.15, y + h * 0.32, '#dc2626', 2));
  segs.push(_rect(x + w * 0.05, y + h * 0.32, w * 0.35, h * 0.42, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('true branch', x + w * 0.225, y + h * 0.5, { fs: 12, color: '#166534', anchor: 'middle', fw: '700' }));
  segs.push(_rect(x + w * 0.6, y + h * 0.32, w * 0.35, h * 0.42, '#fef2f2', '#dc2626', 2, 8));
  segs.push(_text('false branch', x + w * 0.775, y + h * 0.5, { fs: 12, color: '#991b1b', anchor: 'middle', fw: '700' }));
  return segs;
}

function shapeForLoopDiagram(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_rect(x + w * 0.15, y + h * 0.02, w * 0.7, 28, '#f8fafc', '#64748b', 2, 6));
  segs.push(_text('for (i = 0; i < n; i++)', x + w / 2, y + h * 0.02 + 18, { fs: 11, color: '#1e293b', anchor: 'middle', fw: '700' }));
  segs.push(_arrow(x + w / 2, y + h * 0.02 + 28, cx, y + h * 0.2, '#2563eb', 2));
  segs.push(_rect(x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.3, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('loop body - runs each iteration', x + w / 2, y + h * 0.32, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '700' }));
  segs.push(_path(`M${x + w * 0.15} ${y + h * 0.5} L${x + w * 0.08} ${y + h * 0.5} L${x + w * 0.08} ${y + h * 0.02} L${x + w * 0.15} ${y + h * 0.02}`, '#2563eb', 'none', 1.5));
  segs.push(_arrow(x + w / 2, y + h * 0.5, x + w / 2, y + h * 0.72, '#2563eb', 2));
  segs.push(_text('exit when condition false', x + w / 2, y + h * 0.85, { fs: 10, color: '#2563eb', anchor: 'middle' }));
  return segs;
}

function shapeWhileLoop(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_rect(x + w * 0.15, y + h * 0.15, w * 0.7, 34, '#fef3c7', '#f59e0b', 2, 6));
  segs.push(_text('while (condition)', x + w / 2, y + h * 0.15 + 22, { fs: 12, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + w / 2, y + h * 0.15 + 34, cx, y + h * 0.38, '#f59e0b', 2));
  segs.push(_rect(x + w * 0.15, y + h * 0.38, w * 0.7, h * 0.22, '#fffbeb', '#f59e0b', 2, 8));
  segs.push(_text('body -> recheck condition', x + w / 2, y + h * 0.49, { fs: 11, color: '#92400e', anchor: 'middle' }));
  segs.push(_path(`M${x + w * 0.15} ${y + h * 0.6} L${x + w * 0.06} ${y + h * 0.6} L${x + w * 0.06} ${y + h * 0.32} L${x + w * 0.15} ${y + h * 0.32}`, '#f59e0b', 'none', 1.5));
  segs.push(_arrow(x + w / 2, y + h * 0.6, x + w / 2, y + h * 0.78, '#dc2626', 2));
  segs.push(_text('exit when false', x + w / 2, y + h * 0.88, { fs: 10, color: '#dc2626', anchor: 'middle' }));
  return segs;
}

function shapeTryCatch(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fef2f2', '#dc2626', 2, 8),
    _text('try {', x + 12, y + h * 0.15, { fs: 12, color: '#991b1b', anchor: 'start', fw: '700' }),
    _text('  // risky operation', x + 12, y + h * 0.33, { fs: 11, color: '#7f1d1d', anchor: 'start' }),
    _text('} catch (error) {', x + 12, y + h * 0.5, { fs: 12, color: '#991b1b', anchor: 'start', fw: '700' }),
    _text('  // handle gracefully', x + 12, y + h * 0.67, { fs: 11, color: '#7f1d1d', anchor: 'start' }),
    _text('}', x + 12, y + h * 0.85, { fs: 12, color: '#991b1b', anchor: 'start', fw: '700' }),
  ];
}

function shapeClassDiagram(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 8),
    _text('class Animal {', x + 12, y + h * 0.12, { fs: 11, color: '#166534', anchor: 'start', fw: '700' }),
    _text('  constructor(name) {', x + 12, y + h * 0.26, { fs: 10, color: '#15803d', anchor: 'start' }),
    _text('    this.name = name;', x + 12, y + h * 0.38, { fs: 10, color: '#166534', anchor: 'start' }),
    _text('  }', x + 12, y + h * 0.5, { fs: 10, color: '#15803d', anchor: 'start' }),
    _text('  speak() { ... }', x + 12, y + h * 0.62, { fs: 10, color: '#15803d', anchor: 'start' }),
    _text('}', x + 12, y + h * 0.74, { fs: 11, color: '#166534', anchor: 'start', fw: '700' }),
    _text('class Dog extends Animal { }', x + 12, y + h * 0.88, { fs: 10, color: '#16a34a', anchor: 'start', fw: '600' }),
  ];
}

function shapeArrowFunction(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0ea5e9', 2, 8),
    _text('function add(a, b) { return a + b; }', x + w / 2, y + h * 0.32, { fs: 11, color: '#0369a1', anchor: 'middle' }),
    _text('const add = (a, b) => a + b;', x + w / 2, y + h * 0.55, { fs: 14, color: '#0284c7', anchor: 'middle', fw: '800' }),
    _text('shorter syntax + lexical this', x + w / 2, y + h * 0.82, { fs: 10, color: '#0369a1', anchor: 'middle' }),
  ];
}

function shapeAsyncFunction(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 8),
    _text('async function fetchData() {', x + 12, y + h * 0.12, { fs: 11, color: '#166534', anchor: 'start', fw: '700' }),
    _text('  const res = await fetch(url);', x + 12, y + h * 0.32, { fs: 10, color: '#16a34a', anchor: 'start' }),
    _text('  return await res.json();', x + 12, y + h * 0.52, { fs: 10, color: '#16a34a', anchor: 'start' }),
    _text('}', x + 12, y + h * 0.72, { fs: 11, color: '#166534', anchor: 'start', fw: '700' }),
    _text('async/await - promise syntactic sugar', x + w / 2, y + h * 0.92, { fs: 10, color: '#166534', anchor: 'middle' }),
  ];
}

function shapePromiseChain(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#faf5ff', '#a855f7', 2, 8),
    _text('fetch("/api/data")', x + 12, y + h * 0.12, { fs: 10, color: '#7e22ce', anchor: 'start', fw: '700' }),
    _text('  .then(res => res.json())', x + 24, y + h * 0.28, { fs: 10, color: '#9333ea', anchor: 'start' }),
    _text('  .then(data => process(data))', x + 36, y + h * 0.44, { fs: 10, color: '#a855f7', anchor: 'start' }),
    _text('  .catch(err => handle(err))', x + 48, y + h * 0.6, { fs: 10, color: '#c084fc', anchor: 'start' }),
    _text('  .finally(() => cleanup())', x + 60, y + h * 0.76, { fs: 10, color: '#d8b4fe', anchor: 'start' }),
    _text('.then().catch().finally() chain', x + w / 2, y + h * 0.94, { fs: 10, color: '#7e22ce', anchor: 'middle' }),
  ];
}

function shapeDestructuring(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fdf2f8', '#db2777', 2, 8),
    _text('const [first, second] = items;', x + w / 2, y + h * 0.32, { fs: 12, color: '#9d174d', anchor: 'middle', fw: '700' }),
    _text('const { name, age } = person;', x + w / 2, y + h * 0.55, { fs: 12, color: '#9d174d', anchor: 'middle', fw: '700' }),
    _text('unpack arrays and objects', x + w / 2, y + h * 0.82, { fs: 10, color: '#be185d', anchor: 'middle' }),
  ];
}

function shapeSpreadOperator(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 8),
    _text('const arr2 = [...arr1, 4, 5];', x + w / 2, y + h * 0.35, { fs: 13, color: '#15803d', anchor: 'middle', fw: '800' }),
    _text('const obj2 = { ...obj1, newKey: val };', x + w / 2, y + h * 0.55, { fs: 13, color: '#15803d', anchor: 'middle', fw: '800' }),
    _text('Spread (...) expands iterables', x + w / 2, y + h * 0.85, { fs: 10, color: '#166534', anchor: 'middle' }),
  ];
}

function shapeImportStatement(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0ea5e9', 2, 8),
    _text('import { useState, useEffect }', x + w / 2, y + h * 0.3, { fs: 13, color: '#0369a1', anchor: 'middle', fw: '700' }),
    _text("  from 'react';", x + w / 2, y + h * 0.55, { fs: 13, color: '#0369a1', anchor: 'middle', fw: '700' }),
    _text('ES module imports', x + w / 2, y + h * 0.85, { fs: 10, color: '#0284c7', anchor: 'middle' }),
  ];
}

function shapeSwitchCase(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_rect(cx - 45, y + h * 0.02, 90, 28, '#f8fafc', '#64748b', 2, 6));
  segs.push(_text('switch (val)', cx, y + h * 0.02 + 18, { fs: 11, color: '#1e293b', anchor: 'middle', fw: '700' }));
  const cases = ['case 1:', 'case 2:', 'case 3:', 'default:']; const colors = ['#2563eb', '#16a34a', '#f59e0b', '#94a3b8'];
  cases.forEach((c, i) => {
    const sc = y + h * 0.18 + i * (h * 0.18);
    segs.push(_line(cx, y + h * 0.02 + 28, cx - w * 0.3, sc, '#cbd5e1', 1.5));
    segs.push(_rect(x + w * 0.05, sc, w * 0.3, h * 0.14, '#ffffff', colors[i], 2, 6));
    segs.push(_text(c, x + w * 0.2, sc + h * 0.07 + 4, { fs: 10, color: colors[i], anchor: 'middle', fw: '700' }));
    segs.push(_text('// handle block', x + w * 0.5, sc + h * 0.07 + 4, { fs: 9, color: '#64748b', anchor: 'start' }));
  });
  return segs;
}

function shapeArrayMethodChain(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fffbeb', '#f59e0b', 2, 8),
    _text('const result = numbers', x + 12, y + h * 0.12, { fs: 10, color: '#92400e', anchor: 'start', fw: '600' }),
    _text('  .filter(n => n > 0)', x + 24, y + h * 0.28, { fs: 10, color: '#d97706', anchor: 'start' }),
    _text('  .map(n => n * 2)', x + 36, y + h * 0.44, { fs: 10, color: '#f59e0b', anchor: 'start' }),
    _text('  .reduce((s, n) => s + n, 0);', x + 48, y + h * 0.6, { fs: 10, color: '#fbbf24', anchor: 'start' }),
    _text('filter/map/reduce chain', x + w / 2, y + h * 0.88, { fs: 10, color: '#92400e', anchor: 'middle' }),
  ];
}

function shapeInterfaceDiagram(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#faf5ff', '#a855f7', 2, 8),
    _text('interface Drawable {', x + 12, y + h * 0.18, { fs: 11, color: '#7e22ce', anchor: 'start', fw: '700' }),
    _text('  draw(): void', x + 12, y + h * 0.38, { fs: 10, color: '#9333ea', anchor: 'start' }),
    _text('  resize(w, h): void', x + 12, y + h * 0.55, { fs: 10, color: '#9333ea', anchor: 'start' }),
    _text('}', x + 12, y + h * 0.72, { fs: 11, color: '#7e22ce', anchor: 'start', fw: '700' }),
    _text('class Circle implements Drawable', x + 12, y + h * 0.9, { fs: 9, color: '#a855f7', anchor: 'start', fw: '600' }),
  ];
}

// =============================================================================
// WEB & API (20 shapes)
// =============================================================================

function shapeClientServer(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.05, y + h * 0.2, w * 0.3, h * 0.5, '#dbeafe', '#2563eb', 2.5, 10));
  segs.push(_text('Client', x + w * 0.2, y + h * 0.35, { fs: 16, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('Browser/App', x + w * 0.2, y + h * 0.55, { fs: 10, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.65, y + h * 0.2, w * 0.3, h * 0.5, '#f0fdf4', '#16a34a', 2.5, 10));
  segs.push(_text('Server', x + w * 0.8, y + h * 0.35, { fs: 16, color: '#166534', anchor: 'middle', fw: '800' }));
  segs.push(_text('Backend/API', x + w * 0.8, y + h * 0.55, { fs: 10, color: '#16a34a', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.35, y + h * 0.38, x + w * 0.65, y + h * 0.38, '#2563eb', 2.5));
  segs.push(_arrow(x + w * 0.65, y + h * 0.5, x + w * 0.35, y + h * 0.5, '#16a34a', 2.5));
  segs.push(_text('Request', x + w / 2, y + h * 0.36, { fs: 9, color: '#2563eb', anchor: 'middle' }));
  segs.push(_text('Response', x + w / 2, y + h * 0.53, { fs: 9, color: '#16a34a', anchor: 'middle' }));
  segs.push(_text('Client-Server Architecture', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeRestApiDiagram(x, y, w, h) {
  const segs = []; const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const paths = ['/users', '/users', '/users/:id', '/users/:id'];
  const descs = ['List', 'Create', 'Update', 'Delete'];
  const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626'];
  methods.forEach((m, i) => {
    const by = y + h * 0.08 + i * (h * 0.2);
    segs.push(_rect(x + w * 0.06, by, w * 0.15, h * 0.16, '#ffffff', colors[i], 2, 6));
    segs.push(_text(m, x + w * 0.135, by + h * 0.08 + 4, { fs: 11, color: colors[i], anchor: 'middle', fw: '800' }));
    segs.push(_text(paths[i], x + w * 0.35, by + h * 0.08 + 4, { fs: 10, color: '#1e293b', anchor: 'start', fw: '600' }));
    segs.push(_text(descs[i], x + w * 0.65, by + h * 0.08 + 4, { fs: 9, color: '#64748b', anchor: 'start' }));
  });
  segs.push(_text('REST API - CRUD via HTTP methods', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeBrowserDiagram(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f8fafc', '#94a3b8', 2, 8),
    _rect(x + 4, y + 4, w - 8, 28, '#f1f5f9', '#cbd5e1', 1.5, 6),
    _text('URL: example.com', x + 12, y + 22, { fs: 10, color: '#64748b', anchor: 'start' }),
    _rect(x + 4, y + 36, w - 8, h - 42, '#ffffff', '#e2e8f0', 1, 4),
    _rect(x + 30, y + 50, w - 60, 24, '#f0f9ff', '#bae6fd', 1.5, 4),
    _text('Welcome to Example', x + w / 2, y + 66, { fs: 11, color: '#0369a1', anchor: 'middle' }),
    _rect(x + 35, y + 82, 65, 65, '#dbeafe', '#93c5fd', 1, 4), _text('img', x + 67, y + 116, { fs: 8, color: '#3b82f6', anchor: 'middle' }),
    _text('Lorem ipsum dolor sit amet', x + w / 2, y + 165, { fs: 9, color: '#475569', anchor: 'middle' }),
    _text('Browser renders HTML/CSS/JS', x + w / 2, y + h - 8, { fs: 10, color: '#64748b', anchor: 'middle' }),
  ];
}

function shapeDOMTree(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  const nodes = [{ x: cx, y: y + h * 0.08, t: 'document' }, { x: cx - w * 0.2, y: y + h * 0.26, t: '<html>' },
    { x: cx + w * 0.2, y: y + h * 0.26, t: '<html>' }, { x: cx - w * 0.3, y: y + h * 0.44, t: '<head>' },
    { x: cx - w * 0.1, y: y + h * 0.44, t: '<body>' }, { x: cx + w * 0.1, y: y + h * 0.44, t: '<body>' },
    { x: cx + w * 0.3, y: y + h * 0.44, t: '<script>' }, { x: cx - w * 0.3, y: y + h * 0.62, t: '<title>' },
    { x: cx - w * 0.15, y: y + h * 0.62, t: '<div>' }, { x: cx + w * 0.15, y: y + h * 0.62, t: '<span>' }];
  const parents = [0, 0, 0, 1, 1, 2, 2, 3, 4, 5];
  nodes.forEach((n, i) => {
    segs.push(_rect(n.x - 32, n.y - 7, 64, 14, i < 3 ? '#fef3c7' : '#ffffff', '#f59e0b', 1.5, 4));
    segs.push(_text(n.t, n.x, n.y + 4, { fs: 7, color: '#92400e', anchor: 'middle', fw: '700' }));
    if (i > 0 && nodes[parents[i]]) segs.push(_line(nodes[parents[i]].x, nodes[parents[i]].y + 7, n.x, n.y - 7, '#fbbf24', 1));
  });
  segs.push(_text('DOM Tree - document object model', x + w / 2, y + h * 0.92, { fs: 10, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeURLCrashCourse(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f8fafc', '#94a3b8', 2, 8),
    _text('https://example.com:443/path?q=search#sec', x + w / 2, y + h * 0.15, { fs: 11, color: '#0f172a', anchor: 'middle', fw: '700' }),
    _rect(x + w * 0.04, y + h * 0.35, w * 0.12, 22, '#fee2e2', '#dc2626', 1.5, 4), _text('https', x + w * 0.1, y + h * 0.35 + 15, { fs: 8, color: '#991b1b', anchor: 'middle' }),
    _rect(x + w * 0.18, y + h * 0.35, w * 0.25, 22, '#dbeafe', '#2563eb', 1.5, 4), _text('Domain', x + w * 0.305, y + h * 0.35 + 15, { fs: 8, color: '#1e40af', anchor: 'middle' }),
    _rect(x + w * 0.45, y + h * 0.35, w * 0.1, 22, '#f0fdf4', '#16a34a', 1.5, 4), _text('Port', x + w * 0.5, y + h * 0.35 + 15, { fs: 8, color: '#166534', anchor: 'middle' }),
    _rect(x + w * 0.57, y + h * 0.35, w * 0.18, 22, '#fef3c7', '#f59e0b', 1.5, 4), _text('Path', x + w * 0.66, y + h * 0.35 + 15, { fs: 8, color: '#92400e', anchor: 'middle' }),
    _rect(x + w * 0.77, y + h * 0.35, w * 0.1, 22, '#faf5ff', '#a855f7', 1.5, 4), _text('Query', x + w * 0.82, y + h * 0.35 + 15, { fs: 8, color: '#7e22ce', anchor: 'middle' }),
    _rect(x + w * 0.89, y + h * 0.35, w * 0.09, 22, '#fdf2f8', '#db2777', 1.5, 4), _text('Fragment', x + w * 0.935, y + h * 0.35 + 15, { fs: 7, color: '#9d174d', anchor: 'middle' }),
    _text('URL Components', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }),
  ];
}

function shapeJWTDia(x, y, w, h) {
  const segs = []; const parts = ['Header', 'Payload', 'Signature']; const colors = ['#2563eb', '#16a34a', '#f59e0b'];
  segs.push(_text('JWT: header.payload.signature', x + w / 2, y + h * 0.08, { fs: 12, color: '#1e293b', anchor: 'middle', fw: '800' }));
  parts.forEach((p, i) => {
    const pw = w * 0.26; const px = x + w * 0.04 + i * (pw + w * 0.03);
    segs.push(_rect(px, y + h * 0.22, pw, h * 0.48, '#ffffff', colors[i], 2.5, 8));
    segs.push(_rect(px, y + h * 0.22, pw, 26, colors[i], colors[i], 2, 8));
    segs.push(_text(p, px + pw / 2, y + h * 0.22 + 17, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' }));
    segs.push(_text('base64url', px + pw / 2, y + h * 0.52, { fs: 8, color: '#64748b', anchor: 'middle' }));
  });
  segs.push(_text('JSON Web Token - stateless auth', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeOAuthFlow(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  const boxes = [{ x: cx - w * 0.35, y: y + h * 0.1, l: 'User' }, { x: cx + w * 0.15, y: y + h * 0.1, l: 'App' }, { x: cx - w * 0.15, y: y + h * 0.65, l: 'Auth Server' }];
  boxes.forEach(b => { segs.push(_rect(b.x - 40, b.y, 80, 34, '#ede9fe', '#7c3aed', 2, 6)); segs.push(_text(b.l, b.x, b.y + 21, { fs: 11, color: '#5b21b6', anchor: 'middle', fw: '700' })); });
  segs.push(_arrow(cx - w * 0.35 + 40, y + h * 0.1 + 34, cx + w * 0.15 - 40, y + h * 0.1 + 34, '#7c3aed', 2));
  segs.push(_text('1. Login', cx, y + h * 0.1 + 26, { fs: 8, color: '#7c3aed', anchor: 'middle' }));
  segs.push(_arrow(cx + w * 0.15 - 40, y + h * 0.65, cx - w * 0.15 + 40, y + h * 0.65, '#7c3aed', 2));
  segs.push(_text('2. Redirect to auth', cx, y + h * 0.58, { fs: 8, color: '#7c3aed', anchor: 'middle' }));
  segs.push(_arrow(cx - w * 0.15 + 40, y + h * 0.65 + 34, cx + w * 0.15 - 40, y + h * 0.65 + 34, '#7c3aed', 2));
  segs.push(_text('3. Auth code', cx, y + h * 0.73, { fs: 8, color: '#7c3aed', anchor: 'middle' }));
  segs.push(_text('OAuth 2.0 Authorization Code Flow', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeMiddlewareChain(x, y, w, h) {
  const segs = []; const mw = ['Logger', 'Auth', 'Parser', 'Route', 'Error'];
  const cw = 120; const gap = 8; const sx = x + (w - (cw + gap) * mw.length + gap) / 2;
  segs.push(_text('Middleware Pipeline', x + w / 2, y + h * 0.06, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  mw.forEach((m, i) => {
    const mx = sx + i * (cw + gap);
    segs.push(_rect(mx, y + h * 0.25, cw, h * 0.4, i % 2 === 0 ? '#dbeafe' : '#f0fdf4', '#64748b', 2, 8));
    segs.push(_text(m, mx + cw / 2, y + h * 0.45, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
    if (i < mw.length - 1) segs.push(_arrow(mx + cw, y + h * 0.45, mx + cw + gap, y + h * 0.45, '#64748b', 2));
  });
  segs.push(_text('Request passes through each middleware in order', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeGraphQL(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.02, y + h * 0.02, w * 0.3, h * 0.4, '#fce7f3', '#db2777', 2, 8));
  segs.push(_text('Query', x + w * 0.17, y + h * 0.15, { fs: 13, color: '#9d174d', anchor: 'middle', fw: '800' }));
  segs.push(_text('{ user(id: 1) {', x + w * 0.17, y + h * 0.3, { fs: 8, color: '#be185d', anchor: 'middle' }));
  segs.push(_text('  name, email } }', x + w * 0.17, y + h * 0.38, { fs: 8, color: '#be185d', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.68, y + h * 0.02, w * 0.3, h * 0.4, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('Response', x + w * 0.83, y + h * 0.15, { fs: 13, color: '#166534', anchor: 'middle', fw: '800' }));
  segs.push(_text('{ "data": { "user": {', x + w * 0.83, y + h * 0.3, { fs: 8, color: '#15803d', anchor: 'middle' }));
  segs.push(_text('  "name": "Alice" } } }', x + w * 0.83, y + h * 0.38, { fs: 8, color: '#15803d', anchor: 'middle' }));
  segs.push(_text('Ask for exactly what you need', x + w / 2, y + h * 0.5, { fs: 9, color: '#64748b', anchor: 'middle' }));
  segs.push(_text('GraphQL - declarative data fetching', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeWebSocket(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.05, y + h * 0.05, w * 0.25, h * 0.35, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Client', x + w * 0.175, y + h * 0.22, { fs: 12, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_rect(x + w * 0.7, y + h * 0.05, w * 0.25, h * 0.35, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('Server', x + w * 0.825, y + h * 0.22, { fs: 12, color: '#166534', anchor: 'middle', fw: '800' }));
  segs.push(_text('WebSocket', x + w / 2, y + h * 0.18, { fs: 10, color: '#7c3aed', anchor: 'middle', fw: '700' }));
  segs.push(_text('persistent', x + w / 2, y + h * 0.28, { fs: 9, color: '#7c3aed', anchor: 'middle' }));
  segs.push(_text('bidirectional', x + w / 2, y + h * 0.36, { fs: 9, color: '#7c3aed', anchor: 'middle' }));
  segs.push(_line(x + w * 0.3, y + h * 0.22, x + w * 0.7, y + h * 0.22, '#7c3aed', 2));
  segs.push(_line(x + w * 0.7, y + h * 0.3, x + w * 0.3, y + h * 0.3, '#7c3aed', 2));
  segs.push(_text('Real-time, full-duplex communication', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeHttpRequestDiagram(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0f9ff', '#0ea5e9', 2, 8),
    _text('HTTP Request', x + w / 2, y + h * 0.12, { fs: 13, color: '#0369a1', anchor: 'middle', fw: '800' }),
    _text('GET /api/users HTTP/1.1', x + w / 2, y + h * 0.3, { fs: 11, color: '#0284c7', anchor: 'middle', fw: '700' }),
    _text('Host: example.com', x + w / 2, y + h * 0.45, { fs: 10, color: '#0ea5e9', anchor: 'middle' }),
    _text('Authorization: Bearer <token>', x + w / 2, y + h * 0.58, { fs: 10, color: '#0ea5e9', anchor: 'middle' }),
    _text('Method | URL | Headers | Body', x + w / 2, y + h * 0.88, { fs: 10, color: '#64748b', anchor: 'middle' }),
  ];
}

function shapeHttpResponseDiagram(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 8),
    _text('HTTP Response', x + w / 2, y + h * 0.12, { fs: 13, color: '#166534', anchor: 'middle', fw: '800' }),
    _text('HTTP/1.1 200 OK', x + w / 2, y + h * 0.3, { fs: 11, color: '#15803d', anchor: 'middle', fw: '700' }),
    _text('Content-Type: application/json', x + w / 2, y + h * 0.45, { fs: 10, color: '#16a34a', anchor: 'middle' }),
    _text('{"users": [], "total": 10}', x + w / 2, y + h * 0.6, { fs: 10, color: '#059669', anchor: 'middle' }),
    _text('Status | Headers | Body', x + w / 2, y + h * 0.88, { fs: 10, color: '#64748b', anchor: 'middle' }),
  ];
}

function shapeCookieSession(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.05, y + h * 0.1, w * 0.4, h * 0.3, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Cookie', x + w * 0.25, y + h * 0.22, { fs: 14, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('client-side storage', x + w * 0.25, y + h * 0.33, { fs: 9, color: '#b45309', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.55, y + h * 0.1, w * 0.4, h * 0.3, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Session', x + w * 0.75, y + h * 0.22, { fs: 14, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('server-side storage', x + w * 0.75, y + h * 0.33, { fs: 9, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.45, y + h * 0.22, x + w * 0.55, y + h * 0.22, '#64748b', 2));
  segs.push(_text('Session ID stored in cookie', x + w / 2, y + h * 0.6, { fs: 10, color: '#64748b', anchor: 'middle' }));
  segs.push(_text('Cookie vs Session', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeSSRDiagram(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.35, y + h * 0.02, w * 0.3, 32, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Server', x + w / 2, y + h * 0.02 + 20, { fs: 12, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + w / 2, y + h * 0.02 + 32, x + w / 2, y + h * 0.22, '#f59e0b', 2));
  segs.push(_rect(x + w * 0.15, y + h * 0.22, w * 0.7, h * 0.35, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Renders HTML on server', x + w / 2, y + h * 0.35, { fs: 13, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('Sends fully-rendered page to client', x + w / 2, y + h * 0.48, { fs: 10, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_arrow(x + w / 2, y + h * 0.57, x + w / 2, y + h * 0.72, '#2563eb', 2));
  segs.push(_text('Client receives HTML', x + w / 2, y + h * 0.85, { fs: 11, color: '#2563eb', anchor: 'middle' }));
  segs.push(_text('Server-Side Rendering - faster initial paint', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeCSRDiagram(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.35, y + h * 0.02, w * 0.3, 32, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Server', x + w / 2, y + h * 0.02 + 20, { fs: 12, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + w / 2, y + h * 0.02 + 32, x + w / 2, y + h * 0.22, '#f59e0b', 2));
  segs.push(_rect(x + w * 0.15, y + h * 0.22, w * 0.7, h * 0.35, '#fce7f3', '#db2777', 2, 8));
  segs.push(_text('Sends raw JS bundle', x + w / 2, y + h * 0.35, { fs: 13, color: '#9d174d', anchor: 'middle', fw: '800' }));
  segs.push(_text('Client renders in browser', x + w / 2, y + h * 0.48, { fs: 10, color: '#be185d', anchor: 'middle' }));
  segs.push(_arrow(x + w / 2, y + h * 0.57, x + w / 2, y + h * 0.72, '#db2777', 2));
  segs.push(_text('Client-side Rendering', x + w / 2, y + h * 0.85, { fs: 11, color: '#db2777', anchor: 'middle' }));
  segs.push(_text('CSR - slower paint, rich interactivity', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// SYSTEM DESIGN (20 shapes)
// =============================================================================

function shapeLoadBalancer(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.35, y + h * 0.05, w * 0.3, 34, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Load Balancer', x + w / 2, y + h * 0.05 + 22, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  ['S1', 'S2', 'S3'].forEach((s, i) => {
    const sy = y + h * 0.32 + i * (h * 0.18);
    segs.push(_rect(x + w * 0.35, sy, w * 0.3, h * 0.14, '#dbeafe', '#2563eb', 2, 6));
    segs.push(_text(s, x + w / 2, sy + h * 0.07 + 5, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '700' }));
    segs.push(_line(x + w * 0.35, sy + h * 0.07, x + w * 0.35 - 10, sy + h * 0.07, '#2563eb', 2));
  });
  segs.push(_text('Distributes traffic across healthy instances', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeMessageQueue(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.05, y + h * 0.3, w * 0.25, h * 0.35, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Producer', x + w * 0.175, y + h * 0.48, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '700' }));
  segs.push(_rect(x + w * 0.38, y + h * 0.3, w * 0.24, h * 0.35, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Queue', x + w * 0.5, y + h * 0.48, { fs: 11, color: '#92400e', anchor: 'middle', fw: '700' }));
  segs.push(_rect(x + w * 0.7, y + h * 0.3, w * 0.25, h * 0.35, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('Consumer', x + w * 0.825, y + h * 0.48, { fs: 11, color: '#166534', anchor: 'middle', fw: '700' }));
  segs.push(_arrow(x + w * 0.3, y + h * 0.42, x + w * 0.38, y + h * 0.42, '#2563eb', 2));
  segs.push(_arrow(x + w * 0.62, y + h * 0.52, x + w * 0.7, y + h * 0.52, '#16a34a', 2));
  segs.push(_text('Message Queue - async decoupling', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapePubSub(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_circle(cx, y + h * 0.5, 36, '#fef3c7', '#f59e0b', 2.5));
  segs.push(_text('Topic', cx, y + h * 0.48, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('Events', cx, y + h * 0.58, { fs: 8, color: '#d97706', anchor: 'middle' }));
  const subs = [{ x: cx - w * 0.3, y: y + h * 0.12, l: 'Pub A' }, { x: cx + w * 0.3, y: y + h * 0.12, l: 'Pub B' },
    { x: cx - w * 0.35, y: y + h * 0.78, l: 'Sub A' }, { x: cx + w * 0.25, y: y + h * 0.78, l: 'Sub B' }];
  subs.forEach(s => {
    segs.push(_rect(s.x - 24, s.y, 48, 24, '#dbeafe', '#2563eb', 1.5, 6));
    segs.push(_text(s.l, s.x, s.y + 16, { fs: 9, color: '#1e40af', anchor: 'middle', fw: '700' }));
    const dx = cx - s.x, dy = (y + h * 0.5) - s.y - 12; const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    segs.push(_line(s.x, s.y + (s.y < y + h * 0.5 ? 24 : 0), cx - (s.x < cx ? 36 : -36), y + h * 0.5 - (s.y < y + h * 0.5 ? 0 : 36), '#f59e0b', 1.5));
  });
  segs.push(_text('Pub/Sub - fanout to many consumers', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeApiGateway(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.35, y + h * 0.02, w * 0.3, 30, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('API Gateway', x + w / 2, y + h * 0.02 + 20, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  const svcs = ['Auth', 'Users', 'Orders', 'Pay'];
  svcs.forEach((s, i) => { const sy = y + h * 0.22 + i * (h * 0.17);
    segs.push(_rect(x + w * 0.35, sy, w * 0.3, h * 0.14, i % 2 === 0 ? '#dbeafe' : '#f0fdf4', '#64748b', 2, 6));
    segs.push(_text(s, x + w / 2, sy + h * 0.07 + 5, { fs: 10, color: '#1e293b', anchor: 'middle', fw: '700' })); });
  segs.push(_text('Single entry point routing to internal services', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeMicroservices(x, y, w, h) {
  const segs = []; const cx = x + w / 2; const svcs = ['Auth', 'Users', 'Orders', 'Pay', 'Notify'];
  segs.push(_text('Microservices', x + w / 2, y + h * 0.06, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  svcs.forEach((s, i) => {
    const angle = (2 * Math.PI * i) / svcs.length - Math.PI / 2; const r = w * 0.26;
    const sx = cx + Math.cos(angle) * r, sy = y + h * 0.5 + Math.sin(angle) * (r * 0.8);
    segs.push(_circle(sx, sy, 26, '#ffffff', '#7c3aed', 2.5));
    segs.push(_text(s, sx, sy + 5, { fs: 9, color: '#5b21b6', anchor: 'middle', fw: '700' }));
  });
  segs.push(_circle(cx, y + h * 0.5, 20, '#fef3c7', '#f59e0b', 2.5));
  segs.push(_text('GW', cx, y + h * 0.5 + 5, { fs: 10, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('Independently deployable services', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeMonolithic(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.2, y + h * 0.15, w * 0.6, h * 0.6, '#dbeafe', '#2563eb', 3, 12));
  segs.push(_text('Monolith', x + w / 2, y + h * 0.3, { fs: 18, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('UI Logic', x + w / 2, y + h * 0.45, { fs: 11, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_text('Business Logic', x + w / 2, y + h * 0.55, { fs: 11, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_text('Data Access', x + w / 2, y + h * 0.65, { fs: 11, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_text('Single deployable unit', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeEventDriven(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_circle(cx, y + h * 0.5, 40, '#fef3c7', '#f59e0b', 2.5));
  segs.push(_text('Event Bus', cx, y + h * 0.48, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  const nodes = [{ x: cx - w * 0.35, y: y + h * 0.15, l: 'Service A' }, { x: cx + w * 0.35, y: y + h * 0.15, l: 'Service B' },
    { x: cx - w * 0.35, y: y + h * 0.72, l: 'Service C' }, { x: cx + w * 0.35, y: y + h * 0.72, l: 'Service D' }];
  nodes.forEach(s => {
    segs.push(_rect(s.x - 40, s.y, 80, 28, '#dbeafe', '#2563eb', 2, 6));
    segs.push(_text(s.l, s.x, s.y + 18, { fs: 9, color: '#1e40af', anchor: 'middle', fw: '700' }));
    segs.push(_line(s.x, s.y + 14, cx + (s.x < cx ? -40 : 40), y + h * 0.5, '#f59e0b', 1.5));
  });
  segs.push(_text('Event-Driven Architecture', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeCAPTheorem(x, y, w, h) {
  const segs = []; const cx = x + w / 2, cy = y + h * 0.5;
  const pts = [{ x: cx, y: cy - h * 0.3, l: 'Consistency' }, { x: cx - w * 0.3, y: cy + h * 0.25, l: 'Availability' },
    { x: cx + w * 0.3, y: cy + h * 0.25, l: 'Partition Tolerance' }];
  segs.push(_line(pts[0].x, pts[0].y, pts[1].x, pts[1].y, '#cbd5e1', 2));
  segs.push(_line(pts[1].x, pts[1].y, pts[2].x, pts[2].y, '#cbd5e1', 2));
  segs.push(_line(pts[2].x, pts[2].y, pts[0].x, pts[0].y, '#cbd5e1', 2));
  pts.forEach(p => { segs.push(_circle(p.x, p.y, 24, '#fef3c7', '#f59e0b', 2.5)); segs.push(_text(p.l.substring(0, 7), p.x, p.y + 5, { fs: 9, color: '#92400e', anchor: 'middle', fw: '800' })); });
  segs.push(_text('Pick 2 of 3 in distributed systems', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeCDN(x, y, w, h) {
  const segs = [];
  const cx = x + w * 0.42;
  segs.push(_rect(x + w * 0.02, y + h * 0.35, w * 0.25, h * 0.3, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('Origin', x + w * 0.145, y + h * 0.5, { fs: 12, color: '#166534', anchor: 'middle', fw: '800' }));
  const edges = [{ x: cx, y: y + h * 0.12 }, { x: cx, y: y + h * 0.65 }, { x: x + w * 0.7, y: y + h * 0.3 }, { x: x + w * 0.7, y: y + h * 0.7 }];
  edges.forEach((e, i) => {
    segs.push(_circle(e.x, e.y, 18, '#ffffff', '#f59e0b', 2));
    segs.push(_text(`E${i + 1}`, e.x, e.y + 5, { fs: 9, color: '#92400e', anchor: 'middle', fw: '700' }));
    segs.push(_line(cx, e.y, x + w * 0.27, y + h * 0.5, '#f59e0b', 1.5));
  });
  segs.push(_rect(x + w * 0.75, y + h * 0.35, w * 0.23, h * 0.3, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Users', x + w * 0.865, y + h * 0.5, { fs: 12, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('CDN - content delivery network', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeDatabaseShard(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.02, y + h * 0.02, w * 0.3, h * 0.3, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('App Layer', x + w * 0.17, y + h * 0.17, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  const shards = ['Shard 1', 'Shard 2', 'Shard 3'];
  shards.forEach((s, i) => {
    const sy = y + h * 0.42 + i * (h * 0.17);
    segs.push(_rect(x + w * 0.2, sy, w * 0.6, h * 0.14, '#dbeafe', '#2563eb', 2, 6));
    segs.push(_text(s, x + w * 0.5, sy + h * 0.07 + 5, { fs: 10, color: '#1e40af', anchor: 'middle', fw: '700' }));
    segs.push(_line(x + w * 0.32, y + h * 0.02 + 30, x + w * 0.5, sy, '#f59e0b', 1.5));
  });
  segs.push(_text('Database Sharding - horizontal partitioning', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeCQRSPattern(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.05, y + h * 0.2, w * 0.35, h * 0.3, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Command', x + w * 0.225, y + h * 0.32, { fs: 13, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('Write Model', x + w * 0.225, y + h * 0.44, { fs: 9, color: '#d97706', anchor: 'middle' }));
  segs.push(_rect(x + w * 0.6, y + h * 0.2, w * 0.35, h * 0.3, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Query', x + w * 0.775, y + h * 0.32, { fs: 13, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('Read Model', x + w * 0.775, y + h * 0.44, { fs: 9, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.4, y + h * 0.32, x + w * 0.6, y + h * 0.32, '#64748b', 2));
  segs.push(_text('sync/eventual', x + w / 2, y + h * 0.28, { fs: 8, color: '#64748b', anchor: 'middle' }));
  segs.push(_text('CQRS - separate read/write models', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeCircuitBreaker(x, y, w, h) {
  const segs = []; const states = ['CLOSED', 'OPEN', 'HALF-OPEN'];
  const colors = ['#16a34a', '#dc2626', '#f59e0b'];
  segs.push(_text('Circuit Breaker Pattern', x + w / 2, y + h * 0.08, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  states.forEach((s, i) => {
    const sy = y + h * 0.22 + i * (h * 0.22);
    segs.push(_rect(x + w * 0.3, sy, w * 0.4, h * 0.16, '#ffffff', colors[i], 2.5, 8));
    segs.push(_text(s, x + w * 0.5, sy + h * 0.08 + 5, { fs: 13, color: colors[i], anchor: 'middle', fw: '800' }));
    if (i < states.length - 1) segs.push(_arrow(x + w * 0.5, sy + h * 0.16, x + w * 0.5, sy + h * 0.22, colors[i], 2));
  });
  segs.push(_text('Prevents cascading failures', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeRateLimiter(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.02, y + h * 0.05, w * 0.3, h * 0.35, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Requests', x + w * 0.17, y + h * 0.22, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_rect(x + w * 0.35, y + h * 0.2, w * 0.3, h * 0.3, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Rate', x + w * 0.5, y + h * 0.3, { fs: 13, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('Limiter', x + w * 0.5, y + h * 0.4, { fs: 13, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_rect(x + w * 0.68, y + h * 0.05, w * 0.3, h * 0.35, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('Allowed', x + w * 0.83, y + h * 0.22, { fs: 11, color: '#166534', anchor: 'middle', fw: '800' }));
  segs.push(_rect(x + w * 0.68, y + h * 0.55, w * 0.3, h * 0.3, '#fef2f2', '#dc2626', 2, 8));
  segs.push(_text('Blocked', x + w * 0.83, y + h * 0.7, { fs: 11, color: '#991b1b', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + w * 0.32, y + h * 0.35, x + w * 0.35, y + h * 0.35, '#2563eb', 2));
  segs.push(_arrow(x + w * 0.65, y + h * 0.3, x + w * 0.68, y + h * 0.2, '#16a34a', 2));
  segs.push(_arrow(x + w * 0.65, y + h * 0.42, x + w * 0.68, y + h * 0.7, '#dc2626', 2));
  segs.push(_text('Rate Limiting - protects API from abuse', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeReverseProxy(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.35, y + h * 0.02, w * 0.3, 32, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Nginx', x + w / 2, y + h * 0.02 + 20, { fs: 12, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('Reverse Proxy', x + w / 2, y + h * 0.16, { fs: 10, color: '#92400e', anchor: 'middle' }));
  ['App 1', 'App 2', 'App 3'].forEach((s, i) => {
    const sy = y + h * 0.28 + i * (h * 0.2);
    segs.push(_rect(x + w * 0.35, sy, w * 0.3, h * 0.16, i % 2 === 0 ? '#dbeafe' : '#f0fdf4', '#64748b', 2, 6));
    segs.push(_text(s, x + w / 2, sy + h * 0.08 + 5, { fs: 10, color: '#1e293b', anchor: 'middle', fw: '700' }));
  });
  segs.push(_text('Proxies requests to backend apps', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// DEVOPS & TOOLS (15 shapes)
// =============================================================================

function shapeGitBranch(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Git Branching', x + w / 2, y + h * 0.06, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const main = [{ x: x + w * 0.1, y: y + h * 0.8 }, { x: x + w * 0.3, y: y + h * 0.65 }, { x: x + w * 0.5, y: y + h * 0.6 }, { x: x + w * 0.7, y: y + h * 0.65 }, { x: x + w * 0.9, y: y + h * 0.6 }];
  main.forEach((p, i) => { segs.push(_circle(p.x, p.y, 6, '#2563eb', '#2563eb', 2)); if (i > 0) segs.push(_line(main[i - 1].x, main[i - 1].y, p.x, p.y, '#2563eb', 2)); });
  segs.push(_text('main', x + w * 0.9, y + h * 0.56, { fs: 8, color: '#2563eb', anchor: 'middle', fw: '700' }));
  const feature = [{ x: x + w * 0.3, y: y + h * 0.65 }, { x: x + w * 0.35, y: y + h * 0.4 }, { x: x + w * 0.55, y: y + h * 0.35 }, { x: x + w * 0.65, y: y + h * 0.48 }];
  feature.forEach((p, i) => { segs.push(_circle(p.x, p.y, 6, '#16a34a', '#16a34a', 2)); if (i > 0) segs.push(_line(feature[i - 1].x, feature[i - 1].y, p.x, p.y, '#16a34a', 2)); });
  segs.push(_text('feature-branch', x + w * 0.4, y + h * 0.3, { fs: 8, color: '#16a34a', anchor: 'middle', fw: '700' }));
  segs.push(_text('Branch off main, merge back', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeGitMerge(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Git Merge', x + w / 2, y + h * 0.06, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const m1 = { x: x + w * 0.15, y: y + h * 0.7 }; const m2 = { x: cx, y: y + h * 0.5 }; const m3 = { x: x + w * 0.85, y: y + h * 0.4 };
  const f1 = { x: x + w * 0.4, y: y + h * 0.25 }; const f2 = { x: cx, y: y + h * 0.15 };
  [m1, m2, m3].forEach((p, i) => { segs.push(_circle(p.x, p.y, 6, '#2563eb', '#2563eb', 2)); if (i > 0) segs.push(_line([m1, m2, m3][i - 1].x, [m1, m2, m3][i - 1].y, p.x, p.y, '#2563eb', 2)); });
  segs.push(_line(m1.x, m1.y, f1.x, f1.y, '#16a34a', 2));
  segs.push(_circle(f1.x, f1.y, 6, '#16a34a', '#16a34a', 2)); segs.push(_circle(f2.x, f2.y, 6, '#16a34a', '#16a34a', 2));
  segs.push(_line(f1.x, f1.y, f2.x, f2.y, '#16a34a', 2));
  segs.push(_line(f2.x, f2.y, m2.x, m2.y, '#f59e0b', 2));
  segs.push(_circle(m2.x, m2.y, 8, '#fef3c7', '#f59e0b', 2));
  segs.push(_text('merge commit', cx, y + h * 0.44, { fs: 8, color: '#f59e0b', anchor: 'middle' }));
  segs.push(_text('Merge branch into main', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeDockerContainer(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.55, '#dbeafe', '#2563eb', 2.5, 8));
  segs.push(_rect(x + w * 0.15, y + h * 0.15, w * 0.7, 28, '#2563eb', '#1e40af', 2, 8));
  segs.push(_text('Docker Container', x + w / 2, y + h * 0.15 + 18, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_text('App + deps + runtime', x + w / 2, y + h * 0.4, { fs: 11, color: '#1e40af', anchor: 'middle' }));
  segs.push(_text('Isolated process', x + w / 2, y + h * 0.52, { fs: 11, color: '#1e40af', anchor: 'middle' }));
  segs.push(_text('Portable across environments', x + w / 2, y + h * 0.64, { fs: 11, color: '#1e40af', anchor: 'middle' }));
  segs.push(_text('Container - lightweight VM alternative', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeCICDPipeline(x, y, w, h) {
  const segs = []; const stages = ['Code', 'Build', 'Test', 'Deploy'];
  const colors = ['#2563eb', '#7c3aed', '#f59e0b', '#16a34a']; const cw = 130; const gap = 10; const sx = x + (w - (cw + gap) * stages.length + gap) / 2;
  segs.push(_text('CI/CD Pipeline', x + w / 2, y + h * 0.06, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  stages.forEach((s, i) => {
    const bx = sx + i * (cw + gap);
    segs.push(_rect(bx, y + h * 0.28, cw, h * 0.35, '#ffffff', colors[i], 2.5, 8));
    segs.push(_rect(bx, y + h * 0.28, cw, 26, colors[i], colors[i], 2, 8));
    segs.push(_text(s, bx + cw / 2, y + h * 0.28 + 17, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '700' }));
    if (i < stages.length - 1) segs.push(_arrow(bx + cw, y + h * 0.455, bx + cw + gap, y + h * 0.455, '#64748b', 2));
  });
  segs.push(_text('Automated build, test, and deployment', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeDockerCompose(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.05, y + h * 0.3, w * 0.25, h * 0.35, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Web', x + w * 0.175, y + h * 0.48, { fs: 12, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_rect(x + w * 0.38, y + h * 0.3, w * 0.24, h * 0.35, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('DB', x + w * 0.5, y + h * 0.48, { fs: 12, color: '#166534', anchor: 'middle', fw: '800' }));
  segs.push(_rect(x + w * 0.7, y + h * 0.3, w * 0.25, h * 0.35, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Redis', x + w * 0.825, y + h * 0.48, { fs: 12, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_line(x + w * 0.3, y + h * 0.42, x + w * 0.38, y + h * 0.42, '#94a3b8', 2));
  segs.push(_line(x + w * 0.62, y + h * 0.52, x + w * 0.7, y + h * 0.52, '#94a3b8', 2));
  segs.push(_text('Multi-container orchestration with docker-compose', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeKubernetesPod(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.2, y + h * 0.15, w * 0.6, h * 0.55, '#ede9fe', '#7c3aed', 2.5, 10));
  segs.push(_text('K8s Pod', x + w / 2, y + h * 0.15 + 18, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_rect(x + w * 0.2, y + h * 0.15, w * 0.6, 28, '#7c3aed', '#5b21b6', 2, 10));
  const containers = ['App Container', 'Sidecar'];
  containers.forEach((c, i) => {
    const cy = y + h * 0.32 + i * (h * 0.16);
    segs.push(_rect(x + w * 0.3, cy, w * 0.4, h * 0.13, '#ffffff', '#a78bfa', 2, 6));
    segs.push(_text(c, x + w / 2, cy + h * 0.065 + 4, { fs: 9, color: '#5b21b6', anchor: 'middle', fw: '700' }));
  });
  segs.push(_text('Shared volumes & networking', x + w / 2, y + h * 0.68, { fs: 8, color: '#7c3aed', anchor: 'middle' }));
  segs.push(_text('Minimal deploy unit in Kubernetes', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeGitHubActions(x, y, w, h) {
  const segs = []; const steps = ['Checkout', 'Setup', 'Lint', 'Test', 'Deploy'];
  const cw = 110; const sx = x + (w - cw) / 2;
  segs.push(_text('GitHub Actions Workflow', x + w / 2, y + h * 0.06, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  steps.forEach((s, i) => {
    const sy = y + h * 0.18 + i * (h * 0.13);
    segs.push(_rect(sx, sy, cw, h * 0.1, i % 2 === 0 ? '#dbeafe' : '#f0fdf4', '#64748b', 2, 6));
    segs.push(_text(s, sx + cw / 2, sy + h * 0.05 + 4, { fs: 10, color: '#1e293b', anchor: 'middle', fw: '700' }));
    if (i < steps.length - 1) segs.push(_arrow(sx + cw / 2, sy + h * 0.1, sx + cw / 2, sy + h * 0.13, '#64748b', 2));
  });
  segs.push(_text('YAML-defined CI/CD in GitHub', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeTerraform(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.02, y + h * 0.02, w * 0.3, h * 0.35, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Terraform', x + w * 0.17, y + h * 0.12, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('.tf files', x + w * 0.17, y + h * 0.28, { fs: 9, color: '#d97706', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.32, y + h * 0.2, x + w * 0.4, y + h * 0.2, '#64748b', 2));
  segs.push(_rect(x + w * 0.4, y + h * 0.2, w * 0.2, h * 0.3, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Plan', x + w * 0.5, y + h * 0.3, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('Apply', x + w * 0.5, y + h * 0.42, { fs: 9, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.6, y + h * 0.35, x + w * 0.68, y + h * 0.35, '#64748b', 2));
  segs.push(_rect(x + w * 0.68, y + h * 0.15, w * 0.3, h * 0.55, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('Infra', x + w * 0.83, y + h * 0.3, { fs: 11, color: '#166534', anchor: 'middle', fw: '800' }));
  segs.push(_text('AWS/GCP/Azure', x + w * 0.83, y + h * 0.48, { fs: 9, color: '#16a34a', anchor: 'middle' }));
  segs.push(_text('IaC - Infrastructure as Code', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeMonitoring(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.05, y + h * 0.4, w * 0.25, h * 0.4, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('App', x + w * 0.175, y + h * 0.6, { fs: 12, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + w * 0.3, y + h * 0.55, x + w * 0.4, y + h * 0.55, '#64748b', 2));
  segs.push(_rect(x + w * 0.4, y + h * 0.05, w * 0.2, h * 0.75, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Metrics', x + w * 0.5, y + h * 0.2, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('Logs', x + w * 0.5, y + h * 0.4, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_text('Traces', x + w * 0.5, y + h * 0.6, { fs: 11, color: '#92400e', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + w * 0.6, y + h * 0.4, x + w * 0.68, y + h * 0.4, '#64748b', 2));
  segs.push(_rect(x + w * 0.68, y + h * 0.3, w * 0.3, h * 0.35, '#f0fdf4', '#16a34a', 2, 8));
  segs.push(_text('Dashboard', x + w * 0.83, y + h * 0.48, { fs: 11, color: '#166534', anchor: 'middle', fw: '800' }));
  segs.push(_text('Observability - monitor, alert, debug', x + w / 2, y + h * 0.94, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeHelmChart(x, y, w, h) {
  const segs = [];
  segs.push(_rect(x + w * 0.02, y + h * 0.1, w * 0.25, h * 0.5, '#fff7ed', '#f97316', 2, 8));
  segs.push(_text('Helm', x + w * 0.145, y + h * 0.3, { fs: 13, color: '#c2410c', anchor: 'middle', fw: '800' }));
  segs.push(_text('Chart', x + w * 0.145, y + h * 0.45, { fs: 10, color: '#ea580c', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.27, y + h * 0.35, x + w * 0.35, y + h * 0.35, '#64748b', 2));
  segs.push(_rect(x + w * 0.35, y + h * 0.15, w * 0.6, h * 0.5, '#dbeafe', '#2563eb', 2, 8));
  segs.push(_text('Kubernetes', x + w / 2 + w * 0.15, y + h * 0.3, { fs: 12, color: '#1e40af', anchor: 'middle', fw: '800' }));
  segs.push(_text('Deployments Services ConfigMaps', x + w / 2 + w * 0.15, y + h * 0.5, { fs: 9, color: '#3b82f6', anchor: 'middle' }));
  segs.push(_text('Package manager for Kubernetes', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapeServiceMesh(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Service Mesh', x + w / 2, y + h * 0.06, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const svcs = ['Svc A', 'Svc B', 'Svc C', 'Svc D'];
  const pts = [{ x: cx - w * 0.25, y: y + h * 0.25 }, { x: cx + w * 0.25, y: y + h * 0.25 },
    { x: cx - w * 0.25, y: y + h * 0.65 }, { x: cx + w * 0.25, y: y + h * 0.65 }];
  pts.forEach((p, i) => {
    segs.push(_rect(p.x - 28, p.y - 14, 56, 28, '#ffffff', '#7c3aed', 2, 6));
    segs.push(_text(svcs[i], p.x, p.y + 5, { fs: 10, color: '#5b21b6', anchor: 'middle', fw: '700' }));
  });
  const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  edges.forEach(([a, b]) => { segs.push(_line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, '#c4b5fd', 1.5)); });
  segs.push(_text('Sidecar proxies manage all service-to-service traffic', x + w / 2, y + h * 0.92, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// PREMIUM ENHANCED SHAPES — gradient, 3D depth, rich visuals
// =============================================================================

function shapePremiumBinaryTree(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Binary Search Tree', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const nodes = [
    { x: cx, y: y + h * 0.18, v: '15' },
    { x: cx - w * 0.2, y: y + h * 0.38, v: '8' },
    { x: cx + w * 0.2, y: y + h * 0.38, v: '22' },
    { x: cx - w * 0.35, y: y + h * 0.58, v: '4' },
    { x: cx - w * 0.1, y: y + h * 0.58, v: '12' },
    { x: cx + w * 0.1, y: y + h * 0.58, v: '18' },
    { x: cx + w * 0.35, y: y + h * 0.58, v: '28' },
  ];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  edges.forEach(([a, b]) => segs.push(_line(nodes[a].x, nodes[a].y + 16, nodes[b].x, nodes[b].y - 16, '#94a3b8', 2)));
  nodes.forEach(n => {
    segs.push(_gradCircle(n.x, n.y, 18, 'grad-blue', '#1d4ed8', 2));
    segs.push(_circle(n.x, n.y, 14, '#ffffff', 'none', 0));
    segs.push(_text(n.v, n.x, n.y + 5, { fs: 13, color: '#1e293b', anchor: 'middle', fw: '800' }));
  });
  segs.push(_text('Each node: left < parent < right   |   O(log n) search', cx, y + h * 0.85, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapePremiumHashMap(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Hash Map / Hash Table', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const keys = ['name', 'age', 'city', 'email'];
  const vals = ['Alice', '28', 'NYC', 'alice@x.com'];
  const buckets = [0, 1, 2, 3, 2, 0, 1];
  const bw = 56; const bh = 26; const gap = 4; const sx = x + w * 0.08;
  for (let i = 0; i < 7; i++) {
    const bx = sx + i * (bw + gap);
    segs.push(_gradRect(bx, y + h * 0.18, bw, bh, i < 5 ? 'grad-blue-light' : 'grad-amber'));
    segs.push(_text(String(i), bx + bw / 2, y + h * 0.18 + 17, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' }));
  }
  keys.forEach((k, i) => {
    const bi = buckets[i]; const bx = sx + bi * (bw + gap);
    const ty = y + h * 0.35 + i * (bh + 4);
    segs.push(_gradRect(bx, ty, bw * 0.9, bh, 'grad-slate'));
    segs.push(_text(`${k}: ${vals[i]}`, bx + bw * 0.45, ty + 17, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '600' }));
    segs.push(_arrow(x + w * 0.72, y + h * 0.3 + i * 24, bx + 4, ty + bh / 2, '#94a3b8', 1.5));
  });
  segs.push(_text('hash(key) → bucket index | O(1) average lookup', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapePremiumMergeSort(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Merge Sort — Divide & Conquer', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const levels = [
    [{ v: '38, 27, 43, 3, 9, 82, 10', cols: 1 }],
    [{ v: '38, 27, 43, 3', cols: 1 }, { v: '9, 82, 10', cols: 1 }],
    [{ v: '38, 27', cols: 1 }, { v: '43, 3', cols: 1 }, { v: '9, 82', cols: 1 }, { v: '10', cols: 1 }],
    [{ v: '38', cols: 1 }, { v: '27', cols: 1 }, { v: '43', cols: 1 }, { v: '3', cols: 1 }, { v: '9', cols: 1 }, { v: '82', cols: 1 }, { v: '10', cols: 1 }],
  ];
  const ly = [0.14, 0.32, 0.50, 0.68];
  levels.forEach((lvl, li) => {
    const lw = w * 0.85; const startX = x + (w - lw) / 2;
    lvl.forEach((item, ii) => {
      const iw = lw / lvl.length - 4; const ix = startX + ii * (lw / lvl.length);
      const color = li < 2 ? 'grad-blue-light' : li < 3 ? 'grad-purple-light' : 'grad-green-light';
      segs.push(_gradRect(ix, y + h * ly[li], iw, 22, color));
      segs.push(_text(item.v, ix + iw / 2, y + h * ly[li] + 15, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
      if (li > 0) segs.push(_line(x + w / 2, y + h * (ly[li - 1] + 0.06), ix + iw / 2, y + h * ly[li], '#94a3b8', 1));
    });
  });
  segs.push(_text('Split → recursively sort → merge | O(n log n)', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

function shapePremiumGraphTraversal(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Graph Traversal — BFS vs DFS', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const nodes = [
    { x: cx, y: y + h * 0.2, v: 'A', g: 'grad-blue' },
    { x: cx - w * 0.25, y: y + h * 0.42, v: 'B', g: 'grad-green-light' },
    { x: cx + w * 0.25, y: y + h * 0.42, v: 'C', g: 'grad-purple-light' },
    { x: cx - w * 0.4, y: y + h * 0.65, v: 'D', g: 'grad-amber' },
    { x: cx - w * 0.1, y: y + h * 0.65, v: 'E', g: 'grad-pink' },
    { x: cx + w * 0.3, y: y + h * 0.65, v: 'F', g: 'grad-teal' },
  ];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [4, 5]];
  edges.forEach(([a, b]) => segs.push(_line(nodes[a].x, nodes[a].y + 16, nodes[b].x, nodes[b].y - 16, '#94a3b8', 2)));
  nodes.forEach(n => {
    segs.push(_gradCircle(n.x, n.y, 22, n.g));
    segs.push(_circle(n.x, n.y, 17, 'rgba(255,255,255,0.25)', 'none', 0));
    segs.push(_text(n.v, n.x, n.y + 6, { fs: 15, color: '#ffffff', anchor: 'middle', fw: '800' }));
  });
  segs.push(_text('BFS: Queue → level order   |   DFS: Stack → depth-first', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// MACHINE LEARNING & AI (15 shapes)
// =============================================================================

function shapeNeuralNetwork(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Neural Network', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const layers = [
    { count: 3, label: 'Input', cy: y + h * 0.45, color: 'grad-blue-light' },
    { count: 5, label: 'Hidden 1', cy: y + h * 0.45, color: 'grad-purple-light' },
    { count: 4, label: 'Hidden 2', cy: y + h * 0.45, color: 'grad-purple-light' },
    { count: 2, label: 'Output', cy: y + h * 0.45, color: 'grad-green-light' },
  ];
  const lx = layers.map((_, i) => x + w * (0.08 + i * 0.28));
  layers.forEach((layer, li) => {
    const nodes = Array.from({ length: layer.count }, (_, ni) => ({
      x: lx[li], y: layer.cy + (ni - (layer.count - 1) / 2) * 28,
    }));
    nodes.forEach(n => segs.push(_gradCircle(n.x, n.y, 8, layer.color)));
    if (li > 0) {
      const prevNodes = Array.from({ length: layers[li - 1].count }, (_, ni) => ({
        x: lx[li - 1], y: layers[li - 1].cy + (ni - (layers[li - 1].count - 1) / 2) * 28,
      }));
      nodes.forEach(n => prevNodes.forEach(p => segs.push(_line(p.x + 8, p.y, n.x - 8, n.y, '#cbd5e1', 1))));
    }
    segs.push(_text(layer.label, lx[li], y + h * 0.82, { fs: 10, color: '#64748b', anchor: 'middle', fw: '700' }));
  });
  segs.push(_text('Layers of interconnected neurons | Weights & biases learned via backpropagation', cx, y + h * 0.94, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeDecisionTree(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Decision Tree (ML)', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const root = { x: cx, y: y + h * 0.18, v: 'X > 5?' };
  const l1 = [{ x: cx - w * 0.2, y: y + h * 0.38, v: 'Y > 3?' }, { x: cx + w * 0.2, y: y + h * 0.38, v: 'Z > 7?' }];
  const leaves = [
    { x: cx - w * 0.35, y: y + h * 0.6, v: 'Class A', g: 'grad-green-light' },
    { x: cx - w * 0.1, y: y + h * 0.6, v: 'Class B', g: 'grad-amber' },
    { x: cx + w * 0.15, y: y + h * 0.6, v: 'Class C', g: 'grad-red' },
    { x: cx + w * 0.35, y: y + h * 0.6, v: 'Class D', g: 'grad-purple-light' },
  ];
  segs.push(_gradCircle(root.x, root.y, 20, 'grad-blue'));
  segs.push(_text(root.v, root.x, root.y + 5, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '700' }));
  l1.forEach(n => {
    segs.push(_line(root.x, root.y + 20, n.x, n.y - 18, '#94a3b8', 2));
    segs.push(_gradCircle(n.x, n.y, 18, 'grad-indigo'));
    segs.push(_text(n.v, n.x, n.y + 5, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
  });
  leaves.forEach((l, i) => {
    const parent = l1[Math.floor(i / 2)];
    segs.push(_line(parent.x, parent.y + 18, l.x, l.y - 16, '#cbd5e1', 1.5));
    segs.push(_gradRect(l.x - 32, l.y - 12, 64, 24, l.g));
    segs.push(_text(l.v, l.x, l.y + 5, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
  });
  segs.push(_text('Splits data by feature thresholds | Used for classification & regression', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeSVMMargin(x, y, w, h) {
  const segs = []; const cx = x + w / 2; const cy = y + h / 2;
  segs.push(_text('SVM — Support Vector Machine', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const leftPts = [[-0.3, -0.15], [-0.25, 0.2], [-0.4, 0.05], [-0.2, -0.3], [-0.35, -0.25]];
  const rightPts = [[0.3, 0.15], [0.25, -0.2], [0.4, -0.05], [0.2, 0.3], [0.35, 0.25]];
  const toSvg = ([px, py]) => ({ x: cx + px * w, y: cy + py * h });
  leftPts.forEach(p => { const s = toSvg(p); segs.push(_gradCircle(s.x, s.y, 10, 'grad-blue')); });
  rightPts.forEach(p => { const s = toSvg(p); segs.push(_gradCircle(s.x, s.y, 10, 'grad-red')); });
  segs.push(_line(cx - w * 0.35, cy + h * 0.25, cx + w * 0.35, cy - h * 0.25, '#2563eb', 3));
  segs.push(_line(cx - w * 0.3, cy + h * 0.3, cx + w * 0.4, cy - h * 0.2, '#93c5fd', 2, true));
  segs.push(_line(cx - w * 0.4, cy + h * 0.2, cx + w * 0.3, cy - h * 0.3, '#93c5fd', 2, true));
  segs.push(_text('Maximum margin hyperplane', cx + w * 0.3, cy - h * 0.28, { fs: 9, color: '#2563eb', anchor: 'start' }));
  segs.push(_text('Separates classes with largest margin', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeKMeans(x, y, w, h) {
  const segs = []; const cx = x + w / 2; const cy = y + h / 2;
  segs.push(_text('K-Means Clustering', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const clusters = [
    { pts: [[-0.25, -0.2], [-0.15, -0.1], [-0.3, -0.05], [-0.2, -0.25]], cx: -0.22, cy: -0.15, color: 'grad-blue' },
    { pts: [[0.15, -0.1], [0.25, -0.2], [0.2, 0.0], [0.1, -0.15]], cx: 0.18, cy: -0.12, color: 'grad-green-light' },
    { pts: [[-0.1, 0.2], [0.0, 0.15], [-0.2, 0.25], [0.05, 0.1]], cx: -0.06, cy: 0.18, color: 'grad-purple-light' },
  ];
  clusters.forEach(c => {
    c.pts.forEach(p => { const s = { x: cx + p[0] * w, y: cy + p[1] * h }; segs.push(_gradCircle(s.x, s.y, 8, c.color)); });
    const center = { x: cx + c.cx * w, y: cy + c.cy * h };
    segs.push({ type: 'draw_circle', center: [center.x, center.y], radius: 50, style: { fill: 'none', stroke: c.color.split('-')[1] === 'blue' ? '#3b82f6' : c.color.split('-')[1] === 'green' ? '#22c55e' : '#a855f7', strokeWidth: 2, strokeDasharray: '6,4' } });
  });
  segs.push(_text('Groups unlabeled data into K clusters based on feature similarity', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeTransformer(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Transformer Architecture', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const blocks = ['Input Embed', 'Positional\nEncoding', 'Multi-Head\nAttention', 'Add & Norm', 'Feed\nForward', 'Add & Norm', 'Output'];
  const bw = 80; const bh = 50; const gap = 8; const sx = cx - ((blocks.length * (bw + gap) - gap) / 2);
  blocks.forEach((b, i) => {
    const bx = sx + i * (bw + gap);
    const g = i === 2 ? 'grad-purple-light' : i === 4 ? 'grad-blue-light' : 'grad-slate';
    segs.push(_gradRect(bx, y + h * 0.25, bw, bh, g));
    const lines = b.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, bx + bw / 2, y + h * 0.25 + 16 + li * 16, { fs: 8, color: '#ffffff', anchor: 'middle', fw: '700' })));
    if (i < blocks.length - 1) segs.push(_arrow(bx + bw, y + h * 0.5, bx + bw + gap, y + h * 0.5, '#94a3b8', 1.5));
  });
  segs.push(_text('The "Attention Is All You Need" architecture — foundation of LLMs like GPT', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// ADVANCED SYSTEM DESIGN (10 shapes)
// =============================================================================

function shapeEventSourcing(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Event Sourcing', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const events = [
    { t: 'User Created', c: 'grad-green-light' },
    { t: 'Email Changed', c: 'grad-blue-light' },
    { t: 'Order Placed', c: 'grad-amber' },
    { t: 'Payment Received', c: 'grad-purple-light' },
  ];
  events.forEach((e, i) => {
    const ex = x + w * 0.08 + i * (w * 0.21);
    segs.push(_gradRect(ex, y + h * 0.3, w * 0.18, 40, e.c));
    segs.push(_text(e.t, ex + w * 0.09, y + h * 0.3 + 24, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
    segs.push(_text(`t${i + 1}`, ex + w * 0.09, y + h * 0.27, { fs: 8, color: '#94a3b8', anchor: 'middle' }));
    if (i < events.length - 1) segs.push(_arrow(ex + w * 0.18, y + h * 0.5, ex + w * 0.21, y + h * 0.5, '#94a3b8', 1.5));
  });
  segs.push(_rect(x + w * 0.35, y + h * 0.62, w * 0.3, 34, '#fef3c7', '#f59e0b', 2, 8));
  segs.push(_text('Event Store (append-only log)', cx, y + h * 0.62 + 22, { fs: 10, color: '#92400e', anchor: 'middle', fw: '700' }));
  events.forEach((_, i) => {
    const ex = x + w * 0.08 + i * (w * 0.21);
    segs.push(_arrow(ex + w * 0.09, y + h * 0.3 + 40, cx, y + h * 0.62, '#f59e0b', 1));
  });
  segs.push(_text('State = replayed sequence of events | audit log, time travel, CQRS', cx, y + h * 0.9, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeSagaPattern(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Saga Pattern — Distributed Transactions', cx, y + h * 0.06, { fs: 15, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const steps = ['Order\nCreated', 'Payment\nTaken', 'Inventory\nReserved', 'Shipping\nScheduled', 'Complete'];
  const sw = 90; const gap = 10; const sx = cx - ((steps.length * (sw + gap) - gap) / 2);
  steps.forEach((s, i) => {
    const bx = sx + i * (sw + gap);
    const g = i === steps.length - 1 ? 'grad-green-light' : i % 2 === 0 ? 'grad-blue-light' : 'grad-purple-light';
    segs.push(_gradRect(bx, y + h * 0.28, sw, 50, g));
    const lines = s.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, bx + sw / 2, y + h * 0.28 + 18 + li * 16, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' })));
    if (i < steps.length - 1) segs.push(_arrow(bx + sw, y + h * 0.53, bx + sw + gap, y + h * 0.53, '#94a3b8', 1.5));
    if (i < steps.length - 1 && i > 0) segs.push(_arrow(bx + sw + gap, y + h * 0.4, bx + sw, y + h * 0.4, '#f87171', 1, true));
  });
  segs.push(_text('Compensating transactions roll back on failure (dashed = rollback)', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeDataPipeline(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Data Pipeline — ETL', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const stages = [
    { l: 'Extract', src: 'APIs, DBs\nFiles', c: 'grad-blue-light' },
    { l: 'Transform', src: 'Clean, Join\nAggregate', c: 'grad-purple-light' },
    { l: 'Load', src: 'Warehouse\nData Lake', c: 'grad-green-light' },
  ];
  stages.forEach((s, i) => {
    const sx = x + w * (0.05 + i * 0.32);
    segs.push(_gradRect(sx, y + h * 0.2, w * 0.28, 60, s.c));
    segs.push(_text(s.l, sx + w * 0.14, y + h * 0.2 + 22, { fs: 13, color: '#ffffff', anchor: 'middle', fw: '800' }));
    const lines = s.src.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, sx + w * 0.14, y + h * 0.2 + 42 + li * 14, { fs: 8, color: 'rgba(255,255,255,0.8)', anchor: 'middle' })));
    if (i < stages.length - 1) segs.push(_arrow(sx + w * 0.28, y + h * 0.5, sx + w * 0.32, y + h * 0.5, '#94a3b8', 2.5));
  });
  segs.push(_text('Extract → Transform → Load | Batch & streaming data processing', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeTwoPhaseCommit(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Two-Phase Commit (2PC)', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.35, y + h * 0.15, w * 0.3, 36, 'grad-blue'));
  segs.push(_text('Coordinator', cx, y + h * 0.15 + 24, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
  const parts = ['Shard A', 'Shard B', 'Shard C'];
  parts.forEach((p, i) => {
    const py = y + h * 0.55 + i * 36;
    segs.push(_gradRect(x + w * 0.35, py, w * 0.3, 30, 'grad-slate'));
    segs.push(_text(p, cx, py + 20, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' }));
    segs.push(_arrow(cx, y + h * 0.15 + 36, cx, py, '#94a3b8', 1.5));
    segs.push(_arrow(cx, py + 30, cx, y + h * 0.15 + 36, '#22c55e', 1.5, true));
  });
  segs.push(_text('Phase 1: Prepare (can you commit?) → Phase 2: Commit (yes/no) | Atomic', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// ADVANCED ALGORITHMS (6 shapes)
// =============================================================================

function shapeDynamicProgramming(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Dynamic Programming — DP Table', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const rows = 5; const cols = 6; const cw = 52; const ch = 28; const sx = cx - (cols * cw) / 2;
  const vals = [
    [0, 0, 0, 0, 0, 0],
    [0, 2, 2, 2, 2, 2],
    [0, 2, 3, 5, 5, 5],
    [0, 2, 3, 5, 7, 7],
    [0, 2, 3, 5, 7, 9],
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLast = r === rows - 1 && c === cols - 1;
      const g = isLast ? 'grad-green-light' : r === 0 || c === 0 ? 'grad-slate' : 'grad-blue-light';
      segs.push(_gradRect(sx + c * cw, y + h * 0.2 + r * ch, cw - 2, ch - 2, g));
      segs.push(_text(String(vals[r][c]), sx + c * cw + cw / 2, y + h * 0.2 + r * ch + 18, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '700' }));
    }
  }
  segs.push(_text('Optimal substructure + overlapping subproblems | Memoization table', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeLRUCachePremium(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('LRU Cache — Eviction Policy', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const items = [
    { k: 'A', v: 'val_1', recent: true },
    { k: 'B', v: 'val_2', recent: false },
    { k: 'C', v: 'val_3', recent: false },
    { k: 'D', v: 'val_4', recent: false },
  ];
  const bw = 80; const sx = cx - ((items.length * (bw + 8) - 8) / 2);
  items.forEach((item, i) => {
    const bx = sx + i * (bw + 8);
    segs.push(_depthBox(bx, y + h * 0.2, bw, 48, item.recent ? 'grad-green-light' : 'grad-blue-light'));
    segs.push(_text(item.k, bx + 12, y + h * 0.2 + 20, { fs: 14, color: '#ffffff', anchor: 'start', fw: '800' }));
    segs.push(_text(item.v, bx + bw - 12, y + h * 0.2 + 20, { fs: 10, color: 'rgba(255,255,255,0.8)', anchor: 'end' }));
    if (i < items.length - 1) segs.push(_arrow(bx + bw, y + h * 0.44, bx + bw + 8, y + h * 0.44, '#94a3b8', 1.5));
  });
  segs.push(_text('Most Recently Used ← → Least Recently Used (evicted when full)', cx, y + h * 0.68, { fs: 10, color: '#64748b', anchor: 'middle' }));
  segs.push(_gradRect(cx - 60, y + h * 0.74, 120, 26, 'grad-amber'));
  segs.push(_text('Evict: D (least recently used)', cx, y + h * 0.74 + 18, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_arrow(sx + 3 * (bw + 8) + bw / 2, y + h * 0.2 + 48, cx, y + h * 0.74, '#f59e0b', 1.5));
  segs.push(_text('HashMap + Doubly-Linked List | O(1) get / put', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

function shapeBigONotation(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Big O Complexity Cheat Sheet', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const data = [
    ['O(1)', 'Constant', 'Array access', 'grad-green-light'],
    ['O(log n)', 'Logarithmic', 'Binary search', 'grad-teal'],
    ['O(n)', 'Linear', 'Array iteration', 'grad-blue-light'],
    ['O(n log n)', 'Linearithmic', 'Merge sort', 'grad-amber'],
    ['O(n²)', 'Quadratic', 'Bubble sort', 'grad-orange'],
    ['O(2ⁿ)', 'Exponential', 'Fibonacci naive', 'grad-red'],
  ];
  data.forEach((d, i) => {
    const ry = y + h * 0.18 + i * 34;
    segs.push(_gradRect(x + w * 0.05, ry, 90, 28, d[3]));
    segs.push(_rect(x + w * 0.05 + 94, ry, w * 0.55, 28, '#ffffff', '#e2e8f0', 1, 6));
    segs.push(_text(d[1], x + w * 0.05 + 94 + 8, ry + 18, { fs: 11, color: '#1e293b', anchor: 'start', fw: '700' }));
    segs.push(_text(d[2], x + w * 0.55, ry + 18, { fs: 10, color: '#64748b', anchor: 'start' }));
    segs.push(_text(d[0], x + w * 0.05 + 45, ry + 18, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '800' }));
  });
  segs.push(_text('Choose the right algorithm — understand your input size constraints', cx, y + h * 0.94, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// TEACHING ICONS — visual icons referenced by templates (12 shapes)
// =============================================================================

function shapePerson(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_gradCircle(cx, y + h * 0.22, 16, 'grad-blue'));
  segs.push(_path(`M ${cx - 22} ${y + h * 0.72} Q ${cx} ${y + h * 0.45} ${cx + 22} ${y + h * 0.72}`, '#64748b', 'none', 2));
  segs.push(_path(`M ${cx - 16} ${y + h * 0.72} Q ${cx} ${y + h * 0.7} ${cx + 16} ${y + h * 0.72}`, '#94a3b8', 'none', 1.5));
  segs.push(_text('User', cx, y + h * 0.9, { fs: 11, color: '#64748b', anchor: 'middle', fw: '700' }));
  return segs;
}
function shapeFolder(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_path(`M ${x + w * 0.15} ${y + h * 0.35} L ${x + w * 0.35} ${y + h * 0.35} L ${x + w * 0.42} ${y + h * 0.22} L ${x + w * 0.75} ${y + h * 0.22} L ${x + w * 0.85} ${y + h * 0.35} L ${x + w * 0.85} ${y + h * 0.75} L ${x + w * 0.15} ${y + h * 0.75} Z`, '#f59e0b', '#fef3c7', 2));
  segs.push(_text('Folder', cx, y + h * 0.9, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}
function shapeBug(x, y, w, h) {
  const segs = []; const cx = x + w / 2; const cy = y + h * 0.45;
  segs.push(_gradCircle(cx - 12, cy - 8, 6, 'grad-red'));
  segs.push(_gradCircle(cx + 12, cy - 8, 6, 'grad-red'));
  segs.push(_path(`M ${cx - 18} ${cy + 5} Q ${cx} ${cy - 5} ${cx + 18} ${cy + 5}`, '#dc2626', 'none', 2.5));
  segs.push(_path(`M ${cx - 14} ${cy + 10} L ${cx - 24} ${cy + 18}`, '#dc2626', 'none', 2));
  segs.push(_path(`M ${cx + 14} ${cy + 10} L ${cx + 24} ${cy + 18}`, '#dc2626', 'none', 2));
  segs.push(_text('Bug', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle', fw: '700' }));
  return segs;
}
function shapeGearIcon(x, y, w, h) {
  const segs = []; const cx = x + w / 2; const cy = y + h * 0.45; const r = 18;
  segs.push(_gradCircle(cx, cy, r, 'grad-slate'));
  segs.push(_circle(cx, cy, 8, '#ffffff', 'none'));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; segs.push(_rect(cx + Math.cos(a) * (r + 3) - 3, cy + Math.sin(a) * (r + 3) - 3, 6, 6, '#64748b', '#475569', 1, 2)); }
  segs.push(_text('Settings', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle', fw: '700' }));
  return segs;
}
function shapeChatBubble(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_gradRect(x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.4, 'grad-blue-light', '#2563eb', 1.5, 16));
  segs.push(_path(`M ${x + w * 0.2} ${y + h * 0.6} L ${x + w * 0.3} ${y + h * 0.6} L ${x + w * 0.25} ${y + h * 0.78} Z`, '#2563eb', 'none', 1.5));
  segs.push(_text('Hello!', cx, y + h * 0.42, { fs: 14, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_text('Chat', cx, y + h * 0.9, { fs: 11, color: '#64748b', anchor: 'middle' }));
  return segs;
}
function shapeTrash(x, y, w, h) {
  const segs = []; const cx = x + w / 2; const cy = y + h * 0.4;
  segs.push(_rect(cx - 18, cy - 16, 36, 8, '#f87171', '#dc2626', 1.5, 2));
  segs.push(_rect(cx - 14, cy - 8, 28, 32, '#fef2f2', '#dc2626', 1.5, 4));
  segs.push(_line(cx - 6, cy + 2, cx - 6, cy + 20, '#dc2626', 1.5));
  segs.push(_line(cx, cy + 2, cx, cy + 20, '#dc2626', 1.5));
  segs.push(_line(cx + 6, cy + 2, cx + 6, cy + 20, '#dc2626', 1.5));
  segs.push(_text('Delete', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle', fw: '700' }));
  return segs;
}
function shapeDownload(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_rect(cx - 18, y + h * 0.15, 36, 28, '#dbeafe', '#2563eb', 2, 4));
  segs.push(_line(cx - 16, y + h * 0.15, cx - 16, y + h * 0.15, '#2563eb', 0));
  segs.push(_arrow(cx, y + h * 0.35, cx, y + h * 0.65, '#2563eb', 2.5));
  segs.push(_line(cx - 14, y + h * 0.65, cx + 14, y + h * 0.65, '#2563eb', 2.5));
  segs.push(_text('Download', cx, y + h * 0.9, { fs: 11, color: '#64748b', anchor: 'middle', fw: '700' }));
  return segs;
}
function shapeRefresh(x, y, w, h) {
  const segs = []; const cx = x + w / 2; const cy = y + h * 0.45; const r = 18;
  segs.push(_path(`M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r * 0.5} ${cy - r * 0.87}`, '#64748b', 'none', 2.5));
  segs.push(_polygon(cx - r * 0.5 - 8, cy - r * 0.87 - 5, cx - r * 0.5 + 6, cy - r * 0.87, cx - r * 0.5 - 8, cy - r * 0.87 + 5, '#64748b'));
  segs.push(_text('Refresh', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle', fw: '700' }));
  return segs;
}
function shapeTreeIcon(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('{...}', cxs + 2, y + h * 0.24, { fs: 22, color: '#16a34a', anchor: 'middle', fw: '800' }));
  segs.push(_line(cx, y + h * 0.3, cx, y + h * 0.42, '#16a34a', 2));
  segs.push(_line(cx, y + h * 0.36, cx - 16, y + h * 0.42, '#16a34a', 2));
  segs.push(_line(cx, y + h * 0.36, cx + 16, y + h * 0.42, '#16a34a', 2));
  segs.push(_gradCircle(cx, y + h * 0.18, 10, 'grad-green-light'));
  segs.push(_gradCircle(cx - 16, y + h * 0.46, 8, 'grad-green-light'));
  segs.push(_gradCircle(cx + 16, y + h * 0.46, 8, 'grad-green-light'));
  segs.push(_text('Tree', cx, y + h * 0.88, { fs: 11, color: '#64748b', anchor: 'middle', fw: '700' }));
  return segs;
}

// =============================================================================
// PROGRAMMING PARADIGMS (6 shapes)
// =============================================================================

function shapeOOPConcepts(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('OOP — 4 Pillars', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const pillars = [
    { t: 'Encapsulation', d: 'Bundle data + methods\nHide internal state', c: 'grad-blue-light' },
    { t: 'Inheritance', d: 'Parent → child\nReuse behavior', c: 'grad-green-light' },
    { t: 'Polymorphism', d: 'One interface\nmany implementations', c: 'grad-purple-light' },
    { t: 'Abstraction', d: 'Hide complexity\nShow essentials', c: 'grad-amber' },
  ];
  pillars.forEach((p, i) => {
    const px = x + w * (0.04 + i * 0.24);
    segs.push(_depthBox(px, y + h * 0.18, w * 0.21, h * 0.6, p.c));
    segs.push(_text(p.t, px + w * 0.105, y + h * 0.24, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
    const lines = p.d.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, px + w * 0.105, y + h * 0.38 + li * 18, { fs: 9, color: 'rgba(255,255,255,0.85)', anchor: 'middle' })));
  });
  segs.push(_text('Four pillars of object-oriented programming', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeFunctionalProgramming(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Functional Programming', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const concepts = [
    { t: 'Pure\nFunctions', d: 'Same input →\nsame output' },
    { t: 'Immutability', d: 'Data never\nchanged in place' },
    { t: 'Higher-Order\nFunctions', d: 'Functions as\narguments/return' },
    { t: 'Declarative', d: 'What, not\nhow' },
  ];
  concepts.forEach((c, i) => {
    const px = x + w * (0.04 + i * 0.24);
    segs.push(_gradRect(px, y + h * 0.2, w * 0.21, h * 0.45, 'grad-teal'));
    const lines = c.t.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, px + w * 0.105, y + h * 0.24 + li * 18, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '800' })));
    const dlines = c.d.split('\n');
    dlines.forEach((l, li) => segs.push(_text(l, px + w * 0.105, y + h * 0.44 + li * 16, { fs: 8, color: 'rgba(255,255,255,0.8)', anchor: 'middle' })));
  });
  segs.push(_text('map, filter, reduce — no side effects, composable functions', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeReactiveProgramming(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Reactive Programming', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_arrow(x + w * 0.1, y + h * 0.45, x + w * 0.3, y + h * 0.45, '#94a3b8', 2));
  segs.push(_gradCircle(x + w * 0.1, y + h * 0.45, 10, 'grad-blue-light'));
  segs.push(_text('Event', x + w * 0.1, y + h * 0.62, { fs: 10, color: '#64748b', anchor: 'middle' }));
  segs.push(_gradRect(x + w * 0.3, y + h * 0.3, w * 0.15, h * 0.3, 'grad-purple-light'));
  segs.push(_text('Observable', x + w * 0.375, y + h * 0.4, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_text('Stream', x + w * 0.375, y + h * 0.5, { fs: 8, color: 'rgba(255,255,255,0.8)', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.45, y + h * 0.45, x + w * 0.6, y + h * 0.45, '#94a3b8', 2));
  const ops = ['map', 'filter', 'debounce'];
  ops.forEach((o, i) => { segs.push(_gradRect(x + w * 0.6 + i * 60, y + h * 0.34, 50, 24, 'grad-amber')); segs.push(_text(o, x + w * 0.6 + i * 60 + 25, y + h * 0.34 + 16, { fs: 8, color: '#ffffff', anchor: 'middle', fw: '700' })); });
  segs.push(_arrow(x + w * 0.6 + 150, y + h * 0.45, x + w * 0.8, y + h * 0.45, '#94a3b8', 2));
  segs.push(_gradCircle(x + w * 0.8, y + h * 0.45, 10, 'grad-green-light'));
  segs.push(_text('Result', x + w * 0.8, y + h * 0.62, { fs: 10, color: '#64748b', anchor: 'middle' }));
  segs.push(_text('Data streams + functional operators | RxJS, Reactors', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// TESTING & QUALITY (6 shapes)
// =============================================================================

function shapeTestPyramid(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Test Pyramid', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const layers = [
    { l: 'E2E Tests', w: 0.25, c: 'grad-red', y: 0.42 },
    { l: 'Integration Tests', w: 0.45, c: 'grad-amber', y: 0.56 },
    { l: 'Unit Tests', w: 0.7, c: 'grad-green-light', y: 0.70 },
  ];
  layers.forEach(l => {
    const lx = cx - l.w * w / 2;
    segs.push(_gradRect(lx, y + h * l.y, l.w * w, h * 0.12, l.c));
    segs.push(_text(l.l, cx, y + h * l.y + h * 0.06 + 4, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
  });
  segs.push(_text('Fewer E2E, many unit tests | Fast, reliable, maintainable', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeTDDCycle(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('TDD — Test Driven Development', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const steps = [
    { l: 'Write\nTest', c: 'grad-red' },
    { l: 'Write\nCode', c: 'grad-green-light' },
    { l: 'Refactor', c: 'grad-blue-light' },
    { l: 'Pass', c: 'grad-amber' },
  ];
  const r = Math.min(w, h) * 0.15; const cy = y + h * 0.48;
  steps.forEach((s, i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const sx = cx + Math.cos(a) * r * 2.2; const sy = cy + Math.sin(a) * r * 2.2;
    segs.push(_gradCircle(sx, sy, 30, s.c));
    const lines = s.l.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, sx, sy - 5 + li * 16, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' })));
    if (i < steps.length - 1) segs.push(_arrow(cx + Math.cos(a) * r * 2.2 + Math.cos(a + 0.5) * 30, cy + Math.sin(a) * r * 2.2 + Math.sin(a + 0.5) * 30, cx + Math.cos((i + 1) / 4 * Math.PI * 2 - Math.PI / 2) * r * 2.2 - Math.cos((i + 1) / 4 * Math.PI * 2 - Math.PI / 2 + 0.5) * 30, cy + Math.sin((i + 1) / 4 * Math.PI * 2 - Math.PI / 2) * r * 2.2 - Math.sin((i + 1) / 4 * Math.PI * 2 - Math.PI / 2 + 0.5) * 30, '#94a3b8', 2));
  });
  segs.push(_text('Red → Green → Refactor | Tests drive the design', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeCodeReview(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Code Review Process', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const steps = ['Author\nWrites PR', 'Reviewer\nChecks', 'Feedback\nGiven', 'Changes\nMade', 'Approved\n& Merged'];
  const sw = 90; const sx = cx - ((steps.length * (sw + 8) - 8) / 2);
  steps.forEach((s, i) => {
    const bx = sx + i * (sw + 8);
    const g = i === steps.length - 1 ? 'grad-green-light' : 'grad-blue-light';
    segs.push(_gradRect(bx, y + h * 0.28, sw, 48, g));
    const lines = s.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, bx + sw / 2, y + h * 0.28 + 16 + li * 16, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' })));
    if (i < steps.length - 1) segs.push(_arrow(bx + sw, y + h * 0.52, bx + sw + 8, y + h * 0.52, '#94a3b8', 1.5));
  });
  segs.push(_text('Collaborative quality assurance | Best practices, knowledge sharing', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// DATABASE CONCEPTS (6 shapes)
// =============================================================================

function shapeACIDProperties(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('ACID — Database Transactions', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const props = [
    { t: 'A', l: 'Atomicity', d: 'All or nothing\nNo partial updates', c: 'grad-blue-light' },
    { t: 'C', l: 'Consistency', d: 'Valid state before\nand after', c: 'grad-green-light' },
    { t: 'I', l: 'Isolation', d: 'Concurrent txns\ndon\'t interfere', c: 'grad-purple-light' },
    { t: 'D', l: 'Durability', d: 'Committed data\nsurvives crashes', c: 'grad-amber' },
  ];
  props.forEach((p, i) => {
    const px = x + w * (0.04 + i * 0.24);
    segs.push(_depthBox(px, y + h * 0.18, w * 0.21, h * 0.6, p.c));
    segs.push(_text(p.t, px + w * 0.105, y + h * 0.24, { fs: 22, color: '#ffffff', anchor: 'middle', fw: '900' }));
    segs.push(_text(p.l, px + w * 0.105, y + h * 0.36, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '700' }));
    const lines = p.d.split('\n');
    lines.forEach((l, li) => segs.push(_text(l, px + w * 0.105, y + h * 0.48 + li * 18, { fs: 9, color: 'rgba(255,255,255,0.85)', anchor: 'middle' })));
  });
  segs.push(_text('Guarantees for reliable database transactions', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeSQLJoins(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('SQL JOIN Types', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const joins = [
    { t: 'INNER JOIN', l: 'A ∩ B', c: 'grad-blue-light' },
    { t: 'LEFT JOIN', l: 'A ∪ (A∩B)', c: 'grad-green-light' },
    { t: 'RIGHT JOIN', l: '(A∩B) ∪ B', c: 'grad-purple-light' },
    { t: 'FULL JOIN', l: 'A ∪ B', c: 'grad-amber' },
  ];
  joins.forEach((j, i) => {
    const px = x + w * (0.04 + i * 0.24);
    segs.push(_gradRect(px, y + h * 0.18, w * 0.21, h * 0.5, j.c));
    segs.push(_text(j.t, px + w * 0.105, y + h * 0.24, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '800' }));
    segs.push(_text(j.l, px + w * 0.105, y + h * 0.45, { fs: 14, color: '#ffffff', anchor: 'middle', fw: '800' }));
  });
  segs.push(_text('Combine rows from multiple tables based on related columns', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeBTreeIndex(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('B-Tree Indexing', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.32, y + h * 0.14, w * 0.36, 32, 'grad-amber'));
  segs.push(_text('[50, 100]', cx, y + h * 0.14 + 22, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '800' }));
  const children = [
    { v: '[10, 25]', x: cx - w * 0.28, c: 'grad-blue-light' },
    { v: '[60, 75]', x: cx, c: 'grad-green-light' },
    { v: '[120, 150]', x: cx + w * 0.28, c: 'grad-purple-light' },
  ];
  children.forEach((c, i) => {
    segs.push(_line(cx, y + h * 0.14 + 32, c.x, y + h * 0.3, '#94a3b8', 1.5));
    segs.push(_gradRect(c.x - 40, y + h * 0.3, 80, 28, c.c));
    segs.push(_text(c.v, c.x, y + h * 0.3 + 19, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
  });
  segs.push(_text('Balanced tree | O(log n) search, insert, delete | Database index structure', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// SECURITY CONCEPTS (6 shapes)
// =============================================================================

function shapeXSSAttack(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('XSS — Cross-Site Scripting', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.02, y + h * 0.18, w * 0.28, 34, 'grad-blue-light'));
  segs.push(_text('Browser', x + w * 0.16, y + h * 0.18 + 22, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_arrow(x + w * 0.3, y + h * 0.35, x + w * 0.45, y + h * 0.35, '#dc2626', 2));
  segs.push(_gradRect(x + w * 0.45, y + h * 0.18, w * 0.28, 34, 'grad-red'));
  segs.push(_text('Malicious Script', x + w * 0.59, y + h * 0.18 + 22, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_text('<script>fetch(url)?cookie=</script>', cx, y + h * 0.45, { fs: 10, color: '#dc2626', anchor: 'middle', fw: '800' }));
  segs.push(_rect(x + w * 0.2, y + h * 0.55, w * 0.6, h * 0.2, '#fff7ed', '#f97316', 2, 8));
  segs.push(_text('Sanitize input | Escape output | Content Security Policy | Never trust user data', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeSQLInjection(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('SQL Injection Attack', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.02, y + h * 0.2, w * 0.28, 36, 'grad-blue-light'));
  segs.push(_text('Login Form', x + w * 0.16, y + h * 0.2 + 24, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_text("Username: admin'--", x + w * 0.16, y + h * 0.42, { fs: 9, color: '#dc2626', anchor: 'middle' }));
  segs.push(_arrow(x + w * 0.3, y + h * 0.34, x + w * 0.42, y + h * 0.34, '#dc2626', 2));
  segs.push(_gradRect(x + w * 0.42, y + h * 0.18, w * 0.3, 36, 'grad-red'));
  segs.push(_text('Database', x + w * 0.57, y + h * 0.18 + 24, { fs: 11, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_text("SELECT * FROM users\nWHERE user = 'admin'--'", cx + w * 0.08, y + h * 0.52, { fs: 9, color: '#dc2626', anchor: 'middle' }));
  segs.push(_text("Use parameterized queries | NEVER concatenate user input into SQL", cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeHTTPSHandshake(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('TLS/SSL Handshake', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.02, y + h * 0.3, w * 0.25, 36, 'grad-blue-light'));
  segs.push(_text('Client', x + w * 0.145, y + h * 0.3 + 24, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.73, y + h * 0.3, w * 0.25, 36, 'grad-green-light'));
  segs.push(_text('Server', x + w * 0.855, y + h * 0.3 + 24, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
  const msgs = ['ClientHello', 'ServerHello + Cert', 'Key Exchange', 'Secure Connection'];
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#16a34a'];
  msgs.forEach((m, i) => {
    const my = y + h * 0.42 + i * 22;
    segs.push(_rect(x + w * 0.05, my, w * 0.22, 18, '#f8fafc', colors[i], 1, 6));
    segs.push(_text(m, x + w * 0.16, my + 13, { fs: 8, color: colors[i], anchor: 'middle', fw: '700' }));
    segs.push(_arrow(i % 2 === 0 ? x + w * 0.27 : x + w * 0.73, my + 9, i % 2 === 0 ? x + w * 0.73 : x + w * 0.27, my + 9, colors[i], 1.5));
  });
  segs.push(_text('Encrypted data transfer begins after successful handshake', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// NETWORKING (4 shapes)
// =============================================================================

function shapeTCPHandshake(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('TCP 3-Way Handshake', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.02, y + h * 0.35, w * 0.28, 36, 'grad-blue-light'));
  segs.push(_text('Client', x + w * 0.16, y + h * 0.35 + 24, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.7, y + h * 0.35, w * 0.28, 36, 'grad-green-light'));
  segs.push(_text('Server', x + w * 0.84, y + h * 0.35 + 24, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
  const msgs = [['SYN', 0, '#3b82f6'], ['SYN-ACK', 1, '#22c55e'], ['ACK', 0, '#f59e0b']];
  msgs.forEach(([m, dir, clr], i) => {
    const my = y + h * 0.5 + i * 26;
    segs.push(_text(m, dir === 0 ? x + w * 0.4 : x + w * 0.6, my, { fs: 10, color: clr, anchor: 'middle', fw: '800' }));
    segs.push(_arrow(dir === 0 ? x + w * 0.3 : x + w * 0.7, my + 2, dir === 0 ? x + w * 0.7 : x + w * 0.3, my + 2, clr, 2));
  });
  segs.push(_text('SYN → SYN-ACK → ACK | Reliable connection-oriented protocol', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeDNSResolution(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('DNS Resolution', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const hosts = ['Browser', 'DNS Cache', 'DNS Server', 'IP Address'];
  const sw = 100; const sx = cx - ((hosts.length * (sw + 8) - 8) / 2);
  hosts.forEach((h, i) => {
    const bx = sx + i * (sw + 8);
    segs.push(_gradRect(bx, y + h * 0.35, sw, 36, i === hosts.length - 1 ? 'grad-green-light' : 'grad-blue-light'));
    segs.push(_text(h, bx + sw / 2, y + h * 0.35 + 24, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' }));
    if (i < hosts.length - 1) segs.push(_arrow(bx + sw, y + h * 0.53, bx + sw + 8, y + h * 0.53, '#94a3b8', 1.5));
  });
  segs.push(_text('Domain Name System — converts domain names to IP addresses', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// MORE DATA STRUCTURES (6 shapes)
// =============================================================================

function shapeRingBuffer(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Ring Buffer (Circular Buffer)', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const n = 8; const r = 65; const cy = y + h * 0.48;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const bx = cx + Math.cos(a) * r; const by = cy + Math.sin(a) * r;
    segs.push(_gradRect(bx - 17, by - 14, 34, 28, i < 5 ? 'grad-blue-light' : 'grad-slate'));
    segs.push(_text(String(i), bx, by + 5, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' }));
  }
  segs.push(_arrow(cx + Math.cos(0) * (r + 34), cy + Math.sin(0) * (r + 34), cx + Math.cos(0) * (r + 20), cy + Math.sin(0) * (r + 20), '#22c55e', 2));
  segs.push(_text('Write', cx + Math.cos(0) * (r + 34), cy + Math.sin(0) * (r + 34) + 14, { fs: 8, color: '#22c55e', anchor: 'middle', fw: '700' }));
  segs.push(_arrow(cx + Math.cos(Math.PI) * (r + 34), cy + Math.sin(Math.PI) * (r + 34), cx + Math.cos(Math.PI) * (r + 20), cy + Math.sin(Math.PI) * (r + 20), '#f59e0b', 2));
  segs.push(_text('Read', cx + Math.cos(Math.PI) * (r + 34), cy + Math.sin(Math.PI) * (r + 34) + 14, { fs: 8, color: '#f59e0b', anchor: 'middle', fw: '700' }));
  segs.push(_text('FIFO buffer with fixed size | Overwrites oldest when full', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeDeque(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Deque — Double-Ended Queue', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const items = ['←', 'A', 'B', 'C', 'D', '→'];
  const bw = 48; const sx = cx - ((items.length * (bw + 4) - 4) / 2);
  items.forEach((it, i) => {
    const bx = sx + i * (bw + 4);
    if (it === '←') { segs.push(_gradRect(bx, y + h * 0.35, 36, 36, 'grad-green-light')); segs.push(_text(it, bx + 18, y + h * 0.35 + 24, { fs: 16, color: '#ffffff', anchor: 'middle', fw: '800' })); }
    else if (it === '→') { segs.push(_gradRect(bx, y + h * 0.35, 36, 36, 'grad-red')); segs.push(_text(it, bx + 18, y + h * 0.35 + 24, { fs: 16, color: '#ffffff', anchor: 'middle', fw: '800' })); }
    else { segs.push(_gradRect(bx, y + h * 0.35, bw, 36, 'grad-blue-light')); segs.push(_text(it, bx + bw / 2, y + h * 0.35 + 24, { fs: 14, color: '#ffffff', anchor: 'middle', fw: '700' })); }
  });
  segs.push(_text('pushFront / pushBack / popFront / popBack | O(1) operations', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeSegmentTree(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Segment Tree — Range Queries', cx, y + h * 0.06, { fs: 15, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const nodes = [
    { v: 'A[0..7]', x: cx, y: y + h * 0.16, c: 'grad-blue-light' },
    { v: 'A[0..3]', x: cx - w * 0.25, y: y + h * 0.32, c: 'grad-green-light' },
    { v: 'A[4..7]', x: cx + w * 0.25, y: y + h * 0.32, c: 'grad-purple-light' },
    { v: 'A[0..1]', x: cx - w * 0.38, y: y + h * 0.48, c: 'grad-amber' },
    { v: 'A[2..3]', x: cx - w * 0.12, y: y + h * 0.48, c: 'grad-amber' },
    { v: 'A[4..5]', x: cx + w * 0.12, y: y + h * 0.48, c: 'grad-teal' },
    { v: 'A[6..7]', x: cx + w * 0.38, y: y + h * 0.48, c: 'grad-teal' },
  ];
  const treeEdges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
  treeEdges.forEach(([a, b]) => segs.push(_line(nodes[a].x, nodes[a].y + 18, nodes[b].x, nodes[b].y - 12, '#94a3b8', 1.5)));
  nodes.forEach(n => { segs.push(_gradRect(n.x - 40, n.y - 12, 80, 24, n.c)); segs.push(_text(n.v, n.x, n.y + 5, { fs: 8, color: '#ffffff', anchor: 'middle', fw: '700' })); });
  segs.push(_text('Query sum/min/max over [L, R] in O(log n) | Update in O(log n)', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// MORE ALGORITHMS (6 shapes)
// =============================================================================

function shapeAStarPath(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('A* Pathfinding Algorithm', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const grid = []; const gs = Math.floor(w / 14); const gy = y + h * 0.14;
  for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) grid.push({ x: x + c * gs + 20, y: gy + r * gs, wall: (r === 2 && c > 1 && c < 8) || (r === 4 && c > 1 && c < 6) });
  grid.forEach(g => { segs.push(_rect(g.x, g.y, gs - 2, gs - 2, g.wall ? '#64748b' : '#ffffff', g.wall ? '#475569' : '#e2e8f0', 1, 2)); if (!g.wall) segs.push(_text('.', g.x + gs / 2 - 4, g.y + gs / 2 + 3, { fs: 8, color: '#cbd5e1', anchor: 'middle' })); });
  const path = [{ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 3, c: 5 }, { r: 3, c: 6 }, { r: 3, c: 7 }, { r: 4, c: 8 }, { r: 5, c: 9 }];
  path.forEach((p, i) => {
    const px = x + p.c * gs + 20 + gs / 2; const py = gy + p.r * gs + gs / 2;
    segs.push(_gradCircle(px, py, 5, i === 0 ? 'grad-green-light' : i === path.length - 1 ? 'grad-red' : 'grad-amber'));
    if (i > 0) { const prev = path[i - 1]; segs.push(_line(x + prev.c * gs + 20 + gs / 2, gy + prev.r * gs + gs / 2, px, py, '#22c55e', 2)); }
  });
  segs.push(_text('S', x + 20 + gs / 2, gy + gs / 2 + 3, { fs: 8, color: '#ffffff', anchor: 'middle', fw: '800' }));
  segs.push(_text('G', x + 9 * gs + 20 + gs / 2, gy + 5 * gs + gs / 2 + 3, { fs: 8, color: '#ffffff', anchor: 'middle', fw: '800' }));
  segs.push(_text('f(n) = g(n) + h(n) | Shortest path with heuristic', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeTopologicalSort(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Topological Sort — DAG', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const nodes = ['S', 'A', 'B', 'C', 'D', 'T'];
  const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5]];
  const pos = [{ x: cx - w * 0.35, y: y + h * 0.25 }, { x: cx - w * 0.35, y: y + h * 0.55 }, { x: cx, y: y + h * 0.25 }, { x: cx, y: y + h * 0.55 }, { x: cx + w * 0.35, y: y + h * 0.25 }, { x: cx + w * 0.35, y: y + h * 0.55 }];
  edges.forEach(([a, b]) => segs.push(_arrow(pos[a].x, pos[a].y + 12, pos[b].x, pos[b].y - 12, '#94a3b8', 1.5)));
  nodes.forEach((n, i) => { segs.push(_gradCircle(pos[i].x, pos[i].y, 18, 'grad-blue-light')); segs.push(_text(n, pos[i].x, pos[i].y + 5, { fs: 14, color: '#ffffff', anchor: 'middle', fw: '800' })); });
  segs.push(_text('Linear ordering of DAG vertices | Prerequisite scheduling', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// DESIGN PATTERNS (6 shapes)
// =============================================================================

function shapeSingletonPattern(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Singleton Pattern', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_depthBox(cx - 60, y + h * 0.2, 120, 100, 'grad-blue-light'));
  segs.push(_text('Singleton', cx, y + h * 0.28, { fs: 14, color: '#ffffff', anchor: 'middle', fw: '800' }));
  segs.push(_line(cx - 45, y + h * 0.34, cx + 45, y + h * 0.34, 'rgba(255,255,255,0.3)', 1));
  segs.push(_text('- instance', cx, y + h * 0.40, { fs: 10, color: 'rgba(255,255,255,0.8)', anchor: 'middle' }));
  segs.push(_text('+ getInstance()', cx, y + h * 0.50, { fs: 10, color: 'rgba(255,255,255,0.9)', anchor: 'middle', fw: '700' }));
  segs.push(_arrow(cx - 60, y + h * 0.5, cx - 100, y + h * 0.5, '#3b82f6', 1.5));
  segs.push(_text('Global access point', cx - 100, y + h * 0.45, { fs: 8, color: '#3b82f6', anchor: 'end' }));
  segs.push(_text('One instance per JVM | Used for logging, config, connection pools', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeObserverPattern(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Observer Pattern', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_depthBox(cx - 45, y + h * 0.2, 90, 50, 'grad-purple-light'));
  segs.push(_text('Subject', cx, y + h * 0.32, { fs: 13, color: '#ffffff', anchor: 'middle', fw: '800' }));
  const obs = ['Observer A', 'Observer B', 'Observer C'];
  obs.forEach((o, i) => {
    const ox = cx - w * 0.3 + i * w * 0.3;
    segs.push(_gradRect(ox - 40, y + h * 0.55, 80, 28, 'grad-blue-light'));
    segs.push(_text(o, ox, y + h * 0.55 + 19, { fs: 8, color: '#ffffff', anchor: 'middle', fw: '700' }));
    segs.push(_arrow(cx, y + h * 0.2 + 50, ox, y + h * 0.55, '#94a3b8', 1.5));
  });
  segs.push(_text('Publish-subscribe | One-to-many dependency notification', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeFactoryPattern(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Factory Pattern', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_depthBox(cx - 50, y + h * 0.2, 100, 50, 'grad-amber'));
  segs.push(_text('Factory', cx, y + h * 0.32, { fs: 13, color: '#ffffff', anchor: 'middle', fw: '800' }));
  const prods = ['Product A', 'Product B', 'Product C'];
  prods.forEach((p, i) => {
    const px = cx - w * 0.3 + i * w * 0.3;
    segs.push(_gradRect(px - 35, y + h * 0.58, 70, 26, 'grad-green-light'));
    segs.push(_text(p, px, y + h * 0.58 + 18, { fs: 8, color: '#ffffff', anchor: 'middle', fw: '700' }));
    segs.push(_arrow(cx, y + h * 0.2 + 50, px, y + h * 0.58, '#94a3b8', 1.5));
  });
  segs.push(_text('Encapsulates object creation | Loose coupling, single responsibility', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeStrategyPattern(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Strategy Pattern', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_depthBox(cx - 45, y + h * 0.18, 90, 40, 'grad-blue-light'));
  segs.push(_text('Context', cx, y + h * 0.18 + 26, { fs: 12, color: '#ffffff', anchor: 'middle', fw: '800' }));
  const strats = ['Strategy A', 'Strategy B', 'Strategy C'];
  strats.forEach((s, i) => {
    const sx = cx - w * 0.3 + i * w * 0.3;
    segs.push(_gradRect(sx - 40, y + h * 0.55, 80, 28, 'grad-purple-light'));
    segs.push(_text(s, sx, y + h * 0.55 + 19, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' }));
    segs.push(_arrow(cx, y + h * 0.18 + 40, sx, y + h * 0.55, '#94a3b8', 1.5, true));
  });
  segs.push(_text('Interchangeable algorithms | Composition over inheritance', cx, y + h * 0.88, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// MORE SYSTEM DESIGN (4 shapes)
// =============================================================================

function shapeBlueGreenDeploy(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Blue-Green Deployment', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  segs.push(_gradRect(x + w * 0.02, y + h * 0.18, w * 0.25, 50, 'grad-blue-light'));
  segs.push(_text('Load Balancer', x + w * 0.145, y + h * 0.2 + 26, { fs: 10, color: '#ffffff', anchor: 'middle', fw: '700' }));
  segs.push(_checkCircle(x + w * 0.12, y + h * 0.18 + 25, 8, '#22c55e'));
  segs.push(_arrow(x + w * 0.27, y + h * 0.3, x + w * 0.35, y + h * 0.3, '#22c55e', 3));
  segs.push(_depthBox(x + w * 0.35, y + h * 0.18, w * 0.25, h * 0.5, 'grad-blue'));
  segs.push(_text('Blue\n(Live)', x + w * 0.475, y + h * 0.35, { fs: 14, color: '#ffffff', anchor: 'middle', fw: '800' }));
  segs.push(_text('v2.0', x + w * 0.475, y + h * 0.5, { fs: 10, color: 'rgba(255,255,255,0.8)', anchor: 'middle' }));
  segs.push(_depthBox(x + w * 0.68, y + h * 0.18, w * 0.25, h * 0.5, 'grad-green-light'));
  segs.push(_text('Green\n(Staging)', x + w * 0.805, y + h * 0.35, { fs: 14, color: '#ffffff', anchor: 'middle', fw: '800' }));
  segs.push(_text('v2.1', x + w * 0.805, y + h * 0.5, { fs: 10, color: 'rgba(255,255,255,0.8)', anchor: 'middle' }));
  segs.push(_text('Route switch: Blue → Green | Zero-downtime deployment', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}
function shapeConsistentHash(x, y, w, h) {
  const segs = []; const cx = x + w / 2;
  segs.push(_text('Consistent Hashing', cx, y + h * 0.06, { fs: 16, color: '#1e293b', anchor: 'middle', fw: '800' }));
  const cy = y + h * 0.48;
  segs.push(_path(`M ${cx - 150} ${cy} A 150 120 0 1 1 ${cx + 150} ${cy} A 150 120 0 0 1 ${cx - 150} ${cy}`, '#cbd5e1', 'none', 2));
  const nodes = [
    { x: cx, y: cy - 90, l: 'N1', c: 'grad-blue-light' },
    { x: cx + 85, y: cy - 40, l: 'N2', c: 'grad-green-light' },
    { x: cx + 90, y: cy + 45, l: 'N3', c: 'grad-purple-light' },
    { x: cx + 10, y: cy + 85, l: 'N4', c: 'grad-amber' },
    { x: cx - 80, y: cy + 45, l: 'N5', c: 'grad-red' },
    { x: cx - 90, y: cy - 35, l: 'N6', c: 'grad-teal' },
  ];
  const keys = [
    { x: cx + 40, y: cy - 55, l: 'K1' },
    { x: cx - 30, y: cy - 70, l: 'K2' },
    { x: cx - 70, y: cy - 20, l: 'K3' },
    { x: cx - 50, y: cy + 50, l: 'K4' },
    { x: cx + 60, y: cy + 50, l: 'K5' },
  ];
  nodes.forEach(n => { segs.push(_gradCircle(n.x, n.y, 18, n.c)); segs.push(_text(n.l, n.x, n.y + 5, { fs: 9, color: '#ffffff', anchor: 'middle', fw: '700' })); });
  keys.forEach(k => { segs.push(_circle(k.x, k.y, 5, '#f59e0b', '#f59e0b', 2)); segs.push(_text(k.l, k.x + 12, k.y + 4, { fs: 8, color: '#f59e0b', anchor: 'start', fw: '700' })); });
  segs.push(_text('Hash ring | Minimal rehashing on node add/remove', cx, y + h * 0.92, { fs: 10, color: '#94a3b8', anchor: 'middle' }));
  return segs;
}

// =============================================================================
// REGISTRATION - called to wire all shapes into SHAPE_REGISTRY and SHAPE_ALIASES
// =============================================================================

export function registerProgrammingShapes(registry, aliases) {
  const shapes = {
    'array_linear': shapeArrayLinear, 'array_2d': shapeArray2D, 'linked_list_single': shapeLinkedListSingle,
    'linked_list_double': shapeLinkedListDouble, 'stack_diagram': shapeStackDiagram, 'queue_diagram': shapeQueueDiagram,
    'priority_queue': shapePriorityQueue, 'binary_tree': shapeBinaryTree, 'bst_diagram': shapeBSTDiagram,
    'avl_tree': shapeAVLTree, 'heap_min': shapeHeapMin, 'heap_max': shapeHeapMax,
    'trie_diagram': shapeTrieDiagram, 'graph_undirected': shapeGraphUndirected, 'graph_directed': shapeGraphDirected,
    'graph_weighted': shapeGraphWeighted, 'adjacency_matrix': shapeAdjacencyMatrix, 'bloom_filter': shapeBloomFilter,
    'lru_cache': shapeLruCache, 'disjoint_set': shapeDisjointSet, 'skip_list': shapeSkipList,
    'binary_search': shapeBinarySearch, 'linear_search': shapeLinearSearch, 'bubble_sort': shapeBubbleSort,
    'selection_sort': shapeSelectionSort, 'insertion_sort': shapeInsertionSort, 'merge_sort': shapeMergeSort,
    'quick_sort': shapeQuickSort, 'heap_sort': shapeHeapSort, 'bfs_graph': shapeBFSGraph,
    'dfs_graph': shapeDFSGraph, 'dijkstra': shapeDijkstra, 'recursion_tree': shapeRecursionTree,
    'dp_table': shapeDPTable, 'sliding_window': shapeSlidingWindow, 'two_pointer': shapeTwoPointer,
    'knapsack': shapeKnapsack, 'counting_sort': shapeCountingSort,
    'code_block': shapeCodeBlock, 'function_declaration': shapeFunctionDeclaration,
    'variable_declaration': shapeVariableDeclaration, 'if_else_diagram': shapeIfElseDiagram,
    'for_loop_diagram': shapeForLoopDiagram, 'while_loop': shapeWhileLoop,
    'try_catch': shapeTryCatch, 'class_diagram': shapeClassDiagram, 'arrow_function': shapeArrowFunction,
    'async_function': shapeAsyncFunction, 'promise_chain': shapePromiseChain, 'destructuring': shapeDestructuring,
    'spread_operator': shapeSpreadOperator, 'import_statement': shapeImportStatement,
    'switch_case': shapeSwitchCase, 'array_method_chain': shapeArrayMethodChain,
    'interface_diagram': shapeInterfaceDiagram,
    'client_server': shapeClientServer, 'rest_api': shapeRestApiDiagram, 'browser_diagram': shapeBrowserDiagram,
    'dom_tree': shapeDOMTree, 'url_components': shapeURLCrashCourse, 'jwt_diagram': shapeJWTDia,
    'oauth_flow': shapeOAuthFlow, 'middleware_chain': shapeMiddlewareChain, 'graphql_diagram': shapeGraphQL,
    'websocket': shapeWebSocket,     'http_request_diagram': shapeHttpRequestDiagram, 'http_response_diagram': shapeHttpResponseDiagram,
    'cookie_session': shapeCookieSession, 'ssr_diagram': shapeSSRDiagram, 'csr_diagram': shapeCSRDiagram,
    'load_balancer': shapeLoadBalancer, 'message_queue': shapeMessageQueue, 'pub_sub': shapePubSub,
    'api_gateway': shapeApiGateway, 'microservices': shapeMicroservices, 'monolithic': shapeMonolithic,
    'event_driven': shapeEventDriven, 'cap_theorem': shapeCAPTheorem, 'cdn_diagram': shapeCDN,
    'database_shard': shapeDatabaseShard, 'cqrs_pattern': shapeCQRSPattern,
    'circuit_breaker': shapeCircuitBreaker, 'rate_limiter': shapeRateLimiter, 'reverse_proxy': shapeReverseProxy,
    'git_branch': shapeGitBranch, 'git_merge': shapeGitMerge, 'docker_container': shapeDockerContainer,
    'ci_cd_pipeline': shapeCICDPipeline, 'docker_compose': shapeDockerCompose,
    'kubernetes_pod': shapeKubernetesPod, 'github_actions': shapeGitHubActions,
    'terraform': shapeTerraform, 'monitoring': shapeMonitoring, 'helm_chart': shapeHelmChart,
    'service_mesh': shapeServiceMesh,
    'bst_premium': shapePremiumBinaryTree, 'hashmap_premium': shapePremiumHashMap,
    'merge_sort_visual': shapePremiumMergeSort, 'graph_traversal': shapePremiumGraphTraversal,
    'neural_network': shapeNeuralNetwork, 'decision_tree_ml': shapeDecisionTree,
    'svm_diagram': shapeSVMMargin, 'kmeans_clustering': shapeKMeans,
    'transformer_arch': shapeTransformer,
    'event_sourcing': shapeEventSourcing, 'saga_pattern': shapeSagaPattern,
    'data_pipeline': shapeDataPipeline, 'two_phase_commit': shapeTwoPhaseCommit,
    'dp_table_visual': shapeDynamicProgramming, 'lru_cache_premium': shapeLRUCachePremium,
    'big_o_cheatsheet': shapeBigONotation,
  };

  const aliasMap = {
    'array': 'array_linear', '1d array': 'array_linear', 'vector': 'array_linear',
    'matrix': 'array_2d', '2d array': 'array_2d', 'grid': 'array_2d',
    'singly linked list': 'linked_list_single', 'sll': 'linked_list_single',
    'doubly linked list': 'linked_list_double', 'dll': 'linked_list_double',
    'stack': 'stack_diagram', 'lifo': 'stack_diagram',
    'queue': 'queue_diagram', 'fifo': 'queue_diagram',
    'deque': 'queue_diagram', 'priority': 'priority_queue', 'heap': 'heap_min',
    'binary tree': 'binary_tree', 'bst': 'bst_diagram', 'binary search tree': 'bst_diagram',
    'avl': 'avl_tree', 'balanced tree': 'avl_tree',
    'red black tree': 'bst_diagram',
    'b-tree': 'bst_diagram', 'btree': 'bst_diagram',
    'min heap': 'heap_min', 'max heap': 'heap_max',
    'trie': 'trie_diagram', 'prefix tree': 'trie_diagram',
    'graph': 'graph_undirected', 'undirected graph': 'graph_undirected',
    'digraph': 'graph_directed', 'dag': 'graph_directed',
    'weighted graph': 'graph_weighted',
    'sparse matrix': 'adjacency_matrix',
    'bloom': 'bloom_filter', 'lru': 'lru_cache', 'cache': 'lru_cache',
    'union find': 'disjoint_set', 'uf': 'disjoint_set', 'dsu': 'disjoint_set',
    'skip list': 'skip_list',
    'binary search': 'binary_search', 'bisect': 'binary_search',
    'linear search': 'linear_search', 'sequential search': 'linear_search',
    'bubble sort': 'bubble_sort', 'selection sort': 'selection_sort',
    'insertion sort': 'insertion_sort', 'merge sort': 'merge_sort',
    'quick sort': 'quick_sort', 'heap sort': 'heap_sort',
    'counting sort': 'counting_sort',
    'bfs': 'bfs_graph', 'breadth first': 'bfs_graph',
    'dfs': 'dfs_graph', 'depth first': 'dfs_graph',
    'dijkstra': 'dijkstra', 'shortest path': 'dijkstra',
    'recursion': 'recursion_tree', 'recursive': 'recursion_tree',
    'dp': 'dp_table', 'dynamic programming': 'dp_table', 'memoization': 'dp_table',
    'sliding window': 'sliding_window', 'two pointer': 'two_pointer', 'two pointers': 'two_pointer',
    'knapsack': 'knapsack', '0/1 knapsack': 'knapsack',
    'code': 'code_block', 'snippet': 'code_block', 'source code': 'code_block',
    'function': 'function_declaration', 'method': 'function_declaration',
    'variable': 'variable_declaration', 'let': 'variable_declaration', 'const': 'variable_declaration',
    'if else': 'if_else_diagram', 'conditional': 'if_else_diagram',
    'for loop': 'for_loop_diagram', 'for': 'for_loop_diagram',
    'while': 'while_loop', 'while loop': 'while_loop',
    'try catch': 'try_catch', 'error handling': 'try_catch', 'exception': 'try_catch',
    'class': 'class_diagram', 'oop': 'class_diagram', 'inheritance': 'class_diagram',
    'arrow function': 'arrow_function', 'lambda': 'arrow_function',
    'async': 'async_function', 'async/await': 'async_function', 'await': 'async_function',
    'promise': 'promise_chain', '.then()': 'promise_chain',
    'destructure': 'destructuring', 'destructuring': 'destructuring',
    'spread': 'spread_operator', '...': 'spread_operator',
    'import': 'import_statement', 'require': 'import_statement',
    'switch': 'switch_case', 'switch/case': 'switch_case',
    'filter map reduce': 'array_method_chain', 'chaining': 'array_method_chain',
    'interface': 'interface_diagram', 'implements': 'interface_diagram',
    'client server': 'client_server', 'request response': 'client_server',
    'rest': 'rest_api', 'restful': 'rest_api', 'crud': 'rest_api',
    'browser': 'browser_diagram', 'web browser': 'browser_diagram',
    'dom': 'dom_tree', 'dom tree': 'dom_tree',
    'url': 'url_components', 'uri': 'url_components',
    'jwt': 'jwt_diagram', 'token': 'jwt_diagram', 'json web token': 'jwt_diagram',
    'oauth': 'oauth_flow', 'authorization': 'oauth_flow',
    'middleware': 'middleware_chain', 'middleware chain': 'middleware_chain',
    'graphql': 'graphql_diagram', 'gql': 'graphql_diagram',
    'websocket': 'websocket', 'ws': 'websocket',
    'http request diagram': 'http_request_diagram',
    'http response diagram': 'http_response_diagram',
    'cookie': 'cookie_session', 'session': 'cookie_session',
    'ssr': 'ssr_diagram', 'server side rendering': 'ssr_diagram',
    'csr': 'csr_diagram', 'client side rendering': 'csr_diagram',
    'load balancer': 'load_balancer', 'lb': 'load_balancer',
    'message queue': 'message_queue', 'mq': 'message_queue',
    'pub/sub': 'pub_sub', 'publish subscribe': 'pub_sub',
    'api gateway': 'api_gateway', 'gateway': 'api_gateway',
    'microservices': 'microservices', 'micro service': 'microservices',
    'monolith': 'monolithic', 'monolithic': 'monolithic',
    'event driven': 'event_driven', 'event bus': 'event_driven',
    'cap': 'cap_theorem', 'cap theorem': 'cap_theorem',
    'cdn': 'cdn_diagram', 'content delivery': 'cdn_diagram',
    'shard': 'database_shard', 'sharding': 'database_shard', 'partition': 'database_shard',
    'cqrs': 'cqrs_pattern', 'command query': 'cqrs_pattern',
    'circuit breaker': 'circuit_breaker', 'breaker': 'circuit_breaker',
    'rate limit': 'rate_limiter', 'rate limiting': 'rate_limiter', 'throttle': 'rate_limiter',
    'reverse proxy': 'reverse_proxy', 'nginx': 'reverse_proxy', 'proxy': 'reverse_proxy',
    'git': 'git_branch', 'git branch': 'git_branch',
    'git merge': 'git_merge', 'merge': 'git_merge',
    'docker': 'docker_container', 'container': 'docker_container',
    'ci/cd': 'ci_cd_pipeline', 'cicd': 'ci_cd_pipeline', 'pipeline': 'ci_cd_pipeline',
    'docker compose': 'docker_compose', 'compose': 'docker_compose',
    'kubernetes pod': 'kubernetes_pod', 'k8s pod': 'kubernetes_pod', 'pod': 'kubernetes_pod',
    'github actions': 'github_actions', 'actions': 'github_actions', 'gha': 'github_actions',
    'terraform': 'terraform', 'iac': 'terraform', 'infrastructure as code': 'terraform',
    'monitoring': 'monitoring', 'observability': 'monitoring', 'metrics': 'monitoring',
    'helm': 'helm_chart', 'helm chart': 'helm_chart',
    'service mesh': 'service_mesh', 'istio': 'service_mesh', 'linkerd': 'service_mesh',
    'premium bst': 'bst_premium', 'bst visual': 'bst_premium',
    'hashmap': 'hashmap_premium', 'hashmap visual': 'hashmap_premium',
    'merge sort visual': 'merge_sort_visual', 'merge sort animation': 'merge_sort_visual',
    'graph traversal': 'graph_traversal', 'bfs dfs visual': 'graph_traversal',
    'nn': 'neural_network', 'neural net': 'neural_network', 'deep learning': 'neural_network',
    'decision tree': 'decision_tree_ml', 'ml tree': 'decision_tree_ml',
    'svm': 'svm_diagram', 'support vector': 'svm_diagram', 'svm margin': 'svm_diagram',
    'k means': 'kmeans_clustering', 'kmeans': 'kmeans_clustering', 'clustering': 'kmeans_clustering',
    'transformer': 'transformer_arch', 'attention': 'transformer_arch', 'gpt': 'transformer_arch',
    'event sourcing': 'event_sourcing', 'event store': 'event_sourcing',
    'saga': 'saga_pattern', 'saga pattern': 'saga_pattern', 'distributed transaction': 'saga_pattern',
    'etl': 'data_pipeline', 'data pipeline': 'data_pipeline', 'data processing': 'data_pipeline',
    '2pc': 'two_phase_commit', 'two phase commit': 'two_phase_commit',
    'dp visual': 'dp_table_visual', 'dp table visual': 'dp_table_visual',
    'lru visual': 'lru_cache_premium', 'lru cache visual': 'lru_cache_premium',
    'big o': 'big_o_cheatsheet', 'complexity': 'big_o_cheatsheet', 'big o notation': 'big_o_cheatsheet',
  };

  for (const [key, fn] of Object.entries(shapes)) {
    registry[key] = fn;
  }
  for (const [alias, target] of Object.entries(aliasMap)) {
    if (!aliases[alias]) aliases[alias] = target;
  }
}
