import { Router } from 'express';
import { Lesson } from '../models/Lesson.js';
import { finalizeLesson } from '../services/lessonFinalizer.js';
import { RESUME_ENABLED } from '../services/aiResume.js';
import { scheduleBackgroundTask } from '../utils/backgroundTask.js';

const router = Router();

/**
 * Internal resume endpoint. Reached by a self-HTTP call from triggerResume()
 * so that a paused lesson continues in a FRESH function invocation with a full
 * time budget. Protected by a shared secret header, not user auth (the server
 * has no user session on these background self-calls).
 */
router.post('/lessons/resume/:lessonId', async (req, res, next) => {
  try {
    if (!RESUME_ENABLED()) {
      return res.status(403).json({ error: 'Resumable pipeline disabled' });
    }
    const secret = process.env.RESUME_SECRET;
    if (!secret || req.get('x-resume-secret') !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const lesson = await Lesson.findById(req.params.lessonId).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.status === 'ready') return res.json({ status: 'already_ready' });
    if (lesson.status === 'error') return res.json({ status: 'error' });

    const seriesId = lesson.seriesId?.toString?.();
    const params = {
      lessonId: lesson._id.toString(),
      seriesId,
      rawText: lesson.rawText,
      userInstructions: lesson.userInstructions ?? undefined,
      analysisModel: lesson.analysisModel,
      aiProvider: lesson.aiProvider || 'openrouter',
      explanationMode: lesson.explanationMode || 'full_lesson',
      lessonIntent: lesson.lessonIntent || 'teach',
      // Resume by reprocessing the content already in the DB; textless uploads
      // restart the full pipeline, which is safe because the AI cache replays
      // all prior work instantly.
      sourceMode: lesson.sourceMode || (lesson.rawText ? 'topic' : 'document'),
      aiLogId: lesson.aiRequestLogId?.toString?.() ?? null,
    };

    scheduleBackgroundTask(`resume lesson ${req.params.lessonId}`, () => finalizeLesson(params));
    res.json({ status: 'scheduled' });
  } catch (err) {
    next(err);
  }
});

export default router;