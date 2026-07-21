// -----------------------------------------------------------------------------
// Test: the validator + composition pipeline strip prompt-language scaffolding
// and dedup duplicate scenes, so what reaches the board is real teaching text.
// -----------------------------------------------------------------------------
// Run: node scripts/test-no-prompt-text.mjs
// -----------------------------------------------------------------------------

import { validateBoardScenes, cleanSay } from '../src/services/whiteboard/validator.js';
import { groupIntoUnits } from '../src/services/whiteboard/sceneComposer.js';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failures++;
  }
};

console.log('\n[1] cleanSay strips the meta-language sentence family');
{
  const cases = [
    {
      label: '"In this lesson we will..." prefix is dropped',
      input: 'In this lesson we will explore how plants make food. Plants turn sunlight into glucose via chlorophyll. This is called photosynthesis.',
      mustContain: ['plants turn sunlight into glucose', 'photosynthesis'],
      mustNotContain: ['in this lesson'],
    },
    {
      label: '"Today we will learn..." prefix is dropped',
      input: 'Today we will learn about mitosis. The cell divides into two identical daughter cells. Each carries a full copy of the DNA.',
      mustContain: ['divides into two identical', 'dna'],
      mustNotContain: ['today we will learn'],
    },
    {
      label: '"According to the source material..." sentence is dropped',
      input: 'Plants turn sunlight into glucose. According to the source material, the reaction happens in the chloroplast. The byproduct is oxygen.',
      mustContain: ['plants turn sunlight into glucose', 'byproduct is oxygen'],
      mustNotContain: ['according to the source material'],
    },
    {
      label: '"The learner should..." sentence is dropped',
      input: 'The CPU fetches an instruction. The learner should understand the fetch-decode-execute cycle. The execute stage runs the operation.',
      mustContain: ['cpu fetches an instruction', 'execute stage runs the operation'],
      mustNotContain: ['the learner should'],
    },
    {
      label: '"Specifically, ..." opener is dropped',
      input: 'Molecules are made of atoms. Specifically, each atom has a nucleus and electrons. The nucleus contains protons.',
      mustContain: ['molecules are made of atoms', 'nucleus contains protons'],
      mustNotContain: ['specifically, each atom has a nucleus'],
    },
    {
      label: 'Real teaching is preserved verbatim',
      input: 'Photosynthesis converts light energy into chemical energy. The light reactions occur in the thylakoid membranes. The Calvin cycle takes place in the stroma.',
      mustContain: ['photosynthesis converts light energy', 'calvin cycle takes place in the stroma'],
    },
    {
      label: 'All-meta input is flagged isMetaOnly',
      input: 'In this lesson we will explain photosynthesis. Today we will learn about plants.',
      mustBe: { isMetaOnly: true, text: '' },
    },
  ];
  for (const c of cases) {
    const out = cleanSay(c.input);
    if (c.mustBe) {
      ok(out.isMetaOnly === c.mustBe.isMetaOnly && out.text === c.mustBe.text, c.label);
    } else {
      const lower = out.text.toLowerCase();
      const allContain = (c.mustContain || []).every((m) => lower.includes(m.toLowerCase()));
      const noneContain = !(c.mustNotContain || []).some((m) => lower.includes(m.toLowerCase()));
      ok(allContain, `${c.label} — kept real sentences`);
      ok(noneContain, `${c.label} — stripped meta sentences`);
    }
  }
}

console.log('\n[2] validateBoardScenes dedups consecutive duplicate-opener scenes');
{
  const scenes = [
    { intent: 'define', headline: 'Concept A', say: 'The CPU is the brain of the computer. It executes one instruction at a time at remarkable speed.' },
    { intent: 'define', headline: 'Concept B', say: 'The CPU is the brain of the computer. It has a control unit and an arithmetic logic unit working together.' },
    { intent: 'process', headline: 'Cycle', say: 'A different opening: the fetch stage loads the next instruction from memory into the register.' },
  ];
  const clean = validateBoardScenes(scenes);
  ok(clean.length === 2, `duplicate opener scene is dropped (got ${clean.length}, want 2)`);
  ok(clean[0]?.say.includes('executes one instruction'), 'first kept scene is the first one');
  ok(clean[1]?.say.includes('fetch stage loads the next'), 'third scene is kept because opener differs');
}

console.log('\n[3] validateBoardScenes drops meta-only scenes');
{
  const scenes = [
    { intent: 'define', headline: 'Real', say: 'Photosynthesis turns light into chemical energy using chlorophyll inside chloroplasts.' },
    { intent: 'define', headline: 'Meta', say: 'In this lesson we will explain photosynthesis. According to the source material, plants are amazing.' },
  ];
  const clean = validateBoardScenes(scenes);
  ok(clean.length === 1, `meta-only scene is dropped (got ${clean.length}, want 1)`);
  ok(clean[0]?.headline === 'Real', 'the real-content scene survives');
}

console.log('\n[4] validateBoardScenes caps intent repetition and keeps variety');
{
  const scenes = [
    { intent: 'define', headline: 'A', say: 'The CPU is the brain of the computer and runs every program.' },
    { intent: 'define', headline: 'B', say: 'The CPU contains billions of transistors etched onto a silicon die.' },
    { intent: 'define', headline: 'C', say: 'A different opening: the CPU clock synchronizes every operation to a precise rhythm.' },
    { intent: 'process', headline: 'Cycle', say: 'Another opener: the fetch-decode-execute cycle repeats millions of times per second.' },
  ];
  const clean = validateBoardScenes(scenes);
  // Two consecutive defines are allowed; the third is dropped.
  ok(clean.length === 3, `third duplicate-intent define is dropped (got ${clean.length}, want 3)`);
}

console.log('\n[5] groupIntoUnits clusters fragments by shape boundary');
{
  // Simulate what process_pipeline emits: rect, badge, text, text, arrow, rect, badge, text, text
  const frags = [
    { type: 'draw_rect', x: 40, y: 230, width: 150, height: 96, style: { fill: '#dbeafe', stroke: '#2563eb' } },
    { type: 'draw_badge', content: '1', position: [56, 216] },
    { type: 'draw_text', content: 'Step one title', position: [115, 272] },
    { type: 'draw_text', content: 'Step one detail', position: [115, 296] },
    { type: 'draw_arrow', from: [194, 278], to: [246, 278] },
    { type: 'draw_rect', x: 250, y: 230, width: 150, height: 96, style: { fill: '#ffffff', stroke: '#2563eb' } },
    { type: 'draw_badge', content: '2', position: [266, 216] },
    { type: 'draw_text', content: 'Step two title', position: [325, 272] },
    { type: 'draw_text', content: 'Step two detail', position: [325, 296] },
  ];
  const units = groupIntoUnits(frags);
  ok(units.length === 3, `3 units (step1, arrow, step2) — got ${units.length}`);
  // unit 0: step 1 box + badge + 2 texts (all 4 frags of step 1)
  ok(units[0]?.fragments.length === 4, `step 1 unit has 4 fragments (box+badge+text+detail), got ${units[0]?.fragments.length}`);
  // unit 1: arrow connector (1 frag)
  ok(units[1]?.fragments.length === 1 && units[1]?.fragments[0].type === 'draw_arrow', `arrow is its own connector unit`);
  // unit 2: step 2 box + badge + 2 texts
  ok(units[2]?.fragments.length === 4, `step 2 unit has 4 fragments, got ${units[2]?.fragments.length}`);
}

console.log('\n[6] groupIntoUnits keeps the header band together');
{
  const frags = [
    { type: 'draw_text', content: 'Part Title', position: [400, 44], style: { fontSize: 25, textAnchor: 'middle' } },
    { type: 'draw_line', from: [250, 58], to: [550, 58] },
    { type: 'draw_text', content: 'Subtitle', position: [400, 82], style: { fontSize: 14, textAnchor: 'middle' } },
    { type: 'draw_rect', x: 200, y: 150, width: 400, height: 200, style: { fill: '#ffffff', stroke: '#cbd5e1' } },
    { type: 'draw_text', content: 'Body label', position: [400, 260], style: { fontSize: 18, textAnchor: 'middle' } },
  ];
  const units = groupIntoUnits(frags);
  ok(units.length === 2, `2 units: header + content (got ${units.length})`);
  ok(units[0]?.role === 'header' && units[0]?.fragments.length === 3, `header unit has 3 fragments (title + line + subtitle)`);
  ok(units[1]?.role === 'content' && units[1]?.fragments.length === 2, `content unit has 2 fragments (box + label)`);
}

console.log('\n[7] groupIntoUnits on a 2-column compare: two columns + their bullets, no interleaved strip');
{
  const frags = [
    { type: 'draw_rect', x: 100, y: 110, width: 320, height: 300, style: { fill: '#ffffff', stroke: '#2563eb' } },
    { type: 'draw_rect', x: 100, y: 110, width: 320, height: 44, style: { fill: '#2563eb', stroke: '#2563eb' } },
    { type: 'draw_text', content: 'Light reactions', position: [260, 138], style: { fontSize: 17, textAnchor: 'middle' } },
    { type: 'draw_circle', center: [124, 178], radius: 6, style: { fill: '#2563eb' } },
    { type: 'draw_text', content: 'Need light', position: [140, 183] },
    { type: 'draw_circle', center: [124, 232], radius: 6, style: { fill: '#2563eb' } },
    { type: 'draw_text', content: 'In thylakoid', position: [140, 237] },
    { type: 'draw_rect', x: 460, y: 110, width: 320, height: 300, style: { fill: '#ffffff', stroke: '#0f766e' } },
    { type: 'draw_rect', x: 460, y: 110, width: 320, height: 44, style: { fill: '#0f766e', stroke: '#0f766e' } },
    { type: 'draw_text', content: 'Calvin cycle', position: [620, 138], style: { fontSize: 17, textAnchor: 'middle' } },
    { type: 'draw_circle', center: [484, 178], radius: 6, style: { fill: '#0f766e' } },
    { type: 'draw_text', content: 'Light-independent', position: [500, 183] },
  ];
  const units = groupIntoUnits(frags);
  // Each column is its own unit (rect+rect+title+circles+texts); no interleaved strip
  const unitSizes = units.map((u) => u.fragments.length);
  ok(units.length === 2, `2 column units (got ${units.length})`);
  ok(unitSizes[0] >= 4 && unitSizes[1] >= 4, `each unit holds its column's fragments (sizes ${unitSizes.join(', ')})`);
}

console.log(`\n${failures === 0 ? '✅ ALL NO-PROMPT-TEXT TESTS PASSED' : `❌ ${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
