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

import 'dotenv/config';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const dagre = _require('@dagrejs/dagre');
import { getBlazeConfig, resolveBlazeModel } from './blazeConfig.js';
import { getBlazeAPIConfig, buildBlazeAPIModelChain } from './blazeapiConfig.js';
import { getOpenRouterConfig, OPENROUTER_DEFAULT_MODEL, resolveOpenRouterModel } from './openrouterConfig.js';
import { buildWhiteboardForPart, assessLessonVisuals, assessPartVisuals } from './whiteboard/index.js';
import { COMPREHENSION_PROMPT, DECOMPOSITION_PROMPT, REFINEMENT_PROMPT, TEACHING_PROMPT, TOPIC_SCAFFOLD_PROMPT, VISUAL_COMPOSITION_PROMPT, TUTOR_PHILOSOPHY } from './prompts/index.js';
import { validateBoardScenes, cleanSay } from './whiteboard/validator.js';

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
const IS_VERCEL_RUNTIME = process.env.VERCEL === '1';
const VERCEL_MAX_DURATION_MS = Math.max(60_000, Number(process.env.VERCEL_MAX_DURATION_MS ?? 300_000));
const VERCEL_AI_STEP_TIMEOUT_MS = Math.max(
  30_000,
  Number(process.env.VERCEL_AI_STEP_TIMEOUT_MS ?? Math.min(150_000, VERCEL_MAX_DURATION_MS - 90_000)),
);

function runtimeBoundTimeout(ms) {
  const value = Math.max(30_000, Number(ms) || 30_000);
  return IS_VERCEL_RUNTIME ? Math.min(value, VERCEL_AI_STEP_TIMEOUT_MS) : value;
}

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
    analysisTimeout: runtimeBoundTimeout(Number(process.env.DEEPSEEK_ANALYSIS_TIMEOUT ?? 900_000)),
    contentTimeout: runtimeBoundTimeout(Number(process.env.DEEPSEEK_CONTENT_TIMEOUT  ?? 1_800_000)),
    cooldown:       Number(process.env.DEEPSEEK_COOLDOWN_MS      ?? 30_000),
  },
  blaze: {
    contextTokens:  128_000,
    maxInputChars:  200_000,
    analysisTok:    Number(process.env.BLAZE_ANALYSIS_TOKENS  ?? 32_000),
    contentTok:     Number(process.env.BLAZE_CONTENT_TOKENS   ?? 64_000),
    analysisTimeout: runtimeBoundTimeout(Number(process.env.AI_TIMEOUT_MS ?? 600_000)),
    contentTimeout: runtimeBoundTimeout(Number(process.env.AI_TIMEOUT_MS ?? 600_000) + 300_000),
    cooldown:       Number(process.env.AI_COOLDOWN_MS         ?? 120_000),
  },
  blazeapi: {
    contextTokens:  1_000_000,
    maxInputChars:  200_000,
    analysisTok:    Number(process.env.BLAZEAPI_ANALYSIS_TOKENS  ?? 32_000),
    contentTok:     Number(process.env.BLAZEAPI_CONTENT_TOKENS   ?? 64_000),
    analysisTimeout: runtimeBoundTimeout(Number(process.env.AI_TIMEOUT_MS ?? 600_000)),
    contentTimeout: runtimeBoundTimeout(Number(process.env.AI_TIMEOUT_MS ?? 600_000) + 300_000),
    cooldown:       Number(process.env.AI_COOLDOWN_MS            ?? 120_000),
  },
  openrouter: {
    contextTokens:  128_000,
    maxInputChars:  80_000,
    analysisTok:    Number(process.env.OPENROUTER_ANALYSIS_TOKENS ?? 8_000),
    contentTok:     Number(process.env.OPENROUTER_CONTENT_TOKENS  ?? 16_000),
    analysisTimeout: runtimeBoundTimeout(Number(process.env.AI_TIMEOUT_MS ?? 600_000)),
    contentTimeout: runtimeBoundTimeout(Number(process.env.AI_TIMEOUT_MS ?? 600_000) + 300_000),
    cooldown:       Number(process.env.AI_COOLDOWN_MS ?? 120_000),
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

const AI_TIMEOUT_MS = runtimeBoundTimeout(Number(process.env.AI_TIMEOUT_MS ?? 600_000));
const AI_COOLDOWN_MS = Number(process.env.AI_COOLDOWN_MS ?? 120_000);

export function shouldUseLocalPlanning(aiProvider = null) {
  const provider = normalizeProvider(aiProvider) || normalizeProvider(process.env.ACTIVE_LLM) || 'openrouter';
  if (provider === 'openrouter') {
    return !getOpenRouterConfig().apiKey;
  }
  if (provider === 'blazeapi') {
    return !getBlazeAPIConfig().apiKey;
  }
  if (provider === 'blaze') {
    return !getBlazeConfig().apiKey;
  }
  if (provider === 'fastapi') {
    return !process.env.FASTAPI_BASE_URL && !process.env.FASTAPI_API_KEY;
  }
  return false;
}

export function shouldUseTopicLocalOnlyFallback(lessonSpec, aiProvider = null) {
  if (!lessonSpec || lessonSpec.source_mode !== 'topic') return false;
  const provider = normalizeProvider(aiProvider) || normalizeProvider(process.env.ACTIVE_LLM) || 'openrouter';
  const topicRequest = normalizeText(lessonSpec.topic_request || lessonSpec.section_text || '');
  const maxChars = Math.max(80, Number(process.env.TOPIC_LOCAL_ONLY_MAX_CHARS ?? 220));
  const shortTopic = topicRequest.length > 0 && topicRequest.length <= maxChars;
  const explicitFallback = String(process.env.TOPIC_LOCAL_ONLY ?? '').toLowerCase() === 'true';

  return explicitFallback && shortTopic && shouldUseLocalPlanning(provider);
}

const circuitState = {
  blaze:     { openUntil: 0, reason: '' },
  blazeapi:  { openUntil: 0, reason: '' },
  fastapi:   { openUntil: 0, reason: '' },
  openrouter: { openUntil: 0, reason: '' },
  default:   { openUntil: 0, reason: '' },
};
let aiCircuitOpenUntil = 0;
let aiCircuitReason = '';
/** Records which backend path served the most recent AI request. */
let lastAiVia = null;
/** Cached working model for each provider — we try it first next time. */
let workingBlazeModel = null;
let workingBlazeAPIModel = null;
let workingOpenRouterModel = null;

// =============================================================================
// PHASE 1 PROMPT: Deep document comprehension
// The AI must read the FULL document and produce a structured understanding
// =============================================================================


// =============================================================================
// PHASE 2 PROMPT: Lesson decomposition based on comprehension
// =============================================================================


// =============================================================================
// PHASE 3B PROMPT: Refinement pass — AI reviews its own output and improves it
// =============================================================================


// PHASE 3 PROMPT: Content + Visual generation for each lesson
// This is where the actual teaching happens
// =============================================================================


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

// Subject-aware "visual playbook": a light prompt-level bias that nudges the
// model toward the board_scene intents (and named figures) that teach a given
// field best. The engine stays intent-driven — this only tilts the choice so a
// biology lesson reaches for cycles/diagrams and a history lesson for timelines
// and causal chains, instead of every subject defaulting to bullet lists.
export function buildVisualPlaybook(field) {
  const f = String(field || 'general').toLowerCase();
  const PLAYBOOKS = {
    biology: 'BIOLOGY VISUAL PLAYBOOK: Prefer "map" (labeled diagrams — use a "diagram" figure such as cell, dna, neuron when relevant + "labels" for parts), "cycle" (photosynthesis, Krebs, water cycle, life cycles), and "process" for sequential mechanisms. Use "compare" for structure/function contrasts. Anchor each board on a drawn structure, not a bullet list.',
    medical: 'MEDICAL VISUAL PLAYBOOK: Prefer "map" (labeled anatomy diagrams with "labels"), "process" (pathophysiology / clinical pathways), "cause" (etiology → effect), and "cycle" for recurring physiological loops. Show the body/structure, then label it.',
    science: 'SCIENCE VISUAL PLAYBOOK: Prefer "map" (labeled figures via "diagram": atom, wave, field, magnet, gear, battery), "process" (reactions, experiments), "formula" (laws/equations), and "data" (plotted relationships). Draw the phenomenon, not just words about it.',
    mathematics: 'MATH VISUAL PLAYBOOK: Prefer "formula" (equation with worked steps), "data" (graphs / plotted functions / number lines / vectors), and "process" (solution procedures). Every abstract step should be anchored to a drawn equation or plot.',
    economics: 'ECONOMICS VISUAL PLAYBOOK: Prefer "data" for market graphs (supply & demand axes, equilibrium point, curve shifts), "process"/"cause" for circular-flow and cause→effect (e.g. price→quantity), and "compare" for surplus vs shortage. Anchor on axes + curves, label equilibrium.',
    business: 'BUSINESS VISUAL PLAYBOOK: Prefer "process" (workflows / funnels), "hierarchy" (org / market structure), "compare" (options, pros/cons), and "data" (KPIs, trends). Show the structure or flow, not paragraphs.',
    history: 'HISTORY VISUAL PLAYBOOK: Prefer "timeline" (eras, dated events in order), "cause" (causal chains: event → consequence → consequence with a highlighted outcome), and "compare" (before vs after, two regimes). Put events on a spine, link causes with arrows.',
    programming: 'PROGRAMMING/CS VISUAL PLAYBOOK: Prefer "process" (flowcharts with a decision step, request lifecycles, algorithms), "hierarchy"/"map" (system architecture: client → API → service → database as boxes + arrows), and "cycle" (state machines, event loops). Draw the components and the data movement between them.',
    architecture: 'ARCHITECTURE VISUAL PLAYBOOK: Prefer "map" (labeled structural diagrams), "hierarchy" (load paths / component breakdown), and "process" (construction sequence). Draw the structure and label its parts.',
    language: 'LANGUAGE VISUAL PLAYBOOK: Prefer "define" (term + meaning + example), "compare" (contrasting forms/rules), and "process" (conjugation / sentence-building steps). Anchor each rule with a concrete worked example.',
    general: 'GENERAL VISUAL PLAYBOOK: Prefer DIAGRAMS over bullet lists — "cluster"/"cause" for an idea that branches into outcomes (distributed-arrow flow with icon nodes), "map" for a central concept with related parts (hub-and-spoke or concept+notes panel), and "process" for steps/decisions (icon pipeline or yes/no decision flow). Name each node with a concrete noun ("User", "Data", "Goal", "Risk") so a meaningful icon is drawn. Anchor every board on a relationship between labeled nodes, never plain text.',
  };
  const playbook = PLAYBOOKS[f] || PLAYBOOKS[
    /bio|cell|gene|organ|species/.test(f) ? 'biology'
    : /econ|market|trade|finance/.test(f) ? 'economics'
    : /hist|war|era|civilization/.test(f) ? 'history'
    : /program|software|comput|code|cs/.test(f) ? 'programming'
    : /math|algebra|calculus|geometry/.test(f) ? 'mathematics'
    : 'science'
  ];
  if (!playbook) return '';
  return `\n\nSUBJECT-AWARE VISUALS (field: ${f}):\n${playbook}\nThis is a bias, not a restriction — still choose the intent that genuinely teaches each beat best, and vary intents across the lesson.`;
}


function stripTopicRequestLead(text) {
  return normalizeText(text)
    .replace(/^(?:please\s+)?(?:create|generate|make|build)\s+(?:a\s+)?(?:personalized\s+)?(?:complete\s+)?(?:ai\s+)?lesson\s+(?:about|on|for)\s+/i, '')
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

const INSTRUCTIONAL_META_PREFIX_RE = /^(the learner should be able to|the learner will|the learner can|learners? will (?:understand|learn|be able to)|learners should(?: practice)?|the explanation should|a good explanation of|a complete explanation of|the lesson should|by the end of this lesson|specifically[, ]+they should be able to|according to the source material|to make that visible|on the board, this means|this stage matters because|this matters because|connect .* so the learner|link .* to .* to show|.* should be (?:explained|taught|shown)|.* should (?:first )?be understood)/;
const INSTRUCTIONAL_META_INLINE_RE = /\b(the learner should|the learner will|learners will|the explanation should|according to the source material|should be explained|should be taught|should be shown|not in isolation|move from definition to mechanism|one coherent explanation|clear learnable sequence|begins with the core idea|breaks the topic into its main components|finishes with application and review|ends with application or outcome reading|becomes clear by following its concrete parts|show the basic meaning, the mechanism|central concept in this lesson|supports the rest of the topic)\b/;
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
  const rootLower = root.toLowerCase();

  if (/\b(web|browser|http|https|request[-\s]?response|request|response|server|client)\b/.test(rootLower)) {
    return ['Browser', 'HTTP Request', 'Server', 'HTTP Response', 'Page Update'];
  }

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

  if (field === 'programming' || /\b(api|service|server|database|algorithm|workflow|pipeline|client|cache|network|state|deployment|browser|http|https|web|request|response)\b/.test(conceptCorpus) || (isRootConcept && /\b(api|service|server|database|algorithm|workflow|pipeline|client|cache|network|state|deployment|browser|http|https|web|request|response)\b/.test(rootCorpus))) {
    if (/\b(api|service|server|database|client|cache|node|validator|browser)\b/.test(conceptCorpus)) return 'system_component';
    if (/\b(protocol|workflow|pipeline|deployment|request|response|state|algorithm|http|https|web)\b/.test(conceptCorpus)) return 'system_process';
    return 'system_component';
  }

  if (/\b(step|phase|stage|cycle|workflow|sequence|model)\b/.test(conceptCorpus)) return 'process_stage';
  return 'general_component';
}

// Pick a phrasing from a list by index so consecutive concepts never get the
// identical sentence (the old fallback reused one template per role, so six
// concepts read as the same line with the name swapped — meaningless scaffolding).
function pickVariant(list, index) {
  if (!list.length) return '';
  return list[((index % list.length) + list.length) % list.length];
}

// Topic-mode facet concepts are title-prefixed (e.g. "The Water Cycle Structures")
// so they read as headings, but repeating that full title in every sentence is the
// "caption reads like scaffolding, super duplicated" defect. For PROSE use the short
// facet word ("Structures"); fall back to the full concept if stripping leaves nothing.
function shortConceptLabel(concept, rootConcept) {
  const full = String(concept || '').trim();
  const root = String(rootConcept || '').trim();
  if (!root || full.toLowerCase() === root.toLowerCase()) return full;
  if (full.toLowerCase().startsWith(root.toLowerCase())) {
    const tail = full.slice(root.length).replace(/^[\s:–—-]+/, '').trim();
    if (tail) return tail;
  }
  return full;
}

// Map the fine-grained role to a coarse family the phrasing banks switch on.
function promptAwareRoleFamily(role) {
  if (role.startsWith('system') || role.startsWith('distributed') || role.startsWith('record') || role.startsWith('coordination')) return 'system';
  if (role.startsWith('biology')) return 'biology';
  if (role.startsWith('market')) return 'market';
  if (role.startsWith('history')) return 'history';
  if (role.startsWith('cycle') || role.startsWith('process') || role.startsWith('scientific')) return 'process';
  return 'general';
}

function buildPromptAwareDefinition(concept, role, rootConcept, concepts, conceptIndex = 0, stripPrefix = rootConcept) {
  const isRootConcept = isSamePromptConcept(concept, rootConcept);
  const relatedRaw = concepts.filter((entry) => entry !== concept).slice(0, 2);
  const related = relatedRaw.map((entry) => shortConceptLabel(entry, stripPrefix));
  const self = shortConceptLabel(concept, stripPrefix);
  const relatedText = related.length ? related.join(' and ') : shortConceptLabel(rootConcept, stripPrefix);
  const family = promptAwareRoleFamily(role);

  if (isRootConcept) {
    const rootByFamily = {
      system: `${concept} is a coordinated exchange between connected parts: one side sends a request, another handles it, and a response travels back — together they form ${relatedText}.`,
      biology: `${concept} is a living system in which structures like ${relatedText} each play a role, interacting in order to produce a visible result.`,
      market: `${concept} is shaped by forces such as supply, demand, and price, and ${relatedText} are the levers that move it one way or the other.`,
      history: `${concept} unfolds as a chain in which earlier pressures lead to events and consequences, with ${relatedText} marking the turning points along the way.`,
      process: `${concept} is a sequence of connected stages, where ${relatedText} each transform what arrives and pass it on so the next stage can act.`,
      general: `${concept} becomes clear when you follow how ${relatedText} interact in the actual topic rather than treating them as isolated labels.`,
    };
    return rootByFamily[family];
  }

  const nextRelated = related[0];
  const linkTo = nextRelated ? ` and feeds into ${nextRelated}` : '';
  const banks = {
    system: [
      `${self} takes in the incoming request, does its specific job, then passes the result onward${linkTo}.`,
      `${self} is one station on the path: it handles what reaches it and forwards a result${linkTo}.`,
      `${self} acts on the data it receives and returns something the next part can use${linkTo}.`,
    ],
    biology: [
      `${self} carries out its own step in the process before the result moves on${linkTo}.`,
      `${self} is the structure responsible for one specific change${linkTo}.`,
      `${self} performs a single function, then the outcome is handed to what follows${linkTo}.`,
    ],
    market: [
      `${self} is a force that pushes price or quantity in a particular direction${linkTo}.`,
      `${self} shifts the balance of the market, changing what buyers and sellers decide${linkTo}.`,
      `${self} tilts the outcome whenever the conditions around it change${linkTo}.`,
    ],
    history: [
      `${self} is the pressure that set the events that came after it in motion${linkTo}.`,
      `${self} is a turning point that redirected what happened next${linkTo}.`,
      `${self} built on what came before and pushed the story toward its outcome${linkTo}.`,
    ],
    process: [
      `${self} is the stage that prepares the conditions the next stage relies on${linkTo}.`,
      `${self} is one step whose output becomes the input for what follows${linkTo}.`,
      `${self} transforms what reaches it and passes the result forward${linkTo}.`,
    ],
    general: [
      `${self} does one specific job that the rest of the idea depends on${linkTo}.`,
      `${self} is a distinct piece with a clear role inside the whole${linkTo}.`,
      `${self} contributes one part of the picture${linkTo}.`,
    ],
  };
  return pickVariant(banks[family], conceptIndex);
}

function buildPromptAwareImportance(concept, role, rootConcept, concepts, conceptIndex = 0, stripPrefix = rootConcept) {
  const isRootConcept = isSamePromptConcept(concept, rootConcept);
  const relatedRaw = concepts.filter((entry) => entry !== concept).slice(0, 2);
  const related = relatedRaw.map((entry) => shortConceptLabel(entry, stripPrefix));
  const self = shortConceptLabel(concept, stripPrefix);
  const relatedText = related.length ? related.join(' and ') : shortConceptLabel(rootConcept, stripPrefix);
  const family = promptAwareRoleFamily(role);

  if (isRootConcept) {
    const rootByFamily = {
      system: `Trace it as request → processing → response and ${relatedText} fall into a clear order instead of feeling like scattered parts.`,
      biology: `Once you see how ${relatedText} interact in sequence, the whole process makes sense as one connected system.`,
      market: `Watch how ${relatedText} pull against each other and the resulting price or quantity stops looking arbitrary.`,
      history: `Read it as cause leading to event leading to consequence, and ${relatedText} line up into a single story.`,
      process: `Follow the stages in order and ${relatedText} explain why the outcome turns out the way it does.`,
      general: `Once you see how ${relatedText} fit together, the topic becomes easier to follow and remember.`,
    };
    return rootByFamily[family];
  }

  const nextRelated = related[0];
  const banks = nextRelated ? [
    `It matters because what ${self} produces is exactly what ${nextRelated} needs to do its part.`,
    `Without ${self}, ${nextRelated} would have nothing to work with.`,
    `${self} is the link that lets ${nextRelated} continue the chain.`,
  ] : [
    `It matters because skipping ${self} breaks the chain that follows it.`,
    `Remove ${self} and the steps after it lose their starting point.`,
    `${self} is the piece that keeps the rest of the process moving.`,
  ];
  return pickVariant(banks, conceptIndex);
}

function buildPromptAwareDetails(concept, role, rootConcept, concepts, conceptIndex = 0, stripPrefix = rootConcept) {
  const isRootConcept = isSamePromptConcept(concept, rootConcept);
  const relatedRaw = concepts.filter((entry) => entry !== concept).slice(0, 2);
  const related = relatedRaw.map((entry) => shortConceptLabel(entry, stripPrefix));
  const self = shortConceptLabel(concept, stripPrefix);
  const family = promptAwareRoleFamily(role);

  if (isRootConcept) {
    const rootByFamily = {
      system: [
        `It starts with a sender and a receiver at the two ends.`,
        `A request carries what is asked for; a response carries what comes back.`,
        related[0] ? `${related[0]} is one hop along that path, not a separate topic.` : '',
      ],
      biology: [
        `Each structure does its own job, then the result moves to the next.`,
        related[0] ? `${related[0]} acts only after the step before it finishes.` : '',
        `Follow the parts in order and the final outcome explains itself.`,
      ],
      market: [
        `Supply and demand meet at a price where the two balance.`,
        related[0] ? `When ${related[0]} changes, that balance point shifts.` : '',
        `Read the direction of each force to predict where the outcome lands.`,
      ],
      history: [
        `Earlier pressures build until they tip into an event.`,
        related[0] ? `${related[0]} marks one of those turning points.` : '',
        `Each consequence becomes the setup for what happens next.`,
      ],
      process: [
        `Its stages hand work to one another in a fixed order.`,
        related[0] ? `What ${related[0]} does depends on what came before it.` : '',
        `Follow the stages in sequence and the result becomes predictable.`,
      ],
      general: [
        `Its parts hand work to one another in order.`,
        related[0] ? `What ${related[0]} does next depends on what came before it.` : '',
        `Follow the parts in sequence and the outcome explains itself.`,
      ],
    };
    return uniqueNormalizedStrings(rootByFamily[family], 3);
  }

  const nextRelated = related[0];
  const banksByFamily = {
    system: [
      `${self} sits at one point along the request path.`,
      nextRelated ? `${self} passes information to ${nextRelated} or returns it back.` : `${self} sends, handles, stores, or returns — one clear job.`,
      `Its single responsibility keeps the exchange flowing.`,
    ],
    biology: [
      `${self} performs one step and nothing more.`,
      nextRelated ? `Its result becomes what ${nextRelated} acts on.` : `Its result is what the next structure acts on.`,
      `Skip it and the steps after it have nothing to continue with.`,
    ],
    market: [
      `${self} pushes the outcome in one direction.`,
      nextRelated ? `Its movement reshapes how ${nextRelated} responds.` : `Its movement reshapes the balance of the whole market.`,
      `Track its direction and the price or quantity follows.`,
    ],
    history: [
      `${self} applied pressure at a specific moment.`,
      nextRelated ? `That pressure set up ${nextRelated} as the next turn.` : `That pressure set up the events that followed.`,
      `Its effect carried forward into later consequences.`,
    ],
    process: [
      `${self} handles one step on its own.`,
      nextRelated ? `Its output is the input ${nextRelated} works on.` : `Its output is the input the next step works on.`,
      `Remove it and the steps after it have nothing to act on.`,
    ],
    general: [
      `${self} handles one step on its own.`,
      nextRelated ? `Its output is the input ${nextRelated} works on.` : `Its output is what the next part works on.`,
      `Remove it and the steps after it have nothing to act on.`,
    ],
  };
  return uniqueNormalizedStrings(banksByFamily[family], 3);
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
  const keyTopics = concepts.slice(0, 6).map((concept, conceptIndex) => {
    const role = detectPromptAwareConceptRole(concept, resolvedField, rootConcept);
    return buildTopicEntry(
      concept,
      buildPromptAwareDefinition(concept, role, rootConcept, concepts, conceptIndex, coreTitle),
      buildPromptAwareImportance(concept, role, rootConcept, concepts, conceptIndex, coreTitle),
      buildPromptAwareDetails(concept, role, rootConcept, concepts, conceptIndex, coreTitle),
      supportConcepts
        .filter((entry) => entry !== concept)
        .slice(0, 2)
        .map((entry) => `${concept} connects to ${entry}`),
    );
  });

  const coreThesis = resolvedField === 'biology'
    ? `${rootConcept} works as a biological system or sequence rather than a list of isolated terms. ${supportSummary} show what changes, what interacts, and what outcome the process produces.`
    : resolvedField === 'economics'
      ? `${rootConcept} becomes clear when market forces are tracked together instead of memorized as isolated definitions. ${supportSummary} show how the outcome shifts when conditions change.`
      : resolvedField === 'history'
        ? `${rootConcept} is a chain of causes, phases, and consequences rather than a single event name. ${supportSummary} show what triggered the change, what happened across the timeline, and what remained afterward.`
        : isCycleTopic
          ? `${rootConcept} is a repeating process instead of a loose set of vocabulary words. ${supportSummary} show what changes at each stage and how the cycle continues.`
      : /\b(blockchain|validator|ledger|consensus|distributed|transaction|network|protocol|api|server|browser|client|request|response|web)\b/i.test(cleaned)
        ? `${rootConcept} is a coordinated information exchange between components. ${supportSummary} show who sends the message, who handles it, and what comes back.`
        : `${rootConcept} becomes clear by following its concrete parts and relationships. ${supportSummary} show the basic meaning, the mechanism, and the practical outcome.`;

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
  const topicRequest = normalizeText(topicSpec.topic_request || topicSpec.section_text || '');
  const shortTopicMaxChars = Math.max(80, Number(process.env.TOPIC_SCAFFOLD_LOCAL_MAX_CHARS ?? 220));
  const scaffoldTimeoutMs = Math.max(8_000, Number(process.env.TOPIC_SCAFFOLD_TIMEOUT_MS ?? 25_000));

  if (process.env.DISABLE_AI_PLANNER === 'true') {
    return fallbackSpec;
  }

  // Short direct prompts (for example: "Explain photosynthesis") are faster
  // and more reliable when we skip the scaffold model call and plan locally.
  if (topicRequest.length > 0 && topicRequest.length <= shortTopicMaxChars) {
    return fallbackSpec;
  }

  try {
    const scaffoldPrompt = `${buildIntentPrefix(topicSpec.lesson_intent)}${buildModePrefix(topicSpec.explanation_mode)}${buildSourceModePrefix('topic')}${TOPIC_SCAFFOLD_PROMPT}\n\nTOPIC REQUEST:\n${topicSpec.topic_request || topicSpec.section_text}\n\nUSER GUIDANCE:\n${topicSpec.user_instructions || 'none'}`;
    const scaffold = await callAIRace(
      scaffoldPrompt,
      Math.min(limits.analysisTok, 24_000),
      Math.min(limits.analysisTimeout, scaffoldTimeoutMs),
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

// ── Visual composition refinement (Pass 2.5) ─────────────────────────────────
// Dry-runs the template pipeline, scores each part's board_scenes, then asks the
// AI to REWRITE the visuals — richer "say" lines, SVG diagram beats, varied
// intents — before the final render pass.

async function refinePartBoardScenes(part, ctx, aiProvider, analysisModel, limits) {
  const assessment = assessPartVisuals(part, ctx);
  if (!assessment.needsRefinement && assessment.score >= 85) {
    return part.board_scenes;
  }

  const crossPartNote = ctx.priorSignatures?.length
    ? `Prior parts used these intent sequences (DO NOT repeat): ${ctx.priorSignatures.join(' | ')}`
    : '';

  const prompt = `${TUTOR_PHILOSOPHY}${VISUAL_COMPOSITION_PROMPT}

PART TITLE: ${part.title}
LEARNING OBJECTIVE: ${part.learning_objective || part.scene_goal || ''}
KEY CONCEPTS: ${(part.key_concepts || []).join(', ')}
FIELD: ${ctx.field || 'general'}
${buildVisualPlaybook(ctx.field)}

COMPOSITION PREVIEW (templates the renderer would pick):
${JSON.stringify(assessment.preview.boards, null, 1)}

ISSUES DETECTED:
${assessment.issues.length ? assessment.issues.map((i) => `- ${i}`).join('\n') : '- General quality improvement needed'}

${crossPartNote}

CURRENT board_scenes:
${JSON.stringify(part.board_scenes || [], null, 1)}

SOURCE MATERIAL (teach from this):
${String(ctx.sourceSnippet || '').slice(0, 6000)}

Return ONLY JSON: { "board_scenes": [ ... ] }`;

  try {
    const result = await callAIRace(
      prompt,
      Math.min(limits.contentTok, 8000),
      limits.contentTimeout,
      aiProvider,
      analysisModel,
    );
    const refined = validateBoardScenes(result?.board_scenes || []);
    if (refined.length >= 3) {
      const recheck = assessPartVisuals({ ...part, board_scenes: refined }, ctx);
      if (recheck.score >= assessment.score || recheck.issues.length < assessment.issues.length) {
        console.log(`[aiPlanner] Visual refine "${part.title}": ${assessment.score}→${recheck.score} (${refined.length} boards)`);
        return refined;
      }
    }
  } catch (err) {
    console.warn(`[aiPlanner] Visual refine failed for "${part.title}": ${err.message}`);
  }
  return part.board_scenes;
}

async function refineLessonVisuals(plan, lessonSpec, aiProvider, analysisModel) {
  const field = lessonSpec.comprehension?.field || '';
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  const { assessments, needsRefinement } = assessLessonVisuals(plan, field);

  if (!needsRefinement) {
    const avg = assessments.length
      ? assessments.reduce((s, a) => s + a.score, 0) / assessments.length
      : 100;
    console.log(`[aiPlanner] Visual composition OK (avg score ${Math.round(avg)})`);
    return plan;
  }

  console.log(`[aiPlanner] Phase 3 Pass 2.5: Refining visuals for ${assessments.filter((a) => a.needsRefinement).length}/${assessments.length} parts...`);

  const priorSignatures = [];
  const contentParts = plan.parts.filter((p) => p.part_type === 'content');

  for (let i = 0; i < contentParts.length; i++) {
    const part = contentParts[i];
    const assessment = assessments.find((a) => a.partIndex === i);
    if (!assessment?.needsRefinement && assessment?.score >= 80) {
      priorSignatures.push(assessment.signature);
      continue;
    }

    const refinedScenes = await refinePartBoardScenes(part, {
      lessonTitle: plan.title,
      field,
      partIndex: i,
      priorSignatures: [...priorSignatures],
      sourceSnippet: lessonSpec.section_text,
    }, aiProvider, analysisModel, limits);

    if (refinedScenes?.length) {
      part.board_scenes = refinedScenes;
      const beatNarration = refinedScenes.map((s) => s.say).filter(Boolean).join(' ');
      if (beatNarration) part.narration = beatNarration;
    }

    const after = assessPartVisuals(part, { lessonTitle: plan.title, field, partIndex: i, priorSignatures });
    priorSignatures.push(after.signature);
  }

  return plan;
}

// ---- Planning pipeline -------------------------------------------------------

async function _planLessonContent(lessonSpec, onProgress, aiProvider = null, analysisModel = null) {
  const report = (step) => onProgress?.(step);
  const limits = PROVIDER_LIMITS[aiProvider] || PROVIDER_LIMITS.blaze;
  const model = resolveModel(aiProvider, analysisModel);
  const sectionLimit = getSectionTextLimit(aiProvider);
  const refineSourceLimit = aiProvider === 'deepseek' ? 500_000 : 30_000;
  const refinePlanLimit = aiProvider === 'deepseek' ? 200_000 : 40_000;
  const topicRequest = normalizeText(lessonSpec.topic_request || lessonSpec.section_text || '');
  const topicLocalOnlyEnabled = String(process.env.TOPIC_LOCAL_ONLY ?? '').toLowerCase() === 'true';
  const topicLocalOnlyMaxChars = Math.max(80, Number(process.env.TOPIC_LOCAL_ONLY_MAX_CHARS ?? 220));
  const shouldUseTopicLocalOnly = shouldUseTopicLocalOnlyFallback(lessonSpec, aiProvider);
  if (lessonSpec.source_mode === 'topic') {
    console.log(`[aiPlanner] topic-mode check: requestLen=${topicRequest.length}, localOnlyEnabled=${topicLocalOnlyEnabled}, maxChars=${topicLocalOnlyMaxChars}, useLocal=${shouldUseTopicLocalOnly}`);
  }
  const cleanedUserInstructions = cleanUserInstructions(lessonSpec.user_instructions);
  const normalizedLessonIntent = normalizeLessonIntent(lessonSpec.lesson_intent, lessonSpec.user_instructions);

  await report('planning_outline');
  console.log(`[aiPlanner] Phase 3: Teaching content for "${lessonSpec.title}" (provider=${aiProvider}, model=${model})...`);

  // Build the context for the AI — include full comprehension data
  const comprehensionContext = lessonSpec.comprehension
    ? `\n\nDOCUMENT UNDERSTANDING:\nSubject: ${lessonSpec.comprehension.document_subject}\nField: ${lessonSpec.comprehension.field}\nCore thesis: ${lessonSpec.comprehension.core_thesis}\nDifficulty: ${lessonSpec.comprehension.difficulty_level}\nTeaching approach: ${lessonSpec.comprehension.teaching_approach}\nLogical flow: ${lessonSpec.comprehension.logical_flow || ''}\nKey topics (ALL — use these for accurate content):\n${JSON.stringify(lessonSpec.comprehension.key_topics?.slice(0, 20), null, 1)}`
    : '';

  // Light per-subject bias toward the board intents that teach this field best.
  const visualPlaybook = buildVisualPlaybook(lessonSpec.comprehension?.field);

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

  if (shouldUseTopicLocalOnly) {
    await report('ai_local_fallback');
    console.log(`[aiPlanner] Topic local fallback enabled for "${lessonSpec.title}"`);
    finalPlan = buildFallbackLesson(lessonSpec);
  }

  // ── Pass 1: Initial generation ──
  if (!finalPlan) try {
    await report('ai_generating');
    const intentPrefix = buildIntentPrefix(normalizedLessonIntent);
    const modePrefix = buildModePrefix(lessonSpec.explanation_mode);
    const sourceModePrefix = buildSourceModePrefix(lessonSpec.source_mode);
    const aiPlan = await callAIRace(
      `${intentPrefix}${modePrefix}${sourceModePrefix}${TUTOR_PHILOSOPHY}${TEACHING_PROMPT}${comprehensionContext}${visualPlaybook}\n\nLESSON SPEC:\n${specText}`,
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
  if (finalPlan && !shouldUseTopicLocalOnly) {
    try {
      await report('ai_refining');
      console.log(`[aiPlanner] Phase 3 Pass 2: Refining lesson "${lessonSpec.title}"...`);
      const refinedPlan = await callAIRace(
        REFINEMENT_PROMPT + `\n\n${TUTOR_PHILOSOPHY}\n\nORIGINAL LESSON PLAN:\n${JSON.stringify(finalPlan, null, 1).slice(0, refinePlanLimit)}\n\nSOURCE MATERIAL:\n${(lessonSpec.section_text || '').slice(0, refineSourceLimit)}`,
        limits.contentTok,
        limits.contentTimeout,
        aiProvider,
        analysisModel,
      );
      if (refinedPlan?.parts?.length) {
        const validated = validateAndFixPlan(refinedPlan, lessonSpec);
        if (validated.parts.length >= finalPlan.parts.length) {
          // Refinement must never strip the AI's board_scenes. If a refined part
          // lost the teaching beats its pre-refinement counterpart had, restore
          // them so refinement can only improve coverage, never regress it.
          validated.parts.forEach((part, i) => {
            const prior = finalPlan.parts[i];
            if (!part.board_scenes?.length && prior?.board_scenes?.length) {
              part.board_scenes = prior.board_scenes;
            }
          });
          finalPlan = validated;
          console.log(`[aiPlanner] Phase 3 Pass 2 OK - refined to ${finalPlan.parts.length} parts`);
        }
      }
    } catch (refineErr) {
      console.warn('[aiPlanner] Phase 3 Pass 2 refinement skipped:', refineErr.message);
    }
  }

  // ── Pass 2.5: Visual composition — AI edits board_scenes for rich SVG teaching ──
  if (finalPlan && !shouldUseTopicLocalOnly) {
    try {
      await report('ai_visual_refining');
      finalPlan = await refineLessonVisuals(finalPlan, lessonSpec, aiProvider, analysisModel);
      // Re-validate after visual edits so narration syncs with refined beats
      finalPlan = validateAndFixPlan(finalPlan, lessonSpec);

      // Last-resort quality gate: if the AI's plan is mostly meta-language
      // scaffolding (the "super duplicated, no meaning" failure mode), rebuild
      // the parts from the comprehension `details` — the real source-grounded
      // teaching content. We don't fall through to the local-text fallback;
      // we keep the AI's structure but replace its paraphrases with verbatim
      // source sentences. Only triggers if the comprehension pass actually
      // produced details to work with.
      if (looksLikeMetaOnlyPlan(finalPlan, lessonSpec)) {
        const before = JSON.stringify(finalPlan).length;
        finalPlan = rebuildPlanFromComprehension(finalPlan, lessonSpec);
        finalPlan = validateAndFixPlan(finalPlan, lessonSpec);
        console.log(`[aiPlanner] Plan was meta-only; rebuilt from comprehension (${before} → ${JSON.stringify(finalPlan).length} chars)`);
      }
    } catch (visualErr) {
      console.warn('[aiPlanner] Phase 3 Pass 2.5 visual refinement skipped:', visualErr.message);
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

  // Ensure every content part has visual sequences
  const contentParts = finalPlan.parts.filter((p) => p.part_type === 'content');
  for (let i = 0; i < contentParts.length; i++) {
    await report(`planning_visuals_${i + 1}`);
    const part = contentParts[i];
    part.visual_sequence = generateContentVisuals({
      lessonTitle: finalPlan.title,
      part,
      contentIndex: i,
      comprehension: lessonSpec.comprehension,
      explanationMode: lessonSpec.explanation_mode,
      continuity: {
        previous: lessonSpec.previous_lesson_title,
        next: lessonSpec.next_lesson_title,
      },
    });
    // CONTENT-DRIVEN DURATION: there is no narration audio, so the board must
    // end when the DRAWING ends. We pin duration to the last *drawn* shape's time
    // plus a short read-hold — not the max scene time, which includes a trailing
    // camera-reset that would otherwise leave the finished board frozen for a few
    // extra seconds. This stops the player sitting on a dead board. Sane band.
    const lastDraw = (part.visual_sequence || [])
      .filter((s) => !['camera', 'clear'].includes(s.type || s.action_type))
      .reduce((m, s) => Math.max(m, Number(s.time) || 0), 0);
    if (lastDraw > 0) {
      part.duration_seconds = clamp(Math.ceil(lastDraw + 2.0), 45, 200);
    }
  }

  // Ensure quiz parts have visuals
  for (const part of finalPlan.parts) {
    if (part.part_type === 'quiz' && !part.visual_sequence?.length) {
      part.visual_sequence = generateQuizVisuals(finalPlan.title, part);
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










function containsPlannerControlPhrase(text, lessonSpec) {
  const normalized = normalizePlannerPhrase(text);
  if (!normalized) return false;

  if (/\b(should be explained|should be taught|should be shown|this lesson will|so the learner can|move from definition to mechanism|one coherent explanation|not in isolation|visible changes over time|clear learnable sequence)\b/.test(normalized)) {
    return true;
  }

  const hasStructuredPrefix = /^(primary lesson goal|preferred delivery style|specific user requirements|lesson intent|teaching preset)\b/.test(normalized);
  const matched = [...PLANNER_META_CONCEPTS].some((phrase) => normalized.includes(phrase));
  if (!hasStructuredPrefix && !matched) return false;

  const sourceText = normalizePlannerPhrase(lessonSpec?.section_text || '');
  if (!sourceText) return true;
  if (hasStructuredPrefix) return true;
  return [...PLANNER_META_CONCEPTS].some((phrase) => normalized.includes(phrase) && !sourceText.includes(phrase));
}

function sanitizeNarration(narration, lessonSpec, concepts) {
  // The AI sometimes returns narration where two duplicate sentences have been
  // concatenated without a separator ("...and review How X begins with..."). The
  // sentence splitter sees it as one long sentence and the dedup below can't
  // help. Normalize "review.<duplicate>" → "review. <duplicate>" first so the
  // splitter actually splits them and the dedup drops the second.
  const splitReady = String(narration || '')
    .replace(/([.!?])\s*(?=[A-Z])/g, '$1 ')
    .replace(/(review|conclusion|summary)\.\s*([A-Z])/g, '$1. $2');
  const sentences = extractSentences(stripGatewaySentinels(splitReady));
  const seen = new Set();
  const cleaned = [];

  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence);
    const key = normalized.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!key || key.split(/\s+/).length < 4) continue;
    if (seen.has(key)) continue;
    if (containsPlannerControlPhrase(normalized, lessonSpec)) continue;
    if (isInstructionalMetaSentence(normalized)) continue;
    // Reuse the validator's stronger meta-stripper so phrases like
    // "is a central concept in this lesson" or "supports the rest of the
    // topic" don't leak into the visible narration. The validator's
    // patterns catch what the narrow INSTRUCTIONAL_META_* regexes miss.
    const sayClean = cleanSay(normalized, 800);
    if (!sayClean.text || sayClean.isMetaOnly) continue;
    if (/^(this is important|understanding this matters|it is important to understand|now let'?s dive in|let'?s dive in|in conclusion|to summarize)\b/i.test(sayClean.text)) {
      continue;
    }

    seen.add(key);
    cleaned.push(sayClean.text);
  }

  if (!cleaned.length) return normalizeText(narration || '');

  const rebuilt = collapseRepeatedWordRuns(cleaned.join(' '));
  if (rebuilt.split(/\s+/).length >= 80) return rebuilt;
  return enrichNarration(rebuilt, concepts, lessonSpec);
}

function sanitizeNarrationWithoutEnrichment(narration, lessonSpec, concepts = [], sourceText = '') {
  // Same split-tied-sentences fix as sanitizeNarration: when the AI concatenates
  // a duplicate sentence onto the previous one without punctuation, the splitter
  // merges them and dedup never fires. Normalize "review.<dup>" → "review. <dup>"
  // so the splitter splits them and the dedup below drops the second.
  const splitReady = String(narration || '')
    .replace(/([.!?])\s*(?=[A-Z])/g, '$1 ')
    .replace(/(review|conclusion|summary)\.\s*([A-Z])/g, '$1. $2');
  const sentences = extractSentences(splitReady);
  const seen = new Set();
  const cleaned = [];

  for (const sentence of sentences) {
    const normalized = normalizeSentence(sentence);
    const key = normalized.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!key || key.split(/\s+/).length < 4) continue;
    if (seen.has(key)) continue;
    if (containsPlannerControlPhrase(normalized, lessonSpec)) continue;
    if (isInstructionalMetaSentence(normalized)) continue;
    // Apply the validator's stronger meta-stripper so phrases like
    // "is a central concept in this lesson" don't leak into the visible
    // narration. The validator has 27+ meta-sentence patterns that catch
    // what the narrow INSTRUCTIONAL_META_* regexes here miss.
    const sayClean = cleanSay(normalized, 800);
    if (!sayClean.text || sayClean.isMetaOnly) continue;
    if (/^(this is important|understanding this matters|it is important to understand|now let'?s dive in|let'?s dive in|in conclusion|to summarize)\b/i.test(sayClean.text)) {
      continue;
    }

    seen.add(key);
    cleaned.push(sayClean.text);
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
    // Validate the AI's semantic board_scenes FIRST — these drive the template
    // pipeline AND now carry the spoken teacher line (`say`) for each beat.
    // Validating up front lets us assemble the part narration from the ordered
    // beats so the voice and the drawing share one clock (beat N is spoken
    // exactly while board N is drawn).
    let cleanScenes = [];
    if (Array.isArray(part.board_scenes) && part.board_scenes.length) {
      cleanScenes = validateBoardScenes(part.board_scenes);
    }
    // The teaching beat is the unit of narration: each board scene's `say` line,
    // joined in order, IS the part's spoken script. This keeps audio and board
    // locked together. Fall back to the AI's free-form narration blob when the
    // beats carry no spoken lines (older plans / fallback paths).
    const beatNarration = cleanScenes.map((s) => s.say).filter(Boolean).join(' ');
    const sourceNarration = beatNarration || part.narration || '';

    const fixed = {
      order_index: part.order_index || index + 1,
      title: sanitizeSceneText(part.title || `Part ${index + 1}`, 8) || `Part ${index + 1}`,
      part_type: part.part_type || 'content',
      duration_seconds: clamp(Number(part.duration_seconds) || 300, 55, 600),
      narration: sanitizeNarration(sourceNarration, lessonSpec, keyConcepts),
      key_concepts: pedagogicalConcepts.length ? pedagogicalConcepts : keyConcepts,
      scene_goal: pedagogicalPlan.scene_goal,
      learning_objective: pedagogicalPlan.learning_objective,
      visual_logic: pedagogicalPlan.visual_logic,
      animation_sequence: pedagogicalPlan.animation_sequence,
      visual_sequence: normalizeVisualSequence(Array.isArray(part.visual_sequence) ? part.visual_sequence : [], clamp(Number(part.duration_seconds) || 300, 55, 600)),
    };

    if (cleanScenes.length) fixed.board_scenes = cleanScenes;

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
  // A free model can return one or two well-developed teaching parts. Preserve
  // real topic-specific teaching rather than replacing it with the generic
  // local fallback; the narration and summary gates below still reject thin
  // responses.
  if (contentParts.length === 0) return true;

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

/**
 * True if the AI's plan is mostly meta-language scaffolding instead of
 * actual teaching. Detected by counting how many of the part's `say` and
 * `narration` sentences survive the meta filter, and how much of the
 * remaining word-count is real teaching content (no meta connector). Used
 * to gate the last-resort rebuild-from-source pass.
 */
function looksLikeMetaOnlyPlan(plan, lessonSpec) {
  if (!plan || !Array.isArray(plan.parts) || !plan.parts.length) return false;
  const contentParts = plan.parts.filter((p) => p.part_type === 'content');
  if (!contentParts.length) return false;
  for (const part of contentParts) {
    // Look at every `say` the AI produced across the part's board_scenes.
    const says = Array.isArray(part.board_scenes) ? part.board_scenes.map((s) => s?.say || '').filter(Boolean) : [];
    if (!says.length) return true;
    let totalWords = 0;
    let metaWords = 0;
    for (const s of says) {
      const sentences = String(s).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
      for (const sent of sentences) {
        const words = sent.split(/\s+/).filter(Boolean);
        totalWords += words.length;
        if (containsPlannerControlPhrase(sent, lessonSpec) || isInstructionalMetaSentence(sent)) {
          metaWords += words.length;
        }
      }
    }
    if (totalWords < 60) return true;            // barely any real teaching
    if (metaWords / totalWords > 0.4) return true; // >40% of the words are meta scaffolding
  }
  return false;
}

/**
 * Rebuild a plan's content parts from the comprehension `details` (real
 * source-grounded facts the comprehension pass extracted from the user's
 * document). Each part gets fresh `narration` and `board_scenes` built
 * directly from those facts — no chance of the AI's prompt-shaped copy
 * making it onto the board. Called when `looksLikeMetaOnlyPlan` flags
 * the AI's output as mostly scaffolding.
 */
function rebuildPlanFromComprehension(plan, lessonSpec) {
  const comprehension = lessonSpec.comprehension || {};
  const compTopics = Array.isArray(comprehension.key_topics) ? comprehension.key_topics : [];
  const compDetails = [];
  for (const topic of compTopics) {
    if (!topic || typeof topic !== 'object') continue;
    const def = (topic.definition || '').toString().trim();
    if (def) compDetails.push(def);
    for (const d of (Array.isArray(topic.details) ? topic.details : [])) {
      const s = String(d || '').trim();
      if (s) compDetails.push(s);
    }
  }
  if (!compDetails.length) return plan;

  for (const part of plan.parts || []) {
    if (part.part_type !== 'content') continue;
    // Re-slice the comprehension details across the part's beats.
    const sentences = compDetails.slice();
    const scenes = Array.isArray(part.board_scenes) ? part.board_scenes : [];
    const n = scenes.length || 4;
    scenes.forEach((scene, i) => {
      if (!scene || typeof scene !== 'object') return;
      const start = Math.floor((i * sentences.length) / n);
      const end = Math.floor(((i + 1) * sentences.length) / n);
      const chunk = sentences.slice(start, end).join(' ').trim();
      if (chunk) scene.say = chunk;
    });
    // Rebuild part narration as the joined say chunks so the side panel
    // shows real teaching content.
    const joined = scenes.map((s) => s?.say).filter(Boolean).join(' ');
    if (joined) part.narration = joined;
    part.board_scenes = scenes;
  }
  return plan;
}

function enrichNarration(narration, concepts, lessonSpec) {
  const sourceText = lessonSpec.section_text || '';
  const sentences = extractSentences(sourceText);
  const conceptSentences = sentences.filter((s) =>
    concepts.some((c) => s.toLowerCase().includes(c.toLowerCase()))
    && s.length > 35
  ).slice(0, 8);

  // Source sentences stand alone — NO prompt-shaped connectors ("From the
  // source material, ...", "Specifically, ...") because the AI parrots them
  // back as content. The source sentence is the teaching; the connector adds
  // nothing.
  const CONNECTORS = [];

  // Jaccard-based dedup: skip a source sentence if it overlaps the already-
  // built narration by ≥60% of its first 12 content words. The old
  // `.slice(0, 24)` substring check let many near-duplicates through.
  const firstNTokens = (s, n = 12) => String(s || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, n);
  const tokensOverlap = (a, b) => {
    const A = new Set(firstNTokens(a));
    const B = new Set(firstNTokens(b));
    if (!A.size || !B.size) return 0;
    let inter = 0;
    A.forEach((t) => { if (B.has(t)) inter += 1; });
    return inter / Math.min(A.size, B.size);
  };
  const seenKey = (s) => firstNTokens(s, 8).join(' ');
  const usedPhrases = new Set();
  const enriched = [narration];
  conceptSentences.forEach((s) => {
    const normalized = normalizeSentence(s);
    const key = seenKey(normalized);
    if (usedPhrases.has(key)) return;
    if (tokensOverlap(normalized, narration) >= 0.6) return;
    usedPhrases.add(key);
    // Append the source sentence verbatim. The connector slot is intentionally
    // empty — adding scaffolding here is what taught the AI to write
    // "From the source material, ..." in the first place.
    enriched.push(normalized);
  });

  const result = enriched.filter(Boolean).join(' ');
  if (result.split(/\s+/).length > 400) return result;

  const extraSource = sentences
    .filter((sentence) => !containsPlannerControlPhrase(sentence, lessonSpec))
    .filter((sentence) => tokensOverlap(sentence, result) < 0.6)
    .slice(0, 3)
    .map((sentence) => normalizeSentence(sentence));

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







function buildTopicFallbackLesson(spec) {
  const lessonTitle = spec.title || spec.comprehension?.document_subject || buildTopicTitle(spec.topic_request || spec.section_text);
  const subject = spec.comprehension?.document_subject || lessonTitle;
  const sourceText = normalizeText(spec.topic_request || spec.section_text || lessonTitle);
  const topicPool = Array.isArray(spec.comprehension?.key_topics) && spec.comprehension.key_topics.length
    ? spec.comprehension.key_topics.slice(0, 6)
    : sanitizeConceptList(spec.key_points, sourceText, 6).map((topic) => ({
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
      ? dedupePromptConcepts(sanitizeConceptList(topicGroup.map((topic) => topic?.topic), sourceText, 6), 4)
      : sanitizeConceptList(topicGroup.map((topic) => topic?.topic), sourceText, 4);
    const primaryConcept = concepts[0] || topicGroup[0]?.topic || lessonTitle;
    const partConfig = buildTopicFallbackPartConfig(spec.explanation_mode, index, primaryConcept);

    const ideaSentences = [
      `${primaryConcept} is the best place to start when you want to understand ${lessonTitle}.`,
      `This idea helps explain the main mechanism behind ${lessonTitle}.`,
      `A strong way to teach ${lessonTitle} is to connect ${concepts.slice(0, 3).join(', ')} in a clear sequence.`,
      `When you follow ${primaryConcept} step by step, the topic becomes easier to reason about.`,
    ];

    const baseEntries = filterInstructionalMetaEntries([
      index === 0 ? spec.comprehension?.core_thesis || '' : '',
      ...topicGroup.flatMap((topic) => [
        topic?.definition || '',
        topic?.importance || '',
        ...uniqueNormalizedStrings(topic?.details, 3),
      ]),
      ...ideaSentences,
    ]);

    let candidateSentences = extractSentences(normalizeText(baseEntries.join(' ')))
      .filter((sentence) => !isInstructionalMetaSentence(sentence));

    if (candidateSentences.length < 4) {
      candidateSentences = ideaSentences;
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
      narration: 'Check whether the main idea is clear before moving on.',
      lessonTitle,
      concepts: contentParts[0].key_concepts,
      sourceText: buildTopicSourceBrief(spec),
    }),
    buildQuizPart({
      orderIndex: 4,
      title: quizTitles[1],
      narration: 'Test the key idea in a short applied check.',
      lessonTitle,
      concepts: contentParts[1].key_concepts,
      sourceText: buildTopicSourceBrief(spec),
    }),
  ];

  const summarySentences = extractSentences(normalizeText(filterInstructionalMetaEntries([
    spec.comprehension?.core_thesis || '',
    `${lessonTitle} becomes clearer when the main idea is connected to its key steps and examples.`,
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

// Build varied, TOPIC-SPECIFIC fallback quiz questions when the AI didn't author
// any. Rotates question forms and draws answers/distractors from the lesson's
// own concepts and sentences, so two different lessons never get the same quiz
// (the old version always asked "A central concept in this lesson is ___").
function buildConceptQuestions(rawConcepts, sourceText, lessonTitle) {
  const concepts = (Array.isArray(rawConcepts) ? rawConcepts : []).map((c) => String(c || '').trim()).filter(Boolean);
  const sentences = extractSentences(String(sourceText || '')).filter((s) => s.length > 25 && s.length < 200);
  const topic = concepts[0] || coreTopic(lessonTitle);
  const distractorsFor = (answer) => {
    const pool = concepts.filter((c) => c && c.toLowerCase() !== String(answer).toLowerCase());
    const picks = pool.slice(0, 3);
    while (picks.length < 3) picks.push([`a related idea`, `the opposite case`, `none of these`][picks.length] || `option ${picks.length + 1}`);
    return picks;
  };
  const mcq = (order, qtext, answer, why) => {
    const choices = [answer, ...distractorsFor(answer)].slice(0, 4);
    // deterministic shuffle by question text so the answer isn't always 'A'
    const seed = qtext.length % 4;
    const shuffled = choices.map((c, i) => choices[(i + seed) % choices.length]);
    return { order_index: order, question_type: 'mcq', question_text: qtext, difficulty: 'medium', options: { choices: shuffled, correct: answer }, correct_answer: answer, explanation: why };
  };

  const questions = [];

  // Q1 — define the core concept (MCQ over real concepts).
  questions.push(mcq(1, `Which of these is the central idea of "${truncateWords(lessonTitle, 6)}"?`, topic,
    `${topic} is the concept the lesson is built around.`));

  // Q2 — cloze from a REAL sentence containing a concept (topic-specific recall).
  const clozeConcept = concepts.find((c) => sentences.some((s) => s.toLowerCase().includes(c.toLowerCase()))) || topic;
  const clozeSentence = sentences.find((s) => s.toLowerCase().includes(clozeConcept.toLowerCase()));
  if (clozeSentence) {
    const re = new RegExp(clozeConcept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    questions.push({
      order_index: 2, question_type: 'fill_blank',
      question_text: clampText(clozeSentence.replace(re, '_____'), 160),
      difficulty: 'medium', options: null, correct_answer: clozeConcept,
      explanation: `The missing term is "${clozeConcept}".`,
    });
  } else {
    questions.push({
      order_index: 2, question_type: 'fill_blank',
      question_text: `In this lesson, _____ is responsible for ${truncateWords(sentences[0] || lessonTitle, 8)}.`,
      difficulty: 'medium', options: null, correct_answer: topic,
      explanation: `${topic} plays that role here.`,
    });
  }

  // Q3 — a second concept (relationship / role), only if we have another concept.
  if (concepts[1]) {
    questions.push(mcq(3, `How does ${concepts[1]} relate to ${topic}?`, `It supports ${topic}`,
      `${concepts[1]} works together with ${topic} in this topic.`));
  }

  return questions;
}

function buildQuizPart({ orderIndex, title, narration, lessonTitle, concepts, sourceText }) {
  const quizQuestions = buildConceptQuestions(concepts, sourceText || narration, lessonTitle);

  return {
    order_index: orderIndex,
    title,
    part_type: 'quiz',
    duration_seconds: 55,
    narration,
    key_concepts: [],
    visual_sequence: generateQuizVisuals(lessonTitle, { title, duration_seconds: 55, narration, quiz_questions: quizQuestions }),
    quiz_questions: quizQuestions,
  };
}

// =============================================================================
// VISUAL GENERATION ENGINE
// Every visual element must teach something from the document
// =============================================================================


// Composed template output is already clean, timed, paginated, collision-free,
// and duration-fitted by the scene composer. The legacy normalizeVisualSequence
// (density-limiter, dedup, box re-sizing/re-clamping, re-timing) is built for
// hand-rolled heuristic scenes and would MOVE and RESIZE template geometry —
// reintroducing the exact overlap problem templates exist to prevent. So we
// finalize composed output with a geometry-preserving pass: drop only entries
// that are structurally broken, leave every position/size/time untouched.
function finalizeComposedSequence(composed) {
  if (!Array.isArray(composed)) return [];
  return composed
    .filter((entry) => entry && typeof entry === 'object' && typeof entry.type === 'string' && entry.type)
    .map((entry) => ({ ...entry, time: Number.isFinite(Number(entry.time)) ? Number(entry.time) : 0 }));
}

function generateContentVisuals({ lessonTitle, part, contentIndex, comprehension, continuity, explanationMode = 'full_lesson' }) {
  const durationSeconds = Number(part.duration_seconds) || 300;
  const field = comprehension?.field;

  // ── Single visual engine: the pedagogy-first, template-filled pipeline ──────
  // The AI supplies semantic teaching beats (board_scenes / visual_logic). We
  // fill pre-designed, collision-free templates with that data. Templates own
  // all geometry, so a board can never overlap, and the composer paces + holds
  // each board so nothing flashes by. This is the ONLY way visuals are built —
  // there is no coordinate-placing fallback that could reintroduce overlap.
  try {
    const composed = buildWhiteboardForPart(part, { lessonTitle, field, partIndex: contentIndex });
    if (Array.isArray(composed) && composed.length) {
      console.log(`[aiPlanner] template pipeline produced ${composed.length} scenes for "${part.title}"`);
      return finalizeComposedSequence(composed);
    }
  } catch (err) {
    console.warn(`[aiPlanner] template pipeline failed for "${part.title}": ${err.message} — synthesizing beats`);
  }

  // Safety net (rarely hit): the part had no usable beats at all. Synthesize a
  // minimal board_scenes set from whatever text we have and run it back THROUGH
  // the same template pipeline — so the fallback is still collision-free and
  // never produces hand-placed coordinate boards.
  const concepts = sanitizeConceptList([
    ...(Array.isArray(part.key_concepts) ? part.key_concepts : []),
    part.scene_goal,
    part.learning_objective,
    ...(Array.isArray(part.visual_logic) ? part.visual_logic.map((entry) => entry?.content) : []),
  ], `${lessonTitle}\n${part.title || ''}\n${part.narration || ''}`, 8);
  const sentences = extractSentences(part.narration || '');

  const syntheticPart = {
    ...part,
    board_scenes: [
      {
        intent: 'define',
        goal: part.scene_goal || part.title,
        headline: part.title || lessonTitle,
        definition: sentences[0] || '',
        points: concepts.slice(0, 4),
        say: sentences.slice(0, 2).join(' ') || part.title || '',
      },
      {
        intent: 'cluster',
        goal: 'key ideas',
        center: part.title || lessonTitle,
        items: concepts.slice(0, 5).map((c) => ({ title: c })),
        say: sentences.slice(2, 4).join(' ') || concepts.join(', '),
      },
      {
        intent: 'recap',
        goal: 'recap',
        points: concepts.slice(0, 4),
        say: sentences[sentences.length - 1] || 'Let us recap the key ideas.',
      },
    ],
  };

  try {
    const composed = buildWhiteboardForPart(syntheticPart, { lessonTitle, field, partIndex: contentIndex });
    if (Array.isArray(composed) && composed.length) {
      console.log(`[aiPlanner] template pipeline (synthesized) produced ${composed.length} scenes for "${part.title}"`);
      return finalizeComposedSequence(composed);
    }
  } catch (err) {
    console.warn(`[aiPlanner] synthesized template pipeline failed for "${part.title}": ${err.message}`);
  }

  return [];
}


function rebalanceSceneLayout(scenes) {
  const laidOutScenes = scenes.map((scene) => ({ ...scene }));
  const titleScene = laidOutScenes.find(
    (scene) => scene.type === 'draw_text'
      && Array.isArray(scene.position)
      && scene.position[1] <= 48,
  );
  const subtitleScene = laidOutScenes.find(
    (scene) => scene.type === 'draw_text'
      && Array.isArray(scene.position)
      && scene.position[1] > 48
      && scene.position[1] <= 96,
  );

  const longTitle = wordCount(titleScene?.content || '') > 5 || String(titleScene?.content || '').length > 42;
  if (titleScene) {
    titleScene.style = {
      ...(titleScene.style || {}),
      fontSize: Math.min(Number(titleScene.style?.fontSize) || 24, longTitle ? 22 : 24),
    };
  }

  if (subtitleScene?.content) {
    subtitleScene.content = compactVisualPhrase(subtitleScene.content, 8);
    subtitleScene.position = [subtitleScene.position[0], longTitle ? 96 : 72];
    subtitleScene.style = {
      ...(subtitleScene.style || {}),
      fontSize: Math.min(Number(subtitleScene.style?.fontSize) || 17, 16),
    };
  }

  const headerFloor = subtitleScene ? (longTitle ? 156 : 128) : titleScene ? (longTitle ? 132 : 112) : 92;
  let badgeLane = 0;

  for (const scene of laidOutScenes) {
    if (scene.type === 'draw_badge' && Array.isArray(scene.position)) {
      const isCornerBadge = scene.position[0] <= 80 && scene.position[1] <= 30;
      const isTopRightHeaderBadge = scene.position[0] >= 560 && scene.position[1] <= 20;
      scene.fixedHeaderBadge = isTopRightHeaderBadge;
      if (!isCornerBadge && !isTopRightHeaderBadge && scene.position[1] < headerFloor) {
        scene.position = [Math.max(scene.position[0], 390), headerFloor + badgeLane * 54];
        badgeLane += 1;
      }
      continue;
    }

    if ((scene.type === 'draw_object' || scene.type === 'draw_physics_shape') && Array.isArray(scene.position)) {
      if (scene.position[1] < headerFloor - 12) {
        scene.position = [scene.position[0], headerFloor + 10];
      }
      continue;
    }

    if (scene.type === 'draw_rect') {
      if (!normalizeText(scene.label || '')) continue;
      const height = Number(scene.height) || 90;
      if (Number(scene.y) < headerFloor - 12) {
        scene.y = clampBoxY(headerFloor + 6, height);
      }
      continue;
    }

    if (scene.type === 'draw_circle' && Array.isArray(scene.center)) {
      const radius = Number(scene.radius) || 48;
      if (scene.center[1] - radius < headerFloor - 10) {
        scene.center = [scene.center[0], headerFloor + radius];
      }
      continue;
    }

    if (scene.type === 'draw_table' && Array.isArray(scene.position)) {
      const rowCount = Array.isArray(scene.rows) ? scene.rows.length : 0;
      const tableHeight = (rowCount + 1) * (Number(scene.cell_height) || 34);
      scene.position = [scene.position[0], clampBoxY(scene.position[1], tableHeight)];
    }
  }

  const movableTypes = new Set(['draw_badge', 'draw_callout', 'draw_table', 'draw_rect', 'show_equation']);
  const resolveSegmentHeuristically = (segmentScenes) => {
    const occupiedBoxes = segmentScenes
      .map((scene) => ({ scene, box: estimateSceneLayoutBox(scene) }))
      .filter(({ scene, box }) => box && (!movableTypes.has(scene.type) || scene.fixedHeaderBadge))
      .map(({ box }) => box);

    for (const scene of segmentScenes) {
      if (!movableTypes.has(scene.type) || scene.fixedHeaderBadge) continue;

      const initialBox = estimateSceneLayoutBox(scene);
      if (!initialBox) continue;

      const resolvedBox = resolveSceneLayoutBox(initialBox, occupiedBoxes);
      applySceneLayoutBox(scene, resolvedBox);
      occupiedBoxes.push(resolvedBox);
    }
  };

  let currentSegment = [];
  for (const scene of laidOutScenes) {
    if (scene.type === 'clear') {
      if (currentSegment.length && !layoutSceneSegmentWithGraph(currentSegment, headerFloor)) {
        resolveSegmentHeuristically(currentSegment);
      }
      currentSegment = [];
      continue;
    }
    currentSegment.push(scene);
  }
  if (currentSegment.length && !layoutSceneSegmentWithGraph(currentSegment, headerFloor)) {
    resolveSegmentHeuristically(currentSegment);
  }

  return laidOutScenes;
}

function normalizeVisualSequence(visualSeq, duration) {
  const seenTextualScenes = new Set();
  const deduped = visualSeq
    .map((entry) => sanitizeSceneEntry(entry))
    .filter(Boolean)
    .filter((entry) => {
      if (entry.type === 'clear') {
        seenTextualScenes.clear();
        return true;
      }

      if (STRUCTURAL_SCENE_TYPES.has(entry.type)) return true;

      const signatures = collectSceneTextFragments(entry)
        .map((fragment) => buildSceneTextSignature(fragment))
        .filter(Boolean);

      if (!signatures.length) return true;

      const unseenSignatures = signatures.filter((signature) => !seenTextualScenes.has(signature));
      if (!unseenSignatures.length) return false;

      unseenSignatures.forEach((signature) => seenTextualScenes.add(signature));
      return true;
    });

  // ── Board density limiter: max 5 non-clear elements per page ──
  // RULE: "No more than 5 distinct concepts visible simultaneously without grouping"
  // This prevents overlap and ensures the whiteboard teaches one idea at a time.
  const MAX_PER_PAGE = 5;
  const densityLimited = [];
  let pageCount = 0;
  for (const entry of deduped) {
    if (entry.type === 'clear') {
      densityLimited.push(entry);
      pageCount = 0;
      continue;
    }
    pageCount++;
    if (pageCount <= MAX_PER_PAGE) {
      densityLimited.push(entry);
    } else if (pageCount === MAX_PER_PAGE + 1) {
      // Insert a clear and start a new page with this element
      densityLimited.push({ type: 'clear', time: entry.time });
      densityLimited.push(entry);
      pageCount = 1;
    }
  }

  const scenes = rebalanceSceneLayout(densityLimited);
  return fitSceneTimeline(scenes, duration);
}


// ── Quiz visuals ─────────────────────────────────────────────────────────────

function generateQuizVisuals(lessonTitle, part) {
  const q1 = part.quiz_questions?.[0];
  const q2 = part.quiz_questions?.[1];
  const options = (q1?.options?.choices || []).slice(0, 4);
  const choiceLabels = options.map((choice, i) => `${String.fromCharCode(65 + i)}. ${clampText(choice, 28)}`);

  const scenes = [
    scene(0, 'draw_text', {
      content: truncateWords(part.title || 'Knowledge Check', 5),
      position: [400, 42],
      style: { fontSize: 24, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' },
    }),
    scene(4, 'draw_badge', {
      content: 'Quiz', position: [42, 24],
      style: { bg: '#0f766e', color: '#fff', fontSize: 15 },
    }),
    scene(8, 'draw_callout', {
      content: clampText(q1?.question_text || `Which idea best captures ${lessonTitle}?`, 140),
      position: [110, 96], width: 580,
      style: { bg: '#eff6ff', stroke: '#60a5fa', color: '#1e3a8a' },
    }),
    scene(14, 'draw_rect', {
      x: 70, y: 206, width: 300, height: 74,
      label: choiceLabels[0] || 'A. First option',
      style: { fill: '#f8fafc', stroke: '#2563eb', strokeWidth: 2, rx: 12 },
    }),
    scene(19, 'draw_rect', {
      x: 430, y: 206, width: 300, height: 74,
      label: choiceLabels[1] || 'B. Second option',
      style: { fill: '#f8fafc', stroke: '#16a34a', strokeWidth: 2, rx: 12 },
    }),
    scene(24, 'draw_rect', {
      x: 70, y: 302, width: 300, height: 74,
      label: choiceLabels[2] || 'C. Third option',
      style: { fill: '#f8fafc', stroke: '#d97706', strokeWidth: 2, rx: 12 },
    }),
    scene(29, 'draw_rect', {
      x: 430, y: 302, width: 300, height: 74,
      label: choiceLabels[3] || 'D. Fourth option',
      style: { fill: '#f8fafc', stroke: '#7c3aed', strokeWidth: 2, rx: 12 },
    }),
    scene(34, 'clear', {}),
    scene(38, 'draw_text', {
      content: 'Fill in the blank',
      position: [400, 42],
      style: { fontSize: 24, color: '#1e3a5f', fontWeight: 'bold', textAnchor: 'middle' },
    }),
    scene(42, 'draw_callout', {
      content: clampText(q2?.question_text || 'Complete using the key concept from the lesson.', 150),
      position: [96, 114], width: 608,
      style: { bg: '#fff7ed', stroke: '#fb923c', color: '#7c2d12' },
    }),
    scene(47, 'draw_badge', {
      content: `Hint: ${truncateWords(part.title || lessonTitle, 3)}`,
      position: [316, 232],
      style: { bg: '#2563eb', color: '#fff', fontSize: 15 },
    }),
    scene(51, 'draw_callout', {
      content: clampText(q2?.explanation || 'Think about the core concept and how it connects to the lesson.', 150),
      position: [130, 286], width: 540,
      style: { bg: '#f0fdf4', stroke: '#4ade80', color: '#14532d' },
    }),
  ];

  return fitSceneTimeline(scenes, Number(part.duration_seconds) || 55);
}

// ── AI caller ────────────────────────────────────────────────────────────────

function normalizeProvider(raw) {
  const p = String(raw || '').trim().toLowerCase();
  if (p === 'deepseek') return 'blaze';
  if (p === 'blaze' || p === 'blazeai') return 'blaze';
  if (p === 'blazeapi' || p === 'blaze-api' || p === 'api-blaze') return 'blazeapi';
  if (p === 'fastapi' || p === 'fast-api' || p === 'render') return 'fastapi';
  if (p === 'openrouter' || p === 'open-router' || p === 'or') return 'openrouter';
  return null;
}

/** Resolve the model id for API calls from user selection + provider. */
function resolveModel(aiProvider, analysisModel) {
  const provider = normalizeProvider(aiProvider) || 'openrouter';
  if (provider === 'openrouter') {
    return resolveOpenRouterModel(analysisModel);
  }
  const { defaultDeepModel } = getBlazeConfig();
  return resolveBlazeModel(analysisModel, defaultDeepModel);
}

export function resetAICircuit(aiProvider) {
  const key = normalizeProvider(aiProvider) || 'openrouter';
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
  const provider = normalizeProvider(aiProvider) || 'openrouter';
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

export async function callAIRace(prompt, maxTokens, timeoutMs = AI_TIMEOUT_MS, aiProvider = null, analysisModel = null) {
  if (process.env.DISABLE_AI_PLANNER === 'true') {
    throw new Error('AI planner disabled by configuration');
  }

  const preferredAI = normalizeProvider(aiProvider) || normalizeProvider(process.env.ACTIVE_LLM) || 'openrouter';
  const providerOrder = [preferredAI];

  // OpenRouter is intentionally self-contained: a free-model outage should be
  // reported and handled by the lesson-quality fallback, not silently route a
  // teacher's content through a different provider/model.
  if (preferredAI === 'blazeapi') {
    if (!shouldUseLocalPlanning('fastapi') && (process.env.FASTAPI_BASE_URL || process.env.FASTAPI_API_KEY)) {
      providerOrder.push('fastapi');
    }
  }

  let lastError;
  for (const providerName of providerOrder) {
    if (shouldUseLocalPlanning(providerName)) {
      continue;
    }

    const circuit = circuitState[providerName] || circuitState.default;
    const model = resolveModel(providerName, analysisModel);
    const hasExplicitModelSelection = Boolean(String(analysisModel || '').trim());

    if (!hasExplicitModelSelection && Date.now() < circuit.openUntil) {
      continue;
    }

    try {
      if (providerName === 'blazeapi') {
        return await callBlazeAPI(prompt, maxTokens, timeoutMs, model, hasExplicitModelSelection, circuit);
      }
      if (providerName === 'fastapi') {
        return await callFastAPI(prompt, maxTokens, timeoutMs, circuit);
      }
      if (providerName === 'openrouter') {
        return await callOpenRouter(prompt, maxTokens, timeoutMs, model, hasExplicitModelSelection, circuit);
      }

      // Legacy BlazeAI — now routes through BlazeAPI endpoint (set in .env BLAZE_BASE_URL)
      const cfg = getBlazeConfig();
      if (!cfg.apiKey) throw new Error('BLAZE_API_KEY not set');

      const preferred = workingBlazeModel || model || cfg.defaultModel;
      const modelsToTry = buildBlazeAPIModelChain(preferred);

      console.log(`[aiPlanner] BlazeAI → ${modelsToTry.join(' → ')} (max_tokens=${maxTokens}, timeout=${timeoutMs}ms)`);

      for (const m of modelsToTry) {
        try {
          const result = await callOpenAICompatible(cfg.baseURL, cfg.apiKey, m, prompt, maxTokens, timeoutMs);
          lastAiVia = 'blaze';
          circuit.openUntil = 0;
          circuit.reason = '';
          aiCircuitOpenUntil = 0;
          aiCircuitReason = '';
          workingBlazeModel = m;
          return result;
        } catch (error) {
          const msg = String(error?.message || error || '');
          const isGatewayError = /502|503|gateway|upstream|retrying|sentinel|unavailable/i.test(msg);
          lastError = error;
          if (!isGatewayError) {
            console.error(`[aiPlanner] BlazeAI model "${m}" non-retryable error: ${describeAIError(error)}`);
            break;
          }
          console.warn(`[aiPlanner] BlazeAI model "${m}" failed: ${describeAIError(error)} — trying next model`);
        }
      }

      try {
        console.warn(`[aiPlanner] All BlazeAI models failed, trying FastAPI fallback...`);
        const result = await callFastAPICompatible(prompt, maxTokens, 120_000);
        lastAiVia = 'blaze';
        circuit.openUntil = 0;
        circuit.reason = '';
        aiCircuitOpenUntil = 0;
        aiCircuitReason = '';
        return result;
      } catch (fastapiError) {
        console.error(`[aiPlanner] FastAPI fallback also failed: ${describeAIError(fastapiError)}`);
        lastError = fastapiError;
      }

      if (!hasExplicitModelSelection && shouldTripCircuit(lastError)) {
        const limits = PROVIDER_LIMITS.blaze;
        circuit.openUntil = Date.now() + limits.cooldown;
        circuit.reason = describeAIError(lastError);
        aiCircuitOpenUntil = circuit.openUntil;
        aiCircuitReason = circuit.reason;
      }
      throw new Error(`BlazeAI unavailable: ${describeAIError(lastError)}`);
    } catch (error) {
      const message = String(error?.message || error || '');
      const isRetryable = /402|429|credit|quota|rate.*limit|insufficient|unavailable|gateway|502|503|upstream|retrying|sentinel/i.test(message);
      lastError = error;
      if (!isRetryable || providerName === providerOrder[providerOrder.length - 1]) {
        break;
      }
      console.warn(`[aiPlanner] ${providerName} failed (${describeAIError(error)}); trying next configured provider...`);
    }
  }

  throw lastError || new Error(`AI provider unavailable: ${preferredAI}`);
}

/** Primary AI provider: route all calls through the Render-hosted FastAPI service. */
async function callFastAPI(prompt, maxTokens, timeoutMs, circuit) {
  console.log(`[aiPlanner] FastAPI → (max_tokens=${maxTokens}, timeout=${timeoutMs}ms)`);
  try {
    const result = await callFastAPICompatible(prompt, maxTokens, timeoutMs);
    lastAiVia = 'fastapi';
    circuit.openUntil = 0;
    circuit.reason = '';
    aiCircuitOpenUntil = 0;
    aiCircuitReason = '';
    return result;
  } catch (error) {
    const limits = PROVIDER_LIMITS.blaze;
    circuit.openUntil = Date.now() + limits.cooldown;
    circuit.reason = describeAIError(error);
    aiCircuitOpenUntil = circuit.openUntil;
    aiCircuitReason = circuit.reason;
    throw new Error(`FastAPI unavailable: ${describeAIError(error)}`);
  }
}

/** Primary AI provider: route all calls through OpenRouter (OpenAI-compatible). */
async function callOpenRouter(prompt, maxTokens, timeoutMs, model, hasExplicitModelSelection, circuit) {
  const cfg = getOpenRouterConfig();
  if (!cfg.apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const preferred = workingOpenRouterModel || model || OPENROUTER_DEFAULT_MODEL;
  const modelsToTry = [...new Set([preferred, OPENROUTER_DEFAULT_MODEL].filter(Boolean))];

  console.log(`[aiPlanner] OpenRouter → ${modelsToTry.join(' → ')} (max_tokens=${maxTokens}, timeout=${timeoutMs}ms)`);

  let lastError;
  for (const m of modelsToTry) {
    try {
      const result = await callOpenAICompatible(cfg.baseURL, cfg.apiKey, m, prompt, maxTokens, timeoutMs);
      lastAiVia = 'openrouter';
      circuit.openUntil = 0;
      circuit.reason = '';
      aiCircuitOpenUntil = 0;
      aiCircuitReason = '';
      workingOpenRouterModel = m;
      return result;
    } catch (error) {
      const msg = String(error?.message || error || '');
      const isGatewayError = /402|502|503|gateway|upstream|retrying|sentinel|unavailable|429|insufficient.*(?:credit|quota)|rate.*limit|too.*many.*request/i.test(msg);
      lastError = error;

      if (isGatewayError) {
        console.warn(`[aiPlanner] OpenRouter model "${m}" failed: ${describeAIError(error)} — trying next`);
      } else {
        console.error(`[aiPlanner] OpenRouter model "${m}" non-retryable error: ${describeAIError(error)}`);
        break;
      }
    }
  }

  if (!hasExplicitModelSelection && shouldTripCircuit(lastError)) {
    const limits = PROVIDER_LIMITS.blazeapi;
    circuit.openUntil = Date.now() + limits.cooldown;
    circuit.reason = describeAIError(lastError);
    aiCircuitOpenUntil = circuit.openUntil;
    aiCircuitReason = circuit.reason;
  }
  throw new Error(`OpenRouter unavailable: ${describeAIError(lastError)}`);
}

async function callBlazeAPI(prompt, maxTokens, timeoutMs, model, hasExplicitModelSelection, circuit) {
  const cfg = getBlazeAPIConfig();
  if (!cfg.apiKey) throw new Error('BLAZEAPI_API_KEY not set');

  // Build the try-order: cached working model first, then requested model, then fallback chain
  const preferred = workingBlazeAPIModel || model || cfg.defaultModel;
  const modelsToTry = buildBlazeAPIModelChain(preferred);

  console.log(`[aiPlanner] BlazeAPI → ${modelsToTry.join(' → ')} (max_tokens=${maxTokens}, timeout=${timeoutMs}ms)`);

  let lastError;
  for (const m of modelsToTry) {
    try {
      const result = await callOpenAICompatible(cfg.baseURL, cfg.apiKey, m, prompt, maxTokens, timeoutMs);
      // Success — reset circuit, cache model, return
      lastAiVia = 'blazeapi';
      circuit.openUntil = 0;
      circuit.reason = '';
      aiCircuitOpenUntil = 0;
      aiCircuitReason = '';
      workingBlazeAPIModel = m;
      return result;
    } catch (error) {
      const msg = String(error?.message || error || '');
      const isGatewayError = /502|503|gateway|upstream|retrying|sentinel|unavailable/i.test(msg);
      lastError = error;

      if (isGatewayError) {
        console.warn(`[aiPlanner] BlazeAPI model "${m}" failed: ${describeAIError(error)} — trying next model`);
      } else {
        console.error(`[aiPlanner] BlazeAPI model "${m}" non-retryable error: ${describeAIError(error)}`);
        break;
      }
    }
  }

  // Last resort: try through FastAPI service (Render) — may have different config
  try {
    console.warn(`[aiPlanner] All BlazeAPI models failed, trying FastAPI fallback...`);
    const result = await callFastAPICompatible(prompt, maxTokens, 120_000);
    lastAiVia = 'blazeapi';
    circuit.openUntil = 0;
    circuit.reason = '';
    aiCircuitOpenUntil = 0;
    aiCircuitReason = '';
    return result;
  } catch (fastapiError) {
    console.error(`[aiPlanner] FastAPI fallback also failed: ${describeAIError(fastapiError)}`);
    lastError = fastapiError;
  }

  if (!hasExplicitModelSelection && shouldTripCircuit(lastError)) {
    const limits = PROVIDER_LIMITS.blazeapi;
    circuit.openUntil = Date.now() + limits.cooldown;
    circuit.reason = describeAIError(lastError);
    aiCircuitOpenUntil = circuit.openUntil;
    aiCircuitReason = circuit.reason;
  }
  throw new Error(`BlazeAPI unavailable: ${describeAIError(lastError)}`);
}

/** Last-resort AI fallback: route through the FastAPI service (Render). */
async function callFastAPICompatible(prompt, maxTokens, timeoutMs) {
  const baseURL = (process.env.FASTAPI_BASE_URL || 'https://the-teacher.onrender.com').replace(/\/+$/, '');
  const url = `${baseURL}/ai/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const systemPrompt = `You are an expert curriculum designer producing accurate educational content.

ABSOLUTE RULES:
1. ACCURACY: Only use facts from the source material. NEVER invent information.
2. NO REPETITION: Never repeat the same sentence or idea twice.
3. VARIED LANGUAGE: Use diverse vocabulary.
4. COMPLETENESS: Cover every concept from the source thoroughly.
5. Return raw valid JSON only. No markdown fences, no explanation outside the JSON.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_prompt: systemPrompt,
        max_tokens: maxTokens,
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`FastAPI ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.content;
    if (!content) throw new Error('FastAPI returned empty response');

    // FastAPI returns raw content, not wrapped in chat.completion format
    const sentinel = detectGatewaySentinel(content);
    if (sentinel) throw new Error(`FastAPI gateway sentinel: ${sentinel}`);

    const parsed = parseJSON(content);
    console.log(`[aiPlanner] <<< OK FastAPI model=${data.model} promptLen=${prompt.length}`);
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAICompatible(baseURL, apiKey, model, prompt, maxTokens, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const isDeepSeek = baseURL.includes('deepseek') || model.includes('deepseek');
  const isThinkingModel = isDeepSeek || model.includes('thinking') || model.includes('reasoner');

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

  async function tryRequest(useSystemMsg) {
    const msgs = useSystemMsg
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ]
      : [
          { role: 'user', content: `[System Instructions]\n${systemPrompt}\n\n${prompt}` },
        ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      // OpenRouter forwards this OpenAI-compatible constraint to supported
      // models. It prevents free models from replying with an explanation of
      // the requested JSON instead of the lesson object itself.
      body: JSON.stringify({
        model,
        messages: msgs,
        temperature,
        max_tokens: tokenBudget,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error(`[aiPlanner] API error ${response.status} from ${url}: ${errText.slice(0, 300)}`);
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }

    return readChatCompletion(response);
  }

  let data;
  let rawContent;
  try {
    data = await tryRequest(true);
    rawContent = data.choices?.[0]?.message?.content;
    const sentinel = detectGatewaySentinel(rawContent);
    if (sentinel) {
      console.error(`[aiPlanner] gateway sentinel from ${model}: "${sentinel}"`);
      throw new Error(`Upstream gateway error (model=${model}): ${sentinel}`);
    }
    const parsed = parseJSON(rawContent);
    console.log(`[aiPlanner] <<< OK ${model} finish=${data.choices?.[0]?.finish_reason} usage=${JSON.stringify(data.usage || {})}`);
    return parsed;
  } catch (err) {
    if (err.message.includes('Something answered that wasn') && !err._retried) {
      console.log(`[aiPlanner] Model ${model} rejected system message, retrying without...`);
      err._retried = true;
      data = await tryRequest(false);
      rawContent = data.choices?.[0]?.message?.content;
      const sentinel = detectGatewaySentinel(rawContent);
      if (sentinel) throw new Error(`Upstream gateway error (model=${model}): ${sentinel}`);
      const parsed = parseJSON(rawContent);
      console.log(`[aiPlanner] <<< OK ${model} finish=${data.choices?.[0]?.finish_reason} usage=${JSON.stringify(data.usage || {})}`);
      return parsed;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Text utilities ───────────────────────────────────────────────────────────

// Read an OpenAI-compatible chat.completion response that may arrive either as
// a single JSON body OR as a Server-Sent-Events stream. The BLAZE gateway sends
// SSE for slower models (e.g. moonshotai/kimi-k2.6): one or more `: waiting…`
// heartbeat comment lines, then `data:` lines, then `data: [DONE]`. A direct
// `response.json()` throws on the leading `:`. We handle both transports:
//   • plain JSON  → parse as-is
//   • SSE non-streamed → the single `data:` line carries the COMPLETE object
//   • SSE delta-streamed → accumulate choices[].delta.content into a message
async function readChatCompletion(response) {
  const ctype = (response.headers?.get?.('content-type') || '').toLowerCase();
  const body = await response.text();

  const looksSSE = ctype.includes('event-stream')
    || /^\s*(?::|data:)/m.test(body);
  if (!looksSSE) {
    return JSON.parse(body);
  }

  // Collect every `data:` payload (ignoring `:` heartbeat comments and [DONE]).
  const payloads = [];
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^data:\s?(.*)$/);
    if (!m) continue;
    const chunk = m[1].trim();
    if (!chunk || chunk === '[DONE]') continue;
    try { payloads.push(JSON.parse(chunk)); } catch { /* skip partial */ }
  }
  if (!payloads.length) {
    throw new Error('Empty SSE stream (no parseable data: payloads)');
  }

  // Non-streamed-over-SSE: the last payload already has a full message.
  const full = [...payloads].reverse().find(
    (p) => p?.choices?.[0]?.message?.content != null,
  );
  if (full) return full;

  // Delta-streamed: stitch the incremental content together.
  let content = '';
  let finish_reason = null;
  let template = null;
  for (const p of payloads) {
    const ch = p?.choices?.[0];
    if (!ch) continue;
    if (typeof ch.delta?.content === 'string') content += ch.delta.content;
    if (ch.finish_reason) finish_reason = ch.finish_reason;
    if (!template) template = p;
  }
  const usage = payloads[payloads.length - 1]?.usage || {};
  return {
    ...(template || {}),
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason }],
    usage,
  };
}

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
    programming: /\b(algorithm|code|programming|software|data structure|array|variable|class|object|database|api|compiler|syntax|devops|docker|kubernetes|deployment|server|backend|frontend|pipeline|git|linux|nginx|blockchain|validator|ledger|consensus|distributed|transaction|protocol|cache|service|client|router|browser|http|https|web request|request-response|request response)\b/g,
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

// Patterns that indicate an upstream GATEWAY status/error message was returned
// in place of real model output. If any matches, the content is not a lesson.
const GATEWAY_SENTINEL_PATTERNS = [
  /retrying with a simplified prompt/i,
  /upstream failure/i,
  /is retrying/i,
  /upstream error/i,
  /\bblazeai\b.*\b(retry|failed|error|unavailable)\b/i,
  /the (model|provider|upstream) (is|was) (unavailable|overloaded|busy)/i,
  /please try again (later|in a moment)/i,
  /rate.?limit(ed|ing)?/i,
  /\b(grok|qwen|deepseek|gpt)[\w.\- ]*\b(is|was) (retrying|unavailable|failing)/i,
];

/**
 * Returns the offending snippet if `raw` looks like a gateway status message
 * rather than a real (JSON) model response, else null.
 */
function detectGatewaySentinel(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;
  // Real lesson output is JSON — it starts with { or [. A gateway status line
  // is prose. Only scrutinise non-JSON-leading content for sentinels.
  const looksJson = /^[\[{]/.test(text) || /```/.test(text) || text.includes('{');

  // If it looks like JSON, don't flag it as a sentinel
  if (looksJson && text.length > 100) return null;

  const head = text.slice(0, 400);
  for (const re of GATEWAY_SENTINEL_PATTERNS) {
    if (re.test(head)) return head.replace(/\s+/g, ' ').slice(0, 160);
  }
  // Pure prose with no JSON object at all and no useful structure → suspicious.
  if (!looksJson && text.length < 500 && /\b(retry|failure|error|unavailable|upstream)\b/i.test(text)) {
    return head.replace(/\s+/g, ' ').slice(0, 160);
  }
  return null;
}

/**
 * Strip any gateway-status sentences that may have leaked into narration text.
 * Used as a final safety net before persisting lesson content.
 */
function stripGatewaySentinels(text) {
  let s = String(text || '');
  if (!s) return s;
  const sentences = s.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((sent) => !GATEWAY_SENTINEL_PATTERNS.some((re) => re.test(sent)));
  s = kept.join(' ').trim();
  return s;
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


