import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../../auth/middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { Student, AIConversation, Submission, Progress, Exercise, Exam, ExerciseBlock } from '../models/index.js';
import { Lesson, LessonPart } from '../../models/Lesson.js';
import { LessonSeries } from '../../models/LessonSeries.js';
import { planLessonSeries, callAIRace } from '../../services/aiPlanner.js';
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
router.post('/avatar/start', requireRole('student', 'admin'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.userId });
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const { topic, dialect, subjectId, lessonId } = req.body;
    const sessionId = crypto.randomUUID();

    // Load lesson content if lessonId is provided
    let lessonContent = '';
    let lessonTitle = topic || 'General Programming';
    if (lessonId) {
      // Try CodingLesson first, then whiteboard Lesson
      const codingLesson = await (await import('../models/index.js')).CodingLesson.findById(lessonId).lean();
      if (codingLesson) {
        lessonTitle = codingLesson.title;
        lessonContent = codingLesson.content || '';
        if (codingLesson.codeSnippets?.length) {
          lessonContent += '\n\nCode examples:\n' + codingLesson.codeSnippets.map(s =>
            `\`\`\`${s.language}\n${s.code}\n\`\`\`\n${s.explanation || ''}`
          ).join('\n');
        }
        if (codingLesson.attachments?.length) {
          lessonContent += '\n\nMaterials: ' + codingLesson.attachments.map(a => a.name).join(', ');
        }
      } else {
        const wbLesson = await Lesson.findById(lessonId).lean();
        if (wbLesson) {
          lessonTitle = wbLesson.title || lessonTitle;
          const parts = await LessonPart.find({ lessonId: wbLesson._id }).sort({ orderIndex: 1 }).lean();
          lessonContent = parts.map(p => `${p.title ? '## ' + p.title : ''}\n${p.narration || ''}`).join('\n\n');
        }
      }
    }

    const systemMsg = generateSystemPrompt(dialect || 'msa');
    const lessonContext = lessonContent
      ? `\n\nLESSON CONTENT (teach this material to the student):\n${lessonContent.slice(0, 8000)}`
      : '';

    const conversation = await AIConversation.create({
      studentId: student._id,
      sessionId,
      topic: lessonTitle,
      subjectId,
      lessonId,
      status: 'active',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: systemMsg + lessonContext,
        },
      ],
    });

    const greeting = generateGreeting(lessonTitle, dialect);

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
router.post('/avatar/message', requireRole('student', 'admin'), async (req, res, next) => {
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
router.delete('/avatar/end', requireRole('student', 'admin'), async (req, res, next) => {
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

const providerCounter = { index: 0 };
const PROVIDERS = ['openrouter', 'blazeapi'];

function selectProvider(preferred) {
  if (preferred && normalizeProvider(preferred)) return normalizeProvider(preferred);
  const forced = process.env.ACTIVE_LLM_FORCE;
  if (forced) return normalizeProvider(forced) || 'openrouter';
  if (process.env.ACTIVE_LLM_MIX !== 'true') {
    return normalizeProvider(process.env.ACTIVE_LLM) || 'openrouter';
  }
  const p = PROVIDERS[providerCounter.index % PROVIDERS.length];
  providerCounter.index += 1;
  return p;
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
    const { topic, studentId } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    let adaptationCtx = '';
    if (studentId) {
      try {
        const student = await Student.findById(studentId).lean()
          || await Student.findOne({ studentCode: studentId }).lean();
        if (student) {
          const profile = student.learningProfile || {};
          const parts = [];
          if (profile.experienceLevel) parts.push(`Student experience level: ${profile.experienceLevel}`);
          if (profile.learningStyle) parts.push(`Learning style: ${profile.learningStyle}`);
          if (profile.pacing) parts.push(`Pacing preference: ${profile.pacing}`);
          if (profile.practiceFrequency) parts.push(`Practice need: ${profile.practiceFrequency}`);
          if (student.weaknesses?.length) parts.push(`Areas needing improvement: ${student.weaknesses.join(', ')}`);
          if (student.strengths?.length) parts.push(`Known strengths: ${student.strengths.join(', ')}`);
          if (student.level) parts.push(`Student level (XP-based): ${student.level}`);
          const progress = await Progress.findOne({ studentId: student._id }).lean();
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

    const userInstructions = adaptationCtx
      ? `Topic: ${topic} | ${adaptationCtx}`
      : `Topic: ${topic} | Generate a complete lesson with clear objectives, explanations, examples, and exercises.`;

    const aiProvider = selectProvider(req.body.ai_provider);
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
      subject: null,
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
    const { topic, difficulty, type, subjectId } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    const diff = difficulty || 'easy';
    const exType = type || 'free-code';

    // Build rich exercise content based on topic and difficulty
    const exercise = await generateRichExercise(topic, diff, exType);

    // Save to database so it appears in the teacher's exercise list
    const saved = await Exercise.create({
      title: exercise.title,
      description: exercise.description,
      subjectId: subjectId || null,
      teacherId: req.userId,
      type: exType,
      difficulty: diff,
      starterCode: exercise.starterCode,
      solution: exercise.solution,
      solutionExplanation: exercise.solutionExplanation,
      testCases: exercise.testCases,
      hints: exercise.hints,
      xpReward: exercise.xpReward,
      estimatedTime: exercise.estimatedTime,
      tags: exercise.tags,
      isPublished: false,
    });

    res.json({ exercise: saved });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/generate-exam ──────────────────────────────────────────────
router.post('/generate-exam', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const { title, subjectId, difficulty, questionCount = 5, duration = 60 } = req.body;
    if (!title) return res.status(400).json({ error: 'Exam title is required' });

    // Generate exam questions based on the title/subject
    const questions = await generateExamQuestions(title, subjectId, difficulty, questionCount);

    // Save the exam to database
    const exam = await Exam.create({
      title,
      subjectId: subjectId || null,
      teacherId: req.userId,
      type: 'quiz',
      questions,
      duration,
      totalPoints: questions.reduce((sum, q) => sum + (q.points || 1), 0),
      passingScore: 60,
      isPublished: false,
    });

    res.json({ exam });
  } catch (err) {
    next(err);
  }
});

// ── AI-Powered Rich Exercise Generator ─────────────────────────────────────────
async function generateRichExercise(topic, difficulty, type) {
  const aiProvider = selectProvider();
  const model = resolveModel(aiProvider, null);

  const prompt = `Generate a coding exercise about "${topic}" at "${difficulty}" difficulty of type "${type}".

Return a JSON object with these exact fields:
- "title": short exercise title (max 60 chars)
- "description": clear instructions (max 200 words)
- "starterCode": template code with placeholders
- "solution": the complete working solution
- "solutionExplanation": teach why this solution works (max 100 words)
- "testCases": array of { "id", "input", "expectedOutput", "description" } objects (3-5 test cases, mark first as isHidden=false, last as isHidden=true)
- "hints": array of { "order", "text" (max 40 words), "cost" (coins) } — 2-3 hints
- "xpReward": number (10-100 depending on difficulty)
- "estimatedTime": number in minutes
- "tags": array of 2-4 keyword strings

Make the exercise specific to ${topic}, not generic. Use real programming concepts.`;

  try {
    const result = await callAIRace(prompt, 4096, 60000, aiProvider, model);
    return {
      title: result.title || `Practice: ${topic}`,
      description: result.description || `Write code to demonstrate ${topic}.`,
      starterCode: result.starterCode || '// Write your solution here\n',
      solution: result.solution || '// Solution\n',
      solutionExplanation: result.solutionExplanation || `This exercise tests ${topic}.`,
      testCases: (result.testCases || []).map((tc, i) => ({
        id: tc.id || String(i + 1),
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        isHidden: tc.isHidden ?? (i > 1),
        description: tc.description || `Test case ${i + 1}`,
      })),
      hints: (result.hints || []).map((h, i) => ({
        order: h.order || i + 1,
        text: h.text || 'Think about the core concept.',
        cost: h.cost || 5 * (i + 1),
      })),
      xpReward: result.xpReward || 10,
      estimatedTime: result.estimatedTime || 15,
      tags: result.tags || [topic.toLowerCase().replace(/\s+/g, '-')],
    };
  } catch (err) {
    console.warn(`[ai.routes] AI exercise generation failed, using fallback:`, err.message);
    return getFallbackExercise(topic, difficulty, type);
  }
}

function getFallbackExercise(topic, difficulty, type) {
  const diffMultiplier = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
  return {
    title: `Practice: ${topic}`,
    description: `Write code to demonstrate your understanding of ${topic}.`,
    starterCode: '// Write your solution here\n',
    solution: '// Solution\n',
    solutionExplanation: `This exercise tests your knowledge of ${topic}.`,
    testCases: [
      { id: '1', input: 'test', expectedOutput: 'expected', isHidden: false, description: 'Basic test' },
      { id: '2', input: '', expectedOutput: '', isHidden: true, description: 'Edge case' },
    ],
    hints: [{ order: 1, text: 'Think about the core concept first', cost: 5 }],
    xpReward: 10 * diffMultiplier,
    estimatedTime: 10 * diffMultiplier,
    tags: [topic.toLowerCase().replace(/\s+/g, '-')],
  };
}

// ── Exercise Templates ──────────────────────────────────────────────────────────
function getExerciseTemplates(topic, difficulty, type) {
  const diff = difficulty || 'easy';
  const xp = diff === 'easy' ? 10 : diff === 'medium' ? 25 : 50;
  const time = diff === 'easy' ? 10 : diff === 'medium' ? 20 : 30;

  const templates = {
    'fill-code': [{
      title: `Complete the ${topic} Function`,
      description: `Fill in the missing code to implement ${topic}. Complete the function body.`,
      starterCode: `function solution(input) {\n  // TODO: Implement ${topic}\n  // Your code here\n\n}`,
      solution: `function solution(input) {\n  // Complete implementation of ${topic}\n  return input;\n}`,
      solutionExplanation: `The solution demonstrates the correct implementation of ${topic}. Study the pattern and try to understand each step.`,
      testCases: [
        { id: '1', input: 'test1', expectedOutput: 'TEST1', isHidden: false, description: 'Basic conversion' },
        { id: '2', input: 'hello', expectedOutput: 'HELLO', isHidden: false, description: 'Simple string' },
        { id: '3', input: '123', expectedOutput: '123', isHidden: true, description: 'Edge case: numbers' },
      ],
      hints: [
        { order: 1, text: `Think about what ${topic} does. What's the core operation?`, cost: 5 },
        { order: 2, text: 'Break the problem into smaller steps', cost: 10 },
        { order: 3, text: 'Check the expected input and output format', cost: 15 },
      ],
      xpReward: xp,
      estimatedTime: time,
      tags: [topic.toLowerCase().replace(/\s+/g, '-'), 'fill-code'],
    }],
    'find-bug': [{
      title: `Debug the ${topic} Code`,
      description: `The following code has a bug related to ${topic}. Find and fix the issue.`,
      starterCode: `// BUG: This code has an error related to ${topic}\nfunction buggySolution(input) {\n  // There's a bug here!\n  return input;\n}\n\n// Fix the function above`,
      solution: `// Fixed version\nfunction buggySolution(input) {\n  // Bug was fixed\n  return typeof input === 'string' ? input.toUpperCase() : input;\n}`,
      solutionExplanation: `The bug was in how the function handled the input. Always check for edge cases!`,
      testCases: [
        { id: '1', input: 'hello', expectedOutput: 'HELLO', isHidden: false, description: 'Should convert to uppercase' },
        { id: '2', input: 'world', expectedOutput: 'WORLD', isHidden: false, description: 'Another basic test' },
      ],
      hints: [
        { order: 1, text: 'Look at the function return statement carefully', cost: 5 },
        { order: 2, text: 'What happens with different input types?', cost: 10 },
      ],
      xpReward: xp + 5,
      estimatedTime: time,
      tags: [topic.toLowerCase().replace(/\s+/g, '-'), 'debug'],
    }],
    'free-code': [{
      title: `Implement ${topic}`,
      description: `Write a complete solution that demonstrates ${topic}. Make sure to handle different cases.`,
      starterCode: `// Implement ${topic}\nfunction solution(input) {\n  // Your implementation here\n  \n}\n\n// Test your solution\nconsole.log(solution('test'));`,
      solution: `function solution(input) {\n  // Implementation of ${topic}\n  if (!input) return '';\n  return String(input).toUpperCase();\n}`,
      solutionExplanation: `This implementation handles the core requirements of ${topic}. It includes input validation and proper transformation.`,
      testCases: [
        { id: '1', input: 'test', expectedOutput: 'TEST', isHidden: false, description: 'Basic test' },
        { id: '2', input: 'Code', expectedOutput: 'CODE', isHidden: false, description: 'Mixed case' },
        { id: '3', input: '', expectedOutput: '', isHidden: true, description: 'Empty input' },
      ],
      hints: [
        { order: 1, text: `Start by thinking about what ${topic} requires`, cost: 5 },
        { order: 2, text: 'Consider edge cases like empty input', cost: 10 },
        { order: 3, text: 'Test your solution with the provided test cases', cost: 15 },
      ],
      xpReward: xp,
      estimatedTime: time,
      tags: [topic.toLowerCase().replace(/\s+/g, '-'), 'free-code'],
    }],
    'predict-output': [{
      title: `Predict the Output: ${topic}`,
      description: `Read the code about ${topic} and predict what it will output when run.`,
      starterCode: `// What will this code output?\nfunction mystery(input) {\n  let result = '';\n  for (let i = 0; i < input.length; i++) {\n    result += input[i].toUpperCase();\n  }\n  return result;\n}\n\nconsole.log(mystery('code'));\n// Output: ______`,
      solution: 'CODE',
      solutionExplanation: `The function iterates through each character, converts it to uppercase, and concatenates the results.`,
      testCases: [
        { id: '1', input: 'code', expectedOutput: 'CODE', isHidden: false, description: 'Predict the output' },
      ],
      hints: [
        { order: 1, text: 'Trace through the code line by line', cost: 5 },
        { order: 2, text: 'What does .toUpperCase() do?', cost: 10 },
      ],
      xpReward: xp,
      estimatedTime: time - 5,
      tags: [topic.toLowerCase().replace(/\s+/g, '-'), 'predict'],
    }],
  };

  // Default to free-code if type not found
  return templates[type] || templates['free-code'];
}

// ── AI-Powered Exam Question Generator ──────────────────────────────────────────
async function generateExamQuestions(title, subjectId, difficulty, count) {
  const aiProvider = selectProvider();
  const model = resolveModel(aiProvider, null);

  const prompt = `Generate ${count} exam questions about "${title}" at "${difficulty || 'medium'}" difficulty.

Return a JSON object with a "questions" array. Each question object must have:
- "id": string (sequential)
- "type": one of "mcq", "code", "fill-blank", "predict-output"
- "question": the question text
- "points": number (1-5 based on difficulty)
- "difficulty": "${difficulty || 'medium'}"
- "tags": array of keyword strings
- "explanation": explanation of the correct answer
- "hint": a helpful hint (max 30 words)

For type "mcq", also include:
- "options": array of 4 answer strings
- "correctAnswer": index string ("0", "1", "2", or "3")

For type "code", also include:
- "code": starter code template

For type "fill-blank", also include:
- "code": code with _____ blanks
- "correctAnswer": the missing text

For type "predict-output", also include:
- "code": code snippet to analyze
- "correctAnswer": expected output

Make all questions specific to ${title}. Use real concepts, real syntax, real programming scenarios. No generic templates.`;

  try {
    const result = await callAIRace(prompt, 4096, 60000, aiProvider, model);
    const aiQuestions = result.questions || [];
    return aiQuestions.slice(0, count).map((q, i) => ({
      id: String(i + 1),
      type: q.type || 'mcq',
      question: q.question || `Question about ${title}.`,
      points: q.points || 2,
      difficulty: difficulty || 'medium',
      tags: q.tags || [title.toLowerCase().replace(/\s+/g, '-')],
      options: q.options || [],
      correctAnswer: q.correctAnswer || '0',
      explanation: q.explanation || 'Review the concept.',
      code: q.code || '',
      hint: q.hint || 'Think carefully.',
    }));
  } catch (err) {
    console.warn(`[ai.routes] AI exam generation failed, using fallback:`, err.message);
    return getFallbackExamQuestions(title, difficulty, count);
  }
}

function getFallbackExamQuestions(title, difficulty, count) {
  const diff = difficulty || 'medium';
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push({
      id: String(i + 1),
      type: 'mcq',
      question: `What is the correct way to work with ${title}?`,
      options: [
        `Standard approach for ${title}`,
        `Alternative method for ${title}`,
        `A different technique`,
        `None of the above`,
      ],
      correctAnswer: '0',
      explanation: `The standard approach is the most common and recommended way.`,
      points: diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3,
      difficulty: diff,
      code: '',
      hint: 'Think about the most common pattern.',
      tags: [title.toLowerCase().replace(/\s+/g, '-')],
    });
  }
  return questions;
}

// ── POST /api/v1/ai/voice ─────────────────────────────────────────────────────
// ── POST /api/v1/ai/voice ─────────────────────────────────────────────────────
router.post('/voice', requireRole('student', 'admin'), async (req, res, next) => {
  try {
    const { transcript, text } = req.body;
    const input = transcript || text;
    if (!input) return res.status(400).json({ error: 'Transcript or text is required' });

    const result = await processVoice({ transcript: input });
    res.json({
      teacherResponse: result.teacher_response?.speech || result.teacher_response?.speech || '',
      emotion: result.teacher_response?.emotion || 'neutral',
      nextAction: result.teacher_response?.next_action || '',
      lessonState: result.teacher_response?.lesson_state || '',
      audioBytes: result.audio_bytes || null,
      enableMicrophone: result.teacher_response?.enable_microphone ?? true,
      showCodeEditor: result.teacher_response?.show_code_editor ?? false,
      progress: result.teacher_response?.progress || null,
      studentFeedback: result.teacher_response?.student_feedback || null,
      source: 'fastapi',
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/session/start ──────────────────────────────────────────────
router.post('/session/start', requireRole('student', 'admin'), async (req, res, next) => {
  try {
    const result = await startSession({});
    res.json({
      teacherResponse: result.teacher_response?.speech || '',
      emotion: result.teacher_response?.emotion || 'neutral',
      nextAction: result.teacher_response?.next_action || '',
      lessonState: result.teacher_response?.lesson_state || '',
      audioBytes: result.audio_bytes || null,
      enableMicrophone: result.teacher_response?.enable_microphone ?? true,
      showCodeEditor: result.teacher_response?.show_code_editor ?? false,
      progress: result.teacher_response?.progress || null,
      source: 'fastapi',
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/v1/ai/code ──────────────────────────────────────────────────────
router.post('/code', requireRole('student', 'admin'), async (req, res, next) => {
  try {
    const { code, exerciseId } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const result = await submitCode(code, exerciseId || 'general');
    res.json({
      executionResult: result.execution_result || null,
      teacherResponse: result.teacher_response?.speech || '',
      emotion: result.teacher_response?.emotion || 'neutral',
      nextAction: result.teacher_response?.next_action || '',
      lessonState: result.teacher_response?.lesson_state || '',
      audioBytes: result.audio_bytes || null,
      studentFeedback: result.teacher_response?.student_feedback || null,
      progress: result.teacher_response?.progress || null,
      source: 'fastapi',
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

async function generateAIResponse(message, conversation) {
  const systemMsg = conversation.messages.find(m => m.role === 'system')?.content || '';
  const history = conversation.messages
    .filter(m => m.role !== 'system')
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content}`)
    .join('\n');

  const provider = selectProvider();
  const model = resolveModel(provider, null);
  const prompt = `You are Nour, an AI coding teacher. Use the lesson context below and the conversation history to teach the student. Respond in Arabic (Egyptian dialect if the student uses it, otherwise MSA). Be encouraging, clear, and concise. Include code examples when relevant.

${systemMsg.slice(0, 3000)}

Conversation so far:
${history}

Student: ${message}
Teacher: Return a JSON object with: "text" (your response in Arabic, max 150 words), "emotion" (one of: explaining/happy/encouraging/thinking/curious), "codeSnippet" (object with "language" and "code" fields, or null if no code).`;

  try {
    const aiResp = await callAIRace(prompt, 4096, 60000, provider, model);
    return {
      text: aiResp?.text || 'سؤال رائع! دعني أفكر في الإجابة...',
      emotion: aiResp?.emotion || 'explaining',
      codeSnippet: aiResp?.codeSnippet || null,
    };
  } catch (err) {
    console.warn('[avatar] AI response failed, using fallback:', err.message);
    return {
      text: 'سؤال رائع! دعني أشرح لك هذا المفهوم بالتفصيل. البرمجة هي عملية كتابة تعليمات للكمبيوتر. هل تريد مثالاً؟',
      emotion: 'happy',
      codeSnippet: null,
    };
  }
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
async function processGeneratedLesson(lessonId, seriesId, topic, analysisModel, aiProvider, aiLogId = null) {
  try {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return;

    const series = await LessonSeries.findById(seriesId);
    const userInstructions = series?.userInstructions || `Topic: ${topic}`;

    await Lesson.findByIdAndUpdate(lessonId, { processingStep: 'planning_outline' });

    const { firstLesson, remainingSpecs, totalLessons } = await planLessonSeries(
      `Create a personalized lesson about "${topic}". ${userInstructions}`,
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

    // Auto-generate an exam for this lesson
    try {
      const examQuestions = await generateExamQuestions(topic, null, 'medium', 5);
      const exam = await Exam.create({
        title: `Exam: ${topic}`,
        subjectId: null,
        teacherId: lesson.ownerId || null,
        schoolId: null,
        type: 'quiz',
        instructions: `Answer the following questions about ${topic} to test your understanding.`,
        questions: examQuestions,
        duration: 30,
        totalPoints: examQuestions.reduce((sum, q) => sum + (q.points || 1), 0),
        passingScore: 60,
        isPublished: true,
      });
      console.log(`Auto-generated exam ${exam._id} for lesson ${lessonId}`);
    } catch (examErr) {
      console.warn(`Failed to auto-generate exam for lesson ${lessonId}:`, examErr.message);
    }

    // Auto-generate exercise blocks for this lesson
    try {
      const exTemplates = getExerciseTemplates(topic, 'medium', 'free-code');
      const template = exTemplates[0];
      if (template) {
        // Create a standalone exercise
        await Exercise.create({
          title: template.title,
          description: template.description,
          teacherId: lesson.ownerId || null,
          type: 'free-code',
          difficulty: 'medium',
          starterCode: template.starterCode,
          solution: template.solution,
          solutionExplanation: template.solutionExplanation,
          testCases: template.testCases,
          hints: template.hints,
          xpReward: template.xpReward,
          estimatedTime: template.estimatedTime,
          tags: template.tags,
          isPublished: true,
        });

        // Create an exercise block embedded in the lesson (for video pause feature)
        await ExerciseBlock.create({
          lessonId: lesson._id,
          title: template.title,
          instructions: template.description,
          language: 'javascript',
          starterCode: template.starterCode,
          solution: template.solution,
          testCases: template.testCases,
          hints: template.hints.map((h, i) => ({ order: i + 1, text: h.text })),
          difficulty: 'medium',
          order: 0,
          isRequired: true,
          xpReward: template.xpReward,
        });
        console.log(`Auto-generated exercise + exercise block for lesson ${lessonId}`);
      }
    } catch (exErr) {
      console.warn(`Failed to auto-generate exercise for lesson ${lessonId}:`, exErr.message);
    }

    // Create a CodingLesson entry so the lesson appears in students' Learn page
    try {
      const parts = await LessonPart.find({ lessonId: lesson._id }).sort({ orderIndex: 1 }).lean();
      const content = parts.map(p =>
        `${p.title ? '## ' + p.title : ''}\n${p.narration || ''}`
      ).join('\n\n');
      const { CodingLesson } = await import('../models/index.js');
      await CodingLesson.create({
        title: lesson.title || topic,
        content: content.slice(0, 50000),
        teacherId: lesson.ownerId || undefined,
        difficulty: 'intermediate',
        tags: [topic],
        isPublished: true,
        hasAvatarVersion: true,
        avatarLessonId: lesson._id,
      });
      console.log(`Created CodingLesson entry for ${lessonId}`);
    } catch (clErr) {
      console.warn(`Failed to create CodingLesson for ${lessonId}:`, clErr.message);
    }

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
