import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Student, AIConversation, Submission, Progress } from '../models/index.js';
import { Lesson, LessonPart } from '../../models/Lesson.js';
import { LessonSeries } from '../../models/LessonSeries.js';
import { planLessonSeries } from '../../services/aiPlanner.js';
import { saveLessonPlan } from '../../services/storyboardGenerator.js';
import { synthesize } from '../../services/ttsService.js';
import { uploadAudio } from '../../services/storageService.js';
import { reserveAiRequest } from '../../auth/services/aiQuota.js';
import { AiRequestLog } from '../../auth/models/index.js';
import { toUserFacingError } from '../../utils/errors.js';
import { getBlazeConfig, resolveBlazeModel } from '../../services/blazeConfig.js';
import { resolveBlazeAPIModel } from '../../services/blazeapiConfig.js';
import { processVoice, submitCode, startSession } from '../../services/fastapiClient.js';

const router = Router();

router.use(requireAuth);

// ── POST /api/v1/ai/avatar/start ──────────────────────────────────────────────
router.post('/avatar/start', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const { topic, dialect, subjectId, lessonId } = req.body;
    const sessionId = crypto.randomUUID();

    const conversation = await AIConversation.create({
      studentId: student._id,
      sessionId,
      topic: topic || 'General Programming',
      subjectId,
      lessonId,
      status: 'active',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: generateSystemPrompt(dialect || 'msa'),
        },
      ],
    });

    const greeting = generateGreeting(topic, dialect);

    res.json({
      sessionId,
      avatarUrl: '/avatars/nour-neutral.png',
      greetingText: greeting,
      greetingAudio: null,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/avatar/message ────────────────────────────────────────────
router.post('/avatar/message', requireRole('student'), async (req, res, next) => {
  try {
    const { sessionId, content, type } = req.body;
    if (!sessionId || !content) {
      return res.status(400).json({ error: 'Session ID and content are required' });
    }

    const conversation = await AIConversation.findOne({ sessionId, status: 'active' });
    if (!conversation) return res.status(404).json({ error: 'Active session not found' });

    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    });

    const response = await generateAIResponse(content, conversation);

    conversation.messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.text,
      emotion: response.emotion,
      codeSnippet: response.codeSnippet,
      timestamp: new Date(),
    });

    await conversation.save();

    res.json({
      sessionId,
      text: response.text,
      emotion: response.emotion,
      codeSnippet: response.codeSnippet,
      audioUrl: null,
    });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/v1/ai/avatar/end ──────────────────────────────────────────────
router.delete('/avatar/end', requireRole('student'), async (req, res, next) => {
  try {
    const { sessionId, rating } = req.body;
    const conversation = await AIConversation.findOne({ sessionId });
    if (!conversation) return res.status(404).json({ error: 'Session not found' });

    const start = conversation.messages[0]?.timestamp || conversation.createdAt;
    const duration = Math.floor((Date.now() - start.getTime()) / 1000);
    const summary = generateSessionSummary(conversation);

    conversation.status = 'completed';
    conversation.duration = duration;
    conversation.satisfactionRating = rating;
    conversation.summary = summary;

    const student = await Student.findOne({ userId: req.userId });
    if (student) {
      student.addXP(30);
      student.lastActivityDate = new Date();
      await student.save();
    }

    await conversation.save();

    res.json({ sessionId, summary, xpEarned: 30, duration });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/feedback ──────────────────────────────────────────────────
router.post('/feedback', requireRole('student'), async (req, res, next) => {
  try {
    const { submissionId } = req.body;
    const submission = await Submission.findById(submissionId).lean();
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const feedback = generateFeedback(submission);

    await Submission.findByIdAndUpdate(submissionId, {
      aiFeedback: feedback.text,
      aiFeedbackDetails: feedback.details,
    });

    res.json({ feedback });
  } catch (err) {
    next(err);
  }
});

// ── Helpers for provider resolution ───────────────────────────────────────────
function normalizeProvider(raw) {
  const p = String(raw || '').trim().toLowerCase();
  if (p === 'deepseek') return 'blaze';
  if (p === 'blaze' || p === 'blazeai') return 'blaze';
  if (p === 'blazeapi' || p === 'blaze-api' || p === 'api-blaze') return 'blazeapi';
  return null;
}

function resolveModel(provider, fromBody) {
  if (provider === 'blazeapi') {
    return resolveBlazeAPIModel(fromBody);
  }
  const { defaultDeepModel } = getBlazeConfig();
  return resolveBlazeModel(fromBody, defaultDeepModel);
}

function scheduleBackgroundTask(label, task) {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((err) => {
        console.error(`[ai.routes] Background task failed: ${label}`, err);
      });
  });
}

// ── POST /api/v1/ai/generate-lesson ───────────────────────────────────────────
router.post('/generate-lesson', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const { topic, subjectId, studentId } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    let adaptationCtx = '';
    if (studentId) {
      try {
        const student = await Student.findById(studentId).lean();
        if (student) {
          const profile = student.learningProfile || {};
          const parts = [];
          if (profile.experienceLevel) parts.push(`Student experience level: ${profile.experienceLevel}`);
          if (profile.learningStyle) parts.push(`Learning style: ${profile.learningStyle}`);
          if (profile.pacing) parts.push(`Pacing preference: ${profile.pacing}`);
          if (student.weaknesses?.length) parts.push(`Areas needing improvement: ${student.weaknesses.join(', ')}`);
          if (student.strengths?.length) parts.push(`Known strengths: ${student.strengths.join(', ')}`);
          if (student.level) parts.push(`Student level (XP-based): ${student.level}`);
          const progress = await Progress.findOne({ studentId: student._id, subjectId }).lean();
          if (progress?.conceptMastery?.length) {
            const weak = progress.conceptMastery.filter(c => c.proficiency < 50).map(c => c.concept);
            if (weak.length) parts.push(`Concepts needing review: ${weak.join(', ')}`);
            const strong = progress.conceptMastery.filter(c => c.proficiency >= 80).map(c => c.concept);
            if (strong.length) parts.push(`Mastered concepts: ${strong.join(', ')}`);
          }
          if (parts.length) adaptationCtx = '[STUDENT ADAPTATION] ' + parts.join(' | ');
        }
      } catch (adaptErr) {
        console.warn(`Failed to load adaptation data for student ${studentId}:`, adaptErr.message);
      }
    }

    const diff = req.body.difficulty || 'beginner';
    const mins = req.body.duration || 30;
    const style = req.body.style || 'explain';
    const baseInstructions = `Topic: ${topic} | Difficulty: ${diff} | Duration: ${mins}min | Style: ${style}`;
    const userInstructions = adaptationCtx ? `${baseInstructions} | ${adaptationCtx}` : baseInstructions;

    const aiProvider = normalizeProvider(req.body.ai_provider)
      || normalizeProvider(process.env.ACTIVE_LLM)
      || 'blaze';
    const analysisModel = resolveModel(aiProvider, req.body.analysis_model);

    const { log: aiLog } = await reserveAiRequest({
      user: req.user,
      type: 'generate-lesson',
      provider: aiProvider,
      model: analysisModel,
      sourceFilename: 'ai-generate',
      req,
    });

    const series = await LessonSeries.create({
      userInstructions,
      analysisModel,
      sourceFilename: `topic-${topic.replace(/[^a-zA-Z0-9 ]/g, '').trim().slice(0, 40)}`,
      totalLessons: 1,
      completedLessons: 0,
    });

    const lesson = await Lesson.create({
      title: topic,
      sourceFilename: 'ai-generate',
      subject: subjectId || null,
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

    scheduleBackgroundTask(`generate lesson ${lesson._id}`, () =>
      processGeneratedLesson(
        lesson._id.toString(),
        series._id.toString(),
        topic,
        req.body,
        analysisModel,
        aiProvider,
        aiLog?._id?.toString(),
      )
    );

    res.status(202).json({
      id: lesson._id.toString(),
      series_id: series._id.toString(),
      topic,
      status: 'processing',
      parts_count: 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/generate-exercise ─────────────────────────────────────────
router.post('/generate-exercise', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const { topic, difficulty, type } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const exercise = {
      title: 'Practice: ' + topic,
      description: 'Write code that demonstrates ' + topic,
      starterCode: '// Your code here',
      solution: '// Solution',
      testCases: [],
      difficulty: difficulty || 'easy',
      type: type || 'free-code',
    };

    res.json({ exercise });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/voice ─────────────────────────────────────────────────────
router.post('/voice', requireRole('student'), async (req, res, next) => {
  try {
    const { text, dialect, audio } = req.body;
    if (!text && !audio) return res.status(400).json({ error: 'Text or audio data is required' });

    if (audio) {
      const result = await processVoice({ audio, dialect: dialect || 'msa' });
      return res.json({ transcript: result.text || result.transcript, audioUrl: result.audio_url || null, emotion: result.emotion || 'neutral' });
    }

    res.json({
      audioUrl: null,
      text,
      duration: Math.ceil(text.length / 15),
      message: 'Voice generation requires FastAPI endpoint with TTS configured; text received.',
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/code ──────────────────────────────────────────────────────
router.post('/code', requireRole('student'), async (req, res, next) => {
  try {
    const { code, exerciseId, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const result = await submitCode(code, exerciseId || null).catch(() => null);
    if (result) {
      return res.json({
        passed: result.passed ?? result.status === 'passed',
        output: result.output || result.stdout || '',
        errors: result.errors || result.stderr || '',
        testResults: result.test_results || result.tests || [],
        executionTime: result.execution_time || null,
      });
    }

    res.json({
      passed: false,
      output: '',
      errors: 'Code execution service not available. Ensure FastAPI is running.',
      testResults: [],
      executionTime: null,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/adaptive-path ─────────────────────────────────────────────
router.post('/adaptive-path', requireRole('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const weaknesses = student.weaknesses || [];
    const strengths = student.strengths || [];

    // Generate personalized recommendations
    const recommendations = [];
    if (weaknesses.length > 0) {
      weaknesses.slice(0, 3).forEach((w) => {
        recommendations.push({
          concept: w,
          action: 'review',
          reason: 'This is a weak area that needs practice',
        });
      });
    }
    recommendations.push({
      concept: 'Next challenge',
      action: 'new_exercise',
      reason: 'Try a harder exercise to push your limits',
    });

    res.json({ recommendations, weaknesses, strengths });
  } catch (err) {
    next(err);
  }
});

// ── Helper functions ──────────────────────────────────────────────────────────

function generateSystemPrompt(dialect) {
  return 'You are "Nour", a friendly AI coding teacher for students. ' +
    'Teach programming concepts in a fun, encouraging way. ' +
    (dialect === 'egyptian' ? 'Use Egyptian Arabic dialect.' : 'Use Modern Standard Arabic.') +
    ' Keep responses concise (2-4 sentences). Format code properly. ' +
    'Use encouraging phrases like "ممتاز!", "أحسنت!"';
}

function generateGreeting(topic, dialect) {
  const greetings = {
    msa: 'مرحباً! أنا نور، معلمة البرمجة الخاصة بك. اليوم سنتعلم عن ' + (topic || 'البرمجة') + '. هل أنت مستعد؟',
    egyptian: 'أهلاً! أنا نور، معلمتك في البرمجة. النهردة هنعلم عن ' + (topic || 'البرمجة') + '. مستعد؟',
  };
  return greetings[dialect] || greetings.msa;
}

async function generateAIResponse(message) {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('function') || lowerMsg.includes('دالة')) {
    return {
      text: 'ممتاز! الدالة (Function) هي بلوك من الكود يُعرَّف مرة واحدة ويمكن استخدامه عدة مرات. هل تريد أن أشرحها بمثال؟',
      emotion: 'explaining',
      codeSnippet: { language: 'javascript', code: 'function greet(name) {\n  return "Hello, " + name + "!";\n}' },
    };
  }

  if (lowerMsg.includes('loop') || lowerMsg.includes('حلقة')) {
    return {
      text: 'حلقة التكرار (Loop) تُكرِّر عملية معينة عدة مرات. زي ما بتلف حولين البيت! هل تريد رؤية مثال؟',
      emotion: 'explaining',
      codeSnippet: { language: 'javascript', code: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n}' },
    };
  }

  if (lowerMsg.includes('array') || lowerMsg.includes('مصفوفة')) {
    return {
      text: 'المصفوفة (Array) هي مجموعة من القيم في متغير واحد. تخيّلها زي القائمة اللي فيها أكلات مختلفة!',
      emotion: 'explaining',
      codeSnippet: { language: 'javascript', code: 'const fruits = ["apple", "banana", "cherry"];\nconsole.log(fruits[0]); // "apple"' },
    };
  }

  if (lowerMsg.includes('variable') || lowerMsg.includes('متغير')) {
    return {
      text: 'المتغير (Variable) هو صندوق تحط فيه قيمة وتأخذها بعدين. زي لما تحط الموبايل في جيبك!',
      emotion: 'explaining',
      codeSnippet: { language: 'javascript', code: 'let name = "Ahmed";\nconst age = 15;\nconsole.log(name); // "Ahmed"' },
    };
  }

  return {
    text: 'سؤال رائع! دعني أشرح لك. البرمجة هي عملية كتابة تعليمات للكمبيوتر. كل سطر كود هو أمر نقوله للجهاز. عايز تتعلم مفهوم معين؟',
    emotion: 'happy',
    codeSnippet: null,
  };
}

function generateSessionSummary(conversation) {
  const userMessages = conversation.messages.filter((m) => m.role === 'user').length;
  const topics = conversation.topic || 'General Programming';
  return 'Session about ' + topics + ': ' + userMessages + ' exchanges. Keep practicing!';
}

function generateFeedback(submission) {
  return {
    text: submission.status === 'passed'
      ? 'أحسنت! الحل صحيح. أنت تتقدم بشكل رائع!'
      : 'لا بأس، المحاولة مهمة. حاول مرة أخرى وركز على الخطأ.',
    details: {
      conceptualMistake: submission.status === 'failed' ? 'Review the concept again' : null,
      suggestion: submission.status === 'failed' ? 'Try breaking the problem into smaller parts' : null,
      encouragement: 'كل خطوة تقربك من الهدف!',
    },
  };
}

// ── Background lesson generation ──────────────────────────────────────────────
async function processGeneratedLesson(lessonId, seriesId, topic, body, analysisModel, aiProvider, aiLogId = null) {
  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return;

    const diff = body.difficulty || 'beginner';
    const mins = body.duration || 30;
    const teachStyle = body.style || 'explain';

    const series = await LessonSeries.findById(seriesId);
    const userInstructions = series?.userInstructions
      || `Topic: ${topic} | Difficulty: ${diff} | Duration: ${mins}min | Style: ${teachStyle}`;

    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'planning_outline' });

    const hasAdaptation = userInstructions.includes('[STUDENT ADAPTATION]');
    const seedText = hasAdaptation
      ? userInstructions
      : `Create a detailed lesson plan about "${topic}" at ${diff} level lasting ${mins} minutes. Teaching style: ${teachStyle}. Include: 1) Learning objectives, 2) Prerequisites, 3) Core concepts with explanations, 4) Worked examples, 5) Practice exercises, 6) Summary and key takeaways. The lesson should be engaging and pedagogically sound.`;

    const { firstLesson, remainingSpecs, totalLessons } = await planLessonSeries(
      seedText,
      userInstructions,
      analysisModel,
      async (step) => {
        await Lesson.findByIdAndUpdate(lessonId, { processingStep: step });
      },
      aiProvider,
      'full_lesson',
      'topic',
      'teach',
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

    if (aiLogId) {
      await AiRequestLog.updateOne({ _id: aiLogId }, { $set: { status: 'completed' } });
    }
  } catch (err) {
    console.error(`AI lesson generation failed for ${lessonId}:`, err);
    await Lesson.findByIdAndUpdate(lessonId, { status: 'error', errorMessage: toUserFacingError(err) });
    if (aiLogId) {
      await AiRequestLog.updateOne({ _id: aiLogId }, { $set: { status: 'failed', errorMessage: toUserFacingError(err) } });
    }
  }
}

export default router;
