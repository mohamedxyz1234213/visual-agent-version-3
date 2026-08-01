import { Router } from 'express';
import { Lesson, LessonPart } from '../models/Lesson.js';
import { LessonSeries } from '../models/LessonSeries.js';
import { planLessonSeries } from '../services/aiPlanner.js';
import { saveLessonPlan } from '../services/storyboardGenerator.js';
import { generateLessonAudioArtifacts } from '../services/ttsService.js';
import { resolveOpenRouterModel } from '../services/openrouterConfig.js';
import { toUserFacingError } from '../utils/errors.js';
import { reserveAiRequest, markAiRequestFinished } from '../auth/services/aiQuota.js';
import { requireAuth } from '../auth/middleware/auth.js';
import { AiRequestLog } from '../auth/models/index.js';

const router = Router();
router.use(requireAuth);

function normalizeProvider(raw) {
  const p = String(raw || '').trim().toLowerCase();
  if (p === 'openrouter' || p === 'open-router' || p === 'or') return 'openrouter';
  return null;
}

function resolveModel(_provider, fromBody) {
  return resolveOpenRouterModel(fromBody);
}

import { scheduleBackgroundTask } from '../utils/backgroundTask.js';
// Body: { text, subject?, user_instructions?, explanation_mode?, ai_provider?, analysis_model? }
router.post('/', async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    if (text.length < 2) {
      return res.status(400).json({ error: 'text must be at least 2 characters' });
    }

    const subject = req.body.subject || null;
    const userInstructions = req.body.user_instructions || null;
    const explanationMode = req.body.explanation_mode || 'full_lesson';
    const lessonIntent = req.body.lesson_intent || 'teach';
    const aiProvider = normalizeProvider(req.body.ai_provider)
      || normalizeProvider(process.env.ACTIVE_LLM)
      || 'openrouter';
    const analysisModel = resolveModel(aiProvider, req.body.analysis_model);

    const sourceTitle = text.slice(0, 60).replace(/\s+/g, ' ') + (text.length > 60 ? '…' : '');

    // Enforce per-user AI quota
    const { log: aiLog } = await reserveAiRequest({
      user: req.user,
      type: 'explain',
      provider: aiProvider,
      model: analysisModel,
      sourceFilename: 'direct-text',
      req,
    });

    const series = await LessonSeries.create({
      userInstructions,
      analysisModel,
      sourceFilename: 'direct-text',
      totalLessons: 1,
      completedLessons: 0,
    });

    const lesson = await Lesson.create({
      title: sourceTitle,
      sourceFilename: 'direct-text',
      subject,
      aiProvider,
      analysisModel,
      seriesId: series._id,
      lessonIndex: 0,
      totalLessons: 1,
      status: 'processing',
      ownerId: req.user._id,
    });

    if (aiLog) {
      await AiRequestLog.updateOne({ _id: aiLog._id }, { $set: { lessonId: lesson._id, seriesId: series._id } });
    }

    scheduleBackgroundTask(`process lesson ${lesson._id}`, () =>
      processDirectText(
        lesson._id.toString(),
        series._id.toString(),
        text,
        userInstructions,
        analysisModel,
        aiProvider,
        explanationMode,
        lessonIntent,
        aiLog?._id?.toString(),
      )
    );

    res.status(202).json({
      id: lesson._id.toString(),
      series_id: series._id.toString(),
      status: 'processing',
      parts_count: 0,
    });
  } catch (err) {
    next(err);
  }
});

async function processDirectText(lessonId, seriesId, rawText, userInstructions, analysisModel, aiProvider, explanationMode = 'full_lesson', lessonIntent = 'teach', aiLogId = null) {
  try {
    const provider = normalizeProvider(aiProvider) || 'openrouter';
    const model = resolveModel(provider, analysisModel);

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return;

    // Skip extraction — use provided text directly
    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'analyzing_document' });
    lesson.rawText = rawText;
    await lesson.save();

    const { firstLesson, remainingSpecs, totalLessons } = await planLessonSeries(
      rawText,
      userInstructions,
      model,
      async (step) => {
        await Lesson.findByIdAndUpdate(lessonId, { processingStep: step });
      },
      provider,
      explanationMode,
      'topic',
      lessonIntent,
    );

    lesson.seriesId = seriesId;
    lesson.lessonIndex = 0;
    lesson.totalLessons = totalLessons;
    await lesson.save();

    await LessonSeries.findByIdAndUpdate(seriesId, { totalLessons, remainingSpecs, completedLessons: 0 });

    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'saving' });
    await saveLessonPlan(lesson, firstLesson);

    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'finalizing' });
    const parts = await LessonPart.find({ lessonId: lesson._id });
    await generateLessonAudioArtifacts(parts);

    lesson.status = 'ready';
    lesson.processingStep = 'done';
    await lesson.save();
    await LessonSeries.findByIdAndUpdate(seriesId, { $inc: { completedLessons: 1 } });

    if (aiLogId) {
      await AiRequestLog.updateOne({ _id: aiLogId }, { $set: { status: 'completed' } });
    }
  } catch (err) {
    console.error(`Direct-text lesson processing failed for ${lessonId}:`, err);
    await Lesson.findByIdAndUpdate(lessonId, { status: 'error', errorMessage: toUserFacingError(err) });
    if (aiLogId) {
      await AiRequestLog.updateOne({ _id: aiLogId }, { $set: { status: 'failed', errorMessage: toUserFacingError(err) } });
    }
  }
}

export default router;
