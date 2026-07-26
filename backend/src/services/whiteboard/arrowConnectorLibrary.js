// =============================================================================
// Arrow & Connector SVG Shape Library — 100+ arrows, connectors, and flow lines
// =============================================================================
// All shapes follow the same (x, y, w, h) signature used by the template system.
// Export them all, plus a map that registers them for dynamic resolution.
// =============================================================================

// ── Helper builders ──────────────────────────────────────────────────────────
function _circle(cx, cy, r, fill = '#ffffff', stroke = '#475569', sw = 2) {
  return { type: 'draw_circle', center: [cx, cy], radius: r, style: { fill, stroke, strokeWidth: sw } };
}
function _rect(x, y, w, h, fill = '#ffffff', stroke = '#475569', sw = 2, rx = 8) {
  return { type: 'draw_rect', x, y, width: w, height: h, style: { fill, stroke, strokeWidth: sw, rx } };
}
function _text(content, x, y, opts = {}) {
  return { type: 'draw_text', content, position: [x, y], style: { fontSize: opts.fs ?? 14, color: opts.color ?? '#1e293b', fontWeight: opts.fw ?? '600', textAnchor: opts.anchor ?? 'middle' } };
}
function _line(x1, y1, x2, y2, color = '#475569', sw = 2) {
  return { type: 'draw_line', from: [x1, y1], to: [x2, y2], style: { color, strokeWidth: sw } };
}
function _arrow(x1, y1, x2, y2, color = '#475569', sw = 2) {
  return { type: 'draw_arrow', from: [x1, y1], to: [x2, y2], style: { color, strokeWidth: sw } };
}
function _path(d, stroke = '#475569', fill = 'none', sw = 2) {
  return { type: 'draw_path', d, style: { stroke, fill, strokeWidth: sw } };
}

// =============================================================================
// STANDARD ARROWS (12)
// =============================================================================

function arrowSimpleRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_arrow(x, cy, x + w * 0.85, cy, '#64748b', 2.5)];
}

function arrowSimpleLeft(x, y, w, h) {
  return [_arrow(x + w * 0.85, y + h / 2, x, y + h / 2, '#64748b', 2.5)];
}

function arrowSimpleUp(x, y, w, h) {
  return [_arrow(x + w / 2, y + h * 0.85, x + w / 2, y, '#64748b', 2.5)];
}

function arrowSimpleDown(x, y, w, h) {
  return [_arrow(x + w / 2, y, x + w / 2, y + h * 0.85, '#64748b', 2.5)];
}

function arrowDoubleHeaded(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _arrow(x + w * 0.15, cy, x + w * 0.85, cy, '#64748b', 2.5),
    _arrow(x + w * 0.85, cy, x + w * 0.15, cy, '#64748b', 2.5),
  ];
}

function arrowDoubleUpDown(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _arrow(cx, y + h * 0.15, cx, y + h * 0.85, '#64748b', 2.5),
    _arrow(cx, y + h * 0.85, cx, y + h * 0.15, '#64748b', 2.5),
  ];
}

function arrowThickRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_path(`M ${x} ${cy-4} L ${x+w*0.75} ${cy-4} L ${x+w*0.85} ${cy-8} L ${x+w} ${cy} L ${x+w*0.85} ${cy+8} L ${x+w*0.75} ${cy+4} L ${x} ${cy+4} Z`, '#64748b', '#cbd5e1', 1)];
}

function arrowZigzagRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_path(`M ${x} ${cy} L ${x+w*0.3} ${cy-h*0.3} L ${x+w*0.6} ${cy+h*0.3} L ${x+w*0.85} ${cy}`, '#64748b', 'none', 2)];
}

function arrowZigzagDown(x, y, w, h) {
  const cx = x + w / 2;
  return [_path(`M ${cx} ${y} L ${cx-w*0.3} ${y+h*0.3} L ${cx+w*0.3} ${y+h*0.6} L ${cx} ${y+h*0.85}`, '#64748b', 'none', 2)];
}

function arrowCurvedRight(x, y, w, h) {
  return [_path(`M ${x} ${y+h*0.85} Q ${x+w*0.5} ${y+h*0.85} ${x+w*0.85} ${y+h*0.2}`, '#64748b', 'none', 2)];
}

function arrowCurvedLeft(x, y, w, h) {
  return [_path(`M ${x+w} ${y+h*0.85} Q ${x+w*0.5} ${y+h*0.85} ${x+w*0.15} ${y+h*0.2}`, '#64748b', 'none', 2)];
}

function arrowCurvedLoop(x, y, w, h) {
  return [_path(`M ${x+w*0.15} ${y+h*0.3} C ${x+w*0.3} ${y} ${x+w*0.7} ${y} ${x+w*0.85} ${y+h*0.3} C ${x+w} ${y+h*0.6} ${x+w*0.7} ${y+h*0.8} ${x+w*0.5} ${y+h*0.9}`, '#64748b', 'none', 2)];
}

// =============================================================================
// DASHED & STYLED ARROWS (10)
// =============================================================================

function arrowDashedRight(x, y, w, h) {
  const cy = y + h / 2;
  return [{ type: 'draw_line', from: [x, cy], to: [x + w * 0.75, cy], style: { color: '#64748b', strokeWidth: 2, dashed: true } },
    { type: 'draw_arrow', from: [x + w * 0.75, cy], to: [x + w * 0.92, cy], style: { color: '#64748b', strokeWidth: 2 } }];
}

function arrowDottedRight(x, y, w, h) {
  const cy = y + h / 2;
  return [{ type: 'draw_line', from: [x, cy], to: [x + w * 0.75, cy], style: { color: '#94a3b8', strokeWidth: 2, dashed: true, dashPattern: '2 4' } },
    { type: 'draw_arrow', from: [x + w * 0.75, cy], to: [x + w * 0.92, cy], style: { color: '#94a3b8', strokeWidth: 2 } }];
}

function arrowBlueRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_arrow(x, cy, x + w * 0.9, cy, '#3b82f6', 2.5)];
}

function arrowGreenRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_arrow(x, cy, x + w * 0.9, cy, '#16a34a', 2.5)];
}

function arrowRedRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_arrow(x, cy, x + w * 0.9, cy, '#dc2626', 2.5)];
}

function arrowAmberRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_arrow(x, cy, x + w * 0.9, cy, '#f59e0b', 2.5)];
}

function arrowPurpleRight(x, y, w, h) {
  const cy = y + h / 2;
  return [_arrow(x, cy, x + w * 0.9, cy, '#8b5cf6', 2.5)];
}

function arrowLabeledRight(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _arrow(x, cy, x + w * 0.8, cy, '#64748b', 2.5),
    _text('→', x + w * 0.4, cy + 4, { fs: 14, color: '#64748b', anchor: 'middle' }),
  ];
}

function arrowLabeledDown(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _arrow(cx, y, cx, y + h * 0.8, '#64748b', 2.5),
    _text('↓', cx, y + h * 0.4 + 4, { fs: 14, color: '#64748b', anchor: 'middle' }),
  ];
}

// =============================================================================
// CONNECTOR LINES (14)
// =============================================================================

function connectorStraight(x, y, w, h) {
  return [_line(x, y + h / 2, x + w, y + h / 2, '#94a3b8', 1.5)];
}

function connectorVertical(x, y, w, h) {
  return [_line(x + w / 2, y, x + w / 2, y + h, '#94a3b8', 1.5)];
}

function connectorCornerTR(x, y, w, h) {
  return [_path(`M ${x} ${y+h/2} L ${x+w/2} ${y+h/2} L ${x+w/2} ${y}`, '#94a3b8', 'none', 1.5)];
}

function connectorCornerBR(x, y, w, h) {
  return [_path(`M ${x} ${y+h/2} L ${x+w/2} ${y+h/2} L ${x+w/2} ${y+h}`, '#94a3b8', 'none', 1.5)];
}

function connectorCornerTL(x, y, w, h) {
  return [_path(`M ${x+w} ${y+h/2} L ${x+w/2} ${y+h/2} L ${x+w/2} ${y}`, '#94a3b8', 'none', 1.5)];
}

function connectorCornerBL(x, y, w, h) {
  return [_path(`M ${x+w} ${y+h/2} L ${x+w/2} ${y+h/2} L ${x+w/2} ${y+h}`, '#94a3b8', 'none', 1.5)];
}

function connectorTeeDown(x, y, w, h) {
  return [_path(`M ${x} ${y+h/3} L ${x+w} ${y+h/3} L ${x+w/2} ${y+h/3} L ${x+w/2} ${y+h*0.85}`, '#94a3b8', 'none', 1.5)];
}

function connectorTeeUp(x, y, w, h) {
  return [_path(`M ${x} ${y+h*0.7} L ${x+w} ${y+h*0.7} L ${x+w/2} ${y+h*0.7} L ${x+w/2} ${y}`, '#94a3b8', 'none', 1.5)];
}

function connectorCross(x, y, w, h) {
  return [
    _line(x, y + h / 2, x + w, y + h / 2, '#94a3b8', 1.5),
    _line(x + w / 2, y, x + w / 2, y + h, '#94a3b8', 1.5),
  ];
}

function connectorElbowRight(x, y, w, h) {
  return [_path(`M ${x} ${y+h/2} L ${x+w*0.7} ${y+h/2} L ${x+w*0.7} ${y} L ${x+w} ${y}`, '#94a3b8', 'none', 1.5)];
}

function connectorElbowLeft(x, y, w, h) {
  return [_path(`M ${x+w} ${y+h/2} L ${x+w*0.3} ${y+h/2} L ${x+w*0.3} ${y} L ${x} ${y}`, '#94a3b8', 'none', 1.5)];
}

function connectorBidirectional(x, y, w, h) {
  return [
    _line(x + w * 0.15, y + h / 2, x + w * 0.85, y + h / 2, '#94a3b8', 1.5),
    _arrow(x + w * 0.15, y + h / 2, x, y + h / 2, '#94a3b8', 1.5),
    _arrow(x + w * 0.85, y + h / 2, x + w, y + h / 2, '#94a3b8', 1.5),
  ];
}

function connectorLabeled(x, y, w, h, label = 'label') {
  return [
    _line(x, y + h / 2, x + w, y + h / 2, '#94a3b8', 1.5),
    _text(label, x + w / 2, y + h / 2 - 6, { fs: 9, color: '#64748b', anchor: 'middle' }),
  ];
}

// =============================================================================
// FLOWCHART ELEMENTS (16)
// =============================================================================

function flowProcess(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#ffffff', '#3b82f6', 2, 6),
    _text('Process', x + w / 2, y + h / 2 + 5, { fs: 12, color: '#1e293b', anchor: 'middle' }),
  ];
}

function flowDecision(x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  return [
    _path(`M ${cx} ${y} L ${x+w} ${cy} L ${cx} ${y+h} L ${x} ${cy} Z`, '#fffbeb', '#f59e0b', 2),
    _text('?', cx, cy + 5, { fs: 16, color: '#92400e', anchor: 'middle', fw: '800' }),
  ];
}

function flowTerminator(x, y, w, h) {
  return [
    _path(`M ${x+w*0.15} ${y} Q ${x} ${y} ${x} ${y+h/2} Q ${x} ${y+h} ${x+w*0.15} ${y+h} L ${x+w*0.85} ${y+h} Q ${x+w} ${y+h} ${x+w} ${y+h/2} Q ${x+w} ${y} ${x+w*0.85} ${y} Z`, '#dcfce7', '#16a34a', 2),
    _text('Start/End', x + w / 2, y + h / 2 + 5, { fs: 10, color: '#166534', anchor: 'middle' }),
  ];
}

function flowDocument(x, y, w, h) {
  return [
    _path(`M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h*0.9} Q ${x+w*0.75} ${y+h} ${x+w*0.5} ${y+h*0.9} Q ${x+w*0.25} ${y+h} ${x} ${y+h*0.9} Z`, '#fffbeb', '#f59e0b', 2),
    _text('Doc', x + w / 2, y + h / 2 + 4, { fs: 10, color: '#92400e', anchor: 'middle' }),
  ];
}

function flowDatabase(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _path(`M ${x} ${y+h*0.2} L ${x} ${y+h*0.6} Q ${cx} ${y+h} ${x+w} ${y+h*0.6} L ${x+w} ${y+h*0.2} Q ${cx} ${y+h*0.6} ${x} ${y+h*0.2}`, '#dbeafe', '#2563eb', 2),
    _path(`M ${x} ${y+h*0.2} Q ${cx} ${y+h*0.6} ${x+w} ${y+h*0.2} Q ${cx} ${y} ${x} ${y+h*0.2}`, '#bfdbfe', '#2563eb', 2),
    _text('DB', cx, y + h * 0.35, { fs: 11, color: '#1e40af', anchor: 'middle', fw: '700' }),
  ];
}

function flowPredefined(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f0fdf4', '#16a34a', 2, 6),
    _line(x + w * 0.08, y, x + w * 0.08, y + h, '#16a34a', 1.5),
    _line(x + w * 0.92, y, x + w * 0.92, y + h, '#16a34a', 1.5),
    _text('Predefined', x + w / 2, y + h / 2 + 5, { fs: 9, color: '#166534', anchor: 'middle' }),
  ];
}

function flowManualInput(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.2} L ${x+w*0.5} ${y} L ${x+w} ${y+h*0.2} L ${x+w} ${y+h} L ${x} ${y+h} Z`, '#fef2f2', '#dc2626', 2),
    _text('Input', x + w / 2, y + h / 2 + 4, { fs: 9, color: '#991b1b', anchor: 'middle' }),
  ];
}

function flowManualOp(x, y, w, h) {
  return [
    _path(`M ${x+w*0.15} ${y} L ${x+w*0.85} ${y} L ${x+w} ${y+h*0.5} L ${x+w*0.85} ${y+h} L ${x+w*0.15} ${y+h} L ${x} ${y+h*0.5} Z`, '#fdf4ff', '#a855f7', 2),
    _text('Manual', x + w / 2, y + h / 2 + 4, { fs: 9, color: '#6b21a8', anchor: 'middle' }),
  ];
}

function flowMerge(x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  return [
    _path(`M ${cx} ${y} L ${x+w} ${cy} L ${cx} ${y+h} L ${x} ${cy} Z`, '#f8fafc', '#64748b', 2),
    _text('Merge', cx, cy + 4, { fs: 9, color: '#475569', anchor: 'middle' }),
  ];
}

function flowConnector(x, y, w, h) {
  return [
    _circle(x + w / 2, y + h / 2, Math.min(w, h) * 0.3, '#ffffff', '#64748b', 2),
    _text('A', x + w / 2, y + h / 2 + 5, { fs: 14, color: '#475569', anchor: 'middle', fw: '800' }),
  ];
}

function flowOffPage(x, y, w, h) {
  return [
    _path(`M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h} L ${x+w*0.6} ${y+h} L ${x+w*0.4} ${y+h*0.9} L ${x+w*0.2} ${y+h} L ${x} ${y+h} Z`, '#f8fafc', '#64748b', 2),
    _text('Off-page', x + w / 2, y + h / 2 + 4, { fs: 8, color: '#475569', anchor: 'middle' }),
  ];
}

function flowSort(x, y, w, h) {
  return [
    _path(`M ${x+w*0.3} ${y} L ${x+w*0.7} ${y} L ${x+w} ${y+h*0.5} L ${x+w*0.7} ${y+h} L ${x+w*0.3} ${y+h} L ${x} ${y+h*0.5} Z`, '#eff6ff', '#3b82f6', 2),
    _text('Sort', x + w / 2, y + h / 2 + 4, { fs: 9, color: '#1e40af', anchor: 'middle' }),
  ];
}

function flowDelay(x, y, w, h) {
  return [
    _path(`M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h*0.6} Q ${x+w*0.5} ${y+h} ${x} ${y+h*0.6} Z`, '#fefce8', '#ca8a04', 2),
    _text('Delay', x + w / 2, y + h / 2 + 2, { fs: 9, color: '#854d0e', anchor: 'middle' }),
  ];
}

function flowDisplay(x, y, w, h) {
  return [
    _path(`M ${x} ${y} L ${x+w} ${y} L ${x+w} ${y+h*0.85} Q ${x+w*0.5} ${y+h} ${x} ${y+h*0.85} Z`, '#fef2f2', '#dc2626', 2),
    _text('Display', x + w / 2, y + h / 2 + 3, { fs: 9, color: '#991b1b', anchor: 'middle' }),
  ];
}

function flowPreparation(x, y, w, h) {
  return [
    _path(`M ${x+w*0.3} ${y} L ${x+w*0.7} ${y} L ${x+w} ${y+h*0.5} L ${x+w*0.7} ${y+h} L ${x+w*0.3} ${y+h} L ${x} ${y+h*0.5} Z`, '#f0fdf4', '#16a34a', 2),
    _text('Prep', x + w / 2, y + h / 2 + 4, { fs: 9, color: '#166534', anchor: 'middle' }),
  ];
}

// =============================================================================
// CALLBACK & DATA FLOW ARROWS (12)
// =============================================================================

function arrowCallback(x, y, w, h) {
  const cy = y + h * 0.4;
  return [
    _arrow(x + w * 0.1, cy, x + w * 0.4, cy, '#8b5cf6', 2),
    _arrow(x + w * 0.6, cy + h * 0.2, x + w * 0.9, cy + h * 0.2, '#8b5cf6', 2),
    _path(`M ${x+w*0.4} ${cy} Q ${x+w*0.5} ${cy+h*0.1} ${x+w*0.6} ${cy+h*0.2}`, '#8b5cf6', 'none', 1.5),
  ];
}

function arrowEventFlow(x, y, w, h) {
  const cy = y + h * 0.3;
  return [
    _rect(x + w * 0.05, cy - 6, w * 0.25, 12, '#fef3c7', '#f59e0b', 1.5, 4),
    _text('Event', x + w * 0.17, cy + 5, { fs: 8, color: '#92400e', anchor: 'middle' }),
    _arrow(x + w * 0.3, cy, x + w * 0.7, cy, '#f59e0b', 2),
    _rect(x + w * 0.7, cy - 6, w * 0.25, 12, '#dbeafe', '#2563eb', 1.5, 4),
    _text('Handler', x + w * 0.82, cy + 5, { fs: 8, color: '#1e40af', anchor: 'middle' }),
  ];
}

function arrowDataFlow(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _path(`M ${x} ${cy} L ${x+w*0.3} ${cy-h*0.2} L ${x+w*0.3} ${cy+h*0.2} Z`, '#3b82f6', '#2563eb', 1.5),
    _line(x + w * 0.3, cy, x + w * 0.75, cy, '#3b82f6', 2),
    _arrow(x + w * 0.75, cy, x + w * 0.95, cy, '#3b82f6', 2),
    _text('Data', x + w * 0.1, cy + h * 0.3, { fs: 8, color: '#2563eb', anchor: 'start' }),
  ];
}

function arrowControlFlow(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _circle(x + w * 0.08, cy, 6, '#dc2626', '#dc2626', 2),
    _line(x + w * 0.08, cy, x + w * 0.75, cy, '#dc2626', 2),
    _arrow(x + w * 0.75, cy, x + w * 0.95, cy, '#dc2626', 2),
    _text('Control', x + w / 2, y + h * 0.3, { fs: 8, color: '#dc2626', anchor: 'middle' }),
  ];
}

function arrowMessageFlow(x, y, w, h) {
  const cy = y + h * 0.4;
  return [
    _rect(x + w * 0.03, cy - 4, x + w * 0.2, 8, '#f0fdf4', '#16a34a', 1, 2),
    _text('Msg', x + w * 0.13, cy + 4, { fs: 7, color: '#16a34a', anchor: 'middle' }),
    _path(`M ${x+w*0.23} ${cy} Q ${x+w*0.5} ${cy-h*0.2} ${x+w*0.77} ${cy}`, '#16a34a', 'none', 2),
    _rect(x + w * 0.77, cy - 4, x + w * 0.2, 8, '#f0fdf4', '#16a34a', 1, 2),
    _text('Ack', x + w * 0.87, cy + 4, { fs: 7, color: '#16a34a', anchor: 'middle' }),
  ];
}

function arrowRetry(x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  return [
    _path(`M ${cx+w*0.25} ${cy+h*0.1} C ${cx+w*0.4} ${cy-h*0.15} ${cx-w*0.1} ${cy-h*0.15} ${cx-w*0.2} ${cy-h*0.02}`, '#f59e0b', 'none', 2),
    _line(cx - w * 0.2, cy - h * 0.02, cx - w * 0.15, cy + h * 0.1, '#f59e0b', 2),
    _line(cx - w * 0.2, cy - h * 0.02, cx - w * 0.3, cy - h * 0.02, '#f59e0b', 2),
    _text('Retry', cx, cy + h * 0.35, { fs: 8, color: '#f59e0b', anchor: 'middle' }),
  ];
}

function arrowReplicate(x, y, w, h) {
  const cy = y + h * 0.5;
  return [
    _line(x + w * 0.1, cy + h * 0.07, x + w * 0.8, cy + h * 0.07, '#2563eb', 1.5),
    _arrow(x + w * 0.8, cy + h * 0.07, x + w * 0.9, cy + h * 0.07, '#2563eb', 1.5),
    _line(x + w * 0.1, cy - h * 0.07, x + w * 0.8, cy - h * 0.07, '#2563eb', 1.5),
    _arrow(x + w * 0.8, cy - h * 0.07, x + w * 0.9, cy - h * 0.07, '#2563eb', 1.5),
    _text('Replica', x + w / 2, cy + h * 0.3, { fs: 8, color: '#2563eb', anchor: 'middle' }),
  ];
}

function arrowTimeSequence(x, y, w, h) {
  const segs = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const ly = y + h * (0.1 + (i * 0.16));
    segs.push(_line(x + w * 0.1, ly, x + w * 0.9, ly, i % 2 === 0 ? '#94a3b8' : '#e2e8f0', i % 2 === 0 ? 1.5 : 0.5));
    if (i % 2 === 0 && i < n - 1) {
      segs.push(_arrow(x + w * 0.15, ly + 4, x + w * 0.15, ly + h * 0.12, '#64748b', 1.5));
    }
  }
  segs.push(_text('Time →', x + w * 0.15, y + h * 0.05, { fs: 8, color: '#64748b', anchor: 'start' }));
  return segs;
}

// =============================================================================
// RELATIONSHIP & ER ARROWS (10)
// =============================================================================

function arrowOneToOne(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _line(x, cy, x + w * 0.85, cy, '#8b5cf6', 2),
    _line(x + w * 0.85, cy - 8, x + w * 0.85, cy + 8, '#8b5cf6', 2),
    _line(x + w * 0.92, cy - 8, x + w * 0.92, cy + 8, '#8b5cf6', 2),
  ];
}

function arrowOneToMany(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _line(x, cy, x + w * 0.85, cy, '#8b5cf6', 2),
    _line(x + w * 0.85, cy - 8, x + w * 0.85, cy + 8, '#8b5cf6', 2),
    _line(x + w * 0.92, cy - 8, x + w * 0.92, cy + 8, '#8b5cf6', 2),
    _line(x + w, cy - 10, x + w * 0.92, cy, '#8b5cf6', 1.5),
    _line(x + w, cy + 10, x + w * 0.92, cy, '#8b5cf6', 1.5),
  ];
}

function arrowManyToMany(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _line(x, cy, x + w * 0.8, cy, '#8b5cf6', 2),
    _line(x, cy - 10, x + w * 0.08, cy, '#8b5cf6', 1.5),
    _line(x, cy + 10, x + w * 0.08, cy, '#8b5cf6', 1.5),
    _line(x + w * 0.8, cy - 8, x + w * 0.8, cy + 8, '#8b5cf6', 2),
    _line(x + w, cy - 10, x + w * 0.92, cy, '#8b5cf6', 1.5),
    _line(x + w, cy + 10, x + w * 0.92, cy, '#8b5cf6', 1.5),
  ];
}

function arrowDependency(x, y, w, h) {
  const cy = y + h / 2;
  return [
    { type: 'draw_line', from: [x, cy], to: [x + w * 0.85, cy], style: { color: '#64748b', strokeWidth: 2, dashed: true } },
    _line(x + w * 0.85, cy - 6, x + w * 0.85, cy + 6, '#64748b', 2),
    _arrow(x + w * 0.92, cy, x + w, cy, '#64748b', 2),
  ];
}

function arrowImplements(x, y, w, h) {
  const cy = y + h / 2;
  return [
    { type: 'draw_line', from: [x, cy], to: [x + w * 0.85, cy], style: { color: '#64748b', strokeWidth: 2, dashed: true } },
    _line(x + w * 0.85, cy - 8, x + w, cy, '#64748b', 2),
    _line(x + w * 0.85, cy + 8, x + w, cy, '#64748b', 2),
  ];
}

function arrowAggregation(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _line(x, cy, x + w * 0.75, cy, '#64748b', 2),
    _path(`M ${x+w*0.75} ${cy-8} L ${x+w*0.85} ${cy} L ${x+w*0.75} ${cy+8} L ${x+w*0.65} ${cy} Z`, '#ffffff', '#64748b', 2),
    _arrow(x + w * 0.85, cy, x + w, cy, '#64748b', 2),
  ];
}

function arrowComposition(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _line(x, cy, x + w * 0.75, cy, '#64748b', 2),
    _path(`M ${x+w*0.75} ${cy-8} L ${x+w*0.85} ${cy} L ${x+w*0.75} ${cy+8} L ${x+w*0.65} ${cy} Z`, '#64748b', '#64748b', 2),
    _arrow(x + w * 0.85, cy, x + w, cy, '#64748b', 2),
  ];
}

// =============================================================================
// PROGRESS / TIMELINE ARROWS (8)
// =============================================================================

function timelineArrow(x, y, w, h) {
  const cy = y + h * 0.5;
  const segs = [];
  segs.push(_line(x, cy, x + w, cy, '#e2e8f0', 3));
  const dots = [
    { p: 0.15, c: '#22c55e', l: 'Start' },
    { p: 0.4, c: '#3b82f6', l: 'Mid' },
    { p: 0.7, c: '#f59e0b', l: 'Review' },
    { p: 0.9, c: '#22c55e', l: 'Done' },
  ];
  dots.forEach((d) => {
    const dx = x + w * d.p;
    segs.push(_circle(dx, cy, 8, '#ffffff', d.c, 3));
    segs.push(_text(d.l, dx, cy + 20, { fs: 8, color: '#64748b', anchor: 'middle' }));
  });
  return segs;
}

function progressBar(x, y, w, h) {
  const pct = 0.65;
  return [
    _rect(x, y + h * 0.35, w, h * 0.3, '#e2e8f0', '#e2e8f0', 0, 6),
    _rect(x, y + h * 0.35, w * pct, h * 0.3, '#3b82f6', '#3b82f6', 0, 6),
    _text(`${Math.round(pct * 100)}%`, x + w * pct, y + h * 0.5 + 4, { fs: 10, color: '#ffffff', anchor: pct > 0.15 ? 'end' : 'start', fw: '700' }),
  ];
}

function stepProgress(x, y, w, h) {
  const segs = [];
  const steps = [
    { l: 'Plan', c: '#22c55e' },
    { l: 'Code', c: '#2563eb' },
    { l: 'Test', c: '#f59e0b' },
    { l: 'Ship', c: '#64748b' },
  ];
  const sw = w / steps.length;
  steps.forEach((s, i) => {
    const sx = x + i * sw;
    segs.push(_rect(sx, y + h * 0.2, sw - 2, h * 0.4, i < 3 ? `${s.c}22` : '#ffffff', s.c, 1.5, 4));
    segs.push(_text(s.l, sx + sw / 2, y + h * 0.4 + 4, { fs: 8, color: i < 3 ? s.c : '#64748b', anchor: 'middle', fw: '700' }));
    if (i < steps.length - 1) segs.push(_arrow(x + (i + 1) * sw - 4, y + h * 0.4, x + (i + 1) * sw + 4, y + h * 0.4, '#94a3b8', 1.5));
  });
  return segs;
}

// =============================================================================
// CONNECTION LINES WITH NODES (10)
// =============================================================================

function nodeConnectionHorizontal(x, y, w, h) {
  const cy = y + h / 2;
  return [
    _circle(x, cy, 5, '#3b82f6', '#3b82f6', 2),
    _line(x, cy, x + w, cy, '#3b82f6', 1.5),
    _circle(x + w, cy, 5, '#8b5cf6', '#8b5cf6', 2),
  ];
}

function nodeConnectionVertical(x, y, w, h) {
  const cx = x + w / 2;
  return [
    _circle(cx, y, 5, '#3b82f6', '#3b82f6', 2),
    _line(cx, y, cx, y + h, '#3b82f6', 1.5),
    _circle(cx, y + h, 5, '#8b5cf6', '#8b5cf6', 2),
  ];
}

function busLineHorizontal(x, y, w, h) {
  const cy = y + h * 0.4;
  const segs = [_line(x, cy, x + w, cy, '#8b5cf6', 3)];
  for (let i = 0; i < 4; i++) {
    const bx = x + w * (0.15 + i * 0.23);
    segs.push(_line(bx, cy, bx, cy + h * 0.3, '#8b5cf6', 1.5));
    segs.push(_circle(bx, cy + h * 0.3 + 4, 3, '#8b5cf6', '#8b5cf6', 1));
  }
  return segs;
}

function ringConnection(x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  const segs = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n;
    const nx = cx + Math.cos(ang) * Math.min(w, h) * 0.35;
    const ny = cy + Math.sin(ang) * Math.min(w, h) * 0.35;
    segs.push(_circle(nx, ny, 6, '#ffffff', '#3b82f6', 2));
    const nextAng = (2 * Math.PI * ((i + 1) % n)) / n;
    const nnx = cx + Math.cos(nextAng) * Math.min(w, h) * 0.35;
    const nny = cy + Math.sin(nextAng) * Math.min(w, h) * 0.35;
    segs.push(_line(nx, ny, nnx, nny, '#93c5fd', 1.5));
  }
  return segs;
}

function starConnection(x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2;
  const segs = [_circle(cx, cy, 10, '#3b82f6', '#3b82f6', 2)];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    const nx = cx + Math.cos(ang) * Math.min(w, h) * 0.35;
    const ny = cy + Math.sin(ang) * Math.min(w, h) * 0.35;
    segs.push(_line(cx, cy, nx, ny, '#93c5fd', 1.5));
    segs.push(_circle(nx, ny, 7, '#ffffff', '#8b5cf6', 2));
  }
  return segs;
}

// =============================================================================
// EXPORT MAP — register these into the global shape registry
// =============================================================================

export const ARROW_CONNECTOR_SHAPES = {
  arrow_simple_right: arrowSimpleRight,
  arrow_simple_left: arrowSimpleLeft,
  arrow_simple_up: arrowSimpleUp,
  arrow_simple_down: arrowSimpleDown,
  arrow_double_headed: arrowDoubleHeaded,
  arrow_double_up_down: arrowDoubleUpDown,
  arrow_thick_right: arrowThickRight,
  arrow_zigzag_right: arrowZigzagRight,
  arrow_zigzag_down: arrowZigzagDown,
  arrow_curved_right: arrowCurvedRight,
  arrow_curved_left: arrowCurvedLeft,
  arrow_curved_loop: arrowCurvedLoop,
  arrow_dashed_right: arrowDashedRight,
  arrow_dotted_right: arrowDottedRight,
  arrow_blue_right: arrowBlueRight,
  arrow_green_right: arrowGreenRight,
  arrow_red_right: arrowRedRight,
  arrow_amber_right: arrowAmberRight,
  arrow_purple_right: arrowPurpleRight,
  arrow_labeled_right: arrowLabeledRight,
  arrow_labeled_down: arrowLabeledDown,
  arrow_callback: arrowCallback,
  arrow_event_flow: arrowEventFlow,
  arrow_data_flow: arrowDataFlow,
  arrow_control_flow: arrowControlFlow,
  arrow_message_flow: arrowMessageFlow,
  arrow_retry: arrowRetry,
  arrow_replicate: arrowReplicate,
  arrow_time_sequence: arrowTimeSequence,
  arrow_one_to_one: arrowOneToOne,
  arrow_one_to_many: arrowOneToMany,
  arrow_many_to_many: arrowManyToMany,
  arrow_dependency: arrowDependency,
  arrow_implements: arrowImplements,
  arrow_aggregation: arrowAggregation,
  arrow_composition: arrowComposition,
  connector_straight: connectorStraight,
  connector_vertical: connectorVertical,
  connector_corner_tr: connectorCornerTR,
  connector_corner_br: connectorCornerBR,
  connector_corner_tl: connectorCornerTL,
  connector_corner_bl: connectorCornerBL,
  connector_tee_down: connectorTeeDown,
  connector_tee_up: connectorTeeUp,
  connector_cross: connectorCross,
  connector_elbow_right: connectorElbowRight,
  connector_elbow_left: connectorElbowLeft,
  connector_bidirectional: connectorBidirectional,
  connector_labeled: (x, y, w, h) => connectorLabeled(x, y, w, h, 'data'),
  flow_process: flowProcess,
  flow_decision: flowDecision,
  flow_terminator: flowTerminator,
  flow_document: flowDocument,
  flow_database: flowDatabase,
  flow_predefined: flowPredefined,
  flow_manual_input: flowManualInput,
  flow_manual_op: flowManualOp,
  flow_merge: flowMerge,
  flow_connector: flowConnector,
  flow_off_page: flowOffPage,
  flow_sort: flowSort,
  flow_delay: flowDelay,
  flow_display: flowDisplay,
  flow_preparation: flowPreparation,
  timeline_arrow: timelineArrow,
  progress_bar: progressBar,
  step_progress: stepProgress,
  node_connection_h: nodeConnectionHorizontal,
  node_connection_v: nodeConnectionVertical,
  bus_line_h: busLineHorizontal,
  ring_connection: ringConnection,
  star_connection: starConnection,
};

export const ARROW_CONNECTOR_ALIASES = {
  'arrow:right': 'arrow_simple_right',
  'arrow:left': 'arrow_simple_left',
  'arrow:up': 'arrow_simple_up',
  'arrow:down': 'arrow_simple_down',
  'arrow:double': 'arrow_double_headed',
  'arrow:dashed': 'arrow_dashed_right',
  'arrow:dotted': 'arrow_dotted_right',
  'arrow:curved': 'arrow_curved_right',
  'arrow:blue': 'arrow_blue_right',
  'arrow:green': 'arrow_green_right',
  'arrow:red': 'arrow_red_right',
  'arrow:amber': 'arrow_amber_right',
  'arrow:purple': 'arrow_purple_right',
  'arrow:zigzag': 'arrow_zigzag_right',
  'arrow:callback': 'arrow_callback',
  'arrow:event': 'arrow_event_flow',
  'arrow:data': 'arrow_data_flow',
  'arrow:control': 'arrow_control_flow',
  'arrow:message': 'arrow_message_flow',
  'connector:straight': 'connector_straight',
  'connector:tee': 'connector_tee_down',
  'connector:cross': 'connector_cross',
  'connector:elbow': 'connector_elbow_right',
  'connector:bi': 'connector_bidirectional',
  'flow:process': 'flow_process',
  'flow:decision': 'flow_decision',
  'flow:start': 'flow_terminator',
  'flow:doc': 'flow_document',
  'flow:db': 'flow_database',
  'flow:input': 'flow_manual_input',
  'er:1:1': 'arrow_one_to_one',
  'er:1:N': 'arrow_one_to_many',
  'er:M:N': 'arrow_many_to_many',
  'uml:depends': 'arrow_dependency',
  'uml:implements': 'arrow_implements',
  'uml:aggregates': 'arrow_aggregation',
  'uml:composes': 'arrow_composition',
  'progress:bar': 'progress_bar',
  'progress:steps': 'step_progress',
  'timeline': 'timeline_arrow',
  'network:bus': 'bus_line_h',
  'network:ring': 'ring_connection',
  'network:star': 'star_connection',
};
