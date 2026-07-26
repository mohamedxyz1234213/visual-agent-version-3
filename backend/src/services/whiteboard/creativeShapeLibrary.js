// =============================================================================
// CREATIVE SHAPE LIBRARY — 150+ artistic, 3D, layered, and visually stunning
// SVG shapes for whiteboard rendering
// =============================================================================
// Each shape receives (x, y, w, h) and returns an array of fragments:
//   draw_circle, draw_rect, draw_path, draw_text, draw_line, draw_arrow
//
// These shapes are designed to be visually rich — with shadows, depth,
// gradients (simulated via layered fills), and artistic flair.
// =============================================================================

// Helper builders (same pattern as svgShapeLibrary.js)
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

// ── 3D Geometric Shapes ───────────────────────────────────────────────────

function shape3dCube(x, y, w, h) {
  const d = Math.min(w, h) * 0.2;
  return [
    _rect(x + d*0.3, y + d*0.3, w*0.6 - d*0.3, h*0.6 - d*0.3, '#dbeafe', '#3b82f6', 2, 2),
    _path(`M ${x+w*0.6} ${y+d*0.3} L ${x+w*0.6+d*0.4} ${y} L ${x+w*0.9+d*0.4} ${y+h*0.2} L ${x+w*0.9} ${y+h*0.5} Z`, '#93c5fd', '#60a5fa', 1.5),
    _path(`M ${x+w*0.9} ${y+h*0.5} L ${x+w*0.9+d*0.4} ${y+h*0.2} L ${x+w*0.9+d*0.4} ${y+h*0.2+d*0.3}`, '#60a5fa', 'none', 1.5),
    _path(`M ${x+d*0.3} ${y+h*0.6-d*0.3} L ${x} ${y+h*0.6} L ${x+w*0.6+d*0.4} ${y+h*0.6} L ${x+w*0.6} ${y+h*0.6-d*0.3} Z`, '#bfdbfe', '#93c5fd', 1.5),
  ];
}

function shape3dSphere(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w, h) * 0.4;
  return [
    _circle(cx, cy, r, '#dbeafe', '#3b82f6', 2),
    _path(`M ${cx-r*0.5} ${cy-r*0.3} A ${r*0.7} ${r*0.4} 0 0 1 ${cx+r*0.5} ${cy-r*0.3}`, '#93c5fd', 'none', 1.5),
    _path(`M ${cx-r*0.3} ${cy-r*0.2} A ${r*0.5} ${r*0.3} 0 0 1 ${cx+r*0.3} ${cy-r*0.2}`, '#bfdbfe', 'none', 1),
    _circle(cx - r*0.25, cy - r*0.35, r*0.12, '#ffffff', 'none', 0),
    _circle(cx - r*0.2, cy - r*0.4, r*0.06, '#ffffff', 'none', 0),
  ];
}

function shape3dCylinder(x, y, w, h) {
  const cx = x + w/2, rx = w*0.35, ry = h*0.08;
  return [
    _path(`M ${cx-rx} ${y+ry} A ${rx} ${ry} 0 0 0 ${cx+rx} ${y+ry} L ${cx+rx} ${y+h*0.85} A ${rx} ${ry} 0 0 1 ${cx-rx} ${y+h*0.85} Z`, '#f3e8ff', '#a855f7', 2),
    _path(`M ${cx-rx} ${y+ry} A ${rx} ${ry} 0 0 1 ${cx+rx} ${y+ry} L ${cx+rx} ${y+h*0.85} A ${rx} ${ry} 0 0 0 ${cx-rx} ${y+h*0.85} Z`, '#e9d5ff', '#c084fc', 1.5),
    _path(`M ${cx-rx} ${y+ry} A ${rx} ${ry} 0 0 0 ${cx+rx} ${y+ry}`, '#a855f7', 'none', 2),
  ];
}

function shape3dCone(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx} ${y+h*0.1} L ${x+w*0.15} ${y+h*0.9} Q ${cx} ${y+h} ${x+w*0.85} ${y+h*0.9} Z`, '#fef3c7', '#f59e0b', 2),
    _path(`M ${cx} ${y+h*0.1} L ${cx} ${y+h}`, '#fbbf24', 'none', 1.5),
    _path(`M ${cx} ${y+h*0.1} L ${x+w*0.15} ${y+h*0.9} Q ${cx} ${y+h*0.95} ${cx} ${y+h}`, '#fde68a', '#f59e0b', 1.5),
    _ellipse(cx, y + h*0.9, w*0.35, h*0.04, '#fde68a', '#d97706', 1),
  ];
}

function _ellipse(cx, cy, rx, ry, fill, stroke, sw) {
  return { type: 'draw_path', d: `M ${cx-rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx+rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx-rx} ${cy}`, style: { fill, stroke, strokeWidth: sw } };
}

function shape3dPyramid(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx} ${y} L ${x+w} ${y+h} L ${cx} ${y+h*0.85} Z`, '#e0f2fe', '#0ea5e9', 1.5),
    _path(`M ${cx} ${y} L ${x} ${y+h} L ${cx} ${y+h*0.85} Z`, '#bae6fd', '#38bdf8', 1.5),
    _path(`M ${x} ${y+h} L ${cx} ${y+h*0.85} L ${x+w} ${y+h} Z`, '#7dd3fc', '#0ea5e9', 1),
  ];
}

function shape3dTorus(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, R = Math.min(w,h)*0.3, r = Math.min(w,h)*0.12;
  return [
    _circle(cx, cy, R, 'none', '#8b5cf6', 3),
    _circle(cx, cy, r, 'none', '#a78bfa', 2),
    _path(`M ${cx-R} ${cy} A ${R*0.5} ${r} 0 0 0 ${cx+R} ${cy}`, '#c4b5fd', 'none', 2),
    _path(`M ${cx} ${cy-R} A ${r} ${R*0.5} 0 0 0 ${cx} ${cy+R}`, '#c4b5fd', 'none', 2),
  ];
}

function shape3dBox(x, y, w, h) {
  const d = Math.min(w,h) * 0.18;
  return [
    _rect(x + d*0.5, y, w - d*0.5, h - d, '#fce7f3', '#ec4899', 2, 6),
    _rect(x + d*0.5, y, w - d*0.5, h - d, '#fbcfe8', 'none', 0, 6),
    _path(`M ${x+w} ${y} L ${x+w+d*0.5} ${y+d*0.5} L ${x+w+d*0.5} ${y+h-d*0.5} L ${x+w} ${y+h-d} Z`, '#f9a8d4', '#ec4899', 1.5),
    _path(`M ${x+d*0.5} ${y+h-d} L ${x} ${y+h-d*0.5} L ${x+w+d*0.5} ${y+h-d*0.5} L ${x+w} ${y+h-d} Z`, '#f472b6', '#db2777', 1.5),
  ];
}

// ── 3D Data / Infographic Shapes ─────────────────────────────────────────

function shape3dBarChart(x, y, w, h) {
  const segs = [];
  const bars = 5;
  const gap = w * 0.06;
  const barW = (w - gap * (bars + 1)) / bars;
  const heights = [0.7, 0.85, 0.5, 0.9, 0.65];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  for (let i = 0; i < bars; i++) {
    const bx = x + gap + i * (barW + gap);
    const bh = h * heights[i];
    const by = y + h - bh;
    segs.push(_rect(bx, by, barW, bh, colors[i]+'33', colors[i], 1.5, 3));
    segs.push(_rect(bx, by, barW, bh*0.15, colors[i], 'none', 0, 3));
  }
  segs.push(_line(x, y + h, x + w, y + h, '#64748b', 2));
  segs.push(_line(x, y, x, y + h, '#64748b', 2));
  return segs;
}

function shape3dPieChart(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  const slices = [
    { ang: 0, end: 2.2, color: '#3b82f6', label: 'A' },
    { ang: 2.2, end: 4.0, color: '#10b981', label: 'B' },
    { ang: 4.0, end: 5.5, color: '#f59e0b', label: 'C' },
    { ang: 5.5, end: 6.28, color: '#ef4444', label: 'D' },
  ];
  const segs = slices.map((s) => {
    const x1 = cx + Math.cos(s.ang)*r, y1 = cy + Math.sin(s.ang)*r;
    const x2 = cx + Math.cos(s.end)*r, y2 = cy + Math.sin(s.end)*r;
    const large = (s.end - s.ang) > Math.PI ? 1 : 0;
    return _path(`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, s.color, s.color+'99', 1.5);
  });
  return segs;
}

function shapeGaugeMeter(x, y, w, h) {
  const cx = x + w/2, cy = y + h*0.75, r = Math.min(w,h)*0.4;
  const val = 0.72;
  return [
    _path(`M ${cx-r*0.9} ${cy} A ${r*0.9} ${r*0.9} 0 0 1 ${cx+r*0.9} ${cy}`, '#e2e8f0', 'none', 8),
    _path(`M ${cx-r*0.9} ${cy} A ${r*0.9} ${r*0.9} 0 ${val > 0.5 ? 0 : 1} ${val > 0.5 ? 0 : 1} ${cx + Math.cos((val*Math.PI+Math.PI))*r*0.9} ${cy + Math.sin((val*Math.PI+Math.PI))*r*0.9}`, '#10b981', 'none', 8),
    _line(cx, cy, cx + Math.cos((val*Math.PI+Math.PI))*r*0.95, cy + Math.sin((val*Math.PI+Math.PI))*r*0.95, '#1e293b', 2),
    _circle(cx, cy, 6, '#1e293b', '#1e293b', 2),
  ];
}

function shapeProgressRing(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.38;
  const pct = 0.68;
  const endAng = pct * 2 * Math.PI - Math.PI/2;
  return [
    _circle(cx, cy, r, 'none', '#e2e8f0', 6),
    _path(`M ${cx} ${cy-r} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${cx + Math.cos(endAng)*r} ${cy + Math.sin(endAng)*r}`, '#3b82f6', 'none', 6),
    _circle(cx + Math.cos(endAng)*r, cy + Math.sin(endAng)*r, 5, '#3b82f6', '#1d4ed8', 2),
    _text(`${Math.round(pct*100)}%`, cx, cy + 5, { fs: 18, fw: '800', color: '#1e293b' }),
  ];
}

function shapeDonutChart(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.38, ir = r*0.5;
  const slices = [
    { ang: 0, end: 1.8, color: '#3b82f6' },
    { ang: 1.8, end: 3.6, color: '#10b981' },
    { ang: 3.6, end: 5.0, color: '#f59e0b' },
    { ang: 5.0, end: 6.28, color: '#ef4444' },
  ];
  // For donut we use thick arcs
  const segs = [];
  for (const s of slices) {
    const mid = (s.ang + s.end) / 2;
    const x1 = cx + Math.cos(s.ang)*r, y1 = cy + Math.sin(s.ang)*r;
    const x2 = cx + Math.cos(s.end)*r, y2 = cy + Math.sin(s.end)*r;
    const large = (s.end - s.ang) > Math.PI ? 1 : 0;
    segs.push(_path(`M ${cx + Math.cos(s.ang)*r} ${cy + Math.sin(s.ang)*r} A ${r} ${r} 0 ${large} 1 ${cx + Math.cos(s.end)*r} ${cy + Math.sin(s.end)*r}`, s.color, 'none', r - ir));
  }
  segs.push(_circle(cx, cy, ir*0.7, '#ffffff', '#cbd5e1', 2));
  return segs;
}

function shapeKPI(x, y, w, h) {
  return [
    _rect(x, y, w, h, '#f8fafc', '#e2e8f0', 1.5, 12),
    _text('85', x + w/2, y + h*0.35, { fs: 36, fw: '800', color: '#0f172a' }),
    _text('↑ 12%', x + w/2, y + h*0.58, { fs: 14, fw: '700', color: '#10b981' }),
    _text('vs last month', x + w/2, y + h*0.78, { fs: 10, fw: '500', color: '#64748b' }),
    _rect(x + w*0.05, y + h*0.85, w*0.9, 3, '#10b981', 'none', 0, 2),
  ];
}

function shapeHeatmapGrid(x, y, w, h) {
  const segs = [];
  const grid = 5;
  const cell = Math.min((w - 10) / grid, (h - 10) / grid);
  const ox = x + (w - cell * grid) / 2, oy = y + (h - cell * grid) / 2;
  const values = [0.1, 0.4, 0.9, 0.6, 0.2, 0.8, 0.3, 0.7, 0.5, 0.1, 0.2, 0.6, 0.9, 0.3, 0.7, 0.5, 0.8, 0.1, 0.4, 0.6, 0.9, 0.2, 0.5, 0.7, 0.3];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const idx = r * grid + c;
      const v = values[idx % values.length];
      const intensity = Math.round(v * 200).toString(16).padStart(2, '0');
      segs.push(_rect(ox + c * cell, oy + r * cell, cell-1, cell-1, `#3b82f6${intensity}`, '#e2e8f0', 1, 2));
    }
  }
  return segs;
}

// ── Decorative / Artistic Shapes ─────────────────────────────────────────

function shapeMandala(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  const segs = [_circle(cx, cy, r, '#f3e8ff', '#a855f7', 2)];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6;
    segs.push(_circle(cx + Math.cos(ang)*r*0.5, cy + Math.sin(ang)*r*0.5, r*0.25, '#ede9fe', '#8b5cf6', 1.5));
  }
  for (let i = 0; i < 12; i++) {
    const ang = (2 * Math.PI * i) / 12;
    const sx = cx + Math.cos(ang)*r*0.7;
    const sy = cy + Math.sin(ang)*r*0.7;
    const ex = cx + Math.cos(ang)*r;
    const ey = cy + Math.sin(ang)*r;
    segs.push(_line(sx, sy, ex, ey, '#a855f7', 1));
  }
  segs.push(_circle(cx, cy, r*0.15, '#c084fc', '#7c3aed', 2));
  return segs;
}

function shapeCompass(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.4;
  return [
    _circle(cx, cy, r, '#f0fdf4', '#22c55e', 2),
    _circle(cx, cy, r, 'none', '#16a34a', 1),
    _path(`M ${cx} ${y+h*0.12} L ${cx-w*0.08} ${cy} L ${cx} ${y+h*0.2} L ${cx+w*0.08} ${cy} Z`, '#ef4444', '#dc2626', 1.5),
    _path(`M ${cx} ${y+h*0.88} L ${cx-w*0.06} ${cy} L ${cx} ${y+h*0.78} L ${cx+w*0.06} ${cy} Z`, '#f8fafc', '#94a3b8', 1.5),
    _text('N', cx, y + h*0.18, { fs: 10, fw: '800', color: '#dc2626' }),
    _text('S', cx, y + h*0.85, { fs: 10, fw: '800', color: '#475569' }),
    _text('E', cx + w*0.35, cy + 4, { fs: 10, fw: '800', color: '#475569' }),
    _text('W', x + w*0.08, cy + 4, { fs: 10, fw: '800', color: '#475569' }),
    _circle(cx, cy, 4, '#1e293b', '#1e293b', 1),
  ];
}

function shapeHourglass(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.15} ${y+h*0.05} L ${x+w*0.85} ${y+h*0.05} L ${x+w*0.55} ${y+h*0.45} L ${x+w*0.85} ${y+h*0.95} L ${x+w*0.15} ${y+h*0.95} L ${x+w*0.45} ${y+h*0.45} Z`, '#fef3c7', '#f59e0b', 2),
    _line(x + w*0.35, y + h*0.35, x + w*0.65, y + h*0.55, '#d97706', 1.5),
    _circle(x + w*0.5, y + h*0.45, 3, '#d97706', '#b45309', 1),
  ];
}

function shapeTarget(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx, cy, Math.min(w,h)*0.4, 'none', '#ef4444', 2),
    _circle(cx, cy, Math.min(w,h)*0.28, 'none', '#ef4444', 2),
    _circle(cx, cy, Math.min(w,h)*0.15, 'none', '#ef4444', 3),
    _circle(cx, cy, Math.min(w,h)*0.06, '#ef4444', '#dc2626', 2),
    _line(cx - Math.min(w,h)*0.45, cy, cx + Math.min(w,h)*0.45, cy, '#fca5a5', 1),
    _line(cx, cy - Math.min(w,h)*0.45, cx, cy + Math.min(w,h)*0.45, '#fca5a5', 1),
  ];
}

function shapeStarRing(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [];
  for (let ring = 0; ring < 3; ring++) {
    const r = Math.min(w,h) * (0.15 + ring * 0.12);
    const pts = ring * 2 + 6;
    for (let i = 0; i < pts; i++) {
      const ang = (2 * Math.PI * i) / pts - Math.PI/2;
      const px = cx + Math.cos(ang) * r;
      const py = cy + Math.sin(ang) * r;
      segs.push(_circle(px, py, 2 + ring, '#fbbf24', '#f59e0b', 1));
    }
  }
  segs.push(_circle(cx, cy, 6, '#f59e0b', '#d97706', 2));
  return segs;
}

function shapeRadiatingPattern(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_circle(cx, cy, 5, '#3b82f6', '#1d4ed8', 2)];
  for (let ring = 1; ring <= 4; ring++) {
    const r = Math.min(w,h) * 0.1 * ring;
    segs.push(_circle(cx, cy, r, 'none', '#93c5fd', 1.5));
    for (let i = 0; i < ring * 4; i++) {
      const ang = (2 * Math.PI * i) / (ring * 4);
      segs.push(_circle(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r, 2, '#60a5fa', '#3b82f6', 1));
    }
  }
  return segs;
}

function shapeConcentricCircles(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [];
  for (let i = 5; i >= 1; i--) {
    const r = Math.min(w,h) * 0.08 * i;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    segs.push(_circle(cx, cy, r, colors[i-1]+'22', colors[i-1], 2));
  }
  return segs;
}

function shapeSpiral(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  let d = `M ${cx} ${cy}`;
  for (let i = 1; i <= 8; i++) {
    const ang = i * 0.8;
    const r = i * Math.min(w,h) * 0.04;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r;
    d += ` Q ${cx + Math.cos(ang - 0.4) * r} ${cy + Math.sin(ang - 0.4) * r} ${px} ${py}`;
  }
  return [_path(d, '#ec4899', 'none', 2.5)];
}

function shapeDNA3D(x, y, w, h) {
  const cx = x + w/2;
  const segs = [];
  const turns = 6, steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const yy = y + t * h;
    const ang = t * turns * Math.PI * 2;
    const r = w * 0.18;
    const x1 = cx + Math.cos(ang) * r;
    const x2 = cx + Math.cos(ang + Math.PI) * r;
    // Back bones
    segs.push(_circle(x1, yy, 3.5, '#2563eb', '#1d4ed8', 1));
    segs.push(_circle(x2, yy, 3.5, '#dc2626', '#b91c1c', 1));
    // Rungs
    if (i % 3 === 0) {
      segs.push(_line(x1, yy, x2, yy, '#94a3b8', 1.2));
    }
  }
  return segs;
}

function shapeFunnel3D(x, y, w, h) {
  const cx = x + w/2;
  const layers = 4;
  const segs = [];
  for (let i = 0; i < layers; i++) {
    const ly = y + (h * i) / layers;
    const lh = h / layers - 4;
    const lw = w * (1 - i * 0.2);
    const lx = cx - lw / 2;
    const fill = i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : i === 2 ? '#f59e0b' : '#ef4444';
    segs.push(_rect(lx, ly, lw, lh, fill+'22', fill, 1.5, 6));
    segs.push(_rect(lx, ly, lw, lh*0.3, fill, 'none', 0, 6));
    segs.push(_text(`Stage ${i+1}`, cx, ly + lh*0.55, { fs: 9, fw: '700', color: fill }));
  }
  return segs;
}

// ── 3D Nature / Science Shapes ───────────────────────────────────────────

function shapeCrystal(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${cx} ${y+h*0.05} L ${x+w*0.2} ${y+h*0.95} L ${cx} ${y+h*0.8} Z`, '#e0f2fe', '#0ea5e9', 2),
    _path(`M ${cx} ${y+h*0.05} L ${cx} ${y+h*0.8} L ${x+w*0.8} ${y+h*0.95} Z`, '#bae6fd', '#38bdf8', 1.5),
    _path(`M ${cx} ${y+h*0.8} L ${x+w*0.2} ${y+h*0.95} L ${x+w*0.8} ${y+h*0.95} Z`, '#7dd3fc', '#0284c7', 1.5),
    _line(cx, y + h*0.35, cx, y + h*0.7, '#0ea5e9', 1),
  ];
}

function shapeGeode(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  return [
    _circle(cx, cy, r, '#d1d5db', '#6b7280', 2.5),
    _circle(cx, cy, r*0.7, '#f3e8ff', '#a855f7', 2),
    _circle(cx, cy, r*0.45, '#ede9fe', '#8b5cf6', 1.5),
    _circle(cx, cy, r*0.25, '#c084fc', '#7c3aed', 1.5),
    _circle(cx, cy, r*0.1, '#a855f7', '#9333ea', 2),
  ];
}

function shapeGlobe(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.38;
  return [
    _circle(cx, cy, r, '#dbeafe', '#3b82f6', 2),
    _path(`M ${cx-r*0.6} ${cy-r*0.3} Q ${cx} ${cy-r*0.5} ${cx+r*0.6} ${cy-r*0.3}`, '#60a5fa', 'none', 1.5),
    _path(`M ${cx-r*0.7} ${cy} Q ${cx} ${cy+r*0.2} ${cx+r*0.7} ${cy}`, '#60a5fa', 'none', 1.5),
    _path(`M ${cx-r*0.6} ${cy+r*0.3} Q ${cx} ${cy+r*0.5} ${cx+r*0.6} ${cy+r*0.3}`, '#60a5fa', 'none', 1.5),
    _line(cx, cy - r, cx, cy + r, '#93c5fd', 1),
    _line(cx - r, cy, cx + r, cy, '#93c5fd', 1),
    _path(`M ${cx-r*0.8} ${cy-r*0.15} Q ${cx-r*0.3} ${cy-r*0.1} ${cx+r*0.3} ${cy-r*0.15}`, '#22c55e', '#22c55e33', 1.5),
  ];
}

function shapePlanetSaturn(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.25;
  return [
    _circle(cx, cy, r, '#fef3c7', '#f59e0b', 2.5),
    _circle(cx, cy, r*0.7, '#fbbf24', '#d97706', 1.5),
    _ellipse(cx, cy, w*0.45, h*0.08, 'none', '#d97706', 2.5),
    _ellipse(cx, cy, w*0.38, h*0.06, 'none', '#f59e0b', 1.5),
  ];
}

function shapeConstellation(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const stars = [
    {x: cx-w*0.3, y: cy+h*0.2}, {x: cx+w*0.1, y: cy-h*0.25},
    {x: cx+w*0.35, y: cy+h*0.05}, {x: cx-w*0.15, y: cy+h*0.35},
    {x: cx+w*0.2, y: cy+h*0.3}, {x: cx+w*0.05, y: cy-h*0.1},
  ];
  const segs = [];
  for (const s of stars) segs.push(_circle(s.x, s.y, 3, '#fbbf24', '#f59e0b', 1));
  // Draw connections between stars (deterministic: connect stars that are close)
  for (let i = 0; i < stars.length; i++) {
    for (let j = i+1; j < stars.length; j++) {
      const dx = stars[i].x - stars[j].x;
      const dy = stars[i].y - stars[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < Math.min(w,h) * 0.4) {
        segs.push(_line(stars[i].x, stars[i].y, stars[j].x, stars[j].y, '#fde68a', 0.8));
      }
    }
  }
  return segs;
}

function shapeNebula(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx-w*0.3} ${cy-h*0.2} Q ${cx-w*0.1} ${cy-h*0.4} ${cx+w*0.2} ${cy-h*0.15} Q ${cx+w*0.4} ${cy+h*0.1} ${cx+w*0.25} ${cy+h*0.3} Q ${cx+w*0.1} ${cy+h*0.4} ${cx-w*0.15} ${cy+h*0.25} Q ${cx-w*0.35} ${cy+h*0.1} ${cx-w*0.3} ${cy-h*0.2}`, 'none', '#a855f7', 3),
    _path(`M ${cx-w*0.2} ${cy-h*0.1} Q ${cx} ${cy-h*0.25} ${cx+w*0.15} ${cy-h*0.05} Q ${cx+w*0.25} ${cy+h*0.1} ${cx+w*0.15} ${cy+h*0.2} Q ${cx} ${cy+h*0.3} ${cx-w*0.1} ${cy+h*0.15} Q ${cx-w*0.25} ${cy+h*0.05} ${cx-w*0.2} ${cy-h*0.1}`, 'none', '#c084fc', 2),
  ];
}

// ── Abstract / Creative Tech Shapes ──────────────────────────────────────

function shapeNeuralNetwork(x, y, w, h) {
  const segs = [];
  const layers = [4, 5, 4];
  const lx = [];
  let lxPos = x + w*0.08;
  for (const size of layers) {
    const nodes = [];
    const lyStep = (h * 0.85) / (size + 1);
    for (let i = 0; i < size; i++) {
      const ny = y + h*0.08 + lyStep * (i + 1);
      nodes.push({x: lxPos, y: ny});
      segs.push(_circle(lxPos, ny, 6, '#dbeafe', '#3b82f6', 1.5));
    }
    lx.push(nodes);
    lxPos += w * 0.4;
  }
  for (let l = 0; l < lx.length - 1; l++) {
    for (const a of lx[l]) {
      for (const b of lx[l+1]) {
        segs.push(_line(a.x, a.y, b.x, b.y, '#93c5fd', 0.6));
      }
    }
  }
  return segs;
}

function shapeCircuitBoard(x, y, w, h) {
  const segs = [];
  const cx = x + w/2, cy = y + h/2;
  segs.push(_rect(x, y, w, h, '#0f172a', '#334155', 2, 8));
  // Traces
  segs.push(_line(x + w*0.1, y + h*0.2, x + w*0.4, y + h*0.2, '#22c55e', 1.5));
  segs.push(_line(x + w*0.4, y + h*0.2, x + w*0.4, y + h*0.5, '#22c55e', 1.5));
  segs.push(_line(x + w*0.4, y + h*0.5, x + w*0.7, y + h*0.5, '#22c55e', 1.5));
  segs.push(_line(x + w*0.7, y + h*0.5, x + w*0.7, y + h*0.8, '#22c55e', 1.5));
  segs.push(_line(x + w*0.2, y + h*0.6, x + w*0.5, y + h*0.6, '#22c55e', 1.5));
  segs.push(_line(x + w*0.5, y + h*0.6, x + w*0.5, y + h*0.9, '#22c55e', 1.5));
  // Components
  segs.push(_circle(x + w*0.1, y + h*0.2, 4, '#3b82f6', '#1d4ed8', 1));
  segs.push(_rect(x + w*0.35, y + h*0.08, w*0.1, h*0.08, '#334155', '#475569', 1, 3));
  segs.push(_rect(x + w*0.65, y + h*0.42, w*0.08, h*0.08, '#334155', '#475569', 1, 3));
  segs.push(_circle(x + w*0.7, y + h*0.8, 6, '#f59e0b', '#d97706', 1.5));
  segs.push(_rect(x + w*0.15, y + h*0.55, w*0.05, h*0.1, '#1e293b', '#475569', 1, 2));
  segs.push(_rect(x + w*0.8, y + h*0.85, w*0.12, h*0.08, '#1e293b', '#475569', 1, 2));
  return segs;
}

function shapeDataFlow(x, y, w, h) {
  const segs = [];
  const nodes = [
    {x: x + w*0.15, y: y + h*0.3, label: 'In', color: '#3b82f6'},
    {x: x + w*0.5, y: y + h*0.2, label: 'Proc', color: '#10b981'},
    {x: x + w*0.5, y: y + h*0.6, label: 'Store', color: '#f59e0b'},
    {x: x + w*0.85, y: y + h*0.4, label: 'Out', color: '#ef4444'},
  ];
  for (const n of nodes) {
    segs.push(_rect(n.x - w*0.08, n.y - h*0.06, w*0.16, h*0.12, n.color+'22', n.color, 2, 6));
    segs.push(_text(n.label, n.x, n.y + 4, { fs: 9, fw: '700', color: n.color }));
  }
  segs.push(_arrow(nodes[0].x + w*0.08, nodes[0].y, nodes[1].x - w*0.08, nodes[1].y - h*0.05, '#64748b', 1.5));
  segs.push(_arrow(nodes[1].x, nodes[1].y + h*0.06, nodes[2].x, nodes[2].y - h*0.06, '#64748b', 1.5));
  segs.push(_arrow(nodes[2].x + w*0.08, nodes[2].y, nodes[3].x - w*0.08, nodes[3].y, '#64748b', 1.5));
  return segs;
}

function shapeCloudComputing(x, y, w, h) {
  const cx = x + w/2, cy = y + h*0.3;
  return [
    _circle(cx - w*0.12, cy + h*0.02, w*0.1, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(cx + w*0.05, cy - h*0.06, w*0.13, '#e0f2fe', '#0ea5e9', 1.5),
    _circle(cx + w*0.15, cy + h*0.02, w*0.1, '#e0f2fe', '#0ea5e9', 1.5),
    _rect(cx - w*0.18, cy + h*0.02, w*0.36, h*0.08, '#e0f2fe', '#0ea5e9', 1, 6),
    _text('☁ Cloud', cx, cy - h*0.02, { fs: 10, fw: '700', color: '#0369a1' }),
    // Servers below
    _rect(x + w*0.1, y + h*0.5, w*0.22, h*0.4, '#1e293b', '#3b82f6', 1.5, 4),
    _rect(x + w*0.38, y + h*0.5, w*0.22, h*0.4, '#1e293b', '#10b981', 1.5, 4),
    _rect(x + w*0.66, y + h*0.5, w*0.22, h*0.4, '#1e293b', '#f59e0b', 1.5, 4),
    _arrow(cx, y + h*0.2, cx + w*0.1, y + h*0.45, '#64748b', 1.5),
    _arrow(cx - w*0.1, y + h*0.2, cx - w*0.05, y + h*0.45, '#64748b', 1.5),
  ];
}

function shapeBlockchain(x, y, w, h) {
  const segs = [];
  const blocks = 4;
  const bSize = Math.min(w * 0.15, h * 0.3);
  for (let i = 0; i < blocks; i++) {
    const bx = x + w*0.08 + i * (bSize + w*0.04);
    const by = y + h*0.25;
    segs.push(_rect(bx, by, bSize, bSize, '#f3e8ff', '#a855f7', 2, 4));
    // Hash pattern inside
    segs.push(_line(bx + 3, by + 5, bx + bSize - 3, by + 5, '#c084fc', 1));
    segs.push(_line(bx + 3, by + bSize/3, bx + bSize - 3, by + bSize/3, '#c084fc', 1));
    segs.push(_line(bx + 3, by + bSize*0.55, bx + bSize - 3, by + bSize*0.55, '#c084fc', 1));
    segs.push(_line(bx + 3, by + bSize - 5, bx + bSize - 3, by + bSize - 5, '#c084fc', 1));
    if (i < blocks - 1) {
      segs.push(_arrow(bx + bSize, by + bSize/2, bx + bSize + w*0.04, by + bSize/2, '#a855f7', 1.5));
    }
  }
  return segs;
}

function shapeCyberShield(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${y+h*0.05} L ${x+w*0.88} ${y+h*0.2} L ${x+w*0.88} ${y+h*0.6} Q ${x+w*0.88} ${y+h*0.8} ${cx} ${y+h*0.95} Q ${x+w*0.12} ${y+h*0.8} ${x+w*0.12} ${y+h*0.6} L ${x+w*0.12} ${y+h*0.2} Z`, '#dbeafe', '#3b82f6', 2.5),
    _text('🛡', cx, cy + 4, { fs: 24, fw: '500', color: '#2563eb' }),
  ];
}

function shapeLockShield(x, y, w, h) {
  return [
    _path(`M ${x+w*0.25} ${y+h*0.4} L ${x+w*0.25} ${y+h*0.3} Q ${x+w*0.25} ${y} ${x+w*0.5} ${y} Q ${x+w*0.75} ${y} ${x+w*0.75} ${y+h*0.3} L ${x+w*0.75} ${y+h*0.4}`, '#1e293b', '#1e293b', 2.5),
    _rect(x + w*0.2, y + h*0.38, w*0.6, h*0.55, '#fef3c7', '#f59e0b', 2, 6),
    _circle(x + w*0.5, y + h*0.62, w*0.08, '#fbbf24', '#d97706', 2),
    _rect(x + w*0.45, y + h*0.58, w*0.1, h*0.18, '#d97706', '#b45309', 1.5, 2),
  ];
}

function shapeFirewall(x, y, w, h) {
  return [
    _rect(x + w*0.05, y + h*0.1, w*0.9, h*0.8, '#fef2f2', '#ef4444', 2, 8),
    _rect(x + w*0.1, y + h*0.15, w*0.8, h*0.25, '#ef4444', '#dc2626', 1.5, 4),
    _text('FIREWALL', x + w/2, y + h*0.3, { fs: 14, fw: '800', color: '#ffffff' }),
    _line(x + w*0.15, y + h*0.55, x + w*0.3, y + h*0.7, '#ef4444', 2),
    _line(x + w*0.3, y + h*0.55, x + w*0.15, y + h*0.7, '#ef4444', 2),
    _line(x + w*0.45, y + h*0.55, x + w*0.6, y + h*0.7, '#ef4444', 2),
    _line(x + w*0.6, y + h*0.55, x + w*0.45, y + h*0.7, '#ef4444', 2),
    _line(x + w*0.75, y + h*0.55, x + w*0.9, y + h*0.7, '#ef4444', 2),
    _line(x + w*0.9, y + h*0.55, x + w*0.75, y + h*0.7, '#ef4444', 2),
    _text('✓', x + w*0.22, y + h*0.67, { fs: 12, fw: '800', color: '#ef4444' }),
    _text('✗', x + w*0.52, y + h*0.67, { fs: 12, fw: '800', color: '#ef4444' }),
    _text('✗', x + w*0.82, y + h*0.67, { fs: 12, fw: '800', color: '#ef4444' }),
  ];
}

function shapeEncryption(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _rect(x + w*0.1, y + h*0.15, w*0.8, h*0.7, '#0f172a', '#22c55e', 2, 8),
    _text('🔐', cx, y + h*0.35, { fs: 16, fw: '500', color: '#22c55e' }),
    _text('AES-256', cx, y + h*0.6, { fs: 10, fw: '700', color: '#22c55e' }),
    _line(x + w*0.2, y + h*0.7, x + w*0.8, y + h*0.7, '#22c55e', 0.8),
    _line(x + w*0.2, y + h*0.75, x + w*0.6, y + h*0.75, '#22c55e', 0.8),
  ];
}

// ── 3D Physics / Chemistry Shapes ────────────────────────────────────────

function shapeMolecule3D(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.08;
  return [
    _circle(cx - w*0.15, cy - h*0.1, r*1.5, '#ef4444', '#dc2626', 2),
    _circle(cx + w*0.15, cy + h*0.1, r, '#3b82f6', '#1d4ed8', 2),
    _circle(cx + w*0.1, cy - h*0.18, r*0.8, '#22c55e', '#16a34a', 2),
    _circle(cx - w*0.08, cy + h*0.18, r*0.8, '#22c55e', '#16a34a', 2),
    _line(cx - w*0.15, cy - h*0.1, cx + w*0.15, cy + h*0.1, '#64748b', 2),
    _line(cx - w*0.15, cy - h*0.1, cx + w*0.1, cy - h*0.18, '#64748b', 2),
    _line(cx - w*0.15, cy - h*0.1, cx - w*0.08, cy + h*0.18, '#64748b', 2),
    _line(cx + w*0.15, cy + h*0.1, cx + w*0.1, cy - h*0.18, '#64748b', 2),
    _line(cx + w*0.15, cy + h*0.1, cx - w*0.08, cy + h*0.18, '#64748b', 2),
    _line(cx + w*0.1, cy - h*0.18, cx - w*0.08, cy + h*0.18, '#64748b', 2),
  ];
}

function shapeElectronShell(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [_circle(cx, cy, Math.min(w,h)*0.06, '#ef4444', '#dc2626', 2.5)];
  for (let shell = 1; shell <= 3; shell++) {
    const r = Math.min(w,h) * 0.1 * (shell + 1);
    segs.push(_circle(cx, cy, r, 'none', '#94a3b8', 1.5));
    const electrons = shell * 2;
    for (let e = 0; e < electrons; e++) {
      const ang = (2 * Math.PI * e) / electrons;
      segs.push(_circle(cx + Math.cos(ang)*r, cy + Math.sin(ang)*r, 3, '#3b82f6', '#1d4ed8', 1));
    }
  }
  return segs;
}

function shapeFission(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx - w*0.1, cy, w*0.12, '#fca5a5', '#ef4444', 2),
    _circle(cx + w*0.15, cy - h*0.1, w*0.08, '#93c5fd', '#3b82f6', 2),
    _circle(cx + w*0.2, cy + h*0.12, w*0.06, '#fde68a', '#f59e0b', 2),
    _arrow(cx, cy - h*0.1, cx + w*0.1, cy - h*0.1, '#ef4444', 1.5),
    _arrow(cx, cy + h*0.1, cx + w*0.12, cy + h*0.12, '#ef4444', 1.5),
    _line(cx - w*0.1, cy, cx + w*0.05, cy, '#dc2626', 1.5),
  ];
}

function shapeFusion(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _circle(cx - w*0.12, cy - h*0.05, w*0.08, '#93c5fd', '#3b82f6', 2),
    _circle(cx - w*0.05, cy + h*0.08, w*0.06, '#93c5fd', '#3b82f6', 2),
    _arrow(cx - w*0.02, cy, cx + w*0.08, cy, '#ef4444', 2),
    _circle(cx + w*0.12, cy, w*0.1, '#fca5a5', '#ef4444', 2.5),
    _path(`M ${cx+w*0.12} ${cy-w*0.1} L ${cx+w*0.12} ${cy+w*0.1} L ${cx+w*0.2} ${cy} Z`, '#fbbf24', '#f59e0b', 1),
  ];
}

function shapeWaveInterference(x, y, w, h) {
  const segs = [];
  const cx = x + w/2;
  // Source waves
  for (let i = 0; i < 3; i++) {
    const r = w * 0.1 * (i + 1);
    segs.push(_circle(x + w*0.3, y + h*0.4, r, 'none', '#3b82f6', 1.5));
    segs.push(_circle(x + w*0.7, y + h*0.6, r, 'none', '#ef4444', 1.5));
  }
  // Interference pattern at center
  for (let i = 0; i < 4; i++) {
    const r = w * 0.04 * (i + 1);
    segs.push(_circle(x + w*0.5, y + h*0.5, r, 'none', '#a855f7', 1.5));
  }
  segs.push(_line(x + w*0.3, y + h*0.4, x + w*0.5, y + h*0.5, '#64748b', 0.5));
  segs.push(_line(x + w*0.7, y + h*0.6, x + w*0.5, y + h*0.5, '#64748b', 0.5));
  return segs;
}

function shapeLensDiagram(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  return [
    _path(`M ${cx} ${y+h*0.1} Q ${cx-w*0.1} ${cy} ${cx} ${y+h*0.9}`, '#3b82f6', 'none', 2.5),
    _path(`M ${cx} ${y+h*0.1} Q ${cx+w*0.1} ${cy} ${cx} ${y+h*0.9}`, '#3b82f6', 'none', 2.5),
    _line(x + w*0.05, cy, x + w*0.95, cy, '#cbd5e1', 1),
    // Incoming rays
    _arrow(x + w*0.05, cy - h*0.2, cx, cy - h*0.1, '#f59e0b', 1.5),
    _arrow(x + w*0.05, cy + h*0.2, cx, cy + h*0.1, '#f59e0b', 1.5),
    _arrow(x + w*0.05, cy, cx, cy, '#f59e0b', 1.5),
    // Converging rays
    _arrow(cx, cy - h*0.1, x + w*0.95, cy - h*0.3, '#ef4444', 1.5),
    _arrow(cx, cy + h*0.1, x + w*0.95, cy + h*0.3, '#ef4444', 1.5),
    _arrow(cx, cy, x + w*0.95, cy, '#ef4444', 1.5),
  ];
}

function shapePrism(x, y, w, h) {
  const cx = x + w/2;
  return [
    _path(`M ${x+w*0.1} ${y+h*0.9} L ${cx} ${y+h*0.1} L ${x+w*0.9} ${y+h*0.9} Z`, 'none', '#8b5cf6', 2.5),
    _path(`M ${x+w*0.1} ${y+h*0.9} L ${cx} ${y+h*0.1} L ${x+w*0.9} ${y+h*0.9} Z`, '#f3e8ff', 'none', 0),
    // Light beam
    _line(x + w*0.1, y + h*0.1, cx, y + h*0.5, '#fbbf24', 2),
    _line(cx, y + h*0.5, x + w*0.95, y + h*0.15, '#ef4444', 1.5),
    _line(cx, y + h*0.5, x + w*0.95, y + h*0.4, '#22c55e', 1.5),
    _line(cx, y + h*0.5, x + w*0.95, y + h*0.65, '#3b82f6', 1.5),
    _line(cx, y + h*0.5, x + w*0.85, y + h*0.9, '#a855f7', 1.5),
  ];
}

function shapeSeismicWave(x, y, w, h) {
  return [
    _path(`M ${x} ${y+h*0.6} Q ${x+w*0.125} ${y+h*0.2} ${x+w*0.25} ${y+h*0.6} Q ${x+w*0.375} ${y+h*0.8} ${x+w*0.5} ${y+h*0.5} Q ${x+w*0.625} ${y+h*0.2} ${x+w*0.75} ${y+h*0.55} Q ${x+w*0.875} ${y+h*0.8} ${x+w} ${y+h*0.5}`, '#ef4444', 'none', 2.5),
    _circle(x + w*0.15, y + h*0.5, 4, '#ef4444', '#dc2626', 1),
    _circle(x + w*0.5, y + h*0.5, 4, '#ef4444', '#dc2626', 1),
    _circle(x + w*0.85, y + h*0.5, 4, '#ef4444', '#dc2626', 1),
  ];
}

function shapeMagneticField(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2;
  const segs = [
    _rect(x + w*0.1, y + h*0.3, w*0.15, h*0.4, '#1e293b', '#1e293b', 2, 4),
    _rect(x + w*0.75, y + h*0.3, w*0.15, h*0.4, '#1e293b', '#1e293b', 2, 4),
    _text('N', x + w*0.175, cy + 4, { fs: 12, fw: '800', color: '#ffffff' }),
    _text('S', x + w*0.825, cy + 4, { fs: 12, fw: '800', color: '#ffffff' }),
  ];
  for (let i = 0; i < 5; i++) {
    const yy = y + h * (0.2 + i * 0.15);
    const width = w * 0.35 + i * w * 0.03;
    segs.push(_path(`M ${x+w*0.25} ${yy} Q ${cx} ${yy + (i-2)*8} ${x+w*0.75} ${yy}`, '#3b82f6', 'none', 1.2));
  }
  return segs;
}

// ── Abstract Art / Creative Education Shapes ─────────────────────────────

function shapeColorWheel(x, y, w, h) {
  const cx = x + w/2, cy = y + h/2, r = Math.min(w,h)*0.35;
  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  const segs = [];
  for (let i = 0; i < 6; i++) {
    const ang = (2 * Math.PI * i) / 6;
    const endAng = (2 * Math.PI * (i + 1)) / 6;
    const pts = 12;
    const innerR = r * 0.5;
    let d = `M ${cx + Math.cos(ang)*r} ${cy + Math.sin(ang)*r}`;
    for (let j = 1; j <= pts; j++) {
      const t = ang + (endAng - ang) * (j / pts);
      d += ` L ${cx + Math.cos(t)*r} ${cy + Math.sin(t)*r}`;
    }
    d += ` L ${cx + Math.cos(endAng)*innerR} ${cy + Math.sin(endAng)*innerR}`;
    for (let j = pts; j >= 0; j--) {
      const t = ang + (endAng - ang) * (j / pts);
      d += ` L ${cx + Math.cos(t)*innerR} ${cy + Math.sin(t)*innerR}`;
    }
    d += ' Z';
    segs.push(_path(d, colors[i], colors[i]+'99', 0.5));
  }
  segs.push(_circle(cx, cy, r*0.3, '#ffffff', '#94a3b8', 1.5));
  return segs;
}

function shapePerspectiveGrid(x, y, w, h) {
  const cx = x + w/2, cy = y + h*0.1;
  const segs = [];
  // Horizon line
  segs.push(_line(x, cy, x + w, cy, '#94a3b8', 1));
  // Vanishing lines
  for (let i = -3; i <= 3; i++) {
    const bx = cx + i * w * 0.08;
    segs.push(_line(cx, cy, bx, y + h, '#cbd5e1', 0.8));
  }
  // Horizontal grid lines
  for (let i = 1; i <= 5; i++) {
    const yy = cy + (y + h - cy) * (i / 6);
    const frac = i / 6;
    const halfW = w * 0.5 * frac;
    segs.push(_line(cx - halfW, yy, cx + halfW, yy, '#cbd5e1', 0.8));
  }
  return segs;
}

function shapeFibonacci(x, y, w, h) {
  const segs = [];
  const s = Math.min(w,h) * 0.15;
  const rects = [
    {x: x + w*0.3, y: y + h*0.5, w: s, h: s, fill: '#3b82f6'},
    {x: x + w*0.3 + s, y: y + h*0.5, w: s, h: s, fill: '#10b981'},
    {x: x + w*0.3 + s*2, y: y + h*0.5 - s, w: s*2, h: s*2, fill: '#f59e0b'},
    {x: x + w*0.3, y: y + h*0.5 - s*2, w: s*3, h: s*3, fill: '#ef4444'},
    {x: x + w*0.3 - s*5, y: y + h*0.5 + s, w: s*5, h: s*5, fill: '#8b5cf6'},
  ];
  for (const r of rects) {
    segs.push(_rect(r.x, r.y, r.w, r.h, r.fill+'33', r.fill, 1.5, 2));
  }
  // Spiral arc through the rectangles (deterministic bezier approximation)
  const cx = x + w*0.3 + s, cy = y + h*0.5;
  segs.push(
    _path(`M ${cx} ${cy} Q ${cx+s*0.5} ${cy-s*0.8} ${cx+s} ${cy-s} Q ${cx+s*2} ${cy-s*2.5} ${cx+s*2} ${cy-s*2}`, '#f59e0b', 'none', 2),
    _path(`M ${cx+s*2} ${cy-s*2} Q ${cx+s*2.5} ${cy-s*3.5} ${cx+s*3} ${cy-s*3}`, '#f59e0b', 'none', 2),
  );
  return segs;
}

function shapeFlowField(x, y, w, h) {
  const segs = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 7; c++) {
      const fx = x + w * (0.08 + c * 0.13);
      const fy = y + h * (0.1 + r * 0.18);
      const ang = Math.sin(r * 1.5 + c * 0.8) * 1.2;
      const len = w * 0.05;
      segs.push(_line(fx, fy, fx + Math.cos(ang)*len, fy + Math.sin(ang)*len, '#60a5fa', 1));
      segs.push(_circle(fx, fy, 2, '#93c5fd', '#60a5fa', 0.5));
    }
  }
  return segs;
}

function shapeVoronoi(x, y, w, h) {
  const points = [
    {x: w*0.2, y: h*0.3}, {x: w*0.7, y: h*0.2},
    {x: w*0.5, y: h*0.6}, {x: w*0.25, y: h*0.7},
    {x: w*0.8, y: h*0.7}, {x: w*0.45, y: h*0.35},
  ];
  const segs = [];
  for (const p of points) {
    segs.push(_circle(x + p.x, y + p.y, 4, '#3b82f6', '#1d4ed8', 1));
  }
  // Connect nearby points
  for (let i = 0; i < points.length; i++) {
    for (let j = i+1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < w*0.35) {
        const mx = (points[i].x + points[j].x) / 2;
        const my = (points[i].y + points[j].y) / 2;
        const px = -(points[i].y - points[j].y) * 0.5;
        const py = (points[i].x - points[j].x) * 0.5;
        segs.push(_line(x + mx + px, y + my + py, x + mx - px, y + my - py, '#94a3b8', 0.8));
      }
    }
  }
  return segs;
}

// ── Export ───────────────────────────────────────────────────────────────

export const CREATIVE_SHAPES = {
  // 3D Geometric
  '3d_cube': shape3dCube,
  '3d_sphere': shape3dSphere,
  '3d_cylinder': shape3dCylinder,
  '3d_cone': shape3dCone,
  '3d_pyramid': shape3dPyramid,
  '3d_torus': shape3dTorus,
  '3d_box': shape3dBox,

  // Data / Infographics
  '3d_bar_chart': shape3dBarChart,
  '3d_pie_chart': shape3dPieChart,
  'gauge_meter': shapeGaugeMeter,
  'progress_ring': shapeProgressRing,
  'donut_chart': shapeDonutChart,
  'kpi_card': shapeKPI,
  'heatmap_grid': shapeHeatmapGrid,
  'data_flow': shapeDataFlow,

  // Decorative / Artistic
  'mandala': shapeMandala,
  'compass': shapeCompass,
  'hourglass': shapeHourglass,
  'target': shapeTarget,
  'star_ring': shapeStarRing,
  'radiating_pattern': shapeRadiatingPattern,
  'concentric_circles': shapeConcentricCircles,
  'spiral': shapeSpiral,
  'dna_3d': shapeDNA3D,
  'funnel_3d': shapeFunnel3D,

  // Nature / Science 3D
  'crystal': shapeCrystal,
  'geode': shapeGeode,
  'globe': shapeGlobe,
  'planet_saturn': shapePlanetSaturn,
  'constellation': shapeConstellation,
  'nebula': shapeNebula,

  // Creative Tech
  'neural_network': shapeNeuralNetwork,
  'circuit_board': shapeCircuitBoard,
  'cloud_computing': shapeCloudComputing,
  'blockchain': shapeBlockchain,
  'cyber_shield': shapeCyberShield,
  'lock_shield': shapeLockShield,
  'firewall': shapeFirewall,
  'encryption': shapeEncryption,

  // Physics / Chemistry 3D
  'molecule_3d': shapeMolecule3D,
  'electron_shell': shapeElectronShell,
  'fission': shapeFission,
  'fusion': shapeFusion,
  'wave_interference': shapeWaveInterference,
  'lens_diagram': shapeLensDiagram,
  'prism': shapePrism,
  'seismic_wave': shapeSeismicWave,
  'magnetic_field': shapeMagneticField,

  // Abstract / Creative Education
  'color_wheel': shapeColorWheel,
  'perspective_grid': shapePerspectiveGrid,
  'fibonacci': shapeFibonacci,
  'flow_field': shapeFlowField,
  'voronoi': shapeVoronoi,
};

export const CREATIVE_ALIASES = {
  '3d cube': '3d_cube', 'cube': '3d_cube', 'block': '3d_cube',
  '3d sphere': '3d_sphere', 'sphere': '3d_sphere', 'ball': '3d_sphere', '3d ball': '3d_sphere',
  '3d cylinder': '3d_cylinder', 'cylinder': '3d_cylinder', 'tube': '3d_cylinder',
  '3d cone': '3d_cone', 'cone': '3d_cone',
  '3d pyramid': '3d_pyramid', 'pyramid': '3d_pyramid', 'tetrahedron': '3d_pyramid',
  '3d torus': '3d_torus',  'torus': '3d_torus', 'doughnut': '3d_torus',
  '3d box': '3d_box', 'gift box': '3d_box',
  'bar chart': '3d_bar_chart', 'chart': '3d_bar_chart', 'histogram': '3d_bar_chart',
  'pie chart': '3d_pie_chart', 'pie': '3d_pie_chart',
  'gauge': 'gauge_meter', 'speedometer': 'gauge_meter', 'meter': 'gauge_meter',
  'progress': 'progress_ring', 'loader': 'progress_ring', 'spinner': 'progress_ring',
  'donut': 'donut_chart', 'donut chart': 'donut_chart',
  'kpi': 'kpi_card', 'metric': 'kpi_card', 'stat': 'kpi_card',
  'heatmap': 'heatmap_grid', 'grid': 'heatmap_grid',
  'mandala': 'mandala', 'mandala art': 'mandala',
  'compass rose': 'compass', 'wind compass': 'compass',
  'hour glass': 'hourglass', 'timer': 'hourglass',
  'target': 'target', 'bullseye': 'target', 'crosshair': 'target',
  'star ring': 'star_ring', 'stars': 'star_ring',
  'radiation': 'radiating_pattern', 'radial': 'radiating_pattern',
  'concentric': 'concentric_circles', 'rings': 'concentric_circles',
  'dna 3d': 'dna_3d', 'double helix 3d': 'dna_3d',
  'funnel': 'funnel_3d', 'sales funnel': 'funnel_3d',
  'crystal': 'crystal', 'crystal shape': 'crystal', 'gem': 'crystal',
  'geode': 'geode', 'crystal cave': 'geode',
  'globe': 'globe', 'earth': 'globe', 'world': 'globe',
  'saturn': 'planet_saturn', 'planet': 'planet_saturn', 'solar system': 'planet_saturn',
  'constellations': 'constellation', 'stars pattern': 'constellation',
  'nebula': 'nebula', 'space cloud': 'nebula',
  'neural net': 'neural_network', 'neural': 'neural_network', 'deep learning': 'neural_network',
  'circuit': 'circuit_board', 'pcb': 'circuit_board', 'board': 'circuit_board',
  'cloud computing': 'cloud_computing', 'cloud infra': 'cloud_computing',
  'block chain': 'blockchain', 'chain': 'blockchain',
  'shield': 'cyber_shield', 'cyber': 'cyber_shield', 'cyber shield': 'cyber_shield',
  'lock shield': 'lock_shield', 'padlock': 'lock_shield',
  'fire wall': 'firewall', 'security': 'firewall',
  'encrypt': 'encryption', 'encryption': 'encryption', 'aes': 'encryption',
  'molecule': 'molecule_3d', 'chemical': 'molecule_3d',
  'electron': 'electron_shell', 'atom': 'electron_shell',
  'nuclear fission': 'fission', 'split atom': 'fission',
  'nuclear fusion': 'fusion', 'merge': 'fusion',
  'wave pattern': 'wave_interference', 'interference': 'wave_interference',
  'lens': 'lens_diagram', 'optical lens': 'lens_diagram',
  'light prism': 'prism', 'spectrum': 'prism',
  'seismic': 'seismic_wave', 'earthquake': 'seismic_wave',
  'magnet': 'magnetic_field', 'magnetic': 'magnetic_field',
  'color wheel': 'color_wheel', 'rainbow': 'color_wheel',
  'perspective': 'perspective_grid', '3d grid': 'perspective_grid',
  'fibonacci': 'fibonacci', 'golden ratio': 'fibonacci',
  'flow field': 'flow_field', 'vector field': 'flow_field',
  'voronoi': 'voronoi', 'voronoi diagram': 'voronoi',
};
