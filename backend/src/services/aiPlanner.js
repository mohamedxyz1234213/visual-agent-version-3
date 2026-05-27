// -----------------------------------------------------------------------------
// AI Planner - Deep Document Analysis → Lesson Architecture → Visual Teaching
//
// Pipeline:
// 1. COMPREHEND: AI reads the FULL document and builds a structured understanding
// 2. DECOMPOSE: Split into pedagogically meaningful lessons/sub-topics
// 3. TEACH: For each lesson, generate teacher-quality narration grounded in the doc
// 4. VISUALIZE: Generate rich, meaningful SVG storyboard scenes that actually
//    illustrate the concepts (diagrams, flows, hierarchies, comparisons, etc.)
//
// Every visual element on the whiteboard must teach something from the document.
// No filler. No generic labels. No empty decoration.
// -----------------------------------------------------------------------------

import dagre from '@dagrejs/dagre';
import { getBlazeConfig, resolveBlazeModel } from './blazeConfig.js';

const STOPWORDS = new Set([
  'about', 'after', 'again', 'against', 'almost', 'also', 'although', 'always',
  'among', 'another', 'around', 'because', 'before', 'being', 'between',
  'both', 'could', 'does', 'doing', 'during', 'each', 'either', 'enough',
  'every', 'from', 'further', 'have', 'having', 'into', 'just', 'lesson',
  'lessons', 'make', 'many', 'might', 'more', 'most', 'much', 'must', 'need',
  'only', 'other', 'over', 'part', 'parts', 'same', 'should', 'since', 'some',
  'still', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'under', 'until', 'very', 'what', 'when',
  'where', 'which', 'while', 'with', 'would', 'your', 'yours', 'document',
  'topic', 'topics', 'using', 'used', 'into', 'across', 'within', 'without',
  'from', 'upon', 'been', 'were', 'was', 'will', 'shall', 'than', 'then',
  'into', 'onto', 'ours', 'ourselves', 'theirs', 'themselves', 'himself',
  'herself', 'itself', 'ourselves', 'it', 'its', 'and', 'the', 'for', 'are',
  'but', 'not', 'you', 'our', 'can', 'how', 'why', 'who', 'whose', 'whereas',
  'whenever', 'however', 'therefore', 'thereby', 'thus', 'such', 'may', 'etc',
]);

const IGNORED_SECTION_HEADING_PATTERNS = [
  /^abstract$/i, /^introduction$/i, /^overview$/i,
  /^preface$/i, /^foreword$/i, /^table\s+of\s+contents$/i, /^contents$/i,
  /^references?$/i, /^bibliography$/i, /^works\s+cited$/i,
  /^appendix(?:es)?$/i, /^acknowledg(?:e)?ments?$/i,
  /^list\s+of\s+(?:figures|tables|references)$/i,
  /^notes?$/i, /^endnotes?$/i,
  /^[IVXLCDM]+$/i,
];

const WEAK_CONCEPTS = new Set([
  'this', 'that', 'these', 'those', 'it', 'you', 'your', 'we', 'our', 'they',
  'option', 'options', 'lesson', 'part', 'section', 'introduction', 'overview',
  'reference', 'references', 'bibliography', 'appendix', 'appendices', 'summary',
  'document', 'topic', 'topics', 'chapter', 'figure', 'table', 'introduce', 'define', 'review', 'apply',
]);

const LESSON_INTENT_VALUES = new Set(['teach', 'practice', 'notes']);

const PLANNER_META_CONCEPTS = new Set([
  'balanced lesson',
  'visual first',
  'step by step',
  'q a practice',
  'qa practice',
  'text focus',
  'teach me clearly',
  'question practice',
  'notes visuals',
  'notes + visuals',
  'explain it clearly',
  'show it visually',
  'go step by step',
  'practice with questions',
  'turn it into notes',
  'use a file',
  'describe a topic',
  'lesson builder',
  'request summary',
  'advanced ai settings',
]);

// ── Per-provider limits ──────────────────────────────────────────────────────
// Legacy high-context profile retained for backward-compatible sizing knobs.
const DEEPSEEK_CONTEXT_TOKENS = Number(process.env.DEEPSEEK_CONTEXT_TOKENS ?? 1_000_000);
// ~3.2M chars leaves room in 1M context for system prompt + JSON output (~4 chars/token est.)
const DEEPSEEK_MAX_INPUT_CHARS = Number(process.env.DEEPSEEK_MAX_INPUT_CHARS ?? 3_200_000);

const PROVIDER_LIMITS = {
  deepseek: {
    contextTokens:  DEEPSEEK_CONTEXT_TOKENS,
    maxInputChars:  DEEPSEEK_MAX_INPUT_CHARS,
    analysisTok:    Number(process.env.DEEPSEEK_ANALYSIS_TOKENS  ?? 128_000),
    contentTok:     Number(process.env.DEEPSEEK_CONTENT_TOKENS   ?? 256_000),
    analysisTimeout:Number(process.env.DEEPSEEK_ANALYSIS_TIMEOUT ?? 900_000),
    contentTimeout: Number(process.env.DEEPSEEK_CONTENT_TIMEOUT  ?? 1_800_000),
    cooldown:       Number(process.env.DEEPSEEK_COOLDOWN_MS      ?? 30_000),
  },
  blaze: {
    contextTokens:  128_000,
    maxInputChars:  200_000,
    analysisTok:    Number(process.env.BLAZE_ANALYSIS_TOKENS  ?? 32_000),
    contentTok:     Number(process.env.BLAZE_CONTENT_TOKENS   ?? 64_000),
    analysisTimeout:Number(process.env.AI_TIMEOUT_MS          ?? 600_000),
    contentTimeout: Number(process.env.AI_TIMEOUT_MS          ?? 600_000) + 300_000,
    cooldown:       Number(process.env.AI_COOLDOWN_MS         ?? 120_000),
  },
};

/** Max characters of source text to feed the model per request. */
function getInputCharLimit(aiProvider) {
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  return limits.maxInputChars ?? 200_000;
}

/** Max characters of section_text per lesson (teaching phase). */
function getSectionTextLimit(aiProvider) {
  if (aiProvider === 'deepseek') {
    return Number(process.env.DEEPSEEK_SECTION_CHARS ?? 800_000);
  }
  return 50_000;
}

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? 600_000);
const AI_COOLDOWN_MS = Number(process.env.AI_COOLDOWN_MS ?? 120_000);

const circuitState = {
  blaze:    { openUntil: 0, reason: '' },
  default:  { openUntil: 0, reason: '' },
};
let aiCircuitOpenUntil = 0;
let aiCircuitReason = '';
/** Records which backend path served the most recent AI request. */
let lastAiVia = null;

// =============================================================================
// PHASE 1 PROMPT: Deep document comprehension
// The AI must read the FULL document and produce a structured understanding
// =============================================================================

const COMPREHENSION_PROMPT = `You are an expert teacher preparing to teach from a document. Your task is to DEEPLY and THOROUGHLY analyze the ENTIRE document and produce a comprehensive structured understanding.

THINKING PROCESS (you MUST follow this before generating JSON):
1. First, read through the ENTIRE document from beginning to end. Note every major section.
2. For EACH section: identify the core concept, any commands/code shown, any procedures described, any tools mentioned.
3. Map the relationships: which concepts depend on others? What is the learning progression?
4. Identify what makes this document unique: what specific real-world context does it provide?
5. Only AFTER completing steps 1-4, generate your JSON output.

TAKE YOUR TIME. Process every paragraph. Understand the full scope. Do NOT rush. The user is NOT in a hurry — they want QUALITY, not speed.

CRITICAL RULES:
- Read the ENTIRE document from start to finish. Do NOT skip or skim any section.
- For each section you read, identify: what new knowledge it introduces, what skills it teaches, what relationships it reveals.
- Identify what this document is actually ABOUT — the real subject matter, not meta-information like author names, version numbers, or formatting instructions.
- Skip ONLY: title pages, tables of contents, acknowledgments, bibliographies, indices.
- Everything else is teachable content. Chapters, sections, examples, code snippets, explanations, analogies — ALL of it matters.
- Extract the actual knowledge: facts, definitions, processes, step-by-step procedures, relationships between concepts, examples, warnings, best practices.
- Be EXHAUSTIVE in your analysis. A 50-page document should produce 15+ topics with detailed breakdowns.
- Each topic MUST have 5+ details extracted verbatim or closely paraphrased from the source.
- Your output length should be PROPORTIONAL to the document length. A long document = long detailed analysis.

Return raw JSON only with this exact shape:
{
  "document_subject": "The precise main subject (e.g., 'DevOps Engineering: CI/CD, Docker, Kubernetes, and Production Deployment', 'Human Cardiovascular System: Anatomy and Pathology')",
  "field": "medical|architecture|mathematics|programming|science|history|business|language|general",
  "core_thesis": "2-3 sentences summarizing the main teaching purpose and what a student will learn",
  "key_topics": [
    {
      "topic": "Name of this topic/concept (use the actual terminology from the document)",
      "definition": "Clear 2-3 sentence definition or explanation drawn directly from the document",
      "importance": "Why this matters — what breaks or fails without this knowledge",
      "details": ["Specific fact 1 from the document", "Specific fact 2", "Specific fact 3", "Specific fact 4", "Specific fact 5"],
      "relationships": ["How this connects to topic X", "How this builds on topic Y", "How this enables topic Z"]
    }
  ],
  "logical_flow": "Detailed description of how topics build on each other — the document's teaching progression from foundations to advanced",
  "difficulty_level": "beginner|intermediate|advanced",
  "teaching_approach": "Specific visual strategy — e.g., 'flowcharts for deployment pipelines, labeled diagrams for architecture, comparison tables for tool selection, step-by-step process flows for setup procedures'"
}

Extract 10-20 key_topics depending on document length. A 50-page document MUST have at least 15 topics. Each topic MUST have real specific content extracted from the document — actual definitions, actual procedures, actual examples. NO generic placeholders like "This is important" or "Key concept in the field".`;

// =============================================================================
// PHASE 2 PROMPT: Lesson decomposition based on comprehension
// =============================================================================

const DECOMPOSITION_PROMPT = `Based on the document analysis below, create a teaching plan that DYNAMICALLY breaks this material into the appropriate number of lessons.

THINKING PROCESS (follow BEFORE generating output):
1. Read through ALL the topics identified in the analysis. Group them logically by chapter/section.
2. Determine how many lessons are needed based on the volume and complexity of material.
3. For each lesson, identify exactly which paragraphs/sections of the source document it should cover.
4. Plan the progression: foundations first, then building blocks, then advanced applications.
5. Only THEN generate the JSON with exhaustive section_text for each lesson.

LESSON COUNT RULES — adapt to document complexity:
- Short document (1-5 pages, 1-3 topics): 1-2 lessons
- Medium document (5-20 pages, 3-8 topics): 3-5 lessons  
- Large document (20-50+ pages, 8+ topics): 5-10 lessons
- Each lesson should focus on ONE coherent chapter/section of the document
- NEVER cram multiple unrelated chapters into one lesson

The user is NOT in a rush. Take your time to produce the BEST possible teaching plan. Each lesson must be substantial enough to fill 5-10 minutes of teaching with rich content.

Each lesson must:
- Cover a coherent chunk of the material that can stand alone as a complete teaching unit
- Have a specific, measurable learning objective (not vague goals)
- Build naturally from the previous lesson (if any)
- Include EXTENSIVE actual content to teach — real definitions, facts, processes, code examples, step-by-step procedures from the document
- The section_text field is CRITICAL: it must contain 5000-15000 characters of actual document content. This is what the content generator reads to create the lesson. If you provide too little text, the lesson will be empty and useless.

Return raw JSON only:
{
  "course_title": "Descriptive course title that captures the full scope",
  "lessons": [
    {
      "lesson_number": 1,
      "title": "Specific descriptive title (e.g., 'Docker Containers: Building, Running, and Networking' not just 'Docker')",
      "learning_objective": "By the end of this lesson, the learner will be able to: [specific measurable outcome]",
      "key_points": ["Specific point 1 with real content", "Specific point 2", "Specific point 3", "Specific point 4", "Specific point 5"],
      "topics_covered": ["topic name 1", "topic name 2", "topic name 3"],
      "section_text": "EXTENSIVE verbatim excerpt of ALL source material relevant to this lesson. Include complete paragraphs, full definitions, all explanations, examples, code snippets, procedures, warnings, best practices. 5000-15000 characters MINIMUM. The more text you provide here, the better the final lesson will be. Do NOT summarize — include the actual raw text from the document.",
      "visual_strategy": "Specific visual plan — e.g., 'Page 1: labeled architecture diagram showing frontend→backend→database flow. Page 2: step-by-step flowchart of the deployment pipeline. Page 3: comparison table of Docker vs VM. Page 4: code structure diagram showing file organization.'"
    }
  ]
}`;

// =============================================================================
// PHASE 3B PROMPT: Refinement pass — AI reviews its own output and improves it
// =============================================================================

const REFINEMENT_PROMPT = `You are a strict educational whiteboard critic.

Review the storyboard quality before any whiteboard coordinates are generated.

Your job is to improve TEACHING QUALITY, VISUAL MEANING, COGNITIVE CLARITY, and TEACHER-LIKE PACING.

Reject or rewrite any content part that has:
- decorative visuals
- weak teaching logic
- too much on-screen text
- random arrows or unclear relationships
- generic cards or templated wording
- missing examples
- slideshow feeling
- unclear teaching order
- overlap risk caused by too many simultaneous visual anchors

Critical rules:
- Do NOT add coordinates.
- Do NOT add raw visual_sequence drawing commands.
- Keep every content part focused on one main teaching goal.
- Keep visible text short and anchor-based.
- visual_logic entries must stay semantic, purposeful, and compact.
- Prefer hook -> concept -> relationship -> example -> mini recap -> quiz.

Score every content part from 1-10 on:
1. teaching_quality
2. visual_meaning
3. cognitive_clarity
4. scene_cleanliness
5. teacher_realism

If any score is below 9, rewrite that part until it would score at least 9 across all five dimensions.

Return the IMPROVED JSON in the SAME schema format.
IMPORTANT: Return ONLY valid JSON. No markdown fences. No explanatory text before or after.`;

// PHASE 3 PROMPT: Content + Visual generation for each lesson
// This is where the actual teaching happens
// =============================================================================

const TEACHING_PROMPT = `You are not a summarizer, slideshow generator, or generic AI assistant.

You are an elite instructional designer, cognitive learning expert, and professional whiteboard teacher — the kind who makes students say "I finally get it."

Your task is to transform lesson material into a highly structured, pedagogically accurate, visually meaningful, teacher-like whiteboard lesson that feels like being in a REAL classroom with an extraordinary teacher.

PRIMARY OBJECTIVE
- Teach deeply and visually like an exceptional human teacher standing at a whiteboard.
- Build understanding GRADUALLY — reveal one idea at a time, just like a real teacher drawing step by step.
- The whiteboard must feel ALIVE: the teacher writes, draws, circles, connects, erases, and rebuilds.
- Optimize for deep understanding, not decoration or information density.

TEACHER-LIKE SEQUENCING (this is what makes the difference)
- Start EVERY part with a hook: a question, a surprising fact, or a relatable scenario.
- Write the core keyword/term FIRST on the board, then explain around it.
- Draw connections AFTER establishing individual concepts — never all at once.
- Use pauses (clear) between major concept shifts — like a teacher erasing the board.
- Build complexity gradually: simple → nuanced → applied.
- End each section by circling back to connect with what came before.

ABSOLUTE RULES
- Use only source-grounded information unless topic mode explicitly allows general instructional knowledge.
- Teach. Never merely summarize or list bullet points.
- One content part = one teaching goal. Never cram multiple unrelated ideas.
- Keep visible whiteboard text short: 3-12 words per element. A teacher writes KEYWORDS, not paragraphs.
- No decorative visuals — every drawn element must advance understanding.
- No random arrows. Arrows ONLY represent: cause→effect, sequence, dependency, data flow, or transformation.
- Never output coordinates, x/y positions, or raw visual_sequence drawing commands.
- Output semantic roles only. The layout engine decides placement.
- One core idea per scene with 2-4 supporting visuals maximum. Never overload.
- NEVER repeat the same visual pattern across parts. Each part must feel unique.

VISUAL PEDAGOGY (match the concept to the right visual form)
- Cause/effect → arrow with labeled relationship
- Sequence/process → numbered path or pipeline
- Timeline → chronological bar with markers
- Hierarchy → tree with clear parent-child
- Comparison → side_by_side boxes with differentiators
- Category/grouping → cluster of related items
- Data/quantity → graph with labeled axes
- Definition → keyword in bold + callout explanation
- Formula/equation → isolated centered equation
- Example → boxed worked illustration with steps

DYNAMIC VARIETY (prevent templated feel)
- NEVER use the same visual_logic pattern in consecutive parts.
- Vary the teaching flow: hook→concept→example, or question→discovery→principle, or story→diagram→rule.
- Each animation_sequence must be unique — mix different orderings.
- Use different visual types across parts: if Part 1 uses arrows, Part 2 should use boxes or a table.

QUALITY BAR
- Every narration sentence must teach a distinct idea — no filler, no repetition.
- Every visual element must improve understanding of the specific concept being taught.
- The student should feel progressive "aha" moments, not information overload.
- Narration should sound like a teacher TALKING, not reading from a textbook.

OUTPUT CONTRACT
Return ONLY valid JSON with this schema:
{
  "title": "",
  "subject": "",
  "summary": "",
  "parts": [
    {
      "order_index": 1,
      "title": "",
      "part_type": "content",
      "duration_seconds": 360,
      "scene_goal": "",
      "learning_objective": "",
      "narration": "",
      "key_concepts": [""],
      "visual_logic": [
        {
          "type": "",
          "semantic_role": "",
          "relationship": "",
          "importance": "",
          "content": ""
        }
      ],
      "animation_sequence": ["hook", "concept", "relationship", "example", "mini_recap"]
    },
    {
      "order_index": 2,
      "title": "",
      "part_type": "quiz",
      "duration_seconds": 55,
      "narration": "",
      "key_concepts": [],
      "quiz_questions": [
        {
          "order_index": 1,
          "question_type": "mcq",
          "question_text": "",
          "difficulty": "medium",
          "options": { "choices": ["A", "B", "C", "D"], "correct": "A" },
          "correct_answer": "A",
          "explanation": ""
        }
      ]
    }
  ]
}

Before finalizing, internally verify:
- Does each part teach ONE clear idea progressively?
- Would a real teacher draw these visuals in this order?
- Is there visual VARIETY between parts (not the same pattern repeated)?
- Is the narration conversational and teacher-like (not textbook-like)?
- Is the pacing gradual with proper build-up?

If not, improve it before returning the JSON.`; 

// ─── Mode-specific prompt prefix ──────────────────────────────────────────────
function buildModePrefix(mode) {
  switch (mode) {
    case 'visual_first':
      return 'EXPLANATION MODE: VISUAL FIRST\n- Prioritize diagrams, graphs, and illustrations above all else.\n- Use at least 120 visual steps per content part and keep whiteboard activity continuous from the first reveal to the final frame.\n- Keep narration brief (300-500 words per part).\n- For math: always use draw_coordinate_system with plot_points. For physics: use draw_physics_shape.\n- For biology or science: use detailed draw_object scenes such as cells, leaves, or apparatus with labeled internal parts.\n- Use draw_table for any comparisons.\n\n';
    case 'step_by_step':
      return 'EXPLANATION MODE: STEP BY STEP\n- Build one concept at a time with a clear, slow progression.\n- Use "clear" frequently between concepts to avoid clutter.\n- Number every step visually. Narration should explicitly say "Step 1", "Step 2", etc.\n- Pause to reinforce each idea with a callout before moving to the next.\n\n';
    case 'qa_mode':
      return 'EXPLANATION MODE: Q&A PRACTICE\n- Prioritize quiz parts over content parts. Structure: brief intro → quiz → content → quiz → content → final quiz.\n- Each quiz should have 3 questions instead of 2.\n- Narration should pose rhetorical questions and guide the student to think before revealing answers.\n\n';
    case 'text_focus':
      return 'EXPLANATION MODE: TEXT FOCUS\n- Write long, detailed narrations (1200-1500 words per content part) with full explanations.\n- Use fewer visual clears — build up dense diagrams that stay on screen.\n- Keep adding teaching visuals throughout the entire part; do not front-load all of the diagrams at the start.\n- Emphasize labeled diagrams with draw_callout for explanatory text.\n\n';
    case 'full_lesson':
    default:
      return '';
  }
}

function normalizePlannerPhrase(value) {
  return normalizeText(String(value || ''))
    .toLowerCase()
    .replace(/[+&/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isPlannerMetaConcept(value) {
  const normalized = normalizePlannerPhrase(value);
  if (!normalized) return false;
  if (PLANNER_META_CONCEPTS.has(normalized)) return true;
  return /^(primary lesson goal|preferred delivery style|specific user requirements|lesson intent|teaching preset)\b/.test(normalized);
}

function cleanUserInstructions(userInstructions) {
  const lines = String(userInstructions || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return '';

  const cleaned = [];
  for (const line of lines) {
    if (/^specific user requirements:/i.test(line)) {
      const stripped = line.replace(/^specific user requirements:\s*/i, '').trim();
      if (stripped) cleaned.push(stripped);
      continue;
    }
    if (/^(primary lesson goal|preferred delivery style|lesson intent|teaching preset):/i.test(line)) {
      continue;
    }
    cleaned.push(line);
  }

  return normalizeText(cleaned.join('\n'));
}

function normalizeLessonIntent(rawIntent, userInstructions = '') {
  const explicit = String(rawIntent || '').trim().toLowerCase();
  if (LESSON_INTENT_VALUES.has(explicit)) return explicit;

  const normalizedInstructions = normalizePlannerPhrase(userInstructions);
  if (/question practice|practice with questions|prioritize question practice|worked answers/.test(normalizedInstructions)) {
    return 'practice';
  }
  if (/turn it into notes|notes visuals|concise study notes|well structured notes/.test(normalizedInstructions)) {
    return 'notes';
  }
  return 'teach';
}

function buildIntentPrefix(lessonIntent) {
  switch (normalizeLessonIntent(lessonIntent)) {
    case 'practice':
      return 'LESSON INTENT: PRACTICE\n- Keep explanations tight, then reinforce with worked examples, checks for understanding, and answer-focused visuals.\n- Favor concrete scenarios, short comparisons, and problem-solving steps over broad introductory filler.\n\n';
    case 'notes':
      return 'LESSON INTENT: NOTES\n- Present the material as concise study notes with strong structure, memorable summaries, and selective visuals.\n- Favor definitions, comparisons, tables, and compact takeaways over theatrical narration.\n\n';
    case 'teach':
    default:
      return 'LESSON INTENT: TEACH\n- Explain from first principles with clear reasoning, progressive visual builds, and teacher-quality flow.\n\n';
  }
}

function buildIntentObjective(title, lessonIntent) {
  switch (normalizeLessonIntent(lessonIntent)) {
    case 'practice':
      return `Use ${title} in worked questions and checks for understanding so the learner can apply the idea accurately.`;
    case 'notes':
      return `Summarize ${title} into concise, accurate notes supported by visual anchors and quick comparisons.`;
    case 'teach':
    default:
      return `Explain ${title} clearly, accurately, and step by step using a student-friendly teaching sequence.`;
  }
}

function buildSourceModePrefix(sourceMode) {
  if (sourceMode !== 'topic') return '';

  return 'INPUT MODE: TOPIC REQUEST\n- The material below is a user-requested topic or question, not a source document.\n- Use accurate mainstream educational knowledge for this subject.\n- You may use standard definitions, formulas, canonical examples, and common teaching diagrams.\n- Do NOT invent citations, page references, or pretend the topic prompt already contained the full explanation.\n- Keep every claim technically correct and suitable for teaching a student from first principles.\n\n';
}

const TOPIC_SCAFFOLD_PROMPT = `You are preparing a lesson for a direct topic request. Use accurate mainstream educational knowledge and return raw JSON only.

If the topic request is just a short seed such as a single concept or short phrase, you must expand it into a complete teachable scope on your own. Infer the foundations, core components, mechanism or sequence, key examples, and practical meaning that a student would need for a high-quality lesson.

Return this exact shape:
{
  "document_subject": "Precise topic title",
  "field": "biology|medical|architecture|mathematics|programming|science|history|business|economics|language|general",
  "core_thesis": "2-3 sentences describing what a learner should understand by the end",
  "key_topics": [
    {
      "topic": "Core subtopic name",
      "definition": "Accurate teaching definition",
      "importance": "Why this matters or what it explains",
      "details": ["Specific supporting detail", "Specific supporting detail"],
      "relationships": ["How it connects to another subtopic"]
    }
  ],
  "logical_flow": "A clean teaching sequence from foundation to application",
  "difficulty_level": "beginner|intermediate|advanced",
  "teaching_approach": "Visual and instructional approach that suits the topic",
  "source_brief": "8-14 full sentences that a teacher could teach from directly. Define the topic, explain the mechanism or structure, include one concrete application or worked example when appropriate, and mention the best visual anchors. Do not mention the user or refer to this as a request."
}`;

function stripTopicRequestLead(text) {
  return normalizeText(text)
    .replace(/^(please\s+)?(?:(?:can|could|would)\s+you\s+)?(explain|teach|describe|show|outline|summarize|walk me through|help me understand|help me learn|give me|write)\s+/i, '')
    .replace(/^(what\s+is|what\s+are|how\s+does|how\s+do|why\s+does|why\s+do)\s+/i, '')
    .replace(/[?.!]+$/, '')
    .trim();
}

function titleCasePhrase(text) {
  return normalizeText(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (/^[A-Z0-9/-]+$/.test(word)) return word;
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function buildTopicTitle(rawText) {
  const normalized = stripTopicRequestLead(rawText);
  if (!normalized) return 'Requested Topic';

  const focused = normalized
    .replace(/\b(with|using|through|via|including|focus(?:ing)?\s+on|for\s+beginners?|in\s+simple\s+terms|step\s+by\s+step)\b.*$/i, '')
    .trim();

  const candidate = focused || normalized;
  const limited = candidate.split(/\s+/).slice(0, 8).join(' ');
  return clampText(titleCasePhrase(limited), 72) || makeReadableTitle(candidate, normalized) || 'Requested Topic';
}

const INSTRUCTIONAL_META_PREFIX_RE = /^(the learner should be able to|the learner will|the learner can|learners? will (?:understand|learn|be able to)|learners should(?: practice)?|the explanation should|a good explanation of|a complete explanation of|the lesson should|by the end of this lesson|specifically[, ]+they should be able to|according to the source material|to make that visible|on the board, this means|this stage matters because|this matters because)/;
const INSTRUCTIONAL_META_INLINE_RE = /\b(the learner should|the learner will|learners will|the explanation should|according to the source material)\b/;
const STRUCTURAL_SCENE_TYPES = new Set([
  'draw_object',
  'draw_physics_shape',
  'draw_graph',
  'draw_coordinate_system',
  'draw_table',
  'draw_path',
  'draw_line',
]);
const HISTORY_VISUAL_CUE_RE = /\b(revolution|war|empire|monarchy|republic|constitution|uprising|treaty|dynasty|era|period|historical)\b/;
const ECONOMICS_VISUAL_CUE_RE = /\b(supply|demand|equilibrium|price|shortage|surplus|elasticity|inflation|gdp|fiscal|monetary)\b/;
const ECONOMICS_MARKET_RE = /\bmarket\b/;
const ECONOMICS_MARKET_CONTEXT_RE = /\b(price|competition|consumer|producer|equilibrium|shortage|surplus)\b/;
const BUSINESS_VISUAL_CUE_RE = /\b(strategy|leadership|stakeholder|governance|alignment|vision|execution|competitive|capability|organizational|change management)\b/;
const BIOLOGY_VISUAL_CUE_RE = /\b(cell|mitosis|meiosis|chromosome|spindle|dna|rna|membrane|organelle|nucleus|enzyme|chloroplast)\b/;
const CYCLE_VISUAL_CUE_RE = /\b(water cycle|evaporation|condensation|precipitation|runoff|collection|infiltration|transpiration|carbon cycle|nitrogen cycle|rock cycle|feedback loop)\b/;
const SYSTEMS_VISUAL_CUE_RE = /\b(blockchain|validator|ledger|consensus|distributed|transaction|network|protocol|api|server|database|service|cache|queue|router)\b/;
const PHYSICS_VISUAL_CUE_RE = /\b(physics|force|energy|motion|velocity|acceleration|gravity|mass|friction|pendulum|spring|wave|ramp|inclined plane)\b/;
const MATHEMATICS_VISUAL_CUE_RE = /\b(cos|cosine|sin|sine|tangent|trigonometry|graph|coordinate|axis|slope|function|quadratic|parabola)\b/;
const DIRECT_VISUAL_FIELDS = new Set(['medical', 'chemistry']);

function isInstructionalMetaSentence(value) {
  const normalized = normalizeText(String(value || '')).toLowerCase();
  if (!normalized) return false;

  return INSTRUCTIONAL_META_PREFIX_RE.test(normalized)
    || INSTRUCTIONAL_META_INLINE_RE.test(normalized);
}

function filterInstructionalMetaEntries(values) {
  return uniqueNormalizedStrings((Array.isArray(values) ? values : [values])
    .map((value) => normalizeSentence(value))
    .filter(Boolean)
    .filter((value) => !isInstructionalMetaSentence(value)), 24);
}

function firstMeaningfulEntry(...collections) {
  for (const collection of collections) {
    const values = Array.isArray(collection) ? collection : [collection];
    for (const value of values) {
      const normalized = normalizeSentence(value);
      if (!normalized || isInstructionalMetaSentence(normalized)) continue;
      return normalized;
    }
  }

  return '';
}

function buildTopicSourceBrief(topicSpec) {
  const comprehension = topicSpec.comprehension || {};
  const topics = Array.isArray(comprehension.key_topics) ? comprehension.key_topics : [];
  const lines = [];

  if (comprehension.core_thesis && !isInstructionalMetaSentence(comprehension.core_thesis)) {
    lines.push(normalizeSentence(comprehension.core_thesis));
  } else if (topicSpec.title) {
    lines.push(normalizeSentence(`${topicSpec.title} is the focus of this lesson.`));
  }

  topics.slice(0, 5).forEach((topic) => {
    if (topic?.topic && topic?.definition && !isInstructionalMetaSentence(topic.definition)) {
      lines.push(normalizeSentence(`${topic.topic}: ${topic.definition}`));
    } else if (topic?.topic) {
      lines.push(normalizeSentence(`${topic.topic} is one of the main ideas to understand.`));
    }

    lines.push(...filterInstructionalMetaEntries([
      topic?.importance || '',
      ...uniqueNormalizedStrings(topic?.details, 2),
    ]));
  });

  if (comprehension.logical_flow && !isInstructionalMetaSentence(comprehension.logical_flow)) {
    lines.push(normalizeSentence(comprehension.logical_flow));
  }

  return normalizeText(lines.join(' '));
}

function buildTopicEntry(topic, definition, importance, details = [], relationships = []) {
  return {
    topic,
    definition,
    importance,
    details,
    relationships,
  };
}

function buildTopicHeuristicComprehension(topicText, field, title) {
  // Removed hardcoded topic heuristics — the AI generates comprehension dynamically
  // for all topics, producing more accurate and varied results.
  return null;
}

function buildTopicHeuristicTitle(topicText) {
  // Removed hardcoded title heuristics — dynamic title generation handles all topics.
  return '';
}

function extractTopicSupportPhrases(text) {
  const normalized = stripTopicRequestLead(text);
  const match = normalized.match(/\b(?:with|using|through|via|including|featuring|covering|focused on|focus on|about)\b\s+(.+)$/i);
  if (!match?.[1]) return [];

  return uniqueNormalizedStrings(
    match[1]
      .split(/\s*(?:,|;|\band\b|\bas well as\b|\balong with\b)\s*/i)
      .map((value) => normalizeConcept(titleCasePhrase(value)))
      .filter(Boolean),
    6,
  );
}

function conceptSkeleton(value) {
  return normalizeConcept(value)
    .toLowerCase()
    .replace(/\b(and|or|the|of|for|to|in|on|with|by|a|an)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupePromptConcepts(values, limit = 6) {
  const result = [];

  for (const rawValue of uniqueNormalizedStrings(values, 12)) {
    const candidate = titleCasePhrase(normalizeText(rawValue));
    const candidateKey = conceptSkeleton(candidate);
    if (!candidateKey) continue;

    const existingIndex = result.findIndex((entry) => {
      const entryKey = conceptSkeleton(entry);
      return entryKey === candidateKey || entryKey.includes(candidateKey) || candidateKey.includes(entryKey);
    });

    if (existingIndex === -1) {
      result.push(candidate);
      continue;
    }

    const existing = result[existingIndex];
    const shouldReplace = candidate.split(/\s+/).length > existing.split(/\s+/).length || candidate.length > existing.length + 3;
    if (shouldReplace && conceptSkeleton(candidate).includes(conceptSkeleton(existing))) {
      result[existingIndex] = candidate;
    }
  }

  return result.slice(0, limit);
}

function buildShortTopicExpansionConcepts(rootConcept, field) {
  const root = titleCasePhrase(normalizeText(rootConcept));
  if (!root) return [];

  switch (field) {
    case 'biology':
    case 'medical':
    case 'science':
      return [`${root} Overview`, `${root} Structures`, `${root} Main Stages`, `${root} Inputs and Outputs`, `${root} Importance`];
    case 'mathematics':
      return [`${root} Definition`, `${root} Formula`, `${root} Graph`, `${root} Worked Example`, `${root} Interpretation`];
    case 'history':
      return [`${root} Background`, `${root} Major Phases`, `${root} Key Forces`, `${root} Consequences`, `${root} Legacy`];
    case 'economics':
    case 'business':
      return [`${root} Core Idea`, `${root} Key Drivers`, `${root} Structure and Layers`, `${root} Decisions and Tradeoffs`, `${root} Real-World Application`];
    case 'programming':
      return [`${root} Purpose`, `${root} Core Components`, `${root} Control Flow`, `${root} Example`, `${root} Common Pitfalls`];
    default:
      return [`${root} Core Idea`, `${root} Main Components`, `${root} How It Works`, `${root} Example`, `${root} Common Misunderstandings`];
  }
}

function isSamePromptConcept(left, right) {
  return normalizeConcept(left).toLowerCase() === normalizeConcept(right).toLowerCase();
}

function detectPromptAwareConceptRole(concept, field, rootConcept = '') {
  const conceptCorpus = `${field} ${concept}`.toLowerCase();
  const rootCorpus = `${field} ${rootConcept}`.toLowerCase();
  const isRootConcept = isSamePromptConcept(concept, rootConcept);

  if (/\b(blockchain|consensus|validator|ledger|node|transaction|protocol|distributed)\b/.test(conceptCorpus) || (isRootConcept && /\b(blockchain|consensus|validator|ledger|node|transaction|protocol|distributed)\b/.test(rootCorpus))) {
    if (/\b(validator|node|miner)\b/.test(conceptCorpus)) return 'system_actor';
    if (/\b(block|ledger|transaction)\b/.test(conceptCorpus)) return 'record_structure';
    if (/\b(consensus|protocol)\b/.test(conceptCorpus)) return 'coordination_rule';
    return 'distributed_system';
  }

  if (field === 'biology' || /\b(mitosis|meiosis|chromosome|spindle|dna|rna|gene|cell|membrane|nucleus|protein|enzyme|organelle|chloroplast|fiber)\b/.test(conceptCorpus) || (isRootConcept && /\b(mitosis|meiosis|chromosome|spindle|dna|rna|gene|cell|membrane|nucleus|protein|enzyme|organelle|chloroplast|fiber)\b/.test(rootCorpus))) {
    if (/\b(mitosis|meiosis|division|replication|synthesis|reaction|transport|cycle|process)\b/.test(conceptCorpus) || (isRootConcept && /\b(mitosis|meiosis|division|replication|synthesis|reaction|transport|cycle|process)\b/.test(rootCorpus))) return 'biology_process';
    if (/\b(phase|stage)\b/.test(conceptCorpus)) return 'biology_stage';
    return 'biology_structure';
  }

  if (field === 'economics' || /\b(supply|demand|equilibrium|shortage|surplus|price|market|consumer|producer|elasticity|inflation|cost)\b/.test(conceptCorpus) || (isRootConcept && /\b(supply|demand|equilibrium|shortage|surplus|price|market|consumer|producer|elasticity|inflation|cost)\b/.test(rootCorpus))) {
    if (/\b(equilibrium|shortage|surplus)\b/.test(conceptCorpus)) return 'market_condition';
    if (/\b(price|cost|quantity|revenue|profit)\b/.test(conceptCorpus)) return 'market_quantity';
    return 'market_force';
  }

  if (field === 'history' || /\b(revolution|war|empire|monarchy|republic|constitution|uprising|treaty|dynasty|cause|causes|phase|phases|outcome|outcomes|legacy|aftermath)\b/.test(conceptCorpus) || (isRootConcept && /\b(revolution|war|empire|monarchy|republic|constitution|uprising|treaty|dynasty)\b/.test(rootCorpus))) {
    if (/\b(cause|causes|trigger|grievance|tax|debt|crisis|pressure)\b/.test(conceptCorpus)) return 'history_cause';
    if (/\b(phase|phases|stage|period|turning point|assembly|terror|event)\b/.test(conceptCorpus)) return 'history_phase';
    if (/\b(outcome|outcomes|effect|effects|consequence|legacy|aftermath|result)\b/.test(conceptCorpus)) return 'history_outcome';
    return isRootConcept ? 'history_event' : 'history_factor';
  }

  if (/\b(water cycle|hydrologic|hydrological|evaporation|condensation|precipitation|runoff|collection|infiltration|transpiration|carbon cycle|nitrogen cycle|rock cycle|cycle)\b/.test(conceptCorpus) || (isRootConcept && /\b(water cycle|hydrologic|hydrological|evaporation|condensation|precipitation|runoff|collection|infiltration|transpiration|carbon cycle|nitrogen cycle|rock cycle|cycle)\b/.test(rootCorpus))) {
    if (/\b(evaporation|condensation|precipitation|runoff|collection|infiltration|transpiration|phase|stage)\b/.test(conceptCorpus)) return 'cycle_stage';
    return isRootConcept ? 'process_cycle' : 'scientific_factor';
  }

  if (field === 'programming' || /\b(api|service|server|database|algorithm|workflow|pipeline|client|cache|network|state|deployment)\b/.test(conceptCorpus) || (isRootConcept && /\b(api|service|server|database|algorithm|workflow|pipeline|client|cache|network|state|deployment)\b/.test(rootCorpus))) {
    if (/\b(api|service|server|database|client|cache|node|validator)\b/.test(conceptCorpus)) return 'system_component';
    if (/\b(protocol|workflow|pipeline|deployment|request|state|algorithm)\b/.test(conceptCorpus)) return 'system_process';
    return 'system_component';
  }

  if (/\b(step|phase|stage|cycle|workflow|sequence|model)\b/.test(conceptCorpus)) return 'process_stage';
  return 'general_component';
}

function buildPromptAwareDefinition(concept, role, rootConcept, concepts) {
  const isRootConcept = isSamePromptConcept(concept, rootConcept);
  const related = concepts.filter((entry) => entry !== concept).slice(0, 2);
  const relatedText = related.length ? related.join(' and ') : rootConcept;

  if (isRootConcept) {
    return `${concept} is the central idea that connects ${relatedText} into one coherent explanation.`;
  }

  const roleCategory = role.split('_')[0];
  switch (roleCategory) {
    case 'biology':
      return `${concept} is a biological component or process within ${rootConcept}.`;
    case 'market':
      return `${concept} is a market factor that influences the outcome in ${rootConcept}.`;
    case 'history':
      return `${concept} is a historical element that shapes the sequence of ${rootConcept}.`;
    case 'system':
    case 'distributed':
    case 'record':
    case 'coordination':
      return `${concept} is a system component that enables ${rootConcept} to function.`;
    case 'cycle':
    case 'process':
    case 'scientific':
      return `${concept} is a stage or factor in the process of ${rootConcept}.`;
    default:
      return `${concept} is one of the key elements used to explain ${rootConcept}.`;
  }
}

function buildPromptAwareImportance(concept, role, rootConcept, concepts) {
  const isRootConcept = isSamePromptConcept(concept, rootConcept);
  const related = concepts.filter((entry) => entry !== concept).slice(0, 2);
  const relatedText = related.length ? related.join(' and ') : rootConcept;

  if (isRootConcept) {
    return `Understanding ${concept} is essential because it organizes ${relatedText} into a clear, learnable sequence.`;
  }

  return `${concept} matters because it reveals how one part of ${rootConcept} connects to or drives another.`;
}

function buildPromptAwareDetails(concept, role, rootConcept, concepts) {
  const isRootConcept = isSamePromptConcept(concept, rootConcept);
  const related = concepts.filter((entry) => entry !== concept).slice(0, 2);

  if (isRootConcept) {
    return uniqueNormalizedStrings([
      `${concept} should be taught as a connected system rather than isolated facts.`,
      related[0] ? `Connect ${related[0]} to the next visible change in the process.` : '',
      `The learner should be able to describe how the parts work together.`,
    ], 3);
  }

  return uniqueNormalizedStrings([
    `${concept} should be shown in relation to ${rootConcept}, not in isolation.`,
    related[0] ? `Link ${concept} to ${related[0]} to show how they interact.` : '',
    `The learner should understand what ${concept} contributes to the whole.`,
  ], 3);
}

function buildPromptAwareTeachingApproach(field, topicText, concepts) {
  const corpus = `${field} ${topicText} ${(concepts || []).join(' ')}`.toLowerCase();

  if (field === 'mathematics') return 'step-by-step with equations, graphs, and plotted comparisons';
  if (field === 'biology' || /\b(cell|chromosome|spindle|dna|enzyme|membrane|nucleus|phase|mitosis|meiosis)\b/.test(corpus)) {
    return 'labeled biological objects, stage-by-stage process diagrams, and component callouts';
  }
  if (/\b(water cycle|evaporation|condensation|precipitation|runoff|collection|infiltration|transpiration|carbon cycle|nitrogen cycle|rock cycle|feedback loop)\b/.test(corpus)) {
    return 'cyclic process objects, stage-by-stage flow diagrams, and phase callouts';
  }
  if (field === 'economics' || /\b(supply|demand|equilibrium|market|price|shortage|surplus|elasticity)\b/.test(corpus)) {
    return 'axes-based market graphs, equilibrium markers, and comparison callouts';
  }
  if (/\b(blockchain|validator|ledger|consensus|distributed|transaction|network|protocol|api|server|database|service|cache)\b/.test(corpus)) {
    return 'network objects, state-flow diagrams, and component callouts';
  }
  if (field === 'history') return 'timelines, causal chains, and consequence comparisons';
  if (field === 'programming') return 'system diagrams, flowcharts, and data-movement callouts';
  return 'progressive diagrams, concrete object layouts, and comparison boards';
}

function buildPromptAwareTopicComprehension(topicText, field, title) {
  const cleaned = stripTopicRequestLead(topicText);
  if (!cleaned) return null;

  const supportPhrases = extractTopicSupportPhrases(cleaned);
  const coreTitle = buildTopicTitle(cleaned) || title;
  const resolvedField = detectField(`${field} ${cleaned}`);
  const isCycleTopic = /\b(water cycle|evaporation|condensation|precipitation|runoff|collection|infiltration|transpiration|carbon cycle|nitrogen cycle|rock cycle|feedback loop)\b/i.test(cleaned);
  const shortTopicRequest = cleaned.split(/\s+/).filter(Boolean).length <= 3;
  const extractedConcepts = sanitizeConceptList([
    ...supportPhrases,
    ...extractKeyConcepts(cleaned, [coreTitle], 8),
  ], cleaned, 6);
  const expansionConcepts = shortTopicRequest ? buildShortTopicExpansionConcepts(coreTitle, resolvedField) : [];
  const concepts = dedupePromptConcepts([coreTitle, ...supportPhrases, ...extractedConcepts, ...expansionConcepts], 6);

  if (!concepts.length) return null;

  const rootConcept = concepts[0] || coreTitle || title;
  const supportConcepts = concepts.slice(1, 5);
  const supportSummary = supportConcepts.length ? supportConcepts.join(', ') : 'its main components and outcomes';
  const keyTopics = concepts.slice(0, 6).map((concept) => {
    const role = detectPromptAwareConceptRole(concept, resolvedField, rootConcept);
    return buildTopicEntry(
      concept,
      buildPromptAwareDefinition(concept, role, rootConcept, concepts),
      buildPromptAwareImportance(concept, role, rootConcept, concepts),
      buildPromptAwareDetails(concept, role, rootConcept, concepts),
      supportConcepts
        .filter((entry) => entry !== concept)
        .slice(0, 2)
        .map((entry) => `${concept} connects to ${entry}`),
    );
  });

  const coreThesis = resolvedField === 'biology'
    ? `${rootConcept} is best understood as a biological system or sequence rather than a list of isolated terms. This lesson will track ${supportSummary} so the learner can explain what changes, what interacts, and what outcome the process produces.`
    : resolvedField === 'economics'
      ? `${rootConcept} is best understood by tracking how market forces interact instead of memorizing isolated definitions. This lesson will connect ${supportSummary} so the learner can predict how the outcome shifts when conditions change.`
      : resolvedField === 'history'
        ? `${rootConcept} is best understood as a chain of causes, phases, and consequences rather than as a single event name. This lesson will connect ${supportSummary} so the learner can explain what triggered the change, what happened across the timeline, and what remained afterward.`
        : isCycleTopic
          ? `${rootConcept} is best understood as a repeating process instead of a loose set of vocabulary words. This lesson will connect ${supportSummary} so the learner can track what changes at each stage and how the cycle continues.`
      : /\b(blockchain|validator|ledger|consensus|distributed|transaction|network|protocol)\b/i.test(cleaned)
        ? `${rootConcept} is best understood as a coordinated system with participants, records, and decision rules. This lesson will connect ${supportSummary} so the learner can explain how information moves and why one result becomes accepted.`
        : `${rootConcept} should be explained through its concrete components, relationships, and visible changes over time. This lesson will connect ${supportSummary} so the learner can move from definition to mechanism to application.`;

  return {
    document_subject: title || rootConcept,
    field: resolvedField,
    core_thesis: coreThesis,
    key_topics: keyTopics,
    logical_flow: `${rootConcept} begins with the core idea, then moves through ${supportSummary}, and ends with application or outcome reading.`,
    difficulty_level: supportConcepts.length >= 3 ? 'intermediate' : 'beginner',
    teaching_approach: buildPromptAwareTeachingApproach(resolvedField, cleaned, concepts),
  };
}

async function enrichTopicRequestSpec(topicSpec, aiProvider, analysisModel) {
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  const fallbackSpec = {
    ...topicSpec,
    section_text: buildTopicSourceBrief(topicSpec),
  };

  if (process.env.DISABLE_AI_PLANNER === 'true') {
    return fallbackSpec;
  }

  try {
    const scaffoldPrompt = `${buildIntentPrefix(topicSpec.lesson_intent)}${buildModePrefix(topicSpec.explanation_mode)}${buildSourceModePrefix('topic')}${TOPIC_SCAFFOLD_PROMPT}\n\nTOPIC REQUEST:\n${topicSpec.topic_request || topicSpec.section_text}\n\nUSER GUIDANCE:\n${topicSpec.user_instructions || 'none'}`;
    const scaffold = await callAIRace(
      scaffoldPrompt,
      Math.min(limits.analysisTok, 24_000),
      Math.min(limits.analysisTimeout, 240_000),
      aiProvider,
      analysisModel,
    );

    if (!scaffold?.key_topics?.length) {
      return fallbackSpec;
    }

    const title = buildTopicTitle(scaffold.document_subject || topicSpec.title || topicSpec.topic_request);
    const comprehension = {
      document_subject: title,
      field: scaffold.field || topicSpec.comprehension?.field || 'general',
      core_thesis: normalizeText(scaffold.core_thesis || topicSpec.comprehension?.core_thesis || ''),
      key_topics: scaffold.key_topics,
      logical_flow: normalizeText(scaffold.logical_flow || topicSpec.comprehension?.logical_flow || ''),
      difficulty_level: scaffold.difficulty_level || topicSpec.comprehension?.difficulty_level || 'intermediate',
      teaching_approach: normalizeText(scaffold.teaching_approach || topicSpec.comprehension?.teaching_approach || ''),
    };

    const enrichedSpec = {
      ...topicSpec,
      title,
      learning_objective: buildIntentObjective(title, topicSpec.lesson_intent),
      key_points: sanitizeConceptList([
        ...topicSpec.key_points,
        ...scaffold.key_topics.map((topic) => topic?.topic),
      ], `${scaffold.source_brief || ''}\n\n${topicSpec.topic_request || ''}`, 8),
      comprehension,
      visual_strategy: normalizeText(scaffold.teaching_approach || topicSpec.visual_strategy || ''),
    };

    return {
      ...enrichedSpec,
      topics_covered: enrichedSpec.key_points,
      section_text: normalizeText(scaffold.source_brief || buildTopicSourceBrief(enrichedSpec)),
    };
  } catch (error) {
    console.warn('[aiPlanner] Topic scaffold AI failed, using local brief:', error.message);
    return fallbackSpec;
  }
}

function buildTopicRequestSpec(rawText, userInstructions, aiProvider, analysisModel, explanationMode, lessonIntent = 'teach') {
  const promptText = normalizeText(rawText);
  const cleanedUserInstructions = cleanUserInstructions(userInstructions);
  const normalizedLessonIntent = normalizeLessonIntent(lessonIntent, userInstructions);
  const cleanedTopic = stripTopicRequestLead(promptText);
  const titleSeed = cleanedTopic || promptText || 'Requested Topic';
  const title = buildTopicHeuristicTitle(titleSeed || promptText) || buildTopicTitle(titleSeed || promptText);
  const topicContext = [cleanedTopic || promptText, cleanedUserInstructions].filter(Boolean).join('\n\n') || promptText;
  const field = detectField(topicContext);
  const localComprehension = buildTopicHeuristicComprehension(cleanedTopic || promptText, field, title)
    || buildPromptAwareTopicComprehension(cleanedTopic || promptText, field, title)
    || buildLocalComprehension(topicContext);
  const resolvedField = localComprehension.field || field;
  const keyPoints = uniqueNormalizedStrings([
    ...extractKeyConcepts(topicContext, [title], 6),
    ...(localComprehension.key_topics || []).map((topic) => topic.topic),
  ], 6);

  return {
    title,
    learning_objective: buildIntentObjective(title, normalizedLessonIntent),
    key_points: keyPoints,
    topics_covered: keyPoints,
    section_text: topicContext,
    topic_request: promptText,
    user_instructions: cleanedUserInstructions,
    visual_strategy: resolvedField === 'mathematics'
      ? 'Use equations, a coordinate system, and graph-based explanations.'
      : resolvedField === 'economics'
        ? 'Use axes-based market graphs, equilibrium markers, and scenario comparisons.'
        : resolvedField === 'biology'
          ? 'Use labeled biological objects, process-stage layouts, and component callouts.'
          : /blockchain|validator|ledger|consensus|distributed|transaction|network|protocol|api|server|database|service|cache/i.test(topicContext)
            ? 'Use network objects, state-flow diagrams, and component callouts.'
      : /physics|force|energy|motion|velocity|acceleration|gravity|wave/i.test(topicContext)
        ? 'Use physics diagrams, force arrows, and step-by-step shape-based drawings.'
        : 'Use labeled diagrams, progressive whiteboard builds, and concrete visual comparisons.',
    comprehension: {
      document_subject: title,
      field: resolvedField,
      core_thesis: localComprehension.core_thesis || `This lesson teaches ${title} as a direct topic request and should build understanding from fundamentals to application.`,
      key_topics: (localComprehension.key_topics || []).length
        ? localComprehension.key_topics.slice(0, 8)
        : keyPoints.map((topic) => ({
            topic,
            definition: `${topic} is a core element of ${title}.`,
            importance: `${topic} helps explain how ${title} works or why it matters.`,
            details: [],
            relationships: [],
          })),
      logical_flow: `${title} begins with the core idea, then breaks the topic into its main components, then finishes with application and review.`,
      difficulty_level: localComprehension.difficulty_level || 'intermediate',
      teaching_approach: resolvedField === 'mathematics'
        ? 'step-by-step with equations, graphs, and visual annotations'
        : buildPromptAwareTeachingApproach(resolvedField, topicContext, keyPoints),
    },
    ai_provider: aiProvider,
    analysis_model: analysisModel,
    explanation_mode: explanationMode,
    lesson_intent: normalizedLessonIntent,
    source_mode: 'topic',
    lesson_number: 1,
    previous_lesson_title: null,
    next_lesson_title: null,
  };
}

// ---- Public API --------------------------------------------------------------

export async function planLessonSeries(rawText, userInstructions, analysisModel, onProgress, aiProvider = null, explanationMode = 'full_lesson', sourceMode = 'document', lessonIntent = 'teach') {
  const report = (step) => onProgress?.(step);
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  const model = resolveModel(aiProvider, analysisModel);
  console.log(`[aiPlanner] Using provider=${aiProvider || 'default'}, model=${model}, inputLimit=${getInputCharLimit(aiProvider)} chars`);
  const fullText = normalizeText(rawText);
  const cleanedUserInstructions = cleanUserInstructions(userInstructions);
  const normalizedLessonIntent = normalizeLessonIntent(lessonIntent, userInstructions);

  if (sourceMode === 'topic') {
    await report('analyzing_document');
    await report('planning_lessons');

    const baseTopicSpec = buildTopicRequestSpec(fullText, cleanedUserInstructions, aiProvider, analysisModel, explanationMode, normalizedLessonIntent);
    const topicSpec = await enrichTopicRequestSpec(baseTopicSpec, aiProvider, analysisModel);
    const firstLesson = await _planLessonContent(topicSpec, report, aiProvider, analysisModel);

    return {
      firstLesson,
      remainingSpecs: [],
      totalLessons: 1,
      courseTitle: topicSpec.title,
    };
  }

  // Filter out intro/reference sections
  const filteredParagraphs = extractParagraphs(fullText);
  const filteredText = filteredParagraphs.join('\n\n');

  // DeepSeek: 1M context — send the full document (only chunk if it exceeds context budget)
  const inputLimit = getInputCharLimit(aiProvider);
  const chunkThreshold = aiProvider === 'deepseek' ? inputLimit : 80_000;
  const chunkSize = aiProvider === 'deepseek' ? Math.floor(inputLimit * 0.45) : 60_000;

  const chunks = filteredText.length > chunkThreshold
    ? chunkLargeDocument(filteredText, chunkSize)
    : [filteredText];

  const analysisText = chunks.length >= 2
    ? chunks.join('\n\n---SECTION BREAK---\n\n').slice(0, inputLimit)
    : chunks[0].slice(0, inputLimit);

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 1: Deep Document Comprehension
  // ════════════════════════════════════════════════════════════════════════════
  await report('analyzing_document');
  console.log(`[aiPlanner] Phase 1: Deep document comprehension (provider=${aiProvider}, ${analysisText.length} chars)...`);

  let comprehension = null;
  try {
    const comprehensionPrompt = `${buildIntentPrefix(normalizedLessonIntent)}${COMPREHENSION_PROMPT}\n\nDOCUMENT:\n${analysisText}`
      + (cleanedUserInstructions ? `\n\nUSER INSTRUCTIONS:\n${cleanedUserInstructions}` : '');
    comprehension = await callAIRace(comprehensionPrompt, limits.analysisTok, limits.analysisTimeout, aiProvider, analysisModel);
    if (comprehension?.key_topics?.length) {
      console.log(`[aiPlanner] Phase 1 OK: "${comprehension.document_subject}" — ${comprehension.key_topics.length} topics, field=${comprehension.field}`);
    } else {
      console.warn('[aiPlanner] Phase 1: AI returned incomplete comprehension, building from text...');
      comprehension = null;
    }
  } catch (error) {
    console.warn('[aiPlanner] Phase 1 AI failed, building comprehension from text:', error.message);
  }

  // Build comprehension from text if AI failed
  if (!comprehension) {
    comprehension = buildLocalComprehension(filteredText);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 1B: Deep Scan — enrich comprehension with second pass for missed content
  // ════════════════════════════════════════════════════════════════════════════
  if (comprehension?.key_topics?.length && comprehension.key_topics.length < 10 && analysisText.length > 10_000) {
    await report('deep_scanning');
    console.log(`[aiPlanner] Phase 1B: Deep scan for missed topics...`);
    try {
      const deepScanPrompt = `You previously analyzed a document and found these topics: ${comprehension.key_topics.map(t => t.topic).join(', ')}.

Now re-read the document CAREFULLY and find topics/concepts/procedures/commands that were MISSED in the first pass. Focus on:
- Specific commands, tools, or technologies mentioned
- Step-by-step procedures described
- Configuration details or code patterns
- Real-world examples or case studies
- Warnings, best practices, or common mistakes

Return raw JSON only:
{"additional_topics": [{"topic": "...", "definition": "...", "importance": "...", "details": ["...", "..."], "relationships": ["..."]}], "commands_found": ["command1", "command2"], "code_patterns": ["pattern1"], "key_procedures": ["procedure1"]}

DOCUMENT (re-read thoroughly):\n${analysisText.slice(0, inputLimit)}`;
      const deepScan = await callAIRace(deepScanPrompt, limits.analysisTok, limits.analysisTimeout, aiProvider, analysisModel);
      if (deepScan?.additional_topics?.length) {
        comprehension.key_topics = [...comprehension.key_topics, ...deepScan.additional_topics].slice(0, 25);
        comprehension.commands_found = deepScan.commands_found || [];
        comprehension.code_patterns = deepScan.code_patterns || [];
        comprehension.key_procedures = deepScan.key_procedures || [];
        console.log(`[aiPlanner] Phase 1B OK: +${deepScan.additional_topics.length} topics, ${(deepScan.commands_found || []).length} commands found`);
      }
    } catch (error) {
      console.log(`[aiPlanner] Phase 1B skipped: ${error.message}`);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 2: Lesson Decomposition
  // ════════════════════════════════════════════════════════════════════════════
  await report('planning_lessons');
  console.log(`[aiPlanner] Phase 2: Lesson decomposition...`);

  let lessons = null;
  let courseTitle = comprehension.document_subject || 'Course';

  try {
    const decompositionPrompt = `${buildIntentPrefix(normalizedLessonIntent)}${DECOMPOSITION_PROMPT}\n\nDOCUMENT ANALYSIS:\n${JSON.stringify(comprehension, null, 2)}\n\nFULL DOCUMENT TEXT (use this for section_text excerpts):\n${analysisText.slice(0, inputLimit)}`
      + (cleanedUserInstructions ? `\n\nUSER INSTRUCTIONS:\n${cleanedUserInstructions}` : '');
    const decomposition = await callAIRace(decompositionPrompt, limits.analysisTok, limits.analysisTimeout, aiProvider, analysisModel);
    if (decomposition?.lessons?.length) {
      lessons = decomposition.lessons.slice(0, 10);
      courseTitle = decomposition.course_title || courseTitle;
      console.log(`[aiPlanner] Phase 2 OK: ${lessons.length} lesson(s), title="${courseTitle}"`);
    }
  } catch (error) {
    console.warn('[aiPlanner] Phase 2 AI failed, using structural split:', error.message);
  }

  // Fallback: split document structurally
  if (!lessons?.length) {
    lessons = splitDocFallback(filteredText, comprehension, aiProvider);
  }

  // Enrich lesson specs with comprehension data and link them
  lessons = lessons.map((lesson, index) => ({
    ...lesson,
    lesson_number: index + 1,
    comprehension,
    ai_provider: aiProvider,
    analysis_model: analysisModel,
    explanation_mode: explanationMode,
    lesson_intent: normalizedLessonIntent,
    user_instructions: cleanedUserInstructions,
    previous_lesson_title: index > 0 ? lessons[index - 1].title : null,
    next_lesson_title: index < lessons.length - 1 ? lessons[index + 1].title : null,
  }));

  const totalLessons = Math.max(1, lessons.length);

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE 3: Generate first lesson content + visuals
  // ════════════════════════════════════════════════════════════════════════════
  const firstLesson = await _planLessonContent(lessons[0], report, aiProvider, analysisModel);

  return {
    firstLesson,
    remainingSpecs: lessons.slice(1),
    totalLessons,
    courseTitle: courseTitle || firstLesson.title,
  };
}

export async function planSingleLesson(lessonSpec, aiProvider = null, analysisModel = null) {
  const provider = aiProvider || lessonSpec.ai_provider || null;
  const model = analysisModel || lessonSpec.analysis_model || null;

  // Each lesson builds its OWN local comprehension from its section_text
  // This ensures fully independent content even if the global comprehension is shared
  if (lessonSpec.section_text && !lessonSpec._localComprehensionBuilt) {
    const localText = normalizeText(lessonSpec.section_text);
    const localConcepts = extractKeyConcepts(localText, lessonSpec.key_points || [], 8);
    const localComprehension = buildLocalComprehension(localText);

    // Merge local comprehension with any global context (local takes priority for topics)
    lessonSpec = {
      ...lessonSpec,
      comprehension: {
        ...(lessonSpec.comprehension || {}),
        key_topics: localComprehension.key_topics,
        core_thesis: localComprehension.core_thesis,
      },
      key_points: localConcepts,
      topics_covered: localConcepts,
      _localComprehensionBuilt: true,
    };
  }
  return _planLessonContent(lessonSpec, null, provider, model);
}

export async function planLesson(rawText, onProgress) {
  const text = normalizeText(rawText).slice(0, 100_000);
  const comprehension = buildLocalComprehension(text);
  const specs = splitDocFallback(text, comprehension);
  const spec = { ...specs[0], comprehension };
  return _planLessonContent(spec, onProgress);
}

// ---- Planning pipeline -------------------------------------------------------

async function _planLessonContent(lessonSpec, onProgress, aiProvider = null, analysisModel = null) {
  const report = (step) => onProgress?.(step);
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  const model = resolveModel(aiProvider, analysisModel);
  const sectionLimit = getSectionTextLimit(aiProvider);
  const refineSourceLimit = aiProvider === 'deepseek' ? 500_000 : 30_000;
  const refinePlanLimit = aiProvider === 'deepseek' ? 200_000 : 40_000;
  const cleanedUserInstructions = cleanUserInstructions(lessonSpec.user_instructions);
  const normalizedLessonIntent = normalizeLessonIntent(lessonSpec.lesson_intent, lessonSpec.user_instructions);

  await report('planning_outline');
  console.log(`[aiPlanner] Phase 3: Teaching content for "${lessonSpec.title}" (provider=${aiProvider}, model=${model})...`);

  // Build the context for the AI — include full comprehension data
  const comprehensionContext = lessonSpec.comprehension
    ? `\n\nDOCUMENT UNDERSTANDING:\nSubject: ${lessonSpec.comprehension.document_subject}\nField: ${lessonSpec.comprehension.field}\nCore thesis: ${lessonSpec.comprehension.core_thesis}\nDifficulty: ${lessonSpec.comprehension.difficulty_level}\nTeaching approach: ${lessonSpec.comprehension.teaching_approach}\nLogical flow: ${lessonSpec.comprehension.logical_flow || ''}\nKey topics (ALL — use these for accurate content):\n${JSON.stringify(lessonSpec.comprehension.key_topics?.slice(0, 20), null, 1)}`
    : '';

  const specText = [
    `Lesson Title: ${lessonSpec.title}`,
    `Lesson Intent: ${normalizedLessonIntent}`,
    lessonSpec.learning_objective ? `Learning Objective: ${lessonSpec.learning_objective}` : '',
    `Previous Lesson: ${lessonSpec.previous_lesson_title || 'none (this is the first)'}`,
    `Next Lesson: ${lessonSpec.next_lesson_title || 'none (this is the last)'}`,
    `Key Points: ${(lessonSpec.key_points || []).join(', ')}`,
    lessonSpec.visual_strategy ? `Recommended Visual Strategy: ${lessonSpec.visual_strategy}` : '',
    lessonSpec.topics_covered ? `Topics to Cover: ${lessonSpec.topics_covered.join(', ')}` : '',
    cleanedUserInstructions ? `User Guidance: ${cleanedUserInstructions}` : '',
    `\nSource Material (TEACH FROM THIS):\n${(lessonSpec.section_text || '').slice(0, sectionLimit)}`,
  ].filter(Boolean).join('\n\n');

  let finalPlan = null;

  // ── Pass 1: Initial generation ──
  try {
    await report('ai_generating');
    const intentPrefix = buildIntentPrefix(normalizedLessonIntent);
    const modePrefix = buildModePrefix(lessonSpec.explanation_mode);
    const sourceModePrefix = buildSourceModePrefix(lessonSpec.source_mode);
    const aiPlan = await callAIRace(
      `${intentPrefix}${modePrefix}${sourceModePrefix}${TEACHING_PROMPT}${comprehensionContext}\n\nLESSON SPEC:\n${specText}`,
      limits.contentTok,
      limits.contentTimeout,
      aiProvider,
      analysisModel,
    );
    if (aiPlan?.parts?.length) {
      finalPlan = validateAndFixPlan(aiPlan, lessonSpec);
      if (isWeakTopicPlan(finalPlan, lessonSpec)) {
        console.warn('[aiPlanner] Phase 3 Pass 1 produced a shallow topic plan; retrying with stronger fallback path.');
        finalPlan = null;
      } else {
        console.log(`[aiPlanner] Phase 3 Pass 1 OK - ${finalPlan.parts.length} parts`);
      }
    }
  } catch (error) {
    console.warn('[aiPlanner] Phase 3 Pass 1 failed:', error.message);
  }

  // ── Pass 2: Refinement — AI reviews its own output and improves it ──
  if (finalPlan) {
    try {
      await report('ai_refining');
      console.log(`[aiPlanner] Phase 3 Pass 2: Refining lesson "${lessonSpec.title}"...`);
      const refinedPlan = await callAIRace(
        REFINEMENT_PROMPT + `\n\nORIGINAL LESSON PLAN:\n${JSON.stringify(finalPlan, null, 1).slice(0, refinePlanLimit)}\n\nSOURCE MATERIAL:\n${(lessonSpec.section_text || '').slice(0, refineSourceLimit)}`,
        limits.contentTok,
        limits.contentTimeout,
        aiProvider,
        analysisModel,
      );
      if (refinedPlan?.parts?.length) {
        const validated = validateAndFixPlan(refinedPlan, lessonSpec);
        if (validated.parts.length >= finalPlan.parts.length) {
          finalPlan = validated;
          console.log(`[aiPlanner] Phase 3 Pass 2 OK - refined to ${finalPlan.parts.length} parts`);
        }
      }
    } catch (refineErr) {
      console.warn('[aiPlanner] Phase 3 Pass 2 refinement skipped:', refineErr.message);
    }
  }

  // ── Pass 3 (if Pass 1 failed): Try with a focused prompt to avoid total fallback ──
  if (!finalPlan) {
    try {
      await report('ai_retry');
      console.log(`[aiPlanner] Phase 3 Pass 3: Retry with focused prompt...`);
      const retryPrompt = `${buildIntentPrefix(normalizedLessonIntent)}${buildModePrefix(lessonSpec.explanation_mode)}${buildSourceModePrefix(lessonSpec.source_mode)}You are a professional whiteboard teacher. Create a lesson that feels like a real classroom experience.

RULES:
- Return valid JSON with: title, summary, parts array.
- Each content part needs: title, part_type ("content"), duration_seconds (300-400), scene_goal, learning_objective, narration (conversational teacher voice, 150-300 words), key_concepts (3-5 terms), visual_logic (semantic visual descriptions), animation_sequence.
- Each quiz part needs: title, part_type ("quiz"), duration_seconds (55), quiz_questions with question_type, question_text, options, correct_answer, explanation.
- Build 3-5 content parts and 1-2 quiz parts.
- Narration must sound like a teacher TALKING to students, not reading a textbook.
- Each part teaches ONE main idea progressively.
- Visual_logic entries describe what a teacher would DRAW — use varied types (arrows for flow, boxes for definitions, circles for grouping, tables for comparison).
- No coordinates. No raw drawing commands.

TOPIC: ${lessonSpec.title || 'General Topic'}
MATERIAL:\n${(lessonSpec.section_text || '').slice(0, refineSourceLimit)}`;
      const retryPlan = await callAIRace(
        retryPrompt,
        limits.contentTok,
        Math.min(limits.contentTimeout, 120_000),
        aiProvider,
        analysisModel,
      );
      if (retryPlan?.parts?.length) {
        finalPlan = validateAndFixPlan(retryPlan, lessonSpec);
        if (isWeakTopicPlan(finalPlan, lessonSpec)) {
          console.warn('[aiPlanner] Phase 3 Pass 3 still produced a shallow topic plan; using structured fallback.');
          finalPlan = null;
        } else {
          console.log(`[aiPlanner] Phase 3 Pass 3 OK - ${finalPlan.parts.length} parts`);
        }
      }
    } catch (retryErr) {
      console.warn('[aiPlanner] Phase 3 Pass 3 failed:', retryErr.message);
    }
  }

  // Fallback: build lesson from local text analysis
  if (!finalPlan) {
    finalPlan = buildFallbackLesson(lessonSpec);
  }

  // ── AI-DRIVEN VISUAL GENERATION ──
  // Each part gets its own AI call for visual generation (multi-request for quality)
  const contentParts = finalPlan.parts.filter((p) => p.part_type === 'content');
  for (let i = 0; i < contentParts.length; i++) {
    await report(`planning_visuals_${i + 1}`);
    const part = contentParts[i];
    part.visual_sequence = await generateContentVisualsAI({
      lessonTitle: finalPlan.title,
      part,
      contentIndex: i,
      comprehension: lessonSpec.comprehension,
      explanationMode: lessonSpec.explanation_mode,
      continuity: {
        previous: lessonSpec.previous_lesson_title,
        next: lessonSpec.next_lesson_title,
      },
    }, aiProvider, analysisModel);
  }

  // AI-driven quiz visuals
  for (const part of finalPlan.parts) {
    if (part.part_type === 'quiz' && !part.visual_sequence?.length) {
      part.visual_sequence = await generateQuizVisualsAI(finalPlan.title, part, aiProvider, analysisModel);
    }
  }

  // Ensure summary exists
  if (!finalPlan.summary) {
    const allConcepts = gatherConcepts(finalPlan.parts);
    finalPlan.summary = buildLessonSummary(finalPlan.title, lessonSpec.section_text, allConcepts);
  }

  return finalPlan;
}

// ── Local comprehension builder (when AI is unavailable) ─────────────────────

function buildLocalComprehension(text) {
  const normalized = normalizeText(text);
  const paragraphs = extractParagraphs(normalized);
  const sentences = extractSentences(normalized);
  const concepts = extractKeyConcepts(normalized, [], 12);
  const field = detectField(normalized);

  // Find sentences that are definitional or explanatory (not just mentioning the concept)
  const topics = concepts.slice(0, 8).map((concept, i) => {
    const conceptLower = concept.toLowerCase();
    const relevantSentences = sentences.filter((s) => {
      const lower = s.toLowerCase();
      return lower.includes(conceptLower) && s.length > 30;
    }).slice(0, 5);

    // Find the most definitional sentence (contains "is", "means", "refers to")
    const defSentence = relevantSentences.find((s) =>
      /\b(is|means|refers?\s+to|defined\s+as|consists?\s+of)\b/i.test(s)
    ) || relevantSentences[0] || '';

    return {
      topic: concept,
      definition: defSentence || `${concept} is a core concept covered in this material.`,
      importance: relevantSentences[1] || relevantSentences[0] || `Understanding ${concept} is essential.`,
      details: relevantSentences.slice(0, 5).map((s) => truncateWords(s, 25)),
      relationships: concepts.filter((c) => c !== concept).slice(0, 3).map((c) => `Connected to ${c}`),
    };
  });

  // Find the first substantive sentence for core_thesis
  const thesisSentence = sentences.find((s) => s.length > 40 && !/^(save|read|written|page|chapter)/i.test(s))
    || sentences[0] || 'This document covers important concepts.';

  return {
    document_subject: concepts.slice(0, 3).join(', ') || 'General Topic',
    field,
    core_thesis: thesisSentence,
    key_topics: topics,
    logical_flow: `The document covers: ${concepts.slice(0, 6).join(' → ')}`,
    difficulty_level: paragraphs.length > 30 ? 'advanced' : paragraphs.length > 12 ? 'intermediate' : 'beginner',
    teaching_approach: field === 'mathematics' ? 'step-by-step with equations' :
      field === 'medical' ? 'labeled diagrams and process flows' :
      field === 'programming' ? 'flowcharts and code structure diagrams' :
      field === 'history' ? 'timelines and cause-effect diagrams' :
      'concept maps and progressive revelation',
  };
}

// ── Document splitting (fallback) ────────────────────────────────────────────

function splitDocFallback(text, comprehension = null, aiProvider = null) {
  const normalized = normalizeText(text);
  const paragraphs = extractParagraphs(normalized);
  const lessonCount = clamp(decideLessonCount(normalized, paragraphs), 1, 10);
  const groups = groupParagraphs(paragraphs, lessonCount);
  const sectionLimit = getSectionTextLimit(aiProvider);

  return groups.map((group, index) => {
    // Each lesson gets its OWN distinct chunk of text — no overlap
    const chunk = normalizeText(group.join('\n\n'));

    // Extract concepts LOCAL to this chunk only
    const localConcepts = extractKeyConcepts(chunk, [], 6);
    const title = localConcepts.length >= 2
      ? localConcepts.slice(0, 2).join(' & ')
      : deriveLessonTitle(chunk, index + 1);

    return {
      lesson_number: index + 1,
      title,
      learning_objective: localConcepts[0]
        ? `Understand ${localConcepts.slice(0, 3).join(', ')}`
        : `Master the concepts in this section`,
      key_points: localConcepts.length ? localConcepts : ['Key concept'],
      topics_covered: localConcepts,
      section_text: chunk.slice(0, sectionLimit),
      visual_strategy: comprehension?.teaching_approach || 'concept maps and diagrams',
    };
  });
}

function decideLessonCount(text, paragraphs) {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 500 || paragraphs.length < 4) return 1;
  if (words < 1500) return 2;
  if (words < 3000) return 3;
  if (words < 6000) return 4;
  if (words < 10000) return 5;
  if (words < 15000) return 6;
  if (words < 20000) return 7;
  return Math.min(10, Math.ceil(words / 3000));
}

function groupParagraphs(paragraphs, lessonCount) {
  if (!paragraphs.length) return Array.from({ length: lessonCount }, () => ['']);

  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
  const targetChars = Math.ceil(totalChars / lessonCount);
  const groups = [];
  let current = [];
  let currentChars = 0;

  paragraphs.forEach((paragraph, index) => {
    const remainingParagraphs = paragraphs.length - index;
    const remainingGroups = lessonCount - groups.length;
    const headingBreak = isHeadingParagraph(paragraph)
      && current.length > 0
      && groups.length < lessonCount - 1
      && currentChars >= targetChars * 0.55;

    const shouldBreak = headingBreak || (
      current.length > 0
      && groups.length < lessonCount - 1
      && currentChars >= targetChars
      && remainingParagraphs >= remainingGroups
    );

    if (shouldBreak) {
      groups.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(paragraph);
    currentChars += paragraph.length;
  });

  if (current.length) groups.push(current);
  while (groups.length < lessonCount) {
    groups.push([groups[groups.length - 1]?.[0] ?? paragraphs[paragraphs.length - 1] ?? '']);
  }
  return groups.slice(0, lessonCount);
}

// ── Validate and fix AI-generated plan ───────────────────────────────────────

function uniqueNormalizedStrings(values, limit = 8) {
  const result = [];
  const seen = new Set();

  for (const value of Array.isArray(values) ? values : []) {
    const normalized = normalizeText(String(value || '')).replace(/[.,;:]+$/, '');
    if (!normalized) continue;
    if (isPlannerMetaConcept(normalized)) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= limit) break;
  }

  return result;
}

function sanitizeConceptList(values, fallbackText = '', limit = 8) {
  const result = [];
  const seen = new Set();

  const push = (value) => {
    const concept = normalizeConcept(value);
    if (!concept || isPlannerMetaConcept(concept)) return;
    const key = concept.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(concept);
  };

  uniqueNormalizedStrings(values, limit * 2).forEach(push);

  if (fallbackText && result.length < Math.min(limit, 4)) {
    extractKeyConcepts(fallbackText, [], limit * 2).forEach(push);
  }

  return result.slice(0, limit);
}

function sanitizeSceneText(value, maxWords = 14) {
  const normalized = collapseRepeatedWordRuns(normalizeText(String(value || '')));
  if (!normalized) return '';
  if (/^(n\/a|null|undefined|none|\.\.\.|[-_=]+)$/i.test(normalized)) return '';
  if (isPlannerMetaConcept(normalized)) return '';
  return trimTrailingFragmentWords(truncateWords(normalized, maxWords));
}

function collapseRepeatedWordRuns(value, maxRun = 1) {
  const tokens = String(value || '').split(/\s+/).filter(Boolean);
  if (!tokens.length) return '';

  const compact = [];
  let previousKey = '';
  let runLength = 0;

  for (const token of tokens) {
    const key = token.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
    if (key && key === previousKey) {
      runLength += 1;
      if (runLength > maxRun) continue;
    } else {
      previousKey = key;
      runLength = key ? 1 : 0;
    }

    compact.push(token);
  }

  return compact.join(' ');
}

function trimTrailingFragmentWords(value) {
  const words = normalizeText(String(value || '')).split(/\s+/).filter(Boolean);
  while (words.length > 2) {
    const lastWord = words[words.length - 1].toLowerCase().replace(/[^a-z0-9]+$/g, '');
    if (!VISUAL_CUE_TRAILING_WORDS.has(lastWord)) break;
    words.pop();
  }
  return words.join(' ');
}

const VISUAL_CUE_TRAILING_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'to', 'and', 'or', 'for', 'on', 'at', 'by', 'with', 'from', 'into', 'through', 'via', 'as',
  'is', 'are', 'was', 'were', 'be', 'being', 'been', 'contains', 'contain', 'includes', 'include', 'called', 'named', 'termed',
  'forms', 'form', 'uses', 'use', 'stores', 'store', 'holds', 'hold', 'carries', 'carry', 'moves', 'move', 'drives', 'drive',
  'helps', 'help', 'supports', 'support', 'creates', 'create', 'enables', 'enable', 'catalyzes', 'catalyze', 'converts', 'convert',
  'recycles', 'recycle', 'captures', 'capture', 'absorbs', 'absorb', 'releases', 'release', 'separates', 'separate', 'regulates',
  'regulate', 'generates', 'generate', 'fixes', 'fix', 'pumps', 'pump',
]);

function stripVisualPhrasePreamble(value) {
  return collapseRepeatedWordRuns(normalizeText(String(value || ''))
    .replace(/^step\s+\d+\s*:\s*/i, '')
    .replace(/^(question|part)\s+\d+\s*:\s*/i, '')
    .replace(/^(core|focused|mechanism|review|revision|study)\s+notes\s*:\s*/i, '')
    .replace(/^visual\s+map\s*:\s*/i, '')
    .replace(/^diagramming\s+/i, '')
    .replace(/^applying\s+/i, '')
    .replace(/^(understanding|explaining|framing|mapping|analyzing)\s+/i, '')
    .replace(/^(specifically|according to the source material|an important point here is that|to elaborate|furthermore|a critical detail is that|it is worth noting that|in more precise terms|this means that|the key takeaway here is that|looking more closely|one essential aspect is that|what this tells us is that|expanding on this idea|practically speaking),?\s+/i, '')
    .replace(/[.,;:!?]+$/, ''));
}

function trimVisualCueWords(value) {
  const words = normalizeText(String(value || '')).split(/\s+/).filter(Boolean);
  while (words.length && /^(the|a|an)$/i.test(words[0])) words.shift();
  while (words.length && VISUAL_CUE_TRAILING_WORDS.has(words[words.length - 1].toLowerCase())) words.pop();
  return words.join(' ');
}

function isWeakVisualCue(value) {
  const normalized = normalizeText(String(value || ''));
  if (!normalized) return true;

  const words = normalized.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  if (/^(this|that|these|those|it|they|there)\b/i.test(normalized)) return true;

  const lastWord = words[words.length - 1];
  if (VISUAL_CUE_TRAILING_WORDS.has(lastWord)) return true;
  if (words.length === 1 && (STOPWORDS.has(lastWord) || WEAK_CONCEPTS.has(lastWord))) return true;

  return false;
}

function compactVisualPhrase(value, maxWords = 6) {
  const normalized = stripVisualPhrasePreamble(value);

  if (!normalized) return '';
  if (isPlannerMetaConcept(normalized)) return '';

  const segments = normalized
    .split(/\s+[|\/]\s+/)
    .map((segment) => truncateWords(segment, Math.max(2, maxWords - 2)))
    .filter(Boolean);

  if (segments.length > 1) {
    return segments.slice(0, 3).join(' | ');
  }

  return truncateWords(normalized, maxWords);
}

function normalizeVisualCue(value, maxWords = 4) {
  const normalized = stripVisualPhrasePreamble(value);
  if (!normalized) return '';
  if (isPlannerMetaConcept(normalized)) return '';

  const clauseCandidates = [
    normalized,
    ...normalized.split(/[;:]+|,\s+|\s+-\s+|\s+\b(?:which|that|where|while)\b\s+/i),
  ];

  for (const clause of clauseCandidates) {
    const candidate = trimVisualCueWords(truncateWords(clause, maxWords));
    if (candidate && !isWeakVisualCue(candidate)) {
      return candidate;
    }
  }

  const extracted = extractKeyConcepts(normalized, [], 3)
    .map((concept) => trimVisualCueWords(truncateWords(concept, maxWords)))
    .find((candidate) => candidate && !isWeakVisualCue(candidate));

  return extracted || '';
}

function buildVisualCueList(values, limit = 3, maxWords = 4) {
  const cues = [];
  const seen = new Set();

  for (const value of Array.isArray(values) ? values : []) {
    const cue = normalizeVisualCue(value, maxWords);
    if (!cue) continue;

    const key = cue.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cues.push(cue);

    if (cues.length >= limit) break;
  }

  return cues;
}

function isCueCoveredByLongerVariant(shortCue, longCue) {
  const shortWords = normalizeText(String(shortCue || '')).toLowerCase().split(/\s+/).filter(Boolean);
  const longWords = normalizeText(String(longCue || '')).toLowerCase().split(/\s+/).filter(Boolean);

  if (!shortWords.length || shortWords.length >= longWords.length) return false;
  if (` ${longWords.join(' ')} `.includes(` ${shortWords.join(' ')} `)) return true;

  const longWordSet = new Set(longWords);
  return shortWords.every((word) => longWordSet.has(word));
}

function pruneOverlappingVisualCues(values, limit = 3) {
  const cues = [];

  for (const value of Array.isArray(values) ? values : []) {
    const cue = normalizeText(String(value || ''));
    if (!cue) continue;

    let skipCue = false;
    for (let index = cues.length - 1; index >= 0; index -= 1) {
      const existingCue = cues[index];
      if (isCueCoveredByLongerVariant(cue, existingCue)) {
        skipCue = true;
        break;
      }
      if (isCueCoveredByLongerVariant(existingCue, cue)) {
        cues.splice(index, 1);
      }
    }

    if (!skipCue) {
      cues.push(cue);
    }
  }

  return cues.slice(0, limit);
}

function preferSpecificVisualCues(values, contextValues = [], limit = 3, maxWords = 4) {
  const cues = [];

  for (const value of Array.isArray(values) ? values : []) {
    let cue = compactBoardLabel(value, maxWords)
      || normalizeVisualCueWithContext(value, contextValues, maxWords)
      || normalizeVisualCue(value, maxWords);

    if (!cue) continue;

    const words = cue.split(/\s+/).filter(Boolean);
    const preserveSingleWordCue = words.length === 1 && (
      /^[A-Z0-9+()./-]+$/.test(cue)
      || /^(rubisco|chlorophyll|chloroplast|thylakoid|stroma|grana)$/i.test(cue)
    );

    if (words.length === 1 && !preserveSingleWordCue) {
      const expandedCue = compactBoardLabel(expandVisualCueFromContext(cue, contextValues, maxWords), maxWords)
        || expandVisualCueFromContext(cue, contextValues, maxWords);
      if (!expandedCue || expandedCue.split(/\s+/).filter(Boolean).length === 1) {
        continue;
      }
      cue = expandedCue;
    }

    cues.push(cue);
  }

  return pruneOverlappingVisualCues(uniqueNormalizedStrings(cues, limit * 3), limit);
}

function buildVisualContextWordSet(values) {
  const contextWords = new Set();

  for (const value of Array.isArray(values) ? values : []) {
    const normalized = normalizeText(String(value || ''));
    if (!normalized) continue;

    const candidates = [normalizeVisualCue(normalized, 3), ...extractKeyConcepts(normalized, [], 4)]
      .map((candidate) => normalizeVisualCue(candidate, 3))
      .filter(Boolean);

    for (const candidate of candidates) {
      const words = candidate.split(/\s+/).filter(Boolean);
      if (words.length !== 1) continue;

      const token = words[0].toLowerCase();
      if (STOPWORDS.has(token) || WEAK_CONCEPTS.has(token)) continue;
      contextWords.add(token);
    }
  }

  return contextWords;
}

function normalizeVisualCueWithContext(value, contextValues = [], maxWords = 4) {
  const cue = normalizeVisualCue(value, maxWords);
  if (!cue) return '';

  const words = cue.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return cue;

  const contextWords = buildVisualContextWordSet(contextValues);
  while (words.length > 2 && contextWords.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }

  const refined = words.join(' ');
  return refined && !isWeakVisualCue(refined) ? refined : cue;
}

function expandVisualCueFromContext(cue, contextValues = [], maxWords = 4) {
  const normalizedCue = normalizeVisualCue(cue, maxWords);
  if (!normalizedCue) return '';

  const cueKey = normalizedCue.toLowerCase();
  const cueWords = cueKey.split(/\s+/).filter(Boolean);
  const genericCue = cueWords.length === 1 && new Set([
    'energy', 'function', 'organization', 'structure', 'process', 'system', 'phase', 'angle', 'value', 'graph', 'curve', 'cycle',
  ]).has(cueWords[0]);

  for (const value of Array.isArray(contextValues) ? contextValues : []) {
    const candidate = normalizeVisualCueWithContext(value, [normalizedCue], maxWords) || normalizeVisualCue(value, maxWords);
    if (!candidate) continue;

    const candidateKey = candidate.toLowerCase();
    if (candidateKey === cueKey) continue;
    const candidateWords = candidate.split(/\s+/).filter(Boolean);
    if (candidateWords.length <= cueWords.length) continue;
    if (candidateKey.includes(cueKey) || genericCue) {
      return candidate;
    }
  }

  return normalizedCue;
}

function compactBoardLabel(value, maxWords = 4) {
  const cue = normalizeVisualCue(value, maxWords);
  if (!cue) return '';

  const words = cue.split(/\s+/).filter(Boolean);
  const genericTailWords = new Set(['organization', 'architecture', 'overview', 'function', 'properties', 'process', 'system']);
  while (words.length > 2 && genericTailWords.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  const hasConnector = words.some((word) => /^(and|or|of|for|to|in|with|from|via|through)$/i.test(word));
  const allTitleLike = words.every((word) => /^[A-Z0-9][A-Za-z0-9/().-]*$/.test(word));
  const refinedCue = words.join(' ');

  if (refinedCue && refinedCue !== cue && !isWeakVisualCue(refinedCue)) {
    return refinedCue;
  }

  if (words.length >= 4 && allTitleLike && !hasConnector) {
    return words.slice(0, 2).join(' ');
  }

  return refinedCue || cue;
}

function extractTitleCueSegments(value, maxWords = 4) {
  return normalizeText(String(value || ''))
    .split(/\s+\band\b\s+|[:/,-]+/i)
    .map((segment) => compactBoardLabel(segment, maxWords) || normalizeVisualCue(segment, maxWords) || truncateWords(segment, maxWords))
    .filter(Boolean)
    .filter((segment) => !/^(core notes|mechanism notes|review notes|visual map|diagramming|applying)$/i.test(segment))
    .filter((segment, index, all) => all.findIndex((entry) => entry.toLowerCase() === segment.toLowerCase()) === index);
}

function buildVisualSubtitle(concepts, fallbackSentence = '', maxConcepts = 2) {
  const rawConcepts = uniqueNormalizedStrings(concepts, maxConcepts + 1);
  const subtitleConcepts = rawConcepts
    .map((concept) => normalizeVisualCue(concept, 3))
    .filter(Boolean)
    .slice(0, maxConcepts);

  if (subtitleConcepts.length >= 2) {
    const candidate = subtitleConcepts.join(' | ');
    if (candidate.length <= 58) return candidate;

    const tighter = rawConcepts
      .slice(0, maxConcepts)
      .map((concept) => normalizeVisualCue(concept, 2))
      .filter(Boolean)
      .join(' | ');

    return tighter || candidate;
  }

  if (subtitleConcepts.length === 1) {
    return subtitleConcepts[0];
  }

  return compactVisualPhrase(fallbackSentence, 8);
}

function containsPlannerControlPhrase(text, lessonSpec) {
  const normalized = normalizePlannerPhrase(text);
  if (!normalized) return false;

  const hasStructuredPrefix = /^(primary lesson goal|preferred delivery style|specific user requirements|lesson intent|teaching preset)\b/.test(normalized);
  const matched = [...PLANNER_META_CONCEPTS].some((phrase) => normalized.includes(phrase));
  if (!hasStructuredPrefix && !matched) return false;

  const sourceText = normalizePlannerPhrase(lessonSpec?.section_text || '');
  if (!sourceText) return true;
  if (hasStructuredPrefix) return true;
  return [...PLANNER_META_CONCEPTS].some((phrase) => normalized.includes(phrase) && !sourceText.includes(phrase));
}

function sanitizeNarration(narration, lessonSpec, concepts) {
  const sentences = extractSentences(narration || '');
  const seen = new Set();
  const cleaned = [];

  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence);
    const key = normalized.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!key || key.split(/\s+/).length < 4) continue;
    if (seen.has(key)) continue;
    if (containsPlannerControlPhrase(normalized, lessonSpec)) continue;
    if (isInstructionalMetaSentence(normalized)) continue;
    if (/^(this is important|understanding this matters|it is important to understand|now let'?s dive in|let'?s dive in|in conclusion|to summarize)\b/i.test(normalized)) {
      continue;
    }

    seen.add(key);
    cleaned.push(normalized);
  }

  if (!cleaned.length) return normalizeText(narration || '');

  const rebuilt = collapseRepeatedWordRuns(cleaned.join(' '));
  if (rebuilt.split(/\s+/).length >= 80) return rebuilt;
  return enrichNarration(rebuilt, concepts, lessonSpec);
}

function sanitizeNarrationWithoutEnrichment(narration, lessonSpec, concepts = [], sourceText = '') {
  const sentences = extractSentences(narration || '');
  const seen = new Set();
  const cleaned = [];

  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence);
    const key = normalized.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!key || key.split(/\s+/).length < 4) continue;
    if (seen.has(key)) continue;
    if (containsPlannerControlPhrase(normalized, lessonSpec)) continue;
    if (isInstructionalMetaSentence(normalized)) continue;
    if (/^(this is important|understanding this matters|it is important to understand|now let'?s dive in|let'?s dive in|in conclusion|to summarize)\b/i.test(normalized)) {
      continue;
    }

    seen.add(key);
    cleaned.push(normalized);
  }

  const rebuilt = cleaned.length ? collapseRepeatedWordRuns(cleaned.join(' ')) : collapseRepeatedWordRuns(normalizeText(narration || ''));
  if (rebuilt.split(/\s+/).length >= 80 || !sourceText) return rebuilt;
  return enrichNarration(rebuilt, concepts, { ...lessonSpec, section_text: sourceText });
}

function wordCount(text) {
  return normalizeText(text).split(/\s+/).filter(Boolean).length;
}

function getContentNarrationTargetWords(lessonSpec) {
  switch (lessonSpec?.explanation_mode) {
    case 'visual_first':
      return 220;
    case 'step_by_step':
      return 260;
    case 'qa_mode':
      return 230;
    case 'text_focus':
      return 240;
    case 'full_lesson':
    default:
      return 250;
  }
}

function getContentDurationFloor(lessonSpec) {
  switch (lessonSpec?.explanation_mode) {
    case 'visual_first':
      return 180;
    case 'step_by_step':
      return 220;
    case 'qa_mode':
      return 170;
    case 'text_focus':
      return 210;
    case 'full_lesson':
    default:
      return 200;
  }
}

function estimateContainerWidth(text, pxPerChar = 8.2, minWidth = 150, maxWidth = 320) {
  const normalized = normalizeText(text);
  if (!normalized) return minWidth;
  return clamp(Math.round(normalized.length * pxPerChar + 30), minWidth, maxWidth);
}

function estimateContainerHeight(text, width, pxPerChar = 7.6, lineHeight = 18, minHeight = 58, maxHeight = 150) {
  const normalized = normalizeText(text);
  if (!normalized) return minHeight;
  const charsPerLine = Math.max(10, Math.floor(Math.max(80, width - 24) / pxPerChar));
  const lines = Math.max(1, Math.ceil(normalized.length / charsPerLine));
  return clamp(24 + lines * lineHeight, minHeight, maxHeight);
}

function clampBoxX(x, width, padding = 40) {
  if (!Number.isFinite(Number(x)) || !Number.isFinite(Number(width))) return x;
  return clamp(Number(x), padding, 800 - Number(width) - padding);
}

function clampBoxY(y, height, padding = 40) {
  if (!Number.isFinite(Number(y)) || !Number.isFinite(Number(height))) return y;
  return clamp(Number(y), 56, 500 - Number(height) - padding);
}

function estimateBadgeDimensions(content, fontSize = 15) {
  const text = normalizeText(content);
  if (!text) return { width: 0, height: 0 };
  return {
    width: Math.max(60, text.length * fontSize * 0.62 + 24),
    height: fontSize + 12,
  };
}

function estimateEquationDimensions(latex, fontSize = 26) {
  const text = normalizeText(latex);
  if (!text) return { width: 0, height: 0 };
  return {
    width: Math.max(80, text.length * fontSize * 0.62 + 28),
    height: fontSize + 20,
  };
}

function estimateAnnotationStackHeight(annotations = [], width = 160) {
  let totalHeight = 0;

  for (const annotation of annotations.slice(0, 3)) {
    totalHeight += estimateContainerHeight(annotation, width, 6.5, 15, 28, 52) + 8;
  }

  return totalHeight ? totalHeight - 8 : 0;
}

function estimateAnnotatedShapeLayoutBox(scene) {
  const [x, y] = Array.isArray(scene.position) ? scene.position : [140, 120];
  const [width, height] = Array.isArray(scene.size) ? scene.size : [220, 180];
  let minX = x;
  let minY = y;
  let maxX = x + width;
  let maxY = y + height;

  const label = normalizeText(scene.label || '');
  if (label) {
    const maxLabelWidth = Math.max(150, Math.min(width + 28, 248));
    const labelWidth = clamp(estimateContainerWidth(label, 7.4, 112, maxLabelWidth), 112, maxLabelWidth);
    const labelHeight = estimateContainerHeight(label, labelWidth, 7.1, 18, 34, 58);
    const labelX = clampBoxX(x + width / 2 - labelWidth / 2, labelWidth, 14);
    const labelY = y < 170 ? Math.max(16, y - 46) : y - 44;

    minX = Math.min(minX, labelX);
    minY = Math.min(minY, labelY);
    maxX = Math.max(maxX, labelX + labelWidth);
    maxY = Math.max(maxY, labelY + labelHeight);
  }

  const annotations = Array.isArray(scene.annotations) ? scene.annotations.filter(Boolean).slice(0, 3) : [];
  if (annotations.length) {
    const annotationWidth = 160;
    const annotationX = x + width + 12 > 800 - annotationWidth - 14
      ? x - annotationWidth - 12
      : x + width + 12;
    const annotationY = y < 170 ? y + 8 : y + 12;
    const annotationHeight = estimateAnnotationStackHeight(annotations, annotationWidth);

    minX = Math.min(minX, annotationX);
    minY = Math.min(minY, annotationY);
    maxX = Math.max(maxX, annotationX + annotationWidth);
    maxY = Math.max(maxY, annotationY + annotationHeight);
  }

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;

  return {
    x: clamp(minX, 14, 800 - boxWidth - 14),
    y: clamp(minY, 72, 500 - boxHeight - 20),
    width: boxWidth,
    height: boxHeight,
  };
}

function estimateSceneLayoutBox(scene) {
  if (!scene || typeof scene !== 'object') return null;

  switch (scene.type) {
    case 'draw_badge': {
      if (!Array.isArray(scene.position)) return null;
      const { width, height } = estimateBadgeDimensions(scene.content, Number(scene.style?.fontSize) || 15);
      return { x: scene.position[0], y: scene.position[1], width, height };
    }

    case 'draw_callout': {
      if (!Array.isArray(scene.position)) return null;
      const width = Number(scene.width) || estimateContainerWidth(scene.content, 7.4, 220, 360);
      const height = estimateContainerHeight(scene.content, width, 7.1, 18, 78, 170) + 14;
      return { x: scene.position[0], y: scene.position[1], width, height };
    }

    case 'draw_table': {
      if (!Array.isArray(scene.position)) return null;
      const totalWidth = (Array.isArray(scene.headers) ? scene.headers.length : 0) * (Number(scene.cell_width) || 140);
      const totalHeight = ((Array.isArray(scene.rows) ? scene.rows.length : 0) + 1) * (Number(scene.cell_height) || 34);
      return { x: scene.position[0], y: scene.position[1], width: totalWidth, height: totalHeight };
    }

    case 'draw_rect':
      if (!normalizeText(scene.label || '')) return null;
      return {
        x: Number(scene.x) || 0,
        y: Number(scene.y) || 0,
        width: Number(scene.width) || 0,
        height: Number(scene.height) || 0,
      };

    case 'draw_circle': {
      if (!Array.isArray(scene.center)) return null;
      const radius = Number(scene.radius) || 48;
      return {
        x: scene.center[0] - radius - 12,
        y: scene.center[1] - radius - 12,
        width: radius * 2 + 24,
        height: radius * 2 + 24,
      };
    }

    case 'show_equation': {
      if (!Array.isArray(scene.position)) return null;
      const { width, height } = estimateEquationDimensions(scene.latex, Number(scene.style?.fontSize) || 26);
      return { x: scene.position[0] - width / 2 - 2, y: scene.position[1] - height / 2, width: width + 4, height };
    }

    case 'draw_graph': {
      const [x, y] = Array.isArray(scene.position) ? scene.position : [80, 80];
      const [width, height] = Array.isArray(scene.size) ? scene.size : [300, 200];
      return { x: x - 10, y: y - 34, width: width + 20, height: height + 52 };
    }

    case 'draw_coordinate_system': {
      const [originX, originY] = Array.isArray(scene.origin) ? scene.origin : [100, 350];
      const [width, height] = Array.isArray(scene.size) ? scene.size : [300, 240];
      return { x: originX - 18, y: originY - height - 20, width: width + 34, height: height + 40 };
    }

    case 'draw_object':
    case 'draw_physics_shape':
      return estimateAnnotatedShapeLayoutBox(scene);

    default:
      return null;
  }
}

// Minimum spacing between whiteboard elements to prevent visual clutter
const SCENE_ELEMENT_GAP = 40; // Minimum 40px between unrelated elements (pedagogical requirement)
const SCENE_OVERLAP_PADDING = 24;

function sceneBoxesOverlap(left, right, padding = SCENE_OVERLAP_PADDING) {
  return left.x < right.x + right.width + padding
    && left.x + left.width + padding > right.x
    && left.y < right.y + right.height + padding
    && left.y + left.height + padding > right.y;
}

function resolveSceneLayoutBox(box, occupiedBoxes) {
  let candidate = {
    ...box,
    x: clampBoxX(box.x, box.width, 20),
    y: clampBoxY(box.y, box.height, 20),
  };

  // First half of attempts use standard directional resolution;
  // second half switches to grid-based diagonal fallback for packed boards
  const DIAGONAL_FALLBACK_THRESHOLD = 15;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const collision = occupiedBoxes.find((occupied) => sceneBoxesOverlap(candidate, occupied));
    if (!collision) return candidate;

    // Try moving down first (most natural for whiteboard flow)
    const downY = collision.y + collision.height + SCENE_ELEMENT_GAP;
    if (downY <= 500 - candidate.height - 20) {
      candidate = { ...candidate, y: clampBoxY(Math.max(candidate.y + 10, downY), candidate.height, 20) };
      continue;
    }

    // Try moving right
    const rightX = collision.x + collision.width + SCENE_ELEMENT_GAP;
    if (rightX <= 800 - candidate.width - 20) {
      candidate = { ...candidate, x: clampBoxX(rightX, candidate.width, 20), y: clampBoxY(box.y, box.height, 20) };
      continue;
    }

    // Try moving left
    const leftX = collision.x - candidate.width - SCENE_ELEMENT_GAP;
    if (leftX >= 20) {
      candidate = { ...candidate, x: clampBoxX(leftX, candidate.width, 20), y: clampBoxY(box.y, box.height, 20) };
      continue;
    }

    // Try moving up
    const upY = collision.y - candidate.height - SCENE_ELEMENT_GAP;
    if (upY >= 72) {
      candidate = { ...candidate, y: clampBoxY(upY, candidate.height, 20) };
      continue;
    }

    // Last resort: scale down and try diagonal placement
    if (attempt > DIAGONAL_FALLBACK_THRESHOLD) {
      candidate = {
        ...candidate,
        x: clampBoxX(20 + (attempt % 3) * 260, candidate.width, 20),
        y: clampBoxY(92 + Math.floor(attempt / 3) * 130, candidate.height, 20),
      };
    }
  }

  return candidate;
}

function applySceneLayoutBox(scene, box) {
  const currentBox = estimateSceneLayoutBox(scene);
  if (!currentBox || !box) return;

  const dx = box.x - currentBox.x;
  const dy = box.y - currentBox.y;

  switch (scene.type) {
    case 'draw_badge':
    case 'draw_callout':
    case 'draw_table':
      if (Array.isArray(scene.position)) {
        scene.position = [scene.position[0] + dx, scene.position[1] + dy];
      }
      return;

    case 'draw_rect':
      scene.x = Number(scene.x || 0) + dx;
      scene.y = Number(scene.y || 0) + dy;
      return;

    case 'show_equation':
      if (Array.isArray(scene.position)) {
        scene.position = [scene.position[0] + dx, scene.position[1] + dy];
      }
      return;

    case 'draw_circle':
      if (Array.isArray(scene.center)) {
        scene.center = [scene.center[0] + dx, scene.center[1] + dy];
      }
      return;

    case 'draw_graph':
      if (Array.isArray(scene.position)) {
        scene.position = [scene.position[0] + dx, scene.position[1] + dy];
      }
      return;

    case 'draw_coordinate_system':
      if (Array.isArray(scene.origin)) {
        scene.origin = [scene.origin[0] + dx, scene.origin[1] + dy];
      }
      return;

    case 'draw_object':
    case 'draw_physics_shape':
      if (Array.isArray(scene.position)) {
        scene.position = [scene.position[0] + dx, scene.position[1] + dy];
      }
      return;

    default:
      return;
  }
}

const GRAPH_LAYOUT_NODE_TYPES = new Set([
  'draw_badge',
  'draw_callout',
  'draw_table',
  'draw_rect',
  'draw_circle',
  'show_equation',
  'draw_graph',
  'draw_coordinate_system',
  'draw_object',
  'draw_physics_shape',
]);

const GRAPH_LAYOUT_CONNECTOR_TYPES = new Set(['draw_arrow', 'draw_line', 'draw_path']);
const GRAPH_LAYOUT_PRIMARY_TYPES = new Set([
  'draw_graph',
  'draw_coordinate_system',
  'draw_object',
  'draw_physics_shape',
  'draw_table',
  'draw_circle',
]);

function isGraphLayoutNodeScene(scene) {
  return GRAPH_LAYOUT_NODE_TYPES.has(scene?.type) && Boolean(estimateSceneLayoutBox(scene));
}

function isGraphLayoutHeaderScene(scene) {
  if (!scene || typeof scene !== 'object') return false;

  if (scene.type === 'draw_text' && Array.isArray(scene.position)) {
    return scene.position[1] <= 96;
  }

  if (scene.type === 'draw_line' && Array.isArray(scene.from) && Array.isArray(scene.to)) {
    return Math.max(scene.from[1], scene.to[1]) <= 96;
  }

  return scene.type === 'draw_badge' && Boolean(scene.fixedHeaderBadge);
}

function isGraphLayoutFooterScene(scene) {
  const box = estimateSceneLayoutBox(scene);
  if (!box) return false;

  if (scene.type === 'draw_callout') return box.y >= 380 || (box.width >= 520 && box.y >= 300);
  if (scene.type === 'draw_badge') return box.y >= 430;
  return false;
}

function classifyGraphLayoutRole(scene, box) {
  if (GRAPH_LAYOUT_PRIMARY_TYPES.has(scene.type)) return 'primary';
  if (scene.type === 'draw_rect' && (box.width >= 280 || box.height >= 110)) return 'primary';
  if (scene.type === 'show_equation') return 'primary';
  return 'support';
}

function isGraphLayoutAttachedScene(scene, box) {
  if (!scene || !box) return false;

  if (scene.type === 'draw_badge') return true;
  return scene.type === 'draw_callout' && box.width <= 420 && box.y < 380;
}

function clampBoxToArea(box, area, padding = 16) {
  return {
    ...box,
    x: clamp(box.x, area.x + padding, area.x + area.width - box.width - padding),
    y: clamp(box.y, area.y + padding, area.y + area.height - box.height - padding),
  };
}

function resolveSceneLayoutBoxWithinArea(box, occupiedBoxes, area) {
  let candidate = clampBoxToArea(box, area, 16);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const collision = occupiedBoxes.find((occupied) => sceneBoxesOverlap(candidate, occupied));
    if (!collision) return candidate;

    const downY = collision.y + collision.height + 16;
    if (downY <= area.y + area.height - candidate.height - 16) {
      candidate = clampBoxToArea({ ...candidate, y: Math.max(candidate.y + 8, downY) }, area, 16);
      continue;
    }

    const rightX = collision.x + collision.width + 16;
    if (rightX <= area.x + area.width - candidate.width - 16) {
      candidate = clampBoxToArea({ ...candidate, x: rightX }, area, 16);
      continue;
    }

    const leftX = collision.x - candidate.width - 16;
    if (leftX >= area.x + 16) {
      candidate = clampBoxToArea({ ...candidate, x: leftX }, area, 16);
      continue;
    }

    const upY = collision.y - candidate.height - 16;
    if (upY >= area.y + 16) {
      candidate = clampBoxToArea({ ...candidate, y: upY }, area, 16);
      continue;
    }
  }

  return candidate;
}

function boxCenter(box) {
  return [box.x + box.width / 2, box.y + box.height / 2];
}

function pointToBoxDistance(point, box) {
  if (!Array.isArray(point) || point.length !== 2 || !box) return Number.POSITIVE_INFINITY;
  const dx = Math.max(box.x - point[0], 0, point[0] - (box.x + box.width));
  const dy = Math.max(box.y - point[1], 0, point[1] - (box.y + box.height));
  return Math.sqrt(dx * dx + dy * dy);
}

function boxCenterDistance(leftBox, rightBox) {
  if (!leftBox || !rightBox) return Number.POSITIVE_INFINITY;
  const [leftX, leftY] = boxCenter(leftBox);
  const [rightX, rightY] = boxCenter(rightBox);
  return Math.hypot(leftX - rightX, leftY - rightY);
}

function parsePathEndpoints(pathData) {
  const matches = String(pathData || '').match(/-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length < 4) return null;
  const numbers = matches.map(Number);
  return {
    from: [numbers[0], numbers[1]],
    to: [numbers[numbers.length - 2], numbers[numbers.length - 1]],
  };
}

function getConnectorEndpoints(scene) {
  if (!scene || typeof scene !== 'object') return null;

  if ((scene.type === 'draw_arrow' || scene.type === 'draw_line')
    && Array.isArray(scene.from)
    && Array.isArray(scene.to)) {
    return { from: scene.from, to: scene.to };
  }

  if (scene.type === 'draw_path') {
    return parsePathEndpoints(scene.d);
  }

  return null;
}

function findNearestGraphNode(point, nodeEntries, excludedId = null) {
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const entry of nodeEntries) {
    if (excludedId && entry.id === excludedId) continue;
    const distance = pointToBoxDistance(point, entry.box);
    if (distance < bestDistance) {
      best = entry;
      bestDistance = distance;
    }
  }

  if (!best) return null;
  return bestDistance <= 240 ? best : null;
}

function inferConnectorRelations(segmentScenes, nodeEntries) {
  const relations = [];
  const connectedIds = new Set();

  for (const scene of segmentScenes) {
    if (!GRAPH_LAYOUT_CONNECTOR_TYPES.has(scene?.type)) continue;

    const endpoints = getConnectorEndpoints(scene);
    if (!endpoints) continue;

    const source = findNearestGraphNode(endpoints.from, nodeEntries);
    const target = findNearestGraphNode(endpoints.to, nodeEntries, source?.id);
    if (!source || !target || source.id === target.id) continue;

    relations.push({ scene, sourceId: source.id, targetId: target.id });
    connectedIds.add(source.id);
    connectedIds.add(target.id);
  }

  return { relations, connectedIds };
}

function chooseGraphRankDir(nodeEntries, relations) {
  if (relations.length) {
    const sourceIds = new Set(relations.map((relation) => relation.sourceId));
    if (sourceIds.size === 1 && relations.length >= 2) {
      return 'TB';
    }

    const degreeMap = relations.reduce((acc, relation) => {
      acc.set(relation.sourceId, (acc.get(relation.sourceId) || 0) + 1);
      acc.set(relation.targetId, (acc.get(relation.targetId) || 0) + 1);
      return acc;
    }, new Map());
    const maxDegree = Math.max(0, ...degreeMap.values());
    if (maxDegree >= Math.max(2, Math.ceil(nodeEntries.length / 2))) {
      return 'TB';
    }

    const axisBias = relations.reduce((acc, relation) => {
      const from = getConnectorEndpoints(relation.scene)?.from || boxCenter(nodeEntries.find((entry) => entry.id === relation.sourceId)?.box || { x: 0, y: 0, width: 0, height: 0 });
      const to = getConnectorEndpoints(relation.scene)?.to || boxCenter(nodeEntries.find((entry) => entry.id === relation.targetId)?.box || { x: 0, y: 0, width: 0, height: 0 });
      return {
        dx: acc.dx + Math.abs(to[0] - from[0]),
        dy: acc.dy + Math.abs(to[1] - from[1]),
      };
    }, { dx: 0, dy: 0 });

    return axisBias.dx >= axisBias.dy * 1.1 ? 'LR' : 'TB';
  }

  const primaryCount = nodeEntries.filter((entry) => entry.role === 'primary').length;
  if (primaryCount === 1 && nodeEntries.length >= 3) return 'LR';

  const xs = nodeEntries.map((entry) => entry.box.x);
  const ys = nodeEntries.map((entry) => entry.box.y);
  const xSpread = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  const ySpread = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;

  return xSpread > ySpread * 1.2 ? 'LR' : 'TB';
}

function findNearestAttachedAnchorEntry(entry, anchorEntries) {
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const anchorEntry of anchorEntries) {
    const baseDistance = boxCenterDistance(entry.box, anchorEntry.box);
    const roleBias = anchorEntry.role === 'primary' ? -72 : 0;
    const score = baseDistance + roleBias;
    if (score < bestScore) {
      best = anchorEntry;
      bestScore = score;
    }
  }

  return best;
}

function resolveAttachedSceneLayoutBox(entry, anchorEntry, anchorBox, occupiedBoxes, area) {
  const box = entry.box;
  const originalAnchorBox = anchorEntry.box;
  const [entryCenterX, entryCenterY] = boxCenter(box);
  const [anchorCenterX, anchorCenterY] = boxCenter(originalAnchorBox);
  const dx = entryCenterX - anchorCenterX;
  const dy = entryCenterY - anchorCenterY;
  const preferTop = dy <= 0;
  const preferLeft = dx <= 0;

  const topLeft = { x: anchorBox.x + 12, y: anchorBox.y - box.height - 14, width: box.width, height: box.height };
  const topRight = { x: anchorBox.x + anchorBox.width - box.width - 12, y: anchorBox.y - box.height - 14, width: box.width, height: box.height };
  const bottomLeft = { x: anchorBox.x + 12, y: anchorBox.y + anchorBox.height + 14, width: box.width, height: box.height };
  const bottomRight = { x: anchorBox.x + anchorBox.width - box.width - 12, y: anchorBox.y + anchorBox.height + 14, width: box.width, height: box.height };
  const rightSide = { x: anchorBox.x + anchorBox.width + 16, y: anchorBox.y + 8, width: box.width, height: box.height };
  const leftSide = { x: anchorBox.x - box.width - 16, y: anchorBox.y + 8, width: box.width, height: box.height };

  const centeredBelow = {
    x: anchorBox.x + (anchorBox.width - box.width) / 2,
    y: anchorBox.y + anchorBox.height + 16,
    width: box.width,
    height: box.height,
  };
  const centeredAbove = {
    x: anchorBox.x + (anchorBox.width - box.width) / 2,
    y: anchorBox.y - box.height - 16,
    width: box.width,
    height: box.height,
  };
  const centeredRight = {
    x: anchorBox.x + anchorBox.width + 18,
    y: anchorBox.y + (anchorBox.height - box.height) / 2,
    width: box.width,
    height: box.height,
  };
  const centeredLeft = {
    x: anchorBox.x - box.width - 18,
    y: anchorBox.y + (anchorBox.height - box.height) / 2,
    width: box.width,
    height: box.height,
  };

  let candidates;
  if (entry.scene.type === 'draw_badge') {
    const preferredTop = preferLeft ? topLeft : topRight;
    const alternateTop = preferLeft ? topRight : topLeft;
    const preferredBottom = preferLeft ? bottomLeft : bottomRight;
    const alternateBottom = preferLeft ? bottomRight : bottomLeft;
    const preferredSide = preferLeft ? leftSide : rightSide;
    const alternateSide = preferLeft ? rightSide : leftSide;
    candidates = preferTop
      ? [preferredTop, alternateTop, preferredBottom, alternateBottom, preferredSide, alternateSide]
      : [preferredBottom, alternateBottom, preferredTop, alternateTop, preferredSide, alternateSide];
  } else {
    const preferVertical = Math.abs(dy) >= Math.abs(dx);
    const preferredVertical = dy >= 0 ? centeredBelow : centeredAbove;
    const alternateVertical = dy >= 0 ? centeredAbove : centeredBelow;
    const preferredHorizontal = dx >= 0 ? centeredRight : centeredLeft;
    const alternateHorizontal = dx >= 0 ? centeredLeft : centeredRight;
    candidates = preferVertical
      ? [preferredVertical, preferredHorizontal, alternateHorizontal, alternateVertical]
      : [preferredHorizontal, preferredVertical, alternateVertical, alternateHorizontal];
  }

  for (const candidate of candidates) {
    const clamped = clampBoxToArea(candidate, area, 12);
    const hasCollision = occupiedBoxes.some((occupied) => sceneBoxesOverlap(clamped, occupied, 12));
    if (!hasCollision) return clamped;
  }

  return resolveSceneLayoutBoxWithinArea(clampBoxToArea(candidates[0] || box, area, 12), occupiedBoxes, area);
}

function sortNodeEntriesForDirection(nodeEntries, rankdir) {
  return [...nodeEntries].sort((left, right) => {
    if (rankdir === 'LR') {
      return left.box.x - right.box.x || left.box.y - right.box.y || left.index - right.index;
    }
    return left.box.y - right.box.y || left.box.x - right.box.x || left.index - right.index;
  });
}

function buildSyntheticGraphEdges(nodeEntries, connectedIds, rankdir) {
  const edges = [];
  const sortedEntries = sortNodeEntriesForDirection(nodeEntries, rankdir);
  const primaryEntries = sortedEntries.filter((entry) => entry.role === 'primary');
  const primaryAnchor = primaryEntries[0] || sortedEntries[0] || null;

  let previous = null;
  for (const entry of sortedEntries) {
    if (connectedIds.has(entry.id)) {
      previous = entry;
      continue;
    }

    if (primaryAnchor && primaryAnchor.id !== entry.id) {
      edges.push({ sourceId: primaryAnchor.id, targetId: entry.id, synthetic: true });
      continue;
    }

    if (previous && previous.id !== entry.id) {
      edges.push({ sourceId: previous.id, targetId: entry.id, synthetic: true });
    }

    previous = entry;
  }

  if (!edges.length && sortedEntries.length > 1) {
    for (let index = 1; index < sortedEntries.length; index += 1) {
      edges.push({ sourceId: sortedEntries[index - 1].id, targetId: sortedEntries[index].id, synthetic: true });
    }
  }

  return edges;
}

function buildGraphLayoutArea(segmentScenes, headerFloor) {
  const footerBoxes = segmentScenes
    .map((scene) => ({ scene, box: estimateSceneLayoutBox(scene) }))
    .filter(({ scene, box }) => box && isGraphLayoutFooterScene(scene));
  const footerTop = footerBoxes.length ? Math.min(...footerBoxes.map(({ box }) => box.y)) : 476;

  return {
    x: 24,
    y: headerFloor,
    width: 752,
    height: Math.max(140, footerTop - headerFloor - 18),
  };
}

function computeGraphLayoutBoxes(nodeEntries, graphEdges, area, rankdir) {
  const layoutAttempts = [
    { nodesep: rankdir === 'LR' ? 34 : 26, ranksep: rankdir === 'LR' ? 54 : 44 },
    { nodesep: 22, ranksep: 30 },
  ];

  for (const attempt of layoutAttempts) {
    const graph = new dagre.graphlib.Graph({ multigraph: false, compound: false });
    graph.setGraph({
      rankdir,
      align: rankdir === 'LR' ? 'UL' : 'DL',
      nodesep: attempt.nodesep,
      ranksep: attempt.ranksep,
      marginx: 0,
      marginy: 0,
    });
    graph.setDefaultEdgeLabel(() => ({}));

    for (const entry of nodeEntries) {
      graph.setNode(entry.id, { width: entry.box.width, height: entry.box.height });
    }

    const seenEdges = new Set();
    for (const edge of graphEdges) {
      const key = `${edge.sourceId}->${edge.targetId}`;
      if (seenEdges.has(key) || edge.sourceId === edge.targetId) continue;
      seenEdges.add(key);
      graph.setEdge(edge.sourceId, edge.targetId);
    }

    dagre.layout(graph);

    const laidOutNodes = nodeEntries.map((entry) => ({ entry, node: graph.node(entry.id) })).filter(({ node }) => node);
    if (laidOutNodes.length !== nodeEntries.length) continue;

    const bounds = laidOutNodes.reduce((acc, { node, entry }) => {
      const minX = node.x - entry.box.width / 2;
      const minY = node.y - entry.box.height / 2;
      const maxX = node.x + entry.box.width / 2;
      const maxY = node.y + entry.box.height / 2;
      return {
        minX: Math.min(acc.minX, minX),
        minY: Math.min(acc.minY, minY),
        maxX: Math.max(acc.maxX, maxX),
        maxY: Math.max(acc.maxY, maxY),
      };
    }, { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY });

    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;
    if (graphWidth > area.width + 24 || graphHeight > area.height + 24) continue;

    const offsetX = area.x + Math.max(0, (area.width - graphWidth) / 2) - bounds.minX;
    const offsetY = area.y + Math.max(0, (area.height - graphHeight) / 2) - bounds.minY;
    const targetBoxes = new Map();

    for (const { entry, node } of laidOutNodes) {
      const targetBox = clampBoxToArea({
        x: node.x - entry.box.width / 2 + offsetX,
        y: node.y - entry.box.height / 2 + offsetY,
        width: entry.box.width,
        height: entry.box.height,
      }, area, 12);
      targetBoxes.set(entry.id, targetBox);
    }

    return targetBoxes;
  }

  return null;
}

function resolveConnectionPoints(sourceBox, targetBox) {
  const sourceCenter = boxCenter(sourceBox);
  const targetCenter = boxCenter(targetBox);
  const dx = targetCenter[0] - sourceCenter[0];
  const dy = targetCenter[1] - sourceCenter[1];

  if (Math.abs(dx) >= Math.abs(dy)) {
    return {
      from: [dx >= 0 ? sourceBox.x + sourceBox.width : sourceBox.x, sourceCenter[1]],
      to: [dx >= 0 ? targetBox.x : targetBox.x + targetBox.width, targetCenter[1]],
    };
  }

  return {
    from: [sourceCenter[0], dy >= 0 ? sourceBox.y + sourceBox.height : sourceBox.y],
    to: [targetCenter[0], dy >= 0 ? targetBox.y : targetBox.y + targetBox.height],
  };
}

function rerouteConnectorScene(scene, sourceBox, targetBox) {
  if (!scene || !sourceBox || !targetBox) return;

  const { from, to } = resolveConnectionPoints(sourceBox, targetBox);
  const dx = Math.abs(to[0] - from[0]);
  const dy = Math.abs(to[1] - from[1]);

  if (scene.type === 'draw_arrow' || scene.type === 'draw_line') {
    scene.from = from;
    scene.to = to;
    return;
  }

  if (scene.type === 'draw_path') {
    scene.d = dx >= dy * 1.15
      ? scurveH(from[0], from[1], to[0], to[1])
      : qbez(from[0], from[1], to[0], to[1], 26);
  }
}

function layoutSceneSegmentWithGraph(segmentScenes, headerFloor) {
  const fixedBoxes = [];
  const nodeEntries = [];
  const attachedEntries = [];
  const area = buildGraphLayoutArea(segmentScenes, headerFloor);

  segmentScenes.forEach((scene, index) => {
    const box = estimateSceneLayoutBox(scene);
    if (!box) return;

    if (isGraphLayoutHeaderScene(scene) || isGraphLayoutFooterScene(scene) || !isGraphLayoutNodeScene(scene)) {
      fixedBoxes.push(box);
      return;
    }

    const entry = {
      id: `node-${index}`,
      index,
      scene,
      box,
      role: classifyGraphLayoutRole(scene, box),
    };

    if (isGraphLayoutAttachedScene(scene, box)) {
      attachedEntries.push(entry);
      return;
    }

    nodeEntries.push(entry);
  });

  if (!nodeEntries.length) {
    return false;
  }

  const { relations, connectedIds } = inferConnectorRelations(segmentScenes, nodeEntries);
  const occupiedBoxes = [...fixedBoxes];
  const resolvedBoxes = new Map();
  const orderedNodes = [...nodeEntries].sort((left, right) => {
    if (left.role !== right.role) return left.role === 'primary' ? -1 : 1;
    return left.index - right.index;
  });

  if (nodeEntries.length >= 2) {
    const rankdir = chooseGraphRankDir(nodeEntries, relations);
    const graphEdges = [
      ...relations.map((relation) => ({ sourceId: relation.sourceId, targetId: relation.targetId, synthetic: false })),
      ...buildSyntheticGraphEdges(nodeEntries, connectedIds, rankdir),
    ];
    const targetBoxes = computeGraphLayoutBoxes(nodeEntries, graphEdges, area, rankdir);
    if (!targetBoxes) {
      return false;
    }

    for (const entry of orderedNodes) {
      const targetBox = targetBoxes.get(entry.id) || entry.box;
      const resolvedBox = resolveSceneLayoutBoxWithinArea(targetBox, occupiedBoxes, area);
      applySceneLayoutBox(entry.scene, resolvedBox);
      const finalBox = estimateSceneLayoutBox(entry.scene) || resolvedBox;
      occupiedBoxes.push(finalBox);
      resolvedBoxes.set(entry.id, finalBox);
    }

    for (const relation of relations) {
      rerouteConnectorScene(relation.scene, resolvedBoxes.get(relation.sourceId), resolvedBoxes.get(relation.targetId));
    }
  } else {
    const entry = orderedNodes[0];
    const resolvedBox = resolveSceneLayoutBoxWithinArea(entry.box, occupiedBoxes, area);
    applySceneLayoutBox(entry.scene, resolvedBox);
    const finalBox = estimateSceneLayoutBox(entry.scene) || resolvedBox;
    occupiedBoxes.push(finalBox);
    resolvedBoxes.set(entry.id, finalBox);
  }

  for (const entry of attachedEntries) {
    const anchorEntry = findNearestAttachedAnchorEntry(entry, orderedNodes);
    const anchorBox = anchorEntry ? (resolvedBoxes.get(anchorEntry.id) || anchorEntry.box) : null;
    const resolvedBox = anchorBox
      ? resolveAttachedSceneLayoutBox(entry, anchorEntry, anchorBox, occupiedBoxes, area)
      : resolveSceneLayoutBoxWithinArea(entry.box, occupiedBoxes, area);
    applySceneLayoutBox(entry.scene, resolvedBox);
    const finalBox = estimateSceneLayoutBox(entry.scene) || resolvedBox;
    occupiedBoxes.push(finalBox);
    resolvedBoxes.set(entry.id, finalBox);
  }

  return true;
}

function collectNarrationSupportSentences(lessonSpec, concepts = [], partTitle = '') {
  const normalizedConcepts = concepts
    .map((concept) => normalizeText(concept).toLowerCase())
    .filter(Boolean);
  const titleTerms = normalizeText(partTitle)
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 4);
  const sourceSentences = extractSentences(lessonSpec?.section_text || '').filter((sentence) => sentence.length > 30);
  const matchedSourceSentences = sourceSentences.filter((sentence) => {
    const normalized = sentence.toLowerCase();
    return normalizedConcepts.some((concept) => normalized.includes(concept))
      || titleTerms.some((word) => normalized.includes(word));
  }).filter((sentence) => !isInstructionalMetaSentence(sentence));

  const keyTopics = Array.isArray(lessonSpec?.comprehension?.key_topics)
    ? lessonSpec.comprehension.key_topics
    : [];
  const matchedTopics = keyTopics.filter((topic) => {
    const topicName = normalizeText(topic?.topic || '').toLowerCase();
    if (!topicName) return false;
    return normalizedConcepts.some((concept) => topicName.includes(concept) || concept.includes(topicName));
  });
  const topicPool = matchedTopics.length ? matchedTopics : keyTopics.slice(0, 4);
  const topicEntries = filterInstructionalMetaEntries(topicPool.flatMap((topic) => [
    topic?.definition || '',
    topic?.importance || '',
    ...uniqueNormalizedStrings(topic?.details, 4),
    ...uniqueNormalizedStrings(topic?.relationships, 2),
  ]));

  const supportCorpus = normalizeText([
    ...filterInstructionalMetaEntries([
      lessonSpec?.comprehension?.core_thesis || '',
      lessonSpec?.comprehension?.logical_flow || '',
    ]),
    ...matchedSourceSentences.map((entry) => normalizeSentence(entry)),
    ...topicEntries,
  ].join(' '));

  return extractSentences(supportCorpus)
    .filter((sentence) => sentence.length > 28)
    .filter((sentence) => !containsPlannerControlPhrase(sentence, lessonSpec));
}

function expandNarrationToTarget(narration, lessonSpec, concepts, targetWords, partTitle = '') {
  const baseSentences = extractSentences(narration || '').map((sentence) => normalizeSentence(sentence));
  const supportSentences = collectNarrationSupportSentences(lessonSpec, concepts, partTitle);
  const transitions = [
    'More concretely,', 'On the board, this means', 'A useful way to see it is that',
    'In the lesson flow,', 'From another angle,', 'The next detail is that',
    'To make that visible,', 'This also shows that', 'One practical implication is that',
  ];
  const chunks = [];
  const seen = new Set();
  let transitionIndex = 0;

  const pushSentence = (sentence, useTransition = false) => {
    const normalized = normalizeSentence(sentence);
    const key = normalized.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    if (!useTransition || !chunks.length) {
      chunks.push(normalized);
      return true;
    }
    const transition = transitions[transitionIndex % transitions.length];
    transitionIndex += 1;
    if (/^(the|this|that|these|a|an|it|when|if|for|in|on|by|with|as|from)/i.test(normalized)) {
      chunks.push(`${transition} ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`);
    } else {
      chunks.push(`${transition} ${normalized}`);
    }
    return true;
  };

  baseSentences.forEach((sentence) => pushSentence(sentence));

  for (const sentence of supportSentences) {
    if (wordCount(assembleNarration(chunks)) >= targetWords) break;
    pushSentence(sentence, true);
  }

  return assembleNarration(chunks);
}

function collectSceneTextFragments(scene) {
  const fragments = [];

  const push = (value) => {
    const normalized = normalizeText(String(value || ''));
    if (normalized) fragments.push(normalized);
  };

  if (!scene || typeof scene !== 'object') return fragments;

  switch (scene.type) {
    case 'draw_text':
    case 'draw_badge':
    case 'draw_callout':
      push(scene.content);
      break;
    case 'draw_rect':
    case 'draw_circle':
      push(scene.label);
      break;
    case 'show_equation':
      push(scene.latex);
      break;
    case 'draw_graph':
      push(scene.title);
      if (Array.isArray(scene.data?.labels)) {
        scene.data.labels.forEach(push);
      }
      break;
    case 'draw_table':
      (Array.isArray(scene.headers) ? scene.headers : []).forEach(push);
      (Array.isArray(scene.rows) ? scene.rows : []).flat().forEach(push);
      break;
    case 'draw_arrow':
      push(scene.label);
      break;
    case 'draw_coordinate_system':
      push(scene.x_label);
      push(scene.y_label);
      break;
    case 'draw_physics_shape':
    case 'draw_object':
      push(scene.label);
      (Array.isArray(scene.annotations) ? scene.annotations : []).forEach(push);
      break;
    default:
      break;
  }

  return uniqueNormalizedStrings(fragments, 24);
}

function buildSceneTextSignature(value) {
  const normalized = stripVisualPhrasePreamble(sanitizeSceneText(value, 18))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';

  const keywords = [];
  for (const word of normalized.split(/\s+/).filter(Boolean)) {
    if (STOPWORDS.has(word) || VISUAL_CUE_TRAILING_WORDS.has(word)) continue;
    if (keywords.includes(word)) continue;
    keywords.push(word);
    if (keywords.length >= 8) break;
  }

  if (keywords.length >= 2) return keywords.join(' ');
  return normalized.split(/\s+/).slice(0, 8).join(' ');
}

function isGenericSceneText(value) {
  const normalized = normalizeText(String(value || '')).toLowerCase();
  if (!normalized) return false;
  return /^(focused|core|review|study|mechanism) notes$/.test(normalized)
    || /^step \d+$/.test(normalized)
    || /^question \d+$/.test(normalized)
    || /^part \d+$/.test(normalized);
}

function analyzeVisualSequence(visualSeq, anchors = []) {
  const safeScenes = Array.isArray(visualSeq) ? visualSeq : [];
  const seenText = new Set();
  const matchedAnchors = new Set();
  const anchorSignatures = uniqueNormalizedStrings(anchors, 12)
    .map((anchor) => buildSceneTextSignature(anchor))
    .filter(Boolean);
  const typeSet = new Set();
  let nonClearCount = 0;
  let duplicateTextCount = 0;
  let uniqueTextCount = 0;
  let genericTextCount = 0;
  let richSceneCount = 0;

  for (const scene of safeScenes) {
    if (!scene || typeof scene !== 'object') continue;
    const type = String(scene.type || '').trim();
    if (!type) continue;

    typeSet.add(type);
    if (type === 'clear') continue;
    nonClearCount += 1;

    if (['draw_object', 'draw_physics_shape', 'draw_graph', 'draw_coordinate_system', 'draw_table', 'draw_path'].includes(type)) {
      richSceneCount += 1;
    }

    for (const fragment of collectSceneTextFragments(scene)) {
      if (isGenericSceneText(fragment)) {
        genericTextCount += 1;
      }

      const signature = buildSceneTextSignature(fragment);
      if (!signature) continue;

      if (seenText.has(signature)) {
        duplicateTextCount += 1;
      } else {
        seenText.add(signature);
        uniqueTextCount += 1;
      }

      anchorSignatures.forEach((anchorSignature) => {
        if (signature.includes(anchorSignature) || anchorSignature.includes(signature)) {
          matchedAnchors.add(anchorSignature);
        }
      });
    }
  }

  const totalTrackedText = uniqueTextCount + duplicateTextCount;
  return {
    nonClearCount,
    typeCount: typeSet.size,
    richSceneCount,
    uniqueTextCount,
    duplicateTextCount,
    anchorMatchCount: matchedAnchors.size,
    duplicateRatio: totalTrackedText ? duplicateTextCount / totalTrackedText : 0,
    genericTextRatio: totalTrackedText ? genericTextCount / totalTrackedText : 0,
  };
}

function hasStrongLessonSpecificVisualSequence(visualSeq, part, lessonSpec) {
  const anchors = [
    part?.title,
    ...(Array.isArray(part?.key_concepts) ? part.key_concepts : []),
    ...(Array.isArray(lessonSpec?.key_points) ? lessonSpec.key_points.slice(0, 4) : []),
  ];
  const metrics = analyzeVisualSequence(visualSeq, anchors);

  if (metrics.nonClearCount < 10) return false;
  if (metrics.typeCount < 4) return false;
  if (metrics.anchorMatchCount < 1 && metrics.richSceneCount < 3) return false;
  if (metrics.duplicateRatio > 0.45) return false;
  if (metrics.genericTextRatio > 0.5 && metrics.richSceneCount < 3) return false;
  if (metrics.uniqueTextCount < 6 && metrics.richSceneCount < 2) return false;

  return true;
}

function mainSceneText(scene) {
  return collectSceneTextFragments(scene)[0] || '';
}

function sanitizeSceneEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const type = String(entry.type || '').trim();
  if (!type) return null;

  const scene = {
    time: Number(entry.time) || 0,
    type,
    ...Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'time' && key !== 'type')),
  };

  switch (type) {
    case 'clear':
      return { time: scene.time, type };

    case 'draw_text': {
      const y = Array.isArray(scene.position) && scene.position.length === 2
        ? Number(scene.position[1]) || 0
        : 0;
      scene.content = y && y <= 110
        ? compactVisualPhrase(scene.content, y <= 48 ? 8 : 9)
        : sanitizeSceneText(scene.content, 12);
      return scene.content ? scene : null;
    }

    case 'draw_badge':
      scene.content = normalizeVisualCue(scene.content, 4);
      return scene.content ? scene : null;

    case 'draw_callout':
      scene.content = sanitizeSceneText(scene.content, 16);
      if (scene.content) {
        scene.width = Math.max(Number(scene.width) || 0, estimateContainerWidth(scene.content, 7.4, 220, 360));
        if (Array.isArray(scene.position) && scene.position.length === 2) {
          const height = estimateContainerHeight(scene.content, scene.width, 7.1, 18, 78, 170);
          scene.position = [
            clampBoxX(scene.position[0], scene.width),
            clampBoxY(scene.position[1], height),
          ];
        }
      }
      return scene.content ? scene : null;

    case 'draw_rect':
      scene.label = compactVisualPhrase(scene.label, 10);
      if (scene.label) {
        const width = estimateContainerWidth(scene.label, 8.1, 160, 320);
        scene.width = Math.max(Number(scene.width) || 0, width);
        scene.height = Math.max(Number(scene.height) || 0, estimateContainerHeight(scene.label, scene.width, 7.6, 18, 64, 150));
        scene.x = clampBoxX(scene.x, scene.width);
        scene.y = clampBoxY(scene.y, scene.height);
      }
      if (!scene.label && !(scene.style?.fill || scene.style?.stroke)) return null;
      return scene;

    case 'draw_circle':
      scene.label = compactVisualPhrase(scene.label, 5);
      if (scene.label) {
        const minRadius = clamp(Math.round(Math.max(42, scene.label.length * 3.2)), 42, 92);
        scene.radius = Math.max(Number(scene.radius) || 0, minRadius);
      }
      if (!scene.label && !(scene.style?.fill || scene.style?.stroke)) return null;
      return scene;

    case 'show_equation':
      scene.latex = normalizeText(String(scene.latex || ''));
      return scene.latex ? scene : null;

    case 'draw_graph':
      if (!Array.isArray(scene.data?.values) || scene.data.values.length === 0) return null;
      scene.title = compactVisualPhrase(scene.title, 5);
      return scene;

    case 'draw_table': {
      const headers = uniqueNormalizedStrings(scene.headers, 6)
        .map((value) => compactVisualPhrase(value, 3))
        .filter(Boolean);
      const rows = Array.isArray(scene.rows)
        ? scene.rows
            .map((row) => (Array.isArray(row) ? row : [])
              .slice(0, headers.length || 4)
              .map((value, index) => compactVisualPhrase(value, index === 0 ? 3 : 5))
              .filter(Boolean))
            .filter((row) => row.length)
        : [];
      if (!headers.length || !rows.length) return null;
      scene.headers = headers;
      scene.rows = rows;
      const longestCell = Math.max(
        ...headers.map((value) => normalizeText(value).length),
        ...rows.flatMap((row) => row.map((value) => normalizeText(value).length)),
      );
      const maxCellWidth = Math.max(120, Math.floor(560 / headers.length));
      scene.cell_width = clamp(
        Math.max(Number(scene.cell_width) || 0, estimateContainerWidth('x'.repeat(longestCell), 6.3, 130, maxCellWidth)),
        130,
        maxCellWidth,
      );
      return scene;
    }

    case 'draw_physics_shape':
      if (!scene.shape_type) return null;
      scene.label = normalizeVisualCue(scene.label, 5);
      scene.annotations = buildVisualCueList(scene.annotations, 3, 4);
      return scene;

    case 'draw_object':
      if (!scene.object_type) return null;
      scene.label = normalizeVisualCue(scene.label, 5);
      scene.annotations = buildVisualCueList(scene.annotations, 3, 4);
      return scene;

    case 'draw_coordinate_system':
      if (Array.isArray(scene.plot_points) && scene.plot_points.length === 0) delete scene.plot_points;
      return scene;

    default:
      return scene;
  }
}

function normalizePedagogicalImportance(value, fallback = 'supporting') {
  const normalized = normalizePlannerPhrase(value);
  if (!normalized) return fallback;
  if (/^(1|high|highest|primary|main|core|anchor|critical)$/.test(normalized)) return 'primary';
  if (/^(example|applied|application|case)$/.test(normalized)) return 'example';
  if (/^(recap|summary|review|takeaway)$/.test(normalized)) return 'recap';
  return 'supporting';
}

function normalizePedagogicalRelationship(value) {
  const normalized = normalizePlannerPhrase(value);
  if (!normalized) return 'association';
  if (/(cause|effect|impact|result|consequence)/.test(normalized)) return 'cause_effect';
  if (/(sequence|process|stage|step|flow|timeline|chronology|transformation)/.test(normalized)) return 'sequence';
  if (/(hierarchy|tree|category|cluster|part of|component)/.test(normalized)) return 'hierarchy';
  if (/(compare|comparison|contrast|versus|vs)/.test(normalized)) return 'comparison';
  if (/(depend|dependency|input|output|requires)/.test(normalized)) return 'dependency';
  if (/(data|trend|graph|chart|measure)/.test(normalized)) return 'data';
  if (/(define|definition|means|term|callout)/.test(normalized)) return 'definition';
  if (/(example|application|case|scenario)/.test(normalized)) return 'example';
  return normalized.replace(/\s+/g, '_').slice(0, 32) || 'association';
}

function normalizePedagogicalRole(value) {
  const normalized = normalizePlannerPhrase(value);
  if (!normalized) return 'supporting_point';
  if (/(main|core|anchor|root|primary|concept)/.test(normalized)) return 'main_concept';
  if (/(support|detail|factor|component|point|term|label)/.test(normalized)) return 'supporting_point';
  if (/(example|application|scenario|case)/.test(normalized)) return 'example';
  if (/(process|step|stage|pipeline)/.test(normalized)) return 'process_step';
  if (/(compare|comparison|contrast)/.test(normalized)) return 'comparison';
  if (/(hierarchy|tree|category|cluster)/.test(normalized)) return 'hierarchy_node';
  if (/(graph|data|chart|plot)/.test(normalized)) return 'graph';
  if (/(definition|callout|keyword|formula)/.test(normalized)) return 'definition';
  return 'supporting_point';
}

function normalizePedagogicalVisualType(value, relationship) {
  const normalized = normalizePlannerPhrase(value);
  const resolvedRelationship = normalizePedagogicalRelationship(relationship || normalized);
  if (/(graph|chart|plot)/.test(normalized) || resolvedRelationship === 'data') return 'graph';
  if (/(timeline|chronology)/.test(normalized)) return 'timeline';
  if (/(tree|hierarchy|cluster|category)/.test(normalized) || resolvedRelationship === 'hierarchy') return 'tree';
  if (/(compare|comparison|contrast|side by side)/.test(normalized) || resolvedRelationship === 'comparison') return 'side_by_side';
  if (/(pipeline|process|path|flow)/.test(normalized) || resolvedRelationship === 'sequence') return 'pipeline';
  if (/(arrow|cause|effect)/.test(normalized) || resolvedRelationship === 'cause_effect') return 'arrow';
  if (/(example|boxed)/.test(normalized) || resolvedRelationship === 'example') return 'boxed_example';
  if (/(definition|callout|keyword|formula)/.test(normalized) || resolvedRelationship === 'definition') return 'callout';
  return 'callout';
}

function derivePedagogicalSceneGoal(part, keyConcepts) {
  const focus = truncateWords(keyConcepts[0] || part.title || 'the main idea', 4);
  if (/how|process|works|mechanism|flow|stages?/i.test(part.title || '')) {
    return `Explain how ${focus} works`;
  }
  if (/apply|example|practice|case|use/i.test(part.title || '')) {
    return `Apply ${focus} to a clear example`;
  }
  if (/compare|difference|versus|vs/i.test(part.title || '')) {
    return `Compare the key parts of ${focus}`;
  }
  return `Teach ${focus} clearly`;
}

function derivePedagogicalLearningObjective(part, keyConcepts, sceneGoal) {
  const primary = truncateWords(keyConcepts[0] || part.title || 'the concept', 4);
  const supporting = truncateWords(keyConcepts[1] || keyConcepts[0] || 'its related ideas', 4);

  if (/apply|example|practice|case/i.test(sceneGoal || '')) {
    return `Use ${primary} in a concrete scenario`;
  }
  if (/compare/i.test(sceneGoal || '')) {
    return `Distinguish ${primary} from ${supporting}`;
  }
  if (/how|works|process|flow/i.test(sceneGoal || '')) {
    return `Understand the sequence behind ${primary}`;
  }
  return `Understand ${primary} and connect it to ${supporting}`;
}

function buildFallbackVisualLogic(part, keyConcepts, lessonSpec, sceneGoal, learningObjective) {
  const supportSentences = collectNarrationSupportSentences(lessonSpec, keyConcepts, part.title || '')
    .slice(0, 4)
    .map((sentence) => compactVisualPhrase(sentence, 6))
    .filter(Boolean);

  const primary = compactVisualPhrase(keyConcepts[0] || part.title || sceneGoal, 4);
  const supporting = keyConcepts
    .slice(1, 4)
    .map((concept) => compactVisualPhrase(concept, 5))
    .filter(Boolean);
  const exampleCue = supportSentences.find((sentence) => /\b(example|apply|use|case|scenario|practice)\b/i.test(sentence))
    || supportSentences[0]
    || compactVisualPhrase(learningObjective, 6);
  const relationship = /how|works|process|flow|sequence/i.test(sceneGoal || part.title || '') ? 'sequence' : 'definition';

  const fallback = [];
  if (primary) {
    fallback.push({
      type: relationship === 'sequence' ? 'pipeline' : 'callout',
      semantic_role: 'main_concept',
      relationship,
      importance: 'primary',
      content: primary,
    });
  }

  supporting.forEach((concept) => {
    fallback.push({
      type: relationship === 'sequence' ? 'pipeline' : 'tree',
      semantic_role: relationship === 'sequence' ? 'process_step' : 'supporting_point',
      relationship,
      importance: 'supporting',
      content: concept,
    });
  });

  if (exampleCue) {
    fallback.push({
      type: 'boxed_example',
      semantic_role: 'example',
      relationship: 'example',
      importance: 'example',
      content: exampleCue,
    });
  }

  return fallback.slice(0, 5);
}

function normalizeVisualLogicEntries(entries, fallbackText, keyConcepts, sceneGoal, learningObjective, lessonSpec, part) {
  const normalizedEntries = [];
  const seen = new Set();

  for (const rawEntry of Array.isArray(entries) ? entries : []) {
    const entry = typeof rawEntry === 'string' ? { content: rawEntry } : rawEntry;
    if (!entry || typeof entry !== 'object') continue;

    const semanticRole = normalizePedagogicalRole(entry.semantic_role || entry.role || entry.type);
    const relationship = normalizePedagogicalRelationship(entry.relationship || entry.type || semanticRole);
    const type = normalizePedagogicalVisualType(entry.type, relationship);
    const content = compactVisualPhrase(
      entry.content || entry.label || entry.topic || entry.title || semanticRole,
      semanticRole === 'main_concept' ? 4 : 6,
    );

    if (!content) continue;

    const signature = `${semanticRole}|${buildSceneTextSignature(content)}`;
    if (!signature || seen.has(signature)) continue;
    seen.add(signature);

    normalizedEntries.push({
      type,
      semantic_role: semanticRole,
      relationship,
      importance: normalizePedagogicalImportance(entry.importance, semanticRole === 'main_concept' ? 'primary' : semanticRole === 'example' ? 'example' : 'supporting'),
      content,
    });

    if (normalizedEntries.length >= 5) break;
  }

  if (normalizedEntries.length < 2) {
    for (const fallbackEntry of buildFallbackVisualLogic(part, keyConcepts, lessonSpec, sceneGoal, learningObjective)) {
      const signature = `${fallbackEntry.semantic_role}|${buildSceneTextSignature(fallbackEntry.content)}`;
      if (!signature || seen.has(signature)) continue;
      seen.add(signature);
      normalizedEntries.push(fallbackEntry);
      if (normalizedEntries.length >= 5) break;
    }
  }

  if (!normalizedEntries.length && fallbackText) {
    const derivedConcepts = sanitizeConceptList(keyConcepts, fallbackText, 4);
    return buildFallbackVisualLogic(part, derivedConcepts, lessonSpec, sceneGoal, learningObjective);
  }

  if (!normalizedEntries.some((entry) => entry.semantic_role === 'main_concept') && normalizedEntries[0]) {
    normalizedEntries[0] = {
      ...normalizedEntries[0],
      semantic_role: 'main_concept',
      importance: 'primary',
    };
  }

  return normalizedEntries.slice(0, 5);
}

function normalizeAnimationBeat(value) {
  const normalized = normalizePlannerPhrase(value);
  if (!normalized) return '';
  if (/(hook|intro|introduction|warm up)/.test(normalized)) return 'hook';
  if (/(concept|define|definition|anchor)/.test(normalized)) return 'concept';
  if (/(relationship|connect|compare|cause|effect|flow|sequence)/.test(normalized)) return 'relationship';
  if (/(example|application|case|practice)/.test(normalized)) return 'example';
  if (/(recap|summary|takeaway|review)/.test(normalized)) return 'mini_recap';
  if (/(quiz|check|question)/.test(normalized)) return 'quiz';
  return normalized.replace(/\s+/g, '_').slice(0, 24);
}

function normalizeAnimationSequence(sequence) {
  const defaults = ['hook', 'concept', 'relationship', 'example', 'mini_recap'];
  const normalized = uniqueNormalizedStrings((Array.isArray(sequence) ? sequence : [])
    .map((entry) => normalizeAnimationBeat(entry))
    .filter(Boolean), 6);

  if (!normalized.length) return defaults;
  return normalized.slice(0, 6);
}

function normalizePedagogicalPlan(part, lessonSpec, keyConcepts) {
  const fallbackText = [part.title, part.narration, lessonSpec?.section_text].filter(Boolean).join('\n\n');
  const sceneGoal = sanitizeSceneText(part.scene_goal || derivePedagogicalSceneGoal(part, keyConcepts), 10)
    || derivePedagogicalSceneGoal(part, keyConcepts);
  const learningObjective = sanitizeSceneText(part.learning_objective || derivePedagogicalLearningObjective(part, keyConcepts, sceneGoal), 16)
    || derivePedagogicalLearningObjective(part, keyConcepts, sceneGoal);
  const visualLogic = normalizeVisualLogicEntries(part.visual_logic, fallbackText, keyConcepts, sceneGoal, learningObjective, lessonSpec, part);
  const animationSequence = normalizeAnimationSequence(part.animation_sequence);

  return {
    scene_goal: sceneGoal,
    learning_objective: learningObjective,
    visual_logic: visualLogic,
    animation_sequence: animationSequence,
  };
}

function validateAndFixPlan(aiPlan, lessonSpec) {
  const title = aiPlan.title || lessonSpec.title || 'Lesson';
  const subject = aiPlan.subject || lessonSpec.comprehension?.document_subject || '';
  const summary = aiPlan.summary || '';

  const parts = (aiPlan.parts || []).map((part, index) => {
    const fallbackConceptText = [part.title, part.narration, lessonSpec?.section_text].filter(Boolean).join('\n\n');
    const keyConcepts = sanitizeConceptList(part.key_concepts, fallbackConceptText, 8);
    const pedagogicalPlan = normalizePedagogicalPlan(part, lessonSpec, keyConcepts);
    const pedagogicalConcepts = sanitizeConceptList([
      ...keyConcepts,
      pedagogicalPlan.scene_goal,
      pedagogicalPlan.learning_objective,
      ...pedagogicalPlan.visual_logic.map((entry) => entry.content),
    ], fallbackConceptText, 8);
    const fixed = {
      order_index: part.order_index || index + 1,
      title: sanitizeSceneText(part.title || `Part ${index + 1}`, 8) || `Part ${index + 1}`,
      part_type: part.part_type || 'content',
      duration_seconds: clamp(Number(part.duration_seconds) || 300, 55, 600),
      narration: sanitizeNarration(part.narration || '', lessonSpec, keyConcepts),
      key_concepts: pedagogicalConcepts.length ? pedagogicalConcepts : keyConcepts,
      scene_goal: pedagogicalPlan.scene_goal,
      learning_objective: pedagogicalPlan.learning_objective,
      visual_logic: pedagogicalPlan.visual_logic,
      animation_sequence: pedagogicalPlan.animation_sequence,
      visual_sequence: validateAIVisualOutput(Array.isArray(part.visual_sequence) ? part.visual_sequence : [], clamp(Number(part.duration_seconds) || 300, 55, 600)),
    };

    if (part.part_type === 'quiz') {
      fixed.quiz_questions = normalizeQuizQuestions(part.quiz_questions, lessonSpec);
      fixed.duration_seconds = clamp(fixed.duration_seconds, 45, 90);
    }

    if (fixed.part_type === 'content') {
      const targetWords = getContentNarrationTargetWords(lessonSpec);
      if (wordCount(fixed.narration) < targetWords) {
        fixed.narration = sanitizeNarrationWithoutEnrichment(
          expandNarrationToTarget(fixed.narration, lessonSpec, fixed.key_concepts, targetWords, fixed.title),
          lessonSpec,
          fixed.key_concepts,
          collectNarrationSupportSentences(lessonSpec, fixed.key_concepts, fixed.title).join(' '),
        );
      }
      fixed.duration_seconds = Math.max(
        fixed.duration_seconds,
        estimateNarrationDurationSeconds(fixed.narration, getContentDurationFloor(lessonSpec), 420),
      );
    }

    return fixed;
  });

  // Ensure we have at least content-quiz-content structure
  if (parts.filter((p) => p.part_type === 'content').length === 0) {
    return buildFallbackLesson(lessonSpec);
  }

  return { title, subject, summary, parts };
}

function isWeakTopicPlan(plan, lessonSpec) {
  if (lessonSpec?.source_mode !== 'topic' || !plan?.parts?.length) return false;

  const contentParts = plan.parts.filter((part) => part.part_type === 'content');
  if (contentParts.length < 3) return true;

  const averageNarrationWords = contentParts.reduce((sum, part) => sum + part.narration.split(/\s+/).filter(Boolean).length, 0) / Math.max(contentParts.length, 1);
  const targetWords = getContentNarrationTargetWords(lessonSpec);
  if (averageNarrationWords < Math.max(170, Math.round(targetWords * 0.8))) return true;
  if (contentParts.some((part) => wordCount(part.narration) < Math.max(150, Math.round(targetWords * 0.65)))) return true;
  if (contentParts.some((part) => Number(part.duration_seconds) < getContentDurationFloor(lessonSpec) - 20)) return true;

  const rawRequest = normalizePlannerPhrase(lessonSpec.topic_request || lessonSpec.section_text || '');
  const summary = normalizePlannerPhrase(plan.summary || '');
  if (!summary || summary === rawRequest) return true;

  if (contentParts.some((part) => /\bunders?tan?ding\s+explain\b/i.test(part.title || ''))) return true;

  return false;
}

function enrichNarration(narration, concepts, lessonSpec) {
  const sourceText = lessonSpec.section_text || '';
  const sentences = extractSentences(sourceText);
  const conceptSentences = sentences.filter((s) =>
    concepts.some((c) => s.toLowerCase().includes(c.toLowerCase()))
    && s.length > 35
  ).slice(0, 8);

  const CONNECTORS = [
    'More precisely,', 'To expand on this,', 'A related point is that',
    'Additionally,', 'Looking deeper,', 'In practical terms,',
    'From the source material,', 'Specifically,',
  ];

  const usedPhrases = new Set();
  const enriched = [narration];
  conceptSentences.forEach((s, i) => {
    const normalized = normalizeSentence(s);
    const key = normalized.toLowerCase().slice(0, 40);
    if (usedPhrases.has(key)) return;
    if (narration.toLowerCase().includes(normalized.toLowerCase().slice(0, 30))) return;
    usedPhrases.add(key);
    enriched.push(`${CONNECTORS[i % CONNECTORS.length]} ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`);
  });

  const result = enriched.filter(Boolean).join(' ');
  if (result.split(/\s+/).length > 400) return result;

  const extraSource = sentences
    .filter((sentence) => !containsPlannerControlPhrase(sentence, lessonSpec))
    .filter((sentence) => !result.toLowerCase().includes(sentence.toLowerCase().slice(0, 24)))
    .slice(0, 3)
    .map((sentence, index) => {
      const connector = CONNECTORS[(index + conceptSentences.length) % CONNECTORS.length];
      const normalized = normalizeSentence(sentence);
      return `${connector} ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`;
    });

  return assembleNarration([result, ...extraSource]);
}

function normalizeQuizQuestionType(value, fallback = 'mcq') {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;
  if (['mcq', 'multiple_choice', 'multiple-choice', 'multiple choice', 'choice'].includes(normalized)) {
    return 'mcq';
  }
  if (['fill_blank', 'fill-in-the-blank', 'fill in the blank', 'blank'].includes(normalized)) {
    return 'fill_blank';
  }
  if (['short_answer', 'short-answer', 'short answer'].includes(normalized)) {
    return 'short_answer';
  }
  if (['graph_interpretation', 'graph-interpretation', 'graph interpretation'].includes(normalized)) {
    return 'graph_interpretation';
  }
  return fallback;
}

function normalizeQuizQuestions(aiQuestions, lessonSpec) {
  const concepts = lessonSpec.key_points || [];
  const focus = concepts[0] || 'the main concept';

  const defaultQuestions = [
    {
      order_index: 1,
      question_type: 'mcq',
      question_text: `Which of the following best describes ${focus}?`,
      difficulty: 'medium',
      options: {
        choices: [
          concepts[0] || 'First concept',
          concepts[1] || 'Second concept',
          concepts[2] || 'Third concept',
          'None of the above',
        ],
        correct: concepts[0] || 'First concept',
      },
      correct_answer: concepts[0] || 'First concept',
      explanation: `${focus} is the central concept covered in this lesson.`,
    },
    {
      order_index: 2,
      question_type: 'fill_blank',
      question_text: `The key concept that ties this lesson together is _____.`,
      difficulty: 'medium',
      options: null,
      correct_answer: focus,
      explanation: `${focus} is the anchor concept of this lesson.`,
    },
  ];

  if (!Array.isArray(aiQuestions) || aiQuestions.length < 2) return defaultQuestions;

  return aiQuestions.slice(0, 2).map((q, i) => {
    const fallback = defaultQuestions[i];
    if (!q?.question_text) return fallback;
    const questionType = normalizeQuizQuestionType(q.question_type, fallback.question_type);

    const choices = Array.isArray(q?.options?.choices)
      ? q.options.choices.filter(Boolean).slice(0, 4)
      : fallback.options?.choices;
    const correct = choices?.includes(q?.correct_answer)
      ? q.correct_answer
      : choices?.includes(q?.options?.correct)
        ? q.options.correct
        : fallback.correct_answer;

    return {
      order_index: i + 1,
      question_type: questionType,
      question_text: q.question_text || fallback.question_text,
      difficulty: q.difficulty || 'medium',
      options: questionType === 'fill_blank' ? null : { choices, correct },
      correct_answer: correct || fallback.correct_answer,
      explanation: q.explanation || fallback.explanation,
    };
  });
}

// ── Fallback lesson builder ──────────────────────────────────────────────────

function buildTopicFallbackGroups(topicPool) {
  const pool = (topicPool || []).filter(Boolean);
  if (!pool.length) return [[], [], []];
  if (pool.length === 1) return [[pool[0]], [pool[0]], [pool[0]]];

  const groups = [[], [], []];
  const baseSize = Math.floor(pool.length / 3);
  const remainder = pool.length % 3;
  let cursor = 0;

  for (let index = 0; index < 3; index += 1) {
    const size = baseSize + (index < remainder ? 1 : 0);
    if (size > 0) {
      groups[index] = pool.slice(cursor, cursor + size);
      cursor += size;
    }
  }

  if (!groups[1].length) groups[1] = groups[0].slice(-1);
  if (!groups[2].length) groups[2] = (groups[1].length ? groups[1] : groups[0]).slice(-1);

  return groups;
}

function buildTopicFallbackPartConfig(explanationMode, index, primaryConcept) {
  switch (explanationMode) {
    case 'visual_first':
      return [
        { focus: 'foundation', title: `Visual Map: ${primaryConcept}`, guide: `${primaryConcept} should first be understood as a labeled visual system before moving to analysis.` },
        { focus: 'mechanism', title: `Diagramming ${primaryConcept}`, guide: `Use the board to trace how ${primaryConcept} behaves step by step.` },
        { focus: 'application', title: `Applying ${primaryConcept} Visually`, guide: `Finish with a worked scenario that keeps ${primaryConcept} tied to the diagram.` },
      ][index] || { focus: 'application', title: `${primaryConcept} on the Board`, guide: '' };
    case 'step_by_step':
      return [
        { focus: 'foundation', title: `Step 1: Define ${primaryConcept}`, guide: `Treat ${primaryConcept} as the current step and do not move on until its role is clear.` },
        { focus: 'mechanism', title: `Step 2: Build ${primaryConcept}`, guide: `Now connect ${primaryConcept} to the next step in the process.` },
        { focus: 'application', title: `Step 3: Apply ${primaryConcept}`, guide: `Use ${primaryConcept} in a final worked step so the sequence closes cleanly.` },
      ][index] || { focus: 'application', title: `Step ${index + 1}: Apply ${primaryConcept}`, guide: '' };
    case 'qa_mode':
      return [
        { focus: 'foundation', title: `Question 1: What Is ${primaryConcept}?`, guide: `Open with a direct question about ${primaryConcept}, then answer it clearly.` },
        { focus: 'mechanism', title: `Question 2: How Does ${primaryConcept} Work?`, guide: `Frame ${primaryConcept} around reasoning and checks for understanding.` },
        { focus: 'application', title: `Question 3: Can You Use ${primaryConcept}?`, guide: `End by testing whether ${primaryConcept} can be used in a concrete scenario.` },
      ][index] || { focus: 'application', title: `Question ${index + 1}: Use ${primaryConcept}`, guide: '' };
    case 'text_focus':
      return [
        { focus: 'foundation', title: `Core Notes: ${primaryConcept}`, guide: `Summarize ${primaryConcept} as concise, high-value notes and definitions.` },
        { focus: 'mechanism', title: `Mechanism Notes: ${primaryConcept}`, guide: `Keep ${primaryConcept} in note form while explaining how it works.` },
        { focus: 'application', title: `Review Notes: ${primaryConcept}`, guide: `Close with revision-style notes for applying ${primaryConcept}.` },
      ][index] || { focus: 'application', title: `Review Notes: ${primaryConcept}`, guide: '' };
    default:
      return [
        { focus: 'foundation', title: `Understanding ${primaryConcept}`, guide: '' },
        { focus: 'mechanism', title: `How ${primaryConcept} Works`, guide: '' },
        { focus: 'application', title: `${primaryConcept} in Practice`, guide: '' },
      ][index] || { focus: 'application', title: `${primaryConcept} in Practice`, guide: '' };
  }
}

function buildTopicFallbackQuizTitles(explanationMode) {
  switch (explanationMode) {
    case 'visual_first':
      return ['Diagram Check', 'Board Check'];
    case 'step_by_step':
      return ['Step Check', 'Sequence Check'];
    case 'qa_mode':
      return ['Quick Practice Check', 'Challenge Check'];
    case 'text_focus':
      return ['Recall Check', 'Revision Check'];
    default:
      return ['Check Understanding', 'Knowledge Check'];
  }
}

function buildOverviewPageTitle(explanationMode) {
  return 'Let\u2019s define these';
}

function buildOverviewConnectionsTitle(explanationMode) {
  return 'Now watch how they connect';
}

function buildDetailPageTitle(explanationMode, concept) {
  return `Let\u2019s break down ${truncateWords(concept, 4)}`;
}

function buildDetailBadgeLabel(explanationMode) {
  return '';
}

function buildApplicationBadgeLabel(explanationMode) {
  return '';
}

function buildApplicationTakeawayTitle(explanationMode) {
  return 'What to remember';
}

function buildTopicFallbackLesson(spec) {
  const lessonTitle = spec.title || spec.comprehension?.document_subject || buildTopicTitle(spec.topic_request || spec.section_text);
  const subject = spec.comprehension?.document_subject || lessonTitle;
  const topicPool = Array.isArray(spec.comprehension?.key_topics) && spec.comprehension.key_topics.length
    ? spec.comprehension.key_topics.slice(0, 6)
    : sanitizeConceptList(spec.key_points, spec.section_text, 6).map((topic) => ({
        topic,
        definition: `${topic} is a central concept in this lesson.`,
        importance: `Understanding ${topic} supports the rest of the topic.`,
        details: [],
        relationships: [],
      }));

  const groupedTopics = buildTopicFallbackGroups(topicPool);
  const quizTitles = buildTopicFallbackQuizTitles(spec.explanation_mode);
  const usedSentenceKeys = new Set();
  const contentParts = groupedTopics.map((topicGroup, index) => {
    const concepts = spec.source_mode === 'topic'
      ? dedupePromptConcepts(sanitizeConceptList(topicGroup.map((topic) => topic?.topic), spec.section_text, 6), 4)
      : sanitizeConceptList(topicGroup.map((topic) => topic?.topic), spec.section_text, 4);
    const primaryConcept = concepts[0] || topicGroup[0]?.topic || lessonTitle;
    const partConfig = buildTopicFallbackPartConfig(spec.explanation_mode, index, primaryConcept);
    const baseEntries = filterInstructionalMetaEntries([
      index === 0 ? spec.comprehension?.core_thesis || '' : '',
      ...topicGroup.flatMap((topic) => [
        topic?.definition || '',
        topic?.importance || '',
        ...uniqueNormalizedStrings(topic?.details, 3),
      ]),
    ]);
    let candidateSentences = extractSentences(normalizeText(baseEntries.join(' ')))
      .filter((sentence) => !isInstructionalMetaSentence(sentence));

    if (candidateSentences.length < 6) {
      const supportEntries = filterInstructionalMetaEntries(topicPool
        .filter((topic) => !topicGroup.some((current) => current?.topic === topic?.topic))
        .flatMap((topic) => [
          topic?.definition || '',
          topic?.importance || '',
          ...uniqueNormalizedStrings(topic?.details, 1),
        ]))
        .slice(0, 4);

      candidateSentences = extractSentences(normalizeText([...baseEntries, ...supportEntries].join(' ')))
        .filter((sentence) => !isInstructionalMetaSentence(sentence));
    }

    const topicSentences = candidateSentences.filter((sentence) => !usedSentenceKeys.has(sentence.toLowerCase()));
    const partSentences = topicSentences.length ? topicSentences : candidateSentences;
    partSentences.forEach((sentence) => usedSentenceKeys.add(sentence.toLowerCase()));
    const narration = sanitizeNarrationWithoutEnrichment(buildRichNarration({
      focus: partConfig.focus,
      concepts,
      sentences: partSentences,
    }, index, lessonTitle, spec), spec, concepts, partSentences.join(' '));

    return {
      order_index: index * 2 + 1,
      title: partConfig.title,
      part_type: 'content',
      duration_seconds: estimateNarrationDurationSeconds(narration),
      narration,
      key_concepts: concepts,
      visual_sequence: [],
    };
  });

  const quizParts = [
    buildQuizPart({
      orderIndex: 2,
      title: quizTitles[0],
      narration: 'Test your knowledge of the foundational concepts.',
      lessonTitle,
      concepts: contentParts[0].key_concepts,
      sourceText: buildTopicSourceBrief(spec),
    }),
    buildQuizPart({
      orderIndex: 4,
      title: quizTitles[1],
      narration: 'Verify your understanding.',
      lessonTitle,
      concepts: contentParts[1].key_concepts,
      sourceText: buildTopicSourceBrief(spec),
    }),
  ];

  const summarySentences = extractSentences(normalizeText(filterInstructionalMetaEntries([
    spec.comprehension?.core_thesis || '',
    ...topicPool.slice(0, 3).flatMap((topic) => [topic?.definition || '', topic?.importance || '']),
  ]).join(' '))).slice(0, 3);

  return {
    title: lessonTitle,
    subject,
    summary: clampText(summarySentences.join(' '), 400) || buildLessonSummary(lessonTitle, buildTopicSourceBrief(spec), gatherConcepts(contentParts)),
    parts: [contentParts[0], quizParts[0], contentParts[1], quizParts[1], contentParts[2]],
  };
}

function buildFallbackLesson(spec) {
  if (spec.source_mode === 'topic') {
    return buildTopicFallbackLesson(spec);
  }

  const sourceText = normalizeText(spec.section_text || spec.title || 'Lesson');
  const sentences = extractSentences(sourceText);

  // Extract concepts LOCAL to this lesson's section_text — NOT from global comprehension
  const localConcepts = sanitizeConceptList(spec.key_points, sourceText, 10);
  const lessonTitle = spec.title || localConcepts.slice(0, 2).join(' & ') || 'Lesson';
  const subject = spec.comprehension?.document_subject || localConcepts[0] || 'General';

  // Split the SOURCE TEXT into 3 distinct chunks for 3 content parts
  const thirdLen = Math.ceil(sentences.length / 3);
  const chunk1Sentences = sentences.slice(0, thirdLen);
  const chunk2Sentences = sentences.slice(thirdLen, thirdLen * 2);
  const chunk3Sentences = sentences.slice(thirdLen * 2);

  // Extract distinct concepts from each chunk
  const concepts1 = sanitizeConceptList([], chunk1Sentences.join(' '), 4);
  const concepts2 = sanitizeConceptList([], chunk2Sentences.join(' '), 4);
  const concepts3 = sanitizeConceptList([], chunk3Sentences.join(' '), 4);

  const partSpecs = [
    {
      order_index: 1,
      title: concepts1[0] ? `Understanding ${concepts1[0]}` : `${lessonTitle} — Foundations`,
      focus: 'foundation',
      concepts: concepts1.length ? concepts1 : localConcepts.slice(0, 3),
      sentences: chunk1Sentences,
    },
    {
      order_index: 3,
      title: concepts2[0] ? `How ${concepts2[0]} Works` : `${lessonTitle} — In Detail`,
      focus: 'mechanism',
      concepts: concepts2.length ? concepts2 : localConcepts.slice(3, 7),
      sentences: chunk2Sentences,
    },
    {
      order_index: 5,
      title: concepts3[0] ? `${concepts3[0]} in Practice` : `${lessonTitle} — Applied`,
      focus: 'application',
      concepts: concepts3.length ? concepts3 : localConcepts.slice(5, 9),
      sentences: chunk3Sentences,
    },
  ];

  const contentParts = partSpecs.map((ps, ci) => {
    const narration = sanitizeNarration(buildRichNarration(ps, ci, lessonTitle, spec), spec, ps.concepts);
    return {
      order_index: ps.order_index,
      title: ps.title,
      part_type: 'content',
      duration_seconds: estimateNarrationDurationSeconds(narration),
      narration,
      key_concepts: ps.concepts,
      visual_sequence: [],
    };
  });

  const quizParts = [
    buildQuizPart({
      orderIndex: 2,
      title: 'Check Understanding',
      narration: 'Test your knowledge of the foundational concepts.',
      lessonTitle,
      concepts: contentParts[0].key_concepts,
      sourceText: chunk1Sentences.join(' '),
    }),
    buildQuizPart({
      orderIndex: 4,
      title: 'Knowledge Check',
      narration: 'Verify your understanding.',
      lessonTitle,
      concepts: contentParts[1].key_concepts,
      sourceText: chunk2Sentences.join(' '),
    }),
  ];

  // Build a real summary from MEANINGFUL sentences only (skip meta/title content)
  const summSentences = sentences.filter((s) => {
    if (s.length < 35) return false;
    const t = s.trim();
    if (/^(save|read|written|page|chapter|including|the super|version|end of)/i.test(t)) return false;
    if (/\b(written for anyone|every thought|complete bible|how to work there|VOIS)\b/i.test(t)) return false;
    const words = t.split(/\s+/);
    const capsWords = words.filter((w) => /^[A-Z]{2,}$/.test(w.replace(/[^A-Za-z]/g, '')));
    if (words.length >= 3 && capsWords.length / words.length > 0.4) return false;
    return true;
  }).slice(0, 3);
  const summary = summSentences.length
    ? summSentences.map((s) => truncateWords(s, 18)).join(' ')
    : `This lesson covers ${localConcepts.slice(0, 4).join(', ')}.`;

  return {
    title: lessonTitle,
    subject,
    summary: clampText(summary, 400),
    parts: [contentParts[0], quizParts[0], contentParts[1], quizParts[1], contentParts[2]],
  };
}

function estimateNarrationDurationSeconds(narration, minSeconds = 90, maxSeconds = 420) {
  const wordCount = normalizeText(narration).split(/\s+/).filter(Boolean).length;
  if (!wordCount) return minSeconds;
  const estimatedSeconds = Math.round((wordCount / 75) * 60);
  return clamp(estimatedSeconds, minSeconds, maxSeconds);
}

function buildRichNarration(partSpec, contentIndex, lessonTitle, lessonSpecFull) {
  const sentences = partSpec.sentences || [];
  const concepts = partSpec.concepts || [];
  const usedSentences = new Set();
  const chunks = [];

  // Transition phrases to introduce source sentences naturally (never repeat the same one in sequence)
  const TRANSITIONS = [
    'Specifically,', 'According to the source material,', 'An important point here is that',
    'To elaborate,', 'Furthermore,', 'A critical detail is that',
    'It is worth noting that', 'In more precise terms,', 'This means that',
    'The key takeaway here is that', 'Looking more closely,', 'One essential aspect is that',
    'What this tells us is that', 'Expanding on this idea,', 'Practically speaking,',
  ];
  let transIdx = contentIndex * 3;
  const rankedSentences = [...sentences]
    .filter((sentence) => sentence && !containsPlannerControlPhrase(sentence, lessonSpecFull))
    .map((sentence) => ({ sentence, score: scoreSentenceForPart(sentence, concepts, partSpec.focus) }))
    .sort((left, right) => right.score - left.score || left.sentence.length - right.sentence.length)
    .map((entry) => entry.sentence);

  if (rankedSentences[0]) {
    chunks.push(normalizeSentence(rankedSentences[0]));
    usedSentences.add(rankedSentences[0]);
  }

  // Use actual sentences from this part — each used ONCE only, with a connecting phrase
  for (const s of rankedSentences) {
    if (usedSentences.has(s)) continue;
    if (s.length < 30) continue;
    const trimmed = s.trim();
    if (/^(save|read|written|page|chapter|version|end of|including|the super|complete bible)/i.test(trimmed)) continue;
    if (/\b(written for anyone|every thought|every answer|come back to it)\b/i.test(trimmed)) continue;
    const words = trimmed.split(/\s+/);
    const capsWords = words.filter((w) => /^[A-Z]{2,}$/.test(w.replace(/[^A-Za-z]/g, '')));
    if (words.length >= 3 && capsWords.length / words.length > 0.5) continue;
    usedSentences.add(s);

    const transition = TRANSITIONS[transIdx % TRANSITIONS.length];
    transIdx++;
    const normalized = normalizeSentence(s);
    if (!chunks.length) {
      chunks.push(normalized);
      continue;
    }
    // Only add transition if sentence doesn't already start with a connector
    if (/^(the|this|that|these|a|an|it|when|if|for|in|on|by|with|as|from)/i.test(normalized)) {
      chunks.push(`${transition} ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`);
    } else {
      chunks.push(normalized);
    }
    if (chunks.length >= 30) break;
  }

  if (wordCount(chunks.join(' ')) < Math.round(getContentNarrationTargetWords(lessonSpecFull) * 0.65)) {
    const supportSentences = collectNarrationSupportSentences(lessonSpecFull, concepts, partSpec.title || lessonTitle);
    for (const sentence of supportSentences) {
      if (wordCount(chunks.join(' ')) >= getContentNarrationTargetWords(lessonSpecFull)) break;
      if (usedSentences.has(sentence)) continue;
      if (sentence.length < 30) continue;
      usedSentences.add(sentence);

      const transition = TRANSITIONS[transIdx % TRANSITIONS.length];
      transIdx++;
      const normalized = normalizeSentence(sentence);
      if (!chunks.length) {
        chunks.push(normalized);
      } else if (/^(the|this|that|these|a|an|it|when|if|for|in|on|by|with|as|from)/i.test(normalized)) {
        chunks.push(`${transition} ${normalized.charAt(0).toLowerCase()}${normalized.slice(1)}`);
      } else {
        chunks.push(`${transition} ${normalized}`);
      }
      if (chunks.length >= 36) break;
    }
  }

  if (!chunks.length && concepts[0]) {
    chunks.push(`${concepts[0]} is the focus of this part of the lesson.`);
  }

  return assembleNarration(chunks);
}

function scoreSentenceForPart(sentence, concepts, focus) {
  const normalized = sentence.toLowerCase();
  let score = 0;

  if (concepts.some((concept) => normalized.includes(String(concept || '').toLowerCase()))) score += 3;

  if (focus === 'foundation' && /\b(is|means|refers?\s+to|defined\s+as|consists?\s+of|called)\b/i.test(sentence)) {
    score += 4;
  }
  if (focus === 'mechanism' && /\b(process|works|happens|causes|because|flow|step|moves|changes|through)\b/i.test(sentence)) {
    score += 4;
  }
  if (focus === 'application' && /\b(example|apply|practice|scenario|result|outcome|use|case)\b/i.test(sentence)) {
    score += 4;
  }

  if (/\b(important|essential|key|critical)\b/i.test(sentence)) score += 1;
  if (sentence.length >= 50 && sentence.length <= 180) score += 1;

  return score;
}

function buildLessonSummary(title, sourceText, concepts) {
  const sentences = extractSentences(sourceText);
  const meaningful = sentences.filter((s) => {
    if (s.length < 35) return false;
    const t = s.trim();
    if (/^(save|read|written|page|chapter|including|the super|version|end of)/i.test(t)) return false;
    if (/\b(written for anyone|complete bible|how to work there|VOIS)\b/i.test(t)) return false;
    const words = t.split(/\s+/);
    const capsWords = words.filter((w) => /^[A-Z]{2,}$/.test(w.replace(/[^A-Za-z]/g, '')));
    if (words.length >= 3 && capsWords.length / words.length > 0.4) return false;
    return true;
  });
  const top = meaningful.slice(0, 2).map((s) => truncateWords(s, 18));
  if (top.length) return clampText(top.join(' '), 350);
  return `This lesson covers ${(concepts || []).slice(0, 3).join(', ')}.`;
}

function buildQuizPart({ orderIndex, title, narration, lessonTitle, concepts, sourceText }) {
  const focus = concepts[0] || coreTopic(lessonTitle);
  const answers = buildQuizChoices(lessonTitle, concepts);
  const quizQuestions = [
    {
      order_index: 1,
      question_type: 'mcq',
      question_text: `Which of the following best describes ${focus}?`,
      difficulty: 'medium',
      options: { choices: answers, correct: answers[0] },
      correct_answer: answers[0],
      explanation: `${answers[0]} most accurately captures the concept of ${focus} as described in the lesson.`,
    },
    {
      order_index: 2,
      question_type: 'fill_blank',
      question_text: `A central concept in this lesson is _____.`,
      difficulty: 'medium',
      options: null,
      correct_answer: focus,
      explanation: `${focus} is the primary concept connecting the ideas in this section.`,
    },
  ];

  return {
    order_index: orderIndex,
    title,
    part_type: 'quiz',
    duration_seconds: 55,
    narration,
    key_concepts: [],
    visual_sequence: buildMinimalQuizFallback(lessonTitle, { title, duration_seconds: 55, narration, quiz_questions: quizQuestions }, 55),
    quiz_questions: quizQuestions,
  };
}

// =============================================================================
// AI-DRIVEN VISUAL GENERATION ENGINE
// The AI decides EVERYTHING: what to draw, when, how, pacing, layout, style.
// No static templates. Every visual decision is made dynamically by the AI.
// =============================================================================

const VISUAL_GENERATION_PROMPT = `You are an elite whiteboard animation director. Your job is to generate the EXACT drawing commands that a whiteboard rendering engine will execute to teach a concept visually.

You are NOT generating descriptions or plans. You are generating the ACTUAL animation timeline — every shape, text, arrow, and clear command with precise coordinates and timing.

AVAILABLE DRAWING PRIMITIVES (use ONLY these):

1. draw_text: Write text on the board
   { "time": N, "type": "draw_text", "content": "short text 3-12 words", "position": [x, y], "style": { "fontSize": 14-28, "color": "#hex", "fontWeight": "bold|normal", "textAnchor": "start|middle|end" } }

2. draw_rect: Draw a labeled box
   { "time": N, "type": "draw_rect", "x": N, "y": N, "width": N, "height": N, "label": "short label", "style": { "fill": "#hex", "stroke": "#hex", "strokeWidth": 1-3, "rx": 0-16 } }

3. draw_circle: Draw a labeled circle
   { "time": N, "type": "draw_circle", "center": [x, y], "radius": N, "label": "short", "style": { "fill": "#hex", "stroke": "#hex", "strokeWidth": 1-3 } }

4. draw_arrow: Draw a directional arrow (cause→effect, flow, dependency)
   { "time": N, "type": "draw_arrow", "from": [x, y], "to": [x, y], "label": "relationship", "style": { "color": "#hex", "strokeWidth": 1-3 } }

5. draw_line: Draw a simple line
   { "time": N, "type": "draw_line", "from": [x, y], "to": [x, y], "style": { "color": "#hex", "strokeWidth": 1-3, "dashed": true|false } }

6. draw_badge: Small colored label chip
   { "time": N, "type": "draw_badge", "content": "1-4 words", "position": [x, y], "style": { "bg": "#hex", "color": "#fff", "fontSize": 13-16 } }

7. draw_callout: Explanation box with background
   { "time": N, "type": "draw_callout", "content": "explanation sentence max 25 words", "position": [x, y], "width": 200-600, "style": { "bg": "#hex", "stroke": "#hex", "color": "#hex" } }

8. draw_path: SVG path for custom shapes/curves
   { "time": N, "type": "draw_path", "d": "M x y C ...", "style": { "fill": "none", "stroke": "#hex", "strokeWidth": 1-3 } }

9. show_equation: Display a math formula
   { "time": N, "type": "show_equation", "latex": "E = mc^2", "position": [x, y], "style": { "fontSize": 18-26, "color": "#hex" } }

10. draw_table: Data comparison table
    { "time": N, "type": "draw_table", "headers": ["Col1", "Col2"], "rows": [["val1", "val2"]], "position": [x, y], "cell_width": 100-200, "cell_height": 30-40 }

11. draw_graph: Bar or line chart
    { "time": N, "type": "draw_graph", "graph_type": "bar|line", "title": "short", "position": [x, y], "size": [w, h], "data": { "values": [N, ...], "labels": ["...", ...] } }

12. draw_coordinate_system: Mathematical coordinate plane with plotted points
    { "time": N, "type": "draw_coordinate_system", "origin": [x, y], "size": [w, h], "x_label": "X axis", "y_label": "Y axis", "plot_points": [[x,y], ...] }

13. draw_object: Pre-built illustrative objects
    { "time": N, "type": "draw_object", "object_type": "cell|network|blockchain|cycle|gear|document|checklist|triangle|leaf|flask|lightbulb|target|book|dialogue|layers|compass", "position": [x, y], "size": [w, h], "label": "short", "annotations": ["label1", "label2"] }

14. draw_physics_shape: Physics diagrams
    { "time": N, "type": "draw_physics_shape", "shape_type": "spring|pendulum|inclined_plane|pulley|free_body|wave|box_on_surface|bottle", "position": [x, y], "size": [w, h], "label": "short", "annotations": ["force1", "force2"] }

15. highlight: Highlight existing text
    { "time": N, "type": "highlight", "target": "text to highlight", "style": { "color": "#hex" } }

16. clear: Erase the board (like a teacher wiping the whiteboard)
    { "time": N, "type": "clear" }

CANVAS: 800 x 480 pixels. Keep all elements within bounds with 30px margins.

TEACHER-LIKE ANIMATION RULES:
- Start with a title/hook at the top (y: 30-50)
- Reveal ONE element at a time with 5-8 second gaps between elements
- Use "clear" between major concept shifts (like erasing the board)
- Maximum 5 elements visible at once before clearing
- Build complexity: simple keyword → explanation → relationship → example
- Every arrow must show a REAL relationship (cause→effect, input→output, before→after)
- Use varied visual types across the timeline — never repeat the same pattern
- Total scenes should be proportional to duration: aim for 1 new element every 8-12 seconds
- Titles at top (y: 30-50), main content in middle (y: 80-380), summary at bottom (y: 400-460)

COLOR PALETTE (use these for visual consistency):
- Primary: #2563eb (blue), #16a34a (green), #d97706 (amber), #7c3aed (purple)
- Accent: #be123c (red), #0891b2 (cyan), #ca8a04 (gold), #0f766e (teal)
- Fills: #eff6ff, #f0fdf4, #fef3c7, #f5f3ff, #fff1f2, #ecfeff
- Text: #1e3a5f (dark blue), #374151 (dark gray), #1f2937 (near black)

RETURN FORMAT:
Return ONLY a JSON array of scene objects. No markdown. No explanation. Just the array.
[
  { "time": 0, "type": "draw_text", ... },
  { "time": 6, "type": "draw_rect", ... },
  ...
]`;

const VISUAL_REFINEMENT_PROMPT = `You are a whiteboard animation quality controller. Review the visual sequence below and IMPROVE it.

CHECK FOR AND FIX:
1. OVERLAP: Elements placed too close together (need 60px+ between elements)
2. PACING: Gaps between elements should be 5-10 seconds (not too fast, not too slow)
3. VARIETY: No two consecutive elements should be the same type
4. CLARITY: Text must be short (3-12 words). Labels must be meaningful.
5. TEACHING FLOW: Does it build understanding progressively? Hook → Concept → Relationship → Example → Summary
6. DENSITY: Maximum 5 elements per page before a "clear". If more, add clear commands.
7. BOUNDS: All elements must fit within 800x480 canvas with 30px margins
8. ARROWS: Every arrow must connect TWO meaningful concepts. No decorative arrows.
9. TIMING: Total timeline must fit within the specified duration.
10. UNIQUENESS: Each page (between clears) must look visually distinct from others.

If the sequence is good (scores 9/10+ on all criteria), return it unchanged.
If it needs fixes, return the IMPROVED version.

Return ONLY the JSON array. No markdown. No explanation.`;

/**
 * AI-driven visual generation: The AI decides what to draw, how, and when.
 * Uses multiple AI requests for quality:
 *   1. Generation pass: AI creates the visual timeline
 *   2. Refinement pass: AI reviews and improves its own output
 */
async function generateContentVisualsAI({ lessonTitle, part, contentIndex, comprehension, continuity, explanationMode = 'full_lesson' }, aiProvider, analysisModel) {
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  const durationSeconds = Number(part.duration_seconds) || 300;
  const field = comprehension?.field || 'general';

  // Build rich context for the AI to make visual decisions
  const visualContext = [
    `LESSON: "${lessonTitle}"`,
    `PART TITLE: "${part.title || 'Untitled'}"`,
    `PART INDEX: ${contentIndex + 1} (of the lesson)`,
    `DURATION: ${durationSeconds} seconds`,
    `FIELD/SUBJECT: ${field}`,
    `EXPLANATION MODE: ${explanationMode}`,
    `SCENE GOAL: ${part.scene_goal || 'Teach the concept clearly'}`,
    `LEARNING OBJECTIVE: ${part.learning_objective || 'Understand the main idea'}`,
    `KEY CONCEPTS: ${(part.key_concepts || []).join(', ')}`,
    part.visual_logic?.length ? `AI VISUAL SUGGESTIONS: ${JSON.stringify(part.visual_logic)}` : '',
    `NARRATION (what the teacher is saying): ${(part.narration || '').slice(0, 2000)}`,
    continuity?.previous ? `PREVIOUS PART: "${continuity.previous}"` : '',
    continuity?.next ? `NEXT PART: "${continuity.next}"` : '',
    comprehension?.teaching_approach ? `TEACHING APPROACH: ${comprehension.teaching_approach}` : '',
  ].filter(Boolean).join('\n');

  const modeGuidance = explanationMode === 'visual_first'
    ? '\nMODE OVERRIDE: VISUAL FIRST — Use MORE visual elements (25-40 scenes). Prioritize diagrams, objects, and graphs over text. Keep text minimal.'
    : explanationMode === 'step_by_step'
      ? '\nMODE OVERRIDE: STEP BY STEP — Number each concept visually. Use frequent clears. Show one step per page.'
      : explanationMode === 'text_focus'
        ? '\nMODE OVERRIDE: TEXT FOCUS — Use callouts and labeled diagrams. Build dense, information-rich pages. Fewer clears.'
        : '';

  // ── Pass 1: AI generates the visual timeline ──
  console.log(`[aiPlanner] Visual Gen Pass 1: AI generating visuals for "${part.title}" (duration=${durationSeconds}s, field=${field})`);
  let scenes = null;

  try {
    const generationPrompt = `${VISUAL_GENERATION_PROMPT}${modeGuidance}

CONTEXT FOR THIS PART:
${visualContext}

Generate the complete visual timeline for this ${durationSeconds}-second part. Aim for ${Math.max(12, Math.min(Math.ceil(durationSeconds / 10), 40))} scenes.
Remember: you are the TEACHER. Decide the best way to visualize this concept. Choose the right drawing types for the subject matter. Make it feel like a real classroom whiteboard.`;

    const result = await callAIRace(generationPrompt, limits.contentTok, limits.contentTimeout, aiProvider, analysisModel);
    if (Array.isArray(result) && result.length > 0) {
      scenes = result;
      console.log(`[aiPlanner] Visual Gen Pass 1 OK: ${scenes.length} scenes generated`);
    } else if (result?.visual_sequence && Array.isArray(result.visual_sequence)) {
      scenes = result.visual_sequence;
      console.log(`[aiPlanner] Visual Gen Pass 1 OK (wrapped): ${scenes.length} scenes`);
    }
  } catch (error) {
    console.warn(`[aiPlanner] Visual Gen Pass 1 failed: ${error.message}`);
  }

  // ── Pass 2: AI refines the visual timeline ──
  if (scenes?.length) {
    try {
      console.log(`[aiPlanner] Visual Gen Pass 2: AI refining ${scenes.length} scenes...`);
      const refinementPrompt = `${VISUAL_REFINEMENT_PROMPT}

PART CONTEXT:
- Title: "${part.title}"
- Duration: ${durationSeconds} seconds
- Field: ${field}
- Canvas: 800x480 pixels

CURRENT VISUAL SEQUENCE (${scenes.length} scenes):
${JSON.stringify(scenes, null, 1).slice(0, 60000)}

Review and return the improved sequence.`;

      const refined = await callAIRace(refinementPrompt, limits.contentTok, Math.min(limits.contentTimeout, 180_000), aiProvider, analysisModel);
      if (Array.isArray(refined) && refined.length >= scenes.length * 0.7) {
        scenes = refined;
        console.log(`[aiPlanner] Visual Gen Pass 2 OK: refined to ${scenes.length} scenes`);
      }
    } catch (refineErr) {
      console.warn(`[aiPlanner] Visual Gen Pass 2 skipped: ${refineErr.message}`);
    }
  }

  // ── Fallback: If AI fails completely, generate minimal teaching sequence ──
  if (!scenes?.length) {
    console.warn(`[aiPlanner] Visual Gen: AI failed, using minimal fallback for "${part.title}"`);
    scenes = buildMinimalFallbackVisuals(part, durationSeconds);
  }

  // Validate and normalize the AI output
  scenes = validateAIVisualOutput(scenes, durationSeconds);
  return scenes;
}

/**
 * AI-driven quiz visual generation.
 */
async function generateQuizVisualsAI(lessonTitle, part, aiProvider, analysisModel) {
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  const durationSeconds = Number(part.duration_seconds) || 55;

  const quizContext = [
    `LESSON: "${lessonTitle}"`,
    `QUIZ TITLE: "${part.title || 'Knowledge Check'}"`,
    `DURATION: ${durationSeconds} seconds`,
    `QUESTIONS:`,
    ...(part.quiz_questions || []).map((q, i) => `  Q${i + 1} (${q.question_type}): ${q.question_text}${q.options?.choices ? '\n    Options: ' + q.options.choices.join(', ') : ''}`),
  ].join('\n');

  try {
    const prompt = `${VISUAL_GENERATION_PROMPT}

SPECIAL MODE: QUIZ VISUALIZATION
Generate a visual sequence that presents quiz questions on the whiteboard like a teacher would:
- Show each question clearly with its options
- Use draw_rect for multiple choice options (2x2 grid layout)
- Use draw_callout for question text
- Use draw_badge for question numbers
- Use clear between different questions
- Make it interactive and engaging

CONTEXT:
${quizContext}

Generate the visual timeline for this ${durationSeconds}-second quiz.`;

    const result = await callAIRace(prompt, limits.contentTok, Math.min(limits.contentTimeout, 120_000), aiProvider, analysisModel);
    if (Array.isArray(result) && result.length > 0) {
      return validateAIVisualOutput(result, durationSeconds);
    }
  } catch (error) {
    console.warn(`[aiPlanner] Quiz Visual Gen failed: ${error.message}`);
  }

  // Fallback for quiz visuals
  return buildMinimalQuizFallback(lessonTitle, part, durationSeconds);
}

/**
 * Validate and fix AI-generated visual output to ensure it renders correctly.
 */
function validateAIVisualOutput(scenes, durationSeconds) {
  if (!Array.isArray(scenes)) return [];

  const VALID_TYPES = new Set([
    'draw_text', 'draw_rect', 'draw_circle', 'draw_arrow', 'draw_path',
    'draw_badge', 'draw_callout', 'draw_line', 'show_equation',
    'draw_table', 'draw_graph', 'draw_coordinate_system',
    'draw_object', 'draw_physics_shape', 'highlight', 'clear',
  ]);

  // Filter out invalid scenes and normalize
  let validated = scenes
    .filter((s) => s && typeof s === 'object' && VALID_TYPES.has(s.type))
    .map((s) => ({
      ...s,
      time: Math.max(0, Number(s.time) || 0),
    }));

  // Sort by time
  validated.sort((a, b) => a.time - b.time);

  // Enforce density limit: max 5 non-clear elements per page
  const densityLimited = [];
  let pageCount = 0;
  for (const entry of validated) {
    if (entry.type === 'clear') {
      densityLimited.push(entry);
      pageCount = 0;
      continue;
    }
    pageCount++;
    if (pageCount <= 5) {
      densityLimited.push(entry);
    } else if (pageCount === 6) {
      densityLimited.push({ type: 'clear', time: entry.time });
      densityLimited.push(entry);
      pageCount = 1;
    }
  }

  // Clamp positions within canvas bounds
  for (const s of densityLimited) {
    if (s.position) {
      s.position = [
        clamp(Number(s.position[0]) || 0, 30, 770),
        clamp(Number(s.position[1]) || 0, 20, 460),
      ];
    }
    if (s.center) {
      s.center = [
        clamp(Number(s.center[0]) || 0, 60, 740),
        clamp(Number(s.center[1]) || 0, 60, 420),
      ];
    }
    if (s.from && s.to) {
      s.from = [clamp(Number(s.from[0]) || 0, 20, 780), clamp(Number(s.from[1]) || 0, 20, 460)];
      s.to = [clamp(Number(s.to[0]) || 0, 20, 780), clamp(Number(s.to[1]) || 0, 20, 460)];
    }
    if (typeof s.x === 'number') s.x = clamp(s.x, 20, 700);
    if (typeof s.y === 'number') s.y = clamp(s.y, 20, 420);
    // Clamp text content length
    if (s.content && typeof s.content === 'string' && s.type !== 'draw_callout') {
      s.content = s.content.slice(0, 80);
    }
    if (s.label && typeof s.label === 'string') {
      s.label = s.label.slice(0, 60);
    }
  }

  return fitSceneTimeline(densityLimited, durationSeconds);
}

/**
 * Minimal fallback when AI visual generation completely fails.
 * Creates a basic but functional teaching sequence from part metadata.
 */
function buildMinimalFallbackVisuals(part, durationSeconds) {
  const concepts = (part.key_concepts || []).slice(0, 4);
  const title = truncateWords(part.title || 'Key Concepts', 6);
  const scenes = [];
  let t = 0;

  // Title
  scenes.push({ time: t, type: 'draw_text', content: title, position: [400, 38], style: { fontSize: 24, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
  t += 8;

  // Scene goal as callout
  if (part.scene_goal) {
    scenes.push({ time: t, type: 'draw_callout', content: truncateWords(part.scene_goal, 20), position: [100, 80], width: 600, style: { bg: '#eff6ff', stroke: '#2563eb', color: '#1e3a5f' } });
    t += 10;
  }

  // Key concepts as badges + boxes
  const colors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed'];
  const fills = ['#eff6ff', '#f0fdf4', '#fef3c7', '#f5f3ff'];
  for (let i = 0; i < concepts.length; i++) {
    if (i > 0 && i % 2 === 0) {
      scenes.push({ time: t, type: 'clear' });
      t += 6;
      scenes.push({ time: t, type: 'draw_text', content: title, position: [400, 38], style: { fontSize: 22, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } });
      t += 6;
    }
    const y = 140 + (i % 2) * 130;
    scenes.push({ time: t, type: 'draw_badge', content: `${i + 1}`, position: [50, y], style: { bg: colors[i % 4], color: '#fff', fontSize: 15 } });
    t += 4;
    scenes.push({ time: t, type: 'draw_rect', x: 80, y: y + 10, width: 640, height: 80, label: truncateWords(concepts[i], 10), style: { fill: fills[i % 4], stroke: colors[i % 4], strokeWidth: 2, rx: 10 } });
    t += 8;
  }

  return scenes;
}

/**
 * Minimal quiz fallback when AI fails.
 */
function buildMinimalQuizFallback(lessonTitle, part, durationSeconds) {
  const q1 = part.quiz_questions?.[0];
  const options = (q1?.options?.choices || []).slice(0, 4);
  const scenes = [
    { time: 0, type: 'draw_text', content: truncateWords(part.title || 'Knowledge Check', 5), position: [400, 42], style: { fontSize: 24, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' } },
    { time: 4, type: 'draw_badge', content: 'Quiz', position: [42, 24], style: { bg: '#0f766e', color: '#fff', fontSize: 15 } },
    { time: 8, type: 'draw_callout', content: clampText(q1?.question_text || `Which idea best captures ${lessonTitle}?`, 140), position: [110, 96], width: 580, style: { bg: '#eff6ff', stroke: '#60a5fa', color: '#1e3a8a' } },
  ];
  const choicePositions = [[70, 206], [430, 206], [70, 302], [430, 302]];
  const choiceColors = ['#2563eb', '#16a34a', '#d97706', '#7c3aed'];
  for (let i = 0; i < Math.min(options.length, 4); i++) {
    scenes.push({ time: 14 + i * 5, type: 'draw_rect', x: choicePositions[i][0], y: choicePositions[i][1], width: 300, height: 74, label: `${String.fromCharCode(65 + i)}. ${clampText(options[i], 28)}`, style: { fill: '#f8fafc', stroke: choiceColors[i], strokeWidth: 2, rx: 12 } });
  }
  return fitSceneTimeline(scenes, durationSeconds);
}

// Legacy helper kept for backward compat in buildFallbackLesson
function selectPedagogicalStrategy(part, contentIndex, explanationMode) {
  const goalText = normalizePlannerPhrase(`${part.scene_goal || ''} ${part.learning_objective || ''} ${part.title || ''}`);
  const relationships = (Array.isArray(part.visual_logic) ? part.visual_logic : [])
    .map((entry) => normalizePedagogicalRelationship(entry.relationship || entry.type || entry.semantic_role));

  if (relationships.some((relationship) => relationship === 'sequence' || relationship === 'dependency')) {
    return 'detail';
  }

  if (relationships.some((relationship) => relationship === 'comparison' || relationship === 'data')) {
    return contentIndex === 0 ? 'overview' : 'application';
  }

  if (relationships.some((relationship) => relationship === 'example')) {
    return 'application';
  }

  if (/(apply|example|practice|case|scenario|use)/.test(goalText)) {
    return 'application';
  }

  if (/(compare|contrast|difference|hierarchy|structure|define|definition|overview|foundation|introduc)/.test(goalText)) {
    return 'overview';
  }

  if (explanationMode === 'step_by_step') {
    return 'detail';
  }

  if (explanationMode === 'visual_first') {
    return contentIndex === 2 ? 'application' : 'overview';
  }

  if (explanationMode === 'text_focus') {
    return contentIndex === 0 ? 'overview' : 'detail';
  }

  // Dynamic strategy rotation
  const strategies = ['overview', 'detail', 'application'];
  return strategies[contentIndex % strategies.length];
}

// ── AI caller ────────────────────────────────────────────────────────────────

function normalizeProvider(raw) {
  const p = String(raw || '').trim().toLowerCase();
  if (p === 'deepseek') return 'blaze';
  if (p === 'blaze' || p === 'blazeai') return 'blaze';
  return null;
}

/** Resolve the model id for API calls from user selection + provider. */
function resolveModel(aiProvider, analysisModel) {
  const { defaultDeepModel } = getBlazeConfig();
  return resolveBlazeModel(analysisModel, defaultDeepModel);
}

export function resetAICircuit(aiProvider) {
  const key = normalizeProvider(aiProvider) || 'blaze';
  const circuit = circuitState[key] || circuitState.default;
  circuit.openUntil = 0;
  circuit.reason = '';
  aiCircuitOpenUntil = 0;
  aiCircuitReason = '';
}

/** Auth/client-block errors should not trip the cooldown circuit. */
function shouldTripCircuit(error) {
  const msg = String(error?.message || error || '').toLowerCase();
  if (/401|403|unauthorized|unauthenticated|invalid.*key|api key/.test(msg)) return false;
  return true;
}

/** Quick connectivity check — call from GET /upload/test-ai */
export async function testAIConnection(aiProvider, analysisModel) {
  const provider = normalizeProvider(aiProvider) || 'blaze';
  resetAICircuit(provider);
  const model = resolveModel(provider, analysisModel);
  const cfg = getBlazeConfig();
  const endpoint = cfg.chatCompletionsUrl;
  const start = Date.now();

  console.log(`[aiPlanner] testAIConnection: provider=${provider}, model=${model}, endpoint=${endpoint}`);

  try {
    const result = await callAIRace(
      'Reply with only valid JSON, no markdown: {"connected":true,"ping":1}',
      128,
      90_000,
      provider,
      model,
    );
    return {
      ok: true,
      provider,
      model,
      endpoint,
      latencyMs: Date.now() - start,
      sample: result,
      via: lastAiVia || provider,
    };
  } catch (error) {
    return {
      ok: false,
      provider,
      model,
      endpoint,
      latencyMs: Date.now() - start,
      error: error.message,
    };
  }
}

async function callAIRace(prompt, maxTokens, timeoutMs = AI_TIMEOUT_MS, aiProvider = null, analysisModel = null) {
  if (process.env.DISABLE_AI_PLANNER === 'true') {
    throw new Error('AI planner disabled by configuration');
  }

  lastAiVia = null;
  const activeAI = normalizeProvider(aiProvider) || normalizeProvider(process.env.ACTIVE_LLM) || 'blaze';
  const circuit = circuitState[activeAI] || circuitState.default;
  const model = resolveModel(activeAI, analysisModel);
  const hasExplicitModelSelection = Boolean(String(analysisModel || '').trim());

  if (!hasExplicitModelSelection && Date.now() < circuit.openUntil) {
    throw new Error(`AI provider "${activeAI}" cooling down: ${circuit.reason}`);
  }

  // BlazeAI
  const { baseURL, apiKey, defaultModel, defaultDeepModel } = getBlazeConfig();
  if (!apiKey) throw new Error('BLAZE_API_KEY not set');

  // When user chose a model, use ONLY that model. Otherwise race fallbacks.
  const models = analysisModel
    ? [model]
    : [...new Set([
        defaultDeepModel,
        defaultModel,
      ].filter(Boolean))];

  console.log(`[aiPlanner] BlazeAI → ${models.join(' | ')} (max_tokens=${maxTokens}, timeout=${timeoutMs}ms)`);

  try {
    const result = await Promise.any(
      models.map((m) => callOpenAICompatible(baseURL, apiKey, m, prompt, maxTokens, timeoutMs))
    );
    lastAiVia = 'blaze';
    circuit.openUntil = 0;
    circuit.reason = '';
    aiCircuitOpenUntil = 0;
    aiCircuitReason = '';
    return result;
  } catch (error) {
    if (!hasExplicitModelSelection && shouldTripCircuit(error)) {
      const limits = PROVIDER_LIMITS.blaze;
      circuit.openUntil = Date.now() + limits.cooldown;
      circuit.reason = describeAIError(error);
      aiCircuitOpenUntil = circuit.openUntil;
      aiCircuitReason = circuit.reason;
    }
    throw new Error(`All Blaze AI models unavailable: ${describeAIError(error)}`);
  }
}

async function callOpenAICompatible(baseURL, apiKey, model, prompt, maxTokens, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const isDeepSeek = baseURL.includes('deepseek');
  const isThinkingModel = model.includes('thinking') || model.includes('reasoner');

  const systemPrompt = isDeepSeek
    ? `You are an expert curriculum designer and professional teacher producing accurate educational content.

ABSOLUTE RULES:
1. ACCURACY: Only use facts, definitions, and examples from the source material. NEVER invent information.
2. NO REPETITION: Never repeat the same sentence or idea twice. Every sentence must be unique.
3. VARIED LANGUAGE: Use diverse vocabulary. Do not reuse the same descriptive word more than twice.
4. COMPLETENESS: Cover every concept from the source thoroughly with specific terms and definitions.
5. PROFESSIONAL TONE: Write like a university lecturer — clear, authoritative, well-structured.
6. GROUNDED: If unsure about a fact, omit it. Only state what the source explicitly says.
7. Return raw valid JSON only. No markdown fences, no explanation outside the JSON.`
    : `You are a meticulous professional teacher AI. Follow these rules strictly:
1. Only use information from the provided source material — never invent facts.
2. Never repeat sentences, phrases, or ideas. Each sentence must convey a unique point.
3. Use varied vocabulary throughout — no repetitive wording.
4. Write in clear, professional academic language.
5. Return raw valid JSON only. No markdown. No explanation. No preamble.`;

  // Use higher temperature and token budget for thinking models to encourage deeper reasoning
  const temperature = isThinkingModel ? 0.7 : (isDeepSeek ? 0.5 : 0.4);
  let tokenBudget = maxTokens;
  if (isThinkingModel) {
    // DeepSeek: no practical output cap from our side — use full requested budget
    tokenBudget = isDeepSeek ? Math.round(maxTokens * 1.5) : Math.min(maxTokens * 1.5, 128_000);
  }

  const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
  console.log(`[aiPlanner] -> POST ${url} model=${model} max_tokens=${tokenBudget} promptLen=${prompt.length}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: tokenBudget,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[aiPlanner] API error ${response.status} from ${url}: ${errText.slice(0, 300)}`);
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const parsed = parseJSON(data.choices?.[0]?.message?.content);
    console.log(`[aiPlanner] <<< OK ${model} finish=${data.choices?.[0]?.finish_reason} usage=${JSON.stringify(data.usage || {})}`);
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

// ── Text utilities ───────────────────────────────────────────────────────────

function normalizeText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/\t/g, ' ')
    .replace(/^[=\-*_#]{3,}[\s=\-*_#]*$/gm, '')
    .replace(/[=\-_]{4,}/g, ' ')
    .replace(/^-?\s*\d+\s*-?\s*$/gm, '')
    .replace(/^page\s+\d+(?:\s+of\s+\d+)?\s*$/gim, '')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractParagraphs(text) {
  const rawParagraphs = String(text || '')
    .replace(/\r/g, '')
    .split(/\n\n+/)
    .map((p) => normalizeText(p.replace(/\n+/g, ' ')))
    .filter(Boolean);

  const paragraphs = [];

  for (const paragraph of rawParagraphs) {
    if (shouldIgnoreParagraph(paragraph)) continue;
    if (/^[-=_]{3,}$/.test(paragraph.replace(/\s/g, ''))) continue;
    if (paragraph.length > 20) paragraphs.push(paragraph);
  }

  if (paragraphs.length) return paragraphs;

  const sentences = extractSentences(text);
  if (!sentences.length) return [normalizeText(text)];

  const grouped = [];
  for (let i = 0; i < sentences.length; i += 2) {
    grouped.push(sentences.slice(i, i + 2).join(' '));
  }
  return grouped;
}

function extractSentences(text) {
  const matches = normalizeText(text).match(/[^.!?\n]{18,}[.!?]?/g) || [];
  return matches
    .map((s) => normalizeSentence(s))
    .filter((s) => {
      if (s.length <= 20) return false;
      const words = s.split(/\s+/).filter(Boolean);
      if (words.length < 7) return false;
      const capsCount = words.filter((w) => /^[A-Z][A-Z0-9':\-]+$/.test(w)).length;
      if (capsCount / words.length >= 0.5) return false;
      return true;
    });
}

function extractKeyConcepts(text, preferred = [], limit = 4) {
  const seen = new Set();
  const concepts = [];
  const normalized = normalizeText(text);

  const pushConcept = (value) => {
    const concept = normalizeConcept(value);
    if (!concept) return;
    if (concept.length < 3 || concept.length > 50) return;
    if (isPlannerMetaConcept(concept)) return;
    const key = concept.toLowerCase();
    if (seen.has(key)) return;
    if (STOPWORDS.has(key)) return;
    if (WEAK_CONCEPTS.has(key)) return;
    seen.add(key);
    concepts.push(concept);
  };

  preferred.forEach(pushConcept);

  // Technical terms: camelCase/PascalCase words (e.g. "DevOps", "GitHub", "MongoDB")
  const camelCase = normalized.match(/\b[A-Z][a-z]+[A-Z][a-z]+\b/g) || [];
  camelCase.forEach(pushConcept);
  // Short acronyms with slashes (e.g. "CI/CD", "TCP/IP")
  const acronyms = normalized.match(/\b[A-Z]{2,5}\/[A-Z]{2,5}\b/g) || [];
  acronyms.forEach(pushConcept);

  // Multi-word Title Case phrases — count occurrences and prioritize frequent ones
  const phraseMatches = normalized.match(/\b[A-Z][a-z][A-Za-z0-9-]*(?:\s+[A-Z][a-z][A-Za-z0-9-]*){1,3}\b/g) || [];
  const phraseCounts = new Map();
  for (const p of phraseMatches) {
    const key = p.toLowerCase();
    phraseCounts.set(key, { phrase: p, count: (phraseCounts.get(key)?.count || 0) + 1 });
  }
  [...phraseCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .forEach(({ phrase }) => pushConcept(phrase));

  // Frequency-based: most repeated meaningful words
  const counts = new Map();
  normalized.toLowerCase().match(/[a-z][a-z-]{3,}/g)?.forEach((word) => {
    if (STOPWORDS.has(word)) return;
    if (WEAK_CONCEPTS.has(word)) return;
    counts.set(word, (counts.get(word) || 0) + 1);
  });

  [...counts.entries()]
    .filter(([word, count]) => count >= 3 && word.length >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([word]) => pushConcept(toTitleCase(word)));

  return concepts.slice(0, limit);
}

function chunkLargeDocument(text, chunkSize = 60_000, overlapSize = 5_000) {
  if (text.length <= chunkSize) return [text];
  const chunks = [];
  const paragraphs = extractParagraphs(text);
  let currentChunk = [];
  let currentSize = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (currentSize + para.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      const overlapParas = [];
      let overlapAccum = 0;
      for (let j = currentChunk.length - 1; j >= 0 && overlapAccum < overlapSize; j--) {
        overlapParas.unshift(currentChunk[j]);
        overlapAccum += currentChunk[j].length;
      }
      currentChunk = overlapParas;
      currentSize = overlapAccum;
    }
    currentChunk.push(para);
    currentSize += para.length;
  }
  if (currentChunk.length > 0) chunks.push(currentChunk.join('\n\n'));
  console.log(`[aiPlanner] Split document into ${chunks.length} chunks (avg ${Math.round(text.length / chunks.length)} chars each)`);
  return chunks;
}

// ── Heading/paragraph utilities ──────────────────────────────────────────────

function isHeadingParagraph(paragraph) {
  const text = normalizeText(paragraph);
  if (!text || /[.!?]$/.test(text)) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 12) return false;
  if (text.length > 120) return false;
  if (/^[-=_]{3,}$/.test(text.replace(/\s/g, ''))) return true;
  if (/^chapter\s+\d+/i.test(text) && words.length <= 12) return true;
  if (/^section\s+\d+/i.test(text) && words.length <= 10) return true;
  return false;
}

function isIgnoredSectionHeading(text) {
  const normalized = normalizeText(text).replace(/[.:]+$/, '');
  return IGNORED_SECTION_HEADING_PATTERNS.some((p) => p.test(normalized));
}

function shouldIgnoreParagraph(paragraph) {
  const text = normalizeText(paragraph);
  if (!text) return true;
  if (isIgnoredSectionHeading(text)) return true;
  if (/^(copyright|all rights reserved)\b/i.test(text)) return true;
  if (/^page\s+\d+\b/i.test(text)) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/\bdoi\.org\//i.test(text)) return true;
  if (/^\[\d+\]/.test(text)) return true;
  if (/^[IVXLCDM]+$/.test(text.trim()) && text.trim().length <= 6) return true;
  // Filter mostly-separator lines
  const stripped = text.replace(/[=\-_*#\s]/g, '');
  if (stripped.length < text.length * 0.3) return true;
  return false;
}

function deriveLessonTitle(text, index) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const candidates = lines.filter((l) => l.length >= 12 && l.length <= 80 && !/[.!?]$/.test(l));
  const heading = candidates.find((l) => !/^[A-Z0-9\s_-]+$/.test(l)) ?? candidates[0];
  if (heading) return makeReadableTitle(heading, text);

  const sentence = extractSentences(text)[0];
  if (sentence) return makeReadableTitle(sentence, text);

  const concepts = extractKeyConcepts(text, [], 2);
  if (concepts.length) return concepts.join(' and ');
  return `Lesson ${index}`;
}

// ── String utilities ─────────────────────────────────────────────────────────

function scene(time, type, payload) {
  return { time, type, ...payload };
}

function fitSceneTimeline(scenes, durationSeconds) {
  const safeScenes = Array.isArray(scenes) ? scenes : [];
  if (!safeScenes.length) return [];

  const targetEnd = Math.max(12, Math.round(durationSeconds) - 4);

  // Strategy: teacher-like pacing — each element must be visible long enough to absorb
  // A real teacher writes one thing, pauses 5-8 seconds to let the student read, then continues
  const MIN_GAP = 5;           // minimum seconds between any two scenes (teacher pause)
  const CLEAR_PAUSE = 6;      // seconds to pause BEFORE a clear (let student absorb final state)
  const POST_CLEAR_GAP = 3;   // gap before first element after clear (fresh board moment)

  // Count clears to budget time
  const clearCount = safeScenes.filter((s) => s.type === 'clear').length;
  const nonClearCount = safeScenes.length - clearCount;

  // Budget: total time minus clear pauses = time available for content gaps
  const clearBudget = clearCount * (CLEAR_PAUSE + POST_CLEAR_GAP);
  const availableTime = Math.max(targetEnd - clearBudget, nonClearCount * MIN_GAP);
  const contentGap = Math.max(MIN_GAP, availableTime / Math.max(nonClearCount - 1, 1));

  // If we would overshoot with ideal spacing, cap number of visible scenes
  const idealTotalTime = nonClearCount * contentGap + clearBudget;
  const needsTruncation = idealTotalTime > targetEnd * 1.2;

  // Assign times sequentially
  let t = 0;
  const result = safeScenes.map((entry, index) => {
    if (index === 0) {
      t = 0;
      return { ...entry, time: 0 };
    }

    const prev = safeScenes[index - 1];
    const isClear = entry.type === 'clear';
    const afterClear = prev.type === 'clear';

    if (isClear) {
      t += CLEAR_PAUSE;
    } else if (afterClear) {
      t += POST_CLEAR_GAP;
    } else {
      t += needsTruncation ? MIN_GAP : contentGap;
    }

    return { ...entry, time: Math.round(t * 10) / 10 };
  });

  // Scale to fit within target duration while preserving relative gaps
  const lastAssigned = result[result.length - 1].time;
  if (lastAssigned > 0 && lastAssigned > targetEnd) {
    const scale = targetEnd / lastAssigned;
    // Only scale if it doesn't compress below MIN_GAP
    const minScaledGap = MIN_GAP * scale;
    if (minScaledGap >= 3) {
      for (let i = 1; i < result.length; i++) {
        result[i] = { ...result[i], time: Math.round(result[i].time * scale * 10) / 10 };
      }
    } else {
      // Truncate scenes that don't fit rather than compressing to unreadable pace
      const maxScenes = Math.floor(targetEnd / MIN_GAP) + clearCount;
      if (result.length > maxScenes) {
        result.length = maxScenes;
      }
      // Re-assign times for truncated list
      let rt = 0;
      for (let i = 0; i < result.length; i++) {
        if (i === 0) { result[i] = { ...result[i], time: 0 }; continue; }
        const prevEntry = result[i - 1];
        if (result[i].type === 'clear') rt += CLEAR_PAUSE;
        else if (prevEntry.type === 'clear') rt += POST_CLEAR_GAP;
        else rt += MIN_GAP;
        rt = Math.min(rt, targetEnd);
        result[i] = { ...result[i], time: Math.round(rt * 10) / 10 };
      }
    }
  }

  return result;
}

function normalizeSentence(text) {
  const sentence = collapseRepeatedWordRuns(normalizeText(text)).replace(/^[-:;,.\s]+|[-:;,.\s]+$/g, '');
  if (!sentence) return '';
  return /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
}

function normalizeConcept(value) {
  const concept = normalizeText(String(value || '').replace(/[\[\]{}()]/g, '').replace(/["""]/g, ''));
  if (!concept) return '';
  if (isIgnoredSectionHeading(concept)) return '';
  if (isPlannerMetaConcept(concept)) return '';

  const cleaned = stripTopicRequestLead(concept)
    .replace(/^(this|that|these|those|it|you|your|we|our)\b[:,-]?\s*/i, '')
    .replace(/^(introduce|introducing|define|defining|review|reviewing|apply|applying|cover|covering|focus(?:ing)?\s+on|work(?:ing)?\s+through)\s+/i, '')
    .replace(/^option\s+\w+\s+is\s+/i, '')
    .replace(/^[0-9]+[.)-]\s*/, '')
    .trim();

  if (!cleaned) return '';
  if (isPlannerMetaConcept(cleaned)) return '';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.every((w) => WEAK_CONCEPTS.has(w.toLowerCase()))) return '';
  if (containsFiniteVerb(cleaned) && words.length > 3) return '';
  if (words.length > 5) return '';
  if (words[0] && WEAK_CONCEPTS.has(words[0].toLowerCase())) return '';

  const meaningful = words.filter((w) => !STOPWORDS.has(w.toLowerCase()));
  if (!meaningful.length) return '';
  if (meaningful.every((w) => WEAK_CONCEPTS.has(w.toLowerCase()))) return '';

  return meaningful.map((w) => {
    if (/^[A-Z0-9-]+$/.test(w)) return w;
    if (/^[A-Z][a-z]+[A-Z]/.test(w)) return w;
    if (/\//.test(w)) return w;
    return toTitleCase(w.toLowerCase());
  }).join(' ');
}

function toTitleCase(word) {
  return word.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('-');
}

function truncateWords(text, maxWords) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  const slice = words.slice(0, maxWords);
  const last = slice[slice.length - 1];
  if (/^(the|a|an|of|in|to|and|or|for|is|on|at|by|with|as|via|from|into|through)$/i.test(last)) slice.pop();
  return slice.join(' ');
}

function clampText(text, maxLength) {
  const normalized = normalizeText(text);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trim()}...`;
}

function coreTopic(title) {
  return clampText(
    normalizeText(title)
      .replace(/^From\s+.+?\s+to\s+/i, '')
      .replace(/^Foundation of\s+/i, '')
      .replace(/^How\s+/i, '')
      .replace(/^Applying\s+/i, '')
      .replace(/\s+Works$/i, '')
      .replace(/^Understanding\s+/i, '')
      .trim(),
    50,
  ) || title;
}

function makeReadableTitle(candidate, fallbackText = '') {
  const normalized = normalizeText(candidate).replace(/[.!?]+$/, '');
  if (!normalized) return '';

  if (isIgnoredSectionHeading(normalized) || containsFiniteVerb(normalized)) {
    const concept = extractKeyConcepts(fallbackText || normalized, [], 2).join(' ');
    if (concept) return clampText(concept, 72);
  }

  const filterTitleStops = (str) =>
    str.split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase())).join(' ').trim();

  const beforeIs = normalized.split(/\bis\b/i)[0]?.trim();
  if (beforeIs && beforeIs.split(/\s+/).length >= 1 && beforeIs.split(/\s+/).length <= 6) {
    const filtered = filterTitleStops(beforeIs);
    return clampText(filtered || beforeIs, 72);
  }

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length > 8) {
    const concept = extractKeyConcepts(fallbackText || normalized, [words.slice(0, 2).join(' ')], 1)[0];
    if (concept) return clampText(concept, 72);
    return clampText(filterTitleStops(words.slice(0, 6).join(' ')), 72);
  }

  const filtered = filterTitleStops(normalized);
  return clampText(filtered || normalized, 72);
}

function buildQuizChoices(lessonTitle, concepts) {
  const focus = concepts[0] || coreTopic(lessonTitle);
  const others = [
    concepts[1],
    concepts[2],
    `${coreTopic(lessonTitle)} details`,
    'An unrelated example',
  ].filter(Boolean);
  const choices = [focus, ...others].slice(0, 4);
  while (choices.length < 4) choices.push(`Option ${choices.length + 1}`);
  return [...new Set(choices)].slice(0, 4);
}

function gatherConcepts(parts) {
  return [...new Set(
    (parts || []).flatMap((p) => p.key_concepts || []).filter(Boolean)
  )].slice(0, 8);
}

function assembleNarration(chunks) {
  const unique = [];
  const seenExact = new Set();
  const seenPhrases = new Set();
  for (const rawChunk of chunks) {
    const chunk = normalizeSentence(rawChunk);
    if (!chunk) continue;
    const key = chunk.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (seenExact.has(key)) continue;
    // Near-duplicate check: skip if the first 8 words already appeared
    const firstWords = key.split(/\s+/).slice(0, 8).join(' ');
    if (firstWords.length > 20 && seenPhrases.has(firstWords)) continue;
    seenExact.add(key);
    seenPhrases.add(firstWords);
    unique.push(chunk);
  }

  let text = '';
  for (const chunk of unique) {
    const candidate = `${text} ${chunk}`.trim();
    if (candidate.length > 5000) break;
    text = candidate;
  }

  return collapseRepeatedWordRuns(text);
}

function containsFiniteVerb(text) {
  return /\b(is|are|was|were|will|want|wants|can|should|must|have|has|does|do)\b/i.test(text);
}

function detectField(text) {
  const n = text.toLowerCase();
  const fields = {
    programming: /\b(algorithm|code|programming|software|data structure|array|variable|class|object|database|api|compiler|syntax|devops|docker|kubernetes|deployment|server|backend|frontend|pipeline|git|linux|nginx|blockchain|validator|ledger|consensus|distributed|transaction|protocol|cache|service|client|router)\b/g,
    mathematics: /\b(theorem|proof|equation|algebra|geometry|calculus|trigonometry|matrix|vector|integral|derivative|polynomial|mathematical)\b/g,
    biology: /\b(biology|cell|mitosis|meiosis|chromosome|chromatid|spindle|dna|rna|gene|protein|enzyme|organelle|nucleus|membrane|chloroplast|photosynthesis|tissue|microtubule)\b/g,
    medical: /\b(anatomy|medical|disease|patient|surgery|diagnosis|symptom|treatment|organ|cell|tissue|blood|heart|brain|muscle|bone|nerve|clinical)\b/g,
    architecture: /\b(architect|building|construction|floor plan|elevation|beam|column|blueprint|urban|spatial|structural)\b/g,
    science: /\b(physics|chemistry|molecule|atom|force|energy|velocity|acceleration|reaction|element|compound|quantum|particle|wave|water cycle|evaporation|condensation|precipitation|runoff|collection|infiltration|transpiration|climate|weather|ecosystem)\b/g,
    history: /\b(history|historical|civilization|war|empire|revolution|society|culture|politics|economy|nation|century|era|period)\b/g,
    business: /\b(revenue|profit|market|strategy|stakeholder|investment|shareholder|quarterly|fiscal|budget|growth|kpi|roi)\b/g,
    economics: /\b(economics|supply|demand|equilibrium|price|shortage|surplus|elasticity|inflation|consumer|producer|market structure|opportunity cost|marginal|utility)\b/g,
  };

  let bestField = 'general';
  let bestCount = 0;
  for (const [field, regex] of Object.entries(fields)) {
    const matches = n.match(regex);
    const count = matches ? matches.length : 0;
    if (count > bestCount) {
      bestCount = count;
      bestField = field;
    }
  }
  return bestField;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function describeAIError(error) {
  if (error?.errors?.length) {
    return error.errors.map((e) => e?.message || String(e)).join('; ');
  }
  return error?.message || 'unknown AI error';
}

function parseJSON(raw) {
  if (!raw) throw new Error('Empty response');
  let cleaned = String(raw)
    .replace(/<think>[\s\S]*?<\/redacted_thinking>/gi, '')
    .replace(/[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error(`Invalid JSON in model response: ${cleaned.slice(0, 120)}`);
  }
}
