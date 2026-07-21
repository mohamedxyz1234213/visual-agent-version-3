import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Student, AIConversation, Submission } from '../models/index.js';

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

// ── POST /api/v1/ai/generate-lesson ───────────────────────────────────────────
router.post('/generate-lesson', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const { topic, subjectId, difficulty, duration, style } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const diff = difficulty || 'beginner';
    const mins = duration || 30;
    const teachStyle = style || 'explain';

    const dummyExercises = [
      {
        title: `Basic ${topic} Exercise`,
        description: `Write a simple program that demonstrates ${topic}`,
        starterCode: '// Write your code here\n',
        difficulty: 'easy',
        type: 'free-code',
        xpReward: 20,
      },
      {
        title: `Intermediate ${topic} Practice`,
        description: `Apply ${topic} concepts to solve a practical problem`,
        starterCode: '// Starter code\n',
        difficulty: 'medium',
        type: 'fill-code',
        xpReward: 35,
      },
    ];

    const lesson = {
      _id: 'lesson_' + Date.now(),
      title: topic,
      subjectId: subjectId || null,
      difficulty: diff,
      duration: mins,
      style: teachStyle,
      status: 'draft',
      isPublished: false,
      createdAt: new Date().toISOString(),
      content: `# ${topic}\n\n## Overview\nThis lesson covers the fundamentals of ${topic} at a ${diff} level. ` +
        `You will learn core concepts, best practices, and real-world applications.\n\n` +
        `## Prerequisites\n- Basic programming knowledge\n- Familiarity with variables and functions\n` +
        `## Key Concepts\n1. Introduction to ${topic}\n2. Core principles and theory\n3. Practical implementation\n4. Common patterns and best practices\n5. Advanced techniques\n\n` +
        `## Detailed Content\nIn this lesson, we'll explore ${topic} in depth. ` +
        `You'll understand how it works, why it's important, and how to use it effectively in your projects.\n\n` +
        `### Section 1: Getting Started\nLet's begin with the basics of ${topic}. We'll cover the fundamental concepts ` +
        `that form the foundation of this topic.\n\n` +
        `### Section 2: Core Concepts\nDive deeper into the key ideas behind ${topic}. ` +
        `Understanding these concepts is crucial for mastering this subject.\n\n` +
        `### Section 3: Practical Application\nNow let's apply what we've learned with real-world examples and hands-on exercises.`,
      objectives: [
        `Understand the fundamentals of ${topic}`,
        `Apply ${topic} concepts in practical scenarios`,
        `Build projects using ${topic}`,
        `Debug and troubleshoot common ${topic} issues`,
      ],
      codeSnippets: [
        {
          language: 'javascript',
          code: `// Example: Getting started with ${topic}\nfunction demonstrate() {\n  console.log("Learning " + "${topic}");\n}\n\ndemonstrate();`,
          explanation: `A simple example to demonstrate ${topic} concepts`,
        },
        {
          language: 'javascript',
          code: `// Advanced ${topic} example\nclass TopicHandler {\n  constructor() {\n    this.data = [];\n  }\n  \n  process(input) {\n    return input.map(item => item.toUpperCase());\n  }\n}`,
          explanation: `An advanced example showing ${topic} patterns in practice`,
        },
      ],
      exercises: dummyExercises,
      tags: [topic.toLowerCase(), diff, 'ai-generated'],
      estimatedTime: mins,
      totalExercises: dummyExercises.length,
    };

    res.json({ lesson });
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
    const { text, dialect } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    res.json({
      audioUrl: null,
      duration: Math.ceil(text.length / 15),
      message: 'Voice generation requires ElevenLabs API key',
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

export default router;
