import { createHash, randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Opt-in resumable AI pipeline for serverless (Vercel) runtimes where a single
 * function invocation is capped (`maxDuration`) well below the wall-clock the
 * whole generation pipeline can take.
 *
 * How it preserves the SAME output while fitting each invocation:
 *  - Every OpenRouter/AI result is cached, content-addressed by
 *    `provider|model|maxTokens|hash(prompt)`. Prompt + model fully determine the
 *    request, so a cache hit replays the identical JSON the live call produced.
 *  - While a resumable run is active (scoped via AsyncLocalStorage), `callAIRace`
 *    first consults the cache. Only *uncached* prompts invoke the live API.
 *  - A wall-clock budget caps each invocation. Once the budget is spent and there
 *    is still an uncached step to run, we throw `ResumeInterrupt`. Every interior
 *    try/catch in the pipeline rethrows it (they must NOT turn a pause into a
 *    local-content fallback), so the whole plan aborts cleanly.
 *  - The route driver catches the interrupt, leaves the lesson in `processing`,
 *    and self-triggers a fresh HTTP invocation to continue. On that second call
 *    everything already cached replays in milliseconds and the *next* uncached
 *    step runs, until the pipeline completes and the lesson flips to `ready`.
 *
 * Outside a scoped resumable run (`getResumeContext()` returns null) this module
 * is a no-op: no cache hit, no store, no interrupt — the local path is unchanged.
 */
export const RESUME_ENABLED = () => String(process.env.RESUMABLE_PIPELINE ?? '').toLowerCase() === 'true';

const als = new AsyncLocalStorage();

export class ResumeInterrupt extends Error {
  constructor() {
    super('ResumeInterrupt: budget exhausted, continue in a fresh invocation');
    this.name = 'ResumeInterrupt';
    this.code = 'RESUME_INTERRUPT';
  }
}

export function isResumeInterrupt(err) {
  return Boolean(err && (err.code === 'RESUME_INTERRUPT' || err instanceof ResumeInterrupt));
}

let cacheModel = null;

function getCacheModel() {
  if (cacheModel) return cacheModel;
  const name = 'AiResumeCache';
  if (mongoose.modelNames().includes(name)) {
    cacheModel = mongoose.model(name);
    return cacheModel;
  }
  const schema = new mongoose.Schema(
    {
      key: { type: String, required: true, index: true, unique: true },
      provider: { type: String },
      model: { type: String },
      kind: { type: String, default: 'json' },
      value: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
  );
  schema.index({ createdAt: 1 }, { expireAfterSeconds: Number(process.env.RESUME_CACHE_TTL ?? 7 * 24 * 3600) });
  cacheModel = mongoose.model(name, schema);
  return cacheModel;
}

function sha256(str) {
  return createHash('sha256').update(String(str || '')).digest('hex');
}

export function cacheKey(provider, model, maxTokens, prompt) {
  return [String(provider || ''), String(model || ''), String(maxTokens || ''), sha256(prompt)].join('|');
}

/** Run `task` inside a resumable scope. Returns whatever task returns. */
export async function applyResumeContext(task, opts = {}) {
  const budgetMs = Math.max(20_000, Number(opts?.budgetMs ?? process.env.RESUME_STEP_BUDGET_MS ?? 250_000));
  const store = {
    enabled: true,
    budgetMs,
    startedAt: Date.now(),
    budgetInterrupted: false,
  };
  return als.run(store, task);
}

export function getResumeContext() {
  const store = als.getStore();
  return store && store.enabled ? store : null;
}

async function readCache(key) {
  const Model = getCacheModel();
  const doc = await Model.findOne({ key }).lean();
  if (!doc) return null;
  const { createdAt } = doc;
  if (createdAt && Date.now() - new Date(createdAt).getTime() > (process.env.RESUME_CACHE_TTL_MS ?? 7 * 24 * 3600)) {
    await Model.deleteOne({ _id: doc._id }).catch(() => undefined);
    return null;
  }
  return doc.value ?? null;
}

async function writeCache(key, provider, model, value) {
  try {
    await getCacheModel().updateOne(
      { key },
      { $setOnInsert: { key, provider, model, value } },
      { upsert: true }
    );
  } catch (err) {
    console.warn(`[aiResume] cache store failed ${key}: ${err.message}`);
  }
}

/**
 * Core hook called by callAIRace when a resumable scope is active.
 * Returns cached JSON when present. Otherwise, when the invocation budget is
 * exhausted, throws ResumeInterrupt (so the pipeline pauses). Otherwise returns
 * null so the caller performs the real call and then calls persistResult().
 */
export async function resumeHook(prompt, maxTokens, aiProvider, analysisModel) {
  const ctx = getResumeContext();
  if (!ctx) return null;

  const model = String(analysisModel || aiProvider || '');
  const key = cacheKey(aiProvider, model, maxTokens, prompt);
  const cached = await readCache(key);
  if (cached !== null && cached !== undefined) {
    ctx.budgetInterrupted = false;
    return { cached, key, provider: aiProvider, model: analysisModel };
  }

  // Uncache step. Stop spending time in THIS invocation so it returns to the
  // scheduler inside the 300s cap. Resume spawns a fresh invocation that replays
  // everything cached so far and runs this step.
  const elapsed = Date.now() - ctx.startedAt;
  if (elapsed >= ctx.budgetMs) {
    ctx.budgetInterrupted = true;
    throw new ResumeInterrupt();
  }
  return { cached: null, key, provider: aiProvider, model: analysisModel };
}

/** Persist the result of a live AI call so a later invocation can replay it. */
export async function cacheResult(info, value) {
  if (!info?.key) return;
  await writeCache(info.key, info.provider, info.model, value);
}

export function budgetExceeded() {
  const ctx = getResumeContext();
  return ctx?.budgetInterrupted === true;
}