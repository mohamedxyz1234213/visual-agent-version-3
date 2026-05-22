import { Router } from 'express';
import multer from 'multer';
import { Lesson, LessonPart } from '../models/Lesson.js';
import { LessonSeries } from '../models/LessonSeries.js';
import { extractText } from '../services/documentExtractor.js';
import { planLessonSeries, planSingleLesson } from '../services/aiPlanner.js';
import { saveLessonPlan } from '../services/storyboardGenerator.js';
import { synthesize } from '../services/ttsService.js';
import { uploadFile, uploadAudio } from '../services/storageService.js';
import { BLAZE_MODELS, getBlazeConfig, resolveBlazeModel } from '../services/blazeConfig.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ── Available AI providers + models (must match frontend PROVIDER_MODELS) ───
const AI_PROVIDERS = [
  {
    id: 'blaze',
    label: 'BlazeAI',
    icon: '🔥',
    name: 'BlazeAI (Multi-model)',
    desc: 'Free tier with multiple models',
    badge: null,
    models: BLAZE_MODELS,
  },
];

function normalizeProvider(raw) {
  const p = String(raw || '').trim().toLowerCase();
  if (p === 'deepseek') return 'blaze';
  if (p === 'blaze' || p === 'blazeai') return 'blaze';
  return null;
}

function resolveAnalysisModel(aiProvider, fromBody) {
  const { defaultDeepModel } = getBlazeConfig();
  return resolveBlazeModel(fromBody, defaultDeepModel);
}

function scheduleBackgroundTask(label, task) {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((err) => {
        console.error(`[upload] Background task failed: ${label}`, err);
      });
  });
}

// GET /api/v1/upload/providers
router.get('/providers', (_req, res) => {
  res.json({ providers: AI_PROVIDERS });
});

// GET /api/v1/upload/test-ai?provider=blaze — verify Blaze connectivity
router.get('/test-ai', async (req, res, next) => {
  try {
    const aiProvider = normalizeProvider(req.query.provider) || 'blaze';
    const analysisModel = resolveAnalysisModel(aiProvider, req.query.model);
    const { testAIConnection } = await import('../services/aiPlanner.js');
    const result = await testAIConnection(aiProvider, analysisModel);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/upload
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File required' });

    const { originalname, buffer } = req.file;
    const subject = req.body.subject || null;
    const userInstructions = req.body.user_instructions || null;
    const lessonIntent = req.body.lesson_intent || 'teach';
    const aiProvider = normalizeProvider(req.body.ai_provider) || normalizeProvider(process.env.ACTIVE_LLM) || 'blaze';
    const analysisModel = resolveAnalysisModel(aiProvider, req.body.analysis_model);
    const explanationMode = req.body.explanation_mode || 'full_lesson';

    console.log(`[upload] Received: ai_provider=${aiProvider}, analysis_model=${analysisModel}, file=${originalname}`);
    console.log(`[upload] BlazeAI: key=${process.env.BLAZE_API_KEY ? 'SET' : 'MISSING'}, base=${process.env.BLAZE_BASE_URL || 'https://blazeai.boxu.dev/api'}`);

    // Create series tracking document
    const series = await LessonSeries.create({
      userInstructions,
      analysisModel,
      sourceFilename: originalname,
      totalLessons: 1, // updated after Phase 0 discovers the real count
      completedLessons: 0,
    });

    // Create stub for lesson 1 immediately so we have an id to return
    const lesson = await Lesson.create({
      title: originalname,
      sourceFilename: originalname,
      subject,
      aiProvider,
      analysisModel,
      seriesId: series._id,
      lessonIndex: 0,
      totalLessons: 1,
      status: 'processing',
    });

    // Fire-and-forget background processing with rejection handling.
    scheduleBackgroundTask(`process lesson ${lesson._id}`, () =>
      processLesson(
        lesson._id.toString(),
        series._id.toString(),
        buffer,
        originalname,
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

// GET /api/v1/upload/status/:lessonId
router.get('/status/:lessonId', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    const partsCount = await LessonPart.countDocuments({ lessonId: lesson._id });
    res.json({
      id: lesson._id.toString(),
      status: lesson.status,
      title: lesson.title,
      parts_count: partsCount,
      processing_step: lesson.processingStep ?? 'queued',
      error_message: lesson.errorMessage ?? null,
      series_id: lesson.seriesId?.toString() ?? null,
      lesson_index: lesson.lessonIndex ?? 0,
      total_lessons: lesson.totalLessons ?? 1,
    });
  } catch (err) {
    next(err);
  }
});

async function processLesson(lessonId, seriesId, buffer, filename, userInstructions, analysisModel, aiProvider = 'blaze', explanationMode = 'full_lesson', lessonIntent = 'teach') {
  try {
    const provider = normalizeProvider(aiProvider) || 'blaze';
    const model = resolveAnalysisModel(provider, analysisModel);
    console.log(`[upload] processLesson: provider=${provider}, model=${model}`);

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return;

    // 1. Upload source file to storage
    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'uploading' });
    const fileUrl = await uploadFile(buffer, filename, 'sources');
    if (fileUrl) lesson.sourceFileUrl = fileUrl;

    // 2. Extract text
    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'extracting' });
    const rawText = await extractText(buffer, filename, provider, model);
    lesson.rawText = rawText;
    await lesson.save();

    // 3. AI planning — uses the provider chosen by the user
    //    onProgress callback writes each step directly to DB for real-time updates.
    const { firstLesson, remainingSpecs, totalLessons, courseTitle } = await planLessonSeries(
      rawText,
      userInstructions,
      model,
      async (step) => {
        await Lesson.findByIdAndUpdate(lessonId, { processingStep: step });
      },
      provider,
      explanationMode,
      'document',
      lessonIntent,
    );

    // Update lesson 1 with series metadata
    lesson.seriesId = seriesId;
    lesson.lessonIndex = 0;
    lesson.totalLessons = totalLessons;
    await lesson.save();

    // Update series with final lesson count + remaining specs for background jobs
    await LessonSeries.findByIdAndUpdate(seriesId, {
      totalLessons,
      remainingSpecs,
      completedLessons: 0, // will be incremented below
    });

    // 4. Save lesson 1 to database
    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'saving' });
    await saveLessonPlan(lesson, firstLesson);

    // 5. TTS narration (optional — skipped if provider is none)
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

    // Increment series completed count
    await LessonSeries.findByIdAndUpdate(seriesId, { $inc: { completedLessons: 1 } });

    // 6. Background: generate remaining lessons while user watches lesson 1
    if (remainingSpecs.length > 0) {
      console.log(`[upload] Scheduling ${remainingSpecs.length} background lesson(s)…`);
      scheduleBackgroundTask(`process remaining lessons for series ${seriesId}`, () =>
        processRemainingLessons(seriesId, filename, totalLessons, provider, model)
      );
    }
  } catch (err) {
    console.error(`Lesson 1 processing failed for ${lessonId}:`, err);
    await Lesson.findByIdAndUpdate(lessonId, { status: 'error', errorMessage: err.message });
  }
}

// ─── Background: generate lessons 2..N in parallel while user watches lesson 1 ─
async function processRemainingLessons(seriesId, sourceFilename, totalLessons, aiProvider = 'blaze', analysisModel = null) {
  const series = await LessonSeries.findById(seriesId);
  if (!series || !series.remainingSpecs?.length) return;

  const model = analysisModel || series.analysisModel || null;

  // Process up to 3 lessons at a time for faster generation
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
      });

      try {
        console.log(`[upload] Background lesson ${lessonIndex + 1}/${totalLessons}: "${spec.title}" (${aiProvider}/${model})…`);
        const plan = await planSingleLesson(spec, aiProvider, model);
        await saveLessonPlan(lesson, plan);
        await LessonSeries.findByIdAndUpdate(seriesId, { $inc: { completedLessons: 1 } });
        console.log(`[upload] Background lesson ${lessonIndex + 1} ready.`);
      } catch (err) {
        console.error(`Background lesson ${lessonIndex + 1} failed:`, err.message);
        await Lesson.findByIdAndUpdate(lesson._id, { status: 'error', errorMessage: err.message });
      }
    });

    await Promise.allSettled(tasks);
  }
}

export default router;
