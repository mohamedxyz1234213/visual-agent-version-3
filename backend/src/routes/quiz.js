import { Router } from 'express';
import { Quiz, QuizQuestion, QuizAttempt } from '../models/Quiz.js';
import { Lesson, LessonPart } from '../models/Lesson.js';
import { evaluate } from '../services/quizEvaluator.js';
import { requireAuth } from '../auth/middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/v1/quiz/part/:partId
router.get('/part/:partId', async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ partId: req.params.partId }).lean();
    if (!quiz) return res.status(404).json({ error: 'No quiz for this part' });

    // Non-admin users may only access quizzes for their own lessons
    if (req.user?.role !== 'admin') {
      const part = await LessonPart.findById(quiz.partId).lean();
      const lesson = part ? await Lesson.findById(part.lessonId).lean() : null;
      if (!lesson || lesson.ownerId?.toString() !== req.user?._id?.toString()) {
        return res.status(404).json({ error: 'No quiz for this part' });
      }
    }

    const questions = await QuizQuestion.find({ quizId: quiz._id })
      .sort({ orderIndex: 1 })
      .lean();

    res.json({
      id: quiz._id.toString(),
      part_id: quiz.partId.toString(),
      questions: questions.map((q) => ({
        id: q._id.toString(),
        order_index: q.orderIndex,
        question_type: q.questionType,
        question_text: q.questionText,
        options: q.options ?? null,
        explanation: q.explanation ?? null,
        difficulty: q.difficulty,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/quiz/:quizId/attempt
router.post('/:quizId/attempt', async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = await QuizQuestion.find({ quizId: quiz._id }).lean();
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers must be an object' });
    }

    // Look up the lesson via LessonPart to get the AI provider preference
    const part = await LessonPart.findById(quiz.partId).lean();
    if (!part) return res.status(404).json({ error: 'Quiz part not found' });
    const lesson = await Lesson.findById(part.lessonId).lean();

    // Non-admin users may only submit attempts for their own lessons
    if (req.user?.role !== 'admin') {
      if (!lesson || lesson.ownerId?.toString() !== req.user?._id?.toString()) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
    }

    const aiProvider = lesson?.aiProvider || null;
    const analysisModel = lesson?.analysisModel || null;

    const { score, feedback, passed } = await evaluate(questions, answers, aiProvider, analysisModel);

    // Always record the user id as the session id so the dashboard stats are
    // scoped to the current user (admin sees everything because role check above).
    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      sessionId: req.user._id.toString(),
      answers,
      score,
      feedback,
      passed,
    });

    res.status(201).json({
      id: attempt._id.toString(),
      quiz_id: attempt.quizId.toString(),
      score: attempt.score,
      feedback: attempt.feedback,
      passed: attempt.passed,
      created_at: attempt.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
