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
import { composeStoryboard } from '../src/services/whiteboard/sceneComposer.js';
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
      say: 'Photosynthesis is the process plants use to convert light energy into chemical energy. It happens inside chloroplasts and uses sunlight, water, and carbon dioxide. The plant stores the energy as glucose and releases oxygen as a byproduct.',
      headline: 'Photosynthesis',
      definition: 'The process plants use to convert light energy into chemical energy.',
      points: ['Occurs in chloroplasts', 'Requires sunlight and water', 'Produces glucose and oxygen'],
    },
    {
      intent: 'process',
      goal: 'show the stages',
      say: 'The reaction runs in three stages. First chlorophyll captures photons of light. Then water splits into hydrogen ions and oxygen gas. Finally carbon dioxide is fixed into glucose through a chain of enzyme-driven steps.',
      steps: [
        { title: 'Light absorption', detail: 'Chlorophyll captures photons' },
        { title: 'Water splitting', detail: 'H2O breaks into H+ and O2' },
        { title: 'Carbon fixation', detail: 'CO2 becomes glucose' },
      ],
    },
    {
      intent: 'compare',
      goal: 'light vs dark reactions',
      say: 'Plants split photosynthesis into two linked stages. The light reactions need sunlight and happen in the thylakoid membranes where they make ATP. The Calvin cycle is light-independent, runs in the stroma, and uses that ATP to build sugar.',
      columns: [
        { title: 'Light reactions', items: ['Need light', 'In thylakoid', 'Make ATP'] },
        { title: 'Calvin cycle', items: ['Light-independent', 'In stroma', 'Make sugar'] },
      ],
    },
    {
      intent: 'recap',
      goal: 'wrap up',
      say: 'To recap: plants combine light, water, and carbon dioxide and store the released energy inside glucose molecules. The oxygen we breathe is a byproduct of water splitting. The Calvin cycle then assembles the glucose from carbon dioxide.',
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
    { intent: 'define', say: 'placeholder text goes here', headline: 'placeholder', points: ['todo', 'tbd', 'point 1'] }, // all placeholders
    { intent: 'not_a_real_intent', say: 'bad intent scene', headline: 'Bad intent' }, // invalid intent
    { intent: 'process', goal: 'real one', say: 'The fetch stage loads the next instruction from memory. The decode stage figures out which operation it is. The execute stage runs the operation against the registers.', steps: [{ title: 'Real step', detail: 'Actual content here' }] }, // valid
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

console.log('\n[4b] Per-unit timing: a box and its label land in the same beat (within the unit\'s stagger window)');
{
  const seq = buildWhiteboardForPart(photosynthesisPart, { lessonTitle: 'Biology 101' });
  // Per-unit design: the container (rect/circle/callout) lands first, then
  // labels stagger within the unit's 60% dwell. A label is "in the same
  // beat" as its box if it appears within 0.8s after the container and
  // before the next unit starts.
  const draws = seq.filter((f) => String(f.type).startsWith('draw_'));
  // Find each container (box) and check that at least one text label lands
  // within the next 0.8s — proving the box and label appear in the same
  // beat (not "box at 0s, label 2s later").
  const isContainer = (f) => /draw_(rect|circle|callout)/.test(String(f.type));
  let containerWithLabel = 0;
  let containerAlone = 0;
  for (let i = 0; i < draws.length; i++) {
    const f = draws[i];
    if (!isContainer(f)) continue;
    // Look ahead 0.8s for any text label
    let hasNearbyLabel = false;
    for (let j = i + 1; j < draws.length; j++) {
      if (draws[j].time - f.time > 0.8) break;
      if (draws[j].type === 'draw_text') { hasNearbyLabel = true; break; }
    }
    if (hasNearbyLabel) containerWithLabel++;
    else containerAlone++;
  }
  ok(
    containerWithLabel > containerAlone,
    `boxes with a label landing within 0.8s (${containerWithLabel}) outnumber boxes drawn alone (${containerAlone})`,
  );
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

console.log('\n[8] Beat-synced timing — per-unit dwell scales with the caption it owns');
{
  // A single beat with multiple units carrying very different caption lengths.
  // Per-unit timing means a unit with a long caption must get a longer dwell
  // than a unit with a short caption, capped at UNIT_MAX.
  const shortCap = 'A brief fact.';
  const longCap = 'This unit owns a long caption that explains the idea in detail so the student has time to read it. We need this caption to be long enough to push the per-unit dwell above the minimum baseline of 1.1 seconds and to dominate the dwell calculation for that unit.';
  const seq = composeStoryboard([
    { intent: 'process', goal: 'mix', data: { steps: [
      { title: 'Step A', detail: 'short' },
      { title: 'Step B', detail: 'another' },
      { title: 'Step C', detail: 'more' },
      { title: 'Step D', detail: 'final' },
    ]}, say: `${shortCap} ${longCap}` },
  ], { title: 'Sync', lessonTitle: 'Sync' }, 200);

  // Group draws by time (each cluster = one unit). Find the cluster whose
  // caption is the long one and the one whose caption is the short one; their
  // dwell times should differ in the expected direction.
  const captions = seq.filter((s) => s.type === 'draw_caption');
  ok(captions.length >= 2, `expected ≥2 caption-bearing units, got ${captions.length}`);
  if (captions.length >= 2) {
    const byCapLen = [...captions].sort((a, b) => a.content.length - b.content.length);
    const shortCapUnit = byCapLen[0];
    const longCapUnit = byCapLen[byCapLen.length - 1];
    // Find the next unit's start after each one — that gives its dwell.
    const sorted = [...seq].sort((a, b) => a.time - b.time);
    const dwellOf = (target) => {
      const idx = sorted.findIndex((s) => s === target);
      // Find the next distinct time after this caption.
      for (let j = idx + 1; j < sorted.length; j++) {
        if (sorted[j].time > target.time) return sorted[j].time - target.time;
      }
      return 0;
    };
    const shortDwell = dwellOf(shortCapUnit);
    const longDwell = dwellOf(longCapUnit);
    ok(longDwell >= shortDwell, `long-caption unit gets ≥ short-caption unit dwell (short=${shortDwell.toFixed(1)}s, long=${longDwell.toFixed(1)}s)`);
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
