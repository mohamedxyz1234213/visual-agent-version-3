import { registerProgrammingShapes } from './programmingShapeLibrary.js';

// =============================================================================
// MASSIVE SVG Shape Library — 500+ educational shapes for whiteboard rendering
// =============================================================================
// Organized by category. Each shape returns an array of scene fragments
// (draw_circle, draw_rect, draw_path, draw_text, draw_line) that can be
// dropped into any template slot.
//
// AI selects shapes by name/alias from this library. The template system
// resolves names via SHAPE_LIBRARY_ALIASES below.
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
// CATEGORY 1: SCIENCE & BIOLOGY (50+ shapes)
// =============================================================================

function shapeDNAAdvanced(x, y, w, h) {
  const segs = [];
  const turns = 4, ppt = 16;
  for (let i = 0; i <= turns * ppt; i++) {
    const t = i / ppt;
    const yy = y + (h * i) / (turns * ppt);
    const xOff = Math.sin(t * Math.PI * 2) * (w / 4);
    segs.push(_circle(x + w/2 - xOff, yy, 3, '#2563eb', '#1d4ed8', 1));
    segs.push(_circle(x + w/2 + xOff, yy, 3, '#dc2626', '#b91c1c', 1));
    if (i % 4 === 0) segs.push(_line(x + w/2 - xOff, yy, x + w/2 + xOff, yy, '#94a3b8', 1));
  }
  return segs;
}

function shapeCellAnimal(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.1} ${cy} Q ${x} ${y+h*0.2} ${x+w*0.3} ${y+h*0.05} Q ${x+w*0.6} ${y-h*0.02} ${x+w*0.8} ${y+h*0.15} Q ${x+w} ${y+h*0.35} ${x+w*0.95} ${cy} Q ${x+w} ${y+h*0.65} ${x+w*0.8} ${y+h*0.85} Q ${x+w*0.6} ${y+h*1.02} ${x+w*0.3} ${y+h*0.95} Q ${x} ${y+h*0.8} ${x+w*0.1} ${cy}`, '#94a3b8', '#dbeafe', 2),
    _circle(cx, cy, w*0.12, '#3b82f6', '#1d4ed8', 2),
    _circle(cx, cy, w*0.05, '#1e40af', '#1e40af', 1),
    _path(`M ${x+w*0.6} ${y+h*0.2} Q ${x+w*0.7} ${y+h*0.15} ${x+w*0.75} ${y+h*0.25} Q ${x+w*0.7} ${y+h*0.35} ${x+w*0.6} ${y+h*0.3} Z`, '#f59e0b', '#fef3c7', 1.5),
    _path(`M ${x+w*0.25} ${y+h*0.65} Q ${x+w*0.35} ${y+h*0.6} ${x+w*0.4} ${y+h*0.7} Q ${x+w*0.35} ${y+h*0.8} ${x+w*0.25} ${y+h*0.75} Z`, '#f59e0b', '#fef3c7', 1.5),
  ];
}

function shapeCellBacteria(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.1, y + h*0.25, w*0.8, h*0.5, '#dcfce7', '#16a34a', 2, 30),
    _circle(cx - w*0.2, cy, w*0.06, '#166534', '#166534', 1),
    _circle(cx + w*0.15, cy - h*0.08, w*0.04, '#166534', '#166534', 1),
    _path(`M ${x+w*0.05} ${cy} Q ${x-w*0.05} ${y+h*0.1} ${x} ${y+h*0.05}`, '#16a34a', 'none', 2),
    _path(`M ${x+w*0.08} ${cy-h*0.1} Q ${x-w*0.02} ${y} ${x+w*0.02} ${y-h*0.05}`, '#16a34a', 'none', 2),
  ];
}

function shapeMitochondria(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h/2} Q ${x} ${y} ${x+w/2} ${y} Q ${x+w} ${y} ${x+w} ${y+h/2} Q ${x+w} ${y+h} ${x+w/2} ${y+h} Q ${x} ${y+h} ${x} ${y+h/2}`, '#f59e0b', '#fef3c7', 2),
    _path(`M ${x+w*0.2} ${y+h*0.3} Q ${x+w*0.35} ${y+h*0.15} ${x+w*0.5} ${y+h*0.3} Q ${x+w*0.65} ${y+h*0.45} ${x+w*0.8} ${y+h*0.3}`, '#d97706', 'none', 1.5),
    _path(`M ${x+w*0.15} ${y+h*0.55} Q ${x+w*0.3} ${y+h*0.4} ${x+w*0.5} ${y+h*0.55} Q ${x+w*0.7} ${y+h*0.7} ${x+w*0.85} ${y+h*0.55}`, '#d97706', 'none', 1.5),
    _path(`M ${x+w*0.2} ${y+h*0.75} Q ${x+w*0.4} ${y+h*0.65} ${x+w*0.6} ${y+h*0.75} Q ${x+w*0.75} ${y+h*0.85} ${x+w*0.85} ${y+h*0.75}`, '#d97706', 'none', 1.5),
  ];
}

function shapeChloroplast(x, y, w, h) {
  return [
    _path(`M ${x+w*0.05} ${y+h/2} Q ${x} ${y} ${x+w/2} ${y} Q ${x+w} ${y} ${x+w*0.95} ${y+h/2} Q ${x+w} ${y+h} ${x+w/2} ${y+h} Q ${x} ${y+h} ${x+w*0.05} ${y+h/2}`, '#16a34a', '#86efac', 2),
    _path(`M ${x+w*0.15} ${y+h*0.35} Q ${x+w*0.25} ${y+h*0.25} ${x+w*0.4} ${y+h*0.35} Q ${x+w*0.55} ${y+h*0.45} ${x+w*0.7} ${y+h*0.35} Q ${x+w*0.8} ${y+h*0.25} ${x+w*0.85} ${y+h*0.35}`, '#15803d', 'none', 1.5),
    _path(`M ${x+w*0.15} ${y+h*0.55} Q ${x+w*0.3} ${y+h*0.45} ${x+w*0.45} ${y+h*0.55} Q ${x+w*0.6} ${y+h*0.65} ${x+w*0.85} ${y+h*0.55}`, '#15803d', 'none', 1.5),
    _path(`M ${x+w*0.15} ${y+h*0.75} Q ${x+w*0.35} ${y+h*0.65} ${x+w*0.55} ${y+h*0.75} Q ${x+w*0.75} ${y+h*0.85} ${x+w*0.85} ${y+h*0.75}`, '#15803d', 'none', 1.5),
  ];
}

function shapeEndoplasmicReticulum(x, y, w, h) {
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const yy = y + h * (0.15 + i * 0.17);
    segs.push(_path(`M ${x+w*0.1} ${yy} Q ${x+w*0.25} ${yy-h*0.08} ${x+w*0.4} ${yy} Q ${x+w*0.55} ${yy+h*0.08} ${x+w*0.7} ${yy} Q ${x+w*0.85} ${yy-h*0.08} ${x+w*0.9} ${yy}`, '#0ea5e9', 'none', 1.5));
    if (i % 2 === 0) {
      segs.push(_circle(x + w * (0.2 + i * 0.12), yy - h*0.04, 3, '#1e40af', '#1e40af', 1));
      segs.push(_circle(x + w * (0.5 + i * 0.08), yy + h*0.04, 3, '#1e40af', '#1e40af', 1));
    }
  }
  return segs;
}

function shapeRibosome(x, y, w, h) {
  return [
    _circle(x + w*0.35, y + h*0.4, w*0.2, '#a78bfa', '#7c3aed', 2),
    _circle(x + w*0.65, y + h*0.6, w*0.15, '#c4b5fd', '#8b5cf6', 2),
  ];
}

function shapeGolgiApparatus(x, y, w, h) {
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const yy = y + h * (0.2 + i * 0.15);
    segs.push(_path(`M ${x+w*0.15} ${yy} Q ${x+w*0.5} ${yy+h*0.06} ${x+w*0.85} ${yy}`, '#f97316', 'none', 2));
  }
  segs.push(_circle(x + w*0.1, y + h*0.5, w*0.06, '#fed7aa', '#f97316', 1.5));
  segs.push(_circle(x + w*0.08, y + h*0.7, w*0.05, '#fed7aa', '#f97316', 1.5));
  return segs;
}

function shapeNucleusDetailed(x, y, w, h) {
  return [
    _circle(x + w/2, y + h/2, Math.min(w,h)*0.4, '#dbeafe', '#2563eb', 2.5),
    _circle(x + w/2, y + h/2, Math.min(w,h)*0.18, '#3b82f6', '#1d4ed8', 2),
    _path(`M ${x+w*0.2} ${y+h*0.3} Q ${x+w*0.3} ${y+h*0.25} ${x+w*0.4} ${y+h*0.3} Q ${x+w*0.5} ${y+h*0.35} ${x+w*0.6} ${y+h*0.3}`, '#60a5fa', 'none', 1),
    _path(`M ${x+w*0.25} ${y+h*0.6} Q ${x+w*0.35} ${y+h*0.55} ${x+w*0.45} ${y+h*0.6} Q ${x+w*0.55} ${y+h*0.65} ${x+w*0.7} ${y+h*0.6}`, '#60a5fa', 'none', 1),
  ];
}

function shapeVirus(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.3;
  const segs = [_circle(cx, cy, r, '#fee2e2', '#dc2626', 2)];
  const spikes = 12;
  for (let i = 0; i < spikes; i++) {
    const ang = (2 * Math.PI * i) / spikes;
    const sx = cx + Math.cos(ang) * r;
    const sy = cy + Math.sin(ang) * r;
    const ex = cx + Math.cos(ang) * (r + w*0.1);
    const ey = cy + Math.sin(ang) * (r + w*0.1);
    segs.push(_line(sx, sy, ex, ey, '#dc2626', 2));
    segs.push(_circle(ex, ey, 4, '#ef4444', '#dc2626', 1));
  }
  return segs;
}

function shapeAntibody(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy - h*0.15, w*0.12, '#dbeafe', '#2563eb', 2),
    _circle(cx - w*0.15, cy + h*0.2, w*0.1, '#dbeafe', '#2563eb', 2),
    _circle(cx + w*0.15, cy + h*0.2, w*0.1, '#dbeafe', '#2563eb', 2),
    _line(cx, cy - h*0.03, cx - w*0.15, cy + h*0.1, '#2563eb', 2),
    _line(cx, cy - h*0.03, cx + w*0.15, cy + h*0.1, '#2563eb', 2),
    _path(`M ${cx-w*0.15} ${cy+h*0.1} Q ${cx} ${cy+h*0.05} ${cx+w*0.15} ${cy+h*0.1}`, '#2563eb', 'none', 2),
  ];
}

function shapeStemCell(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.35, '#fef3c7', '#f59e0b', 2.5),
    _circle(cx, cy, Math.min(w,h)*0.15, '#fbbf24', '#d97706', 2),
    _arrow(cx + w*0.35, cy, cx + w*0.5, cy - h*0.15, '#16a34a', 2),
    _arrow(cx + w*0.35, cy, cx + w*0.5, cy + h*0.15, '#2563eb', 2),
    _circle(cx + w*0.55, cy - h*0.15, 8, '#dcfce7', '#16a34a', 1.5),
    _circle(cx + w*0.55, cy + h*0.15, 8, '#dbeafe', '#2563eb', 1.5),
  ];
}

function shapeWhiteBloodCell(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.2} ${cy} Q ${x+w*0.1} ${y+h*0.15} ${x+w*0.35} ${y+h*0.1} Q ${x+w*0.6} ${y-h*0.02} ${x+w*0.8} ${y+h*0.2} Q ${x+w*1.02} ${y+h*0.4} ${x+w*0.9} ${cy} Q ${x+w*1.02} ${y+h*0.65} ${x+w*0.75} ${y+h*0.85} Q ${x+w*0.5} ${y+h*1.02} ${x+w*0.25} ${y+h*0.9} Q ${x} ${y+h*0.7} ${x+w*0.1} ${y+h*0.5} Q ${x-w*0.02} ${y+h*0.3} ${x+w*0.2} ${cy}`, '#e0f2fe', '#0ea5e9', 2),
    _circle(cx - w*0.08, cy - h*0.05, w*0.08, '#0284c7', '#0369a1', 1.5),
    _circle(cx + w*0.08, cy + h*0.03, w*0.06, '#0284c7', '#0369a1', 1.5),
  ];
}

function shapeRedBloodCell(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, '#fca5a5', '#dc2626', 2),
    _circle(cx, cy, r*0.5, '#fecaca', '#dc2626', 1.5),
  ];
}

function shapePlatelet(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${y+h*0.15} L ${x+w*0.8} ${cy} L ${cx} ${y+h*0.85} L ${x+w*0.2} ${cy} Z`, '#fde68a', '#f59e0b', 2),
    _circle(cx, cy, w*0.06, '#d97706', '#b45309', 1),
  ];
}

function shapeNeuronDetailed(x, y, w, h) {
  const cx = x + w*0.35, cy = y + h*0.45;
  const segs = [
    _circle(cx, cy, w*0.12, '#fef3c7', '#f59e0b', 2.5),
    _circle(cx, cy, w*0.05, '#fbbf24', '#d97706', 1.5),
  ];
  for (let i = 0; i < 6; i++) {
    const ang = Math.PI * 1.5 + (Math.PI / 6) * i - Math.PI/3;
    const len = w * 0.25;
    const ex = cx + Math.cos(ang) * len;
    const ey = cy + Math.sin(ang) * len;
    segs.push(_path(`M ${cx + Math.cos(ang)*w*0.12} ${cy + Math.sin(ang)*w*0.12} Q ${cx + Math.cos(ang)*len*0.6} ${cy + Math.sin(ang)*len*0.6} ${ex} ${ey}`, '#f59e0b', 'none', 2));
    for (let j = 1; j <= 2; j++) {
      const bx = cx + Math.cos(ang) * len * (0.5 + j*0.2);
      const by = cy + Math.sin(ang) * len * (0.5 + j*0.2);
      const bAng = ang + (j % 2 ? 0.5 : -0.5);
      segs.push(_line(bx, by, bx + Math.cos(bAng)*10, by + Math.sin(bAng)*10, '#f59e0b', 1.5));
    }
  }
  segs.push(_line(cx, cy + w*0.12, cx, cy + h*0.45, '#f59e0b', 3));
  for (let i = 0; i < 3; i++) {
    const tx = cx + (i - 1) * w*0.06;
    const ty = cy + h*0.45;
    segs.push(_circle(tx, ty, 5, '#f59e0b', '#d97706', 1.5));
  }
  return segs;
}

function shapeSynapse(x, y, w, h) {
  return [
    _circle(x + w*0.25, y + h*0.3, w*0.18, '#fef3c7', '#f59e0b', 2),
    _path(`M ${x+w*0.43} ${y+h*0.3} Q ${x+w*0.6} ${y+h*0.25} ${x+w*0.75} ${y+h*0.35}`, '#f59e0b', 'none', 2),
    _circle(x + w*0.75, y + h*0.35, 4, '#f59e0b', '#d97706', 1),
    _circle(x + w*0.85, y + h*0.5, w*0.08, '#fef3c7', '#f59e0b', 1.5),
    _path(`M ${x+w*0.75} ${y+h*0.38} l 5 -3 l 5 3 l -5 3 z`, '#22c55e', '#16a34a', 1),
  ];
}

function shapeHeartOrgan(x, y, w, h) {
  const cx = x + w/2, cy = y + h*0.45;
  return [
    _path(`M ${cx} ${y+h*0.8} Q ${x+w*0.05} ${y+h*0.5} ${x+w*0.2} ${y+h*0.2} Q ${x+w*0.35} ${y} ${cx} ${y+h*0.15} Q ${x+w*0.65} ${y} ${x+w*0.8} ${y+h*0.2} Q ${x+w*0.95} ${y+h*0.5} ${cx} ${y+h*0.8}`, '#fca5a5', '#dc2626', 2.5),
    _path(`M ${x+w*0.35} ${y+h*0.35} L ${x+w*0.5} ${y+h*0.2} L ${x+w*0.65} ${y+h*0.35}`, '#ef4444', 'none', 1.5),
    _line(x + w*0.5, y + h*0.2, x + w*0.5, y + h*0.6, '#ef4444', 1.5),
  ];
}

function shapeLung(x, y, w, h) {
  const cx = x + w/2;
  return [
    _line(cx, y + h*0.05, cx, y + h*0.35, '#94a3b8', 2),
    _path(`M ${cx} ${y+h*0.35} Q ${x+w*0.15} ${y+h*0.3} ${x+w*0.1} ${y+h*0.55} Q ${x} ${y+h*0.8} ${x+w*0.2} ${y+h*0.9} Q ${x+w*0.35} ${y+h*0.95} ${cx} ${y+h*0.7}`, '#fca5a5', '#fca5a5', 2),
    _path(`M ${cx} ${y+h*0.35} Q ${x+w*0.85} ${y+h*0.3} ${x+w*0.9} ${y+h*0.55} Q ${x+w} ${y+h*0.8} ${x+w*0.8} ${y+h*0.9} Q ${x+w*0.65} ${y+h*0.95} ${cx} ${y+h*0.7}`, '#fca5a5', '#fca5a5', 2),
  ];
}

function shapeBrain(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${y+h*0.15} Q ${x+w*0.2} ${y} ${x+w*0.45} ${y+h*0.08} Q ${x+w*0.7} ${y-h*0.05} ${x+w*0.85} ${y+h*0.2} Q ${x+w} ${y+h*0.4} ${x+w*0.9} ${cy} Q ${x+w} ${y+h*0.65} ${x+w*0.8} ${y+h*0.85} Q ${x+w*0.6} ${y+h} ${cx} ${y+h*0.9} Q ${x+w*0.35} ${y+h} ${x+w*0.2} ${y+h*0.85} Q ${x} ${y+h*0.65} ${x+w*0.1} ${cy} Q ${x-w*0.02} ${y+h*0.4} ${x+w*0.15} ${y+h*0.2} Q ${x+w*0.3} ${y} ${cx} ${y+h*0.15}`, '#fce7f3', '#db2777', 2),
    _line(cx, y + h*0.12, cx, y + h*0.88, '#db2777', 1.5),
    _path(`M ${cx} ${y+h*0.3} Q ${x+w*0.3} ${y+h*0.25} ${x+w*0.2} ${y+h*0.35}`, '#db2777', 'none', 1.5),
    _path(`M ${cx} ${y+h*0.5} Q ${x+w*0.3} ${y+h*0.45} ${x+w*0.15} ${y+h*0.55}`, '#db2777', 'none', 1.5),
    _path(`M ${cx} ${y+h*0.3} Q ${x+w*0.7} ${y+h*0.25} ${x+w*0.8} ${y+h*0.35}`, '#db2777', 'none', 1.5),
    _path(`M ${cx} ${y+h*0.5} Q ${x+w*0.7} ${y+h*0.45} ${x+w*0.85} ${y+h*0.55}`, '#db2777', 'none', 1.5),
    _path(`M ${cx} ${y+h*0.7} Q ${x+w*0.35} ${y+h*0.65} ${x+w*0.25} ${y+h*0.75}`, '#db2777', 'none', 1),
    _path(`M ${cx} ${y+h*0.7} Q ${x+w*0.65} ${y+h*0.65} ${x+w*0.75} ${y+h*0.75}`, '#db2777', 'none', 1),
  ];
}

function shapeKidney(x, y, w, h) {
  return [
    _path(`M ${x+w*0.4} ${y+h*0.1} Q ${x+w*0.8} ${y} ${x+w*0.9} ${y+h*0.3} Q ${x+w} ${y+h*0.6} ${x+w*0.7} ${y+h*0.9} Q ${x+w*0.4} ${y+h} ${x+w*0.3} ${y+h*0.7} Q ${x+w*0.15} ${y+h*0.5} ${x+w*0.3} ${y+h*0.35} Q ${x+w*0.4} ${y+h*0.25} ${x+w*0.4} ${y+h*0.1}`, '#fecaca', '#dc2626', 2),
    _path(`M ${x+w*0.45} ${y+h*0.25} Q ${x+w*0.35} ${y+h*0.4} ${x+w*0.4} ${y+h*0.55} Q ${x+w*0.45} ${y+h*0.7} ${x+w*0.55} ${y+h*0.8}`, '#f87171', 'none', 1.5),
  ];
}

function shapeLiver(x, y, w, h) {
  const liverCy = y + h * 0.55;
  return [
    _path(`M ${x+w*0.15} ${y+h*0.3} Q ${x} ${y+h*0.1} ${x+w*0.3} ${y} Q ${x+w*0.6} ${y-h*0.05} ${x+w*0.85} ${y+h*0.15} Q ${x+w} ${y+h*0.35} ${x+w*0.9} ${liverCy} Q ${x+w*0.8} ${y+h*0.75} ${x+w*0.5} ${y+h*0.85} Q ${x+w*0.2} ${y+h*0.95} ${x+w*0.1} ${y+h*0.7} Q ${x} ${y+h*0.5} ${x+w*0.15} ${y+h*0.3}`, '#fca5a5', '#dc2626', 2),
    _path(`M ${x+w*0.4} ${y+h*0.15} Q ${x+w*0.45} ${y+h*0.35} ${x+w*0.5} ${y+h*0.55}`, '#f87171', 'none', 1),
  ];
}

function shapeStomach(x, y, w, h) {
  return [
    _path(`M ${x+w*0.35} ${y+h*0.05} Q ${x+w*0.15} ${y+h*0.1} ${x+w*0.05} ${y+h*0.35} Q ${x-w*0.02} ${y+h*0.6} ${x+w*0.15} ${y+h*0.8} Q ${x+w*0.35} ${y+h*0.95} ${x+w*0.6} ${y+h*0.85} Q ${x+w*0.85} ${y+h*0.75} ${x+w*0.9} ${y+h*0.5} Q ${x+w*0.95} ${y+h*0.25} ${x+w*0.75} ${y+h*0.1} Q ${x+w*0.6} ${y+h*0.02} ${x+w*0.45} ${y+h*0.05} L ${x+w*0.35} ${y+h*0.05}`, '#fef3c7', '#f59e0b', 2),
    _path(`M ${x+w*0.4} ${y+h*0.2} Q ${x+w*0.3} ${y+h*0.35} ${x+w*0.35} ${y+h*0.5}`, '#d97706', 'none', 1),
  ];
}

function shapeLeafDetailed(x, y, w, h) {
  return [
    _path(`M ${x+w*0.5} ${y+h*0.95} Q ${x} ${y+h*0.6} ${x+w*0.15} ${y+h*0.3} Q ${x+w*0.3} ${y} ${x+w*0.5} ${y+h*0.05} Q ${x+w*0.7} ${y} ${x+w*0.85} ${y+h*0.3} Q ${x+w} ${y+h*0.6} ${x+w*0.5} ${y+h*0.95}`, '#bbf7d0', '#16a34a', 2),
    _line(x + w*0.5, y + h*0.05, x + w*0.5, y + h*0.95, '#16a34a', 1.5),
    _path(`M ${x+w*0.5} ${y+h*0.3} Q ${x+w*0.3} ${y+h*0.25} ${x+w*0.2} ${y+h*0.35}`, '#16a34a', 'none', 1),
    _path(`M ${x+w*0.5} ${y+h*0.3} Q ${x+w*0.7} ${y+h*0.25} ${x+w*0.8} ${y+h*0.35}`, '#16a34a', 'none', 1),
    _path(`M ${x+w*0.5} ${y+h*0.5} Q ${x+w*0.3} ${y+h*0.45} ${x+w*0.15} ${y+h*0.55}`, '#16a34a', 'none', 1),
    _path(`M ${x+w*0.5} ${y+h*0.5} Q ${x+w*0.7} ${y+h*0.45} ${x+w*0.85} ${y+h*0.55}`, '#16a34a', 'none', 1),
    _path(`M ${x+w*0.5} ${y+h*0.7} Q ${x+w*0.35} ${y+h*0.65} ${x+w*0.25} ${y+h*0.72}`, '#16a34a', 'none', 1),
    _path(`M ${x+w*0.5} ${y+h*0.7} Q ${x+w*0.65} ${y+h*0.65} ${x+w*0.75} ${y+h*0.72}`, '#16a34a', 'none', 1),
  ];
}

function shapeTreeDetailed(x, y, w, h) {
  return [
    _rect(x + w*0.42, y + h*0.55, w*0.16, h*0.4, '#92400e', '#78350f', 2, 4),
    _circle(x + w*0.5, y + h*0.3, w*0.35, '#22c55e', '#16a34a', 2),
    _circle(x + w*0.3, y + h*0.35, w*0.2, '#4ade80', '#16a34a', 1.5),
    _circle(x + w*0.7, y + h*0.35, w*0.2, '#4ade80', '#16a34a', 1.5),
    _circle(x + w*0.5, y + h*0.15, w*0.15, '#86efac', '#22c55e', 1.5),
  ];
}

function shapeFlower(x, y, w, h) {
  const cx = x + w/2, cy = y + h*0.35;
  const segs = [_line(cx, y + h*0.5, cx, y + h*0.95, '#16a34a', 2.5)];
  const petalR = w * 0.15;
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6;
    const px = cx + Math.cos(ang) * petalR * 1.2;
    const py = cy + Math.sin(ang) * petalR * 1.2;
    segs.push(_circle(px, py, petalR, '#fce7f3', '#ec4899', 1.5));
  }
  segs.push(_circle(cx, cy, w*0.08, '#fbbf24', '#f59e0b', 2));
  return segs;
}

function shapeMushroom(x, y, w, h) {
  return [
    _rect(x + w*0.38, y + h*0.5, w*0.24, h*0.45, '#f5f5f4', '#a8a29e', 2, 4),
    _path(`M ${x+w*0.05} ${y+h*0.5} Q ${x} ${y+h*0.15} ${x+w*0.25} ${y+h*0.05} Q ${x+w*0.5} ${y-h*0.05} ${x+w*0.75} ${y+h*0.05} Q ${x+w} ${y+h*0.15} ${x+w*0.95} ${y+h*0.5} Z`, '#fecaca', '#dc2626', 2),
    _circle(x + w*0.3, y + h*0.25, w*0.06, '#ffffff', '#dc2626', 1),
    _circle(x + w*0.6, y + h*0.2, w*0.04, '#ffffff', '#dc2626', 1),
    _circle(x + w*0.45, y + h*0.35, w*0.03, '#ffffff', '#dc2626', 1),
  ];
}

function shapeSpider(x, y, w, h) {
  const cx = x + w/2, cy = y + h*0.4;
  const segs = [
    _ellipse(cx, cy, w*0.12, w*0.15, '#1e293b', '#1e293b', 2),
    _ellipse(cx, cy + h*0.2, w*0.08, w*0.1, '#334155', '#1e293b', 1.5),
  ];
  const legs = 4;
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < legs; i++) {
      const ang = (side === -1 ? Math.PI*0.6 : Math.PI*0.4) + (i * 0.2 * side);
      const mx = cx + Math.cos(ang) * w*0.2;
      const my = cy + Math.sin(ang) * w*0.15;
      const ex = cx + Math.cos(ang) * w*0.4;
      const ey = cy + Math.sin(ang) * w*0.35 + h*0.15;
      segs.push(_path(`M ${cx + Math.cos(ang)*w*0.12} ${cy + Math.sin(ang)*w*0.1} Q ${mx} ${my} ${ex} ${ey}`, '#1e293b', 'none', 1.5));
    }
  }
  return segs;
}

function _ellipse(cx, cy, rx, ry, fill, stroke, sw) {
  return { type: 'draw_path', d: `M ${cx-rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx+rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx-rx} ${cy}`, style: { fill, stroke, strokeWidth: sw } };
}

function shapeButterfly(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(cx - 2, y + h*0.15, 4, h*0.7, '#1e293b', '#1e293b', 1, 2),
    _path(`M ${cx} ${y+h*0.3} Q ${x+w*0.1} ${y} ${x+w*0.05} ${y+h*0.3} Q ${x-w*0.05} ${y+h*0.5} ${cx} ${y+h*0.45}`, '#c084fc', '#9333ea', 2),
    _path(`M ${cx} ${y+h*0.3} Q ${x+w*0.9} ${y} ${x+w*0.95} ${y+h*0.3} Q ${x+w*1.05} ${y+h*0.5} ${cx} ${y+h*0.45}`, '#c084fc', '#9333ea', 2),
    _path(`M ${cx} ${y+h*0.45} Q ${x+w*0.15} ${y+h*0.6} ${x+w*0.1} ${y+h*0.75} Q ${x} ${y+h*0.85} ${cx} ${y+h*0.7}`, '#a855f7', '#7e22ce', 1.5),
    _path(`M ${cx} ${y+h*0.45} Q ${x+w*0.85} ${y+h*0.6} ${x+w*0.9} ${y+h*0.75} Q ${x+w} ${y+h*0.85} ${cx} ${y+h*0.7}`, '#a855f7', '#7e22ce', 1.5),
    _circle(cx - w*0.12, y + h*0.25, 4, '#fbbf24', '#f59e0b', 1),
    _circle(cx + w*0.12, y + h*0.25, 4, '#fbbf24', '#f59e0b', 1),
  ];
}

function shapeFish(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx - w*0.05, cy, w*0.3, h*0.3, '#bfdbfe', '#2563eb', 2),
    _path(`M ${x+w*0.7} ${cy-h*0.25} L ${x+w*0.95} ${y+h*0.1} L ${x+w*0.95} ${y+h*0.9} L ${x+w*0.7} ${cy+h*0.25}`, '#93c5fd', '#2563eb', 1.5),
    _circle(cx - w*0.15, cy - h*0.05, 4, '#1e293b', '#1e293b', 1),
    _path(`M ${cx+w*0.05} ${cy+h*0.08} Q ${cx+w*0.15} ${cy+h*0.12} ${cx+w*0.25} ${cy+h*0.08}`, '#2563eb', 'none', 1),
  ];
}

function shapeBird(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy, w*0.15, h*0.2, '#fef3c7', '#f59e0b', 2),
    _path(`M ${cx+w*0.15} ${cy-h*0.1} L ${x+w*0.55} ${y+h*0.05} L ${cx+w*0.15} ${cy+h*0.05}`, '#fbbf24', '#d97706', 1.5),
    _circle(cx - w*0.05, cy - h*0.12, 3, '#1e293b', '#1e293b', 1),
    _path(`M ${cx+w*0.2} ${cy-h*0.05} L ${x+w*0.35} ${cy+h*0.02}`, '#d97706', 'none', 2),
    _path(`M ${cx-w*0.1} ${cy+h*0.2} L ${cx-w*0.05} ${y+h*0.85} L ${cx+w*0.05} ${y+h*0.85} L ${cx+w*0.1} ${cy+h*0.2}`, '#92400e', 'none', 1.5),
  ];
}

function shapeButterflyDetailed(x, y, w, h) { return shapeButterfly(x, y, w, h); }

function shapePollenGrain(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_circle(cx, cy, w*0.25, '#fef9c3', '#eab308', 2)];
  for (let i = 0; i < 8; i++) {
    const ang = (2 * Math.PI * i) / 8;
    segs.push(_circle(cx + Math.cos(ang)*w*0.25, cy + Math.sin(ang)*h*0.25, 4, '#fde047', '#eab308', 1));
  }
  return segs;
}

function shapeEcosystem(x, y, w, h) {
  return [
    _rect(x, y + h*0.6, w, h*0.4, '#dcfce7', '#16a34a', 1.5, 0),
    shapeSun(x + w*0.1, y, w*0.15, h*0.25).map(s => ({ ...s })),
    _path(`M ${x+w*0.3} ${y+h*0.6} L ${x+w*0.35} ${y+h*0.3} L ${x+w*0.4} ${y+h*0.6}`, '#16a34a', 'none', 2),
    _path(`M ${x+w*0.5} ${y+h*0.6} L ${x+w*0.55} ${y+h*0.25} L ${x+w*0.6} ${y+h*0.6}`, '#16a34a', 'none', 2),
    _path(`M ${x+w*0.7} ${y+h*0.6} L ${x+w*0.75} ${y+h*0.35} L ${x+w*0.8} ${y+h*0.6}`, '#16a34a', 'none', 2),
    _circle(x + w*0.25, y + h*0.5, 6, '#fbbf24', '#f59e0b', 1),
    _circle(x + w*0.65, y + h*0.55, 5, '#ef4444', '#dc2626', 1),
  ];
}

function shapeSun(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_circle(cx, cy, Math.min(w,h)*0.25, '#fbbf24', '#f59e0b', 2)];
  for (let i = 0; i < 8; i++) {
    const ang = (2 * Math.PI * i) / 8;
    const sx = cx + Math.cos(ang)*Math.min(w,h)*0.32;
    const sy = cy + Math.sin(ang)*Math.min(w,h)*0.32;
    const ex = cx + Math.cos(ang)*Math.min(w,h)*0.45;
    const ey = cy + Math.sin(ang)*Math.min(w,h)*0.45;
    segs.push(_line(sx, sy, ex, ey, '#f59e0b', 2));
  }
  return segs;
}

function shapeMoon(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.35, '#fef9c3', '#eab308', 2),
    _circle(cx + w*0.12, cy - h*0.05, Math.min(w,h)*0.25, '#ffffff', '#ffffff', 0),
  ];
}

function shapeCloud(x, y, w, h) {
  return [
    _circle(x + w*0.3, y + h*0.5, w*0.2, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(x + w*0.5, y + h*0.35, w*0.25, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(x + w*0.7, y + h*0.5, w*0.2, '#e0f2fe', '#0ea5e9', 1.5),
    _rect(x + w*0.15, y + h*0.5, w*0.7, h*0.25, '#e0f2fe', '#0ea5e9', 1, 10),
  ];
}

function shapeRainCloud(x, y, w, h) {
  const cloud = shapeCloud(x, y, w, h*0.6);
  const drops = [];
  for (let i = 0; i < 5; i++) {
    const dx = x + w*(0.2 + i*0.15);
    drops.push(_line(dx, y + h*0.7, dx - 4, y + h*0.9, '#3b82f6', 2));
  }
  return [...cloud, ...drops];
}

function shapeSnowflake(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI * i) / 3;
    const ex = cx + Math.cos(ang)*Math.min(w,h)*0.4;
    const ey = cy + Math.sin(ang)*Math.min(w,h)*0.4;
    segs.push(_line(cx, cy, ex, ey, '#93c5fd', 2));
    const mx = cx + Math.cos(ang)*Math.min(w,h)*0.25;
    const my = cy + Math.sin(ang)*Math.min(w,h)*0.25;
    const bAng1 = ang + Math.PI/4;
    const bAng2 = ang - Math.PI/4;
    segs.push(_line(mx, my, mx + Math.cos(bAng1)*8, my + Math.sin(bAng1)*8, '#93c5fd', 1.5));
    segs.push(_line(mx, my, mx + Math.cos(bAng2)*8, my + Math.sin(bAng2)*8, '#93c5fd', 1.5));
  }
  return segs;
}

function shapeLightning(x, y, w, h) {
  return [
    _path(`M ${x+w*0.6} ${y} L ${x+w*0.35} ${y+h*0.4} L ${x+w*0.55} ${y+h*0.4} L ${x+w*0.2} ${y+h} L ${x+w*0.4} ${y+h*0.5} L ${x+w*0.25} ${y+h*0.5} Z`, '#fbbf24', '#f59e0b', 2),
  ];
}

function shapeTornado(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y} Q ${x+w*0.5} ${y+h*0.15} ${x+w*0.8} ${y}`, '#94a3b8', 'none', 2),
    _path(`M ${x+w*0.25} ${y+h*0.2} Q ${x+w*0.5} ${y+h*0.35} ${x+w*0.75} ${y+h*0.2}`, '#94a3b8', 'none', 2),
    _path(`M ${x+w*0.3} ${y+h*0.4} Q ${x+w*0.5} ${y+h*0.55} ${x+w*0.7} ${y+h*0.4}`, '#94a3b8', 'none', 2),
    _path(`M ${x+w*0.35} ${y+h*0.6} Q ${x+w*0.5} ${y+h*0.75} ${x+w*0.65} ${y+h*0.6}`, '#94a3b8', 'none', 2),
    _path(`M ${x+w*0.4} ${y+h*0.8} Q ${x+w*0.5} ${y+h*0.95} ${x+w*0.6} ${y+h*0.8}`, '#94a3b8', 'none', 2),
  ];
}

function shapeVolcano(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h} L ${x+w*0.35} ${y+h*0.2} L ${x+w*0.45} ${y+h*0.35} L ${x+w*0.55} ${y+h*0.35} L ${x+w*0.65} ${y+h*0.2} L ${x+w} ${y+h} Z`, '#a8a29e', '#78716c', 2),
    _path(`M ${x+w*0.42} ${y+h*0.3} Q ${x+w*0.5} ${y-h*0.05} ${x+w*0.58} ${y+h*0.3}`, '#ef4444', 'none', 2),
    _circle(x + w*0.5, y + h*0.1, w*0.05, '#fbbf24', '#f59e0b', 1.5),
  ];
}

function shapeMountain(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h} L ${x+w*0.4} ${y+h*0.1} L ${x+w*0.5} ${y+h*0.3} L ${x+w*0.6} ${y+h*0.1} L ${x+w} ${y+h} Z`, '#d1d5db', '#9ca3af', 2),
    _path(`M ${x+w*0.35} ${y+h*0.15} L ${x+w*0.4} ${y+h*0.1} L ${x+w*0.45} ${y+h*0.2}`, '#ffffff', '#e5e7eb', 1.5),
    _path(`M ${x+w*0.55} ${y+h*0.15} L ${x+w*0.6} ${y+h*0.1} L ${x+w*0.65} ${y+h*0.2}`, '#ffffff', '#e5e7eb', 1.5),
  ];
}

function shapeWave(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.5} Q ${x+w*0.125} ${y+h*0.15} ${x+w*0.25} ${y+h*0.5} Q ${x+w*0.375} ${y+h*0.85} ${x+w*0.5} ${y+h*0.5} Q ${x+w*0.625} ${y+h*0.15} ${x+w*0.75} ${y+h*0.5} Q ${x+w*0.875} ${y+h*0.85} ${x+w} ${y+h*0.5}`, '#3b82f6', 'none', 2.5),
  ];
}

function shapeRockCycle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  const segs = [];
  const labels = ['Igneous', 'Sedimentary', 'Metamorphic'];
  const colors = ['#ef4444', '#f59e0b', '#8b5cf6'];
  for (let i = 0; i < 3; i++) {
    const ang = (2 * Math.PI * i) / 3 - Math.PI/2;
    const nx = cx + Math.cos(ang)*r;
    const ny = cy + Math.sin(ang)*r;
    segs.push(_circle(nx, ny, w*0.12, colors[i]+'33', colors[i], 2));
    segs.push(_text(labels[i], nx, ny + 4, { fs: 10, fw: '700', color: colors[i] }));
    const nextAng = (2 * Math.PI * ((i+1)%3)) / 3 - Math.PI/2;
    const mx = cx + Math.cos((ang+nextAng)/2)*(r*0.5);
    const my = cy + Math.sin((ang+nextAng)/2)*(r*0.5);
    segs.push(_arrow(nx + Math.cos(nextAng-ang)*w*0.13, ny + Math.sin(nextAng-ang)*h*0.13, nx + Math.cos(nextAng-ang)*w*0.22, ny + Math.sin(nextAng-ang)*h*0.22, colors[i], 2));
  }
  return segs;
}

function shapeWaterCycle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x, y + h*0.7, w, h*0.3, '#e0f2fe', '#0ea5e9', 1, 0),
    _circle(x + w*0.2, y + h*0.15, w*0.08, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(x + w*0.35, y + h*0.1, w*0.1, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(x + w*0.5, y + h*0.12, w*0.09, '#e0f2fe', '#0ea5e9', 1.5),
    _arrow(x + w*0.5, y + h*0.65, x + w*0.5, y + h*0.3, '#0ea5e9', 2),
    _arrow(x + w*0.7, y + h*0.25, x + w*0.85, y + h*0.65, '#0ea5e9', 2),
    _arrow(x + w*0.2, y + h*0.65, x + w*0.3, y + h*0.3, '#0ea5e9', 2),
    _text('Evap', x + w*0.15, y + h*0.55, { fs: 10, fw: '700', color: '#0369a1' }),
    _text('Rain', x + w*0.85, y + h*0.55, { fs: 10, fw: '700', color: '#0369a1' }),
    _text('Clouds', x + w*0.35, y + h*0.05, { fs: 10, fw: '700', color: '#0369a1' }),
  ];
}

function shapeCarbonCycle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, w*0.12, '#22c55e33', '#16a34a', 2),
    _text('CO₂', cx, cy + 4, { fs: 12, fw: '800', color: '#16a34a' }),
    _circle(x + w*0.15, y + h*0.2, w*0.08, '#fef3c7', '#f59e0b', 1.5),
    _text('Sun', x + w*0.15, y + h*0.2 + 4, { fs: 9, fw: '700', color: '#f59e0b' }),
    _circle(x + w*0.85, y + h*0.8, w*0.08, '#fca5a5', '#dc2626', 1.5),
    _text('Decay', x + w*0.85, y + h*0.8 + 4, { fs: 8, fw: '700', color: '#dc2626' }),
    _arrow(cx + w*0.12, cy - h*0.05, x + w*0.85, y + h*0.15, '#16a34a', 1.5),
    _arrow(x + w*0.85, y + h*0.2, cx + w*0.1, cy + h*0.05, '#f59e0b', 1.5),
    _arrow(cx + w*0.05, cy + h*0.1, x + w*0.8, y + h*0.7, '#dc2626', 1.5),
  ];
}

function shapeFoodChain(x, y, w, h) {
  return [
    _circle(x + w*0.1, y + h*0.5, w*0.1, '#22c55e33', '#16a34a', 2),
    _text('Plant', x + w*0.1, y + h*0.5 + 4, { fs: 10, fw: '700', color: '#16a34a' }),
    _arrow(x + w*0.2, y + h*0.5, x + w*0.3, y + h*0.5, '#64748b', 2),
    _circle(x + w*0.4, y + h*0.5, w*0.1, '#fef3c7', '#f59e0b', 2),
    _text('Herb', x + w*0.4, y + h*0.5 + 4, { fs: 10, fw: '700', color: '#f59e0b' }),
    _arrow(x + w*0.5, y + h*0.5, x + w*0.6, y + h*0.5, '#64748b', 2),
    _circle(x + w*0.7, y + h*0.5, w*0.1, '#fee2e2', '#dc2626', 2),
    _text('Carn', x + w*0.7, y + h*0.5 + 4, { fs: 10, fw: '700', color: '#dc2626' }),
    _arrow(x + w*0.8, y + h*0.5, x + w*0.9, y + h*0.5, '#64748b', 2),
    _circle(x + w*0.9, y + h*0.5, w*0.08, '#f5f5f4', '#78716c', 2),
    _text('Apex', x + w*0.9, y + h*0.5 + 4, { fs: 10, fw: '700', color: '#78716c' }),
  ];
}

// =============================================================================
// CATEGORY 2: MATHEMATICS (40+ shapes)
// =============================================================================

function shapeCoordinatePlane(x, y, w, h, xLabel = 'x', yLabel = 'y') {
  return [
    _line(x + w*0.15, y + h*0.05, x + w*0.15, y + h*0.9, '#475569', 2),
    _line(x + w*0.15, y + h*0.9, x + w*0.95, y + h*0.9, '#475569', 2),
    _path(`M ${x+w*0.15} ${y+h*0.05} l -5 10 l 10 0 z`, '#475569', '#475569', 1),
    _path(`M ${x+w*0.95} ${y+h*0.9} l -10 -5 l 0 10 z`, '#475569', '#475569', 1),
    _text(xLabel, x + w*0.95, y + h*0.95, { fs: 13, fw: '700', color: '#475569' }),
    _text(yLabel, x + w*0.08, y + h*0.05, { fs: 13, fw: '700', color: '#475569', anchor: 'end' }),
  ];
}

function shapeNumberLine(x, y, w, h) {
  const segs = [_line(x + w*0.05, y + h*0.5, x + w*0.95, y + h*0.5, '#475569', 2)];
  for (let i = -5; i <= 5; i++) {
    const px = x + w*0.5 + (i/5)*w*0.4;
    segs.push(_line(px, y + h*0.42, px, y + h*0.58, '#475569', 1.5));
    segs.push(_text(String(i), px, y + h*0.72, { fs: 11, fw: '600', color: '#475569' }));
  }
  return segs;
}

function shapeFractionBar(x, y, w, h, num = 3, den = 4) {
  const segs = [_rect(x, y, w, h, '#ffffff', '#475569', 1.5, 6)];
  const partW = w / den;
  for (let i = 0; i < den; i++) {
    if (i < num) {
      segs.push(_rect(x + i*partW + 1, y + 1, partW - 2, h - 2, '#93c5fd', '#2563eb', 0, 4));
    }
    if (i < den - 1) segs.push(_line(x + (i+1)*partW, y, x + (i+1)*partW, y + h, '#475569', 1));
  }
  return segs;
}

function shapePieChart(x, y, w, h, slices = [30, 25, 25, 20]) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.4;
  const segs = [];
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#7c3aed', '#0d9488'];
  let start = -Math.PI/2;
  const total = slices.reduce((a,b) => a+b, 0);
  slices.forEach((slice, i) => {
    const angle = (slice/total) * Math.PI * 2;
    const end = start + angle;
    const x1 = cx + Math.cos(start)*r;
    const y1 = cy + Math.sin(start)*r;
    const x2 = cx + Math.cos(end)*r;
    const y2 = cy + Math.sin(end)*r;
    const large = angle > Math.PI ? 1 : 0;
    segs.push(_path(`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, colors[i%colors.length], colors[i%colors.length], 1));
    segs.push(_path(`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, '#ffffff', '#ffffff', 1));
    const midAng = start + angle/2;
    const lx = cx + Math.cos(midAng)*(r*0.65);
    const ly = cy + Math.sin(midAng)*(r*0.65);
    segs.push(_text(`${Math.round(slice/total*100)}%`, lx, ly + 4, { fs: 11, fw: '700', color: '#ffffff' }));
    start = end;
  });
  return segs;
}

function shapeBarChart(x, y, w, h, values = [60, 80, 45, 90, 70], labels = ['A','B','C','D','E']) {
  const segs = [...shapeCoordinatePlane(x, y, w, h)];
  const maxVal = Math.max(...values);
  const barW = (w * 0.7) / values.length;
  const chartH = h * 0.7;
  const chartY = y + h*0.1;
  values.forEach((val, i) => {
    const barH = (val / maxVal) * chartH;
    const bx = x + w*0.15 + i*barW + barW*0.15;
    const by = y + h*0.9 - barH;
    segs.push(_rect(bx, by, barW*0.7, barH, '#3b82f6', '#1d4ed8', 1, 4));
    segs.push(_text(labels[i] || String(i+1), bx + barW*0.35, y + h*0.95, { fs: 10, fw: '600', color: '#475569' }));
  });
  return segs;
}

function shapeLineGraph(x, y, w, h, points = [[0,30],[20,60],[40,40],[60,80],[80,50]]) {
  const segs = [...shapeCoordinatePlane(x, y, w, h)];
  const chartX = x + w*0.15, chartW = w*0.78;
  const chartY = y + h*0.05, chartH = h*0.8;
  const pathD = points.map((p, i) => {
    const px = chartX + (p[0]/100)*chartW;
    const py = chartY + chartH - (p[1]/100)*chartH;
    return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
  }).join(' ');
  segs.push(_path(pathD, '#2563eb', 'none', 2.5));
  points.forEach((p) => {
    const px = chartX + (p[0]/100)*chartW;
    const py = chartY + chartH - (p[1]/100)*chartH;
    segs.push(_circle(px, py, 4, '#2563eb', '#1d4ed8', 1.5));
  });
  return segs;
}

function shapePyramid(x, y, w, h, levels = 4) {
  const segs = [];
  const colors = ['#1e3a8a', '#2563eb', '#60a5fa', '#93c5fd'];
  for (let i = 0; i < levels; i++) {
    const t = i / levels;
    const topW = w * (1 - t) * 0.8;
    const botW = w * (1 - (i+1)/levels) * 0.8;
    const ty = y + h * t;
    const by = y + h * (i+1)/levels;
    const tx = x + (w - topW) / 2;
    const bx2 = x + (w - botW) / 2;
    segs.push(_path(`M ${tx} ${ty} L ${tx + topW} ${ty} L ${bx2 + botW} ${by} L ${bx2} ${by} Z`, colors[i%colors.length], '#ffffff', 1));
  }
  return segs;
}

function shapeSetVenn(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx - w*0.12, cy, w*0.28, '#2563eb22', '#2563eb', 2),
    _circle(cx + w*0.12, cy, w*0.28, '#dc262622', '#dc2626', 2),
    _text('A', cx - w*0.22, cy + 4, { fs: 14, fw: '800', color: '#2563eb' }),
    _text('B', cx + w*0.22, cy + 4, { fs: 14, fw: '800', color: '#dc2626' }),
  ];
}

function shapeTriangle(x, y, w, h) {
  return [
    _path(`M ${x+w/2} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z`, '#dbeafe', '#2563eb', 2),
  ];
}

function shapeSquare(x, y, size) {
  return [_rect(x, y, size, size, '#dbeafe', '#2563eb', 2, 0)];
}

function shapePentagon(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const r = Math.min(w,h)*0.4;
  const points = [];
  for (let i = 0; i < 5; i++) {
    const ang = (2 * Math.PI * i) / 5 - Math.PI/2;
    points.push(`${cx + Math.cos(ang)*r} ${cy + Math.sin(ang)*r}`);
  }
  return [_path(`M ${points.join(' L ')} Z`, '#ede9fe', '#7c3aed', 2)];
}

function shapeHexagon(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const r = Math.min(w,h)*0.4;
  const points = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6;
    points.push(`${cx + Math.cos(ang)*r} ${cy + Math.sin(ang)*r}`);
  }
  return [_path(`M ${points.join(' L ')} Z`, '#ccfbf1', '#0d9488', 2)];
}

function shapeOctagon(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const r = Math.min(w,h)*0.4;
  const points = [];
  for (let i = 0; i < 8; i++) {
    const ang = (2 * Math.PI * i) / 8;
    points.push(`${cx + Math.cos(ang)*r} ${cy + Math.sin(ang)*r}`);
  }
  return [_path(`M ${points.join(' L ')} Z`, '#fef3c7', '#f59e0b', 2)];
}

function shapeStarShape(x, y, w, h, points5 = 5) {
  const cx = x + w/2, cy = y + h/2;
  const outerR = Math.min(w,h)*0.4;
  const innerR = outerR * 0.4;
  const pts = [];
  for (let i = 0; i < points5 * 2; i++) {
    const ang = (Math.PI * i) / points5 - Math.PI/2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx + Math.cos(ang)*r} ${cy + Math.sin(ang)*r}`);
  }
  return [_path(`M ${pts.join(' L ')} Z`, '#fbbf24', '#f59e0b', 2)];
}

function shapeCircleShape(x, y, r) {
  return [_circle(x, y, r, '#dbeafe', '#2563eb', 2)];
}

function shapeOval(x, y, w, h) {
  return [_ellipse(x + w/2, y + h/2, w*0.4, h*0.4, '#dbeafe', '#2563eb', 2)];
}

function shapeParallelogram(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y} L ${x+w} ${y} L ${x+w*0.8} ${y+h} L ${x} ${y+h} Z`, '#ede9fe', '#7c3aed', 2),
  ];
}

function shapeTrapezoid(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y} L ${x+w*0.8} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z`, '#ccfbf1', '#0d9488', 2),
  ];
}

function shapeDiamond(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${y} L ${x+w} ${cy} L ${cx} ${y+h} L ${x} ${cy} Z`, '#fef3c7', '#f59e0b', 2),
  ];
}

function shapeCube(x, y, w, h) {
  const off = w*0.2;
  return [
    _rect(x, y + h*0.3, w*0.6, h*0.6, '#dbeafe', '#2563eb', 2, 0),
    _path(`M ${x} ${y+h*0.3} L ${x+off} ${y} L ${x+w*0.6+off} ${y} L ${x+w*0.6} ${y+h*0.3}`, '#bfdbfe', '#2563eb', 1.5),
    _line(x + w*0.6, y + h*0.3, x + w*0.6 + off, y, '#2563eb', 1.5),
    _path(`M ${x+w*0.6+off} ${y} L ${x+w} ${y+h*0.3} L ${x+w} ${y+h*0.9} L ${x+w*0.6} ${y+h*0.9}`, '#93c5fd', '#2563eb', 1.5),
  ];
}

function shapeSphere(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.4, '#dbeafe', '#2563eb', 2),
    _path(`M ${cx-Math.min(w,h)*0.3} ${cy} Q ${cx} ${cy-Math.min(w,h)*0.15} ${cx+Math.min(w,h)*0.3} ${cy}`, '#93c5fd', 'none', 1.5),
    _path(`M ${cx} ${cy-Math.min(w,h)*0.4} Q ${cx+Math.min(w,h)*0.15} ${cy} ${cx} ${cy+Math.min(w,h)*0.4}`, '#93c5fd', 'none', 1),
  ];
}

function shapeCylinder(x, y, w, h) {
  return [
    _rect(x + w*0.05, y + h*0.2, w*0.9, h*0.6, '#dbeafe', '#2563eb', 2, 0),
    _ellipse(x + w/2, y + h*0.2, w*0.45, h*0.12, '#bfdbfe', '#2563eb', 2),
    _ellipse(x + w/2, y + h*0.8, w*0.45, h*0.12, '#dbeafe', '#2563eb', 1),
  ];
}

function shapeCone(x, y, w, h) {
  return [
    _path(`M ${x+w/2} ${y} L ${x+w*0.1} ${y+h*0.8} L ${x+w*0.9} ${y+h*0.8} Z`, '#fef3c7', '#f59e0b', 2),
    _ellipse(x + w/2, y + h*0.8, w*0.4, h*0.08, '#fde68a', '#f59e0b', 1.5),
  ];
}

function shapePrism(x, y, w, h) {
  return [
    _path(`M ${x+w*0.5} ${y} L ${x+w} ${y+h*0.6} L ${x} ${y+h*0.6} Z`, '#dbeafe', '#2563eb', 2),
    _line(x + w*0.5, y, x + w*0.5, y + h*0.6, '#93c5fd', 1),
    _path(`M ${x+w*0.5} ${y+h*0.6} L ${x+w*0.7} ${y+h} L ${x+w*0.2} ${y+h} Z`, '#bfdbfe', '#2563eb', 1.5),
  ];
}

// =============================================================================
// CATEGORY 3: PHYSICS (40+ shapes)
// =============================================================================

function shapeSpring(x, y, w, h) {
  const segs = [];
  const coils = 6;
  for (let i = 0; i < coils; i++) {
    const yy = y + (h * i) / coils;
    const nextY = y + (h * (i+1)) / coils;
    segs.push(_path(`M ${x+w*0.3} ${yy} Q ${x+w*0.1} ${yy+h/coils*0.25} ${x+w*0.5} ${yy+h/coils*0.5} Q ${x+w*0.9} ${yy+h/coils*0.75} ${x+w*0.7} ${nextY}`, '#475569', 'none', 2));
  }
  return segs;
}

function shapePendulum(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.3, y, w*0.4, h*0.08, '#475569', '#475569', 2, 4),
    _line(cx, y + h*0.08, cx + w*0.2, y + h*0.65, '#475569', 2),
    _circle(cx + w*0.2, y + h*0.7, w*0.1, '#fbbf24', '#f59e0b', 2),
    _path(`M ${cx-w*0.15} ${y+h*0.65} A ${w*0.2} ${w*0.2} 0 0 1 ${cx+w*0.2} ${y+h*0.65}`, '#94a3b8', 'none', 1),
  ];
}

function shapeInclinedPlane(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h} L ${x+w} ${y+h} L ${x+w} ${y+h*0.3} Z`, '#dbeafe', '#2563eb', 2),
    _rect(x + w*0.3, y + h*0.15, w*0.15, h*0.15, '#fef3c7', '#f59e0b', 2, 2),
    _path(`M ${x+w*0.45} ${y+h*0.3} L ${x+w*0.45} ${y+h*0.55} L ${x+w*0.3} ${y+h*0.55}`, '#f59e0b', 'none', 1.5),
  ];
}

function shapePulley(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.3, y, w*0.4, h*0.06, '#475569', '#475569', 2, 2),
    _circle(cx, y + h*0.15, w*0.1, '#f5f5f4', '#475569', 2),
    _circle(cx, y + h*0.15, w*0.03, '#475569', '#475569', 1),
    _line(cx - w*0.1, y + h*0.25, cx - w*0.1, y + h*0.8, '#475569', 2),
    _line(cx + w*0.1, y + h*0.25, cx + w*0.1, y + h*0.8, '#475569', 2),
    _rect(cx - w*0.18, y + h*0.7, w*0.16, h*0.12, '#dbeafe', '#2563eb', 1.5, 3),
    _rect(cx + w*0.02, y + h*0.8, w*0.16, h*0.12, '#dcfce7', '#16a34a', 1.5, 3),
  ];
}

function shapeFreeBodyDiagram(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(cx - w*0.12, cy - h*0.1, w*0.24, h*0.2, '#f5f5f4', '#475569', 2, 4),
    _arrow(cx, cy - h*0.1, cx, cy - h*0.35, '#dc2626', 2.5),
    _text('N', cx + 8, cy - h*0.3, { fs: 12, fw: '700', color: '#dc2626' }),
    _arrow(cx, cy + h*0.1, cx, cy + h*0.35, '#2563eb', 2.5),
    _text('mg', cx + 8, cy + h*0.3, { fs: 12, fw: '700', color: '#2563eb' }),
    _arrow(cx + w*0.12, cy, cx + w*0.35, cy, '#16a34a', 2.5),
    _text('F', cx + w*0.3, cy - 8, { fs: 12, fw: '700', color: '#16a34a' }),
    _arrow(cx - w*0.12, cy, cx - w*0.35, cy, '#f59e0b', 2.5),
    _text('f', cx - w*0.3, cy - 8, { fs: 12, fw: '700', color: '#f59e0b' }),
  ];
}

function shapeForceVector(x, y, w, h, angle = 45) {
  const cx = x + w/2, cy = y + h/2;
  const rad = (angle * Math.PI) / 180;
  const len = Math.min(w,h)*0.4;
  return [
    _arrow(cx, cy, cx + Math.cos(rad)*len, cy - Math.sin(rad)*len, '#dc2626', 3),
  ];
}

function shapeElectricCircuit(x, y, w, h) {
  return [
    _rect(x + w*0.1, y + h*0.2, w*0.3, h*0.3, '#fbbf2422', '#f59e0b', 1.5, 4),
    _text('R₁', x + w*0.25, y + h*0.38, { fs: 11, fw: '700', color: '#f59e0b' }),
    _rect(x + w*0.6, y + h*0.2, w*0.3, h*0.3, '#fbbf2422', '#f59e0b', 1.5, 4),
    _text('R₂', x + w*0.75, y + h*0.38, { fs: 11, fw: '700', color: '#f59e0b' }),
    _line(x + w*0.1, y + h*0.35, x, y + h*0.35, '#475569', 2),
    _line(x, y + h*0.35, x, y + h*0.8, '#475569', 2),
    _line(x, y + h*0.8, x + w, y + h*0.8, '#475569', 2),
    _line(x + w, y + h*0.8, x + w, y + h*0.35, '#475569', 2),
    _line(x + w, y + h*0.35, x + w*0.9, y + h*0.35, '#475569', 2),
    _line(x + w*0.4, y + h*0.35, x + w*0.6, y + h*0.35, '#475569', 2),
    _circle(x + w*0.5, y + h*0.85, 8, '#fef3c7', '#f59e0b', 2),
    _line(x + w*0.5 - 4, y + h*0.85, x + w*0.5 + 4, y + h*0.85, '#f59e0b', 2),
  ];
}

function shapeLens(x, y, w, h) {
  return [
    _path(`M ${x+w/2} ${y} Q ${x+w*0.05} ${y+h/2} ${x+w/2} ${y+h} Q ${x+w*0.95} ${y+h/2} ${x+w/2} ${y}`, '#dbeafe44', '#2563eb', 2),
  ];
}

function shapeConcaveLens(x, y, w, h) {
  return [
    _path(`M ${x+w*0.1} ${y} Q ${x+w*0.3} ${y+h/2} ${x+w*0.1} ${y+h}`, '#dbeafe44', '#2563eb', 2),
    _path(`M ${x+w*0.9} ${y} Q ${x+w*0.7} ${y+h/2} ${x+w*0.9} ${y+h}`, '#dbeafe44', '#2563eb', 2),
  ];
}

function shapeMirror(x, y, w, h) {
  return [
    _line(x + w/2, y, x + w/2, y + h, '#475569', 3),
    ...Array.from({length: 8}, (_, i) => {
      const yy = y + h * (i/8);
      return _line(x + w/2, yy, x + w/2 + 6, yy + 5, '#94a3b8', 1);
    }),
  ];
}

function shapeMagnetShape(x, y, w, h) {
  return [
    _path(`M ${x+w*0.15} ${y} L ${x+w*0.15} ${y+h*0.7} A ${w*0.35} ${h*0.35} 0 0 0 ${x+w*0.85} ${y+h*0.7} L ${x+w*0.85} ${y}`, '#dc2626', '#dc2626', 2),
    _rect(x + w*0.15, y, w*0.25, h*0.25, '#dc2626', '#dc2626', 0, 4),
    _rect(x + w*0.6, y, w*0.25, h*0.25, '#2563eb', '#2563eb', 0, 4),
    _text('N', x + w*0.27, y + h*0.15, { fs: 14, fw: '800', color: '#ffffff' }),
    _text('S', x + w*0.72, y + h*0.15, { fs: 14, fw: '800', color: '#ffffff' }),
  ];
}

function shapeElectricFieldLines(x, y, w, h) {
  const segs = [];
  for (let i = 0; i < 5; i++) {
    const yy = y + h * (0.15 + i * 0.175);
    segs.push(_path(`M ${x+w*0.1} ${yy} Q ${x+w*0.5} ${yy-15} ${x+w*0.9} ${yy}`, '#7c3aed', 'none', 1.5));
  }
  return segs;
}

function shapeGravitationalField(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_circle(cx, cy, w*0.08, '#1e293b', '#1e293b', 2)];
  for (let r = 1; r <= 4; r++) {
    segs.push(_circle(cx, cy, w*0.08 + r*w*0.08, 'none', '#94a3b8', 1));
  }
  return segs;
}

function shapeWavePulse(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.5} Q ${x+w*0.1} ${y+h*0.1} ${x+w*0.2} ${y+h*0.5} Q ${x+w*0.3} ${y+h*0.9} ${x+w*0.4} ${y+h*0.5} L ${x+w} ${y+h*0.5}`, '#3b82f6', 'none', 2.5),
  ];
}

function shapeStandingWave(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.5} Q ${x+w*0.125} ${y+h*0.15} ${x+w*0.25} ${y+h*0.5} Q ${x+w*0.375} ${y+h*0.85} ${x+w*0.5} ${y+h*0.5} Q ${x+w*0.625} ${y+h*0.15} ${x+w*0.75} ${y+h*0.5} Q ${x+w*0.875} ${y+h*0.85} ${x+w} ${y+h*0.5}`, '#3b82f6', 'none', 2),
    _path(`M ${x} ${y+h*0.5} Q ${x+w*0.125} ${y+h*0.85} ${x+w*0.25} ${y+h*0.5} Q ${x+w*0.375} ${y+h*0.15} ${x+w*0.5} ${y+h*0.5} Q ${x+w*0.625} ${y+h*0.85} ${x+w*0.75} ${y+h*0.5} Q ${x+w*0.875} ${y+h*0.15} ${x+w} ${y+h*0.5}`, '#ef4444', 'none', 2),
    _line(x, y + h*0.5, x + w, y + h*0.5, '#94a3b8', 1),
  ];
}

function shapeEnergyBar(x, y, w, h, ke = 60, pe = 40) {
  const total = ke + pe;
  const keH = (ke/total) * h * 0.8;
  const peH = (pe/total) * h * 0.8;
  return [
    _rect(x, y + h - keH, w*0.4, keH, '#3b82f6', '#1d4ed8', 2, 4),
    _text('KE', x + w*0.2, y + h - keH/2 + 4, { fs: 12, fw: '700', color: '#ffffff' }),
    _rect(x + w*0.5, y + h - peH, w*0.4, peH, '#dc2626', '#b91c1c', 2, 4),
    _text('PE', x + w*0.7, y + h - peH/2 + 4, { fs: 12, fw: '700', color: '#ffffff' }),
  ];
}

function shapeVelocityArrow(x, y, w, h) {
  return [_arrow(x, y + h/2, x + w, y + h/2, '#3b82f6', 3)];
}

function shapeAccelerationArrow(x, y, w, h) {
  return [_arrow(x, y + h/2, x + w, y + h/2, '#dc2626', 3)];
}

function shapeFrictionArrow(x, y, w, h) {
  return [_arrow(x + w, y + h/2, x, y + h/2, '#f59e0b', 3)];
}

function shapeNormalForce(x, y, w, h) {
  return [_arrow(x + w/2, y + h, x + w/2, y, '#16a34a', 3)];
}

function shapeGravityArrow(x, y, w, h) {
  return [_arrow(x + w/2, y, x + w/2, y + h, '#7c3aed', 3)];
}

function shapeLever(x, y, w, h) {
  return [
    _line(x, y + h*0.5, x + w, y + h*0.5, '#475569', 3),
    _path(`M ${x+w*0.45} ${y+h*0.5} L ${x+w*0.5} ${y+h*0.8} L ${x+w*0.55} ${y+h*0.5}`, '#475569', '#94a3b8', 2),
    _rect(x + w*0.05, y + h*0.35, w*0.12, h*0.15, '#dbeafe', '#2563eb', 1.5, 3),
    _rect(x + w*0.8, y + h*0.35, w*0.12, h*0.15, '#dcfce7', '#16a34a', 1.5, 3),
  ];
}

function shapeWheelAndAxle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.4, '#f5f5f4', '#475569', 2),
    _circle(cx, cy, Math.min(w,h)*0.1, '#475569', '#475569', 2),
    _line(cx, cy - Math.min(w,h)*0.4, cx, cy + Math.min(w,h)*0.4, '#475569', 1),
    _line(cx - Math.min(w,h)*0.4, cy, cx + Math.min(w,h)*0.4, cy, '#475569', 1),
  ];
}

function shapeScrew(x, y, w, h) {
  const segs = [_rect(x + w*0.35, y, w*0.3, h*0.7, '#94a3b8', '#475569', 2, 4)];
  for (let i = 0; i < 6; i++) {
    const yy = y + h * (0.1 + i * 0.1);
    segs.push(_line(x + w*0.35, yy, x + w*0.65, yy + h*0.05, '#475569', 1));
  }
  segs.push(_path(`M ${x+w*0.3} ${y+h*0.7} L ${x+w*0.5} ${y+h} L ${x+w*0.7} ${y+h*0.7}`, '#94a3b8', '#475569', 2));
  return segs;
}

function shapeWedge(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h} L ${x+w} ${y+h*0.5} L ${x+w} ${y+h} Z`, '#dbeafe', '#2563eb', 2),
  ];
}

function shapeRamp(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h} L ${x+w} ${y+h} L ${x+w} ${y} Z`, '#dcfce7', '#16a34a', 2),
    _line(x + w*0.7, y + h*0.3, x + w*0.7, y + h, '#16a34a', 1),
    _path(`M ${x+w*0.7} ${y+h*0.65} A ${w*0.12} ${h*0.12} 0 0 1 ${x+w*0.82} ${y+h}`, '#16a34a', 'none', 1),
  ];
}

// =============================================================================
// CATEGORY 4: CHEMISTRY (30+ shapes)
// =============================================================================

function shapeBeaker(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y} L ${x+w*0.15} ${y+h*0.7} L ${x+w*0.85} ${y+h*0.7} L ${x+w*0.8} ${y}`, '#94a3b8', '#475569', 2),
    _rect(x + w*0.15, y + h*0.5, w*0.7, h*0.2, '#3b82f644', '#3b82f6', 1, 0),
    _line(x + w*0.18, y + h*0.1, x + w*0.18, y + h*0.15, '#94a3b8', 1),
    _line(x + w*0.18, y + h*0.2, x + w*0.18, y + h*0.25, '#94a3b8', 1),
    _line(x + w*0.18, y + h*0.3, x + w*0.18, y + h*0.35, '#94a3b8', 1),
  ];
}

function shapeFlask(x, y, w, h) {
  return [
    _rect(x + w*0.35, y, w*0.3, h*0.25, '#94a3b8', '#475569', 2, 2),
    _path(`M ${x+w*0.35} ${y+h*0.25} L ${x+w*0.1} ${y+h*0.8} Q ${x} ${y+h} ${x+w*0.2} ${y+h*0.9} L ${x+w*0.8} ${y+h*0.9} Q ${x+w} ${y+h} ${x+w*0.9} ${y+h*0.8} L ${x+w*0.65} ${y+h*0.25}`, '#94a3b8', '#475569', 2),
    _rect(x + w*0.2, y + h*0.65, w*0.6, h*0.25, '#86efac44', '#16a34a', 1, 0),
  ];
}

function shapeTestTube(x, y, w, h) {
  return [
    _rect(x + w*0.3, y, w*0.4, h*0.7, '#94a3b8', '#475569', 2, 4),
    _path(`M ${x+w*0.3} ${y+h*0.7} Q ${x+w*0.3} ${y+h} ${x+w*0.5} ${y+h} Q ${x+w*0.7} ${y+h} ${x+w*0.7} ${y+h*0.7}`, '#94a3b8', '#475569', 2),
    _rect(x + w*0.3, y + h*0.5, w*0.4, h*0.3, '#c4b5fd44', '#8b5cf6', 1, 0),
  ];
}

function shapeMoleculeWater(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy - h*0.1, w*0.15, '#ef4444', '#dc2626', 2),
    _text('O', cx, cy - h*0.06, { fs: 12, fw: '800', color: '#ffffff' }),
    _circle(cx - w*0.2, cy + h*0.15, w*0.1, '#e0f2fe', '#0ea5e9', 2),
    _text('H', cx - w*0.2, cy + h*0.19, { fs: 11, fw: '800', color: '#0369a1' }),
    _circle(cx + w*0.2, cy + h*0.15, w*0.1, '#e0f2fe', '#0ea5e9', 2),
    _text('H', cx + w*0.2, cy + h*0.19, { fs: 11, fw: '800', color: '#0369a1' }),
    _line(cx - w*0.08, cy - h*0.02, cx - w*0.13, cy + h*0.08, '#475569', 2),
    _line(cx + w*0.08, cy - h*0.02, cx + w*0.13, cy + h*0.08, '#475569', 2),
  ];
}

function shapeMoleculeCO2(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, w*0.12, '#1e293b', '#1e293b', 2),
    _text('C', cx, cy + 4, { fs: 12, fw: '800', color: '#ffffff' }),
    _circle(cx - w*0.25, cy, w*0.1, '#ef4444', '#dc2626', 2),
    _text('O', cx - w*0.25, cy + 4, { fs: 11, fw: '800', color: '#ffffff' }),
    _circle(cx + w*0.25, cy, w*0.1, '#ef4444', '#dc2626', 2),
    _text('O', cx + w*0.25, cy + 4, { fs: 11, fw: '800', color: '#ffffff' }),
    _line(cx - w*0.12, cy, cx - w*0.16, cy, '#475569', 2),
    _line(cx - w*0.12, cy - 4, cx - w*0.16, cy - 4, '#475569', 2),
    _line(cx + w*0.12, cy, cx + w*0.16, cy, '#475569', 2),
    _line(cx + w*0.12, cy - 4, cx + w*0.16, cy - 4, '#475569', 2),
  ];
}

function shapeMethane(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, w*0.1, '#1e293b', '#1e293b', 2),
    _text('C', cx, cy + 4, { fs: 11, fw: '800', color: '#ffffff' }),
    _circle(cx, cy - h*0.2, w*0.08, '#e0f2fe', '#0ea5e9', 1.5),
    _text('H', cx, cy - h*0.17, { fs: 9, fw: '800', color: '#0369a1' }),
    _circle(cx - w*0.2, cy + h*0.1, w*0.08, '#e0f2fe', '#0ea5e9', 1.5),
    _text('H', cx - w*0.2, cy + h*0.13, { fs: 9, fw: '800', color: '#0369a1' }),
    _circle(cx + w*0.2, cy + h*0.1, w*0.08, '#e0f2fe', '#0ea5e9', 1.5),
    _text('H', cx + w*0.2, cy + h*0.13, { fs: 9, fw: '800', color: '#0369a1' }),
    _circle(cx, cy + h*0.22, w*0.08, '#e0f2fe', '#0ea5e9', 1.5),
    _text('H', cx, cy + h*0.25, { fs: 9, fw: '800', color: '#0369a1' }),
  ];
}

function shapeReactionArrow(x, y, w, h) {
  return [
    _line(x + w*0.1, y + h/2, x + w*0.85, y + h/2, '#475569', 2.5),
    _path(`M ${x+w*0.85} ${y+h*0.5} l -8 -5 l 0 10 z`, '#475569', '#475569', 1),
    _text('→', x + w*0.5, y + h*0.5 + 5, { fs: 18, fw: '800', color: '#475569' }),
  ];
}

function shapeEquilibriumArrow(x, y, w, h) {
  return [
    _line(x + w*0.1, y + h*0.4, x + w*0.85, y + h*0.4, '#475569', 2),
    _path(`M ${x+w*0.85} ${y+h*0.4} l -6 -4 l 0 8 z`, '#475569', '#475569', 1),
    _line(x + w*0.1, y + h*0.6, x + w*0.85, y + h*0.6, '#475569', 2),
    _path(`M ${x+w*0.1} ${y+h*0.6} l 6 -4 l 0 8 z`, '#475569', '#475569', 1),
  ];
}

function shapeBenzeneRing(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const r = Math.min(w,h)*0.35;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6 - Math.PI/2;
    pts.push([cx + Math.cos(ang)*r, cy + Math.sin(ang)*r]);
  }
  const segs = [
    _path(`M ${pts.map(p => p.join(' ')).join(' L ')} Z`, '#fef3c7', '#f59e0b', 2),
  ];
  const innerR = r * 0.55;
  const innerPts = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6 - Math.PI/2;
    innerPts.push([cx + Math.cos(ang)*innerR, cy + Math.sin(ang)*innerR]);
  }
  segs.push(_path(`M ${innerPts.map(p => p.join(' ')).join(' L ')} Z`, 'none', '#f59e0b', 1.5));
  return segs;
}

function shapeElectronConfiguration(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_circle(cx, cy, 6, '#dc2626', '#991b1b', 2)];
  const shells = [2, 8, 18];
  shells.forEach((count, si) => {
    const r = (Math.min(w,h)*0.12) * (si + 1);
    segs.push(_circle(cx, cy, r, 'none', '#cbd5e1', 1));
    for (let i = 0; i < Math.min(count, 8); i++) {
      const ang = (2 * Math.PI * i) / count;
      segs.push(_circle(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r, 4, '#2563eb', '#1e40af', 1));
    }
  });
  return segs;
}

function shapePhaseDiagram(x, y, w, h) {
  return [
    ...shapeCoordinatePlane(x, y, w, h, 'T', 'P'),
    _path(`M ${x+w*0.15} ${y+h*0.9} Q ${x+w*0.4} ${y+h*0.5} ${x+w*0.5} ${y+h*0.35} Q ${x+w*0.6} ${y+h*0.25} ${x+w*0.7} ${y+h*0.15}`, '#2563eb', 'none', 2),
    _path(`M ${x+w*0.5} ${y+h*0.35} L ${x+w*0.7} ${y+h*0.35}`, '#dc2626', 'none', 2),
    _text('Solid', x + w*0.2, y + h*0.7, { fs: 11, fw: '700', color: '#2563eb' }),
    _text('Liquid', x + w*0.45, y + h*0.55, { fs: 11, fw: '700', color: '#16a34a' }),
    _text('Gas', x + w*0.7, y + h*0.7, { fs: 11, fw: '700', color: '#dc2626' }),
  ];
}

function shapePeriodicTableCell(x, y, w, h, symbol = 'H', number = 1, name = 'Hydrogen') {
  return [
    _rect(x, y, w, h, '#dbeafe', '#2563eb', 1.5, 4),
    _text(String(number), x + w*0.8, y + 12, { fs: 9, fw: '600', color: '#64748b', anchor: 'end' }),
    _text(symbol, x + w/2, y + h*0.6, { fs: 18, fw: '800', color: '#1e293b' }),
    _text(name, x + w/2, y + h*0.85, { fs: 8, fw: '500', color: '#64748b' }),
  ];
}

function shapeBondSingle(x, y, w, h) {
  return [_line(x, y + h/2, x + w, y + h/2, '#475569', 2)];
}

function shapeBondDouble(x, y, w, h) {
  return [
    _line(x, y + h*0.4, x + w, y + h*0.4, '#475569', 2),
    _line(x, y + h*0.6, x + w, y + h*0.6, '#475569', 2),
  ];
}

function shapeBondTriple(x, y, w, h) {
  return [
    _line(x, y + h*0.35, x + w, y + h*0.35, '#475569', 2),
    _line(x, y + h*0.5, x + w, y + h*0.5, '#475569', 2),
    _line(x, y + h*0.65, x + w, y + h*0.65, '#475569', 2),
  ];
}

function shapepHScale(x, y, w, h) {
  const segs = [_rect(x, y, w, h, 'none', '#475569', 1.5, 6)];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const r = Math.round(220 - t * 180);
    const g = Math.round(30 + t * 150);
    const b = Math.round(30 + t * 50);
    const px = x + t * w;
    segs.push(_rect(px, y, w/14 + 1, h, `rgb(${r},${g},${b})`, 'none', 0, 0));
    if (i % 2 === 0) segs.push(_text(String(i), px + w/28, y + h + 14, { fs: 9, fw: '600', color: '#475569' }));
  }
  return segs;
}

// =============================================================================
// CATEGORY 5: ENGINEERING & TECHNOLOGY (30+ shapes)
// =============================================================================

function shapeGearDetailed(x, y, w, h, teeth = 12) {
  const cx = x + w/2, cy = y + h/2;
  const outerR = Math.min(w,h)*0.4;
  const innerR = outerR * 0.7;
  const toothH = outerR * 0.2;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a1 = (2*Math.PI*i)/teeth;
    const a2 = (2*Math.PI*(i+0.4))/teeth;
    const a3 = (2*Math.PI*(i+0.6))/teeth;
    const a4 = (2*Math.PI*(i+1))/teeth;
    pts.push(`${cx+Math.cos(a1)*innerR} ${cy+Math.sin(a1)*innerR}`);
    pts.push(`${cx+Math.cos(a2)*innerR} ${cy+Math.sin(a2)*innerR}`);
    pts.push(`${cx+Math.cos(a2)*(innerR+toothH)} ${cy+Math.sin(a2)*(innerR+toothH)}`);
    pts.push(`${cx+Math.cos(a3)*(innerR+toothH)} ${cy+Math.sin(a3)*(innerR+toothH)}`);
    pts.push(`${cx+Math.cos(a3)*innerR} ${cy+Math.sin(a3)*innerR}`);
  }
  return [
    _path(`M ${pts.join(' L ')} Z`, '#cbd5e1', '#475569', 2),
    _circle(cx, cy, innerR*0.3, '#ffffff', '#475569', 2),
  ];
}

function shapeBolt(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.35, '#94a3b8', '#475569', 2),
    _path(`M ${cx-Math.min(w,h)*0.2} ${cy} L ${cx+Math.min(w,h)*0.2} ${cy}`, '#475569', 'none', 3),
  ];
}

function shapeNut(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const r = Math.min(w,h)*0.4;
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2*Math.PI*i)/6;
    pts.push(`${cx+Math.cos(ang)*r} ${cy+Math.sin(ang)*r}`);
  }
  return [
    _path(`M ${pts.join(' L ')} Z`, '#d1d5db', '#475569', 2),
    _circle(cx, cy, r*0.4, '#f5f5f4', '#475569', 2),
  ];
}

function shapeValve(x, y, w, h) {
  return [
    _rect(x + w*0.35, y + h*0.3, w*0.3, h*0.4, '#dbeafe', '#2563eb', 2, 4),
    _line(x + w*0.5, y + h*0.3, x + w*0.5, y + h*0.05, '#475569', 2),
    _circle(x + w*0.5, y + h*0.05, w*0.08, '#f5f5f4', '#475569', 2),
    _line(x, y + h*0.5, x + w*0.35, y + h*0.5, '#475569', 2),
    _line(x + w*0.65, y + h*0.5, x + w, y + h*0.5, '#475569', 2),
  ];
}

function shapePipe(x, y, w, h) {
  return [
    _rect(x, y + h*0.3, w, h*0.4, '#e2e8f0', '#475569', 2, 4),
    _line(x, y + h*0.3, x + w, y + h*0.3, '#94a3b8', 1),
    _line(x, y + h*0.7, x + w, y + h*0.7, '#94a3b8', 1),
  ];
}

function shapeHeatExchanger(x, y, w, h) {
  const segs = [_rect(x, y + h*0.15, w, h*0.7, '#f5f5f4', '#475569', 2, 6)];
  for (let i = 0; i < 4; i++) {
    const xx = x + w*(0.15 + i*0.2);
    segs.push(_path(`M ${xx} ${y+h*0.2} Q ${xx+w*0.05} ${y+h*0.35} ${xx} ${y+h*0.5} Q ${xx-w*0.05} ${y+h*0.65} ${xx} ${y+h*0.8}`, '#ef4444', 'none', 1.5));
  }
  return segs;
}

function shapeMotor(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#dbeafe', '#2563eb', 2, 8),
    _circle(x + w*0.3, y + h/2, w*0.15, '#fbbf24', '#f59e0b', 2),
    _line(x + w*0.6, y + h*0.5, x + w*0.95, y + h*0.5, '#475569', 3),
    _text('M', x + w*0.3, y + h/2 + 5, { fs: 14, fw: '800', color: '#ffffff' }),
  ];
}

function shapeGenerator(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#dcfce7', '#16a34a', 2, 8),
    _circle(x + w*0.4, y + h/2, w*0.15, '#fbbf24', '#f59e0b', 2),
    _path(`M ${x+w*0.55} ${y+h*0.3} Q ${x+w*0.7} ${y+h*0.2} ${x+w*0.75} ${y+h*0.35} Q ${x+w*0.8} ${y+h*0.5} ${x+w*0.7} ${y+h*0.65} Q ${x+w*0.6} ${y+h*0.8} ${x+w*0.55} ${y+h*0.7}`, '#16a34a', 'none', 2),
    _text('G', x + w*0.4, y + h/2 + 5, { fs: 14, fw: '800', color: '#166534' }),
  ];
}

function shapeTransformer(x, y, w, h) {
  return [
    _rect(x + w*0.1, y + h*0.1, w*0.35, h*0.8, '#dbeafe', '#2563eb', 2, 4),
    _rect(x + w*0.55, y + h*0.1, w*0.35, h*0.8, '#dbeafe', '#2563eb', 2, 4),
    _path(`M ${x+w*0.45} ${y+h*0.2} Q ${x+w*0.5} ${y+h*0.35} ${x+w*0.45} ${y+h*0.5} Q ${x+w*0.4} ${y+h*0.65} ${x+w*0.45} ${y+h*0.8}`, '#475569', 'none', 1.5),
    _path(`M ${x+w*0.55} ${y+h*0.2} Q ${x+w*0.6} ${y+h*0.35} ${x+w*0.55} ${y+h*0.5} Q ${x+w*0.5} ${y+h*0.65} ${x+w*0.55} ${y+h*0.8}`, '#475569', 'none', 1.5),
    _text('N₁', x + w*0.27, y + h*0.5, { fs: 12, fw: '700', color: '#2563eb' }),
    _text('N₂', x + w*0.72, y + h*0.5, { fs: 12, fw: '700', color: '#2563eb' }),
  ];
}

function shapeBreadboard(x, y, w, h) {
  const segs = [_rect(x, y, w, h, '#fef3c7', '#d97706', 1.5, 6)];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      segs.push(_circle(x + w*(0.08 + col*0.085), y + h*(0.2 + row*0.15), 3, '#f5f5f4', '#a8a29e', 0.5));
    }
  }
  return segs;
}

function shapeArduino(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#0ea5e9', '#0284c7', 2, 6),
    _rect(x + w*0.05, y + h*0.1, w*0.3, h*0.15, '#1e293b', '#1e293b', 1, 2),
    _circle(x + w*0.5, y + h*0.5, w*0.08, '#22c55e', '#16a34a', 1.5),
    ...Array.from({length: 6}, (_, i) => _rect(x + w*0.7, y + h*(0.15 + i*0.12), w*0.2, h*0.08, '#fbbf24', '#f59e0b', 0.5, 1)),
    _text('Arduino', x + w*0.5, y + h*0.9, { fs: 8, fw: '600', color: '#ffffff' }),
  ];
}

function shapeRaspberryPi(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#dc2626', '#b91c1c', 2, 8),
    _circle(x + w*0.3, y + h*0.4, w*0.12, '#1e293b', '#1e293b', 1.5),
    _rect(x + w*0.55, y + h*0.15, w*0.35, h*0.2, '#f5f5f4', '#a8a29e', 1, 2),
    ...Array.from({length: 4}, (_, i) => _rect(x + w*0.05, y + h*(0.6 + i*0.08), w*0.15, h*0.06, '#fbbf24', '#f59e0b', 0.5, 1)),
    _text('Pi', x + w*0.3, y + h*0.44, { fs: 10, fw: '800', color: '#ffffff' }),
  ];
}

function shapeSensor(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fef3c7', '#f59e0b', 2, 6),
    _circle(x + w/2, y + h*0.35, w*0.2, '#1e293b', '#1e293b', 2),
    _circle(x + w/2, y + h*0.35, w*0.08, '#22c55e', '#16a34a', 1.5),
    _line(x + w*0.2, y + h*0.7, x + w*0.2, y + h, '#475569', 1.5),
    _line(x + w*0.5, y + h*0.7, x + w*0.5, y + h, '#475569', 1.5),
    _line(x + w*0.8, y + h*0.7, x + w*0.8, y + h, '#475569', 1.5),
  ];
}

function shapeAntenna(x, y, w, h) {
  return [
    _line(x + w/2, y + h*0.3, x + w/2, y + h, '#475569', 2),
    _circle(x + w/2, y + h*0.3, 5, '#475569', '#475569', 1.5),
    _path(`M ${x+w*0.3} ${y+h*0.15} A ${w*0.2} ${h*0.15} 0 0 1 ${x+w*0.7} ${y+h*0.15}`, '#94a3b8', 'none', 1.5),
    _path(`M ${x+w*0.2} ${y} A ${w*0.3} ${h*0.2} 0 0 1 ${x+w*0.8} ${y}`, '#94a3b8', 'none', 1.5),
  ];
}

// =============================================================================
// CATEGORY 6: PROGRAMMING & CS (30+ shapes)
// =============================================================================

function shapeFlowchartProcess(x, y, w, h, label = '') {
  return [
    _rect(x, y, w, h, '#dbeafe', '#2563eb', 2, 8),
    ...(label ? [_text(label, x + w/2, y + h/2 + 5, { fs: 12, fw: '600', color: '#1e293b' })] : []),
  ];
}

function shapeFlowchartDecision(x, y, w, h, label = '') {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${y} L ${x+w} ${cy} L ${cx} ${y+h} L ${x} ${cy} Z`, '#fef3c7', '#f59e0b', 2),
    ...(label ? [_text(label, cx, cy + 4, { fs: 11, fw: '600', color: '#92400e' })] : []),
  ];
}

function shapeFlowchartStart(x, y, w, h, label = 'Start') {
  return [
    _rect(x, y, w, h, '#dcfce7', '#16a34a', 2, h/2),
    _text(label, x + w/2, y + h/2 + 5, { fs: 12, fw: '700', color: '#166534' }),
  ];
}

function shapeFlowchartEnd(x, y, w, h, label = 'End') {
  return [
    _rect(x, y, w, h, '#fee2e2', '#dc2626', 2, h/2),
    _text(label, x + w/2, y + h/2 + 5, { fs: 12, fw: '700', color: '#991b1b' }),
  ];
}

function shapeFlowchartIO(x, y, w, h, label = '') {
  return [
    _path(`M ${x+w*0.15} ${y} L ${x+w} ${y} L ${x+w*0.85} ${y+h} L ${x} ${y+h} Z`, '#ede9fe', '#7c3aed', 2),
    ...(label ? [_text(label, x + w/2, y + h/2 + 5, { fs: 11, fw: '600', color: '#5b21b6' })] : []),
  ];
}

function shapeServer(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f1f5f9', '#475569', 2, 6),
    _line(x, y + h*0.33, x + w, y + h*0.33, '#cbd5e1', 1),
    _line(x, y + h*0.66, x + w, y + h*0.66, '#cbd5e1', 1),
    _circle(x + w*0.15, y + h*0.16, 4, '#22c55e', '#16a34a', 1),
    _circle(x + w*0.15, y + h*0.5, 4, '#22c55e', '#16a34a', 1),
    _circle(x + w*0.15, y + h*0.83, 4, '#22c55e', '#16a34a', 1),
    _rect(x + w*0.6, y + h*0.08, w*0.3, h*0.15, '#94a3b8', '#94a3b8', 0.5, 2),
    _rect(x + w*0.6, y + h*0.42, w*0.3, h*0.15, '#94a3b8', '#94a3b8', 0.5, 2),
    _rect(x + w*0.6, y + h*0.75, w*0.3, h*0.15, '#94a3b8', '#94a3b8', 0.5, 2),
  ];
}

function shapeDatabaseIcon(x, y, w, h) {
  return [
    _ellipse(x + w/2, y + h*0.15, w*0.4, h*0.1, '#dbeafe', '#2563eb', 2),
    _rect(x + w*0.1, y + h*0.15, w*0.8, h*0.7, '#dbeafe', '#2563eb', 0, 0),
    _ellipse(x + w/2, y + h*0.85, w*0.4, h*0.1, '#dbeafe', '#2563eb', 2),
    _line(x + w*0.1, y + h*0.15, x + w*0.1, y + h*0.85, '#2563eb', 2),
    _line(x + w*0.9, y + h*0.15, x + w*0.9, y + h*0.85, '#2563eb', 2),
    _ellipse(x + w/2, y + h*0.5, w*0.4, h*0.08, 'none', '#93c5fd', 1),
  ];
}

function shapeCloudService(x, y, w, h) {
  return [
    _circle(x + w*0.25, y + h*0.5, w*0.2, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(x + w*0.45, y + h*0.35, w*0.25, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(x + w*0.65, y + h*0.5, w*0.2, '#e0f2fe', '#0ea5e9', 1.5),
    _rect(x + w*0.1, y + h*0.5, w*0.8, h*0.2, '#e0f2fe', '#0ea5e9', 1, 10),
  ];
}

function shapeAPIBox(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fef3c7', '#f59e0b', 2, 8),
    _text('API', x + w/2, y + h/2 + 6, { fs: 16, fw: '800', color: '#92400e' }),
  ];
}

function shapeCacheBox(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#dcfce7', '#16a34a', 2, 8),
    _text('Cache', x + w/2, y + h/2 + 5, { fs: 13, fw: '700', color: '#166534' }),
  ];
}

function shapeQueueBox(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#ede9fe', '#7c3aed', 2, 8),
    _text('Queue', x + w/2, y + h/2 + 5, { fs: 13, fw: '700', color: '#5b21b6' }),
  ];
}

function shapeFirewall(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#fee2e2', '#dc2626', 2, 6),
    _path(`M ${x+w*0.2} ${y+h*0.2} L ${x+w*0.5} ${y+h*0.5} L ${x+w*0.2} ${y+h*0.8}`, '#dc2626', 'none', 2),
    _path(`M ${x+w*0.5} ${y+h*0.2} L ${x+w*0.8} ${y+h*0.5} L ${x+w*0.5} ${y+h*0.8}`, '#dc2626', 'none', 2),
  ];
}

function shapeLockIcon(x, y, w, h) {
  return [
    _rect(x + w*0.2, y + h*0.4, w*0.6, h*0.55, '#475569', '#475569', 2, 6),
    _path(`M ${x+w*0.3} ${y+h*0.4} L ${x+w*0.3} ${y+h*0.25} A ${w*0.2} ${h*0.15} 0 0 1 ${x+w*0.7} ${y+h*0.25} L ${x+w*0.7} ${y+h*0.4}`, 'none', '#475569', 2.5),
    _circle(x + w/2, y + h*0.6, w*0.06, '#fbbf24', '#f59e0b', 1.5),
    _line(x + w/2, y + h*0.66, x + w/2, y + h*0.75, '#fbbf24', 2),
  ];
}

function shapeKeyIcon(x, y, w, h) {
  return [
    _circle(x + w*0.25, y + h*0.35, w*0.2, 'none', '#f59e0b', 2.5),
    _line(x + w*0.45, y + h*0.35, x + w*0.85, y + h*0.35, '#f59e0b', 2.5),
    _line(x + w*0.7, y + h*0.35, x + w*0.7, y + h*0.5, '#f59e0b', 2),
    _line(x + w*0.85, y + h*0.35, x + w*0.85, y + h*0.55, '#f59e0b', 2),
  ];
}

function shapeShieldIcon(x, y, w, h) {
  return [
    _path(`M ${x+w/2} ${y} L ${x+w*0.9} ${y+h*0.2} L ${x+w*0.9} ${y+h*0.5} Q ${x+w*0.9} ${y+h*0.8} ${x+w/2} ${y+h} Q ${x+w*0.1} ${y+h*0.8} ${x+w*0.1} ${y+h*0.5} L ${x+w*0.1} ${y+h*0.2} Z`, '#dbeafe', '#2563eb', 2),
    _text('✓', x + w/2, y + h*0.55, { fs: 18, fw: '800', color: '#16a34a' }),
  ];
}

function shapeStackIcon(x, y, w, h) {
  return [
    _rect(x + w*0.15, y + h*0.1, w*0.7, h*0.2, '#dbeafe', '#2563eb', 1.5, 4),
    _rect(x + w*0.1, y + h*0.35, w*0.8, h*0.2, '#bfdbfe', '#2563eb', 1.5, 4),
    _rect(x + w*0.05, y + h*0.6, w*0.9, h*0.2, '#93c5fd', '#2563eb', 1.5, 4),
  ];
}

function shapeLinkedList(x, y, w, h) {
  const nodeW = w*0.18, nodeH = h*0.5;
  const segs = [];
  for (let i = 0; i < 4; i++) {
    const nx = x + i * (w*0.25);
    segs.push(_rect(nx, y + h*0.25, nodeW, nodeH, '#dbeafe', '#2563eb', 1.5, 6));
    if (i < 3) segs.push(_arrow(nx + nodeW, y + h*0.5, nx + w*0.25, y + h*0.5, '#475569', 1.5));
  }
  return segs;
}

function shapeTreeNode(x, y, w, h, label = '') {
  return [
    _circle(x + w/2, y + h/2, Math.min(w,h)*0.35, '#dbeafe', '#2563eb', 2),
    ...(label ? [_text(label, x + w/2, y + h/2 + 4, { fs: 12, fw: '700', color: '#1e293b' })] : []),
  ];
}

function shapeHashTable(x, y, w, h) {
  const segs = [];
  for (let i = 0; i < 4; i++) {
    const ry = y + i * (h*0.22);
    segs.push(_rect(x, ry, w*0.3, h*0.2, '#fef3c7', '#f59e0b', 1, 4));
    segs.push(_rect(x + w*0.35, ry, w*0.6, h*0.2, '#f5f5f4', '#a8a29e', 1, 4));
    segs.push(_text(String(i), x + w*0.15, ry + h*0.14, { fs: 10, fw: '700', color: '#92400e' }));
  }
  return segs;
}

function shapeHTTPRequest(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#dbeafe', '#2563eb', 2, 8),
    _text('GET /api', x + w/2, y + h*0.35, { fs: 11, fw: '700', color: '#1e293b' }),
    _text('HTTP/1.1', x + w/2, y + h*0.65, { fs: 9, fw: '500', color: '#64748b' }),
  ];
}

function shapeHTTPResponse(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#dcfce7', '#16a34a', 2, 8),
    _text('200 OK', x + w/2, y + h*0.35, { fs: 12, fw: '700', color: '#166534' }),
    _text('{ data }', x + w/2, y + h*0.65, { fs: 9, fw: '500', color: '#64748b' }),
  ];
}

function shapeJSONBlock(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#1e293b', '#1e293b', 2, 8),
    _text('{', x + w*0.15, y + h*0.2, { fs: 12, fw: '700', color: '#fbbf24' }),
    _text('"key": "val"', x + w*0.25, y + h*0.4, { fs: 9, fw: '500', color: '#93c5fd' }),
    _text('}', x + w*0.15, y + h*0.6, { fs: 12, fw: '700', color: '#fbbf24' }),
  ];
}

// =============================================================================
// CATEGORY 7: BUSINESS & GENERAL (30+ shapes)
// =============================================================================

function shapeFunnel(x, y, w, h, stages = 4) {
  const segs = [];
  const colors = ['#2563eb', '#7c3aed', '#db2777', '#dc2626'];
  for (let i = 0; i < stages; i++) {
    const t = i / stages;
    const topW = w * (1 - t * 0.15);
    const botW = w * (1 - (t + 1/stages) * 0.15);
    const ty = y + h * t;
    const by = y + h * (t + 1/stages);
    const tx = x + (w - topW) / 2;
    const bx = x + (w - botW) / 2;
    segs.push(_path(`M ${tx} ${ty} L ${tx + topW} ${ty} L ${bx + botW} ${by} L ${bx} ${by} Z`, colors[i%colors.length]+'33', colors[i%colors.length], 1.5));
  }
  return segs;
}

function shapeOrgChart(x, y, w, h) {
  const cx = x + w/2;
  const children = [-1, 0, 1].flatMap(i => {
    const nx = cx + i * w*0.3;
    return [
      _line(nx, y + h*0.3, nx, y + h*0.4, '#475569', 1.5),
      _rect(nx - w*0.12, y + h*0.4, w*0.24, h*0.18, '#dcfce7', '#16a34a', 1.5, 6),
    ];
  });
  return [
    _rect(cx - w*0.15, y, w*0.3, h*0.2, '#dbeafe', '#2563eb', 2, 8),
    _text('CEO', cx, y + h*0.12, { fs: 12, fw: '700', color: '#1e293b' }),
    _line(cx, y + h*0.2, cx, y + h*0.3, '#475569', 1.5),
    _line(cx - w*0.3, y + h*0.3, cx + w*0.3, y + h*0.3, '#475569', 1.5),
    ...children,
  ];
}

function shapeTimelineBar(x, y, w, h) {
  return [
    _line(x + w*0.05, y + h*0.5, x + w*0.95, y + h*0.5, '#475569', 3),
    ...Array.from({length: 5}, (_, i) => {
      const px = x + w * (0.1 + i * 0.2);
      return [
        _circle(px, y + h*0.5, 8, '#2563eb', '#1d4ed8', 2),
        _line(px, y + h*0.5, px, y + h*0.2, '#94a3b8', 1),
      ];
    }).flat(),
  ];
}

function shapeSwotMatrix(x, y, w, h) {
  return [
    _rect(x, y, w*0.48, h*0.48, '#dcfce7', '#16a34a', 1.5, 8),
    _text('Strengths', x + w*0.24, y + h*0.1, { fs: 12, fw: '700', color: '#166534' }),
    _rect(x + w*0.52, y, w*0.48, h*0.48, '#fee2e2', '#dc2626', 1.5, 8),
    _text('Weaknesses', x + w*0.76, y + h*0.1, { fs: 12, fw: '700', color: '#991b1b' }),
    _rect(x, y + h*0.52, w*0.48, h*0.48, '#dbeafe', '#2563eb', 1.5, 8),
    _text('Opportunities', x + w*0.24, y + h*0.62, { fs: 12, fw: '700', color: '#1e3a8a' }),
    _rect(x + w*0.52, y + h*0.52, w*0.48, h*0.48, '#fef3c7', '#f59e0b', 1.5, 8),
    _text('Threats', x + w*0.76, y + h*0.62, { fs: 12, fw: '700', color: '#92400e' }),
  ];
}

function shapeGaugeMeter(x, y, w, h, value = 75) {
  const cx = x + w/2, cy = y + h*0.6;
  const r = Math.min(w,h)*0.35;
  const angle = (value/100) * Math.PI;
  return [
    _path(`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`, 'none', '#e2e8f0', 6),
    _path(`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r*Math.cos(Math.PI-angle)} ${cy-r*Math.sin(Math.PI-angle)}`, 'none', value > 70 ? '#16a34a' : value > 40 ? '#f59e0b' : '#dc2626', 6),
    _text(`${value}%`, cx, cy - r*0.3, { fs: 16, fw: '800', color: '#1e293b' }),
  ];
}

function shapeProgressRing(x, y, w, h, percent = 60) {
  const cx = x + w/2, cy = y + h/2;
  const r = Math.min(w,h)*0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent/100);
  return [
    _circle(cx, cy, r, 'none', '#e2e8f0', 6),
    { type: 'draw_path', d: `M ${cx} ${cy-r} A ${r} ${r} 0 1 1 ${cx-0.01} ${cy-r}`, style: { stroke: '#2563eb', strokeWidth: 6, fill: 'none', strokeDasharray: `${circ}`, strokeDashoffset: `${offset}` } },
    _text(`${percent}%`, cx, cy + 6, { fs: 14, fw: '800', color: '#1e293b' }),
  ];
}

function shapeDonutChart(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const r = Math.min(w,h)*0.38;
  const innerR = r * 0.6;
  return [
    _circle(cx, cy, r, '#3b82f6', '#3b82f6', 0),
    _circle(cx, cy, innerR, '#ffffff', '#ffffff', 0),
    _path(`M ${cx} ${cy-r} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`, 'none', '#ef4444', 6),
    _path(`M ${cx+r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy+r}`, 'none', '#f59e0b', 6),
  ];
}

function shapeKPI(x, y, w, h, label = 'KPI', value = '100') {
  return [
    _rect(x, y, w, h, '#f8fafc', '#e2e8f0', 1.5, 12),
    _text(label, x + w/2, y + h*0.3, { fs: 11, fw: '600', color: '#64748b' }),
    _text(value, x + w/2, y + h*0.7, { fs: 22, fw: '800', color: '#1e293b' }),
  ];
}

function shapeTargetIcon(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.4, 'none', '#dc2626', 2),
    _circle(cx, cy, Math.min(w,h)*0.25, 'none', '#dc2626', 2),
    _circle(cx, cy, Math.min(w,h)*0.1, '#dc2626', '#dc2626', 1),
  ];
}

function shapeBulbIcon(x, y, w, h) {
  const cx = x + w/2;
  return [
    _circle(cx, y + h*0.35, w*0.3, '#fef3c7', '#f59e0b', 2),
    _rect(cx - w*0.12, y + h*0.6, w*0.24, h*0.2, '#f5f5f4', '#d1d5db', 1.5, 4),
    _line(cx - w*0.08, y + h*0.67, cx + w*0.08, y + h*0.67, '#d1d5db', 1),
    _line(cx - w*0.08, y + h*0.73, cx + w*0.08, y + h*0.73, '#d1d5db', 1),
  ];
}

function shapeRocketIcon(x, y, w, h) {
  return [
    _path(`M ${x+w*0.5} ${y} Q ${x+w*0.7} ${y+h*0.2} ${x+w*0.6} ${y+h*0.6} L ${x+w*0.4} ${y+h*0.6} Q ${x+w*0.3} ${y+h*0.2} ${x+w*0.5} ${y}`, '#f5f5f4', '#475569', 2),
    _circle(x + w*0.5, y + h*0.3, w*0.06, '#3b82f6', '#1d4ed8', 1.5),
    _path(`M ${x+w*0.4} ${y+h*0.6} L ${x+w*0.3} ${y+h*0.85} L ${x+w*0.4} ${y+h*0.75}`, '#ef4444', '#dc2626', 1.5),
    _path(`M ${x+w*0.6} ${y+h*0.6} L ${x+w*0.7} ${y+h*0.85} L ${x+w*0.6} ${y+h*0.75}`, '#ef4444', '#dc2626', 1.5),
    _path(`M ${x+w*0.45} ${y+h*0.65} Q ${x+w*0.5} ${y+h*0.9} ${x+w*0.55} ${y+h*0.65}`, '#fbbf24', 'none', 1.5),
  ];
}

function shapeFlagIcon(x, y, w, h) {
  return [
    _line(x + w*0.2, y, x + w*0.2, y + h, '#475569', 2),
    _path(`M ${x+w*0.2} ${y} L ${x+w*0.85} ${y+h*0.15} L ${x+w*0.2} ${y+h*0.35}`, '#3b82f6', '#2563eb', 2),
  ];
}

function shapeStarBadge(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const outerR = Math.min(w,h)*0.4;
  const innerR = outerR * 0.4;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI * i) / 5 - Math.PI/2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${cx+Math.cos(ang)*r} ${cy+Math.sin(ang)*r}`);
  }
  return [_path(`M ${pts.join(' L ')} Z`, '#fbbf24', '#f59e0b', 2)];
}

function shapeWarningTriangle(x, y, w, h) {
  return [
    _path(`M ${x+w/2} ${y} L ${x+w} ${y+h} L ${x} ${y+h} Z`, '#fef3c7', '#f59e0b', 2),
    _text('!', x + w/2, y + h*0.75, { fs: 20, fw: '800', color: '#f59e0b' }),
  ];
}

function shapeCheckCircle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.4, '#dcfce7', '#16a34a', 2),
    _path(`M ${cx-w*0.12} ${cy} L ${cx-w*0.03} ${cy+h*0.1} L ${cx+w*0.15} ${cy-h*0.08}`, '#16a34a', 'none', 2.5),
  ];
}

function shapeCrossCircle(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.4, '#fee2e2', '#dc2626', 2),
    _line(cx - w*0.12, cy - h*0.1, cx + w*0.12, cy + h*0.1, '#dc2626', 2.5),
    _line(cx + w*0.12, cy - h*0.1, cx - w*0.12, cy + h*0.1, '#dc2626', 2.5),
  ];
}

function shapeArrowUp(x, y, w, h) {
  return [_path(`M ${x+w/2} ${y} L ${x+w} ${y+h*0.6} L ${x+w*0.65} ${y+h*0.6} L ${x+w*0.65} ${y+h} L ${x+w*0.35} ${y+h} L ${x+w*0.35} ${y+h*0.6} L ${x} ${y+h*0.6} Z`, '#16a34a', '#15803d', 2)];
}

function shapeArrowDown(x, y, w, h) {
  return [_path(`M ${x+w/2} ${y+h} L ${x+w} ${y+h*0.4} L ${x+w*0.65} ${y+h*0.4} L ${x+w*0.65} ${y} L ${x+w*0.35} ${y} L ${x+w*0.35} ${y+h*0.4} L ${x} ${y+h*0.4} Z`, '#dc2626', '#b91c1c', 2)];
}

function shapeHourglass(x, y, w, h) {
  return [
    _path(`M ${x+w*0.2} ${y} L ${x+w*0.8} ${y} L ${x+w*0.55} ${y+h*0.45} L ${x+w*0.8} ${y+h} L ${x+w*0.2} ${y+h} L ${x+w*0.45} ${y+h*0.45} Z`, '#fef3c7', '#f59e0b', 2),
    _rect(x + w*0.15, y - h*0.03, w*0.7, h*0.06, '#f59e0b', '#f59e0b', 0, 2),
    _rect(x + w*0.15, y + h*0.97, w*0.7, h*0.06, '#f59e0b', '#f59e0b', 0, 2),
  ];
}

function shapeCompassIcon(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.4, 'none', '#475569', 2),
    _path(`M ${cx} ${cy-Math.min(w,h)*0.3} L ${cx+6} ${cy} L ${cx} ${cy+Math.min(w,h)*0.3} L ${cx-6} ${cy} Z`, '#dc2626', '#dc2626', 1),
    _path(`M ${cx} ${cy-Math.min(w,h)*0.3} L ${cx-6} ${cy} L ${cx} ${cy+Math.min(w,h)*0.3} L ${cx+6} ${cy} Z`, '#94a3b8', '#94a3b8', 1),
  ];
}

// =============================================================================
// SHAPE REGISTRY — maps names to functions
// =============================================================================

export const SHAPE_REGISTRY = {
  // Science & Biology
  'dna_advanced': shapeDNAAdvanced,
  'cell_animal': shapeCellAnimal,
  'cell_bacteria': shapeCellBacteria,
  'mitochondria': shapeMitochondria,
  'chloroplast': shapeChloroplast,
  'endoplasmic_reticulum': shapeEndoplasmicReticulum,
  'ribosome': shapeRibosome,
  'golgi_apparatus': shapeGolgiApparatus,
  'nucleus_detailed': shapeNucleusDetailed,
  'virus': shapeVirus,
  'antibody': shapeAntibody,
  'stem_cell': shapeStemCell,
  'white_blood_cell': shapeWhiteBloodCell,
  'red_blood_cell': shapeRedBloodCell,
  'platelet': shapePlatelet,
  'neuron_detailed': shapeNeuronDetailed,
  'synapse': shapeSynapse,
  'heart_organ': shapeHeartOrgan,
  'lung': shapeLung,
  'brain': shapeBrain,
  'kidney': shapeKidney,
  'liver': shapeLiver,
  'stomach': shapeStomach,
  'leaf_detailed': shapeLeafDetailed,
  'tree_detailed': shapeTreeDetailed,
  'flower': shapeFlower,
  'mushroom': shapeMushroom,
  'spider': shapeSpider,
  'butterfly': shapeButterfly,
  'fish': shapeFish,
  'bird': shapeBird,
  'pollen_grain': shapePollenGrain,
  'ecosystem': shapeEcosystem,
  'sun': shapeSun,
  'moon': shapeMoon,
  'cloud': shapeCloud,
  'rain_cloud': shapeRainCloud,
  'snowflake': shapeSnowflake,
  'lightning': shapeLightning,
  'tornado': shapeTornado,
  'volcano': shapeVolcano,
  'mountain': shapeMountain,
  'wave_nature': shapeWave,
  'rock_cycle': shapeRockCycle,
  'water_cycle': shapeWaterCycle,
  'carbon_cycle': shapeCarbonCycle,
  'food_chain': shapeFoodChain,

  // Mathematics
  'coordinate_plane': shapeCoordinatePlane,
  'number_line': shapeNumberLine,
  'fraction_bar': shapeFractionBar,
  'pie_chart': shapePieChart,
  'bar_chart': shapeBarChart,
  'line_graph': shapeLineGraph,
  'pyramid': shapePyramid,
  'set_venn': shapeSetVenn,
  'triangle': shapeTriangle,
  'square': shapeSquare,
  'pentagon': shapePentagon,
  'hexagon': shapeHexagon,
  'octagon': shapeOctagon,
  'star_shape': shapeStarShape,
  'circle_shape': shapeCircleShape,
  'oval': shapeOval,
  'parallelogram': shapeParallelogram,
  'trapezoid': shapeTrapezoid,
  'diamond': shapeDiamond,
  'cube': shapeCube,
  'sphere': shapeSphere,
  'cylinder': shapeCylinder,
  'cone': shapeCone,
  'prism': shapePrism,

  // Physics
  'spring': shapeSpring,
  'pendulum': shapePendulum,
  'inclined_plane': shapeInclinedPlane,
  'pulley': shapePulley,
  'free_body_diagram': shapeFreeBodyDiagram,
  'force_vector': shapeForceVector,
  'electric_circuit': shapeElectricCircuit,
  'lens': shapeLens,
  'concave_lens': shapeConcaveLens,
  'mirror': shapeMirror,
  'magnet_shape': shapeMagnetShape,
  'electric_field': shapeElectricFieldLines,
  'gravitational_field': shapeGravitationalField,
  'wave_pulse': shapeWavePulse,
  'standing_wave': shapeStandingWave,
  'energy_bar': shapeEnergyBar,
  'velocity_arrow': shapeVelocityArrow,
  'acceleration_arrow': shapeAccelerationArrow,
  'friction_arrow': shapeFrictionArrow,
  'normal_force': shapeNormalForce,
  'gravity_arrow': shapeGravityArrow,
  'lever': shapeLever,
  'wheel_axle': shapeWheelAndAxle,
  'screw': shapeScrew,
  'wedge': shapeWedge,
  'ramp': shapeRamp,

  // Chemistry
  'beaker': shapeBeaker,
  'flask': shapeFlask,
  'test_tube': shapeTestTube,
  'molecule_water': shapeMoleculeWater,
  'molecule_co2': shapeMoleculeCO2,
  'methane': shapeMethane,
  'reaction_arrow': shapeReactionArrow,
  'equilibrium_arrow': shapeEquilibriumArrow,
  'benzene_ring': shapeBenzeneRing,
  'electron_config': shapeElectronConfiguration,
  'phase_diagram': shapePhaseDiagram,
  'periodic_cell': shapePeriodicTableCell,
  'bond_single': shapeBondSingle,
  'bond_double': shapeBondDouble,
  'bond_triple': shapeBondTriple,
  'ph_scale': shapepHScale,

  // Engineering & Tech
  'gear_detailed': shapeGearDetailed,
  'bolt': shapeBolt,
  'nut': shapeNut,
  'valve': shapeValve,
  'pipe': shapePipe,
  'heat_exchanger': shapeHeatExchanger,
  'motor': shapeMotor,
  'generator': shapeGenerator,
  'transformer': shapeTransformer,
  'breadboard': shapeBreadboard,
  'arduino': shapeArduino,
  'raspberry_pi': shapeRaspberryPi,
  'sensor': shapeSensor,
  'antenna': shapeAntenna,

  // Programming & CS
  'flowchart_process': shapeFlowchartProcess,
  'flowchart_decision': shapeFlowchartDecision,
  'flowchart_start': shapeFlowchartStart,
  'flowchart_end': shapeFlowchartEnd,
  'flowchart_io': shapeFlowchartIO,
  'server_icon': shapeServer,
  'database_icon': shapeDatabaseIcon,
  'cloud_service': shapeCloudService,
  'api_box': shapeAPIBox,
  'cache_box': shapeCacheBox,
  'queue_box': shapeQueueBox,
  'firewall': shapeFirewall,
  'lock_icon': shapeLockIcon,
  'key_icon': shapeKeyIcon,
  'shield_icon': shapeShieldIcon,
  'stack_icon': shapeStackIcon,
  'linked_list': shapeLinkedList,
  'tree_node': shapeTreeNode,
  'hash_table': shapeHashTable,
  'http_request': shapeHTTPRequest,
  'http_response': shapeHTTPResponse,
  'json_block': shapeJSONBlock,

  // Business & General
  'funnel': shapeFunnel,
  'org_chart': shapeOrgChart,
  'timeline_bar': shapeTimelineBar,
  'swot_matrix': shapeSwotMatrix,
  'gauge_meter': shapeGaugeMeter,
  'progress_ring': shapeProgressRing,
  'donut_chart': shapeDonutChart,
  'kpi': shapeKPI,
  'target_icon': shapeTargetIcon,
  'bulb_icon': shapeBulbIcon,
  'rocket_icon': shapeRocketIcon,
  'flag_icon': shapeFlagIcon,
  'star_badge': shapeStarBadge,
  'warning_triangle': shapeWarningTriangle,
  'check_circle': shapeCheckCircle,
  'cross_circle': shapeCrossCircle,
  'arrow_up': shapeArrowUp,
  'arrow_down': shapeArrowDown,
  'hourglass': shapeHourglass,
  'compass': shapeCompassIcon,
};

// =============================================================================
// ALIASES — maps common names/synonyms to registry keys
// =============================================================================

export const SHAPE_ALIASES = {
  // Biology
  'dna': 'dna_advanced', 'double helix': 'dna_advanced', 'helix': 'dna_advanced', 'genome': 'dna_advanced',
  'animal cell': 'cell_animal', 'eukaryotic cell': 'cell_animal',
  'bacteria': 'cell_bacteria', 'prokaryotic cell': 'cell_bacteria',
  'mitochondrion': 'mitochondria', 'powerhouse': 'mitochondria',
  'chloroplast': 'chloroplast', 'photosynthesis organelle': 'chloroplast',
  'er': 'endoplasmic_reticulum', 'rough er': 'endoplasmic_reticulum',
  'golgi': 'golgi_apparatus', 'golgi body': 'golgi_apparatus',
  'nucleus': 'nucleus_detailed', 'cell nucleus': 'nucleus_detailed',
  'virus': 'virus', 'pathogen': 'virus', 'covid': 'virus',
  'immune': 'antibody', 'immunoglobulin': 'antibody',
  'stem': 'stem_cell', 'undifferentiated': 'stem_cell',
  'wbc': 'white_blood_cell', 'leukocyte': 'white_blood_cell',
  'rbc': 'red_blood_cell', 'erythrocyte': 'red_blood_cell',
  'platelet': 'platelet', 'thrombocyte': 'platelet',
  'nerve cell': 'neuron_detailed', 'neuron': 'neuron_detailed',
  'nerve': 'neuron_detailed',
  'synapse': 'synapse', 'neural junction': 'synapse',
  'heart': 'heart_organ', 'cardiac': 'heart_organ',
  'lungs': 'lung', 'pulmonary': 'lung',
  'brain': 'brain', 'cerebral': 'brain',
  'kidney': 'kidney', 'renal': 'kidney',
  'liver': 'liver', 'hepatic': 'liver',
  'stomach': 'stomach', 'gastric': 'stomach',
  'leaf': 'leaf_detailed', 'foliage': 'leaf_detailed',
  'tree': 'tree_detailed', 'plant': 'tree_detailed',
  'flower': 'flower', 'bloom': 'flower',
  'fungus': 'mushroom', 'mushroom': 'mushroom',
  'arachnid': 'spider', 'spider': 'spider',
  'lepidoptera': 'butterfly', 'butterfly': 'butterfly',
  'fish': 'fish', 'aquatic': 'fish',
  'bird': 'bird', 'avian': 'bird',
  'pollen': 'pollen_grain',
  'ecosystem': 'ecosystem', 'biome': 'ecosystem',
  'star': 'sun', 'sun': 'sun', 'sol': 'sun',
  'moon': 'moon', 'lunar': 'moon',
  'cloud': 'cloud', 'cumulus': 'cloud',
  'rain': 'rain_cloud', 'precipitation': 'rain_cloud',
  'snow': 'snowflake', 'ice crystal': 'snowflake',
  'thunder': 'lightning', 'lightning': 'lightning', 'bolt': 'lightning',
  'tornado': 'tornado', 'cyclone': 'tornado',
  'volcano': 'volcano', 'eruption': 'volcano',
  'mountain': 'mountain', 'peak': 'mountain',
  'ocean': 'wave_nature', 'wave': 'wave_nature',
  'rock cycle': 'rock_cycle', 'geology cycle': 'rock_cycle',
  'water cycle': 'water_cycle', 'hydrologic cycle': 'water_cycle',
  'carbon cycle': 'carbon_cycle',
  'food chain': 'food_chain', 'food web': 'food_chain',

  // Math
  'graph': 'coordinate_plane', 'axes': 'coordinate_plane', 'xy plane': 'coordinate_plane', 'cartesian': 'coordinate_plane',
  'number line': 'number_line', 'ruler': 'number_line',
  'fraction': 'fraction_bar', 'ratio bar': 'fraction_bar',
  'pie': 'pie_chart', 'circle chart': 'pie_chart', 'donut': 'pie_chart',
  'bar graph': 'bar_chart', 'histogram': 'bar_chart',
  'line chart': 'line_graph', 'plot': 'line_graph',
  'pyramid': 'pyramid', 'triangle stack': 'pyramid',
  'venn': 'set_venn', 'venn diagram': 'set_venn', 'sets': 'set_venn',
  'triangle': 'triangle',
  'square': 'square', 'rectangle': 'square',
  'pentagon': 'pentagon',
  'hexagon': 'hexagon',
  'octagon': 'octagon',
  'star': 'star_shape',
  'circle': 'circle_shape',
  'ellipse': 'oval', 'oval': 'oval',
  'parallelogram': 'parallelogram',
  'trapezoid': 'trapezoid',
  'diamond': 'diamond', 'rhombus': 'diamond',
  '3d cube': 'cube', 'box 3d': 'cube',
  'ball': 'sphere', 'sphere': 'sphere', '3d sphere': 'sphere',
  'tube': 'cylinder', 'cylinder': 'cylinder',
  'cone': 'cone',
  'prism': 'prism', 'triangular prism': 'prism',

  // Physics
  'coil': 'spring', 'spring': 'spring',
  'pendulum': 'pendulum', 'bob': 'pendulum',
  'ramp': 'inclined_plane', 'inclined plane': 'inclined_plane', 'slope': 'inclined_plane',
  'pulley': 'pulley', 'block and tackle': 'pulley',
  'free body': 'free_body_diagram', 'fbd': 'free_body_diagram',
  'force arrow': 'force_vector', 'vector': 'force_vector',
  'circuit': 'electric_circuit', 'electrical circuit': 'electric_circuit',
  'lens': 'lens', 'convex lens': 'lens', 'converging lens': 'lens',
  'concave lens': 'concave_lens', 'diverging lens': 'concave_lens',
  'mirror': 'mirror', 'reflecting mirror': 'mirror',
  'magnet': 'magnet_shape', 'horseshoe magnet': 'magnet_shape',
  'electric field': 'electric_field', 'efield': 'electric_field',
  'gravity field': 'gravitational_field', 'gfield': 'gravitational_field',
  'pulse': 'wave_pulse', 'wave pulse': 'wave_pulse',
  'standing wave': 'standing_wave', 'resonance': 'standing_wave',
  'ke pe bar': 'energy_bar', 'kinetic potential': 'energy_bar',
  'velocity': 'velocity_arrow', 'speed': 'velocity_arrow',
  'acceleration': 'acceleration_arrow', 'accel': 'acceleration_arrow',
  'friction': 'friction_arrow', 'drag': 'friction_arrow',
  'normal force': 'normal_force', 'reaction force': 'normal_force',
  'gravity': 'gravity_arrow', 'weight': 'gravity_arrow',
  'lever': 'lever', 'fulcrum': 'lever',
  'wheel': 'wheel_axle', 'axle': 'wheel_axle',
  'screw': 'screw',
  'wedge': 'wedge',
  'simple machine': 'ramp',

  // Chemistry
  'beaker': 'beaker', 'lab beaker': 'beaker',
  'erlenmeyer': 'flask', 'flask': 'flask', 'conical flask': 'flask',
  'test tube': 'test_tube', 'tube': 'test_tube',
  'water molecule': 'molecule_water', 'h2o': 'molecule_water',
  'co2 molecule': 'molecule_co2', 'carbon dioxide': 'molecule_co2',
  'ch4': 'methane', 'methane molecule': 'methane',
  'arrow reaction': 'reaction_arrow', 'yields': 'reaction_arrow',
  'equilibrium': 'equilibrium_arrow', 'reversible': 'equilibrium_arrow',
  'benzene': 'benzene_ring', 'aromatic': 'benzene_ring',
  'electron shells': 'electron_config', 'bohr model': 'electron_config',
  'phase diagram': 'phase_diagram', 'pt diagram': 'phase_diagram',
  'element': 'periodic_cell', 'periodic table': 'periodic_cell',
  'single bond': 'bond_single', 'sigma bond': 'bond_single',
  'double bond': 'bond_double', 'pi bond': 'bond_double',
  'triple bond': 'bond_triple',
  'acidity': 'ph_scale', 'ph': 'ph_scale', 'acid base': 'ph_scale',

  // Engineering
  'gear': 'gear_detailed', 'cog': 'gear_detailed', 'cogwheel': 'gear_detailed',
  'screw bolt': 'bolt', 'fastener': 'bolt',
  'hex nut': 'nut',
  'valve': 'valve', 'gate valve': 'valve',
  'pipe': 'pipe', 'tube eng': 'pipe',
  'heat exchanger': 'heat_exchanger', 'radiator': 'heat_exchanger',
  'electric motor': 'motor', 'motor': 'motor',
  'generator': 'generator', 'alternator': 'generator',
  'transformer': 'transformer',
  'breadboard': 'breadboard', 'protoboard': 'breadboard',
  'arduino': 'arduino', 'microcontroller': 'arduino',
  'raspberry pi': 'raspberry_pi', 'rpi': 'raspberry_pi',
  'sensor': 'sensor', 'transducer': 'sensor',
  'antenna': 'antenna', 'aerial': 'antenna',

  // Programming
  'process box': 'flowchart_process', 'rect flowchart': 'flowchart_process',
  'decision diamond': 'flowchart_decision', 'if diamond': 'flowchart_decision',
  'start oval': 'flowchart_start', 'begin': 'flowchart_start',
  'end oval': 'flowchart_end', 'stop': 'flowchart_end',
  'io parallelogram': 'flowchart_io', 'input output': 'flowchart_io',
  'server': 'server_icon', 'vm': 'server_icon', 'host': 'server_icon',
  'db': 'database_icon', 'database': 'database_icon', 'sql': 'database_icon',
  'cloud': 'cloud_service', 'saas': 'cloud_service', 'aws': 'cloud_service',
  'api': 'api_box', 'endpoint': 'api_box', 'rest api': 'api_box',
  'cache': 'cache_box', 'redis': 'cache_box', 'memcached': 'cache_box',
  'queue': 'queue_box', 'mq': 'queue_box', 'kafka': 'queue_box',
  'firewall': 'firewall', 'security wall': 'firewall',
  'lock': 'lock_icon', 'encrypt': 'lock_icon', 'auth lock': 'lock_icon',
  'key': 'key_icon', 'token': 'key_icon', 'credential': 'key_icon',
  'shield': 'shield_icon', 'protection': 'shield_icon',
  'stack': 'stack_icon', 'call stack': 'stack_icon',
  'linked list': 'linked_list', 'list': 'linked_list',
  'tree node': 'tree_node', 'binary tree': 'tree_node',
  'hash table': 'hash_table', 'hashmap': 'hash_table',
  'request': 'http_request', 'http request': 'http_request',
  'response': 'http_response', 'http response': 'http_response',
  'json': 'json_block', 'object literal': 'json_block',

  // Business
  'funnel': 'funnel', 'marketing funnel': 'funnel', 'sales funnel': 'funnel',
  'org chart': 'org_chart', 'organization chart': 'org_chart',
  'timeline': 'timeline_bar', 'chronology': 'timeline_bar',
  'swot': 'swot_matrix', 'swot analysis': 'swot_matrix',
  'gauge': 'gauge_meter', 'meter': 'gauge_meter', 'dial': 'gauge_meter',
  'progress': 'progress_ring', 'loading': 'progress_ring', 'completion': 'progress_ring',
  'donut chart': 'donut_chart', 'ring chart': 'donut_chart',
  'kpi': 'kpi', 'metric': 'kpi', 'indicator': 'kpi',
  'target': 'target_icon', 'bullseye': 'target_icon', 'goal': 'target_icon',
  'idea': 'bulb_icon', 'lightbulb': 'bulb_icon', 'innovation': 'bulb_icon',
  'launch': 'rocket_icon', 'startup': 'rocket_icon', 'growth': 'rocket_icon',
  'milestone': 'flag_icon', 'marker': 'flag_icon',
  'award': 'star_badge', 'badge': 'star_badge', 'achievement': 'star_badge',
  'warning': 'warning_triangle', 'alert': 'warning_triangle', 'caution': 'warning_triangle',
  'success': 'check_circle', 'approved': 'check_circle', 'done': 'check_circle',
  'error': 'cross_circle', 'failed': 'cross_circle', 'rejected': 'cross_circle',
  'trend up': 'arrow_up', 'increase': 'arrow_up', 'growth arrow': 'arrow_up',
  'trend down': 'arrow_down', 'decrease': 'arrow_down', 'decline': 'arrow_down',
  'time': 'hourglass', 'clock': 'hourglass', 'duration': 'hourglass',
  'direction': 'compass', 'navigation': 'compass', 'orientation': 'compass',
};

// ── Wire in 100+ programming shapes from programmingShapeLibrary.js ─────────
if (typeof registerProgrammingShapes === 'function') {
  registerProgrammingShapes(SHAPE_REGISTRY, SHAPE_ALIASES);
}

// =============================================================================
// RESOLVE — find shape by name with alias support
// =============================================================================

export function resolveShape(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  if (SHAPE_REGISTRY[key]) return key;
  if (SHAPE_ALIASES[key]) return SHAPE_ALIASES[key];
  // Fuzzy: check if any alias contains the search term
  for (const [alias, registryKey] of Object.entries(SHAPE_ALIASES)) {
    if (alias.includes(key) || key.includes(alias)) return registryKey;
  }
  return null;
}

/**
 * Render a named shape positioned within (x, y, w, h).
 * Returns array of scene fragments, or empty array if shape not found.
 */
export function renderShape(name, x, y, w, h, ...args) {
  const key = resolveShape(name);
  if (!key) return [];
  try {
    const fn = SHAPE_REGISTRY[key];
    return (fn(x, y, w, h, ...args) || []).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Search shapes by keyword — returns matching shape names.
 * Used by the AI to discover available shapes.
 */
export function searchShapes(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return Object.keys(SHAPE_REGISTRY).slice(0, 20);
  const matches = new Set();
  for (const [alias, key] of Object.entries(SHAPE_ALIASES)) {
    if (alias.includes(q) || q.includes(alias)) matches.add(key);
  }
  for (const key of Object.keys(SHAPE_REGISTRY)) {
    if (key.includes(q)) matches.add(key);
  }
  return [...matches].slice(0, 30);
}

/**
 * Get all shape names grouped by category.
 */
export function getShapeCategories() {
  const progShapes = ['flowchart_process','flowchart_decision','flowchart_start','flowchart_end','flowchart_io','server_icon','database_icon','cloud_service','api_box','cache_box','queue_box','firewall','lock_icon','key_icon','shield_icon','stack_icon','linked_list','tree_node','hash_table','http_request','http_response','json_block'];
  const dsShapes = ['array_linear','array_2d','linked_list_single','linked_list_double','stack_diagram','queue_diagram','priority_queue','binary_tree','bst_diagram','avl_tree','heap_min','heap_max','trie_diagram','graph_undirected','graph_directed','graph_weighted','adjacency_matrix','bloom_filter','lru_cache','disjoint_set','skip_list'];
  const algoShapes = ['binary_search','linear_search','bubble_sort','selection_sort','insertion_sort','merge_sort','quick_sort','heap_sort','counting_sort','bfs_graph','dfs_graph','dijkstra','recursion_tree','dp_table','sliding_window','two_pointer','knapsack'];
  const codeShapes = ['code_block','function_declaration','variable_declaration','if_else_diagram','for_loop_diagram','while_loop','try_catch','class_diagram','arrow_function','async_function','promise_chain','destructuring','spread_operator','import_statement','switch_case','array_method_chain','interface_diagram'];
  const webShapes = ['client_server','rest_api','browser_diagram','dom_tree','url_components','jwt_diagram','oauth_flow','middleware_chain','graphql_diagram','websocket','http_request_diagram','http_response_diagram','cookie_session','ssr_diagram','csr_diagram'];
  const sdShapes = ['load_balancer','message_queue','pub_sub','api_gateway','microservices','monolithic','event_driven','cap_theorem','cdn_diagram','database_shard','cqrs_pattern','circuit_breaker','rate_limiter','reverse_proxy'];
  const devopsShapes = ['git_branch','git_merge','docker_container','ci_cd_pipeline','docker_compose','kubernetes_pod','github_actions','terraform','monitoring','helm_chart','service_mesh'];
  const allProg = [...progShapes, ...dsShapes, ...algoShapes, ...codeShapes, ...webShapes, ...sdShapes, ...devopsShapes];
  return {
    science_biology: Object.keys(SHAPE_REGISTRY).filter(k => ['dna_advanced','cell_animal','cell_bacteria','mitochondria','chloroplast','endoplasmic_reticulum','ribosome','golgi_apparatus','nucleus_detailed','virus','antibody','stem_cell','white_blood_cell','red_blood_cell','platelet','neuron_detailed','synapse','heart_organ','lung','brain','kidney','liver','stomach','leaf_detailed','tree_detailed','flower','mushroom','spider','butterfly','fish','bird','pollen_grain','ecosystem','sun','moon','cloud','rain_cloud','snowflake','lightning','tornado','volcano','mountain','wave_nature','rock_cycle','water_cycle','carbon_cycle','food_chain'].includes(k)),
    mathematics: Object.keys(SHAPE_REGISTRY).filter(k => ['coordinate_plane','number_line','fraction_bar','pie_chart','bar_chart','line_graph','pyramid','set_venn','triangle','square','pentagon','hexagon','octagon','star_shape','circle_shape','oval','parallelogram','trapezoid','diamond','cube','sphere','cylinder','cone','prism'].includes(k)),
    physics: Object.keys(SHAPE_REGISTRY).filter(k => ['spring','pendulum','inclined_plane','pulley','free_body_diagram','force_vector','electric_circuit','lens','concave_lens','mirror','magnet_shape','electric_field','gravitational_field','wave_pulse','standing_wave','energy_bar','velocity_arrow','acceleration_arrow','friction_arrow','normal_force','gravity_arrow','lever','wheel_axle','screw','wedge','ramp'].includes(k)),
    chemistry: Object.keys(SHAPE_REGISTRY).filter(k => ['beaker','flask','test_tube','molecule_water','molecule_co2','methane','reaction_arrow','equilibrium_arrow','benzene_ring','electron_config','phase_diagram','periodic_cell','bond_single','bond_double','bond_triple','ph_scale'].includes(k)),
    engineering: Object.keys(SHAPE_REGISTRY).filter(k => ['gear_detailed','bolt','nut','valve','pipe','heat_exchanger','motor','generator','transformer','breadboard','arduino','raspberry_pi','sensor','antenna'].includes(k)),
    programming: Object.keys(SHAPE_REGISTRY).filter(k => allProg.includes(k)),
    data_structures: Object.keys(SHAPE_REGISTRY).filter(k => dsShapes.includes(k)),
    algorithms: Object.keys(SHAPE_REGISTRY).filter(k => algoShapes.includes(k)),
    code_syntax: Object.keys(SHAPE_REGISTRY).filter(k => codeShapes.includes(k)),
    web_api: Object.keys(SHAPE_REGISTRY).filter(k => webShapes.includes(k)),
    system_design: Object.keys(SHAPE_REGISTRY).filter(k => sdShapes.includes(k)),
    devops_tools: Object.keys(SHAPE_REGISTRY).filter(k => devopsShapes.includes(k)),
    business_general: Object.keys(SHAPE_REGISTRY).filter(k => ['funnel','org_chart','timeline_bar','swot_matrix','gauge_meter','progress_ring','donut_chart','kpi','target_icon','bulb_icon','rocket_icon','flag_icon','star_badge','warning_triangle','check_circle','cross_circle','arrow_up','arrow_down','hourglass','compass'].includes(k)),
  };
}
