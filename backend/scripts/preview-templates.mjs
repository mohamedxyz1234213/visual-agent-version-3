// -----------------------------------------------------------------------------
// Template preview gallery generator.
//
// Renders EVERY template in the library with representative sample data into a
// single self-contained HTML file you can open in a browser to visually QA
// layout, spacing, and overlap. This is a dev tool — it ships nothing.
//
//   node scripts/preview-templates.mjs            -> backend/preview/templates.html
//   node scripts/preview-templates.mjs --intent map  -> only `map` templates
//
// The SVG conversion here is a faithful-enough stand-in for the React renderer:
// positions/sizes match exactly (that's what overlap QA needs); decorative
// draw_object art is shown as a labeled placeholder box.
// -----------------------------------------------------------------------------

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allTemplates, renderTemplate } from '../src/services/whiteboard/templateLibrary.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'preview', 'templates.html');

const intentFilter = (() => {
  const i = process.argv.indexOf('--intent');
  return i !== -1 ? process.argv[i + 1] : null;
})();

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Representative data so every slot a template might read is populated.
const SAMPLE = {
  headline: 'Photosynthesis', concept: 'Energy Conversion',
  definition: 'The process plants use to turn light into chemical energy stored as sugar.',
  statement: 'Light powers life on Earth', sub: 'A quick orientation before we dive in',
  formula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
  problem: 'Solve 2x + 3 = 11', answer: 'x = 4', outcome: 'Glucose stored, oxygen released',
  takeaway: 'Plants are solar-powered sugar factories', question: 'How do leaves capture light?',
  diagram: 'cell',
  points: ['Occurs in chloroplasts', 'Needs sunlight and water', 'Produces glucose', 'Releases oxygen'],
  items: ['Chlorophyll', 'Thylakoid', 'Stroma', 'Granum'],
  labels: ['Nucleus', 'Chloroplast', 'Vacuole', 'Membrane'],
  steps: [
    { title: 'Light absorption', detail: 'Chlorophyll captures photons' },
    { title: 'Water splitting', detail: 'H₂O breaks into H⁺ and O₂' },
    { title: 'Carbon fixation', detail: 'CO₂ becomes glucose' },
    { title: 'Energy storage', detail: 'Sugar holds the energy' },
  ],
  columns: [
    { title: 'Light reactions', items: ['Need light', 'In thylakoid', 'Make ATP'] },
    { title: 'Calvin cycle', items: ['No light', 'In stroma', 'Make sugar'] },
  ],
  children: [{ title: 'Producers' }, { title: 'Consumers' }, { title: 'Decomposers' }],
  events: [
    { title: '1771', detail: 'Priestley finds O₂' },
    { title: '1779', detail: 'Light needed' },
    { title: '1845', detail: 'Energy from sun' },
    { title: '1937', detail: 'Hill reaction' },
  ],
  cards: [{ title: 'Input', detail: 'Light + CO₂' }, { title: 'Output', detail: 'Sugar + O₂' }, { title: 'Site', detail: 'Chloroplast' }],
  stats: [{ title: 'Efficiency', value: '~3-6%' }, { title: 'O₂ share', value: '~50%' }, { title: 'Species', value: '300k+' }],
  values: [12, 28, 35, 22, 40, 18], graph_type: 'bar',
  pros: ['Renewable', 'Clean', 'Abundant'], cons: ['Slow', 'Diffuse'],
  strengths: ['Scalable'], weaknesses: ['Weather-dependent'], opportunities: ['Biofuels'], threats: ['Land use'],
  terms: [{ symbol: 'CO₂', meaning: 'Carbon dioxide' }, { symbol: 'H₂O', meaning: 'Water' }],
  milestones: [{ title: 'Basics' }, { title: 'Light stage' }, { title: 'Dark stage' }, { title: 'Mastery' }],
  causes: [{ title: 'More light' }, { title: 'More CO₂' }], effect: 'Faster growth',
  center: 'Photosynthesis', satellites: ['Light', 'Water', 'CO₂', 'Chlorophyll'],
  tiers: [{ title: 'Sun' }, { title: 'Plants' }, { title: 'Animals' }],
  branches: [{ title: 'Inputs' }, { title: 'Process' }, { title: 'Outputs' }],
  dependencies: [{ title: 'Light' }, { title: 'Pigments' }, { title: 'Sugar' }],
  before_title: 'Before', after_title: 'After', left_title: 'Reactants', right_title: 'Products',
  pros_title: 'Benefits', cons_title: 'Limits', transform: 'converts to',
  x_label: 'Time', y_label: 'Output', low_label: 'Low', high_label: 'High', start: 'Seed', roof: 'Goal',

  // ── Domain-template slots (templates 63-80) ──────────────────────────────
  // Economics
  supply_label: 'Supply', demand_label: 'Demand', eq_label: 'Equilibrium',
  shift_label: 'Demand rises', cause: 'Incomes increase',
  on_label: 'Efficient', inside_label: 'Wasteful', outside_label: 'Unattainable',
  // Programming / CS
  layers: [
    { title: 'Client', detail: 'Browser / app' },
    { title: 'API Gateway', detail: 'Routing + auth' },
    { title: 'Service', detail: 'Business logic' },
    { title: 'Database', detail: 'Persistent store' },
  ],
  flow_label: 'request', return_label: 'response', reset_label: 'reset',
  decision: 'Valid?', question: 'Is input valid?', yes_label: 'Yes', no_label: 'No',
  lines: ['const x = readInput()', 'if (!x) return null', 'return transform(x)'],
  code: 'function add(a, b) {\n  return a + b\n}',
  annotations: ['Reads the request', 'Guards against null', 'Returns the result'],
  notes: ['Entry point', 'Validation', 'Output'],
  states: [{ title: 'Idle' }, { title: 'Active' }, { title: 'Done' }],
  nodes: [{ title: 'Start' }, { title: 'Running' }, { title: 'Finished' }],
  transitions: [{ from: 'Idle', to: 'Active' }, { from: 'Active', to: 'Done' }],
  links: [{ from: 'Heart', to: 'Pump' }, { from: 'Lungs', to: 'Gas exchange' }],
  pairs: [{ from: 'Recursion', to: 'Russian dolls' }, { from: 'Stack', to: 'Plate pile' }],
  // Biology
  stages: [{ title: 'Light absorption' }, { title: 'Water splitting' }, { title: 'Carbon fixation' }],
  // History
  eras: [
    { title: 'Ancient', detail: '3000 BC', range: '3000–500 BC' },
    { title: 'Medieval', detail: '500 AD', range: '500–1500 AD' },
    { title: 'Modern', detail: '1500 AD', range: '1500–now' },
  ],
  // General richer
  why_title: 'Why it matters', why: ['Powers the food chain', 'Releases the oxygen we breathe'],
  example: 'A single tree can release ~100 kg of oxygen per year.',
  analogy: 'Russian nesting dolls',
  top_label: 'Goods & services', bottom_label: 'Money',
  vectors: [{ title: 'Force A' }, { title: 'Force B' }],
  markers: ['-2', '0', '3', '5'],
};

function fragToSvg(f) {
  const s = f.style || {};
  switch (f.type) {
    case 'draw_text': {
      const [x, y] = f.position || [0, 0];
      const anchor = s.textAnchor === 'middle' ? 'middle' : s.textAnchor === 'end' ? 'end' : 'start';
      return `<text x="${x}" y="${y}" font-size="${s.fontSize || 16}" font-weight="${s.fontWeight || 600}" fill="${s.color || '#1e293b'}" text-anchor="${anchor}" font-style="${s.fontStyle || 'normal'}" font-family="Inter, system-ui, sans-serif">${esc(f.content)}</text>`;
    }
    case 'draw_rect': {
      const lbl = f.label ? `<text x="${f.x + f.width / 2}" y="${f.y + f.height / 2 + 5}" font-size="13" font-weight="700" fill="#1e293b" text-anchor="middle" font-family="Inter, sans-serif">${esc(f.label)}</text>` : '';
      return `<rect x="${f.x}" y="${f.y}" width="${f.width}" height="${f.height}" rx="${s.rx ?? 12}" fill="${s.fill || '#fff'}" stroke="${s.stroke || '#cbd5e1'}" stroke-width="${s.strokeWidth || 1.5}" ${s.dashed ? 'stroke-dasharray="6 4"' : ''}/>${lbl}`;
    }
    case 'draw_circle': {
      const [cx, cy] = f.center || [0, 0];
      const lbl = f.label ? `<text x="${cx}" y="${cy + 5}" font-size="12" font-weight="700" fill="#1e293b" text-anchor="middle" font-family="Inter, sans-serif">${esc(f.label)}</text>` : '';
      return `<circle cx="${cx}" cy="${cy}" r="${f.radius || 6}" fill="${s.fill || '#fff'}" stroke="${s.stroke || '#cbd5e1'}" stroke-width="${s.strokeWidth || 2}" ${s.dashed ? 'stroke-dasharray="5 4"' : ''}/>${lbl}`;
    }
    case 'draw_line': {
      const [x1, y1] = f.from || [0, 0]; const [x2, y2] = f.to || [0, 0];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s.color || '#cbd5e1'}" stroke-width="${s.strokeWidth || 1.5}" ${s.dashed ? 'stroke-dasharray="7 4"' : ''}/>`;
    }
    case 'draw_arrow': {
      const [x1, y1] = f.from || [0, 0]; const [x2, y2] = f.to || [0, 0];
      const lbl = f.label ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" font-size="10" fill="#64748b" text-anchor="middle" font-family="Inter, sans-serif">${esc(f.label)}</text>` : '';
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s.color || '#475569'}" stroke-width="${s.strokeWidth || 2}" marker-end="url(#arrow)"/>${lbl}`;
    }
    case 'draw_path':
      return `<path d="${esc(f.d)}" fill="${s.fill || 'none'}" stroke="${s.stroke || '#94a3b8'}" stroke-width="${s.strokeWidth || 2}" ${s.dashed ? 'stroke-dasharray="6 4"' : ''} ${f.markerEnd ? 'marker-end="url(#arrow)"' : ''}/>`;
    case 'draw_badge': {
      const [x, y] = f.position || [0, 0]; const w = Math.max(40, String(f.content).length * 8 + 16);
      return `<rect x="${x}" y="${y - 16}" width="${w}" height="24" rx="12" fill="${s.bg || '#1e293b'}"/><text x="${x + w / 2}" y="${y}" font-size="${s.fontSize || 13}" fill="${s.color || '#fff'}" text-anchor="middle" font-weight="700" font-family="Inter, sans-serif">${esc(f.content)}</text>`;
    }
    case 'draw_callout': {
      const [x, y] = f.position || [0, 0]; const w = f.width || 220;
      return `<rect x="${x}" y="${y}" width="${w}" height="56" rx="10" fill="${s.bg || '#fffbeb'}" stroke="${s.stroke || '#f59e0b'}"/><text x="${x + 12}" y="${y + 32}" font-size="13" fill="${s.color || '#92400e'}" font-family="Inter, sans-serif">${esc(f.content)}</text>`;
    }
    case 'draw_object': {
      const [x, y] = f.position || [0, 0]; const [w, h] = f.size || [80, 80];
      const lbl = f.label ? `<text x="${x + w / 2}" y="${y + h + 16}" font-size="12" font-weight="600" fill="#475569" text-anchor="middle" font-family="Inter, sans-serif">${esc(f.label)}</text>` : '';
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#f1f5f9" stroke="#94a3b8" stroke-dasharray="4 4"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" font-size="11" fill="#64748b" text-anchor="middle" font-family="monospace">${esc(f.object_type)}</text>${lbl}`;
    }
    case 'show_equation': {
      const [x, y] = f.position || [400, 250];
      return `<text x="${x}" y="${y}" font-size="22" fill="#0f172a" text-anchor="middle" font-family="Georgia, serif">${esc(f.latex || f.equation)}</text>`;
    }
    default:
      return `<!-- unsupported: ${esc(f.type)} -->`;
  }
}

const templates = allTemplates().filter((t) => !intentFilter || t.intent === intentFilter);

const cards = templates.map((t) => {
  const ctx = { title: t.label || t.id, subtitle: `intent: ${t.intent}` };
  let frags = [];
  let err = '';
  try {
    frags = renderTemplate(t.id, SAMPLE, ctx);
  } catch (e) {
    err = e.message;
  }
  const body = frags.map(fragToSvg).join('\n      ');
  return `
  <figure class="card">
    <figcaption><span class="id">${esc(t.id)}</span><span class="intent">${esc(t.intent)}</span><span class="count">${frags.length} frags</span></figcaption>
    <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="800" height="500" fill="#ffffff"/>
      <rect x="2" y="2" width="796" height="496" fill="none" stroke="#e2e8f0"/>
      ${err ? `<text x="400" y="250" text-anchor="middle" fill="#dc2626" font-size="16">ERROR: ${esc(err)}</text>` : body}
    </svg>
  </figure>`;
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Whiteboard Template Gallery</title>
<style>
  :root { color-scheme: light; }
  body { margin: 0; padding: 24px; background: #0f172a; font-family: Inter, system-ui, sans-serif; }
  h1 { color: #f8fafc; font-size: 20px; margin: 0 0 4px; }
  p.meta { color: #94a3b8; margin: 0 0 20px; font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 18px; }
  .card { margin: 0; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.3); }
  figcaption { display: flex; gap: 10px; align-items: center; padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  .id { font-weight: 800; color: #0f172a; }
  .intent { color: #2563eb; background: #dbeafe; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; }
  .count { margin-left: auto; color: #94a3b8; font-size: 11px; }
  svg { display: block; width: 100%; height: auto; }
</style></head>
<body>
  <h1>Whiteboard Template Gallery</h1>
  <p class="meta">${templates.length} templates${intentFilter ? ` · intent="${esc(intentFilter)}"` : ''} · generated ${new Date().toISOString()} · open in a browser to scan for overlaps</p>
  <svg width="0" height="0"><defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#475569"/></marker></defs></svg>
  <div class="grid">${cards}</div>
</body></html>`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html, 'utf8');
console.log(`Rendered ${templates.length} templates -> ${OUT}`);
console.log(`Open with:  open "${OUT}"`);
