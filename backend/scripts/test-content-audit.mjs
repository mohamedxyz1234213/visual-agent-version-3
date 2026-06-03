// Audit a REAL lesson for the defects the user actually sees but the pass/fail
// gate missed: (1) filled boxes that contain NO text (empty cards), (2) text
// fragments truncated to empty/"…", (3) figures/shapes with a short on-screen
// lifetime (flash-then-gone). Read-only on /tmp/lesson_full.json.
import { readFileSync } from 'node:fs';
const lesson = JSON.parse(readFileSync(process.env.LESSON || '/tmp/lesson_full.json', 'utf8'));

const inside = (px, py, b) => px >= b.x0 - 4 && px <= b.x1 + 4 && py >= b.y0 - 4 && py <= b.y1 + 10;

let emptyBoxes = 0, emptyTexts = 0, shortFigs = 0, boardN = 0;
const samples = { emptyBox: [], emptyText: [], shortFig: [] };

for (const part of lesson.parts || []) {
  if (part.part_type !== 'content') continue;
  const all = part.scenes || [];
  const clears = all.filter((s) => s.action_type === 'clear').map((s) => s.time_offset);
  const partEnd = Math.max(Number(part.duration_seconds) || 0, ...all.map((s) => s.time_offset || 0));
  // group by clear
  const groups = []; let g = [];
  for (const s of all) { if (s.action_type === 'clear') { groups.push(g); g = []; continue; } if (s.action_type === 'camera') continue; g.push(s); }
  groups.push(g);

  for (const frags of groups) {
    boardN++;
    const texts = frags.filter((f) => f.action_type === 'draw_text');
    // (1) filled rects / objects with no text anchored inside, and no own label
    for (const f of frags) {
      const p = f.payload || {};
      let box = null, label = '';
      if (f.action_type === 'draw_rect') { const fl = p.style && p.style.fill; if (!fl || fl === 'none') continue; box = { x0: p.x, y0: p.y, x1: p.x + (p.width || 0), y1: p.y + (p.height || 0) }; label = p.label || ''; const bw = box.x1 - box.x0, bh = box.y1 - box.y0; if (bh < 16 || bw < 60) continue; if (bw >= 740 && bh >= 430) continue; }
      else if (f.action_type === 'draw_object') { const [x, y] = p.position || [0, 0]; const [w, h] = p.size || [0, 0]; box = { x0: x, y0: y, x1: x + w, y1: y + h }; label = p.label || ''; }
      else continue;
      if (label && label.trim()) continue;
      const hasText = texts.some((t) => { const [tx, ty] = t.payload?.position || [0, 0]; const c = String(t.payload?.content || '').trim(); return c && c !== '…' && inside(tx, ty, box); });
      if (!hasText) { emptyBoxes++; if (samples.emptyBox.length < 6) samples.emptyBox.push(`${part.title?.slice(0, 18)} ${f.action_type} (${Math.round(box.x0)},${Math.round(box.y0)})-(${Math.round(box.x1)},${Math.round(box.y1)})`); }
    }
    // (2) empty / ellipsis-only text
    for (const t of texts) {
      const c = String(t.payload?.content || '').trim();
      if (!c || c === '…' || c === '...' || c.replace(/[…．.\s]/g, '').length === 0) { emptyTexts++; if (samples.emptyText.length < 6) samples.emptyText.push(`${part.title?.slice(0, 18)} @${t.time_offset}s "${c}"`); }
    }
  }
  // (3) figure/object lifetime (time until next clear). Short = flashes.
  for (const f of all) {
    if (!['draw_object', 'draw_physics_shape', 'draw_graph', 'draw_table', 'draw_coordinate_system'].includes(f.action_type)) continue;
    const nc = clears.find((c) => c > f.time_offset);
    const life = (nc ?? partEnd) - f.time_offset;
    if (life < 5) { shortFigs++; if (samples.shortFig.length < 8) samples.shortFig.push(`${(f.payload?.object_type || f.action_type)} @${f.time_offset}s lives ${life.toFixed(1)}s`); }
  }
}

console.log(`Lesson: ${lesson.title}`);
console.log(`content boards .......... ${boardN}`);
console.log(`EMPTY boxes (no text) ... ${emptyBoxes}   ${emptyBoxes ? '❌' : '✅'}`);
samples.emptyBox.forEach((s) => console.log(`   · ${s}`));
console.log(`empty/ellipsis texts .... ${emptyTexts}   ${emptyTexts ? '❌' : '✅'}`);
samples.emptyText.forEach((s) => console.log(`   · ${s}`));
console.log(`short-lived figures(<5s)  ${shortFigs}   ${shortFigs ? '❌' : '✅'}`);
samples.shortFig.forEach((s) => console.log(`   · ${s}`));
