// =============================================================================
// EXPANDED SHAPE LIBRARY — 200+ additional creative SVG shapes for whiteboard
// =============================================================================
// Each shape receives (x, y, w, h) and returns an array of fragments.
// Organized by new categories to complement creativeShapeLibrary + thematicShapeLibrary
// =============================================================================

function _circle(cx, cy, r, fill, stroke, sw) {
  return { type: 'draw_circle', center: [cx, cy], radius: r, style: { fill, stroke, strokeWidth: sw ?? 2 } };
}
function _rect(x, y, w, h, fill, stroke, sw, rx) {
  return { type: 'draw_rect', x, y, width: w, height: h, style: { fill: fill ?? '#fff', stroke: stroke ?? '#475569', strokeWidth: sw ?? 2, rx: rx ?? 8 } };
}
function _text(content, x, y, opts) {
  return { type: 'draw_text', content, position: [x, y], style: { fontSize: opts?.fs ?? 14, color: opts?.color ?? '#1e293b', fontWeight: opts?.fw ?? '600', textAnchor: opts?.anchor ?? 'middle' } };
}
function _line(x1, y1, x2, y2, color, sw) {
  return { type: 'draw_line', from: [x1, y1], to: [x2, y2], style: { color: color ?? '#475569', strokeWidth: sw ?? 2 } };
}
function _arrow(x1, y1, x2, y2, color, sw) {
  return { type: 'draw_arrow', from: [x1, y1], to: [x2, y2], style: { color: color ?? '#475569', strokeWidth: sw ?? 2 } };
}
function _path(d, stroke, fill, sw) {
  return { type: 'draw_path', d, style: { stroke: stroke ?? '#475569', fill: fill ?? 'none', strokeWidth: sw ?? 2 } };
}
function _ellipse(cx, cy, rx, ry, fill, stroke, sw) {
  return { type: 'draw_path', d: `M ${cx-rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx+rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx-rx} ${cy}`, style: { fill, stroke, strokeWidth: sw ?? 2 } };
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 1: ANIMALS (35 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeCat(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy + h*0.08, w*0.18, '#fef3c7', '#d97706', 2),
    _path(`M ${cx-w*0.12} ${cy-h*0.08} L ${cx-w*0.08} ${cy-h*0.25} L ${cx-w*0.04} ${cy-h*0.08}`, '#d97706', 'none', 2),
    _path(`M ${cx+w*0.12} ${cy-h*0.08} L ${cx+w*0.08} ${cy-h*0.25} L ${cx+w*0.04} ${cy-h*0.08}`, '#d97706', 'none', 2),
    _circle(cx - w*0.06, cy, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.06, cy, 3, '#1e293b', '#1e293b', 1),
    _path(`M ${cx-w*0.02} ${cy+h*0.04} Q ${cx} ${cy+h*0.08} ${cx+w*0.02} ${cy+h*0.04}`, '#1e293b', 'none', 1.5),
    _path(`M ${cx-w*0.12} ${cy+h*0.2} Q ${cx} ${cy+h*0.3} ${cx+w*0.12} ${cy+h*0.2}`, '#fbbf24', 'none', 1.5),
    _line(cx - w*0.05, cy + h*0.28, cx - w*0.08, cy + h*0.38, '#d97706', 1.5),
    _line(cx + w*0.05, cy + h*0.28, cx + w*0.08, cy + h*0.38, '#d97706', 1.5),
  ];
}

function shapeDog(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.2, h*0.2, '#d1d5db', '#9ca3af', 2),
    _path(`M ${cx-w*0.12} ${cy-h*0.05} Q ${cx-w*0.2} ${cy-h*0.25} ${cx-w*0.08} ${cy-h*0.12}`, '#9ca3af', 'none', 2),
    _path(`M ${cx+w*0.12} ${cy-h*0.05} Q ${cx+w*0.2} ${cy-h*0.25} ${cx+w*0.08} ${cy-h*0.12}`, '#9ca3af', 'none', 2),
    _circle(cx - w*0.06, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.06, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.02, cy + h*0.08, 4, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx-w*0.1} ${cy+h*0.25} L ${cx} ${cy+h*0.15} L ${cx+w*0.1} ${cy+h*0.25}`, '#9ca3af', 'none', 1.5),
    _line(cx - w*0.04, cy + h*0.32, cx - w*0.06, cy + h*0.45, '#9ca3af', 1.5),
    _line(cx + w*0.04, cy + h*0.32, cx + w*0.06, cy + h*0.45, '#9ca3af', 1.5),
  ];
}

function shapeHorse(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.05, w*0.22, h*0.18, '#a16207', '#854d0e', 2),
    _path(`M ${cx-w*0.08} ${cy-h*0.05} Q ${cx-w*0.15} ${cy-h*0.35} ${cx-w*0.12} ${cy-h*0.2}`, '#854d0e', 'none', 2),
    _path(`M ${cx+w*0.08} ${cy-h*0.05} Q ${cx+w*0.15} ${cy-h*0.35} ${cx+w*0.12} ${cy-h*0.2}`, '#854d0e', 'none', 2),
    _circle(cx - w*0.05, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.05, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _rect(cx - w*0.03, cy + h*0.15, w*0.06, h*0.35, '#a16207', '#854d0e', 1.5, 3),
    _rect(cx - w*0.12, cy + h*0.35, w*0.08, h*0.12, '#a16207', '#854d0e', 1.5, 3),
    _rect(cx + w*0.04, cy + h*0.35, w*0.08, h*0.12, '#a16207', '#854d0e', 1.5, 3),
  ];
}

function shapeElephant(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx - w*0.05, cy + h*0.05, w*0.28, h*0.22, '#9ca3af', '#6b7280', 2),
    _circle(cx - w*0.06, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _path(`M ${cx+w*0.15} ${cy-h*0.1} Q ${cx+w*0.25} ${cy-h*0.2} ${cx+w*0.22} ${cy-h*0.05}`, '#6b7280', 'none', 2),
    _path(`M ${cx+w*0.1} ${cy+h*0.15} Q ${cx+w*0.35} ${cy+h*0.4} ${cx+w*0.15} ${cy+h*0.35}`, '#6b7280', 'none', 2.5),
    _rect(cx - w*0.18, cy + h*0.2, w*0.08, h*0.3, '#9ca3af', '#6b7280', 1.5, 3),
    _rect(cx - w*0.08, cy + h*0.2, w*0.08, h*0.3, '#9ca3af', '#6b7280', 1.5, 3),
  ];
}

function shapeLion(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy + h*0.08, w*0.2, '#fbbf24', '#d97706', 2.5),
    _path(`M ${cx-w*0.2} ${cy-h*0.05} Q ${cx-w*0.3} ${cy-h*0.3} ${cx-w*0.18} ${cy-h*0.15}`, '#d97706', 'none', 2),
    _path(`M ${cx+w*0.2} ${cy-h*0.05} Q ${cx+w*0.3} ${cy-h*0.3} ${cx+w*0.18} ${cy-h*0.15}`, '#d97706', 'none', 2),
    _circle(cx - w*0.06, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.06, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _path(`M ${cx-w*0.05} ${cy+h*0.08} Q ${cx} ${cy+h*0.14} ${cx+w*0.05} ${cy+h*0.08}`, '#1e293b', 'none', 2),
    // Mane
    _path(`M ${cx-w*0.2} ${cy+h*0.05} Q ${cx-w*0.3} ${cy+h*0.1} ${cx-w*0.22} ${cy+h*0.18}`, '#854d0e', 'none', 1.5),
    _path(`M ${cx+w*0.2} ${cy+h*0.05} Q ${cx+w*0.3} ${cy+h*0.1} ${cx+w*0.22} ${cy+h*0.18}`, '#854d0e', 'none', 1.5),
  ];
}

function shapeTiger(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.08, w*0.2, h*0.2, '#fbbf24', '#d97706', 2),
    _path(`M ${cx-w*0.1} ${cy-h*0.02} L ${cx-w*0.1} ${cy+h*0.02}`, '#1e293b', 'none', 1.5),
    _path(`M ${cx} ${cy-h*0.05} L ${cx} ${cy+h*0.02}`, '#1e293b', 'none', 1.5),
    _path(`M ${cx+w*0.1} ${cy-h*0.02} L ${cx+w*0.1} ${cy+h*0.02}`, '#1e293b', 'none', 1.5),
    _circle(cx - w*0.06, cy, 3, '#22c55e', '#16a34a', 1),
    _circle(cx + w*0.06, cy, 3, '#22c55e', '#16a34a', 1),
    _path(`M ${cx-w*0.14} ${cy-h*0.08} Q ${cx-w*0.22} ${cy-h*0.25} ${cx-w*0.12} ${cy-h*0.12}`, '#d97706', 'none', 2),
    _path(`M ${cx+w*0.14} ${cy-h*0.08} Q ${cx+w*0.22} ${cy-h*0.25} ${cx+w*0.12} ${cy-h*0.12}`, '#d97706', 'none', 2),
  ];
}

function shapeBear(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy + h*0.1, w*0.22, '#a16207', '#854d0e', 2),
    _circle(cx - w*0.12, cy - h*0.06, w*0.1, '#a16207', '#854d0e', 2),
    _circle(cx + w*0.12, cy - h*0.06, w*0.1, '#a16207', '#854d0e', 2),
    _circle(cx - w*0.06, cy + h*0.03, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.06, cy + h*0.03, 3, '#1e293b', '#1e293b', 1),
    _circle(cx, cy + h*0.08, 4, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx-w*0.12} ${cy+h*0.28} Q ${cx} ${cy+h*0.38} ${cx+w*0.12} ${cy+h*0.28}`, '#854d0e', 'none', 2),
  ];
}

function shapeWolf(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.08, w*0.18, h*0.18, '#9ca3af', '#6b7280', 2),
    _path(`M ${cx-w*0.1} ${cy-h*0.05} L ${cx-w*0.15} ${cy-h*0.25} L ${cx-w*0.07} ${cy-h*0.08}`, '#9ca3af', 'none', 2),
    _path(`M ${cx+w*0.1} ${cy-h*0.05} L ${cx+w*0.15} ${cy-h*0.25} L ${cx+w*0.07} ${cy-h*0.08}`, '#9ca3af', 'none', 2),
    _circle(cx - w*0.05, cy + h*0.02, 3, '#fbbf24', '#f59e0b', 1),
    _circle(cx + w*0.05, cy + h*0.02, 3, '#fbbf24', '#f59e0b', 1),
    _path(`M ${cx-w*0.08} ${cy+h*0.15} Q ${cx} ${cy+h*0.25} ${cx+w*0.08} ${cy+h*0.15}`, '#6b7280', 'none', 1.5),
  ];
}

function shapeFox(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.1} ${cy+h*0.05} Q ${cx-w*0.18} ${cy-h*0.15} ${cx-w*0.12} ${cy-h*0.02}`, '#f97316', 'none', 2),
    _path(`M ${cx+w*0.1} ${cy+h*0.05} Q ${cx+w*0.18} ${cy-h*0.15} ${cx+w*0.12} ${cy-h*0.02}`, '#f97316', 'none', 2),
    _ellipse(cx, cy + h*0.08, w*0.16, h*0.16, '#f97316', '#ea580c', 2),
    _circle(cx - w*0.05, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.05, cy + h*0.02, 3, '#1e293b', '#1e293b', 1),
    _circle(cx, cy + h*0.06, 3, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx-w*0.08} ${cy+h*0.2} Q ${cx} ${cy+h*0.28} ${cx+w*0.08} ${cy+h*0.2}`, '#ea580c', 'none', 1.5),
  ];
}

function shapeRabbit(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.18, h*0.2, '#f5f5f4', '#a8a29e', 2),
    _path(`M ${cx-w*0.06} ${cy-h*0.05} Q ${cx-w*0.1} ${cy-h*0.35} ${cx-w*0.05} ${cy-h*0.2}`, '#a8a29e', 'none', 2),
    _path(`M ${cx+w*0.06} ${cy-h*0.05} Q ${cx+w*0.1} ${cy-h*0.35} ${cx+w*0.05} ${cy-h*0.2}`, '#a8a29e', 'none', 2),
    _circle(cx - w*0.04, cy + h*0.03, 2, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.04, cy + h*0.03, 2, '#1e293b', '#1e293b', 0.5),
    _circle(cx, cy + h*0.06, 3, '#fca5a5', '#ef4444', 0.5),
  ];
}

function shapeTurtle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.05, w*0.3, h*0.2, '#22c55e', '#16a34a', 2),
    _path(`M ${cx-w*0.25} ${cy+h*0.02} L ${cx-w*0.35} ${cy+h*0.15} L ${cx-w*0.22} ${cy+h*0.08}`, '#16a34a', 'none', 2),
    _path(`M ${cx+w*0.25} ${cy+h*0.02} L ${cx+w*0.35} ${cy+h*0.15} L ${cx+w*0.22} ${cy+h*0.08}`, '#16a34a', 'none', 2),
    _circle(cx, cy + h*0.08, w*0.18, '#4ade80', '#22c55e', 1.5),
    _circle(cx - w*0.04, cy - h*0.08, 3, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.04, cy - h*0.08, 3, '#1e293b', '#1e293b', 0.5),
    _line(cx - w*0.08, cy + h*0.22, cx - w*0.12, cy + h*0.32, '#16a34a', 1.5),
    _line(cx + w*0.08, cy + h*0.22, cx + w*0.12, cy + h*0.32, '#16a34a', 1.5),
  ];
}

function shapeFrog(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.08, w*0.2, h*0.25, '#22c55e', '#16a34a', 2),
    _circle(cx - w*0.12, cy - h*0.1, w*0.08, '#22c55e', '#16a34a', 2),
    _circle(cx + w*0.12, cy - h*0.1, w*0.08, '#22c55e', '#16a34a', 2),
    _circle(cx - w*0.06, cy, 4, '#ffffff', '#1e293b', 1),
    _circle(cx + w*0.06, cy, 4, '#ffffff', '#1e293b', 1),
    _circle(cx - w*0.06, cy, 2, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.06, cy, 2, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx-w*0.04} ${cy+h*0.05} Q ${cx} ${cy+h*0.1} ${cx+w*0.04} ${cy+h*0.05}`, '#1e293b', 'none', 1.5),
  ];
}

function shapeSnake(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.3} ${cy+h*0.1} Q ${cx-w*0.15} ${cy-h*0.25} ${cx} ${cy+h*0.05} Q ${cx+w*0.15} ${cy-h*0.2} ${cx+w*0.3} ${cy+h*0.1}`, '#22c55e', '#16a34a', 2),
    _circle(cx - w*0.28, cy + h*0.1, 4, '#1e293b', '#1e293b', 1),
    _circle(cx - w*0.3, cy + h*0.08, 2, '#fbbf24', '#f59e0b', 0.5),
    _line(cx - w*0.12, cy + h*0.1, cx - w*0.08, cy + h*0.2, '#22c55e', 1.5),
    _line(cx + w*0.12, cy + h*0.1, cx + w*0.08, cy + h*0.2, '#22c55e', 1.5),
  ];
}

function shapeEagle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${cy+h*0.15} Q ${cx-w*0.08} ${cy} ${cx-w*0.12} ${cy-h*0.05}`, '#1e293b', '#1e293b', 2),
    _circle(cx + w*0.02, cy + h*0.1, w*0.1, '#fef3c7', '#d97706', 2),
    _circle(cx, cy + h*0.06, 2.5, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx+w*0.12} ${cy-h*0.05} L ${cx+w*0.35} ${cy-h*0.3} L ${cx+w*0.25} ${cy-h*0.12}`, '#1e293b', 'none', 2.5),
    _path(`M ${cx-w*0.12} ${cy-h*0.05} L ${cx-w*0.35} ${cy-h*0.3} L ${cx-w*0.25} ${cy-h*0.12}`, '#1e293b', 'none', 2.5),
    _path(`M ${cx+w*0.1} ${cy+h*0.2} L ${cx+w*0.3} ${cy+h*0.45}`, '#1e293b', 'none', 2.5),
    _path(`M ${cx-w*0.1} ${cy+h*0.2} L ${cx-w*0.3} ${cy+h*0.45}`, '#1e293b', 'none', 2.5),
  ];
}

function shapeOwl(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.2, h*0.25, '#92400e', '#78350f', 2),
    _circle(cx - w*0.08, cy - h*0.02, w*0.08, '#fef3c7', '#f59e0b', 2),
    _circle(cx + w*0.08, cy - h*0.02, w*0.08, '#fef3c7', '#f59e0b', 2),
    _circle(cx - w*0.08, cy - h*0.02, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.08, cy - h*0.02, 3, '#1e293b', '#1e293b', 1),
    _path(`M ${cx-w*0.02} ${cy+h*0.04} L ${cx} ${cy+h*0.02} L ${cx+w*0.02} ${cy+h*0.04}`, '#fbbf24', '#f59e0b', 1.5),
    _path(`M ${cx-w*0.12} ${cy+h*0.15} Q ${cx} ${cy+h*0.3} ${cx+w*0.12} ${cy+h*0.15}`, '#78350f', 'none', 2),
  ];
}

function shapePenguin(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.05, w*0.18, h*0.35, '#1e293b', '#0f172a', 2),
    _ellipse(cx, cy + h*0.1, w*0.14, h*0.25, '#ffffff', '#cbd5e1', 1.5),
    _circle(cx - w*0.04, cy - h*0.05, 3, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.04, cy - h*0.05, 3, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx-w*0.02} ${cy} Q ${cx} ${cy+h*0.04} ${cx+w*0.02} ${cy}`, '#f59e0b', 'none', 1.5),
    _line(cx - w*0.04, cy + h*0.35, cx - w*0.08, cy + h*0.45, '#f59e0b', 1.5),
    _line(cx + w*0.04, cy + h*0.35, cx + w*0.08, cy + h*0.45, '#f59e0b', 1.5),
  ];
}

function shapeDolphin(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.15} ${cy+h*0.1} Q ${cx+w*0.05} ${cy-h*0.2} ${cx-w*0.05} ${cy-h*0.15} Q ${x+w*0.8} ${cy-h*0.2} ${x+w*0.85} ${cy} Q ${x+w*0.88} ${cy+h*0.1} ${x+w*0.8} ${cy+h*0.15} Q ${cx-w*0.05} ${cy+h*0.3} ${x+w*0.15} ${cy+h*0.1}`, '#3b82f6', '#1d4ed8', 2),
    _path(`M ${x+w*0.85} ${cy} L ${x+w} ${cy-h*0.2} L ${x+w*0.92} ${cy} L ${x+w} ${cy+h*0.2} Z`, '#3b82f6', '#1d4ed8', 1.5),
    _circle(cx - w*0.1, cy - h*0.02, 3, '#1e293b', '#1e293b', 0.5),
  ];
}

function shapeOctopus(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_ellipse(cx, cy - h*0.02, w*0.18, h*0.15, '#fca5a5', '#ef4444', 2)];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI * i) / 5 - Math.PI/2;
    const len = w * 0.2;
    segs.push(_path(`M ${cx + Math.cos(ang)*w*0.15} ${cy + Math.sin(ang)*h*0.12} Q ${cx + Math.cos(ang)*len*0.7} ${cy + Math.sin(ang)*len*0.7 + h*0.1} ${cx + Math.cos(ang)*len} ${cy + Math.sin(ang)*len + h*0.2}`, '#ef4444', 'none', 2));
  }
  _circle(cx - w*0.04, cy - h*0.06, 2.5, '#1e293b', '#1e293b', 0.5);
  _circle(cx + w*0.04, cy - h*0.06, 2.5, '#1e293b', '#1e293b', 0.5);
  return segs;
}

function shapeStarfish(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  let d = '';
  for (let i = 0; i < 5; i++) {
    const ang = (2 * Math.PI * i) / 5 - Math.PI/2;
    const ang2 = (2 * Math.PI * i + Math.PI) / 5 - Math.PI/2;
    const px = cx + Math.cos(ang)*w*0.35;
    const py = cy + Math.sin(ang)*h*0.35;
    const ix = cx + Math.cos(ang2)*w*0.12;
    const iy = cy + Math.sin(ang2)*h*0.12;
    d += `${i === 0 ? 'M' : ' L'} ${px} ${py} L ${ix} ${iy}`;
  }
  d += ' Z';
  return [_path(d, '#f97316', '#fb923c', 2)];
}

function shapeSeahorse(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.05} ${y+h*0.05} Q ${cx-w*0.15} ${y+h*0.15} ${cx-w*0.12} ${y+h*0.3} Q ${cx-w*0.1} ${y+h*0.4} ${cx-w*0.02} ${y+h*0.38} Q ${cx+w*0.05} ${y+h*0.35} ${cx+w*0.02} ${y+h*0.45} Q ${cx-w*0.02} ${y+h*0.55} ${cx-w*0.05} ${y+h*0.65} Q ${cx-w*0.08} ${y+h*0.75} ${cx-w*0.15} ${y+h*0.85} Q ${cx} ${y+h*0.95} ${cx+w*0.1} ${y+h*0.9}`, '#f59e0b', '#d97706', 2),
    _circle(cx - w*0.05, y + h*0.05, 4, '#1e293b', '#1e293b', 0.5),
  ];
}

function shapeSquirrel(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.18, h*0.2, '#a16207', '#854d0e', 2),
    _circle(cx - w*0.04, cy - h*0.05, 3, '#1e293b', '#1e293b', 1),
    _circle(cx + w*0.04, cy - h*0.05, 3, '#1e293b', '#1e293b', 1),
    _circle(cx, cy, 3, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx+w*0.08} ${cy-h*0.02} Q ${cx+w*0.2} ${cy-h*0.15} ${cx+w*0.25} ${cy}`, '#854d0e', 'none', 2),
    _path(`M ${cx+w*0.25} ${cy} Q ${cx+w*0.35} ${cy+h*0.1} ${cx+w*0.2} ${cy+h*0.15}`, '#854d0e', 'none', 2),
    _ellipse(cx + w*0.25, cy + h*0.08, w*0.08, h*0.15, '#92400e', '#78350f', 1.5),
  ];
}

// More animals - concise versions
function shapeMonkey(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.08, w*0.18, h*0.2, '#a16207', '#854d0e', 2),
    _circle(cx - w*0.06, cy+h*0.02, 3, '#1e293b', '#1e293b', 1), _circle(cx+w*0.06, cy+h*0.02, 3, '#1e293b', '#1e293b', 1),
    _path(`M ${cx-w*0.02} ${cy+h*0.06} Q ${cx} ${cy+h*0.1} ${cx+w*0.02} ${cy+h*0.06}`, '#1e293b', 'none', 1.5),
    _circle(cx - w*0.15, cy - h*0.12, w*0.06, '#a16207', '#854d0e', 2), _circle(cx + w*0.15, cy - h*0.12, w*0.06, '#a16207', '#854d0e', 2),
  ];
}

function shapePanda(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy + h*0.08, w*0.22, '#ffffff', '#1e293b', 2),
    _circle(cx - w*0.1, cy - h*0.05, w*0.1, '#1e293b', '#0f172a', 2), _circle(cx + w*0.1, cy - h*0.05, w*0.1, '#1e293b', '#0f172a', 2),
    _circle(cx - w*0.04, cy, 3, '#1e293b', '#1e293b', 1), _circle(cx + w*0.04, cy, 3, '#1e293b', '#1e293b', 1),
    _circle(cx, cy + h*0.04, 3, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx-w*0.12} ${cy+h*0.2} Q ${cx} ${cy+h*0.3} ${cx+w*0.12} ${cy+h*0.2}`, '#1e293b', 'none', 2),
  ];
}

function shapeKangaroo(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.16, h*0.18, '#92400e', '#78350f', 2),
    _path(`M ${cx-w*0.12} ${cy-h*0.05} Q ${cx-w*0.2} ${cy-h*0.2} ${cx-w*0.15} ${cy-h*0.08}`, '#78350f', 'none', 2),
    _path(`M ${cx+w*0.12} ${cy-h*0.05} Q ${cx+w*0.2} ${cy-h*0.2} ${cx+w*0.15} ${cy-h*0.08}`, '#78350f', 'none', 2),
    _circle(cx - w*0.05, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5), _circle(cx + w*0.05, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5),
    _line(cx, cy + h*0.2, cx, cy + h*0.45, '#78350f', 2),
    _line(cx, cy + h*0.3, cx - w*0.15, cy + h*0.45, '#78350f', 2), _line(cx, cy + h*0.3, cx + w*0.15, cy + h*0.45, '#78350f', 2),
  ];
}

function shapeKoala(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy + h*0.08, w*0.22, '#9ca3af', '#6b7280', 2),
    _circle(cx - w*0.1, cy - h*0.02, w*0.1, '#9ca3af', '#6b7280', 2), _circle(cx + w*0.1, cy - h*0.02, w*0.1, '#9ca3af', '#6b7280', 2),
    _circle(cx - w*0.04, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5), _circle(cx + w*0.04, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5),
    _circle(cx, cy + h*0.06, 3, '#1e293b', '#1e293b', 0.5),
  ];
}

function shapeGiraffe(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.15, w*0.18, h*0.2, '#fbbf24', '#d97706', 2),
    _circle(cx - w*0.04, cy - h*0.02, 2.5, '#1e293b', '#1e293b', 0.5), _circle(cx + w*0.04, cy - h*0.02, 2.5, '#1e293b', '#1e293b', 0.5),
    _path(`M ${cx-w*0.02} ${cy+h*0.05} L ${cx} ${cy+h*0.05}`, '#1e293b', 'none', 1),
    _path(`M ${cx-w*0.02} ${cy-h*0.1} Q ${cx-w*0.04} ${cy-h*0.25} ${cx-w*0.02} ${cy-h*0.15}`, '#d97706', 'none', 2),
    _path(`M ${cx+w*0.02} ${cy-h*0.1} Q ${cx+w*0.04} ${cy-h*0.25} ${cx+w*0.02} ${cy-h*0.15}`, '#d97706', 'none', 2),
    _rect(cx - w*0.02, cy + h*0.25, w*0.04, h*0.25, '#fbbf24', '#d97706', 1.5, 3),
    _rect(cx - w*0.07, cy + h*0.35, w*0.06, h*0.12, '#fbbf24', '#d97706', 1.5, 3),
    _rect(cx + w*0.01, cy + h*0.38, w*0.06, h*0.12, '#fbbf24', '#d97706', 1.5, 3),
  ];
}

function shapeBee(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy, w*0.2, h*0.15, '#fbbf24', '#d97706', 2),
    _line(cx - w*0.05, cy - h*0.05, cx - w*0.05, cy + h*0.05, '#1e293b', 1.5), _line(cx + w*0.05, cy - h*0.05, cx + w*0.05, cy + h*0.05, '#1e293b', 1.5),
    _path(`M ${cx+w*0.15} ${cy-h*0.05} L ${cx+w*0.35} ${cy-h*0.18} L ${cx+w*0.2} ${cy}`, '#93c5fd', '#60a5fa', 1.5),
    _path(`M ${cx+w*0.15} ${cy+h*0.05} L ${cx+w*0.35} ${cy+h*0.18} L ${cx+w*0.2} ${cy}`, '#93c5fd', '#60a5fa', 1.5),
    _circle(cx - w*0.05, cy - h*0.02, 1.5, '#1e293b', '#1e293b', 0.5),
  ];
}

function shapeLadybug(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy, w*0.2, h*0.18, '#ef4444', '#dc2626', 2),
    _line(cx, cy - h*0.1, cx, cy + h*0.1, '#1e293b', 1.5),
    _circle(cx, cy - h*0.12, w*0.06, '#1e293b', '#0f172a', 2),
    _circle(cx - w*0.04, cy - h*0.03, 3, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.04, cy + h*0.04, 3, '#1e293b', '#1e293b', 0.5),
    _circle(cx - w*0.05, cy + h*0.02, 2, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.03, cy - h*0.02, 2, '#1e293b', '#1e293b', 0.5),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 2: PLANTS & NATURE (20 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeCactus(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(cx - w*0.06, y + h*0.45, w*0.12, h*0.5, '#22c55e', '#16a34a', 2, 6),
    _rect(cx - w*0.08, y + h*0.3, w*0.16, h*0.2, '#4ade80', '#22c55e', 2, 8),
    _path(`M ${cx+w*0.06} ${y+h*0.45} L ${cx+w*0.2} ${y+h*0.35} L ${cx+w*0.2} ${y+h*0.45} L ${cx+w*0.06} ${y+h*0.5}`, '#22c55e', '#4ade80', 1.5),
    _line(cx - w*0.02, y + h*0.38, cx - w*0.02, y + h*0.3, '#16a34a', 1),
    _line(cx + w*0.02, y + h*0.36, cx + w*0.02, y + h*0.3, '#16a34a', 1),
    _rect(cx - w*0.1, y + h*0.9, w*0.2, h*0.08, '#92400e', '#78350f', 2, 4),
  ];
}

function shapePalmTree(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx-w*0.02} ${y+h*0.9} Q ${cx} ${y+h*0.5} ${cx+w*0.02} ${y+h*0.3}`, '#78350f', '#92400e', 2),
    _path(`M ${cx+w*0.02} ${y+h*0.3} Q ${cx-w*0.15} ${y+h*0.1} ${cx-w*0.25} ${y+h*0.2}`, '#22c55e', '#16a34a', 2),
    _path(`M ${cx+w*0.02} ${y+h*0.3} Q ${cx+w*0.2} ${y+h*0.05} ${cx+w*0.3} ${y+h*0.15}`, '#22c55e', '#16a34a', 2),
    _path(`M ${cx+w*0.02} ${y+h*0.3} Q ${cx-w*0.05} ${y} ${cx-w*0.15} ${y+h*0.05}`, '#22c55e', '#16a34a', 2),
    _path(`M ${cx+w*0.02} ${y+h*0.3} Q ${cx+w*0.1} ${y-h*0.02} ${cx+w*0.2} ${y+h*0.05}`, '#22c55e', '#16a34a', 2),
    _rect(cx - w*0.04, y + h*0.9, w*0.08, h*0.08, '#78350f', '#451a03', 2, 3),
  ];
}

function shapeFern(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx} ${y+h} Q ${cx} ${y+h*0.5} ${cx} ${y+h*0.1}`, '#22c55e', '#16a34a', 2),
    _path(`M ${cx} ${y+h*0.7} Q ${cx-w*0.15} ${y+h*0.55} ${cx-w*0.1} ${y+h*0.65}`, '#22c55e', '#16a34a', 1.5),
    _path(`M ${cx} ${y+h*0.7} Q ${cx+w*0.15} ${y+h*0.55} ${cx+w*0.1} ${y+h*0.65}`, '#22c55e', '#16a34a', 1.5),
    _path(`M ${cx} ${y+h*0.5} Q ${cx-w*0.12} ${y+h*0.35} ${cx-w*0.08} ${y+h*0.45}`, '#22c55e', '#16a34a', 1.5),
    _path(`M ${cx} ${y+h*0.5} Q ${cx+w*0.12} ${y+h*0.35} ${cx+w*0.08} ${y+h*0.45}`, '#22c55e', '#16a34a', 1.5),
    _path(`M ${cx} ${y+h*0.3} Q ${cx-w*0.08} ${y+h*0.15} ${cx-w*0.05} ${y+h*0.25}`, '#22c55e', '#16a34a', 1.5),
    _path(`M ${cx} ${y+h*0.3} Q ${cx+w*0.08} ${y+h*0.15} ${cx+w*0.05} ${y+h*0.25}`, '#22c55e', '#16a34a', 1.5),
  ];
}

function shapeBamboo(x, y, w, h) {
  const cx = x + w/2;
  const segs = [];
  for (let i = 0; i < 4; i++) {
    const by = y + h*(0.05 + i*0.24);
    const bh = h*0.22;
    segs.push(_rect(cx - w*0.06, by, w*0.12, bh, '#22c55e', '#16a34a', 2, 2));
    segs.push(_line(cx - w*0.06, by + bh*0.5, cx + w*0.06, by + bh*0.5, '#16a34a', 1.5));
    if (i % 2 === 0) {
      segs.push(_rect(cx + w*0.06, by + bh*0.1, w*0.08, h*0.06, '#4ade80', '#22c55e', 1.5, 3));
    }
  }
  return segs;
}

function shapeRose(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy - h*0.05, w*0.15, '#fca5a5', '#ef4444', 2),
    _path(`M ${cx-w*0.08} ${cy-h*0.12} Q ${cx} ${cy-h*0.25} ${cx+w*0.08} ${cy-h*0.12}`, '#ef4444', '#fca5a5', 1.5),
    _path(`M ${cx-w*0.12} ${cy-h*0.05} Q ${cx} ${cy-h*0.2} ${cx+w*0.12} ${cy-h*0.05}`, '#ef4444', '#fca5a5', 1.5),
    _path(`M ${cx-w*0.1} ${cy+h*0.02} Q ${cx} ${cy-h*0.12} ${cx+w*0.1} ${cy+h*0.02}`, '#ef4444', '#fca5a5', 1.5),
    _line(cx, cy + h*0.05, cx, y + h*0.6, '#16a34a', 2),
    _line(cx, y + h*0.55, cx - w*0.15, y + h*0.7, '#16a34a', 2),
    _line(cx, y + h*0.5, cx + w*0.12, y + h*0.65, '#16a34a', 2),
  ];
}

function shapeTulip(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.12} ${cy} Q ${cx-w*0.15} ${cy-h*0.25} ${cx} ${cy-h*0.35} Q ${cx+w*0.15} ${cy-h*0.25} ${cx+w*0.12} ${cy} Z`, '#ec4899', '#db2777', 2),
    _line(cx, cy, cx, y + h*0.7, '#22c55e', 2),
    _line(cx, y + h*0.6, cx - w*0.1, y + h*0.75, '#22c55e', 2),
    _line(cx, y + h*0.55, cx + w*0.08, y + h*0.7, '#22c55e', 2),
  ];
}

function shapeSunflower(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_line(cx, cy, cx, y + h*0.8, '#16a34a', 2.5)];
  for (let i = 0; i < 8; i++) {
    const ang = (2 * Math.PI * i) / 8;
    segs.push(_ellipse(cx + Math.cos(ang)*w*0.12, cy + Math.sin(ang)*h*0.12, w*0.1, h*0.05, '#fbbf24', '#f59e0b', 1));
  }
  segs.push(_circle(cx, cy, w*0.1, '#78350f', '#451a03', 2));
  segs.push(_line(cx, y + h*0.75, cx - w*0.08, y + h*0.85, '#16a34a', 2));
  segs.push(_line(cx, y + h*0.72, cx + w*0.1, y + h*0.82, '#16a34a', 2));
  return segs;
}

function shapeCarnivorousPlant(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx-w*0.1} ${y+h*0.5} Q ${cx-w*0.15} ${y+h*0.05} ${cx-w*0.05} ${y+h*0.1} Q ${cx+w*0.05} ${y+h*0.05} ${cx+w*0.1} ${y+h*0.5} Z`, '#4ade80', '#22c55e', 2),
    _path(`M ${cx-w*0.08} ${y+h*0.15} L ${cx-w*0.12} ${y+h*0.25} L ${cx-w*0.04} ${y+h*0.2} Z`, '#22c55e', '#16a34a', 1),
    _path(`M ${cx+w*0.08} ${y+h*0.15} L ${cx+w*0.12} ${y+h*0.25} L ${cx+w*0.04} ${y+h*0.2} Z`, '#22c55e', '#16a34a', 1),
    _line(cx, y + h*0.5, cx, y + h*0.85, '#22c55e', 2),
  ];
}

function shapeVine(x, y, w, h) {
  const segs = [_path(`M ${x} ${y+h} Q ${x+w*0.3} ${y+h*0.3} ${x+w*0.6} ${y+h*0.5} Q ${x+w*0.8} ${y+h*0.6} ${x+w} ${y+h*0.1}`, '#22c55e', 'none', 2)];
  for (let i = 0; i < 5; i++) {
    segs.push(_circle(x + w*(0.1 + i*0.18), y + h*(0.8 - i*0.12), 4, '#4ade80', '#22c55e', 1));
  }
  return segs;
}

function shapeAloe(x, y, w, h) {
  return [
    _path(`M ${x+w*0.5} ${y+h*0.9} Q ${x+w*0.15} ${y+h*0.5} ${x+w*0.2} ${y+h*0.05} Q ${x+w*0.5} ${y+h*0.1} ${x+w*0.5} ${y+h*0.9}`, '#22c55e', '#4ade80', 2),
    _path(`M ${x+w*0.5} ${y+h*0.9} Q ${x+w*0.85} ${y+h*0.5} ${x+w*0.8} ${y+h*0.05} Q ${x+w*0.5} ${y+h*0.1} ${x+w*0.5} ${y+h*0.9}`, '#22c55e', '#4ade80', 2),
    _rect(x + w*0.3, y + h*0.85, w*0.4, h*0.12, '#92400e', '#78350f', 2, 4),
  ];
}

function shapeBonsai(x, y, w, h) {
  return [
    _rect(x + w*0.42, y + h*0.6, w*0.16, h*0.35, '#78350f', '#451a03', 2, 4),
    _path(`M ${x+w*0.5} ${y+h*0.6} Q ${x+w*0.25} ${y+h*0.15} ${x+w*0.35} ${y+h*0.1} Q ${x+w*0.5} ${y+h*0.05} ${x+w*0.6} ${y+h*0.15} Q ${x+w*0.75} ${y+h*0.1} ${x+w*0.5} ${y+h*0.6}`, '#22c55e', '#4ade80', 2),
    _circle(x + w*0.35, y + h*0.1, w*0.08, '#4ade80', '#22c55e', 1),
    _circle(x + w*0.6, y + h*0.12, w*0.06, '#4ade80', '#22c55e', 1),
  ];
}

function shapeSucculent(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, w*0.05, '#86efac', '#22c55e', 2),
    _ellipse(cx - w*0.1, cy, w*0.08, h*0.04, '#4ade80', '#22c55e', 1.5),
    _ellipse(cx + w*0.1, cy, w*0.08, h*0.04, '#4ade80', '#22c55e', 1.5),
    _ellipse(cx, cy - w*0.1, w*0.04, h*0.08, '#4ade80', '#22c55e', 1.5),
    _ellipse(cx, cy + w*0.1, w*0.04, h*0.08, '#4ade80', '#22c55e', 1.5),
    _rect(x + w*0.35, y + h*0.7, w*0.3, h*0.2, '#92400e', '#78350f', 2, 4),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 3: TECH & DEVICES (18 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeDrone(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(cx - w*0.08, cy - h*0.04, w*0.16, h*0.08, '#cbd5e1', '#64748b', 2, 4),
    _line(cx - w*0.08, cy, cx - w*0.3, cy - h*0.15, '#64748b', 1.5),
    _line(cx + w*0.08, cy, cx + w*0.3, cy - h*0.15, '#64748b', 1.5),
    _line(cx - w*0.08, cy, cx - w*0.3, cy + h*0.15, '#64748b', 1.5),
    _line(cx + w*0.08, cy, cx + w*0.3, cy + h*0.15, '#64748b', 1.5),
    _circle(cx - w*0.3, cy - h*0.15, 5, '#475569', '#334155', 1),
    _circle(cx + w*0.3, cy - h*0.15, 5, '#475569', '#334155', 1),
    _circle(cx - w*0.3, cy + h*0.15, 5, '#475569', '#334155', 1),
    _circle(cx + w*0.3, cy + h*0.15, 5, '#475569', '#334155', 1),
    _circle(cx, cy, 4, '#ef4444', '#dc2626', 0.5),
  ];
}

function shapeRobot(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(cx - w*0.12, y + h*0.1, w*0.24, h*0.25, '#cbd5e1', '#64748b', 2, 6),
    _rect(cx - w*0.08, y + h*0.15, w*0.06, h*0.06, '#3b82f6', '#1d4ed8', 1, 2),
    _rect(cx + w*0.02, y + h*0.15, w*0.06, h*0.06, '#3b82f6', '#1d4ed8', 1, 2),
    _rect(cx - w*0.04, y + h*0.25, w*0.08, h*0.03, '#ef4444', '#dc2626', 1, 1),
    _rect(cx - w*0.15, y + h*0.35, w*0.3, h*0.35, '#e2e8f0', '#94a3b8', 2, 6),
    _rect(cx - w*0.12, y + h*0.72, w*0.08, h*0.2, '#94a3b8', '#64748b', 1.5, 4),
    _rect(cx + w*0.04, y + h*0.72, w*0.08, h*0.2, '#94a3b8', '#64748b', 1.5, 4),
    _line(cx - w*0.2, y + h*0.45, cx - w*0.3, y + h*0.55, '#94a3b8', 2),
    _line(cx + w*0.2, y + h*0.45, cx + w*0.3, y + h*0.55, '#94a3b8', 2),
  ];
}

function shapeAIChip(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.1, y + h*0.1, w*0.8, h*0.8, '#0f172a', '#22c55e', 2.5, 6),
    _rect(x + w*0.2, y + h*0.2, w*0.6, h*0.6, '#1e293b', '#22c55e', 1.5, 4),
    _circle(cx, cy, w*0.06, '#22c55e', '#16a34a', 1.5),
    _line(x + w*0.35, cy, x + w*0.2, cy, '#22c55e', 1.5), _line(x + w*0.65, cy, x + w*0.8, cy, '#22c55e', 1.5),
    _line(cx, y + h*0.35, cx, y + h*0.2, '#22c55e', 1.5), _line(cx, y + h*0.65, cx, y + h*0.8, '#22c55e', 1.5),
    _text('AI', cx, cy + 4, { fs: 12, fw: '800', color: '#22c55e' }),
  ];
}

function shapeSmartwatch(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.05, y + h*0.1, w*0.9, h*0.8, '#1e293b', '#0f172a', 2.5, 12),
    _rect(x + w*0.12, y + h*0.15, w*0.76, h*0.7, '#0f172a', '#22c55e', 1.5, 8),
    _text('10:15', cx, cy - h*0.08, { fs: 16, fw: '700', color: '#22c55e' }),
    _circle(cx, cy + h*0.12, 4, '#22c55e', '#16a34a', 1),
    _rect(x + w*0.35, y + h*0.1, w*0.3, h*0.04, '#334155', '#475569', 1, 2),
    _rect(x + w*0.35, y + h*0.86, w*0.3, h*0.04, '#334155', '#475569', 1, 2),
  ];
}

function shapeVRHeadset(x, y, w, h) {
  const cx = x + w/2;
  return [
    _ellipse(cx - w*0.25, y + h*0.5, w*0.2, h*0.3, '#e2e8f0', '#94a3b8', 2),
    _ellipse(cx + w*0.25, y + h*0.5, w*0.2, h*0.3, '#e2e8f0', '#94a3b8', 2),
    _rect(cx - w*0.05, y + h*0.35, w*0.1, h*0.2, '#94a3b8', '#64748b', 2, 6),
    _rect(cx - w*0.25, y + h*0.85, w*0.5, h*0.08, '#64748b', '#475569', 1.5, 4),
    _circle(cx - w*0.25, y + h*0.45, w*0.04, '#3b82f6', '#1d4ed8', 1),
    _circle(cx + w*0.25, y + h*0.45, w*0.04, '#3b82f6', '#1d4ed8', 1),
  ];
}

function shapeDroneQuadcopter(x, y, w, h) { return shapeDrone(x, y, w, h); }

function shapePrinter(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.08, y + h*0.15, w*0.84, h*0.45, '#e2e8f0', '#94a3b8', 2, 6),
    _rect(x + w*0.12, y + h*0.25, w*0.3, h*0.08, '#ffffff', '#cbd5e1', 1, 3),
    _rect(x + w*0.08, y + h*0.6, w*0.84, h*0.3, '#cbd5e1', '#94a3b8', 2, 6),
    _rect(x + w*0.12, y + h*0.68, w*0.2, h*0.12, '#ffffff', '#cbd5e1', 1, 3),
    _rect(cx - w*0.04, y + h*0.55, w*0.08, h*0.05, '#64748b', '#475569', 1, 2),
    _circle(cx - w*0.15, y + h*0.35, 3, '#3b82f6', '#1d4ed8', 0.5),
  ];
}

function shapeRouter(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.1, y + h*0.55, w*0.8, h*0.35, '#e2e8f0', '#94a3b8', 2, 6),
    _circle(cx - w*0.1, y + h*0.1, 4, '#3b82f6', '#1d4ed8', 1),
    _circle(cx, y + h*0.05, 4, '#3b82f6', '#1d4ed8', 1), _circle(cx + w*0.1, y + h*0.1, 4, '#3b82f6', '#1d4ed8', 1),
    _path(`M ${cx-w*0.12} ${y+h*0.25} Q ${cx} ${y-h*0.05} ${cx+w*0.12} ${y+h*0.25}`, '#60a5fa', 'none', 1.5),
    _rect(x + w*0.2, y + h*0.65, w*0.04, h*0.08, '#64748b', '#475569', 1, 2),
    _rect(x + w*0.76, y + h*0.65, w*0.04, h*0.08, '#64748b', '#475569', 1, 2),
    _circle(cx, y + h*0.72, 6, '#22c55e', '#16a34a', 1.5),
  ];
}

function shapeGamingConsole(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.05, cy - h*0.3, w*0.9, h*0.6, '#1e293b', '#0f172a', 2.5, 12),
    _rect(x + w*0.05, cy - h*0.25, w*0.9, h*0.35, '#0f172a', '#334155', 1.5, 10),
    _circle(cx - w*0.15, cy + h*0.12, w*0.03, '#3b82f6', '#1d4ed8', 1),
    _circle(cx + w*0.15, cy + h*0.12, w*0.03, '#ef4444', '#dc2626', 1),
    _rect(x + w*0.35, cy - h*0.15, w*0.3, h*0.05, '#1e293b', '#334155', 1, 2),
    _circle(cx, cy + h*0.12, w*0.02, '#f59e0b', '#d97706', 0.5),
  ];
}

function shapeQRCode(x, y, w, h) {
  const segs = [];
  const s = Math.min(w,h) / 7;
  const ox = x + (w - s*7)/2, oy = y + (h - s*7)/2;
  const pattern = [
    1,1,1,0,0,1,1, 1,0,1,0,0,1,1, 1,1,1,0,1,0,1,
    0,0,0,0,1,0,0, 0,0,1,0,1,1,0, 1,1,1,0,0,1,0,
    1,1,1,1,0,1,1,
  ];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (pattern[r*7+c]) segs.push(_rect(ox+c*s, oy+r*s, s, s, '#1e293b', '#1e293b', 0.5, 2));
    }
  }
  return segs;
}

function shapeBarcode(x, y, w, h) {
  const segs = [];
  const bars = [6,3,5,2,4,7,3,6,2,5,4,3,7,2,5,3];
  const barW = w / bars.length;
  for (let i = 0; i < bars.length; i++) {
    if (i % 2 === 0) {
      segs.push(_rect(x + i*barW, y, barW*bars[i]/7, h, '#1e293b', '#1e293b', 1, 1));
    }
  }
  return segs;
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 4: MATH & GRAPHS (15 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeTrigCircle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, 'none', '#3b82f6', 2),
    _line(cx, cy, cx + r, cy, '#ef4444', 2),
    _line(cx, cy, cx + r*Math.cos(Math.PI/3), cy - r*Math.sin(Math.PI/3), '#22c55e', 2),
    _path(`M ${cx+r*0.1} ${cy} A ${r*0.1} ${r*0.1} 0 0 0 ${cx+r*0.1*Math.cos(Math.PI/3)} ${-r*0.1*Math.sin(Math.PI/3)}`, '#64748b', 'none', 1),
    _circle(cx + r, cy, 3, '#ef4444', '#dc2626', 1),
    _circle(cx + r*Math.cos(Math.PI/3), cy - r*Math.sin(Math.PI/3), 3, '#22c55e', '#16a34a', 1),
    _text('θ', cx + r*0.2, cy - 4, { fs: 12, fw: '600', color: '#64748b' }),
  ];
}

function shapeSineWave(x, y, w, h) {
  const cy = y + h/2;
  let d = `M ${x} ${cy}`;
  for (let i = 0; i <= 100; i++) {
    const px = x + (w * i) / 100;
    const py = cy - Math.sin((i / 100) * Math.PI * 4) * h * 0.3;
    d += ` L ${px} ${py}`;
  }
  return [_path(d, '#ef4444', 'none', 2.5), _line(x, cy, x + w, cy, '#94a3b8', 1)];
}

function shapeParabola(x, y, w, h) {
  const cx = x + w/2, cy = y + h*0.8;
  let d = `M ${x} ${cy}`;
  for (let i = 0; i <= 100; i++) {
    const px = x + (w * i) / 100;
    const t = (i / 100) * 2 - 1;
    const py = cy - (1 - t*t) * h * 0.6;
    d += ` L ${px} ${py}`;
  }
  return [_path(d, '#3b82f6', 'none', 2.5), _line(cx, y, cx, y + h, '#94a3b8', 1), _line(x, cy, x + w, cy, '#94a3b8', 1)];
}

function shapeHyperbola(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  let d1 = `M ${x} ${cy}`, d2 = `M ${x} ${cy}`;
  for (let i = 0; i <= 100; i++) {
    const t = (i / 100) * 3 - 1.5;
    const px = cx + t * w * 0.2;
    if (px < x || px > x + w) continue;
    const py = cy - Math.sqrt(1 + t*t) * h * 0.2;
    d1 += ` L ${px} ${py}`;
    d1 += ` L ${px} ${cy + (cy-py)}`;
  }
  return [
    _path(d1, '#f59e0b', 'none', 2.5),
    _line(cx, y, cx, y + h, '#94a3b8', 1), _line(x, cy, x + w, cy, '#94a3b8', 1),
  ];
}

function shapeIntegralArea(x, y, w, h) {
  const cy = y + h*0.8;
  let d = `M ${x} ${y+h}`;
  let fill = `M ${x} ${cy}`;
  for (let i = 0; i <= 100; i++) {
    const px = x + (w * i) / 100;
    const t = (i / 100) * 2 - 1;
    const py = cy - (1 - t*t) * h * 0.55;
    d += ` L ${px} ${py}`;
    fill += ` L ${px} ${py}`;
  }
  fill += ` L ${x + w} ${cy} Z`;
  return [_path(fill, '#3b82f6', '#3b82f633', 1), _path(d, '#2563eb', 'none', 2.5)];
}

function shapeMatrix(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.05, y + h*0.05, w*0.9, h*0.9, '#f8fafc', '#3b82f6', 2.5, 6),
    _text('A =', x + w*0.15, cy - h*0.15, { fs: 12, fw: '600', color: '#1e293b' }),
    _line(x + w*0.3, y + h*0.15, x + w*0.3, y + h*0.6, '#3b82f6', 1.5),
    _line(x + w*0.65, y + h*0.15, x + w*0.65, y + h*0.6, '#3b82f6', 1.5),
    _text('[1 2 3]', cx + w*0.02, cy - h*0.1, { fs: 10, fw: '500', color: '#475569' }),
    _text('[4 5 6]', cx + w*0.02, cy, { fs: 10, fw: '500', color: '#475569' }),
    _text('[7 8 9]', cx + w*0.02, cy + h*0.1, { fs: 10, fw: '500', color: '#475569' }),
  ];
}

function shapeVectorArrow(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _arrow(x + w*0.1, cy + h*0.3, x + w*0.9, cy - h*0.2, '#ef4444', 3),
    _arrow(x + w*0.1, cy - h*0.2, x + w*0.6, cy + h*0.1, '#3b82f6', 3),
    _text('v₁', x + w*0.8, cy - h*0.15, { fs: 12, fw: '700', color: '#ef4444' }),
    _text('v₂', x + w*0.5, cy + h*0.2, { fs: 12, fw: '700', color: '#3b82f6' }),
    _circle(cx + w*0.1, cy + h*0.3, 3, '#1e293b', '#1e293b', 1),
  ];
}

function shapeComplexPlane(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _line(x, cy, x + w, cy, '#94a3b8', 1.5), _line(cx, y, cx, y + h, '#94a3b8', 1.5),
    _text('Re', x + w - 12, cy - 6, { fs: 8, fw: '600', color: '#64748b' }),
    _text('Im', cx + 4, y + 6, { fs: 8, fw: '600', color: '#64748b' }),
    _circle(cx + w*0.2, cy - h*0.25, 4, '#ef4444', '#dc2626', 1.5),
    _arrow(cx, cy, cx + w*0.2, cy - h*0.25, '#ef4444', 2),
    _text('z = a + bi', cx + w*0.2, cy - h*0.3, { fs: 9, fw: '600', color: '#ef4444' }),
  ];
}

function shapeGraphNodes(x, y, w, h) {
  const nodes = [{x: w*0.3, y: h*0.2}, {x: w*0.7, y: h*0.2}, {x: w*0.5, y: h*0.5}, {x: w*0.3, y: h*0.8}, {x: w*0.7, y: h*0.8}];
  const segs = [];
  segs.push(_line(x+nodes[0].x, y+nodes[0].y, x+nodes[1].x, y+nodes[1].y, '#94a3b8', 1.5));
  segs.push(_line(x+nodes[0].x, y+nodes[0].y, x+nodes[2].x, y+nodes[2].y, '#94a3b8', 1.5));
  segs.push(_line(x+nodes[1].x, y+nodes[1].y, x+nodes[2].x, y+nodes[2].y, '#94a3b8', 1.5));
  segs.push(_line(x+nodes[2].x, y+nodes[2].y, x+nodes[3].x, y+nodes[3].y, '#94a3b8', 1.5));
  segs.push(_line(x+nodes[2].x, y+nodes[2].y, x+nodes[4].x, y+nodes[4].y, '#94a3b8', 1.5));
  for (const n of nodes) segs.push(_circle(x+n.x, y+n.y, 6, '#3b82f6', '#1d4ed8', 1.5));
  return segs;
}

function shapeDerivativeGraph(x, y, w, h) {
  const cy = y + h/2;
  let df = `M ${x} ${cy}`, df2 = `M ${x} ${cy}`;
  for (let i = 0; i <= 100; i++) {
    const px = x + (w * i) / 100;
    const t = (i / 100) * 2 - 1;
    const py = cy - (t*t*t - t) * h * 0.25;
    const py2 = cy - (3*t*t - 1) * h * 0.15;
    df += ` L ${px} ${py}`;
    df2 += ` L ${px} ${py2}`;
  }
  return [
    _line(x, cy, x + w, cy, '#94a3b8', 1), _path(df, '#3b82f6', 'none', 2.5), _path(df2, '#ef4444', 'none', 2),
    _text('f(x)', x + w*0.15, cy - h*0.3, { fs: 9, fw: '600', color: '#3b82f6' }),
    _text("f'(x)", x + w*0.6, cy + h*0.2, { fs: 9, fw: '600', color: '#ef4444' }),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 5: MUSICAL INSTRUMENTS (10 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeGuitar(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx - w*0.12, cy + h*0.08, w*0.12, h*0.2, '#92400e', '#78350f', 2),
    _ellipse(cx + w*0.12, cy + h*0.08, w*0.12, h*0.2, '#92400e', '#78350f', 2),
    _rect(cx - w*0.03, cy + h*0.05, w*0.06, h*0.35, '#78350f', '#451a03', 2, 4),
    _rect(cx - w*0.01, cy - h*0.2, w*0.02, h*0.25, '#78350f', '#451a03', 1.5, 3),
    _circle(cx, cy - h*0.22, 6, '#fbbf24', '#d97706', 1.5),
    _line(cx - w*0.02, cy - h*0.35, cx - w*0.02, cy + h*0.35, '#a16207', 0.8),
    _line(cx, cy - h*0.35, cx, cy + h*0.35, '#a16207', 0.8),
    _line(cx + w*0.02, cy - h*0.35, cx + w*0.02, cy + h*0.35, '#a16207', 0.8),
  ];
}

function shapeViolin(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.15, h*0.25, '#92400e', '#78350f', 2),
    _ellipse(cx - w*0.08, cy - h*0.05, w*0.08, h*0.12, '#92400e', '#78350f', 2),
    _rect(cx - w*0.02, cy - h*0.2, w*0.04, h*0.3, '#78350f', '#451a03', 1.5, 3),
    _rect(cx - w*0.01, cy - h*0.2, w*0.02, h*0.25, '#a16207', '#78350f', 1, 2),
    _rect(cx - w*0.01, cy - h*0.4, w*0.02, h*0.15, '#78350f', '#451a03', 1.5, 2),
    _circle(cx, cy - h*0.42, 4, '#1e293b', '#0f172a', 1),
  ];
}

function shapeDrumSet(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.2, h*0.1, '#ef4444', '#dc2626', 2),
    _rect(cx - w*0.18, cy + h*0.2, w*0.36, h*0.08, '#dc2626', '#b91c1c', 1.5, 4),
    _line(cx - w*0.18, cy + h*0.28, cx - w*0.2, cy + h*0.45, '#64748b', 1.5),
    _line(cx + w*0.18, cy + h*0.28, cx + w*0.2, cy + h*0.45, '#64748b', 1.5),
    _ellipse(cx - w*0.15, cy + h*0.1, w*0.05, h*0.04, '#f59e0b', '#d97706', 1),
    _ellipse(cx + w*0.15, cy + h*0.1, w*0.05, h*0.04, '#f59e0b', '#d97706', 1),
  ];
}

function shapeTrumpet(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.1, cy - h*0.15, w*0.3, h*0.3, '#fbbf24', '#f59e0b', 2, 10),
    _path(`M ${x+w*0.4} ${cy-h*0.15} L ${x+w*0.7} ${cy-h*0.2} L ${x+w*0.7} ${cy+h*0.2} L ${x+w*0.4} ${cy+h*0.15}`, '#fbbf24', '#f59e0b', 2),
    _circle(x + w*0.75, cy, w*0.08, '#f59e0b', '#d97706', 2),
    _line(x + w*0.15, cy - h*0.15, x + w*0.15, cy + h*0.15, '#d97706', 1.5),
  ];
}

function shapeSaxophone(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.3} ${cy-h*0.2} Q ${x+w*0.15} ${cy-h*0.1} ${x+w*0.1} ${cy} Q ${x+w*0.08} ${cy+h*0.1} ${x+w*0.2} ${cy+h*0.15} Q ${x+w*0.35} ${cy+h*0.2} ${x+w*0.4} ${cy+h*0.1} Q ${x+w*0.6} ${cy} ${x+w*0.65} ${cy-h*0.1} Q ${x+w*0.7} ${cy-h*0.2} ${x+w*0.6} ${cy-h*0.15}`, '#fbbf24', '#f59e0b', 2),
    _rect(x + w*0.3, cy - h*0.2, w*0.02, h*0.08, '#d97706', '#b45309', 1, 1),
    _rect(x + w*0.35, cy - h*0.18, w*0.02, h*0.06, '#d97706', '#b45309', 1, 1),
    _rect(x + w*0.4, cy - h*0.15, w*0.02, h*0.05, '#d97706', '#b45309', 1, 1),
  ];
}

function shapeMicrophone(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy - h*0.1, w*0.08, h*0.15, '#1e293b', '#0f172a', 2),
    _rect(cx - w*0.02, cy + h*0.05, w*0.04, h*0.2, '#1e293b', '#0f172a', 2, 3),
    _line(cx, cy + h*0.25, cx, cy + h*0.45, '#0f172a', 2),
    _path(`M ${cx-w*0.08} ${cy+h*0.35} Q ${cx} ${cy+h*0.5} ${cx+w*0.08} ${cy+h*0.35}`, '#0f172a', 'none', 2),
  ];
}

function shapeVinylRecord(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.38;
  const segs = [_circle(cx, cy, r, '#1e293b', '#0f172a', 2.5)];
  for (let i = 1; i <= 3; i++) segs.push(_circle(cx, cy, r * (i/4 + 0.1), 'none', '#334155', 1));
  segs.push(_circle(cx, cy, r*0.15, '#ef4444', '#dc2626', 2));
  segs.push(_circle(cx, cy, 5, '#fef3c7', '#f59e0b', 1));
  return segs;
}

function shapeHarp(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y+h*0.9} Q ${x+w*0.15} ${y+h*0.3} ${x+w*0.3} ${y+h*0.05} Q ${x+w*0.5} ${y} ${x+w*0.7} ${y+h*0.05} Q ${x+w*0.85} ${y+h*0.3} ${x+w*0.8} ${y+h*0.9}`, '#92400e', '#78350f', 2.5),
    _line(x + w*0.25, y + h*0.35, x + w*0.75, y + h*0.35, '#a16207', 0.8),
    _line(x + w*0.23, y + h*0.45, x + w*0.77, y + h*0.45, '#a16207', 0.8),
    _line(x + w*0.22, y + h*0.55, x + w*0.78, y + h*0.55, '#a16207', 0.8),
    _line(x + w*0.25, y + h*0.65, x + w*0.75, y + h*0.65, '#a16207', 0.8),
    _rect(x + w*0.3, y + h*0.85, w*0.4, h*0.08, '#78350f', '#451a03', 2, 4),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 6: ARCHITECTURE (12 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeSkyscraper(x, y, w, h) {
  return [
    _rect(x + w*0.15, y + h*0.05, w*0.7, h*0.9, '#cbd5e1', '#64748b', 2, 4),
    _rect(x + w*0.22, y + h*0.1, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.38, y + h*0.1, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.54, y + h*0.1, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.7, y + h*0.1, w*0.08, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.22, y + h*0.35, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.38, y + h*0.35, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.22, y + h*0.6, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.38, y + h*0.6, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.54, y + h*0.6, w*0.1, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
  ];
}

function shapePagoda(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.1} ${y+h*0.2} L ${cx} ${y} L ${x+w*0.9} ${y+h*0.2} Z`, '#ef4444', '#dc2626', 2),
    _rect(x + w*0.15, y + h*0.2, w*0.7, h*0.12, '#ef4444', '#dc2626', 1.5, 2),
    _path(`M ${x+w*0.2} ${y+h*0.4} L ${cx} ${y+h*0.22} L ${x+w*0.8} ${y+h*0.4} Z`, '#ef4444', '#dc2626', 2),
    _rect(x + w*0.25, y + h*0.4, w*0.5, h*0.12, '#ef4444', '#dc2626', 1.5, 2),
    _path(`M ${x+w*0.3} ${y+h*0.6} L ${cx} ${y+h*0.45} L ${x+w*0.7} ${y+h*0.6} Z`, '#ef4444', '#dc2626', 2),
    _rect(x + w*0.35, y + h*0.6, w*0.3, h*0.25, '#fef3c7', '#f59e0b', 2, 4),
    _rect(x + w*0.4, y + h*0.68, w*0.08, h*0.1, '#93c5fd', '#3b82f6', 1, 2),
  ];
}

function shapeColosseum(x, y, w, h) {
  return [
    _ellipse(x + w/2, y + h*0.35, w*0.42, h*0.2, '#e2e8f0', '#94a3b8', 2),
    _rect(x + w*0.1, y + h*0.35, w*0.8, h*0.55, '#e2e8f0', '#94a3b8', 2, 4),
    _ellipse(x + w/2, y + h*0.35, w*0.3, h*0.12, '#cbd5e1', '#94a3b8', 1.5),
    _rect(x + w*0.15, y + h*0.1, w*0.7, h*0.25, '#fef3c7', '#f59e0b', 2, 4),
    _line(x + w*0.2, y + h*0.4, x + w*0.2, y + h*0.85, '#94a3b8', 1.5),
    _line(x + w*0.35, y + h*0.4, x + w*0.35, y + h*0.85, '#94a3b8', 1.5),
    _line(x + w*0.5, y + h*0.4, x + w*0.5, y + h*0.85, '#94a3b8', 1.5),
    _line(x + w*0.65, y + h*0.4, x + w*0.65, y + h*0.85, '#94a3b8', 1.5),
    _line(x + w*0.8, y + h*0.4, x + w*0.8, y + h*0.85, '#94a3b8', 1.5),
  ];
}

function shapeWindmill(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.4} ${y+h*0.9} L ${x+w*0.6} ${y+h*0.9} L ${x+w*0.55} ${y+h*0.35} L ${x+w*0.45} ${y+h*0.35} Z`, '#e2e8f0', '#94a3b8', 2),
    _rect(cx - w*0.02, y + h*0.15, w*0.04, h*0.2, '#94a3b8', '#64748b', 1.5, 2),
    _path(`M ${cx} ${y+h*0.15} L ${cx-w*0.25} ${y+h*0.05} L ${cx} ${y+h*0.08}`, '#e2e8f0', '#94a3b8', 1.5),
    _path(`M ${cx} ${y+h*0.15} L ${cx+w*0.25} ${y+h*0.05} L ${cx} ${y+h*0.08}`, '#e2e8f0', '#94a3b8', 1.5),
    _path(`M ${cx} ${y+h*0.15} L ${cx-w*0.2} ${y+h*0.35} L ${cx} ${y+h*0.22}`, '#e2e8f0', '#94a3b8', 1.5),
    _path(`M ${cx} ${y+h*0.15} L ${cx+w*0.2} ${y+h*0.35} L ${cx} ${y+h*0.22}`, '#e2e8f0', '#94a3b8', 1.5),
    _circle(cx, y + h*0.15, 4, '#475569', '#334155', 1),
  ];
}

function shapeDam(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y+h} L ${x+w*0.2} ${y+h*0.15} L ${x+w*0.45} ${y+h*0.05} L ${x+w*0.45} ${y+h*0.15} L ${x+w*0.7} ${y+h*0.05} L ${x+w*0.7} ${y+h*0.15} L ${x+w*0.9} ${y+h*0.1} L ${x+w*0.9} ${y+h} Z`, '#cbd5e1', '#94a3b8', 2),
    _line(x + w*0.3, y + h*0.6, x + w*0.8, y + h*0.6, '#94a3b8', 1),
    _line(x + w*0.25, y + h*0.7, x + w*0.85, y + h*0.7, '#94a3b8', 1),
    _path(`M ${x} ${y+h*0.8} Q ${x+w*0.2} ${y+h*0.75} ${x+w*0.3} ${y+h*0.8}`, '#3b82f6', '#60a5fa', 1.5),
    _text('Water', x + w*0.1, y + h*0.85, { fs: 8, fw: '600', color: '#0369a1' }),
  ];
}

function shapeObelisk(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx-w*0.04} ${y} L ${cx+w*0.04} ${y} L ${cx+w*0.12} ${y+h*0.05} L ${cx+w*0.15} ${y+h*0.9} L ${cx-w*0.15} ${y+h*0.9} L ${cx-w*0.12} ${y+h*0.05} Z`, '#e2e8f0', '#94a3b8', 2),
    _rect(x + w*0.35, y + h*0.9, w*0.3, h*0.06, '#94a3b8', '#64748b', 2, 3),
    _path(`M ${cx-w*0.04} ${y+h*0.05} L ${cx+w*0.04} ${y+h*0.05}`, '#fbbf24', '#f59e0b', 2),
    _rect(cx - w*0.02, y + h*0.45, w*0.04, h*0.15, '#fbbf24', '#f59e0b', 0, 1),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 7: SPORTS (12 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeTennisRacket(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy - h*0.05, w*0.18, h*0.22, 'none', '#eab308', 2),
    _line(cx, cy + h*0.15, cx, y + h*0.9, '#78350f', 2.5),
    _line(cx - w*0.02, cy + h*0.15, cx - w*0.02, y + h*0.9, '#a16207', 1),
    _line(cx + w*0.02, cy + h*0.15, cx + w*0.02, y + h*0.9, '#a16207', 1),
    _line(cx - w*0.15, cy - h*0.1, cx + w*0.15, cy - h*0.1, '#eab308', 1),
    _line(cx - w*0.15, cy, cx + w*0.15, cy, '#eab308', 1),
    _line(cx - w*0.13, cy - h*0.2, cx - w*0.13, cy + h*0.05, '#eab308', 1),
    _line(cx + w*0.13, cy - h*0.2, cx + w*0.13, cy + h*0.05, '#eab308', 1),
  ];
}

function shapeBaseballBat(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.1, cx - h*0.02, w*0.35, h*0.04, '#78350f', '#451a03', 2, 3),
    _rect(x + w*0.45, cx - h*0.06, w*0.2, h*0.12, '#e2e8f0', '#94a3b8', 2, 8),
    _rect(x + w*0.65, cx - h*0.08, w*0.25, h*0.16, '#e2e8f0', '#94a3b8', 2, 12),
  ];
}

function shapeBicycle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx - w*0.15, cy + h*0.2, w*0.12, 'none', '#64748b', 2),
    _circle(cx + w*0.15, cy + h*0.2, w*0.12, 'none', '#64748b', 2),
    _circle(cx - w*0.15, cy + h*0.2, 3, '#64748b', '#475569', 0.5),
    _circle(cx + w*0.15, cy + h*0.2, 3, '#64748b', '#475569', 0.5),
    _line(cx - w*0.15, cy + h*0.2, cx - w*0.05, cy - h*0.1, '#64748b', 2),
    _line(cx + w*0.15, cy + h*0.2, cx, cy - h*0.1, '#64748b', 2),
    _line(cx - w*0.05, cy - h*0.1, cx, cy - h*0.1, '#64748b', 2),
    _line(cx - w*0.05, cy - h*0.1, cx - w*0.1, cy - h*0.3, '#64748b', 2),
    _line(cx, cy - h*0.1, cx + w*0.12, cy - h*0.25, '#64748b', 2),
  ];
}

function shapeArchery(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.3} ${cy-h*0.15} Q ${cx} ${cy-h*0.4} ${cx+w*0.3} ${cy-h*0.15}`, '#78350f', 'none', 3),
    _line(cx - w*0.2, cy - h*0.1, cx + w*0.25, cy + h*0.1, '#a16207', 2),
    _line(cx + w*0.25, cy + h*0.1, cx + w*0.45, cy + h*0.15, '#a16207', 2),
    _path(`M ${cx} ${cy} L ${cx} ${cy+h*0.15}`, '#a16207', 'none', 1.5),
  ];
}

function shapeWeightlifting(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(cx - w*0.02, y + h*0.15, w*0.04, h*0.4, '#64748b', '#475569', 2, 2),
    _circle(cx - w*0.12, y + h*0.55, w*0.06, '#1e293b', '#0f172a', 2),
    _circle(cx + w*0.12, y + h*0.55, w*0.06, '#1e293b', '#0f172a', 2),
    _line(cx - w*0.02, y + h*0.35, cx - w*0.08, y + h*0.45, '#64748b', 2),
    _line(cx + w*0.02, y + h*0.35, cx + w*0.08, y + h*0.45, '#64748b', 2),
  ];
}

function shapeGymnasticsRings(x, y, w, h) {
  const cx = x + w/2;
  return [
    _circle(cx - w*0.15, y + h*0.2, w*0.08, 'none', '#ef4444', 3),
    _circle(cx + w*0.15, y + h*0.2, w*0.08, 'none', '#3b82f6', 3),
    _line(cx - w*0.15, y + h*0.2, cx - w*0.15, y, '#64748b', 1.5),
    _line(cx + w*0.15, y + h*0.2, cx + w*0.15, y, '#64748b', 1.5),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 8: FOOD (15 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapePizza(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${y+h*0.1} L ${x+w*0.05} ${y+h*0.9} Q ${cx} ${y+h} ${x+w*0.95} ${y+h*0.9} Z`, '#fbbf24', '#f59e0b', 2),
    _circle(cx - w*0.08, cy + h*0.2, 4, '#ef4444', '#dc2626', 0.5),
    _circle(cx + w*0.05, cy + h*0.15, 4, '#ef4444', '#dc2626', 0.5),
    _circle(cx - w*0.02, cy + h*0.35, 5, '#78350f', '#451a03', 0.5),
    _circle(cx + w*0.08, cy + h*0.3, 4, '#78350f', '#451a03', 0.5),
    _circle(cx - w*0.1, cy + h*0.35, 4, '#78350f', '#451a03', 0.5),
  ];
}

function shapeBurger(x, y, w, h) {
  const cx = x + w/2;
  return [
    _ellipse(cx, y + h*0.1, w*0.35, h*0.08, '#f59e0b', '#d97706', 2),
    _rect(x + w*0.1, y + h*0.18, w*0.8, h*0.15, '#22c55e', '#16a34a', 2, 4),
    _rect(x + w*0.08, y + h*0.33, w*0.84, h*0.12, '#ef4444', '#dc2626', 2, 4),
    _rect(x + w*0.1, y + h*0.45, w*0.8, h*0.15, '#fbbf24', '#f59e0b', 2, 4),
    _ellipse(cx, y + h*0.7, w*0.35, h*0.08, '#f59e0b', '#d97706', 2),
    _rect(x + w*0.08, y + h*0.65, w*0.84, h*0.05, '#92400e', '#78350f', 2, 3),
  ];
}

function shapeCake(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.1} ${y+h*0.45} L ${x+w*0.9} ${y+h*0.45} L ${x+w*0.85} ${y+h*0.85} L ${x+w*0.15} ${y+h*0.85} Z`, '#fca5a5', '#ef4444', 2),
    _rect(x + w*0.2, y + h*0.85, w*0.6, h*0.08, '#ef4444', '#dc2626', 2, 4),
    _path(`M ${cx-w*0.1} ${y+h*0.45} Q ${cx} ${y+h*0.15} ${cx+w*0.1} ${y+h*0.45}`, '#ffffff', '#fca5a5', 2),
    _circle(cx - w*0.08, y + h*0.4, 4, '#ef4444', '#dc2626', 0.5),
    _circle(cx + w*0.08, y + h*0.4, 4, '#ef4444', '#dc2626', 0.5),
    _circle(cx, y + h*0.38, 3, '#ef4444', '#dc2626', 0.5),
  ];
}

function shapeIceCream(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx-w*0.18} ${y+h*0.5} Q ${cx-w*0.22} ${y+h*0.1} ${cx} ${y} Q ${cx+w*0.22} ${y+h*0.1} ${cx+w*0.18} ${y+h*0.5} Z`, '#fb923c', '#f97316', 2),
    _path(`M ${cx-w*0.12} ${y+h*0.5} L ${cx-w*0.06} ${y+h*0.9} L ${cx} ${y+h} L ${cx+w*0.06} ${y+h*0.9} L ${cx+w*0.12} ${y+h*0.5} Z`, '#fbbf24', '#f59e0b', 2),
    _circle(cx - w*0.06, y + h*0.2, 3, '#78350f', '#451a03', 0.5),
    _circle(cx + w*0.04, y + h*0.3, 3, '#78350f', '#451a03', 0.5),
  ];
}

function shapeCoffee(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.1, y + h*0.1, w*0.55, h*0.75, '#f8fafc', '#64748b', 2.5, 6),
    _path(`M ${x+w*0.65} ${y+h*0.2} L ${x+w*0.75} ${y+h*0.2} Q ${x+w*0.85} ${y+h*0.3} ${x+w*0.75} ${y+h*0.45} L ${x+w*0.65} ${y+h*0.45}`, '#f8fafc', '#64748b', 2),
    _rect(x + w*0.12, y + h*0.15, w*0.5, h*0.08, '#92400e', '#78350f', 1.5, 3),
    _path(`M ${x+w*0.12} ${y+h*0.7} Q ${x+w*0.25} ${y+h*0.65} ${x+w*0.4} ${y+h*0.7} Q ${x+w*0.55} ${y+h*0.75} ${x+w*0.65} ${y+h*0.7}`, '#78350f', 'none', 1.5),
    _rect(x + w*0.2, y + h*0.85, w*0.35, h*0.06, '#64748b', '#475569', 1.5, 3),
  ];
}

function shapeTea(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.15, y + h*0.1, w*0.5, h*0.7, '#fef3c7', '#d97706', 2.5, 6),
    _path(`M ${cx-w*0.02} ${y+h*0.25} Q ${cx-w*0.08} ${y+h*0.1} ${cx} ${y} Q ${cx+w*0.08} ${y+h*0.1} ${cx+w*0.02} ${y+h*0.25}`, '#22c55e', '#16a34a', 2),
    _line(cx - w*0.02, y + h*0.25, cx - w*0.02, y + h*0.3, '#f59e0b', 1.5),
    _rect(x + w*0.22, y + h*0.85, w*0.36, h*0.06, '#64748b', '#475569', 1.5, 3),
  ];
}

function shapeApple(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy + h*0.05, w*0.22, '#ef4444', '#dc2626', 2),
    _path(`M ${cx-w*0.18} ${cy-h*0.05} Q ${cx} ${cy-h*0.25} ${cx+w*0.18} ${cy-h*0.05}`, '#ef4444', '#dc2626', 2),
    _line(cx, cy - h*0.2, cx, cy - h*0.3, '#78350f', 2),
    _ellipse(cx - w*0.18, cy + h*0.05, w*0.06, h*0.04, '#22c55e', '#16a34a', 1),
  ];
}

function shapeOrange(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [_circle(cx, cy, Math.min(w,h)*0.3, '#fb923c', '#ea580c', 2),
    _circle(cx, cy, Math.min(w,h)*0.28, '#fdba74', '#ea580c', 1),
    _circle(cx - w*0.05, cy - h*0.05, 3, '#ea580c', '#c2410c', 0.5),
    _circle(cx - w*0.02, cy - h*0.08, 2, '#ea580c', '#c2410c', 0.5),
    _circle(cx + w*0.05, cy - h*0.02, 2.5, '#ea580c', '#c2410c', 0.5),
  ];
}

function shapeBread(x, y, w, h) {
  return [
    _ellipse(x + w/2, y + h*0.2, w*0.35, h*0.15, '#fbbf24', '#d97706', 2),
    _rect(x + w*0.1, y + h*0.2, w*0.8, h*0.55, '#fef3c7', '#d97706', 2, 4),
    _line(x + w*0.25, y + h*0.3, x + w*0.75, y + h*0.3, '#d97706', 0.8),
    _line(x + w*0.2, y + h*0.45, x + w*0.8, y + h*0.45, '#d97706', 0.8),
    _line(x + w*0.25, y + h*0.6, x + w*0.75, y + h*0.6, '#d97706', 0.8),
  ];
}

function shapeCheese(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.1} ${y+h*0.9} L ${x+w*0.1} ${y+h*0.2} L ${x+w*0.9} ${y+h*0.2} L ${x+w*0.9} ${y+h*0.9} Z`, '#fbbf24', '#f59e0b', 2),
    _circle(cx + w*0.05, cy - h*0.1, 5, '#d97706', '#b45309', 1),
    _circle(cx - w*0.08, cy + h*0.1, 4, '#d97706', '#b45309', 1),
    _circle(cx + w*0.1, cy + h*0.05, 3, '#d97706', '#b45309', 1),
  ];
}

function shapeFrenchFries(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.1, y + h*0.4, w*0.08, h*0.45, '#fbbf24', '#f59e0b', 1.5, 3),
    _rect(x + w*0.25, y + h*0.3, w*0.08, h*0.55, '#fbbf24', '#f59e0b', 1.5, 3),
    _rect(x + w*0.4, y + h*0.35, w*0.08, h*0.5, '#fbbf24', '#f59e0b', 1.5, 3),
    _rect(x + w*0.55, y + h*0.25, w*0.08, h*0.6, '#fbbf24', '#f59e0b', 1.5, 3),
    _rect(x + w*0.68, y + h*0.4, w*0.08, h*0.45, '#fbbf24', '#f59e0b', 1.5, 3),
    _rect(x + w*0.05, y + h*0.8, w*0.8, h*0.12, '#ef4444', '#dc2626', 2, 6),
  ];
}

function shapeTaco(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.05} ${y+h*0.6} Q ${cx} ${y+h*0.85} ${x+w*0.95} ${y+h*0.6}`, '#f59e0b', '#d97706', 2.5),
    _path(`M ${x+w*0.1} ${y+h*0.6} Q ${cx} ${y+h*0.8} ${x+w*0.9} ${y+h*0.6}`, '#fbbf24', '#f59e0b', 2),
    _circle(cx - w*0.08, cy + h*0.08, 3, '#ef4444', '#dc2626', 0.5),
    _circle(cx + w*0.06, cy + h*0.05, 3, '#22c55e', '#16a34a', 0.5),
    _circle(cx - w*0.02, cy + h*0.12, 3, '#78350f', '#451a03', 0.5),
  ];
}

function shapeHotDog(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.05, y + h*0.25, w*0.9, h*0.5, '#f59e0b', '#d97706', 2, 12),
    _path(`M ${cx-w*0.02} ${y+h*0.25} L ${cx-w*0.02} ${y+h*0.75}`, '#ef4444', '#dc2626', 2),
    _path(`M ${cx-w*0.06} ${y+h*0.25} L ${cx-w*0.06} ${y+h*0.75}`, '#ef4444', '#dc2626', 2),
    _path(`M ${cx+w*0.02} ${y+h*0.25} L ${cx+w*0.02} ${y+h*0.75}`, '#ef4444', '#dc2626', 2),
    _path(`M ${cx+w*0.06} ${y+h*0.25} L ${cx+w*0.06} ${y+h*0.75}`, '#ef4444', '#dc2626', 2),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 9: MEDICAL (10 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeStethoscope(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy + h*0.2, w*0.12, '#64748b', '#334155', 2),
    _path(`M ${cx} ${cy-h*0.1} L ${cx} ${cy+h*0.08}`, '#64748b', 2),
    _path(`M ${cx} ${cy-h*0.1} Q ${cx-w*0.15} ${cy-h*0.2} ${cx-w*0.2} ${cy-h*0.1} Q ${cx-w*0.25} ${cy} ${cx-w*0.15} ${cy+h*0.05}`, '#64748b', 'none', 2),
    _path(`M ${cx} ${cy-h*0.1} Q ${cx+w*0.08} ${cy-h*0.2} ${cx+w*0.15} ${cy-h*0.05} Q ${cx+w*0.2} ${cy+h*0.05} ${cx} ${cy+h*0.05}`, '#64748b', 'none', 2),
  ];
}

function shapeSyringe(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(cx - w*0.04, y + h*0.35, w*0.08, h*0.5, '#93c5fd', '#3b82f6', 2, 4),
    _line(cx, y + h*0.85, cx, y + h*0.95, '#3b82f6', 1.5),
    _rect(cx - w*0.06, y + h*0.15, w*0.12, h*0.2, '#dbeafe', '#3b82f6', 2, 4),
    _rect(cx - w*0.02, y + h*0.15, w*0.04, h*0.1, '#60a5fa', '#1d4ed8', 0, 0),
    _rect(cx - w*0.06, y + h*0.3, w*0.12, h*0.04, '#64748b', '#475569', 1, 2),
    _line(cx, y + h*0.95, cx, y + h, '#ef4444', 1.5),
  ];
}

function shapePill(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.1, cy - h*0.08, w*0.8, h*0.16, '#93c5fd', '#3b82f6', 2, 8),
    _ellipse(x + w*0.12, cy, w*0.04, h*0.08, '#60a5fa', '#3b82f6', 1.5),
    _ellipse(x + w*0.88, cy, w*0.04, h*0.08, '#60a5fa', '#3b82f6', 1.5),
    _line(cx, cy - h*0.04, cx, cy + h*0.04, '#ffffff', 1),
  ];
}

function shapeBandage(x, y, w, h) {
  return [
    _rect(x + w*0.1, y + h*0.35, w*0.8, h*0.3, '#fef3c7', '#f59e0b', 2, 6),
    _rect(x + w*0.15, y + h*0.38, w*0.3, h*0.24, '#ffffff', '#f59e0b', 1, 4),
    _rect(x + w*0.55, y + h*0.38, w*0.3, h*0.24, '#ffffff', '#f59e0b', 1, 4),
    _circle(x + w/2, y + h*0.5, 4, '#ef4444', '#dc2626', 1),
  ];
}

function shapeDNAVial(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx-w*0.08} ${y+h*0.1} L ${cx+w*0.08} ${y+h*0.1} L ${cx+w*0.12} ${y+h*0.85} Q ${cx} ${y+h} ${cx-w*0.12} ${y+h*0.85} Z`, '#dbeafe', '#3b82f6', 2),
    _line(cx, y + h*0.15, cx, y + h*0.75, '#93c5fd', 1),
    _circle(cx - w*0.03, y + h*0.3, 2.5, '#3b82f6', '#1d4ed8', 0.5),
    _circle(cx + w*0.03, y + h*0.4, 2.5, '#ef4444', '#dc2626', 0.5),
    _circle(cx - w*0.03, y + h*0.5, 2.5, '#3b82f6', '#1d4ed8', 0.5),
    _circle(cx + w*0.03, y + h*0.6, 2.5, '#ef4444', '#dc2626', 0.5),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 10: ABSTRACT & SYMBOLS (15 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeKaleidoscope(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  const segs = [_circle(cx, cy, r, '#1e293b', '#0f172a', 2)];
  for (let i = 0; i < 8; i++) {
    const ang = (2 * Math.PI * i) / 8;
    const ang2 = (2 * Math.PI * (i+1)) / 8;
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    const c1 = cx + Math.cos(ang)*r*0.5, c2 = cy + Math.sin(ang)*r*0.5;
    const e1 = cx + Math.cos(ang)*r, e2 = cy + Math.sin(ang)*r;
    segs.push(_path(`M ${cx} ${cy} L ${e1} ${e2} L ${cx + Math.cos(ang2)*r} ${cy + Math.sin(ang2)*r} Z`, colors[i], 'none', 1));
  }
  return segs;
}

function shapeTessellation(x, y, w, h) {
  const segs = [];
  const s = Math.min(w,h) / 4;
  const ox = x + (w - s*4)/2, oy = y + (h - s*4)/2;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const fill = (r + c) % 2 === 0 ? '#3b82f6' : '#93c5fd';
      segs.push(_rect(ox + c*s, oy + r*s, s, s, fill+'33', fill, 1, 2));
    }
  }
  return segs;
}

function shapeMobiusStrip(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.2} ${cy} Q ${cx-w*0.3} ${cy-h*0.3} ${cx} ${cy-h*0.2} Q ${cx+w*0.3} ${cy-h*0.1} ${cx+w*0.3} ${cy+h*0.1} Q ${cx+w*0.3} ${cy+h*0.3} ${cx} ${cy+h*0.2} Q ${cx-w*0.3} ${cy+h*0.1} ${cx-w*0.3} ${cy-h*0.1} Q ${cx-w*0.3} ${cy-h*0.3} ${cx} ${cy-h*0.2}`, '#8b5cf6', 'none', 3),
    _line(cx - w*0.2, cy, cx + w*0.05, cy, '#a78bfa', 1.5),
  ];
}

function shapeFractalTree(x, y, w, h) {
  const cx = x + w/2;
  const segs = [_rect(cx - w*0.02, y + h*0.6, w*0.04, h*0.35, '#78350f', '#451a03', 2, 2)];
  function branch(x1, y1, ang, len, depth) {
    if (depth <= 0) return;
    const x2 = x1 + Math.cos(ang) * len;
    const y2 = y1 + Math.sin(ang) * len;
    segs.push(_line(x1, y1, x2, y2, '#22c55e', 1.5));
    branch(x2, y2, ang - 0.4, len * 0.7, depth - 1);
    branch(x2, y2, ang + 0.4, len * 0.7, depth - 1);
  }
  branch(cx, y + h*0.6, -Math.PI/2, h*0.3, 4);
  return segs;
}

function shapeRosette(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  const segs = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6;
    segs.push(_circle(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r, r*0.4, 'none', '#f59e0b', 2));
  }
  segs.push(_circle(cx, cy, r*0.15, '#fbbf24', '#d97706', 2));
  return segs;
}

function shapeYinYang(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, '#ffffff', '#1e293b', 2),
    _path(`M ${cx} ${cy-r} A ${r/2} ${r/2} 0 0 0 ${cx} ${cy} A ${r/2} ${r/2} 0 0 0 ${cx} ${cy+r} A ${r} ${r} 0 0 1 ${cx} ${cy-r}`, '#1e293b', '#1e293b', 1),
    _circle(cx, cy - r/2, r*0.08, '#ffffff', '#ffffff', 0),
    _circle(cx, cy + r/2, r*0.08, '#1e293b', '#1e293b', 0),
  ];
}

function shapeInfinity(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [_path(`M ${cx-w*0.25} ${cy} Q ${cx-w*0.4} ${cy-h*0.25} ${cx} ${cy} Q ${cx+w*0.4} ${cy-h*0.25} ${cx+w*0.25} ${cy} Q ${cx+w*0.4} ${cy+h*0.25} ${cx} ${cy} Q ${cx-w*0.4} ${cy+h*0.25} ${cx-w*0.25} ${cy}`, '#ec4899', 'none', 3)];
}

function shapeTreeOfLife(x, y, w, h) {
  const cx = x + w/2;
  const segs = [_rect(cx - w*0.02, y + h*0.55, w*0.04, h*0.4, '#78350f', '#451a03', 2, 3)];
  function branch(x1, y1, ang, len, depth, color) {
    if (depth <= 0) return;
    const x2 = x1 + Math.cos(ang) * len;
    const y2 = y1 + Math.sin(ang) * len;
    segs.push(_line(x1, y1, x2, y2, color, 1.5));
    branch(x2, y2, ang - 0.3, len * 0.65, depth - 1, color);
    branch(x2, y2, ang + 0.3, len * 0.65, depth - 1, color);
  }
  branch(cx, y + h*0.55, -Math.PI/2, h*0.25, 5, '#22c55e');
  _circle(cx + w*0.1, y + h*0.45, 3, '#fbbf24', '#f59e0b', 0.5);
  _circle(cx - w*0.05, y + h*0.4, 3, '#fbbf24', '#f59e0b', 0.5);
  _circle(cx + w*0.08, y + h*0.35, 2.5, '#fbbf24', '#f59e0b', 0.5);
  _circle(cx, y + h*0.5, 3, '#fbbf24', '#f59e0b', 0.5);
  return segs;
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 11: SCIENCE TOOLS (8 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeThermometer(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(cx - w*0.04, y + h*0.15, w*0.08, h*0.55, '#ffffff', '#ef4444', 2, 4),
    _circle(cx, y + h*0.75, w*0.08, '#ef4444', '#dc2626', 2),
    _rect(cx - w*0.02, y + h*0.15, w*0.04, h*0.3, '#ef4444', '#dc2626', 1, 2),
    _line(x + w*0.05, y + h*0.25, cx - w*0.04, y + h*0.25, '#94a3b8', 0.8),
    _line(x + w*0.05, y + h*0.4, cx - w*0.04, y + h*0.4, '#94a3b8', 0.8),
    _line(x + w*0.05, y + h*0.55, cx - w*0.04, y + h*0.55, '#94a3b8', 0.8),
  ];
}

function shapeBarometer(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, '#f8fafc', '#64748b', 2),
    _line(cx, cy, cx + r*0.6, cy - r*0.6, '#ef4444', 2),
    _text('H', cx + r*0.7, cy - r*0.65, { fs: 8, fw: '700', color: '#ef4444' }),
    _text('L', cx - r*0.7, cy + r*0.65, { fs: 8, fw: '700', color: '#3b82f6' }),
    _text('1013', cx, cy + r*1.1, { fs: 8, fw: '600', color: '#64748b' }),
  ];
}

function shapeMicroscopeSide(x, y, w, h) {
  return [
    _rect(x + w*0.4, y + h*0.05, w*0.2, h*0.25, '#64748b', '#475569', 2, 4),
    _rect(x + w*0.42, y + h*0.3, w*0.16, h*0.2, '#94a3b8', '#64748b', 1.5, 3),
    _rect(x + w*0.35, y + h*0.5, w*0.3, h*0.3, '#cbd5e1', '#94a3b8', 2, 4),
    _rect(x + w*0.4, y + h*0.8, w*0.2, h*0.15, '#64748b', '#475569', 1.5, 4),
    _rect(x + w*0.15, y + h*0.85, w*0.7, h*0.06, '#64748b', '#475569', 1.5, 4),
    _circle(x + w*0.5, y + h*0.1, 5, '#93c5fd', '#3b82f6', 1),
  ];
}

function shapePipette(x, y, w, h) {
  return [
    _rect(x + w*0.35, y + h*0.1, w*0.3, h*0.08, '#64748b', '#475569', 2, 4),
    _line(x + w/2, y + h*0.18, x + w/2, y + h*0.8, '#93c5fd', 3),
    _line(x + w/2, y + h*0.8, x + w/2, y + h*0.95, '#64748b', 2),
  ];
}

function shapeCentrifuge(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, '#e2e8f0', '#94a3b8', 2),
    _line(cx, cy, cx + r*0.7, cy + r*0.3, '#94a3b8', 2),
    _line(cx, cy, cx - r*0.5, cy + r*0.5, '#94a3b8', 2),
    _line(cx, cy, cx, cy - r*0.7, '#94a3b8', 2),
    _circle(cx + r*0.7, cy + r*0.3, 6, '#ef4444', '#dc2626', 1),
    _circle(cx - r*0.5, cy + r*0.5, 6, '#3b82f6', '#1d4ed8', 1),
    _circle(cx, cy - r*0.7, 6, '#f59e0b', '#d97706', 1),
    _circle(cx, cy, 4, '#475569', '#334155', 1),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 12: MYTHOLOGY & SYMBOLS (12 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeThorHammer(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(cx - w*0.04, y + h*0.2, w*0.08, h*0.4, '#64748b', '#475569', 2, 4),
    _rect(cx - w*0.15, y + h*0.15, w*0.3, h*0.08, '#94a3b8', '#64748b', 2, 4),
    _rect(cx - w*0.12, y + h*0.6, w*0.24, h*0.08, '#94a3b8', '#64748b', 2, 4),
    _rect(cx - w*0.1, y + h*0.15, w*0.2, h*0.08, '#cbd5e1', '#94a3b8', 1, 4),
  ];
}

function shapeAnkh(x, y, w, h) {
  const cx = x + w/2;
  return [
    _circle(cx, y + h*0.18, w*0.15, 'none', '#f59e0b', 2.5),
    _line(cx, y + h*0.32, cx, y + h*0.9, '#f59e0b', 2.5),
    _line(cx - w*0.2, y + h*0.55, cx + w*0.2, y + h*0.55, '#f59e0b', 2.5),
  ];
}

function shapeOm(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.12} ${cy+h*0.1} Q ${cx-w*0.25} ${cy-h*0.1} ${cx} ${cy-h*0.25} Q ${cx+w*0.25} ${cy-h*0.1} ${cx+w*0.12} ${cy+h*0.1}`, '#a855f7', 'none', 2.5),
    _path(`M ${cx} ${cy-h*0.25} L ${cx} ${cy+h*0.3}`, '#a855f7', 'none', 2),
    _path(`M ${cx} ${cy} Q ${cx-w*0.15} ${cy+h*0.2} ${cx-w*0.08} ${cy+h*0.45} Q ${cx} ${cy+h*0.35} ${cx} ${cy+h*0.3}`, '#a855f7', 'none', 2),
    _circle(cx, cy + h*0.35, w*0.06, '#a855f7', '#7c3aed', 1),
  ];
}

function shapeLotus(x, y, w, h) {
  const cx = x + w/2;
  return [
    _ellipse(cx, y + h*0.35, w*0.08, h*0.15, '#fca5a5', '#ec4899', 2),
    _ellipse(cx - w*0.12, y + h*0.4, w*0.07, h*0.12, '#fbcfe8', '#ec4899', 1.5),
    _ellipse(cx + w*0.12, y + h*0.4, w*0.07, h*0.12, '#fbcfe8', '#ec4899', 1.5),
    _ellipse(cx - w*0.22, y + h*0.5, w*0.06, h*0.08, '#fce7f3', '#ec4899', 1.5),
    _ellipse(cx + w*0.22, y + h*0.5, w*0.06, h*0.08, '#fce7f3', '#ec4899', 1.5),
    _line(cx, y + h*0.5, cx, y + h*0.85, '#22c55e', 2),
  ];
}

function shapePeaceSymbol(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, 'none', '#8b5cf6', 2.5),
    _line(cx, cy - r, cx, cy + r, '#8b5cf6', 2),
    _line(cx, cy, cx + r*Math.cos(Math.PI/4), cy + r*Math.sin(Math.PI/4), '#8b5cf6', 2),
    _line(cx, cy, cx - r*Math.cos(Math.PI/4), cy + r*Math.sin(Math.PI/4), '#8b5cf6', 2),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 13: NATURE & LANDSCAPES (10 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeDesert(x, y, w, h) {
  const segs = [
    _rect(x, y + h*0.6, w, h*0.4, '#fef3c7', '#f59e0b', 1.5, 0),
    _path(`M ${x+w*0.15} ${y+h*0.6} Q ${x+w*0.25} ${y+h*0.2} ${x+w*0.35} ${y+h*0.6}`, '#fbbf24', '#f59e0b', 2),
    _path(`M ${x+w*0.55} ${y+h*0.6} Q ${x+w*0.65} ${y+h*0.3} ${x+w*0.75} ${y+h*0.6}`, '#fbbf24', '#f59e0b', 2),
    _circle(x + w*0.8, y + h*0.85, w*0.2, '#fbbf24', '#f59e0b', 1, 4),
  ];
  segs.push(..._sunRays(x + w*0.8, y + h*0.85, w*0.2, h*0.15));
  return segs;
}

function _sunRays(cx, cy, rw, rh) {
  const segs = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6;
    segs.push(_line(cx + Math.cos(ang)*rw*0.5, cy + Math.sin(ang)*rh*0.5, cx + Math.cos(ang)*rw*0.8, cy + Math.sin(ang)*rh*0.8, '#f59e0b', 1));
  }
  return segs;
}

function shapeRiver(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.2} Q ${x+w*0.3} ${y+h*0.35} ${x+w*0.5} ${y+h*0.3} Q ${x+w*0.7} ${y+h*0.25} ${x+w} ${y+h*0.4}`, '#3b82f6', '#60a5fa', 2),
    _path(`M ${x} ${y+h*0.2} Q ${x+w*0.25} ${y+h*0.25} ${x+w*0.5} ${y+h*0.38} Q ${x+w*0.75} ${y+h*0.35} ${x+w} ${y+h*0.4}`, '#60a5fa', '#93c5fd', 1.5),
    _rect(x, y + h*0.6, w, h*0.4, '#22c55e', '#16a34a', 1, 0),
  ];
}

function shapeWaterfall(x, y, w, h) {
  return [
    _rect(x, y, w*0.4, h*0.5, '#475569', '#334155', 2, 4),
    _rect(x + w*0.6, y, w*0.4, h*0.5, '#475569', '#334155', 2, 4),
    _line(x + w*0.2, y + h*0.5, x + w*0.2, y + h, '#93c5fd', 2.5),
    _line(x + w*0.3, y + h*0.5, x + w*0.3, y + h*0.95, '#60a5fa', 2),
    _line(x + w*0.7, y + h*0.5, x + w*0.7, y + h, '#93c5fd', 2.5),
    _line(x + w*0.8, y + h*0.5, x + w*0.8, y + h*0.95, '#60a5fa', 2),
    _rect(x, y + h*0.85, w, h*0.15, '#3b82f6', '#1d4ed8', 1, 0),
  ];
}

function shapeForest(x, y, w, h) {
  const segs = [_rect(x, y + h*0.6, w, h*0.4, '#22c55e', '#16a34a', 1, 0)];
  const trees = [
    {x: w*0.15, h: 0.4}, {x: w*0.35, h: 0.55}, {x: w*0.55, h: 0.45}, {x: w*0.75, h: 0.5}, {x: w*0.9, h: 0.35},
  ];
  for (const t of trees) {
    segs.push(_path(`M ${x+t.x-w*0.08} ${y+h*0.6} L ${x+t.x} ${y+h*(1-t.h)} L ${x+t.x+w*0.08} ${y+h*0.6}`, '#16a34a', '#22c55e', 1.5));
  }
  return segs;
}

function shapeIsland(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.85} Q ${x+w*0.5} ${y+h*0.7} ${x+w} ${y+h*0.85} Q ${x+w} ${y+h} ${x} ${y+h} Z`, '#fbbf24', '#f59e0b', 1.5),
    _path(`M ${x} ${y+h*0.82} Q ${x+w*0.5} ${y+h*0.65} ${x+w} ${y+h*0.82}`, '#22c55e', '#16a34a', 2),
    _path(`M ${x+w*0.5} ${y+h*0.75} Q ${x+w*0.45} ${y+h*0.35} ${x+w*0.5} ${y+h*0.65}`, '#16a34a', '#22c55e', 3),
    _circle(x + w*0.55, y + h*0.3, w*0.06, '#4ade80', '#22c55e', 1),
  ];
}

function shapeIceberg(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y+h*0.85} Q ${x+w*0.15} ${y+h*0.4} ${x+w*0.35} ${y+h*0.25} L ${x+w*0.5} ${y+h*0.1} L ${x+w*0.6} ${y+h*0.2} Q ${x+w*0.75} ${y+h*0.35} ${x+w*0.8} ${y+h*0.85}`, '#e0f2fe', '#93c5fd', 2),
    _path(`M ${x+w*0.2} ${y+h*0.85} L ${x+w*0.8} ${y+h*0.85} Q ${x+w*0.85} ${y+h} ${x+w*0.15} ${y+h} Z`, '#bae6fd', '#60a5fa', 1.5),
    _line(x + w*0.35, y + h*0.4, x + w*0.65, y + h*0.5, '#60a5fa', 1),
    _line(x + w*0.28, y + h*0.6, x + w*0.7, y + h*0.65, '#60a5fa', 1),
  ];
}

function shapeGeyser(x, y, w, h) {
  return [
    _rect(x + w*0.35, y + h*0.65, w*0.3, h*0.3, '#78716c', '#57534e', 2, 6),
    _circle(x + w*0.5, y + h*0.55, w*0.08, '#60a5fa', '#3b82f6', 1.5),
    _path(`M ${x+w*0.45} ${y+h*0.45} Q ${x+w*0.5} ${y+h*0.1} ${x+w*0.55} ${y+h*0.45}`, '#93c5fd', 'none', 2),
    _circle(x + w*0.48, y + h*0.15, 4, '#93c5fd', '#60a5fa', 0.5),
    _circle(x + w*0.53, y + h*0.25, 3, '#93c5fd', '#60a5fa', 0.5),
    _circle(x + w*0.45, y + h*0.2, 3, '#93c5fd', '#60a5fa', 0.5),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 14: FANTASY CHARACTERS (8 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeMermaid(x, y, w, h) {
  const cx = x + w/2;
  return [
    _circle(cx, y + h*0.18, w*0.1, '#fef3c7', '#d97706', 2),
    _line(cx, y + h*0.28, cx, y + h*0.55, '#fef3c7', 3),
    _line(cx, y + h*0.38, cx - w*0.08, y + h*0.42, '#fef3c7', 2),
    _line(cx, y + h*0.38, cx + w*0.08, y + h*0.42, '#fef3c7', 2),
    _path(`M ${cx-w*0.02} ${y+h*0.55} Q ${cx-w*0.12} ${y+h*0.8} ${cx-w*0.08} ${y+h*0.9} Q ${cx} ${y+h*0.85} ${cx+w*0.1} ${y+h*0.9} Q ${cx+w*0.12} ${y+h*0.8} ${cx+w*0.02} ${y+h*0.55}`, '#22c55e', '#16a34a', 2),
    _circle(cx - w*0.03, y + h*0.16, 2.5, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.03, y + h*0.16, 2.5, '#1e293b', '#1e293b', 0.5),
    // Tail fin
    _path(`M ${cx-w*0.08} ${y+h*0.9} L ${cx-w*0.18} ${y+h} L ${cx-w*0.04} ${y+h*0.95} L ${cx+w*0.1} ${y+h} L ${cx+w*0.08} ${y+h*0.9}`, '#22c55e', '#4ade80', 1.5),
  ];
}

function shapeGriffin(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.2, h*0.18, '#fbbf24', '#d97706', 2),
    _path(`M ${cx-w*0.1} ${cy-h*0.05} L ${cx-w*0.2} ${cy-h*0.12} L ${cx-w*0.08} ${cy}`, '#fbbf24', '#d97706', 2),
    _path(`M ${cx+w*0.1} ${cy-h*0.05} L ${cx+w*0.2} ${cy-h*0.12} L ${cx+w*0.08} ${cy}`, '#fbbf24', '#d97706', 2),
    _circle(cx - w*0.05, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.05, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5),
    // Wings
    _path(`M ${cx-w*0.12} ${cy-h*0.05} Q ${cx-w*0.3} ${cy-h*0.35} ${cx-w*0.35} ${cy-h*0.15}`, '#fbbf24', '#d97706', 2),
    _path(`M ${cx+w*0.12} ${cy-h*0.05} Q ${cx+w*0.3} ${cy-h*0.35} ${cx+w*0.35} ${cy-h*0.15}`, '#fbbf24', '#d97706', 2),
    // Body
    _ellipse(cx, cy + h*0.3, w*0.15, h*0.25, '#fbbf24', '#d97706', 1.5),
  ];
}

function shapePegasus(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.2, h*0.18, '#ffffff', '#cbd5e1', 2),
    _path(`M ${cx-w*0.12} ${cy-h*0.02} L ${cx-w*0.22} ${cy-h*0.08} L ${cx-w*0.1} ${cy+h*0.02}`, '#cbd5e1', 'none', 2),
    _path(`M ${cx+w*0.12} ${cy-h*0.02} L ${cx+w*0.22} ${cy-h*0.08} L ${cx+w*0.1} ${cy+h*0.02}`, '#cbd5e1', 'none', 2),
    _circle(cx - w*0.05, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5),
    _circle(cx + w*0.05, cy + h*0.02, 2.5, '#1e293b', '#1e293b', 0.5),
    _line(cx, cy - h*0.15, cx, cy - h*0.35, '#cbd5e1', 2),
    _circle(cx, cy - h*0.38, 3, '#fbbf24', '#f59e0b', 1),
    // Wings
    _path(`M ${cx-w*0.15} ${cy-h*0.05} Q ${cx-w*0.35} ${cy-h*0.4} ${cx-w*0.4} ${cy-h*0.2}`, '#ffffff', '#cbd5e1', 2),
    _path(`M ${cx+w*0.15} ${cy-h*0.05} Q ${cx+w*0.35} ${cy-h*0.4} ${cx+w*0.4} ${cy-h*0.2}`, '#ffffff', '#cbd5e1', 2),
    _ellipse(cx, cy + h*0.3, w*0.15, h*0.25, '#ffffff', '#cbd5e1', 1.5),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY 15: HUMAN BODY (6 shapes)
// ═══════════════════════════════════════════════════════════════════════════

function shapeSkeleton(x, y, w, h) {
  const cx = x + w/2;
  return [
    _circle(cx, y + h*0.1, w*0.08, '#e2e8f0', '#94a3b8', 2),
    _line(cx, y + h*0.18, cx, y + h*0.45, '#94a3b8', 2),
    _line(cx, y + h*0.25, cx - w*0.1, y + h*0.35, '#94a3b8', 1.5),
    _line(cx, y + h*0.25, cx + w*0.1, y + h*0.35, '#94a3b8', 1.5),
    _line(cx - w*0.03, y + h*0.45, cx - w*0.05, y + h*0.7, '#94a3b8', 1.5),
    _line(cx + w*0.03, y + h*0.45, cx + w*0.05, y + h*0.7, '#94a3b8', 1.5),
    _circle(cx - w*0.04, y + h*0.72, 3, '#e2e8f0', '#94a3b8', 1),
    _circle(cx + w*0.04, y + h*0.72, 3, '#e2e8f0', '#94a3b8', 1),
  ];
}

function shapeEyeDiagram(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy, w*0.35, h*0.3, '#ffffff', '#1e293b', 2),
    _circle(cx, cy, w*0.12, '#3b82f6', '#1d4ed8', 2),
    _circle(cx, cy, w*0.05, '#1e293b', '#0f172a', 2),
    _circle(cx, cy, w*0.02, '#ffffff', '#ffffff', 0),
  ];
}

function shapeEarDiagram(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx+w*0.05} ${y+h*0.1} Q ${cx-w*0.15} ${y+h*0.15} ${cx-w*0.2} ${y+h*0.5} Q ${cx-w*0.22} ${y+h*0.85} ${cx+w*0.05} ${y+h*0.9} Q ${cx+w*0.15} ${y+h*0.85} ${cx+w*0.15} ${y+h*0.5} Q ${cx+w*0.15} ${y+h*0.15} ${cx+w*0.05} ${y+h*0.1}`, '#fef3c7', '#d97706', 2),
    _path(`M ${cx-w*0.08} ${y+h*0.3} Q ${cx-w*0.02} ${y+h*0.35} ${cx} ${y+h*0.5}`, '#d97706', 'none', 1),
    _path(`M ${cx-w*0.06} ${y+h*0.55} Q ${cx-w*0.02} ${y+h*0.6} ${cx} ${y+h*0.6}`, '#d97706', 'none', 1),
  ];
}

function shapeTooth(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx-w*0.12} ${y+h*0.3} Q ${cx-w*0.15} ${y+h*0.05} ${cx} ${y} Q ${cx+w*0.15} ${y+h*0.05} ${cx+w*0.12} ${y+h*0.3} L ${cx+w*0.08} ${y+h*0.85} Q ${cx} ${y+h*0.9} ${cx-w*0.08} ${y+h*0.85} Z`, '#ffffff', '#94a3b8', 2),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const EXPANDED_SHAPES = {
  // Animals
  'cat': shapeCat, 'dog': shapeDog, 'horse': shapeHorse, 'elephant': shapeElephant,
  'lion': shapeLion, 'tiger': shapeTiger, 'bear': shapeBear, 'wolf': shapeWolf,
  'fox': shapeFox, 'rabbit': shapeRabbit, 'turtle': shapeTurtle, 'frog': shapeFrog,
  'snake': shapeSnake, 'eagle': shapeEagle, 'owl': shapeOwl, 'penguin': shapePenguin,
  'dolphin': shapeDolphin, 'octopus': shapeOctopus, 'starfish': shapeStarfish, 'seahorse': shapeSeahorse,
  'squirrel': shapeSquirrel, 'monkey': shapeMonkey, 'panda': shapePanda, 'kangaroo': shapeKangaroo,
  'koala': shapeKoala, 'giraffe': shapeGiraffe, 'bee': shapeBee, 'ladybug': shapeLadybug,

  // Plants
  'cactus': shapeCactus, 'palm_tree': shapePalmTree, 'fern': shapeFern, 'bamboo': shapeBamboo,
  'rose': shapeRose, 'tulip': shapeTulip, 'sunflower': shapeSunflower,
  'carnivorous_plant': shapeCarnivorousPlant, 'vine': shapeVine,
  'aloe': shapeAloe, 'bonsai': shapeBonsai, 'succulent': shapeSucculent,

  // Tech
  'drone': shapeDrone, 'robot': shapeRobot, 'ai_chip': shapeAIChip,
  'smartwatch': shapeSmartwatch, 'vr_headset': shapeVRHeadset,
  'printer': shapePrinter, 'router': shapeRouter, 'gaming_console': shapeGamingConsole,
  'qr_code': shapeQRCode, 'barcode': shapeBarcode,

  // Math
  'trig_circle': shapeTrigCircle, 'sine_wave': shapeSineWave, 'parabola': shapeParabola,
  'hyperbola': shapeHyperbola, 'integral_area': shapeIntegralArea, 'matrix': shapeMatrix,
  'vector_arrow': shapeVectorArrow, 'complex_plane': shapeComplexPlane,
  'graph_nodes': shapeGraphNodes, 'derivative_graph': shapeDerivativeGraph,

  // Music
  'guitar': shapeGuitar, 'violin': shapeViolin, 'drum_set': shapeDrumSet,
  'trumpet': shapeTrumpet, 'saxophone': shapeSaxophone, 'microphone': shapeMicrophone,
  'vinyl_record': shapeVinylRecord, 'harp': shapeHarp,

  // Architecture
  'skyscraper': shapeSkyscraper, 'pagoda': shapePagoda, 'colosseum': shapeColosseum,
  'windmill': shapeWindmill, 'dam': shapeDam, 'obelisk': shapeObelisk,

  // Sports
  'tennis_racket': shapeTennisRacket, 'baseball_bat': shapeBaseballBat,
  'bicycle': shapeBicycle, 'archery': shapeArchery,
  'weightlifting': shapeWeightlifting, 'gymnastics_rings': shapeGymnasticsRings,

  // Food
  'pizza': shapePizza, 'burger': shapeBurger, 'cake': shapeCake, 'ice_cream': shapeIceCream,
  'coffee': shapeCoffee, 'tea': shapeTea, 'apple': shapeApple, 'orange': shapeOrange,
  'bread': shapeBread, 'cheese': shapeCheese, 'french_fries': shapeFrenchFries,
  'taco': shapeTaco, 'hot_dog': shapeHotDog,

  // Medical
  'stethoscope': shapeStethoscope, 'syringe': shapeSyringe, 'pill': shapePill,
  'bandage': shapeBandage, 'dna_vial': shapeDNAVial,

  // Abstract
  'kaleidoscope': shapeKaleidoscope, 'tessellation': shapeTessellation,
  'mobius_strip': shapeMobiusStrip, 'fractal_tree': shapeFractalTree,
  'rosette': shapeRosette, 'yin_yang': shapeYinYang, 'infinity': shapeInfinity,
  'tree_of_life': shapeTreeOfLife,

  // Science Tools
  'thermometer': shapeThermometer, 'barometer': shapeBarometer,
  'microscope_side': shapeMicroscopeSide, 'pipette': shapePipette,
  'centrifuge': shapeCentrifuge,

  // Mythology
  'thor_hammer': shapeThorHammer, 'ankh': shapeAnkh, 'om_symbol': shapeOm,
  'lotus': shapeLotus, 'peace_symbol': shapePeaceSymbol,

  // Fantasy
  'mermaid': shapeMermaid, 'griffin': shapeGriffin, 'pegasus': shapePegasus,

  // Human Body
  'skeleton': shapeSkeleton, 'eye_diagram': shapeEyeDiagram,
  'ear_diagram': shapeEarDiagram, 'tooth': shapeTooth,

  // Nature
  'desert': shapeDesert, 'river': shapeRiver, 'waterfall': shapeWaterfall,
  'forest': shapeForest, 'island': shapeIsland, 'iceberg': shapeIceberg,
  'geyser': shapeGeyser,
};

export const EXPANDED_ALIASES = {
  // Animals
  'cat': 'cat', 'kitty': 'cat', 'feline': 'cat',
  'dog': 'dog', 'puppy': 'dog', 'canine': 'dog',
  'horse': 'horse', 'pony': 'horse',
  'elephant': 'elephant', 'ele': 'elephant',
  'lion': 'lion', 'king': 'lion',
  'tiger': 'tiger', 'big cat': 'tiger',
  'bear': 'bear', 'teddy': 'bear',
  'wolf': 'wolf', 'wolf howl': 'wolf',
  'fox': 'fox', 'foxy': 'fox',
  'rabbit': 'rabbit', 'bunny': 'rabbit', 'hare': 'rabbit',
  'turtle': 'turtle', 'tortoise': 'turtle',
  'frog': 'frog', 'toad': 'frog',
  'snake': 'snake', 'serpent': 'snake',
  'eagle': 'eagle', 'bird of prey': 'eagle', 'hawk': 'eagle',
  'owl': 'owl', 'wise owl': 'owl',
  'penguin': 'penguin', 'penguin bird': 'penguin',
  'dolphin': 'dolphin', 'sea mammal': 'dolphin',
  'octopus': 'octopus', 'squid': 'octopus', 'tentacles': 'octopus',
  'star fish': 'starfish', 'star': 'starfish',
  'sea horse': 'seahorse', 'seahorse': 'seahorse',
  'squirrel': 'squirrel', 'chipmunk': 'squirrel',
  'monkey': 'monkey', 'ape': 'monkey', 'primate': 'monkey',
  'panda': 'panda', 'panda bear': 'panda',
  'kangaroo': 'kangaroo', 'roo': 'kangaroo',
  'koala': 'koala', 'koala bear': 'koala',
  'giraffe': 'giraffe', 'long neck': 'giraffe',
  'bee': 'bee', 'honey bee': 'bee', 'bumblebee': 'bee',
  'ladybug': 'ladybug', 'lady bird': 'ladybug',

  // Plants
  'cactus': 'cactus', 'cacti': 'cactus',
  'palm tree': 'palm_tree', 'palm': 'palm_tree', 'tropical tree': 'palm_tree',
  'fern': 'fern', 'ferny': 'fern',
  'bamboo': 'bamboo', 'bamboo cane': 'bamboo',
  'rose': 'rose', 'rose flower': 'rose',
  'tulip': 'tulip', 'tulip flower': 'tulip',
  'sunflower': 'sunflower', 'sun flower': 'sunflower',
  'venus flytrap': 'carnivorous_plant', 'carnivorous': 'carnivorous_plant',
  'vine': 'vine', 'climbing plant': 'vine', 'ivy': 'vine',
  'aloe': 'aloe', 'aloe vera': 'aloe',
  'bonsai': 'bonsai', 'bonsai tree': 'bonsai',
  'succulent': 'succulent', 'succulent plant': 'succulent',

  // Tech
  'drone': 'drone', 'quadcopter': 'drone', 'uav': 'drone',
  'robot': 'robot', 'android': 'robot', 'bot': 'robot',
  'ai chip': 'ai_chip', 'processor': 'ai_chip', 'cpu': 'ai_chip',
  'smart watch': 'smartwatch', 'smartwatch': 'smartwatch',
  'vr headset': 'vr_headset', 'virtual reality': 'vr_headset',
  'printer': 'printer', '3d printer': 'printer',
  'router': 'router', 'wifi router': 'router',
  'game console': 'gaming_console', 'controller': 'gaming_console',
  'qr code': 'qr_code', 'qr': 'qr_code',
  'barcode': 'barcode', 'bar code': 'barcode',

  // Math
  'trig circle': 'trig_circle', 'unit circle': 'trig_circle',
  'sine wave': 'sine_wave', 'sin wave': 'sine_wave', 'oscillation': 'sine_wave',
  'parabola': 'parabola', 'quadratic': 'parabola', 'u shape': 'parabola',
  'hyperbola': 'hyperbola', 'hyperbolic': 'hyperbola',
  'integral': 'integral_area', 'integration': 'integral_area',
  'matrix': 'matrix', 'array math': 'matrix',
  'vector': 'vector_arrow', 'vector arrow': 'vector_arrow',
  'complex plane': 'complex_plane', 'argand': 'complex_plane',
  'graph nodes': 'graph_nodes', 'network graph': 'graph_nodes',
  'derivative': 'derivative_graph', 'differentiation': 'derivative_graph',

  // Music
  'guitar': 'guitar', 'electric guitar': 'guitar',
  'violin': 'violin', 'fiddle': 'violin',
  'drums': 'drum_set', 'drum kit': 'drum_set',
  'trumpet': 'trumpet', 'brass': 'trumpet',
  'saxophone': 'saxophone', 'sax': 'saxophone',
  'microphone': 'microphone', 'mic': 'microphone', 'mike': 'microphone',
  'vinyl': 'vinyl_record', 'record': 'vinyl_record',
  'harp': 'harp', 'string instrument': 'harp',

  // Architecture
  'skyscraper': 'skyscraper', 'tall building': 'skyscraper', 'sky scraper': 'skyscraper',
  'pagoda': 'pagoda', 'temple': 'pagoda', 'japanese building': 'pagoda',
  'colosseum': 'colosseum', 'amphitheatre': 'colosseum', 'rome': 'colosseum',
  'windmill': 'windmill', 'wind turbine': 'windmill',
  'dam': 'dam', 'hydro dam': 'dam', 'reservoir': 'dam',
  'obelisk': 'obelisk', 'monument': 'obelisk',

  // Sports
  'tennis': 'tennis_racket', 'racket': 'tennis_racket',
  'baseball': 'baseball_bat', 'baseball bat': 'baseball_bat',
  'bicycle': 'bicycle', 'bike': 'bicycle', 'cycling': 'bicycle',
  'archery': 'archery', 'bow and arrow': 'archery',
  'weightlifting': 'weightlifting', 'weights': 'weightlifting', 'dumbbell': 'weightlifting',
  'gymnastics': 'gymnastics_rings', 'rings': 'gymnastics_rings',

  // Food
  'pizza': 'pizza', 'slice': 'pizza',
  'burger': 'burger', 'hamburger': 'burger',
  'cake': 'cake', 'birthday cake': 'cake',
  'ice cream': 'ice_cream', 'icecream': 'ice_cream',
  'coffee': 'coffee', 'cup of coffee': 'coffee',
  'tea': 'tea', 'tea cup': 'tea', 'chai': 'tea',
  'apple': 'apple', 'apple fruit': 'apple',
  'orange': 'orange', 'orange fruit': 'orange',
  'bread': 'bread', 'loaf': 'bread',
  'cheese': 'cheese', 'cheese wedge': 'cheese',
  'fries': 'french_fries', 'french fries': 'french_fries', 'chips': 'french_fries',
  'taco': 'taco', 'mexican': 'taco',
  'hot dog': 'hot_dog', 'hotdog': 'hot_dog',

  // Medical
  'stethoscope': 'stethoscope', 'doctor': 'stethoscope',
  'syringe': 'syringe', 'needle': 'syringe',
  'pill': 'pill', 'capsule': 'pill', 'medicine': 'pill',
  'bandage': 'bandage', 'plaster': 'bandage',
  'dna vial': 'dna_vial', 'test tube': 'dna_vial',

  // Abstract
  'kaleidoscope': 'kaleidoscope', 'kaleidoscopic': 'kaleidoscope',
  'tessellation': 'tessellation', 'tiling': 'tessellation',
  'mobius': 'mobius_strip', 'mobius strip': 'mobius_strip',
  'fractal': 'fractal_tree', 'fractal tree': 'fractal_tree',
  'rosette': 'rosette', 'flower pattern': 'rosette',
  'yin yang': 'yin_yang', 'balance': 'yin_yang',
  'infinity': 'infinity', 'infinity symbol': 'infinity',
  'tree of life': 'tree_of_life', 'life tree': 'tree_of_life',

  // Science tools
  'thermometer': 'thermometer', 'temperature': 'thermometer',
  'barometer': 'barometer', 'pressure': 'barometer',
  'microscope side': 'microscope_side', 'lab microscope': 'microscope_side',
  'pipette': 'pipette', 'dropper': 'pipette',
  'centrifuge': 'centrifuge', 'spin': 'centrifuge',

  // Mythology
  'thor hammer': 'thor_hammer', 'mjolnir': 'thor_hammer',
  'ankh': 'ankh', 'key of life': 'ankh',
  'om': 'om_symbol', 'aum': 'om_symbol',
  'lotus': 'lotus', 'lotus flower': 'lotus',
  'peace': 'peace_symbol', 'peace sign': 'peace_symbol',

  // Fantasy
  'mermaid': 'mermaid', 'mermaid tail': 'mermaid',
  'griffin': 'griffin', 'gryphon': 'griffin',
  'pegasus': 'pegasus', 'winged horse': 'pegasus',

  // Body
  'skeleton': 'skeleton', 'bone': 'skeleton',
  'eye': 'eye_diagram', 'eye diagram': 'eye_diagram',
  'ear': 'ear_diagram', 'ear diagram': 'ear_diagram',
  'tooth': 'tooth', 'teeth': 'tooth',

  // Nature
  'desert': 'desert', 'sahara': 'desert',
  'river': 'river', 'stream': 'river',
  'waterfall': 'waterfall', 'falls': 'waterfall',
  'forest': 'forest', 'woods': 'forest',
  'island': 'island', 'isle': 'island',
  'iceberg': 'iceberg', 'ice': 'iceberg',
  'geyser': 'geyser', 'hot spring': 'geyser',
};
