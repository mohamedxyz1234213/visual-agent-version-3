// -----------------------------------------------------------------------------
// End-to-end smoke test for the whiteboard pipeline.
//
//   board_scenes  --validator-->  clean scenes
//                 --partToPscenes-->  pscenes
//                 --composeStoryboard-->  visual_sequence (timed fragments)
//
// Run: node scripts/test-whiteboard-pipeline.mjs
// Exits non-zero on failure so it can gate CI.
// -----------------------------------------------------------------------------

import { validateBoardScenes, validateLessonPlan } from '../src/services/whiteboard/validator.js';
import { buildWhiteboardForPart } from '../src/services/whiteboard/index.js';
import { allTemplateIds, allTemplates, renderTemplate } from '../src/services/whiteboard/templateLibrary.js';
import { buildVisualPlaybook } from '../src/services/aiPlanner.js';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failures++;
  }
};

// ── A realistic AI part with board_scenes covering several intents ──────────
const photosynthesisPart = {
  title: 'How Photosynthesis Works',
  part_type: 'content',
  duration_seconds: 300,
  narration: 'Plants are tiny factories that turn sunlight into food. Let us see how.',
  key_concepts: ['Chloroplast', 'Light reaction', 'Calvin cycle'],
  board_scenes: [
    {
      intent: 'define',
      goal: 'introduce photosynthesis',
      headline: 'Photosynthesis',
      definition: 'The process plants use to convert light energy into chemical energy.',
      points: ['Occurs in chloroplasts', 'Requires sunlight and water', 'Produces glucose and oxygen'],
    },
    {
      intent: 'process',
      goal: 'show the stages',
      steps: [
        { title: 'Light absorption', detail: 'Chlorophyll captures photons' },
        { title: 'Water splitting', detail: 'H2O breaks into H+ and O2' },
        { title: 'Carbon fixation', detail: 'CO2 becomes glucose' },
      ],
    },
    {
      intent: 'compare',
      goal: 'light vs dark reactions',
      columns: [
        { title: 'Light reactions', items: ['Need light', 'In thylakoid', 'Make ATP'] },
        { title: 'Calvin cycle', items: ['Light-independent', 'In stroma', 'Make sugar'] },
      ],
    },
    {
      intent: 'recap',
      goal: 'wrap up',
      points: ['Light + water + CO2', 'Energy stored in glucose', 'Oxygen released'],
    },
  ],
};

// ── A part with garbage/placeholder scenes the validator must reject ────────
const garbagePart = {
  title: 'Edge Cases',
  part_type: 'content',
  duration_seconds: 180,
  narration: 'test',
  board_scenes: [
    { intent: 'define', headline: 'placeholder', points: ['todo', 'tbd', 'point 1'] }, // all placeholders
    { intent: 'not_a_real_intent', headline: 'Bad intent' }, // invalid intent
    { intent: 'process', goal: 'real one', steps: [{ title: 'Real step', detail: 'Actual content here' }] }, // valid
    null, // junk
    'a string', // junk
  ],
};

console.log('\n[1] Validator strips placeholders & invalid scenes');
{
  const clean = validateBoardScenes(garbagePart.board_scenes);
  ok(Array.isArray(clean), 'returns an array');
  ok(clean.length >= 1, `keeps at least the one valid scene (kept ${clean.length})`);
  ok(clean.every((s) => s.intent && s.intent !== 'not_a_real_intent'), 'no invalid intents survive');
  const flat = JSON.stringify(clean).toLowerCase();
  ok(!/\btodo\b|\btbd\b|placeholder/.test(flat), 'no placeholder text survives');
}

console.log('\n[2] Validator keeps all 4 good photosynthesis scenes');
{
  const clean = validateBoardScenes(photosynthesisPart.board_scenes);
  ok(clean.length === 4, `kept all 4 scenes (got ${clean.length})`);
  ok(clean.map((s) => s.intent).join(',') === 'define,process,compare,recap', 'intents preserved in order');
}

console.log('\n[3] Full lesson plan validation');
{
  const result = validateLessonPlan({
    title: 'Biology 101',
    parts: [photosynthesisPart, garbagePart],
  });
  ok(result.valid, 'plan is valid');
  ok(result.plan.parts.length === 2, `both parts survive (got ${result.plan.parts.length})`);
  ok(result.plan.parts[0].board_scenes.length === 4, 'part 1 keeps 4 board_scenes');
}

console.log('\n[4] buildWhiteboardForPart produces a real timed sequence');
{
  const seq = buildWhiteboardForPart(photosynthesisPart, { lessonTitle: 'Biology 101' });
  ok(Array.isArray(seq), 'returns an array');
  ok(seq.length >= 6, `produces a substantive sequence (got ${seq.length} fragments)`);
  ok(seq.every((s) => typeof s.time === 'number' && s.time >= 0), 'every fragment has a numeric time');
  const times = seq.map((s) => s.time);
  ok(times.every((t, i) => i === 0 || t >= times[i - 1]), 'times are non-decreasing (proper pacing)');
  const types = new Set(seq.map((s) => s.type));
  ok(types.has('camera'), 'includes camera/zoom animations');
  ok([...types].some((t) => /text|rect|circle|path|arrow|line|badge|callout|equation|graph|table|object/.test(t)), 'includes real drawable shapes');
  console.log(`     fragment types: ${[...types].join(', ')}`);
}

console.log('\n[5] Degrades gracefully when board_scenes is missing');
{
  const seq = buildWhiteboardForPart({
    title: 'Legacy Part',
    duration_seconds: 200,
    narration: 'This part has no board_scenes. It should still produce something via the visual_logic fallback path so the lesson is never blank.',
    key_concepts: ['Alpha', 'Beta', 'Gamma'],
    visual_logic: [{ content: 'Alpha causes Beta', relationship: 'cause' }],
  }, { lessonTitle: 'Legacy' });
  ok(Array.isArray(seq) && seq.length > 0, `fallback still produces a sequence (got ${seq.length})`);
}

console.log('\n[6] Every template renders without throwing & owns its geometry');
{
  const ids = allTemplateIds();
  ok(ids.length >= 40, `library has a healthy template count (got ${ids.length})`);
  const ctx = { title: 'Test Title', subtitle: 'Test Subtitle' };
  const sampleData = {
    headline: 'Concept', definition: 'A definition that is reasonably long for layout testing.',
    statement: 'A key statement', concept: 'Concept', formula: 'E = mc^2',
    points: ['First point', 'Second point', 'Third point', 'Fourth point'],
    steps: [{ title: 'Step one', detail: 'Detail one' }, { title: 'Step two', detail: 'Detail two' }, { title: 'Step three', detail: 'Detail three' }],
    items: ['Item A', 'Item B', 'Item C'],
    columns: [{ title: 'Left', items: ['a', 'b'] }, { title: 'Right', items: ['c', 'd'] }],
    children: [{ title: 'Child 1' }, { title: 'Child 2' }, { title: 'Child 3' }],
    events: [{ title: 'Event 1', detail: 'd' }, { title: 'Event 2', detail: 'd' }],
    cards: [{ title: 'Card 1', detail: 'd' }, { title: 'Card 2', detail: 'd' }],
    stats: [{ title: 'Stat', value: '42%' }], values: [10, 20, 30, 40],
    pros: ['Pro 1', 'Pro 2'], cons: ['Con 1', 'Con 2'],
    strengths: ['S1'], weaknesses: ['W1'], opportunities: ['O1'], threats: ['T1'],
    // Slots exercised by the domain templates (63-80).
    layers: [{ title: 'Client', detail: 'Browser' }, { title: 'API', detail: 'Gateway' }, { title: 'Service' }, { title: 'Database' }],
    stages: [{ title: 'Absorb' }, { title: 'Convert' }, { title: 'Release' }],
    states: [{ title: 'Idle' }, { title: 'Active' }, { title: 'Done' }],
    markers: ['-2', '0', '3', '5'],
    vectors: [{ title: 'Force A' }, { title: 'Force B' }],
    lines: ['const x = 1', 'return x + 2', 'console.log(x)'],
    branches: [{ title: 'Approved path' }, { title: 'Rejected path' }],
    annotations: ['Peak demand', 'Steady state', 'Decline'],
    links: [{ from: 'Heart', to: 'Pump' }, { from: 'Lungs', to: 'Gas exchange' }],
    eras: [{ title: 'Ancient', detail: '3000 BC' }, { title: 'Medieval', detail: '500 AD' }, { title: 'Modern', detail: '1500 AD' }],
    nodes: [{ title: 'Node 1' }, { title: 'Node 2' }, { title: 'Node 3' }],
    left_title: 'Households', right_title: 'Firms', center: 'Water Cycle',
    start: 'Start', decision: 'Valid?', question: 'Is it valid?',
    why_title: 'Why it matters', example: 'For instance, a bank transfer applies this directly.',
    supply_label: 'Supply', demand_label: 'Demand', eq_label: 'Equilibrium',
    x_label: 'Quantity', y_label: 'Price', concept: 'Recursion', analogy: 'Russian dolls',
  };
  let rendered = 0;
  let withinBounds = 0;
  for (const id of ids) {
    let frags;
    try {
      frags = renderTemplate(id, sampleData, ctx);
    } catch (err) {
      console.error(`     ✗ template "${id}" threw: ${err.message}`);
      failures++;
      continue;
    }
    if (Array.isArray(frags) && frags.length) rendered++;
    // Spot-check that text/shape x,y stay roughly within the 800x500 canvas.
    const inBounds = (frags || []).every((f) => {
      const xs = [];
      const ys = [];
      if (Array.isArray(f.position)) { xs.push(f.position[0]); ys.push(f.position[1]); }
      if (typeof f.x === 'number') { xs.push(f.x); ys.push(f.y); }
      if (Array.isArray(f.center)) { xs.push(f.center[0]); ys.push(f.center[1]); }
      return xs.every((x) => x >= -40 && x <= 860) && ys.every((y) => y >= -40 && y <= 560);
    });
    if (inBounds) withinBounds++;
  }
  ok(rendered === ids.length, `all ${ids.length} templates rendered fragments (got ${rendered})`);
  ok(withinBounds >= Math.floor(ids.length * 0.9), `≥ 90% of templates keep geometry on-canvas (${withinBounds}/${ids.length})`);
}

console.log('\n[7] Dynamic science figures render real diagrams');
{
  const ctx = { title: 'Atomic Structure', subtitle: 'protons, neutrons, electrons' };
  // Explicit diagram slot.
  const explicit = renderTemplate('labeled_science_diagram', { diagram: 'atom', labels: ['Nucleus', 'Electron shell', 'Proton', 'Neutron'] }, ctx);
  const circles = explicit.filter((f) => f.type === 'draw_circle').length;
  ok(circles >= 6, `atom diagram draws multiple circles (nucleus + electrons), got ${circles}`);

  // Auto-detection from text alone (no diagram slot).
  const auto = renderTemplate('figure_with_facts', { headline: 'DNA double helix', points: ['Two strands', 'Base pairs', 'Sugar backbone'] }, { title: 'Genetics', subtitle: '' });
  ok(auto.length > 5, `auto-detected DNA figure renders (${auto.length} fragments)`);

  // Unknown topic must NOT throw and must still render something.
  const fallback = renderTemplate('labeled_science_diagram', { headline: 'Supply and demand', points: ['Price', 'Quantity'] }, { title: 'Economics', subtitle: '' });
  ok(fallback.length > 0, `non-science topic falls back gracefully (${fallback.length} fragments)`);

  // Figure geometry should stay on the 800x500 canvas.
  const all = [...explicit, ...auto];
  const inBounds = all.every((f) => {
    const xs = []; const ys = [];
    if (Array.isArray(f.position)) { xs.push(f.position[0]); ys.push(f.position[1]); }
    if (typeof f.x === 'number') { xs.push(f.x, f.x + (f.width || 0)); ys.push(f.y, f.y + (f.height || 0)); }
    if (Array.isArray(f.center)) { xs.push(f.center[0] - (f.radius || 0), f.center[0] + (f.radius || 0)); ys.push(f.center[1] - (f.radius || 0), f.center[1] + (f.radius || 0)); }
    if (Array.isArray(f.from)) { xs.push(f.from[0], f.to[0]); ys.push(f.from[1], f.to[1]); }
    return xs.every((x) => x >= -30 && x <= 830) && ys.every((y) => y >= -30 && y <= 530);
  });
  ok(inBounds, 'science figures + labels stay within canvas bounds');
}

console.log('\n[8] Beat-synced timing — board windows scale with spoken word counts');
{
  // Two beats with very different `say` lengths. The composer sizes each board's
  // on-screen window by its spoken weight, so the long beat must occupy more time.
  const longSay = 'This is the long teaching beat where the teacher explains the idea slowly and carefully, walking through every part of the concept with an example so the student fully understands what is going on here.';
  const syncPart = {
    title: 'Sync Test',
    part_type: 'content',
    duration_seconds: 200,
    narration: 'placeholder',
    board_scenes: [
      { intent: 'define', goal: 'short beat', headline: 'Short', say: 'Quick note.' },
      { intent: 'recap', goal: 'long beat', points: ['A', 'B', 'C'], say: longSay },
    ],
  };
  const seq = buildWhiteboardForPart(syncPart, { lessonTitle: 'Sync' });
  const enters = seq.filter((s) => s.type === 'camera' && s.mode === 'enter').map((s) => s.time);
  const resets = seq.filter((s) => s.type === 'camera' && s.mode === 'reset').map((s) => s.time);
  ok(enters.length === 2 && resets.length === 2, `two board windows present (enters=${enters.length}, resets=${resets.length})`);
  if (enters.length === 2 && resets.length === 2) {
    const win0 = resets[0] - enters[0];
    const win1 = resets[1] - enters[1];
    ok(win1 > win0 * 1.5, `long beat gets a wider window than short beat (short=${win0.toFixed(1)}s, long=${win1.toFixed(1)}s)`);
  }
}

console.log('\n[9] Drawn slot text is capped to keyword-anchor length; spoken `say` is not');
{
  const longHeadline = 'Photosynthesis '.repeat(20).trim();   // ~300 chars
  const longPoint = 'A very long supporting point that keeps going '.repeat(6).trim();
  const longDefinition = 'A definition that runs on well past any sensible drawn length '.repeat(5).trim();
  const longSay = 'Spoken narration should never be truncated because it is the voice not the board. '.repeat(4).trim();
  const [clean] = validateBoardScenes([{
    intent: 'define',
    headline: longHeadline,
    definition: longDefinition,
    points: [longPoint],
    say: longSay,
  }]);
  ok(clean && clean.headline.length <= 48, `headline anchor capped (${clean?.headline?.length} ≤ 48)`);
  ok(clean && clean.points[0].length <= 48, `array point capped to anchor length (${clean?.points?.[0]?.length} ≤ 48)`);
  ok(clean && clean.definition.length <= 90, `definition capped to line length (${clean?.definition?.length} ≤ 90)`);
  ok(clean && clean.say && clean.say.length > 90, `spoken say preserved uncapped (${clean?.say?.length} chars)`);
}

console.log('\n[10] Subject-aware visual playbook biases each field toward domain visuals');
{
  const cases = [
    ['biology', /cycle|diagram|map/i],
    ['history', /timeline|causal/i],
    ['mathematics', /formula|graph|plot/i],
    ['economics', /supply|demand|equilibrium|curve/i],
    ['programming', /architecture|flowchart|system|lifecycle/i],
  ];
  for (const [field, re] of cases) {
    const pb = buildVisualPlaybook(field);
    ok(typeof pb === 'string' && re.test(pb), `${field} playbook points at domain-appropriate visuals`);
  }
  const general = buildVisualPlaybook('general');
  ok(typeof general === 'string' && general.length > 0, 'unknown/general field still yields a usable playbook');
}

console.log(`\n${failures === 0 ? '✅ ALL PIPELINE TESTS PASSED' : `❌ ${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
