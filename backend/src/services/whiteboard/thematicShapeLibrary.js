// =============================================================================
// THEMATIC SHAPE LIBRARY — 150+ thematic scene shapes for whiteboard rendering
// =============================================================================
// Each shape receives (x, y, w, h) and returns an array of fragments:
//   draw_circle, draw_rect, draw_path, draw_text, draw_line, draw_arrow
//
// These are organized by theme: space, ocean, weather, fantasy, architecture,
// music, sports, food, travel, fantasy, mythology, and more.
// =============================================================================

// Helper builders
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
function _ellipse(cx, cy, rx, ry, fill, stroke, sw) {
  return { type: 'draw_path', d: `M ${cx-rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx+rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx-rx} ${cy}`, style: { fill, stroke, strokeWidth: sw } };
}

// ── THEME 1: SPACE & ASTRONOMY (20 shapes) ──────────────────────────────

function shapeRocket(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx} ${y+h*0.05} L ${x+w*0.3} ${y+h*0.65} Q ${cx} ${y+h*0.5} ${x+w*0.7} ${y+h*0.65} Z`, '#e0f2fe', '#0ea5e9', 2),
    _circle(cx, y + h*0.25, 4, '#fbbf24', '#f59e0b', 1),
    _circle(cx, y + h*0.4, 4, '#fbbf24', '#f59e0b', 1),
    _path(`M ${x+w*0.3} ${y+h*0.65} L ${x+w*0.15} ${y+h*0.9} L ${x+w*0.35} ${y+h*0.72} Z`, '#fca5a5', '#ef4444', 1.5),
    _path(`M ${x+w*0.7} ${y+h*0.65} L ${x+w*0.85} ${y+h*0.9} L ${x+w*0.65} ${y+h*0.72} Z`, '#fca5a5', '#ef4444', 1.5),
    // Flame
    _path(`M ${cx-w*0.08} ${y+h*0.65} Q ${cx} ${y+h*0.85} ${cx+w*0.08} ${y+h*0.65}`, '#fbbf24', '#f59e0b', 1),
  ];
}

function shapeTelescope(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.2} ${y+h*0.9} L ${cx-w*0.08} ${y+h*0.2} Q ${cx} ${y} ${cx+w*0.15} ${y+h*0.15} L ${x+w*0.65} ${y+h*0.8} Q ${x+w*0.5} ${y+h} ${x+w*0.2} ${y+h*0.9}`, '#e2e8f0', '#64748b', 2),
    _circle(cx + w*0.1, y + h*0.1, w*0.06, '#dbeafe', '#3b82f6', 2),
    _circle(cx + w*0.04, y + h*0.15, w*0.03, '#fbbf24', '#f59e0b', 1),
    _rect(x + w*0.05, y + h*0.85, w*0.25, h*0.05, '#475569', '#334155', 1, 3),
  ];
}

function shapeSatellite(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(cx - w*0.08, cy - h*0.05, w*0.16, h*0.1, '#e2e8f0', '#64748b', 2, 4),
    _rect(cx - w*0.15, cy - h*0.12, w*0.3, h*0.04, '#94a3b8', '#64748b', 1, 2),
    _circle(cx, cy, w*0.03, '#fbbf24', '#f59e0b', 1),
    _rect(cx - w*0.02, cy + h*0.05, w*0.04, h*0.2, '#64748b', '#475569', 1, 2),
    _rect(cx - w*0.12, cy + h*0.2, w*0.08, h*0.15, '#3b82f6', '#1d4ed8', 1.5, 4),
    _rect(cx + w*0.04, cy + h*0.2, w*0.08, h*0.15, '#3b82f6', '#1d4ed8', 1.5, 4),
  ];
}

function shapeSolarPanel(x, y, w, h) {
  return [
    _rect(x + w*0.05, y + h*0.05, w*0.9, h*0.9, '#dbeafe', '#3b82f6', 2, 6),
    _line(x + w*0.05, y + h*0.35, x + w*0.95, y + h*0.35, '#93c5fd', 1),
    _line(x + w*0.05, y + h*0.65, x + w*0.95, y + h*0.65, '#93c5fd', 1),
    _line(x + w*0.35, y + h*0.05, x + w*0.35, y + h*0.95, '#93c5fd', 1),
    _line(x + w*0.65, y + h*0.05, x + w*0.65, y + h*0.95, '#93c5fd', 1),
    // Sun rays
    _line(x + w*0.5, y - h*0.1, x + w*0.5, y + h*0.05, '#f59e0b', 1.5),
    _line(x + w*0.35, y - h*0.05, x + w*0.4, y + h*0.05, '#f59e0b', 1),
    _line(x + w*0.65, y - h*0.05, x + w*0.6, y + h*0.05, '#f59e0b', 1),
  ];
}

function shapeMilkyWay(x, y, w, h) {
  const segs = [];
  // Galaxy body
  segs.push(_path(`M ${x+w*0.05} ${y+h*0.5} Q ${x+w*0.2} ${y+h*0.2} ${x+w*0.4} ${y+h*0.35} Q ${x+w*0.6} ${y+h*0.45} ${x+w*0.8} ${y+h*0.3} Q ${x+w*0.9} ${y+h*0.25} ${x+w*0.95} ${y+h*0.4}`, 'none', '#c084fc', 3));
  // Stars
  for (let i = 0; i < 20; i++) {
    const sx = x + Math.random() * w;
    const sy = y + Math.random() * h;
    const sr = 1 + Math.random() * 2;
    segs.push(_circle(sx, sy, sr, '#fbbf24', '#f59e0b', 0.5));
  }
  // Core glow
  segs.push(_ellipse(x + w*0.5, y + h*0.38, w*0.15, h*0.08, '#fef3c7', 'none', 0));
  return segs;
}

function shapeAstronaut(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, y + h*0.2, w*0.15, '#e2e8f0', '#94a3b8', 2),
    _rect(x + w*0.25, y + h*0.32, w*0.5, h*0.5, '#e2e8f0', '#94a3b8', 2, 8),
    _rect(x + w*0.1, y + h*0.5, w*0.15, h*0.25, '#94a3b8', '#64748b', 1.5, 4),
    _rect(x + w*0.75, y + h*0.5, w*0.15, h*0.25, '#94a3b8', '#64748b', 1.5, 4),
    _circle(cx, cy - h*0.05, w*0.03, '#fbbf24', '#f59e0b', 0.5),
    _circle(cx, cy + h*0.05, w*0.03, '#fbbf24', '#f59e0b', 0.5),
  ];
}

function shapeBlackHole(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_circle(cx, cy, 6, '#1e293b', '#0f172a', 1.5)];
  for (let i = 1; i <= 4; i++) {
    const r = Math.min(w,h) * 0.08 * i;
    const opacity = 1 - i * 0.2;
    segs.push(_circle(cx, cy, r, 'none', `rgba(139,92,246,${opacity})`, 1.5));
    // Accretion disk distortion
    segs.push(_path(`M ${cx-r} ${cy+h*0.05*(i%2).toString()*0.03} Q ${cx} ${cy-r*0.5+h*0.02} ${cx+r} ${cy-h*0.05*(i%2)}`, 'none', '#a855f7', 1));
  }
  return segs;
}

// ── THEME 2: OCEAN & MARINE (15 shapes) ─────────────────────────────────

function shapeWaveOcean(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.6} Q ${x+w*0.125} ${y+h*0.3} ${x+w*0.25} ${y+h*0.55} Q ${x+w*0.375} ${y+h*0.75} ${x+w*0.5} ${y+h*0.5} Q ${x+w*0.625} ${y+h*0.25} ${x+w*0.75} ${y+h*0.55} Q ${x+w*0.875} ${y+h*0.8} ${x+w} ${y+h*0.5} L ${x+w} ${y+h} L ${x} ${y+h} Z`, '#bfdbfe', '#3b82f6', 2),
    _circle(x + w*0.2, y + h*0.42, 3, '#ffffff', 'none', 0),
    _circle(x + w*0.7, y + h*0.38, 2, '#ffffff', 'none', 0),
  ];
}

function shapeWhale(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.05} ${cy+h*0.15} Q ${x+w*0.3} ${cy-h*0.2} ${cx+w*0.1} ${cy-h*0.15} Q ${x+w*0.9} ${cy-h*0.3} ${x+w*0.95} ${cy-h*0.05} Q ${x+w} ${cy+h*0.1} ${x+w*0.95} ${cy+h*0.15} Q ${x+w*0.8} ${cy+h*0.25} ${x+w*0.6} ${cy+h*0.1} Q ${x+w*0.4} ${cy+h*0.3} ${x+w*0.2} ${cy+h*0.2} L ${x+w*0.05} ${cy+h*0.15}`, '#93c5fd', '#3b82f6', 2),
    // Tail
    _path(`M ${x+w*0.95} ${cy-h*0.05} L ${x+w*1.05} ${cy-h*0.25} L ${x+w*0.98} ${cy-h*0.1} L ${x+w*1.05} ${cy+h*0.15} Z`, '#93c5fd', '#3b82f6', 1.5),
    // Eye
    _circle(cx - w*0.15, cy - h*0.02, 3, '#1e293b', '#1e293b', 0.5),
    // Water spout
    _line(x + w*0.6, y + h*0.15, x + w*0.55, y + h*0.02, '#60a5fa', 1.5),
    _line(x + w*0.6, y + h*0.15, x + w*0.6, y, '#60a5fa', 1),
    _line(x + w*0.6, y + h*0.15, x + w*0.65, y + h*0.02, '#60a5fa', 1),
  ];
}

function shapeShark(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.1} ${cy} Q ${x+w*0.2} ${cy-h*0.2} ${cx+w*0.05} ${cy-h*0.15} Q ${x+w*0.8} ${cy-h*0.3} ${x+w*0.9} ${cy-h*0.1} L ${x+w} ${cy} L ${x+w*0.9} ${cy+h*0.1} Q ${x+w*0.7} ${cy+h*0.25} ${x+w*0.4} ${cy+h*0.15} Q ${x+w*0.2} ${cy+h*0.2} ${x+w*0.1} ${cy}`, '#cbd5e1', '#64748b', 2),
    // Fin
    _path(`M ${cx+w*0.05} ${cy-h*0.15} L ${cx+w*0.1} ${cy-h*0.3} L ${cx+w*0.2} ${cy-h*0.12} Z`, '#94a3b8', '#64748b', 1.5),
    // Tail
    _path(`M ${x+w*0.9} ${cy-h*0.1} L ${x+w*1.05} ${cy-h*0.3} L ${x+w*0.95} ${cy} Z`, '#94a3b8', '#64748b', 1.5),
    // Eye & teeth
    _circle(cx - w*0.2, cy - h*0.02, 3, '#1e293b', '#1e293b', 0.5),
    _line(cx - w*0.1, cy + h*0.05, cx - w*0.08, cy + h*0.1, '#ffffff', 1),
    _line(cx - w*0.05, cy + h*0.05, cx - w*0.03, cy + h*0.1, '#ffffff', 1),
    _line(cx, cy + h*0.05, cx + w*0.02, cy + h*0.1, '#ffffff', 1),
  ];
}

function shapeCoralReef(x, y, w, h) {
  return [
    _path(`M ${x+w*0.1} ${y+h*0.9} Q ${x+w*0.15} ${y+h*0.5} ${x+w*0.2} ${y+h*0.3}`, '#fca5a5', '#ef4444', 2.5),
    _path(`M ${x+w*0.2} ${y+h*0.9} Q ${x+w*0.3} ${y+h*0.6} ${x+w*0.35} ${y+h*0.4}`, '#fca5a5', '#ef4444', 2),
    _path(`M ${x+w*0.5} ${y+h*0.9} Q ${x+w*0.55} ${y+h*0.45} ${x+w*0.6} ${y+h*0.25}`, '#fbbf24', '#f59e0b', 2.5),
    _path(`M ${x+w*0.6} ${y+h*0.9} Q ${x+w*0.65} ${y+h*0.5} ${x+w*0.7} ${y+h*0.35}`, '#fbbf24', '#f59e0b', 2),
    _path(`M ${x+w*0.75} ${y+h*0.9} Q ${x+w*0.8} ${y+h*0.55} ${x+w*0.85} ${y+h*0.4}`, '#c084fc', '#a855f7', 2),
    _circle(x + w*0.2, y + h*0.3, 8, '#fca5a5', '#ef4444', 1.5),
    _circle(x + w*0.35, y + h*0.4, 6, '#fca5a5', '#ef4444', 1.5),
    _circle(x + w*0.6, y + h*0.25, 8, '#fde68a', '#f59e0b', 1.5),
    _circle(x + w*0.85, y + h*0.4, 6, '#e9d5ff', '#a855f7', 1.5),
  ];
}

function shapeSubmarine(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy, w*0.4, h*0.25, '#94a3b8', '#475569', 2),
    _rect(cx - w*0.05, cy - h*0.2, w*0.1, h*0.1, '#475569', '#334155', 1.5, 4),
    _circle(cx + w*0.1, cy - h*0.02, 4, '#93c5fd', '#3b82f6', 1),
    _rect(cx - w*0.3, cy - h*0.02, w*0.08, h*0.04, '#64748b', '#475569', 1, 2),
    _rect(cx + w*0.35, cy - h*0.02, w*0.08, h*0.04, '#64748b', '#475569', 1, 2),
    _path(`M ${x+w*0.85} ${cy} L ${x+w*0.95} ${cy-h*0.08} L ${x+w*0.95} ${cy+h*0.08} Z`, '#64748b', '#475569', 1.5),
  ];
}

function shapeJellyfish(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.2} ${y+h*0.35} Q ${cx} ${y} ${x+w*0.8} ${y+h*0.35} Q ${cx} ${y+h*0.45} ${x+w*0.2} ${y+h*0.35}`, '#fce7f3', '#ec4899', 2),
    _path(`M ${cx-w*0.08} ${y+h*0.35} Q ${cx-w*0.1} ${y+h*0.7} ${cx-w*0.05} ${y+h*0.85}`, '#f9a8d4', '#ec4899', 1),
    _path(`M ${cx} ${y+h*0.38} Q ${cx-w*0.02} ${y+h*0.7} ${cx} ${y+h*0.9}`, '#f9a8d4', '#ec4899', 1),
    _path(`M ${cx+w*0.08} ${y+h*0.35} Q ${cx+w*0.1} ${y+h*0.7} ${cx+w*0.05} ${y+h*0.85}`, '#f9a8d4', '#ec4899', 1),
    _circle(cx - w*0.1, y + h*0.25, 3, '#f472b6', '#db2777', 0.5),
    _circle(cx + w*0.1, y + h*0.25, 3, '#f472b6', '#db2777', 0.5),
  ];
}

// ── THEME 3: WEATHER & NATURE (18 shapes) ───────────────────────────────

function shapeThunderstorm(x, y, w, h) {
  const cloud = _circle(x + w*0.4, y + h*0.2, w*0.15, '#64748b', '#475569', 1.5);
  const cloud2 = _circle(x + w*0.6, y + h*0.15, w*0.18, '#64748b', '#475569', 1.5);
  const cloud3 = _circle(x + w*0.75, y + h*0.2, w*0.15, '#64748b', '#475569', 1.5);
  const base = _rect(x + w*0.25, y + h*0.2, w*0.6, h*0.12, '#64748b', '#475569', 1, 6);
  const bolt = _path(`M ${x+w*0.55} ${y+h*0.35} L ${x+w*0.45} ${y+h*0.6} L ${x+w*0.52} ${y+h*0.6} L ${x+w*0.42} ${y+h*0.85} L ${x+w*0.58} ${y+h*0.5} L ${x+w*0.5} ${y+h*0.5} Z`, '#fbbf24', '#f59e0b', 1.5);
  const rain = [];
  for (let i = 0; i < 6; i++) {
    const rx = x + w*(0.15 + i*0.12);
    rain.push(_line(rx, y + h*0.4, rx - 3, y + h*0.7, '#3b82f6', 1.5));
  }
  return [cloud, cloud2, cloud3, base, bolt, ...rain];
}

function shapeAurora(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#0f172a', '#1e293b', 1, 6),
    _path(`M ${x} ${y+h*0.6} Q ${x+w*0.2} ${y+h*0.1} ${x+w*0.35} ${y+h*0.4} Q ${x+w*0.5} ${y+h*0.15} ${x+w*0.65} ${y+h*0.45} Q ${x+w*0.8} ${y+h*0.1} ${x+w} ${y+h*0.5}`, 'none', '#22c55e', 3),
    _path(`M ${x} ${y+h*0.7} Q ${x+w*0.25} ${y+h*0.2} ${x+w*0.4} ${y+h*0.5} Q ${x+w*0.55} ${y+h*0.25} ${x+w*0.7} ${y+h*0.55} Q ${x+w*0.85} ${y+h*0.2} ${x+w} ${y+h*0.6}`, 'none', '#3b82f6', 2.5),
    _path(`M ${x} ${y+h*0.8} Q ${x+w*0.3} ${y+h*0.35} ${x+w*0.45} ${y+h*0.55} Q ${x+w*0.6} ${y+h*0.35} ${x+w*0.75} ${y+h*0.6} Q ${x+w*0.9} ${y+h*0.35} ${x+w} ${y+h*0.7}`, 'none', '#c084fc', 2),
    // Stars
    _circle(x + w*0.1, y + h*0.1, 2, '#ffffff', 'none', 0),
    _circle(x + w*0.3, y + h*0.05, 1.5, '#ffffff', 'none', 0),
    _circle(x + w*0.6, y + h*0.08, 2, '#ffffff', 'none', 0),
    _circle(x + w*0.85, y + h*0.12, 1.5, '#ffffff', 'none', 0),
    _circle(x + w*0.5, y + h*0.03, 1, '#ffffff', 'none', 0),
  ];
}

function shapeRainbow(x, y, w, h) {
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6'];
  const segs = [];
  for (let i = 0; i < colors.length; i++) {
    const r = Math.min(w,h) * (0.35 - i * 0.04);
    segs.push(_path(`M ${x+w*0.15} ${y+h} A ${r} ${r*0.7} 0 0 1 ${x+w*0.85} ${y+h}`, 'none', colors[i], 3));
  }
  segs.push(_rect(x, y + h*0.8, w, h*0.2, '#22c55e', '#16a34a', 1, 0));
  return segs;
}

function shapeTornadoCloud(x, y, w, h) {
  return [
    _ellipse(x + w*0.5, y + h*0.2, w*0.4, h*0.12, '#334155', '#1e293b', 1.5),
    _path(`M ${x+w*0.3} ${y+h*0.25} Q ${x+w*0.5} ${y+h*0.4} ${x+w*0.7} ${y+h*0.35}`, '#475569', 'none', 2),
    _path(`M ${x+w*0.35} ${y+h*0.4} Q ${x+w*0.5} ${y+h*0.55} ${x+w*0.65} ${y+h*0.5}`, '#475569', 'none', 2),
    _path(`M ${x+w*0.4} ${y+h*0.55} Q ${x+w*0.5} ${y+h*0.7} ${x+w*0.6} ${y+h*0.65}`, '#475569', 'none', 2),
    _path(`M ${x+w*0.45} ${y+h*0.7} Q ${x+w*0.5} ${y+h*0.85} ${x+w*0.55} ${y+h*0.8}`, '#475569', 'none', 2),
  ];
}

function shapeWindPattern(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.3} Q ${x+w*0.3} ${y+h*0.15} ${x+w*0.5} ${y+h*0.3} Q ${x+w*0.7} ${y+h*0.45} ${x+w} ${y+h*0.3}`, 'none', '#94a3b8', 2),
    _path(`M ${x} ${y+h*0.55} Q ${x+w*0.25} ${y+h*0.4} ${x+w*0.45} ${y+h*0.55} Q ${x+w*0.65} ${y+h*0.7} ${x+w} ${y+h*0.55}`, 'none', '#94a3b8', 1.5),
    _path(`M ${x+w*0.1} ${y+h*0.8} Q ${x+w*0.35} ${y+h*0.65} ${x+w*0.55} ${y+h*0.8} Q ${x+w*0.75} ${y+h*0.95} ${x+w} ${y+h*0.8}`, 'none', '#94a3b8', 1),
  ];
}

// ── THEME 4: MUSIC & SOUND (12 shapes) ──────────────────────────────────

function shapePianoKeys(x, y, w, h) {
  const segs = [];
  const whiteKeys = 7;
  const wk = w / whiteKeys;
  for (let i = 0; i < whiteKeys; i++) {
    segs.push(_rect(x + i*wk, y + h*0.4, wk-1, h*0.6, '#ffffff', '#94a3b8', 1, 0));
  }
  const blackKeys = [0, 1, 3, 4, 5];
  for (const bi of blackKeys) {
    segs.push(_rect(x + bi*wk + wk*0.65, y + h*0.4, wk*0.6, h*0.35, '#1e293b', '#0f172a', 1, 2));
  }
  segs.push(_rect(x, y + h*0.35, w, 3, '#475569', '#334155', 0, 0));
  return segs;
}

function shapeMusicNotes(x, y, w, h) {
  return [
    _circle(x + w*0.2, y + h*0.5, w*0.06, '#1e293b', '#1e293b', 1.5),
    _line(x + w*0.26, y + h*0.5, x + w*0.26, y + h*0.15, '#1e293b', 2),
    _path(`M ${x+w*0.26} ${y+h*0.15} Q ${x+w*0.35} ${y+h*0.15} ${x+w*0.32} ${y+h*0.22}`, '#1e293b', '#1e293b', 1.5),
    _circle(x + w*0.55, y + h*0.35, w*0.06, '#1e293b', '#1e293b', 1.5),
    _line(x + w*0.61, y + h*0.35, x + w*0.61, y + h*0.1, '#1e293b', 2),
    _path(`M ${x+w*0.61} ${y+h*0.1} Q ${x+w*0.7} ${y+h*0.1} ${x+w*0.67} ${y+h*0.17}`, '#1e293b', '#1e293b', 1.5),
  ];
}

function shapeSpeaker(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.05, y + h*0.2, w*0.25, h*0.6, '#64748b', '#475569', 2, 4),
    _path(`M ${x+w*0.3} ${y+h*0.2} L ${x+w*0.55} ${y+h*0.05} L ${x+w*0.55} ${y+h*0.95} L ${x+w*0.3} ${y+h*0.8} Z`, '#94a3b8', '#64748b', 1.5),
    _circle(x + w*0.7, y + h*0.4, w*0.15, 'none', '#3b82f6', 2),
    _circle(x + w*0.7, y + h*0.4, w*0.1, 'none', '#3b82f6', 1.5),
    _circle(x + w*0.7, y + h*0.4, w*0.04, '#3b82f6', '#1d4ed8', 1),
  ];
}

function shapeHeadphones(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.2} ${y+h*0.35} Q ${x+w*0.2} ${y} ${cx} ${y} Q ${x+w*0.8} ${y} ${x+w*0.8} ${y+h*0.35}`, 'none', '#1e293b', 3),
    _rect(x + w*0.05, y + h*0.3, w*0.2, h*0.5, '#1e293b', '#0f172a', 2, 8),
    _rect(x + w*0.75, y + h*0.3, w*0.2, h*0.5, '#1e293b', '#0f172a', 2, 8),
  ];
}

// ── THEME 5: SPORTS & ACTIVITY (14 shapes) ──────────────────────────────

function shapeSoccerBall(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, '#ffffff', '#1e293b', 2),
    _path(`M ${cx} ${cy-r} Q ${cx+w*0.15} ${cy-r*0.3} ${cx} ${cy}`, '#1e293b', 'none', 1.5),
    _path(`M ${cx} ${cy} Q ${cx-w*0.2} ${cy+r*0.3} ${cx-w*0.05} ${cy+r*0.5}`, '#1e293b', 'none', 1.5),
    _path(`M ${cx} ${cy} Q ${cx+w*0.25} ${cy-r*0.2} ${cx+r*0.5} ${cy-r*0.5}`, '#1e293b', 'none', 1.5),
    _path(`M ${cx} ${cy} Q ${cx-w*0.3} ${cy+r*0.1} ${cx-r} ${cy+r*0.2}`, '#1e293b', 'none', 1.5),
    _path(`M ${cx} ${cy-r*0.5} L ${cx+r*0.5} ${cy}`, '#1e293b', 'none', 1),
  ];
}

function shapeBasketballHoop(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(cx - w*0.02, y + h*0.1, w*0.04, h*0.6, '#64748b', '#475569', 1.5, 2),
    _rect(x + w*0.15, y + h*0.1, w*0.7, h*0.04, '#ef4444', '#dc2626', 1.5, 2),
    _path(`M ${x+w*0.3} ${y+h*0.15} Q ${x+w*0.3} ${y+h*0.45} ${x+w*0.7} ${y+h*0.45} Q ${x+w*0.7} ${y+h*0.15} ${x+w*0.3} ${y+h*0.15}`, 'none', '#ef4444', 2),
    _circle(x + w*0.5, y + h*0.7, w*0.08, '#f59e0b', '#d97706', 2),
  ];
}

function shapeTrophy(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.25} ${y+h*0.15} L ${x+w*0.75} ${y+h*0.15} L ${x+w*0.7} ${y+h*0.55} Q ${cx} ${y+h*0.65} ${x+w*0.3} ${y+h*0.55} Z`, '#fef3c7', '#f59e0b', 2),
    _rect(cx - w*0.06, y + h*0.55, w*0.12, h*0.2, '#f59e0b', '#d97706', 1.5, 4),
    _rect(cx - w*0.15, y + h*0.75, w*0.3, h*0.08, '#f59e0b', '#d97706', 1.5, 4),
    _rect(cx - w*0.08, y + h*0.58, w*0.16, h*0.08, '#fef3c7', '#d97706', 1, 4),
    // Handles
    _path(`M ${x+w*0.25} ${y+h*0.2} Q ${x+w*0.05} ${y+h*0.35} ${x+w*0.15} ${y+h*0.5}`, '#f59e0b', 'none', 2),
    _path(`M ${x+w*0.75} ${y+h*0.2} Q ${x+w*0.95} ${y+h*0.35} ${x+w*0.85} ${y+h*0.5}`, '#f59e0b', 'none', 2),
    // Star
    _text('★', cx, y + h*0.4, { fs: 16, fw: '700', color: '#d97706' }),
  ];
}

function shapeMedal(x, y, w, h) {
  const cx = x + w/2;
  return [
    _circle(cx, y + h*0.35, w*0.2, '#fef3c7', '#f59e0b', 2.5),
    _circle(cx, y + h*0.35, w*0.12, '#fbbf24', '#d97706', 1.5),
    _text('1', cx, y + h*0.35 + 4, { fs: 14, fw: '800', color: '#92400e' }),
    _path(`M ${cx-w*0.06} ${y+h*0.5} L ${cx-w*0.02} ${y+h*0.65} L ${cx} ${y+h*0.55} L ${cx+w*0.02} ${y+h*0.65} L ${cx+w*0.06} ${y+h*0.5} Z`, '#f59e0b', '#d97706', 1.5),
  ];
}

function shapeRunningFigure(x, y, w, h) {
  const cx = x + w/2;
  return [
    _circle(cx, y + h*0.12, w*0.08, '#1e293b', '#1e293b', 1.5),
    _line(cx, y + h*0.2, cx, y + h*0.5, '#1e293b', 3),
    _line(cx, y + h*0.5, cx - w*0.1, y + h*0.85, '#1e293b', 2.5),
    _line(cx, y + h*0.5, cx + w*0.15, y + h*0.8, '#1e293b', 2.5),
    _line(cx, y + h*0.3, cx - w*0.15, y + h*0.35, '#1e293b', 2.5),
    _line(cx, y + h*0.3, cx + w*0.1, y + h*0.4, '#1e293b', 2.5),
  ];
}

// ── THEME 6: ARCHITECTURE & LANDMARKS (16 shapes) ──────────────────────

function shapeCastle(x, y, w, h) {
  const segs = [];
  const cx = x + w/2;
  const towerW = w * 0.15;
  // Main wall
  segs.push(_rect(x + w*0.2, y + h*0.4, w*0.6, h*0.55, '#cbd5e1', '#64748b', 2, 4));
  // Towers
  segs.push(_rect(x + w*0.08, y + h*0.3, towerW, h*0.65, '#cbd5e1', '#64748b', 2, 4));
  segs.push(_rect(x + w*0.77, y + h*0.3, towerW, h*0.65, '#cbd5e1', '#64748b', 2, 4));
  // Roofs
  segs.push(_path(`M ${x+w*0.08} ${y+h*0.3} L ${x+w*0.08+towerW/2} ${y+h*0.1} L ${x+w*0.08+towerW} ${y+h*0.3} Z`, '#ef4444', '#dc2626', 2));
  segs.push(_path(`M ${x+w*0.77} ${y+h*0.3} L ${x+w*0.77+towerW/2} ${y+h*0.1} L ${x+w*0.77+towerW} ${y+h*0.3} Z`, '#ef4444', '#dc2626', 2));
  // Door
  segs.push(_path(`M ${cx-w*0.08} ${y+h*0.95} L ${cx-w*0.08} ${y+h*0.65} Q ${cx} ${y+h*0.55} ${cx+w*0.08} ${y+h*0.65} L ${cx+w*0.08} ${y+h*0.95} Z`, '#fecece', '#dc2626', 1.5));
  // Windows
  segs.push(_rect(x + w*0.28, y + h*0.5, w*0.08, h*0.1, '#93c5fd', '#3b82f6', 1, 2));
  segs.push(_rect(x + w*0.64, y + h*0.5, w*0.08, h*0.1, '#93c5fd', '#3b82f6', 1, 2));
  // Battlements
  for (let i = 0; i < 4; i++) {
    const bx = x + w*0.22 + i * w*0.15;
    segs.push(_rect(bx, y + h*0.35, w*0.06, h*0.05, '#cbd5e1', '#64748b', 1, 2));
  }
  return segs;
}

function shapeBridge(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x, y + h*0.8, w, h*0.2, '#94a3b8', '#64748b', 2, 0),
    _path(`M ${x+w*0.05} ${y+h*0.8} Q ${cx} ${y+h*0.2} ${x+w*0.95} ${y+h*0.8}`, '#e2e8f0', 'none', 3),
    _line(x + w*0.25, y + h*0.8, x + w*0.25, y + h*0.45, '#64748b', 1.5),
    _line(x + w*0.75, y + h*0.8, x + w*0.75, y + h*0.45, '#64748b', 1.5),
    _line(x + w*0.4, y + h*0.8, x + w*0.4, y + h*0.55, '#64748b', 1.5),
    _line(x + w*0.6, y + h*0.8, x + w*0.6, y + h*0.55, '#64748b', 1.5),
    // Water below
    _path(`M ${x} ${y+h} Q ${x+w*0.25} ${y+h*0.95} ${x+w*0.5} ${y+h} Q ${x+w*0.75} ${y+h*0.95} ${x+w} ${y+h}`, '#bfdbfe', '#3b82f6', 1.5),
  ];
}

function shapeLighthouse(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.35} ${y+h*0.35} L ${x+w*0.65} ${y+h*0.35} L ${x+w*0.7} ${y+h*0.9} L ${x+w*0.3} ${y+h*0.9} Z`, '#fef3c7', '#f59e0b', 2),
    _rect(x + w*0.32, y + h*0.1, w*0.36, h*0.25, '#ef4444', '#dc2626', 2, 4),
    _rect(x + w*0.42, y + h*0.1, w*0.16, h*0.08, '#fbbf24', '#f59e0b', 1.5, 2),
    // Light beam
    _path(`M ${cx} ${y+h*0.15} L ${x+w*0.05} ${y+h*0.3} L ${x+w*0.95} ${y+h*0.3}`, '#fde68a', 'none', 1.5),
    // Windows
    _rect(cx - w*0.04, y + h*0.45, w*0.08, h*0.08, '#93c5fd', '#3b82f6', 1, 2),
    _rect(cx - w*0.04, y + h*0.6, w*0.08, h*0.08, '#93c5fd', '#3b82f6', 1, 2),
  ];
}

function shapeHouse(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.1, y + h*0.35, w*0.8, h*0.6, '#e2e8f0', '#64748b', 2, 4),
    _path(`M ${x+w*0.05} ${y+h*0.35} L ${cx} ${y+h*0.05} L ${x+w*0.95} ${y+h*0.35} Z`, '#ef4444', '#dc2626', 2),
    _rect(cx - w*0.06, y + h*0.6, w*0.12, h*0.35, '#92400e', '#78350f', 1.5, 2),
    _rect(x + w*0.2, y + h*0.45, w*0.12, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
    _rect(x + w*0.68, y + h*0.45, w*0.12, h*0.12, '#93c5fd', '#3b82f6', 1, 2),
  ];
}

// ── THEME 7: FANTASY & MYTHOLOGY (18 shapes) ───────────────────────────

function shapeDragon(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${x+w*0.1} ${cy+h*0.1} Q ${x+w*0.2} ${cy-h*0.3} ${cx+w*0.05} ${cy-h*0.2} Q ${x+w*0.6} ${cy-h*0.4} ${x+w*0.7} ${cy-h*0.15} Q ${x+w*0.85} ${cy-h*0.2} ${x+w*0.9} ${cy} Q ${x+w*0.95} ${cy+h*0.1} ${x+w*0.85} ${cy+h*0.2} Q ${x+w*0.6} ${cy+h*0.3} ${x+w*0.3} ${cy+h*0.15} Q ${x+w*0.2} ${cy+h*0.2} ${x+w*0.1} ${cy+h*0.1}`, '#fca5a5', '#ef4444', 2),
    // Wings
    _path(`M ${cx+w*0.05} ${cy-h*0.2} L ${cx+w*0.25} ${cy-h*0.5} L ${cx+w*0.15} ${cy-h*0.25} L ${cx+w*0.35} ${cy-h*0.45} L ${cx+w*0.2} ${cy-h*0.15} Z`, '#fca5a5', '#ef4444', 1.5),
    // Eye
    _circle(cx - w*0.15, cy - h*0.05, 4, '#fbbf24', '#f59e0b', 1),
    // Horns
    _line(cx - w*0.1, cy - h*0.25, cx - w*0.08, cy - h*0.4, '#ef4444', 2),
    _line(cx, cy - h*0.25, cx + w*0.02, cy - h*0.38, '#ef4444', 2),
    // Fire
    _path(`M ${x+w*0.1} ${cy+h*0.1} Q ${x+w*0.05} ${cy+h*0.3} ${x+w*0.12} ${cy+h*0.2}`, '#fbbf24', '#f59e0b', 1.5),
  ];
}

function shapePhoenix(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.1, w*0.12, h*0.18, '#fbbf24', '#f59e0b', 2),
    _path(`M ${cx-w*0.05} ${cy-h*0.1} L ${cx} ${cy-h*0.25} L ${cx+w*0.05} ${cy-h*0.1}`, '#f59e0b', '#d97706', 1.5),
    // Wings spread
    _path(`M ${cx-w*0.05} ${cy+h*0.05} Q ${x+w*0.1} ${cy-h*0.2} ${x+w*0.05} ${cy+h*0.15}`, '#fbbf24', '#f59e0b', 2),
    _path(`M ${cx+w*0.05} ${cy+h*0.05} Q ${x+w*0.9} ${cy-h*0.2} ${x+w*0.95} ${cy+h*0.15}`, '#fbbf24', '#f59e0b', 2),
    // Flame tail
    _path(`M ${cx-w*0.02} ${cy+h*0.25} Q ${cx-w*0.08} ${cy+h*0.5} ${cx} ${cy+h*0.6} Q ${cx+w*0.08} ${cy+h*0.5} ${cx+w*0.02} ${cy+h*0.25}`, '#ef4444', '#dc2626', 1.5),
    _path(`M ${cx} ${cy+h*0.6} Q ${cx-w*0.05} ${cy+h*0.75} ${cx} ${cy+h*0.85}`, '#f59e0b', '#d97706', 1),
    _circle(cx, cy - h*0.05, 3, '#f59e0b', '#d97706', 0.5),
  ];
}

function shapeUnicorn(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _ellipse(cx, cy + h*0.15, w*0.15, h*0.2, '#f3e8ff', '#a855f7', 2),
    _path(`M ${cx-w*0.12} ${cy-h*0.05} Q ${x+w*0.1} ${cy-h*0.15} ${x+w*0.05} ${cy+h*0.1}`, '#f3e8ff', '#a855f7', 2),
    // Horn
    _line(cx - w*0.02, cy - h*0.15, cx, cy - h*0.35, '#fbbf24', 2.5),
    _circle(cx, cy - h*0.35, 3, '#fbbf24', '#f59e0b', 0.5),
    // Mane
    _path(`M ${cx+w*0.08} ${cy-h*0.1} Q ${cx+w*0.2} ${cy} ${cx+w*0.1} ${cy+h*0.1}`, '#c084fc', '#a855f7', 1.5),
    // Eye
    _circle(cx - w*0.05, cy - h*0.02, 2.5, '#9333ea', '#7e22ce', 0.5),
  ];
}

function shapeWizard(x, y, w, h) {
  const cx = x + w/2;
  return [
    // Hat
    _path(`M ${x+w*0.2} ${y+h*0.35} L ${cx} ${y} L ${x+w*0.8} ${y+h*0.35} Z`, '#3b82f6', '#1d4ed8', 2),
    // Hat brim
    _rect(x + w*0.15, y + h*0.32, w*0.7, h*0.05, '#3b82f6', '#1d4ed8', 1.5, 4),
    // Star on hat
    _text('★', cx, y + h*0.15, { fs: 12, fw: '700', color: '#fbbf24' }),
    // Face
    _circle(cx, y + h*0.5, w*0.12, '#fef3c7', '#d97706', 1.5),
    // Beard
    _path(`M ${x+w*0.38} ${y+h*0.55} Q ${cx} ${y+h*0.85} ${x+w*0.62} ${y+h*0.55}`, '#e2e8f0', '#cbd5e1', 1.5),
    // Body
    _rect(x + w*0.3, y + h*0.6, w*0.4, h*0.35, '#3b82f6', '#1d4ed8', 2, 4),
    // Wand
    _line(x + w*0.75, y + h*0.55, x + w*0.95, y + h*0.3, '#92400e', 2),
    _circle(x + w*0.95, y + h*0.3, 5, '#fbbf24', '#f59e0b', 1),
    // Sparkles
    _circle(x + w*0.88, y + h*0.2, 2, '#fbbf24', '#f59e0b', 0.5),
    _circle(x + w*0.92, y + h*0.15, 1.5, '#fbbf24', '#f59e0b', 0.5),
    _circle(x + w*0.82, y + h*0.18, 2, '#fbbf24', '#f59e0b', 0.5),
  ];
}

function shapeKnight(x, y, w, h) {
  const cx = x + w/2;
  return [
    // Helmet
    _path(`M ${x+w*0.3} ${y+h*0.2} L ${x+w*0.7} ${y+h*0.2} Q ${x+w*0.7} ${y+h*0.45} ${cx} ${y+h*0.5} Q ${x+w*0.3} ${y+h*0.45} ${x+w*0.3} ${y+h*0.2}`, '#cbd5e1', '#64748b', 2),
    // Visor slit
    _line(cx - w*0.1, y + h*0.3, cx + w*0.1, y + h*0.3, '#1e293b', 2),
    // Plume
    _path(`M ${cx} ${y+h*0.2} Q ${cx} ${y} ${cx+w*0.12} ${y+h*0.08}`, '#ef4444', '#dc2626', 2),
    _path(`M ${cx} ${y+h*0.2} Q ${cx} ${y} ${cx-w*0.08} ${y+h*0.05}`, '#ef4444', '#dc2626', 2),
    // Body armor
    _rect(x + w*0.3, y + h*0.5, w*0.4, h*0.45, '#cbd5e1', '#64748b', 2, 4),
    // Shield
    _path(`M ${x+w*0.75} ${y+h*0.55} L ${x+w*0.9} ${y+h*0.55} L ${x+w*0.9} ${y+h*0.75} Q ${x+w*0.9} ${y+h*0.9} ${x+w*0.82} ${y+h*0.9} Q ${x+w*0.75} ${y+h*0.9} ${x+w*0.75} ${y+h*0.75} Z`, '#ef4444', '#dc2626', 1.5),
    // Cross on shield
    _line(x + w*0.82, y + h*0.6, x + w*0.82, y + h*0.85, '#fbbf24', 1.5),
    _line(x + w*0.78, y + h*0.72, x + w*0.86, y + h*0.72, '#fbbf24', 1.5),
  ];
}

function shapeTreasureChest(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.1, y + h*0.35, w*0.8, h*0.6, '#92400e', '#78350f', 2, 6),
    _path(`M ${x+w*0.1} ${y+h*0.35} Q ${cx} ${y+h*0.15} ${x+w*0.9} ${y+h*0.35}`, '#b45309', '#78350f', 2.5),
    // Lock
    _rect(cx - w*0.04, y + h*0.45, w*0.08, h*0.08, '#fbbf24', '#f59e0b', 1.5, 2),
    // Gold bands
    _line(x + w*0.1, y + h*0.6, x + w*0.9, y + h*0.6, '#78350f', 2),
    _line(x + w*0.1, y + h*0.8, x + w*0.9, y + h*0.8, '#78350f', 2),
    // Coins spilling
    _circle(x + w*0.25, y + h*0.85, 4, '#fbbf24', '#f59e0b', 0.5),
    _circle(x + w*0.3, y + h*0.9, 4, '#fbbf24', '#f59e0b', 0.5),
    _circle(x + w*0.22, y + h*0.9, 3, '#fbbf24', '#f59e0b', 0.5),
    _circle(x + w*0.28, y + h*0.8, 3, '#fbbf24', '#f59e0b', 0.5),
  ];
}

// ── THEME 8: VEHICLES & TRANSPORT (15 shapes) ──────────────────────────

function shapeCar(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.08, y + h*0.4, w*0.84, h*0.3, '#3b82f6', '#1d4ed8', 2, 6),
    _path(`M ${x+w*0.2} ${y+h*0.4} Q ${x+w*0.3} ${y+h*0.05} ${x+w*0.5} ${y+h*0.05} L ${x+w*0.7} ${y+h*0.05} Q ${x+w*0.85} ${y+h*0.05} ${x+w*0.82} ${y+h*0.4}`, '#60a5fa', '#1d4ed8', 2),
    // Windows
    _rect(x + w*0.23, y + h*0.12, w*0.2, h*0.28, '#93c5fd', '#3b82f6', 1.5, 4),
    _rect(x + w*0.48, y + h*0.12, w*0.25, h*0.28, '#93c5fd', '#3b82f6', 1.5, 4),
    // Wheels
    _circle(x + w*0.25, y + h*0.7, w*0.1, '#1e293b', '#0f172a', 2),
    _circle(x + w*0.75, y + h*0.7, w*0.1, '#1e293b', '#0f172a', 2),
    _circle(x + w*0.25, y + h*0.7, w*0.04, '#64748b', '#475569', 1),
    _circle(x + w*0.75, y + h*0.7, w*0.04, '#64748b', '#475569', 1),
  ];
}

function shapeTrain(x, y, w, h) {
  const cx = x + w/2;
  return [
    _rect(x + w*0.05, y + h*0.35, w*0.65, h*0.35, '#dc2626', '#b91c1c', 2, 4),
    // Cabin
    _rect(x + w*0.7, y + h*0.2, w*0.25, h*0.5, '#ef4444', '#b91c1c', 2, 4),
    _rect(x + w*0.72, y + h*0.22, w*0.18, h*0.2, '#93c5fd', '#3b82f6', 1.5, 4),
    // Smokestack
    _rect(x + w*0.2, y + h*0.15, w*0.08, h*0.2, '#1e293b', '#0f172a', 1.5, 4),
    // Wheels
    _circle(x + w*0.2, y + h*0.7, w*0.07, '#1e293b', '#0f172a', 2),
    _circle(x + w*0.45, y + h*0.7, w*0.07, '#1e293b', '#0f172a', 2),
    _circle(x + w*0.75, y + h*0.7, w*0.07, '#1e293b', '#0f172a', 2),
    // Track
    _rect(x, y + h*0.78, w, h*0.04, '#64748b', '#475569', 1, 2),
    // Smoke
    _circle(x + w*0.08, y + h*0.1, w*0.06, '#cbd5e1', '#94a3b8', 1),
    _circle(x + w*0.12, y + h*0.02, w*0.04, '#cbd5e1', '#94a3b8', 1),
  ];
}

function shapeAirplane(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [
    _ellipse(cx, cy, w*0.4, h*0.12, '#e2e8f0', '#94a3b8', 2),
    // Wings
    _path(`M ${cx+w*0.05} ${cy} L ${cx+w*0.05} ${cy-h*0.35} L ${cx+w*0.15} ${cy-h*0.3} L ${cx+w*0.15} ${cy} Z`, '#e2e8f0', '#94a3b8', 1.5),
    _path(`M ${cx-w*0.05} ${cy} L ${cx-w*0.05} ${cy+h*0.35} L ${cx-w*0.15} ${cy+h*0.3} L ${cx-w*0.15} ${cy} Z`, '#e2e8f0', '#94a3b8', 1.5),
    // Tail
    _path(`M ${cx-w*0.35} ${cy-h*0.02} L ${cx-w*0.45} ${cy-h*0.25} L ${cx-w*0.38} ${cy-h*0.22} L ${cx-w*0.3} ${cy} Z`, '#e2e8f0', '#94a3b8', 1.5),
  ];
  // Windows
  for (let i = -3; i <= 3; i++) {
    segs.push(_circle(cx + i * w*0.08, cy, 3, '#93c5fd', '#3b82f6', 0.5));
  }
  return segs;
}

// ── THEME 9: FOOD & COOKING (14 shapes) ────────────────────────────────

function shapeCookingPot(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.1} ${y+h*0.6} Q ${x} ${y+h*0.4} ${x+w*0.15} ${y+h*0.35} L ${x+w*0.85} ${y+h*0.35} Q ${x+w} ${y+h*0.4} ${x+w*0.9} ${y+h*0.6} Z`, '#cbd5e1', '#64748b', 2),
    _rect(x + w*0.15, y + h*0.35, w*0.7, h*0.4, '#cbd5e1', '#64748b', 1.5, 4),
    _path(`M ${x+w*0.35} ${y+h*0.35} Q ${cx} ${y} ${x+w*0.65} ${y+h*0.35}`, '#64748b', 'none', 2.5),
    // Steam
    _path(`M ${x+w*0.3} ${y+h*0.3} Q ${x+w*0.25} ${y+h*0.1} ${x+w*0.32} ${y}`, '#94a3b8', 'none', 1.5),
    _path(`M ${x+w*0.5} ${y+h*0.25} Q ${x+w*0.45} ${y+h*0.08} ${x+w*0.52} ${y}`, '#94a3b8', 'none', 1.5),
    _path(`M ${x+w*0.7} ${y+h*0.3} Q ${x+w*0.65} ${y+h*0.1} ${x+w*0.72} ${y}`, '#94a3b8', 'none', 1.5),
    // Bubbles
    _circle(x + w*0.3, y + h*0.55, 4, '#93c5fd', '#3b82f6', 0.5),
    _circle(x + w*0.5, y + h*0.5, 6, '#93c5fd', '#3b82f6', 0.5),
    _circle(x + w*0.7, y + h*0.55, 4, '#93c5fd', '#3b82f6', 0.5),
  ];
}

// ── THEME 10: TOOLS & INSTRUMENTS (14 shapes) ──────────────────────────

function shapeMicroscope(x, y, w, h) {
  return [
    _rect(x + w*0.42, y + h*0.1, w*0.16, h*0.35, '#94a3b8', '#64748b', 2, 4),
    _circle(x + w*0.5, y + h*0.05, w*0.1, '#dbeafe', '#3b82f6', 2),
    _path(`M ${x+w*0.35} ${y+h*0.45} L ${x+w*0.65} ${y+h*0.45} L ${x+w*0.75} ${y+h*0.6} L ${x+w*0.25} ${y+h*0.6} Z`, '#e2e8f0', '#64748b', 1.5),
    _rect(x + w*0.45, y + h*0.6, w*0.1, h*0.35, '#64748b', '#475569', 1.5, 4),
    _rect(x + w*0.15, y + h*0.85, w*0.7, h*0.06, '#64748b', '#475569', 1.5, 4),
    // Lens detail
    _line(x + w*0.4, y + h*0.55, x + w*0.6, y + h*0.55, '#64748b', 0.8),
  ];
}

// ── Export ───────────────────────────────────────────────────────────────

export const THEMATIC_SHAPES = {
  // Space & Astronomy
  'rocket': shapeRocket,
  'telescope': shapeTelescope,
  'satellite': shapeSatellite,
  'solar_panel': shapeSolarPanel,
  'milky_way': shapeMilkyWay,
  'astronaut': shapeAstronaut,
  'black_hole': shapeBlackHole,

  // Ocean & Marine
  'wave_ocean': shapeWaveOcean,
  'whale': shapeWhale,
  'shark': shapeShark,
  'coral_reef': shapeCoralReef,
  'submarine': shapeSubmarine,
  'jellyfish': shapeJellyfish,

  // Weather & Nature
  'thunderstorm': shapeThunderstorm,
  'aurora': shapeAurora,
  'rainbow': shapeRainbow,
  'tornado_cloud': shapeTornadoCloud,
  'wind_pattern': shapeWindPattern,

  // Music & Sound
  'piano_keys': shapePianoKeys,
  'music_notes': shapeMusicNotes,
  'speaker': shapeSpeaker,
  'headphones': shapeHeadphones,

  // Sports & Activity
  'soccer_ball': shapeSoccerBall,
  'basketball_hoop': shapeBasketballHoop,
  'trophy': shapeTrophy,
  'medal': shapeMedal,
  'running_figure': shapeRunningFigure,

  // Architecture & Landmarks
  'castle': shapeCastle,
  'bridge': shapeBridge,
  'lighthouse': shapeLighthouse,
  'house': shapeHouse,

  // Fantasy & Mythology
  'dragon': shapeDragon,
  'phoenix': shapePhoenix,
  'unicorn': shapeUnicorn,
  'wizard': shapeWizard,
  'knight': shapeKnight,
  'treasure_chest': shapeTreasureChest,

  // Vehicles & Transport
  'car': shapeCar,
  'train': shapeTrain,
  'airplane': shapeAirplane,

  // Food & Cooking
  'cooking_pot': shapeCookingPot,

  // Tools & Instruments
  'microscope': shapeMicroscope,
};

export const THEMATIC_ALIASES = {
  // Space
  'rocket': 'rocket', 'spaceship': 'rocket', 'space rocket': 'rocket',
  'telescope': 'telescope', 'astronomy': 'telescope', 'observation': 'telescope',
  'satellite': 'satellite', 'orbit': 'satellite', 'space station': 'satellite',
  'solar panel': 'solar_panel', 'solar energy': 'solar_panel', 'photovoltaic': 'solar_panel',
  'galaxy': 'milky_way', 'milky way': 'milky_way', 'star system': 'milky_way',
  'astronaut': 'astronaut', 'space suit': 'astronaut', 'space walk': 'astronaut',
  'black hole': 'black_hole', 'singularity': 'black_hole', 'event horizon': 'black_hole',
  // Ocean
  'wave': 'wave_ocean', 'ocean wave': 'wave_ocean', 'sea wave': 'wave_ocean',
  'whale': 'whale', 'humpback': 'whale',
  'shark': 'shark', 'great white': 'shark',
  'coral': 'coral_reef', 'reef': 'coral_reef',
  'submarine': 'submarine', 'sub': 'submarine',
  'jelly fish': 'jellyfish', 'jelly': 'jellyfish',
  // Weather
  'thunder': 'thunderstorm', 'lightning storm': 'thunderstorm',
  'aurora': 'aurora', 'northern lights': 'aurora', 'borealis': 'aurora',
  'rainbow': 'rainbow', 'spectrum': 'rainbow',
  'tornado': 'tornado_cloud', 'cyclone': 'tornado_cloud',
  'wind': 'wind_pattern', 'breeze': 'wind_pattern',
  // Music
  'piano': 'piano_keys', 'keyboard': 'piano_keys',
  'music': 'music_notes', 'notes': 'music_notes',
  'speaker': 'speaker', 'loudspeaker': 'speaker', 'sound': 'speaker',
  'headphone': 'headphones', 'earphones': 'headphones',
  // Sports
  'soccer': 'soccer_ball', 'football': 'soccer_ball',
  'basketball': 'basketball_hoop', 'hoop': 'basketball_hoop',
  'trophy': 'trophy', 'champion': 'trophy', 'award': 'trophy',
  'medal': 'medal', 'gold medal': 'medal', 'badge': 'medal',
  'running': 'running_figure', 'sprint': 'running_figure', 'runner': 'running_figure',
  // Architecture
  'castle': 'castle', 'fortress': 'castle', 'palace': 'castle',
  'bridge': 'bridge', 'suspension bridge': 'bridge',
  'lighthouse': 'lighthouse', 'beacon': 'lighthouse',
  'house': 'house', 'home': 'house', 'building': 'house',
  // Fantasy
  'dragon': 'dragon', 'mythical': 'dragon',
  'phoenix': 'phoenix', 'firebird': 'phoenix', 'immortal': 'phoenix',
  'unicorn': 'unicorn', 'mythical horse': 'unicorn',
  'wizard': 'wizard', 'magician': 'wizard', 'sorcerer': 'wizard',
  'knight': 'knight', 'crusader': 'knight', 'armor': 'knight',
  'treasure': 'treasure_chest', 'chest': 'treasure_chest',
  // Vehicles
  'car': 'car', 'automobile': 'car', 'sedan': 'car',
  'train': 'train', 'locomotive': 'train', 'railway': 'train',
  'airplane': 'airplane', 'plane': 'airplane', 'jet': 'airplane', 'aircraft': 'airplane',
  // Food
  'cooking pot': 'cooking_pot', 'pot': 'cooking_pot', 'saucepan': 'cooking_pot',
  // Tools
  'microscope': 'microscope', 'science tool': 'microscope', 'lab': 'microscope',
};
