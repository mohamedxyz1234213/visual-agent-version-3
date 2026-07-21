// ── AI Avatar Service ─────────────────────────────────────────────────────────
// Handles avatar session management, AI dialogue, emotion detection, and voice

const AVATAR_PERSONALITY = {
  name: 'Nour',
  defaultDialect: 'msa',
  encouragements: [
    'ممتاز! دماغك شغالة كويس!',
    'أحسنت! إنت بتتحسن كل يوم!',
    'كده صح! إنت فاهم الموضوع كويس!',
    'غلطة بسيطة، مش مشكلة. خلينا نصلحها مع بعض.',
    'برافو! إنت كده بتفكر زي مبرمج محترف!',
  ],
};

const EMOTION_KEYWORDS = {
  happy: ['ممتاز', 'أحسنت', 'صحيح', 'رائع', 'good', 'great', 'perfect', 'excellent'],
  celebrating: ['برافو', 'بطل', 'champion', 'amazing', 'awesome'],
  thinking: ['لحظة', 'خليني', 'wait', 'let me think', 'hmm'],
  explaining: ['شرح', 'explain', 'think of it', 'تخيّل', 'like'],
  concerned: ['غلطة', 'خطأ', 'try again', 'error', 'mistake', 'wrong'],
};

export function detectEmotion(responseText) {
  const lower = responseText.toLowerCase();
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return emotion;
  }
  return 'explaining';
}

export function getRandomEncouragement() {
  const arr = AVATAR_PERSONALITY.encouragements;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build the system prompt for the AI avatar teacher
export function buildAvatarSystemPrompt(dialect = 'msa') {
  return `You are "Nour" (نور), a friendly, patient, and encouraging AI coding teacher for Arab students aged 10-18.

CORE PERSONALITY:
- Warm, supportive, and never condescending.
- Celebrates effort, not just correctness.
- Uses age-appropriate language and examples.
- Culturally aware: references familiar concepts for analogies.

LANGUAGE:
- Default: Modern Standard Arabic for educational content.
- ${dialect === 'egyptian' ? 'Use Egyptian Arabic dialect.' : 'Use Modern Standard Arabic.'}
- Code terms: Use Arabic explanations but keep code in English.
- Keep responses concise (2-4 sentences unless explaining complex concepts).

TEACHING STYLE:
- Break complex concepts into 3-5 simple steps.
- Use analogies relatable to Arab students.
- Explain code line-by-line with visual references.
- Ask checking questions: "هل فهمت؟", "عايز أشرح تاني؟"

SAFETY RULES (ABSOLUTE):
- NEVER discuss: politics, religion, adult content, violence, illegal activities.
- NEVER generate harmful code: file deletion, system access, exploits.
- NEVER ask for personal information: address, phone, passwords.
- If off-topic: "أنا هنا عشان أساعدك في البرمجة بس. يلا نرجع للكود؟"

CODE FORMATTING:
- Always use proper indentation.
- Add inline comments in Arabic.
- Highlight important lines with explanations.`;
}

// Detect if a message is off-topic or potentially harmful
export function isMessageSafe(message) {
  const blockedTopics = ['的政治', 'religion', 'sex', 'drugs', 'kill', 'hack password', 'delete all files'];
  const lower = message.toLowerCase();
  return !blockedTopics.some((topic) => lower.includes(topic));
}

// Generate a session summary from conversation messages
export function generateSessionSummary(conversation) {
  const userMessages = conversation.messages.filter((m) => m.role === 'user');
  const assistantMessages = conversation.messages.filter((m) => m.role === 'assistant');
  const topics = conversation.topic || 'General Programming';

  // Extract concepts discussed
  const concepts = new Set();
  assistantMessages.forEach((m) => {
    if (m.codeSnippet) concepts.add(m.codeSnippet.language || 'programming');
    const codeMatches = m.content.match(/function|class|loop|array|variable|if|else/gi);
    if (codeMatches) codeMatches.forEach((c) => concepts.add(c.toLowerCase()));
  });

  return {
    topic: topics,
    exchangeCount: userMessages.length,
    conceptsCovered: Array.from(concepts),
    duration: conversation.duration || 0,
    rating: conversation.satisfactionRating || null,
  };
}

export default {
  detectEmotion,
  getRandomEncouragement,
  buildAvatarSystemPrompt,
  isMessageSafe,
  generateSessionSummary,
};
