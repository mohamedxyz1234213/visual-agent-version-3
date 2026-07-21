// Inspect the real lesson: dump overlapping fragments' geometry+content, and
// list per-board the dominant fill colors (to infer which template rendered).
import { readFileSync } from 'node:fs';
const lesson = JSON.parse(readFileSync(process.env.LESSON || '/tmp/lesson_full.json', 'utf8'));

function wbox(content, x, y, fs, anchor, mw) {
  const maxWidth = mw ?? (anchor === 'middle' ? 560 : anchor === 'end' ? x : 720 - x);
  const cpl = Math.max(8, Math.floor(maxWidth / (fs * 0.55)));
  const words = String(content || '').split(/\s+/).filter(Boolean);
  let lines = 1, cur = 0; for (const w of words) { const a = (cur ? 1 : 0) + w.length; if (cur + a > cpl && cur) { lines++; cur = w.length; } else cur += a; }
  const w = lines === 1 ? Math.min(maxWidth, String(content || '').length * fs * 0.55) : maxWidth * 0.92;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return { x0, y0: y - fs, x1: x0 + w, y1: y - fs + lines * fs * 1.35, kind: 'text', lines };
}
function bbox(f) {
  const p = f.payload || {}; const t = f.action_type; const fl = p.style && p.style.fill;
  if (t === 'draw_rect') { if (!fl || fl === 'none') return null; return { x0: p.x, y0: p.y, x1: p.x + (p.width || 0), y1: p.y + (p.height || 0), kind: 'box' }; }
  if (t === 'draw_circle') { if (!fl || fl === 'none') return null; const [cx, cy] = p.center || [0, 0]; const r = p.radius || 0; if (r < 12) return null; return { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r, kind: 'box' }; }
  if (t === 'draw_text') { const [x, y] = p.position || [0, 0]; const fs = (p.style && p.style.fontSize) || 14; const a = (p.style && p.style.textAnchor) || 'start'; return { ...wbox(p.content, x, y, fs, a, p.style && p.style.maxWidth), content: p.content }; }
  if (t === 'draw_badge' || t === 'show_equation') { const [x, y] = p.position || [0, 0]; const fs = (p.style && p.style.fontSize) || 14; const w = Math.min(String(p.content || p.latex || '').length * fs * 0.6 + 20, 760); const a = (p.style && p.style.textAnchor) || (t === 'draw_badge' ? 'start' : 'middle'); const x0 = a === 'middle' ? x - w / 2 : a === 'end' ? x - w : x; return { x0, y0: y - fs, x1: x0 + w, y1: y + fs * 0.5, kind: t === 'draw_badge' ? 'badge' : 'text', content: p.content }; }
  if (t === 'draw_callout') { const [x, y] = p.position || [0, 0]; return { x0: x, y0: y, x1: x + (p.width || 240), y1: y + 60, kind: 'box' }; }
  if (t === 'draw_object') { const [x, y] = p.position || [0, 0]; const [w, h] = p.size || [120, 100]; return { x0: x, y0: y, x1: x + w, y1: y + h, kind: 'object' }; }
  return null;
}
const area = (b) => Math.max(0, b.x1 - b.x0) * Math.max(0, b.y1 - b.y0);
const inter = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
function isLabelOf(t, c) { const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2; if (!(cx >= c.x0 - 2 && cx <= c.x1 + 2 && cy >= c.y0 - 2 && cy <= c.y1 + 6)) return false; const lh = (t.y1 - t.y0) / Math.max(1, t.lines || 1); return t.x1 <= c.x1 + 16 && t.x0 >= c.x0 - 16 && t.y1 <= c.y1 + lh * 0.6; }

let bi = 0;
const DUMP = Number(process.env.DUMP || 0);
for (const part of lesson.parts || []) {
  if (part.part_type !== 'content') continue;
  const groups = []; let g = [];
  for (const s of part.scenes || []) { if (s.action_type === 'clear') { groups.push(g); g = []; continue; } if (['camera', 'draw_caption'].includes(s.action_type)) continue; g.push(s); }
  groups.push(g);
  for (const frags of groups) {
    bi++;
    if (DUMP && bi === DUMP) {
      console.log(`--- board ${bi} all texts (y<170) ---`);
      frags.forEach((f, i) => { if (f.action_type === 'draw_text') { const [x, y] = f.payload.position || [0, 0]; if (y < 170) console.log(`  [${i}] y=${y} x=${x} anchor=${f.payload.style?.textAnchor} "${String(f.payload.content || '').slice(0, 36)}"`); } });
    }
    const boxes = frags.map((f, i) => { const b = bbox(f); return b ? { ...b, i, f } : null; }).filter(Boolean);
    for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
      const A = boxes[a], B = boxes[b]; const ia = inter(A, B); if (ia <= 0) continue;
      const r = ia / (Math.min(area(A), area(B)) || 1), lg = Math.max(area(A), area(B)) / (Math.min(area(A), area(B)) || 1);
      if (A.kind === 'badge' || B.kind === 'badge') { const o = A.kind === 'badge' ? B : A; if (!(o.kind === 'text' && r > 0.45)) continue; }
      else if ((A.kind === 'text') !== (B.kind === 'text')) { const tx = A.kind === 'text' ? A : B, c = A.kind === 'text' ? B : A; if (c.kind === 'box' || c.kind === 'object') { if (isLabelOf(tx, c) || r <= 0.18) continue; } }
      else if (A.kind === 'text' && B.kind === 'text') { if (r <= 0.15) continue; }
      else { if ((r > 0.8 && lg > 1.6) || r <= 0.35) continue; }
      console.log(`board ${bi} OVERLAP ${A.kind}/${B.kind} r=${r.toFixed(2)}`);
      console.log(`   [${A.i}] ${A.f.action_type} (${Math.round(A.x0)},${Math.round(A.y0)})-(${Math.round(A.x1)},${Math.round(A.y1)}) fill=${A.f.payload?.style?.fill||''} "${String(A.content||A.f.payload?.label||'').slice(0,28)}"`);
      console.log(`   [${B.i}] ${B.f.action_type} (${Math.round(B.x0)},${Math.round(B.y0)})-(${Math.round(B.x1)},${Math.round(B.y1)}) fill=${B.f.payload?.style?.fill||''} "${String(B.content||B.f.payload?.label||'').slice(0,28)}"`);
    }
  }
}
