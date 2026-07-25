import { Router } from 'express';
import { Lesson, LessonPart, StoryboardScene } from '../models/Lesson.js';
import { Quiz, QuizQuestion, QuizAttempt } from '../models/Quiz.js';
import { User } from '../auth/models/index.js';
import { requireAuth } from '../auth/middleware/auth.js';

const router = Router();
router.use(requireAuth);

// ── Serializers ───────────────────────────────────────────────────────────────

function serializeScene(s) {
  return {
    id: s._id.toString(),
    time_offset: s.timeOffset,
    action_type: s.actionType,
    payload: s.payload,
  };
}

function serializeQuestion(q) {
  return {
    id: q._id.toString(),
    order_index: q.orderIndex,
    question_type: q.questionType,
    question_text: q.questionText,
    options: q.options ?? null,
    explanation: q.explanation ?? null,
    difficulty: q.difficulty,
  };
}

function serializeQuiz(quiz, questions) {
  return {
    id: quiz._id.toString(),
    part_id: quiz.partId.toString(),
    questions: questions.map(serializeQuestion),
  };
}

function serializePart(part, scenes, quiz) {
  return {
    id: part._id.toString(),
    lesson_id: part.lessonId.toString(),
    order_index: part.orderIndex,
    title: part.title,
    narration: part.narration ?? null,
    duration_seconds: part.durationSeconds,
    audio_url: part.audioUrl ?? null,
    part_type: part.partType,
    scenes: scenes.map(serializeScene),
    quiz: quiz ?? null,
  };
}

function serializeLesson(lesson, parts) {
  return {
    id: lesson._id.toString(),
    title: lesson.title,
    subject: lesson.subject ?? null,
    source_filename: lesson.sourceFilename,
    source_file_url: lesson.sourceFileUrl ?? null,
    summary: lesson.summary ?? null,
    status: lesson.status,
    created_at: lesson.createdAt,
    series_id: lesson.seriesId?.toString() ?? null,
    lesson_index: lesson.lessonIndex ?? 0,
    total_lessons: lesson.totalLessons ?? 1,
    parts,
  };
}

// GET /api/v1/lessons
router.get('/', async (req, res, next) => {
  try {
    // Non-admin users only see their own lessons; admins see everything
    const filter = req.user?.role === 'admin' ? {} : { ownerId: req.user?._id };
    const lessons = await Lesson.find(filter).sort({ createdAt: -1 }).lean();
    const result = await Promise.all(
      lessons.map(async (l) => ({
        id: l._id.toString(),
        status: l.status,
        title: l.title,
        subject: l.subject ?? null,
        summary: l.summary ?? null,
        partsCount: await LessonPart.countDocuments({ lessonId: l._id }),
        created_at: l.createdAt,
      }))
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lessons/series/:seriesId — all lessons in a series (for progress sidebar)
router.get('/series/:seriesId', async (req, res, next) => {
  try {
    const lessons = await Lesson.find({ seriesId: req.params.seriesId })
      .sort({ lessonIndex: 1 })
      .lean();
    const result = lessons.map((l) => ({
      id: l._id.toString(),
      status: l.status,
      title: l.title,
      lesson_index: l.lessonIndex ?? 0,
      total_lessons: l.totalLessons ?? 1,
      processing_step: l.processingStep ?? 'queued',
      error_message: l.errorMessage ?? null,
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lessons/:id
router.get('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // Non-admin users may only view their own lessons (or published/ready ones)
    if (req.user?.role !== 'admin') {
      if (lesson.status === 'ready') {
        // ready lessons are viewable by any authenticated user
      } else {
        const ownerId = lesson.ownerId?.toString();
        if (!ownerId || ownerId !== req.user?._id?.toString()) {
          return res.status(404).json({ error: 'Lesson not found' });
        }
      }
    }

    const parts = await LessonPart.find({ lessonId: lesson._id }).sort({ orderIndex: 1 }).lean();

    const serializedParts = await Promise.all(
      parts.map(async (part) => {
        const scenes = await StoryboardScene.find({ partId: part._id })
          .sort({ timeOffset: 1 })
          .lean();

        let quiz = null;
        if (['quiz', 'final_quiz'].includes(part.partType)) {
          const quizDoc = await Quiz.findOne({ partId: part._id }).lean();
          if (quizDoc) {
            const questions = await QuizQuestion.find({ quizId: quizDoc._id })
              .sort({ orderIndex: 1 })
              .lean();
            quiz = serializeQuiz(quizDoc, questions);
          }
        }

        return serializePart(part, scenes, quiz);
      })
    );

    res.json(serializeLesson(lesson, serializedParts));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/lessons/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (req.user?.role !== 'admin' && lesson.ownerId?.toString() !== req.user?._id?.toString()) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    await Lesson.findByIdAndDelete(req.params.id);

    const parts = await LessonPart.find({ lessonId: req.params.id }).lean();
    const partIds = parts.map((p) => p._id);
    await LessonPart.deleteMany({ lessonId: req.params.id });
    await StoryboardScene.deleteMany({ partId: { $in: partIds } });

    const quizzes = await Quiz.find({ partId: { $in: partIds } }).lean();
    const quizIds = quizzes.map((q) => q._id);
    await Quiz.deleteMany({ partId: { $in: partIds } });
    await QuizQuestion.deleteMany({ quizId: { $in: quizIds } });
    await QuizAttempt.deleteMany({ quizId: { $in: quizIds } });

    // Free up one AI request slot so the user can generate a new lesson
    if (req.user?.role !== 'admin') {
      await User.updateOne(
        { _id: req.user._id, aiRequestsUsed: { $gt: 0 } },
        { $inc: { aiRequestsUsed: -1 } },
      );
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
