import { Lesson, LessonPart } from '../models/Lesson.js';
import { LessonSeries } from '../models/LessonSeries.js';
import { planLessonSeries } from './aiPlanner.js';
import { saveLessonPlan } from './storyboardGenerator.js';
import { generateLessonAudioArtifacts } from './ttsService.js';
import { toUserFacingError } from '../utils/errors.js';
import { scheduleBackgroundTask } from '../utils/backgroundTask.js';
import { startLessonHeartbeat } from '../utils/heartbeat.js';
import { applyResumeContext, isResumeInterrupt, RESUME_ENABLED } from './aiResume.js';

/**
 * Shared finalize pipeline used by BOTH explain.js and upload.js (lesson 1),
 * and by the internal resume endpoint. On serverless runtimes with
 * RESUMABLE_PIPELINE=1 this runs the AI planning under a wall-clock budget;
 * when the budget is spent mid-plan it persists progress, leaves the lesson in
 * `processing`, and self-triggers a fresh invocation that replays all cached AI
 * steps (content-addressed) and continues where the previous one stopped.
 *
 * Because ResumeInterrupt can only be raised *inside* AI planning (before an
 * uncached call), saveLessonPlan / audio generation always run exactly once in
 * the final invocation — so parts are never duplicated.
 */
export async function finalizeLesson({
  lessonId,
  seriesId,
  rawText,
  userInstructions,
  analysisModel,
  aiProvider,
  explanationMode = 'full_lesson',
  lessonIntent = 'teach',
  sourceMode = 'document',
  aiLogId = null,
}) {
  const markAiLog = async (status, errorMessage = null) => {
    if (!aiLogId) return;
    try {
      const { AiRequestLog } = await import('../auth/models/AiRequestLog.js');
      await AiRequestLog.updateOne(
        { _id: aiLogId },
        { $set: { status, errorMessage: errorMessage || undefined } }
      );
    } catch (err) {
      console.warn(`[finalize] aiLog update failed: ${err.message}`);
    }
  };

  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return;
    if (lesson.status === 'ready') return;

    let planResult = null;
    const planningWork = async () => {
      if (lesson.rawText !== rawText) {
        lesson.rawText = rawText;
        await lesson.save();
      }
      await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'analyzing_document' });
      const stopHeartbeat = startLessonHeartbeat(lessonId);
      try {
        planResult = await planLessonSeries(
          rawText,
          userInstructions,
          analysisModel,
          async (step) => {
            await Lesson.findByIdAndUpdate(lessonId, { processingStep: step });
          },
          aiProvider,
          explanationMode,
          sourceMode,
          lessonIntent,
        );
      } finally {
        stopHeartbeat();
      }
    };

    await applyResumeContext(planningWork);

    const { firstLesson, remainingSpecs, totalLessons, courseTitle } = planResult;

    // ── Persist series + first lesson (runs once, only after planning done) ──
    lesson.seriesId = seriesId;
    lesson.lessonIndex = 0;
    lesson.totalLessons = totalLessons;
    await lesson.save();
    await LessonSeries.findByIdAndUpdate(seriesId, {
      totalLessons,
      remainingSpecs,
      completedLessons: 0,
    });

    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'saving' });
    await saveLessonPlan(lesson, firstLesson);

    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'finalizing' });
    const parts = await LessonPart.find({ lessonId: lesson._id });
    await generateLessonAudioArtifacts(parts);

    lesson.status = 'ready';
    lesson.processingStep = 'done';
    lesson.errorMessage = null;
    lesson.lastHeartbeat = null;
    await lesson.save();

    await LessonSeries.findByIdAndUpdate(seriesId, { $inc: { completedLessons: 1 } });
    await markAiLog('completed');

    console.log(`[finalize] lesson ${lessonId} ready (${parts.length} parts, ${totalLessons} lesson(s))`);

    if (remainingSpecs.length > 0) {
      scheduleBackgroundTask(`process remaining lessons for series ${seriesId}`, () =>
        processRemainingLessons(seriesId, lesson.sourceFilename, totalLessons, aiProvider, analysisModel)
      );
    }
  } catch (err) {
    if (isResumeInterrupt(err)) {
      console.log(`[finalize] budget exhausted for ${lessonId}, continuing in a fresh invocation...`);
      await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'resuming' });
      triggerResume(lessonId);
      return;
    }
    console.error(`[finalize] Lesson ${lessonId} failed:`, err);
    await Lesson.findByIdAndUpdate(lessonId, { status: 'error', errorMessage: toUserFacingError(err) });
    await markAiLog('failed', toUserFacingError(err));
  }
}

/**
 * Fire a fresh invocation that continues a paused lesson. On serverless this is
 * the mechanism that resets the 300s clock: each self-call is a new function
 * invocation with its own full budget. Uses a shared secret header so the
 * internal route can't be abused externally.
 */
export async function triggerResume(lessonId) {
  if (!RESUME_ENABLED()) return;
  const secret = process.env.RESUME_SECRET;
  const base = process.env.BACKEND_PUBLIC_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (!base || !secret) {
    console.warn(`[finalize] resume not triggered for ${lessonId} (no BACKEND_PUBLIC_URL or RESUME_SECRET)`);
    return;
  }
  try {
    const url = `${base.replace(/\/$/, '')}/api/v1/internal/lessons/resume/${lessonId}`;
    console.log(`[finalize] triggering resume for ${lessonId} → ${url}`);
    await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-resume-secret': secret,
      },
      body: JSON.stringify({}),
    });
  } catch (err) {
    console.warn(`[finalize] resume trigger failed for ${lessonId}: ${err.message}`);
  }
}

// ── Background: generate lessons 2..N while user watches lesson 1 ───────────
async function processRemainingLessons(seriesId, sourceFilename, totalLessons, aiProvider = 'openrouter', analysisModel = null) {
  const series = await LessonSeries.findById(seriesId);
  if (!series || !series.remainingSpecs?.length) return;

  const model = analysisModel || series.analysisModel || null;
  const firstLesson = await Lesson.findOne({ seriesId }).select('ownerId').lean();
  const ownerId = firstLesson?.ownerId || null;

  const { planSingleLesson } = await import('./aiPlanner.js');
  const CONCURRENCY = 3;
  const specs = series.remainingSpecs;

  for (let batch = 0; batch < specs.length; batch += CONCURRENCY) {
    const chunk = specs.slice(batch, batch + CONCURRENCY);
    const tasks = chunk.map(async (spec, chunkIdx) => {
      const lessonIndex = batch + chunkIdx + 1;
      const lesson = await Lesson.create({
        title: spec.title || `Lesson ${lessonIndex + 1}`,
        sourceFilename,
        aiProvider,
        analysisModel: model,
        seriesId,
        lessonIndex,
        totalLessons,
        status: 'processing',
        processingStep: 'planning_outline',
        ownerId,
      });
      try {
        console.log(`[upload] Background lesson ${lessonIndex + 1}/${totalLessons}: "${spec.title}" (${aiProvider}/${model})…`);
        const plan = await planSingleLesson(spec, aiProvider, model);
        await saveLessonPlan(lesson, plan);
        await LessonSeries.findByIdAndUpdate(seriesId, { $inc: { completedLessons: 1 } });
        console.log(`[upload] Background lesson ${lessonIndex + 1} ready.`);
      } catch (err) {
        if (isResumeInterrupt(err)) {
          console.log(`[upload] Background lesson ${lessonIndex + 1} interrupted, will retry later.`);
          return;
        }
        console.error(`Background lesson ${lessonIndex + 1} failed:`, err.message);
        await Lesson.findByIdAndUpdate(lesson._id, { status: 'error', errorMessage: toUserFacingError(err) });
      }
    });
    await Promise.allSettled(tasks);
  }
}
