import 'dotenv/config';
import mongoose from 'mongoose';
import { applyResumeContext, resumeHook, cacheResult, getResumeContext } from '../src/services/aiResume.js';

process.env.RESUMABLE_PIPELINE = 'true';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_teacher', { serverSelectionTimeoutMS: 5000 });

const P = 'openrouter';
const M = 'test-model';
const T = 8000;
const PROMPT = 'hello world quick cache test';

const r = await import('../src/services/aiResume.js');

// In one context (invocation A), cache one prompt's result.
await applyResumeContext(async () => {
  const hook = await resumeHook(PROMPT, T, P, M);
  console.log('A: first call cached=null (expected):', hook.cached === null);
  await cacheResult(hook, { answer: 42 });
  const ctx = getResumeContext();
  console.log('A: wrote result (elapsed/budget ok)');
}, { budgetMs: 1_000_000 });

// Fresh context (invocation B = resume) must replay from cache, no AI call.
let hit = false;
await applyResumeContext(async () => {
  const hook = await resumeHook(PROMPT, T, P, M);
  hit = hook.cached !== null && hook.cached.answer === 42;
  console.log('B (resume) cache HIT answer=42:', hit);
}, { budgetMs: 1_000_000 });

// Budget-exhausted resumeHook must throw isResumeInterrupt BEFORE an uncached step.
let interrupted = false;
await applyResumeContext(async () => {
  try {
    const hook = await resumeHook('brand new uncached prompt', T, P, M);
    // elapsed will be > budget, so resumeHook throws
  } catch (e) {
    const { isResumeInterrupt } = await r;
    interrupted = isResumeInterrupt(e);
  }
}, { budgetMs: 1 });
console.log('C: budget-exhausted uncached call throws ResumeInterrupt:', interrupted);

await mongoose.disconnect();
const pass = hit && interrupted;
console.log(pass ? 'PASS' : 'FAIL');
process.exit(pass ? 0 : 1);