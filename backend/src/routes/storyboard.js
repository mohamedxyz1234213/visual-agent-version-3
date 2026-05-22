import { Router } from 'express';
import { LessonPart, StoryboardScene } from '../models/Lesson.js';

const router = Router();

// GET /api/v1/storyboard/part/:partId
router.get('/part/:partId', async (req, res, next) => {
  try {
    const part = await LessonPart.findById(req.params.partId).lean();
    if (!part) return res.status(404).json({ error: 'Part not found' });

    const scenes = await StoryboardScene.find({ partId: part._id })
      .sort({ timeOffset: 1 })
      .lean();

    res.json({
      id: part._id.toString(),
      lesson_id: part.lessonId.toString(),
      order_index: part.orderIndex,
      title: part.title,
      narration: part.narration ?? null,
      duration_seconds: part.durationSeconds,
      audio_url: part.audioUrl ?? null,
      part_type: part.partType,
      scenes: scenes.map((s) => ({
        id: s._id.toString(),
        time_offset: s.timeOffset,
        action_type: s.actionType,
        payload: s.payload,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
