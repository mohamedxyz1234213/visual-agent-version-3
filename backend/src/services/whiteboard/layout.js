// -----------------------------------------------------------------------------
// Text layout / fit pass
// -----------------------------------------------------------------------------
// Templates place a text label and assume it occupies one short line inside its
// box. But the renderer wraps text to a much wider implicit width and up to 4
// lines, so long labels spill out of their box and collide with neighbours —
// the real cause of the "text over boxes" overlap the user reported.
//
// This pass makes every drawn text fit its slot: it finds the filled
// box/circle/object the text sits inside, pins the text's wrap width to that
// box, and truncates the content to the number of lines that fit the box's
// height. Text with no container is clamped to a safe width near the canvas
// edge. The FULL teaching text is preserved elsewhere (the caption track), so
// truncating the on-board anchor is safe and keeps boards clean.
// -----------------------------------------------------------------------------

const CHAR_W = 0.55;        // glyph width factor (matches the renderer)
const LINE_H = 1.35;        // line-height factor (matches the renderer)
const PAD = 14;             // inner padding inside a container box
const CANVAS_W = 800;
const CANVAS_H = 500;
const CAPTION_TOP = 430;    // content must stay above the caption band

// Greedily wrap `text` to `maxWidth` at `fontSize`; if it needs more than
// `maxLines`, truncate the last visible line with an ellipsis. Returns the
// (possibly shortened) string so the renderer wraps it to exactly the fit.
export function fitText(text, maxWidth, fontSize, maxLines) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const charsPerLine = Math.max(6, Math.floor(maxWidth / (fontSize * CHAR_W)));
  const words = s.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length > charsPerLine && cur) { lines.push(cur); cur = w; }
    else cur = test;
    if (lines.length >= maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length > maxLines) lines.length = maxLines;
  // If there is leftover content beyond what fit, ellipsize the last line.
  const joined = lines.join(' ');
  if (joined.length < s.length) {
    let last = lines[lines.length - 1] || '';
    if (last.length > charsPerLine - 1) last = last.slice(0, Math.max(1, charsPerLine - 1));
    lines[lines.length - 1] = `${last.replace(/[ ,.;:]+$/, '')}…`;
  }
  return lines.join(' ');
}

function textAnchorPoint(f) {
  const [x, y] = f.position || [0, 0];
  const anchor = (f.style && f.style.textAnchor) || 'start';
  // sample a point a little below the baseline-top so it lands inside the box
  return { x: anchor === 'middle' ? x : anchor === 'end' ? x - 1 : x + 1, y: y - 2, anchor, x0raw: x, y0raw: y };
}

// Filled containers a label can belong to (NOT outline frames/guide rings).
function containers(frags) {
  const out = [];
  for (const f of frags) {
    if (f.type === 'draw_rect') {
      const fill = f.style && f.style.fill;
      if (!fill || fill === 'none') continue;
      out.push({ x0: f.x, y0: f.y, x1: f.x + (f.width || 0), y1: f.y + (f.height || 0), w: f.width || 0, h: f.height || 0 });
    } else if (f.type === 'draw_circle') {
      const fill = f.style && f.style.fill;
      if (!fill || fill === 'none') continue;
      const [cx, cy] = f.center || [0, 0]; const r = f.radius || 0;
      out.push({ x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, w: r * 2, h: r * 2, circle: true, cx, cy, r });
    } else if (f.type === 'draw_object' || f.type === 'draw_physics_shape') {
      const [x, y] = f.position || [0, 0]; const [w, h] = f.size || [120, 100];
      out.push({ x0: x, y0: y, x1: x + w, y1: y + h, w, h, figure: true });
    }
  }
  return out;
}

// Smallest filled box that contains the point — the label's likely panel.
// Ignore near-full-board panels (they're backgrounds, not text slots).
function findContainer(pt, boxes) {
  let best = null;
  for (const b of boxes) {
    if (b.w >= 760 || b.h >= 440) continue; // background
    if (pt.x >= b.x0 - 2 && pt.x <= b.x1 + 2 && pt.y >= b.y0 - 2 && pt.y <= b.y1 + 6) {
      const area = b.w * b.h;
      if (!best || area < best.area) best = { ...b, area };
    }
  }
  return best;
}

// Horizontal extent [x0,x1] a text occupies given its anchor + wrap width.
function textXSpan(f, maxWidth) {
  const [x] = f.position || [0, 0];
  const anchor = (f.style && f.style.textAnchor) || 'start';
  if (anchor === 'middle') return [x - maxWidth / 2, x + maxWidth / 2];
  if (anchor === 'end') return [x - maxWidth, x];
  return [x, x + maxWidth];
}

// The y of the nearest element BELOW this text whose horizontal span overlaps —
// the floor the text must not grow past (prevents wrapped text colliding with
// the title/detail/box beneath it). Considers filled boxes AND other texts.
function floorBelow(self, span, topY, frags) {
  let floorY = CANVAS_H; // caption band / canvas bottom
  const [sx0, sx1] = span;
  for (const g of frags) {
    if (g === self) continue;
    let gx0, gx1, gTop;
    if (g.type === 'draw_text') {
      const gw = (g.style && g.style.maxWidth) || 120;
      [gx0, gx1] = textXSpan(g, gw);
      const gfs = (g.style && g.style.fontSize) || 14;
      gTop = (g.position?.[1] ?? 0) - gfs;
    } else {
      const b = frameBoxOf(g);
      if (!b) continue;
      gx0 = b.x0; gx1 = b.x1; gTop = b.y0;
    }
    if (gTop <= topY + 4) continue;             // not below
    if (gx1 <= sx0 + 4 || gx0 >= sx1 - 4) continue; // no horizontal overlap
    if (gTop < floorY) floorY = gTop;
  }
  return Math.min(floorY, CAPTION_TOP + 60);
}

// Box for any frame-like fragment (reuses container shapes incl. outline rects
// as obstacles so text never grows into a framed region below it).
function frameBoxOf(f) {
  if (f.type === 'draw_rect') return { x0: f.x, y0: f.y, x1: f.x + (f.width || 0), y1: f.y + (f.height || 0) };
  if (f.type === 'draw_callout') { const [x, y] = f.position || [0, 0]; return { x0: x, y0: y, x1: x + (f.width || 240), y1: y + 60 }; }
  if (f.type === 'draw_object' || f.type === 'draw_physics_shape') { const [x, y] = f.position || [0, 0]; const [w, h] = f.size || [120, 100]; return { x0: x, y0: y, x1: x + w, y1: y + h }; }
  if (f.type === 'draw_circle') { const [cx, cy] = f.center || [0, 0]; const r = f.radius || 0; return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r }; }
  if (f.type === 'draw_badge') { const [x, y] = f.position || [0, 0]; return { x0: x, y0: y, x1: x + 80, y1: y + 24 }; }
  return null;
}

/**
 * Annotate every draw_text fragment with a wrap width + max line count that
 * fits BOTH its container box AND the vertical room until the next element
 * below it, then truncate the content to match — guaranteeing it cannot spill
 * out of its box or onto a neighbour. Mutates a shallow copy and returns it.
 */
export function fitTextToSlots(frags) {
  const boxes = containers(frags);
  return frags.map((f) => {
    if (f.type !== 'draw_text') return f;
    const content = String(f.content || '');
    if (!content) return f;
    const fs = (f.style && f.style.fontSize) || 14;
    const pt = textAnchorPoint(f);
    const box = findContainer(pt, boxes);

    let maxWidth, maxLines;
    if (box) {
      if (box.circle) {
        maxWidth = Math.max(40, box.r * 1.5);
        maxLines = Math.max(1, Math.floor((box.r * 1.4) / (fs * LINE_H)));
      } else {
        // Width available must be measured from the text's ACTUAL start, not the
        // box width — a start-anchored label placed partway into the box has less
        // room to its right (else it runs past the box edge onto a neighbour).
        if (pt.anchor === 'middle') maxWidth = Math.max(40, box.w - PAD * 2);
        else if (pt.anchor === 'end') maxWidth = Math.max(40, pt.x0raw - box.x0 - PAD);
        else maxWidth = Math.max(40, box.x1 - pt.x0raw - PAD);
        const below = box.y1 - pt.y0raw;
        maxLines = Math.max(1, Math.min(4, Math.floor(below / (fs * LINE_H))));
      }
    } else {
      const anchor = pt.anchor;
      if (anchor === 'middle') maxWidth = 560;
      else if (anchor === 'end') maxWidth = Math.max(80, pt.x0raw - 40);
      else maxWidth = Math.max(80, Math.min(CANVAS_W - 24 - pt.x0raw, 680));
      maxLines = 2;
    }

    // Clamp lines to the vertical room until the nearest element BELOW — this is
    // what stops a 2-line title from overrunning the detail line placed under it.
    const span = textXSpan(f, maxWidth);
    const topY = pt.y0raw - fs;
    const floorY = floorBelow(f, span, topY, frags);
    const roomLines = Math.max(1, Math.floor((floorY - topY) / (fs * LINE_H)));
    maxLines = Math.max(1, Math.min(maxLines, roomLines));

    const fitted = fitText(content, maxWidth, fs, maxLines);
    return {
      ...f,
      content: fitted,
      style: { ...(f.style || {}), maxWidth: Math.round(maxWidth), maxLines },
    };
  });
}

// Does any CONTENT fragment sit inside this box? (text/badge/equation/callout,
// a filled inner shape, a figure, or a graph — i.e. something the box frames.)
function hasContentInside(box, frags, self) {
  for (const g of frags) {
    if (g === self) continue;
    let cx, cy, meaningful = false;
    if (g.type === 'draw_text') { const c = String(g.content || '').trim(); if (!c || c === '…') continue; [cx, cy] = g.position || [0, 0]; meaningful = true; }
    else if (g.type === 'draw_badge' || g.type === 'show_equation') { [cx, cy] = g.position || [0, 0]; meaningful = true; }
    else if (g.type === 'draw_callout') { const [x, y] = g.position || [0, 0]; cx = x + (g.width || 240) / 2; cy = y + 20; meaningful = true; }
    else if (g.type === 'draw_object' || g.type === 'draw_physics_shape') { const [x, y] = g.position || [0, 0]; const [w, h] = g.size || [0, 0]; cx = x + w / 2; cy = y + h / 2; meaningful = true; }
    else if (g.type === 'draw_graph' || g.type === 'draw_coordinate_system' || g.type === 'draw_table') { meaningful = true; cx = (box.x0 + box.x1) / 2; cy = (box.y0 + box.y1) / 2; }
    else if (g.type === 'draw_circle') { const fl = g.style && g.style.fill; if (!fl || fl === 'none') continue; const [c0, c1] = g.center || [0, 0]; cx = c0; cy = c1; meaningful = true; }
    if (!meaningful) continue;
    if (cx >= box.x0 - 2 && cx <= box.x1 + 2 && cy >= box.y0 - 6 && cy <= box.y1 + 6) return true;
  }
  return false;
}

/**
 * Remove containers that ended up EMPTY and shapes that are pure decoration —
 * the "boxes with no text" and "svg that flashes and means nothing" the user
 * sees. A filled panel with no content inside (and no own label) is dropped; a
 * small figure with no label/annotations is decorative and dropped. Large
 * labelled figures, header bars, thin accents, and full-board backgrounds stay.
 */
export function pruneEmptyContainers(frags) {
  return frags.filter((f) => {
    if (f.type === 'draw_rect') {
      const fill = f.style && f.style.fill;
      if (!fill || fill === 'none') return true;           // outline frame — keep
      const w = f.width || 0, h = f.height || 0;
      if (h < 16 || w < 60) return true;                   // thin accent / chip — keep
      if (w >= 740 && h >= 430) return true;               // full-board background — keep
      if (f.label && String(f.label).trim()) return true;  // box renders its own label
      const box = { x0: f.x, y0: f.y, x1: f.x + w, y1: f.y + h };
      return hasContentInside(box, frags, f);              // keep only if it frames content
    }
    if (f.type === 'draw_object' || f.type === 'draw_physics_shape') {
      const hasLabel = f.label && String(f.label).trim();
      const hasAnn = Array.isArray(f.annotations) && f.annotations.some((a) => String(a || '').trim());
      const [w, h] = f.size || [0, 0];
      // small, unlabeled figure = decorative accent (corner compass/lightbulb) → drop
      if (!hasLabel && !hasAnn && Math.max(w, h) <= 140) return false;
      return true;
    }
    return true;
  });
}

// Final guard: drop a draw_text that heavily overlaps an earlier-kept draw_text
// (e.g. a template title landing on the header subtitle) so two lines never
// stack on the same spot. Keeps the first; removes the colliding later one.
export function dropCollidingText(frags) {
  const tb = (f) => { const [x, y] = f.position || [0, 0]; const fs = (f.style && f.style.fontSize) || 14; const a = (f.style && f.style.textAnchor) || 'start'; const mw = (f.style && f.style.maxWidth) || Math.min(String(f.content || '').length * fs * 0.55, 560); const x0 = a === 'middle' ? x - mw / 2 : a === 'end' ? x - mw : x; return { x0, y0: y - fs, x1: x0 + mw, y1: y + fs * 0.4 }; };
  const ovr = (A, B) => { const ix = Math.max(0, Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0)); const iy = Math.max(0, Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0)); const i = ix * iy; const sm = Math.min((A.x1 - A.x0) * (A.y1 - A.y0), (B.x1 - B.x0) * (B.y1 - B.y0)) || 1; return i / sm; };
  const kept = [];
  return frags.filter((f) => {
    if (f.type !== 'draw_text' || !String(f.content || '').trim()) return true;
    const b = tb(f);
    for (const k of kept) if (ovr(b, k) > 0.5) return false;
    kept.push(b);
    return true;
  });
}

export { CAPTION_TOP };
