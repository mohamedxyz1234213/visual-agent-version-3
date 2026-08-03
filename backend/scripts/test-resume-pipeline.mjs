import 'dotenv/config';
import mongoose from 'mongoose';
import { planLessonSeries } from '../src/services/aiPlanner.js';
import { applyResumeContext, isResumeInterrupt, RESUME_ENABLED, getResumeContext } from '../src/services/aiResume.js';

// Opt-in pipeline + very short budget so the FIRST uncached AI step fits but the
// SECOND uncached step (refinement) triggers ResumeInterrupt.
process.env.RESUMABLE_PIPELINE = 'true';
process.env.RESUME_STEP_BUDGET_MS = '15000';
process.env.RESUME_CACHE_TTL = '86400';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_teacher';
await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

const provider = 'openrouter';
const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b:a:free';
const topic = 'Explain how a for loop works in JavaScript with a counting example.';

let interrupted = false;
let firstPlan = null;
const steps = [];
const report = (s) => { steps.push(s); console.log('  [chunk1 step]', s); };

const t0 = Date.now();
try {
  await applyResumeContext(() => planLessonSeries(topic, null, model, report, provider, 'full_lesson', 'topic', 'teach'), { budgetMs: 15_000 });
} catch (err) {
  if (isResumeInterrupt(err)) { interrupted = true; console.log('>> Chunk 1 interrupted by budget (expected) after', Date.now() - t0, 'ms'); }
  else { console.error('>> Chunk 1 threw NON-resume error:', err.message); process.exit(1); }
}

const cacheCount = await mongoose.connection.collection('airesumecaches').countDocuments({});
console.log(`>> cached AI results after chunk 1: ${cacheCount}`);

if (!interrupted) {
  console.log('NOTE: chunk 1 finished within budget — nothing to resume. Lower budget to force interrupt.');
}

// Chunk 2: resume with a large budget. Everything cached replays in ms; only the
// remaining uncached step runs, then the plan completes.
console.log('\n=== Chunk 2 (resume, full budget) ===');
const steps2 = [];
const report2 = (s) => { steps2.push(s); console.log('  [chunk2 step]', s); };
const t1 = Date.now();
const result2 = await applyResumeContext(
  () => planLessonSeries(topic, null, model, report2, provider, 'full_lesson', 'topic', 'teach'),
  { budgetMs: 600_000 }
);
console.log(`>> Chunk 2 completed in ${Date.now() - t1} ms`);
console.log('>> title:', result2.firstLesson.title);
console.log('>> parts:', result2.firstLesson.parts.length);

// Chunk 3: fully warm cache — prove identical output + near-instant replay.
const steps3 = [];
const t2 = Date.now();
const result3 = await applyResumeContext(
  () => planLessonSeries(topic, null, model, (s) => steps3.push(s), provider, 'full_lesson', 'topic', 'teach'),
  { budgetMs: 600_000 }
);
console.log(`>> Chunk 3 (warm cache) completed in ${Date.now() - t2} ms`);

const same = JSON.stringify(result3.firstLesson) === JSON.stringify(result2.firstLesson);
console.log('\n=== RESULT ===');
console.log('interrupted in chunk1:', interrupted);
console.log('chunk2 steps:', steps2.join(','));
console.log('chunk3 steps:', steps3.join(','));
console.log('chunk2 == chunk3 output (identical):', same);
if (same) {
  console.log('PASS: resumable pipeline produces byte-identical lesson across chunks');
} else {
  console.log('FAIL: outputs differ between resume runs');
}
await mongoose.disconnect();
process.exit(same ? 0 : 1);
