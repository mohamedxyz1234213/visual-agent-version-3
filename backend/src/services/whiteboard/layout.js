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
        // Cap kept generous (not 4): after growBoxesToFitText has stretched the
        // box and reflowed the column, the real bound is the box height and the
        // floorBelow/roomLines clamp below — so a grown box can show its full
        // multi-line text instead of being re-truncated here.
        maxLines = Math.max(1, Math.min(9, Math.floor(below / (fs * LINE_H))));
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

// -----------------------------------------------------------------------------
// GROW-THE-BOX-TO-FIT — the preferred fix for over-long text.
// -----------------------------------------------------------------------------
// The template layer (`fitText` in templateLibrary.js) shrinks the font and, as a
// last resort, clamps the string with a "…". When it had to clamp, it stashes the
// FULL text on the fragment as `_fullText`. This pass tries to AVOID the "…" by
// growing the container box taller to fit the whole sentence and pushing the
// column of fragments below it down by the same amount — so the student reads the
// complete text instead of a truncated one. It only falls back to truncation when
// the content band has no room left to grow into.
// -----------------------------------------------------------------------------

// Line count for `text` wrapped to `maxWidth` at `fontSize` (matches renderer).
function wrapLines(text, maxWidth, fontSize) {
  const charsPerLine = Math.max(6, Math.floor(maxWidth / (fontSize * CHAR_W)));
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let lines = 1, cur = 0;
  for (const w of words) {
    const add = (cur ? 1 : 0) + w.length;
    if (cur + add > charsPerLine && cur) { lines++; cur = w.length; } else cur += add;
  }
  return lines;
}

// Axis-aligned box of any growable container fragment, or null.
function boxOfFrag(f) {
  if (f.type === 'draw_rect') return { x0: f.x, y0: f.y, x1: f.x + (f.width || 0), y1: f.y + (f.height || 0) };
  if (f.type === 'draw_circle') { const [cx, cy] = f.center || [0, 0]; const r = f.radius || 0; return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, circle: true, r }; }
  if (f.type === 'draw_object' || f.type === 'draw_physics_shape') { const [x, y] = f.position || [0, 0]; const [w, h] = f.size || [120, 100]; return { x0: x, y0: y, x1: x + w, y1: y + h }; }
  return null;
}

// Smallest filled, non-background box frag containing `pt` (excluding `self`).
function findContainerFrag(pt, frags, self) {
  let best = null, bestArea = Infinity;
  for (const g of frags) {
    if (g === self) continue;
    if (g.type === 'draw_rect') { const fill = g.style && g.style.fill; if (!fill || fill === 'none') continue; }
    else if (g.type === 'draw_circle') { const fill = g.style && g.style.fill; if (!fill || fill === 'none') continue; }
    else if (g.type !== 'draw_object' && g.type !== 'draw_physics_shape') continue;
    const b = boxOfFrag(g); if (!b) continue;
    const w = b.x1 - b.x0, h = b.y1 - b.y0;
    if (w >= 760 || h >= 440) continue;   // background, not a slot
    if (pt.x >= b.x0 - 2 && pt.x <= b.x1 + 2 && pt.y >= b.y0 - 2 && pt.y <= b.y1 + 6) {
      const area = w * h;
      if (area < bestArea) { best = g; bestArea = area; }
    }
  }
  return best;
}

// x-span of any fragment (for column-overlap detection during reflow).
function xSpanOf(f) {
  if (f.type === 'draw_text') { const mw = (f.style && f.style.maxWidth) || 120; return textXSpan(f, mw); }
  const b = boxOfFrag(f) || frameBoxOf(f);
  if (b) return [b.x0, b.x1];
  return null;
}

// Top-y of any fragment (for "is it below the grown box" tests).
function topYOf(f) {
  if (f.type === 'draw_text') { const fs = (f.style && f.style.fontSize) || 14; return (f.position?.[1] ?? 0) - fs; }
  const b = boxOfFrag(f) || frameBoxOf(f);
  return b ? b.y0 : null;
}

// Shift a fragment DOWN by dy in place (mutates). Covers the fragment kinds that
// appear stacked in a column; connectors (lines/paths) are left as-is — they are
// not counted by the overlap gate and only slightly mis-aim at worst.
function shiftDown(f, dy) {
  switch (f.type) {
    case 'draw_rect': f.y = (f.y || 0) + dy; break;
    case 'draw_circle': if (f.center) f.center = [f.center[0], f.center[1] + dy]; break;
    case 'draw_text': case 'draw_badge': case 'show_equation': case 'draw_callout':
    case 'draw_object': case 'draw_physics_shape':
      if (f.position) f.position = [f.position[0], f.position[1] + dy]; break;
    default: break; // lines/paths/etc — leave
  }
}

export function growBoxesToFitText(frags) {
  // Clone so callers' arrays aren't mutated; style cloned too (we resize boxes).
  const out = frags.map((f) => ({ ...f, style: f.style ? { ...f.style } : f.style }));
  const maxBottom = Math.min(CAPTION_TOP - 4, CANVAS_H - 8);

  // 1. Restore any text the template pre-clamped with "…" so we measure (and,
  //    after growing, can show) the FULL sentence.
  for (const f of out) {
    if (f.type === 'draw_text' && f._fullText) { f.content = f._fullText; }
  }

  // 2. For every text bound to a container box, compute the height it really
  //    needs (full wrapped content). requiredH per box = max over its texts.
  const required = new Map(); // boxFrag -> needed height (px)
  for (const f of out) {
    if (f.type !== 'draw_text' || !String(f.content || '').trim()) continue;
    const pt = textAnchorPoint(f);
    const boxFrag = findContainerFrag(pt, out, f);
    if (!boxFrag) continue;
    const box = boxOfFrag(boxFrag);
    const fs = (f.style && f.style.fontSize) || 14;
    // Width available inside the box (mirror fitTextToSlots' middle-anchor case).
    const w = box.x1 - box.x0;
    const maxWidth = (f.style && f.style.maxWidth) || Math.max(40, w - PAD * 2);
    // text top relative to box top + full wrapped block height + bottom pad.
    const top = (pt.y0raw - fs) - box.y0;
    const need = Math.max(0, top) + wrapLines(f.content, maxWidth, fs) * fs * LINE_H + PAD;
    const prev = required.get(boxFrag) || 0;
    if (need > prev) required.set(boxFrag, need);
  }

  // 3. Group boxes into rows (similar top-y) so a row stays uniform, then grow
  //    each needy row and reflow everything below it. Process rows top→bottom so
  //    earlier growth pushes later rows down before they grow.
  const boxFrags = out.filter((f) => required.has(f));
  const rows = [];
  for (const bf of boxFrags) {
    const b = boxOfFrag(bf);
    let row = rows.find((r) => Math.abs(r.y0 - b.y0) < 10 && Math.abs((r.h) - (b.y1 - b.y0)) < 24);
    if (!row) { row = { y0: b.y0, h: b.y1 - b.y0, members: [] }; rows.push(row); }
    row.members.push(bf);
  }
  rows.sort((a, b) => a.y0 - b.y0);

  for (const row of rows) {
    // Target height = the largest requirement across the row's boxes.
    let target = row.h;
    for (const bf of row.members) target = Math.max(target, required.get(bf) || 0);
    let delta = target - row.h;
    if (delta <= 1) continue;

    // Room beneath the row: lowest point of any fragment below it (x-overlapping
    // a row member) bounded by the content band.
    const memberBoxes = row.members.map(boxOfFrag);
    const rowBottom = Math.max(...memberBoxes.map((b) => b.y1));
    const xOverlapsRow = (span) => memberBoxes.some((b) => !(span[1] <= b.x0 + 4 || span[0] >= b.x1 - 4));
    let colBottom = rowBottom;
    const below = [];
    for (const g of out) {
      if (row.members.includes(g)) continue;
      const gTop = topYOf(g); if (gTop == null || gTop < rowBottom - 4) continue;
      const span = xSpanOf(g); if (!span || !xOverlapsRow(span)) continue;
      below.push(g);
      const gb = boxOfFrag(g) || frameBoxOf(g);
      const gBot = gb ? gb.y1 : gTop + ((g.style && g.style.fontSize) || 14) * LINE_H;
      if (gBot > colBottom) colBottom = gBot;
    }
    const grow = Math.min(delta, Math.max(0, maxBottom - colBottom));
    if (grow <= 0.5) continue;

    // Grow every box in the row by the same amount (keeps the row uniform) and
    // push the below-column down so nothing collides.
    for (const bf of row.members) {
      if (bf.type === 'draw_rect') bf.height = (bf.height || 0) + grow;
      else if (bf.type === 'draw_object' || bf.type === 'draw_physics_shape') bf.size = [bf.size?.[0] ?? 120, (bf.size?.[1] ?? 100) + grow];
      else if (bf.type === 'draw_circle') { bf.radius = (bf.radius || 0) + grow / 2; bf.center = [bf.center?.[0] ?? 0, (bf.center?.[1] ?? 0) + grow / 2]; }
    }
    for (const g of below) shiftDown(g, grow);
  }

  // Drop the stash markers; fitTextToSlots now fits text into the grown boxes
  // (and only truncates a slot whose box still can't hold the full text).
  for (const f of out) if (f._fullText) delete f._fullText;
  return out;
}

// -----------------------------------------------------------------------------
// AI "pick + patch" template edits — REMOVE named parts and ADD modular blocks
// into measured free space. Runs BEFORE the fit/overlap passes so any edit is
// re-checked and can never reintroduce a collision. If no free space exists for
// an add-block, it is dropped rather than overlapped.
// -----------------------------------------------------------------------------

const CB = { top: 112, bot: 466, left: 44, right: 756 };

// A conservative bbox for any fragment, used for free-space detection. Returns
// null for fragments we don't treat as occupying space (loose paths).
function anyFragBBox(f) {
  if (!f || !f.type) return null;
  switch (f.type) {
    case 'draw_text': {
      const [x, y] = f.position || [0, 0];
      const fs = (f.style && f.style.fontSize) || 14;
      const mw = (f.style && f.style.maxWidth) || Math.min(320, String(f.content || '').length * fs * CHAR_W + 8);
      const [x0, x1] = textXSpan(f, mw);
      const lines = (f.style && f.style.maxLines) || 1;
      return { x0, y0: y - fs, x1, y1: y + fs * LINE_H * Math.max(1, lines) };
    }
    case 'draw_rect': return { x0: f.x, y0: f.y, x1: f.x + (f.width || 0), y1: f.y + (f.height || 0) };
    case 'draw_circle': { const [cx, cy] = f.center || [0, 0]; const r = f.radius || 0; return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r }; }
    case 'draw_object':
    case 'draw_physics_shape': { const [x, y] = f.position || [0, 0]; const [w, h] = f.size || [120, 100]; return { x0: x, y0: y, x1: x + w, y1: y + h }; }
    case 'draw_badge': { const [x, y] = f.position || [0, 0]; return { x0: x, y0: y, x1: x + 92, y1: y + 26 }; }
    case 'draw_callout': { const [x, y] = f.position || [0, 0]; return { x0: x, y0: y, x1: x + (f.width || 220), y1: y + 60 }; }
    case 'draw_arrow':
    case 'draw_line': { const a = f.from, b = f.to; if (!a || !b) return null; return { x0: Math.min(a[0], b[0]) - 4, y0: Math.min(a[1], b[1]) - 4, x1: Math.max(a[0], b[0]) + 4, y1: Math.max(a[1], b[1]) + 4 }; }
    default: return null;
  }
}

function rectsOverlap(a, b, m = 0) {
  return !(a.x1 + m <= b.x0 || a.x0 - m >= b.x1 || a.y1 + m <= b.y0 || a.y0 - m >= b.y1);
}

// Default footprint (w,h) for each add-block kind.
const BLOCK_SIZE = {
  callout: [212, 56], note: [196, 84], badge: [96, 26], label: [134, 26],
  highlight: [196, 72], arrow: [92, 40], figure: [120, 104], svg: [128, 112],
};

// Scale a sanitized unit-box path (coords 0..100, validated upstream) into the
// target rect (x,y,w,h). Only numbers are transformed; command letters pass
// through. Coordinate pairs after each command map x→x-axis, y→y-axis; H/V take
// a single axis. This keeps the AI's custom shape inside its allotted region.
function scaleUnitPath(d, x, y, w, h) {
  const tokens = String(d).match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!tokens) return '';
  const sx = (v) => (x + (v / 100) * w).toFixed(1);
  const sy = (v) => (y + (v / 100) * h).toFixed(1);
  const out = [];
  let cmd = 'M';
  let coordIdx = 0; // position within the current command's coordinate run
  for (const tk of tokens) {
    if (/[A-Za-z]/.test(tk)) { cmd = tk; coordIdx = 0; out.push(tk); continue; }
    const up = cmd.toUpperCase();
    let mapped;
    if (up === 'H') mapped = sx(Number(tk));
    else if (up === 'V') mapped = sy(Number(tk));
    else if (up === 'A') {
      // rx ry rot large sweep x y — only the final x,y (idx 5,6) are points.
      const i = coordIdx % 7;
      if (i === 5) mapped = sx(Number(tk));
      else if (i === 6) mapped = sy(Number(tk));
      else mapped = tk; // radii/flags pass through
    } else {
      mapped = (coordIdx % 2 === 0) ? sx(Number(tk)) : sy(Number(tk));
    }
    out.push(mapped);
    coordIdx++;
  }
  return out.join(' ');
}

// Region hint → preferred target centre within the content band.
function regionTarget(region) {
  const midX = (CB.left + CB.right) / 2;
  const top = CB.top + 30, bot = CAPTION_TOP - 40, midY = (CB.top + CAPTION_TOP) / 2;
  switch (region) {
    case 'top': return [midX, top];
    case 'bottom': return [midX, bot];
    case 'left': return [CB.left + 90, midY];
    case 'right': return [CB.right - 90, midY];
    case 'center': return [midX, midY];
    case 'topleft': return [CB.left + 90, top];
    case 'topright': return [CB.right - 90, top];
    case 'bottomleft': return [CB.left + 90, bot];
    case 'bottomright': return [CB.right - 90, bot];
    default: return [midX, midY];
  }
}

// Find a free top-left position for a (w,h) block that overlaps nothing in
// `occupied`, biased toward the requested region. Returns {x,y} or null.
function findFreeSlot(w, h, occupied, region) {
  const [tx, ty] = regionTarget(region);
  const step = 16, margin = 10;
  const minX = CB.left, maxX = CB.right - w;
  const minY = CB.top, maxY = CAPTION_TOP - 6 - h;
  if (maxX < minX || maxY < minY) return null;
  const candidates = [];
  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      candidates.push([x, y]);
    }
  }
  // Prefer slots whose centre is nearest the region target.
  candidates.sort((a, b) => {
    const da = (a[0] + w / 2 - tx) ** 2 + (a[1] + h / 2 - ty) ** 2;
    const db = (b[0] + w / 2 - tx) ** 2 + (b[1] + h / 2 - ty) ** 2;
    return da - db;
  });
  for (const [x, y] of candidates) {
    const r = { x0: x, y0: y, x1: x + w, y1: y + h };
    let clash = false;
    for (const o of occupied) { if (rectsOverlap(r, o, margin)) { clash = true; break; } }
    if (!clash) return { x, y };
  }
  return null;
}

// Build the drawn fragments for one add-block placed at (x,y,w,h).
function buildAddBlock(block, x, y, w, h) {
  const out = [];
  const text = block.text || '';
  switch (block.kind) {
    case 'callout':
      out.push({ type: 'draw_callout', content: text, position: [x, y], width: w, style: { bg: '#fffbeb', stroke: '#f59e0b', color: '#92400e' } });
      break;
    case 'note':
      out.push({ type: 'draw_rect', x, y, width: w, height: h, style: { fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1.5, rx: 10 } });
      if (text) out.push({ type: 'draw_text', content: text, position: [x + 12, y + 22], style: { fontSize: 13, color: '#334155', fontWeight: '500', textAnchor: 'start', maxWidth: w - 24, maxLines: Math.max(1, Math.floor((h - 16) / 18)) } });
      break;
    case 'highlight':
      out.push({ type: 'draw_rect', x, y, width: w, height: h, style: { fill: '#fef9c3', stroke: '#facc15', strokeWidth: 1.5, rx: 10 } });
      if (text) out.push({ type: 'draw_text', content: text, position: [x + 12, y + 22], style: { fontSize: 13, color: '#854d0e', fontWeight: '600', textAnchor: 'start', maxWidth: w - 24, maxLines: Math.max(1, Math.floor((h - 16) / 18)) } });
      break;
    case 'badge':
      out.push({ type: 'draw_badge', content: text || '•', position: [x, y], style: { bg: '#1e293b', color: '#ffffff', fontSize: 12 } });
      break;
    case 'label':
      if (text) out.push({ type: 'draw_text', content: text, position: [x, y + 14], style: { fontSize: 13, color: '#475569', fontWeight: '600', textAnchor: 'start', maxWidth: w, maxLines: 2 } });
      break;
    case 'arrow': {
      const dir = block.dir || 'right';
      const cx = x + w / 2, cy = y + h / 2;
      let from, to;
      if (dir === 'left') { from = [x + w, cy]; to = [x, cy]; }
      else if (dir === 'up') { from = [cx, y + h]; to = [cx, y]; }
      else if (dir === 'down') { from = [cx, y]; to = [cx, y + h]; }
      else { from = [x, cy]; to = [x + w, cy]; }
      out.push({ type: 'draw_arrow', from, to, style: { color: '#475569', strokeWidth: 2 } });
      break;
    }
    case 'figure':
      out.push({ type: 'draw_object', object_type: block.figure || 'box', position: [x, y], size: [w, h], label: text || undefined });
      break;
    case 'svg':
      if (block.path) {
        out.push({ type: 'draw_path', d: scaleUnitPath(block.path, x + 4, y + 4, w - 8, h - 8), style: { stroke: '#475569', strokeWidth: 2, fill: 'none' } });
        if (text) out.push({ type: 'draw_text', content: text, position: [x + w / 2, y + h + 4], style: { fontSize: 12, color: '#475569', fontWeight: '600', textAnchor: 'middle', maxWidth: w, maxLines: 1 } });
      }
      break;
  }
  return out;
}

// Match a fragment against a REMOVE category. Prefers an explicit `_role` tag
// (set by templates via tagRole) for precise deletion; falls back to a
// conservative structural heuristic for untagged fragments. Never deletes the
// primary headline text.
function matchesRemoveCategory(f, cat) {
  if (f._role && f._role === cat) return true;
  switch (cat) {
    case 'background':
      return f.type === 'draw_rect' && ((f.width || 0) >= 700 || (f.height || 0) >= 420);
    case 'decoration':
      if (f.type === 'draw_line') return true;
      if (f.type === 'draw_path' && !f.markerEnd) return true;
      if (f.type === 'draw_circle' && !f.label && (f.radius || 0) <= 6) return true;
      return false;
    case 'connectors':
      if (f.type === 'draw_arrow') return true;
      if (f.type === 'draw_path' && f.markerEnd) return true;
      return false;
    case 'labels':
      return f.type === 'draw_badge';
    case 'subtitle':
      return f.type === 'draw_text' && f.style && f.style.fontStyle === 'italic';
    default:
      return false;
  }
}

export function applyTemplateEdits(frags, edits) {
  if (!Array.isArray(frags) || !edits || (!edits.add && !edits.remove)) return frags;
  let out = frags.slice();

  // REMOVE first so freed space counts toward ADD placement.
  if (Array.isArray(edits.remove) && edits.remove.length) {
    const cats = edits.remove;
    out = out.filter((f) => !cats.some((c) => matchesRemoveCategory(f, c)));
  }

  // ADD into measured free space.
  if (Array.isArray(edits.add) && edits.add.length) {
    const occupied = out.map(anyFragBBox).filter(Boolean);
    for (const block of edits.add.slice(0, 4)) {
      const [w, h] = BLOCK_SIZE[block.kind] || [180, 56];
      const slot = findFreeSlot(w, h, occupied, block.region);
      if (!slot) continue; // no room — drop rather than overlap
      const built = buildAddBlock(block, slot.x, slot.y, w, h);
      if (!built.length) continue;
      out.push(...built);
      occupied.push({ x0: slot.x, y0: slot.y, x1: slot.x + w, y1: slot.y + h });
    }
  }

  return out;
}

export { CAPTION_TOP };
