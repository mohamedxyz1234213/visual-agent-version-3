// Verify a REAL generated lesson (fetched from the running API and saved to
// /tmp/lesson_full.json) against HONEST quality gates — the same ones the user
// actually sees: text-inclusive overlap, continuity (no frozen gaps incl. the
// tail to duration_seconds), captions present, density. An earlier version
// EXCLUDED text from overlap and ignored the frozen tail, so it passed while the
// real board was a mess; this one does not.
import { readFileSync } from 'node:fs';

const path = process.env.LESSON || '/tmp/lesson_full.json';
const lesson = JSON.parse(readFileSync(path, 'utf8'));

// ── wrapped-text-aware bounding boxes (mirror the renderer) ──────────────────
function wrappedTextBox(content, x, y, fs, anchor, maxWidthHint) {
  const text = String(content || '');
  const maxWidth = maxWidthHint ?? (anchor === 'middle' ? 560 : anchor === 'end' ? x : 720 - x);
  const charsPerLine = Math.max(8, Math.floor(maxWidth / (fs * 0.55)));
  const words = text.split(/\s+/).filter(Boolean);
  let lines = 1, cur = 0;
  for (const w of words) { const add = (cur ? 1 : 0) + w.length; if (cur + add > charsPerLine && cur) { lines++; cur = w.length; } else cur += add; }
  const w = lines === 1 ? Math.min(maxWidth, text.length * fs * 0.55) : maxWidth * 0.92;
  const h = lines * fs * 1.35;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { x0, y0: y - fs, x1: x0 + w, y1: y - fs + h, kind: 'text', lines };
}
function bbox(f) {
  const p = f.payload || {}; const t = f.action_type; const fill = p.style && p.style.fill;
  if (t === 'draw_rect' || t === 'draw_highlight') { if (t === 'draw_rect' && (!fill || fill === 'none')) return null; return { x0: p.x, y0: p.y, x1: p.x + (p.width || 0), y1: p.y + (p.height || 0), kind: 'box' }; }
  if (t === 'draw_circle') { if (!fill || fill === 'none') return null; const [cx, cy] = p.center || [0, 0]; const r = p.radius || 0; if (r < 24) return null; return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, kind: 'box', isCircle: true }; }
  if (t === 'draw_text') { const [x, y] = p.position || [0, 0]; const fs = (p.style && p.style.fontSize) || 14; const a = (p.style && p.style.textAnchor) || 'start'; return wrappedTextBox(p.content, x, y, fs, a, p.style && p.style.maxWidth); }
  if (t === 'show_equation' || t === 'draw_badge') { const [x, y] = p.position || [0, 0]; const fs = (p.style && p.style.fontSize) || 14; const len = String(p.content || p.latex || '').length; const w = Math.min(len * fs * 0.6 + 20, 760); const a = (p.style && p.style.textAnchor) || (t === 'draw_badge' ? 'start' : 'middle'); const x0 = a === 'middle' ? x - w / 2 : a === 'end' ? x - w : x; return { x0, y0: y - fs, x1: x0 + w, y1: y + fs * 0.5, kind: t === 'draw_badge' ? 'badge' : 'text' }; }
  if (t === 'draw_callout') { const [x, y] = p.position || [0, 0]; return { x0: x, y0: y, x1: x + (p.width || 240), y1: y + 60, kind: 'box' }; }
  if (t === 'draw_object' || t === 'draw_physics_shape') { const [x, y] = p.position || [0, 0]; const [w, h] = p.size || [120, 100]; return { x0: x, y0: y, x1: x + w, y1: y + h, kind: 'object' }; }
  return null;
}
const area = (b) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
const inter = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
function isLabelOf(txt, c) { const cx = (txt.x0 + txt.x1) / 2, cy = (txt.y0 + txt.y1) / 2; const inC = cx >= c.x0 - 2 && cx <= c.x1 + 2 && cy >= c.y0 - 2 && cy <= c.y1 + 6; if (!inC) return false; const lh = (txt.y1 - txt.y0) / Math.max(1, txt.lines || 1); return txt.x1 <= c.x1 + 16 && txt.x0 >= c.x0 - 16 && txt.y1 <= c.y1 + lh * 0.6; }
function overlaps(frags) {
  const boxes = frags.map((f, i) => { const b = bbox(f); return b ? { ...b, i } : null; }).filter(Boolean);
  let bad = 0; const ex = [];
  for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
    const A = boxes[a], B = boxes[b]; const ia = inter(A, B); if (ia <= 0) continue;
    const r = ia / (Math.min(area(A), area(B)) || 1); const lg = Math.max(area(A), area(B)) / (Math.min(area(A), area(B)) || 1);
    if (A.kind === 'badge' || B.kind === 'badge') { const o = A.kind === 'badge' ? B : A; if (o.kind === 'text' && r > 0.45) { bad++; ex.push('badge-text'); } continue; }
    if ((A.kind === 'text') !== (B.kind === 'text')) { const tx = A.kind === 'text' ? A : B; const c = A.kind === 'text' ? B : A; if (c.kind === 'box' || c.kind === 'object') { if (isLabelOf(tx, c)) continue; if (r > 0.18) { bad++; ex.push('text-spill'); } continue; } }
    if (A.kind === 'text' && B.kind === 'text') { if (r > 0.15) { bad++; ex.push('text-text'); } continue; }
    if (r > 0.8 && lg > 1.6) continue;
    // Venn / lens: two filled circles overlapping is intentional teaching
    if (A.isCircle && B.isCircle) continue;
    if (r > 0.35) { bad++; ex.push('box-box'); }
  }
  return { bad, ex };
}

let totalScenes = 0, emptyBoards = 0, overlapBoards = 0, overlapPairs = 0, boards = 0, contentParts = 0, captionParts = 0, worstGap = 0;
const gapDetails = [];
for (const part of lesson.parts || []) {
  if (part.part_type === 'quiz' || part.part_type === 'final_quiz') continue;
  contentParts++;
  const all = part.scenes || [];
  totalScenes += all.filter((s) => !['camera', 'clear', 'draw_caption'].includes(s.action_type)).length;
  if (all.some((s) => s.action_type === 'draw_caption')) captionParts++;
  // group by clear for overlap
  const groups = []; let g = [];
  for (const s of all) { if (s.action_type === 'clear') { groups.push(g); g = []; continue; } if (['camera', 'draw_caption'].includes(s.action_type)) continue; g.push(s); }
  groups.push(g);
  for (const frags of groups) {
    boards++;
    const meaningful = frags.filter((f) => f.action_type !== 'draw_line').length;
    const hasShape = frags.some((f) => /rect|circle|object|badge|callout|graph|table|equation|coordinate|physics/.test(f.action_type));
    if (!hasShape && meaningful <= 3) emptyBoards++;
    const { bad } = overlaps(frags);
    if (bad > 0) { overlapBoards++; overlapPairs += bad; }
  }
  // CONTINUITY: a board must keep DRAWING (no frozen mid-board gap), plus no
  // dead lead-in and no frozen tail to duration_seconds. Board TRANSITIONS (the
  // wipe + camera + brief read-hold between beats) are intentional and excluded
  // — we measure gaps WITHIN each board group, then the global lead-in & tail.
  const dur = Number(part.duration_seconds) || 0;
  const allDraws = all.filter((s) => !['camera', 'clear', 'draw_caption'].includes(s.action_type)).map((s) => s.time_offset).sort((a, b) => a - b);
  let partGap = allDraws.length ? allDraws[0] : 0; // lead-in (first draw should be early)
  for (const grp of groups) {
    const t = grp.filter((s) => s.action_type !== 'draw_line' || true).map((s) => s.time_offset).sort((a, b) => a - b);
    for (let i = 1; i < t.length; i++) partGap = Math.max(partGap, t[i] - t[i - 1]); // within-board only
  }
  const tail = dur - (allDraws[allDraws.length - 1] ?? 0);
  partGap = Math.max(partGap, tail);
  if (partGap > worstGap) worstGap = partGap;
  gapDetails.push(`${part.title?.slice(0, 22) || 'part'}: dur=${dur}s lastDraw=${(allDraws[allDraws.length - 1] ?? 0).toFixed(0)}s tail=${tail.toFixed(0)}s`);
}

console.log(`Lesson: ${lesson.title}`);
console.log(`status: ${lesson.status}   content parts: ${contentParts}`);
console.log(`total drawable scenes ... ${totalScenes}   ${totalScenes >= 100 ? '✅' : '❌ (want ≥100)'}`);
console.log(`boards .................. ${boards}`);
console.log(`empty boards ............ ${emptyBoards}   ${emptyBoards ? '❌' : '✅'}`);
console.log(`boards w/ text overlap .. ${overlapBoards} (${overlapPairs} pairs)  ${overlapBoards ? '❌' : '✅'}`);
console.log(`captions present ........ ${captionParts}/${contentParts} parts   ${captionParts === contentParts ? '✅' : '❌'}`);
console.log(`worst draw gap (incl tail) ${worstGap.toFixed(1)}s   ${worstGap > 4 ? '❌ (frozen dead air)' : '✅'}`);
gapDetails.forEach((d) => console.log(`   · ${d}`));
const pass = emptyBoards === 0 && overlapBoards === 0 && totalScenes >= 100 && captionParts === contentParts && worstGap <= 4;
console.log(`\n${pass ? '✅ REAL LESSON: PASS' : '❌ REAL LESSON: FAIL'}\n`);
process.exit(pass ? 0 : 1);
