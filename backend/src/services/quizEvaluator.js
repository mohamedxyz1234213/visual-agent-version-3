import { getOpenRouterConfig, OPENROUTER_DEFAULT_MODEL } from './openrouterConfig.js';

/**
 * Evaluate quiz answers and return score, feedback, and passed flag.
 * @param {Array} questions - QuizQuestion documents
 * @param {Object} answers - { "<questionId>": "<userAnswer>" }
 * @returns {Promise<{ score: number, feedback: Object, passed: boolean }>}
 */
export async function evaluate(questions, answers, aiProvider = null, analysisModel = null) {
  const feedback = {};
  let correctCount = 0;

  for (const q of questions) {
    const qId = q._id.toString();
    const userAnswer = (answers[qId] || '').trim();
    let isCorrect = false;
    let explanation = q.explanation || '';

    if (q.questionType === 'mcq') {
      ({ isCorrect, explanation } = evalMcq(q, userAnswer));
    } else if (q.questionType === 'fill_blank') {
      ({ isCorrect, explanation } = evalFillBlank(q, userAnswer));
    } else {
      ({ isCorrect, explanation } = await evalOpen(q, userAnswer, aiProvider, analysisModel));
    }

    if (isCorrect) correctCount++;
    feedback[qId] = { correct: isCorrect, correct_answer: q.correctAnswer, explanation };
  }

  const total = questions.length;
  const score = correctCount;
  const passed = total > 0 && correctCount / total >= 0.7;
  return { score, feedback, passed };
}

function evalMcq(q, answer) {
  const normalizedAnswer = normalizeAnswer(answer);
  const accepted = new Set([
    normalizeAnswer(q.correctAnswer || ''),
    normalizeAnswer(q.options?.correct || ''),
  ].filter(Boolean));

  const choices = Array.isArray(q.options?.choices) ? q.options.choices : [];
  const correctIndex = choices.findIndex((choice) => accepted.has(normalizeAnswer(choice)));
  if (correctIndex >= 0) {
    accepted.add(String.fromCharCode(97 + correctIndex));
    accepted.add(String(correctIndex + 1));
  }

  return { isCorrect: accepted.has(normalizedAnswer), explanation: q.explanation || '' };
}

function evalFillBlank(q, answer) {
  const acceptedAnswers = expandAcceptedAnswers(q.correctAnswer || q.options?.correct || '');
  const isCorrect = acceptedAnswers.some((expected) => answersEquivalent(answer, expected));
  return { isCorrect, explanation: q.explanation || '' };
}

async function evalOpen(q, answer, aiProvider = null, analysisModel = null) {
  if (!answer) return { isCorrect: false, explanation: 'No answer provided.' };

  const acceptedAnswers = expandAcceptedAnswers(q.correctAnswer || q.options?.correct || '');
  if (acceptedAnswers.some((expected) => answersEquivalent(answer, expected))) {
    return { isCorrect: true, explanation: q.explanation || '' };
  }

  const prompt =
    `Question: ${q.questionText}\n` +
    `Expected answer: ${q.correctAnswer || 'See explanation'}\n` +
    `Student answer: ${answer}\n\n` +
    'Is the student\'s answer correct or substantially correct? ' +
    'Reply with JSON: {"correct": true/false, "explanation": "brief feedback"}';

  const requestedAI = String(aiProvider || process.env.ACTIVE_LLM || 'openrouter').trim().toLowerCase();

  try {
    const or = getOpenRouterConfig();
    if (or.apiKey) {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({
        apiKey: or.apiKey,
        baseURL: or.baseURL,
      });
      const model = analysisModel || OPENROUTER_DEFAULT_MODEL;
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      });
      const raw = (response.choices[0].message.content || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const data = JSON.parse(raw || '{}');
      return { isCorrect: Boolean(data.correct), explanation: data.explanation || '' };
    }

    if (activeAI === 'openai' && process.env.OPENAI_API_KEY) {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      });
      const data = JSON.parse(response.choices[0].message.content || '{}');
      return { isCorrect: Boolean(data.correct), explanation: data.explanation || '' };
    }

    if (activeAI === 'gemini' && process.env.GEMINI_API_KEY) {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());
      return { isCorrect: Boolean(data.correct), explanation: data.explanation || '' };
    }
  } catch (err) {
    console.error('AI evaluation error:', err.message);
  }

  // Fallback: simple contains check
  const isCorrect = acceptedAnswers.some((expected) => answersEquivalent(answer, expected));
  return { isCorrect, explanation: q.explanation || '' };
}

function expandAcceptedAnswers(rawAnswer) {
  const normalized = String(rawAnswer || '').trim();
  if (!normalized) return [];

  return [...new Set(
    normalized
      .split(/\s*(?:\||;|\/|\\|\bor\b)\s*/i)
      .map((entry) => normalizeAnswer(entry))
      .filter(Boolean)
  )];
}

function answersEquivalent(userAnswer, expectedAnswer) {
  const user = normalizeAnswer(userAnswer);
  const expected = normalizeAnswer(expectedAnswer);

  if (!user || !expected) return false;
  if (user === expected) return true;
  if ((user.includes(expected) || expected.includes(user)) && Math.min(user.length, expected.length) >= 4) {
    return true;
  }

  const userTokens = comparableTokens(user);
  const expectedTokens = comparableTokens(expected);

  if (expectedTokens.length && expectedTokens.every((token) => userTokens.includes(token))) {
    return true;
  }
  if (userTokens.length >= 2 && userTokens.every((token) => expectedTokens.includes(token))) {
    return true;
  }

  const distance = levenshteinDistance(user, expected);
  const maxLength = Math.max(user.length, expected.length);
  if (maxLength <= 6) return distance <= 1;
  if (maxLength <= 12) return distance <= 2;
  return 1 - (distance / maxLength) >= 0.82;
}

function normalizeAnswer(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/["'`.,!?()[\]{}]/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\b(a|an|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function comparableTokens(value) {
  return normalizeAnswer(value)
    .split(' ')
    .filter(Boolean)
    .map((token) => token.endsWith('s') && token.length > 4 ? token.slice(0, -1) : token);
}

function levenshteinDistance(left, right) {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) dp[row][0] = row;
  for (let col = 0; col < cols; col += 1) dp[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      dp[row][col] = Math.min(
        dp[row - 1][col] + 1,
        dp[row][col - 1] + 1,
        dp[row - 1][col - 1] + cost,
      );
    }
  }

  return dp[rows - 1][cols - 1];
}
