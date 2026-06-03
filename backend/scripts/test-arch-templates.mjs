// Render the architecture templates directly and show their structure (flat
// node boxes + dashed arrows + section headers), so we can confirm the
// reference look is produced and overlap-free.
import { renderTemplate } from '../src/services/whiteboard/templateLibrary.js';
import { fitTextToSlots, pruneEmptyContainers } from '../src/services/whiteboard/layout.js';

const CASES = [
  ['arch_pipeline', { steps: [
    { title: 'Ingest source document', detail: 'Read the PDF, slides, or topic text' },
    { title: 'Analyse & comprehend', detail: 'Extract concepts and structure' },
    { title: 'Plan teaching beats', detail: 'Sequence the lesson into scenes' },
    { title: 'Render whiteboard', detail: 'Fill templates, draw, animate' },
  ] }],
  ['arch_two_columns', { columns: [
    { title: 'Innate immunity', items: [{ title: 'Fast, non-specific', detail: 'Acts within minutes' }, { title: 'Barriers & phagocytes', detail: 'Skin, neutrophils' }] },
    { title: 'Adaptive immunity', items: [{ title: 'Slow, specific', detail: 'Targets one antigen' }, { title: 'B and T cells', detail: 'Antibodies and memory' }] },
  ] }],
  ['arch_flow_gates', { steps: [{ title: 'Antigen enters' }, { title: 'Recognised by cells' }, { title: 'Antibodies made' }], process: 'Activate B cells' }],
  ['arch_hub_nodes', { center: 'Vaccine response', items: [{ title: 'Memory B cells', detail: 'Remember the antigen' }, { title: 'Plasma cells', detail: 'Mass-produce antibodies' }, { title: 'Helper T cells', detail: 'Coordinate the attack' }, { title: 'Faster recall', detail: 'On re-exposure' }] }],
];
const ctx = { title: 'AI Whiteboard Teacher — System', subtitle: 'pipeline' };

for (const [id, data] of CASES) {
  let frags = renderTemplate(id, data, ctx);
  frags = pruneEmptyContainers(fitTextToSlots(frags));
  const hist = {};
  frags.forEach((f) => { hist[f.type] = (hist[f.type] || 0) + 1; });
  const boxes = frags.filter((f) => f.type === 'draw_rect' && f.style?.flat).length;
  const dashed = frags.filter((f) => f.type === 'draw_arrow' && f.style?.dashed).length;
  const whiteText = frags.filter((f) => f.type === 'draw_text' && f.style?.color === '#ffffff').length;
  console.log(`${id}: ${frags.length} frags · flat-boxes=${boxes} dashed-links=${dashed} white-titles=${whiteText}`);
  console.log(`   types: ${JSON.stringify(hist)}`);
}
console.log('\n(flat node boxes + dashed links + white titles present = reference style)');
