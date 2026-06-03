import { Router } from 'express';
import { Lesson, LessonPart } from '../models/Lesson.js';
import { LessonSeries } from '../models/LessonSeries.js';
import { planLessonSeries } from '../services/aiPlanner.js';
import { saveLessonPlan } from '../services/storyboardGenerator.js';
import { synthesize } from '../services/ttsService.js';
import { uploadAudio } from '../services/storageService.js';
import { getBlazeConfig, resolveBlazeModel } from '../services/blazeConfig.js';
import { toUserFacingError } from '../utils/errors.js';

const router = Router();

function normalizeProvider(raw) {
  const p = String(raw || '').trim().toLowerCase();
  if (p === 'deepseek') return 'blaze';
  if (p === 'blaze' || p === 'blazeai') return 'blaze';
  return null;
}

function resolveModel(provider, fromBody) {
  const { defaultDeepModel } = getBlazeConfig();
  return resolveBlazeModel(fromBody, defaultDeepModel);
}

function scheduleBackgroundTask(label, task) {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((err) => {
        console.error(`[explain] Background task failed: ${label}`, err);
      });
  });
}

// POST /api/v1/explain
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
      || 'blaze';
    const analysisModel = resolveModel(aiProvider, req.body.analysis_model);

    const sourceTitle = text.slice(0, 60).replace(/\s+/g, ' ') + (text.length > 60 ? '…' : '');

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
    });

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

async function processDirectText(lessonId, seriesId, rawText, userInstructions, analysisModel, aiProvider, explanationMode = 'full_lesson', lessonIntent = 'teach') {
  try {
    const provider = normalizeProvider(aiProvider) || 'blaze';
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
    for (const part of parts) {
      if (part.narration && part.partType === 'content') {
        try {
          const audio = await synthesize(part.narration, part._id.toString());
          if (audio) {
            const url = await uploadAudio(audio, part._id.toString());
            if (url) { part.audioUrl = url; await part.save(); }
          }
        } catch (ttsErr) {
          console.warn(`TTS failed for part ${part._id}:`, ttsErr.message);
        }
      }
    }

    lesson.status = 'ready';
    lesson.processingStep = 'done';
    await lesson.save();
    await LessonSeries.findByIdAndUpdate(seriesId, { $inc: { completedLessons: 1 } });
  } catch (err) {
    console.error(`Direct-text lesson processing failed for ${lessonId}:`, err);
    await Lesson.findByIdAndUpdate(lessonId, { status: 'error', errorMessage: toUserFacingError(err) });
  }
}

export default router;
