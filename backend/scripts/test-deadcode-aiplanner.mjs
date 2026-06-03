// Dead-code finder for aiPlanner.js (read-only analysis, prints a report).
//
// Strategy: parse all top-level `function NAME(` declarations, build a crude
// call graph by scanning each function body for occurrences of every other
// function name, then compute reachability from the LIVE roots (the exported
// entry points + things called by other modules). Anything not reachable is a
// deletion candidate. This is conservative: substring matches over-connect, so
// if it says a function is DEAD it is almost certainly dead.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/services/aiPlanner.js', import.meta.url), 'utf8');
const lines = src.split('\n');

// 1. find top-level function declarations: `function NAME(` or `async function NAME(`
const fnRe = /^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/;
const decls = []; // {name, start}
lines.forEach((ln, i) => {
  const m = ln.match(fnRe);
  if (m) decls.push({ name: m[1], start: i });
});
// body of decl k = lines[start_k .. start_{k+1}-1] (approx; good enough for graph)
for (let k = 0; k < decls.length; k++) {
  decls[k].end = (k + 1 < decls.length) ? decls[k + 1].start : lines.length;
  decls[k].body = lines.slice(decls[k].start, decls[k].end).join('\n');
}
const names = decls.map((d) => d.name);
const byName = new Map(decls.map((d) => [d.name, d]));

// 2. call graph: edge A->B if B's name appears in A's body (excluding A's own decl line)
const word = (n) => new RegExp(`\\b${n}\\b`);
const calls = new Map();
for (const d of decls) {
  const set = new Set();
  for (const n of names) {
    if (n === d.name) continue;
    if (word(n).test(d.body)) set.add(n);
  }
  calls.set(d.name, set);
}

// 3. LIVE roots: exported functions + anything referenced OUTSIDE any function
//    (module top-level), since those run on import / live path.
const exported = decls.filter((d) => /^export\s/.test(lines[d.start])).map((d) => d.name);
// top-level references: scan lines that are NOT inside any function decl body.
const insideRanges = decls.map((d) => [d.start, d.end]);
const isInside = (i) => insideRanges.some(([s, e]) => i >= s && i < e);
const topLevelRefs = new Set();
lines.forEach((ln, i) => {
  if (isInside(i)) return;
  for (const n of names) if (word(n).test(ln)) topLevelRefs.add(n);
});

const roots = new Set([...exported, ...topLevelRefs]);
// Known external entry points / called by other files (defensive allowlist):
['planLessonSeries', 'planSingleLesson', 'planLesson', 'buildVisualPlaybook',
 'resetAICircuit', 'testAIConnection', 'generateContentVisuals', 'generateQuizVisuals',
 'buildFallbackLesson', 'buildTopicFallbackLesson', '_planLessonContent',
 'validateAndFixPlan', 'normalizeVisualSequence'].forEach((n) => { if (byName.has(n)) roots.add(n); });

// 4. reachability BFS
const reachable = new Set();
const queue = [...roots].filter((n) => byName.has(n));
while (queue.length) {
  const n = queue.shift();
  if (reachable.has(n)) continue;
  reachable.add(n);
  for (const m of (calls.get(n) || [])) if (!reachable.has(m)) queue.push(m);
}

const dead = names.filter((n) => !reachable.has(n));
console.log(`Total top-level functions: ${names.length}`);
console.log(`Reachable from live roots:  ${reachable.size}`);
console.log(`DEAD (deletion candidates): ${dead.length}\n`);
dead.sort((a, b) => byName.get(a).start - byName.get(b).start);
for (const n of dead) {
  const d = byName.get(n);
  console.log(`  ${String(d.start + 1).padStart(5)}-${String(d.end).padStart(5)}  ${n}`);
}
