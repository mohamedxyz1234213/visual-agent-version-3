// -----------------------------------------------------------------------------
// AI Output Validation Layer
// -----------------------------------------------------------------------------
// Validates and sanitizes AI-generated board_scenes and lesson plans before
// they reach the rendering pipeline. Catches malformed data, missing fields,
// and quality issues early so the whiteboard never renders garbage.
// -----------------------------------------------------------------------------

import { normalizeIntent } from './sceneComposer.js';

const VALID_INTENTS = new Set([
  'define', 'compare', 'process', 'hierarchy', 'timeline', 'cause',
  'data', 'cluster', 'cycle', 'example', 'recap', 'formula', 'map',
]);

// Generic/placeholder text the AI sometimes emits that we should reject.
const PLACEHOLDER_PATTERNS = [
  /^(lorem ipsum|placeholder|example text|sample|todo|tbd|n\/a)$/i,
  /^(point|step|item|concept|topic)\s*\d*$/i,
  /^(text here|content here|add .* here)$/i,
  /^\.+$/,
  /^-+$/,
];

function isPlaceholder(text) {
  const t = String(text || '').trim();
  if (!t || t.length < 2) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(t));
}

// ── Drawn-text length policy ────────────────────────────────────────────────
// Text DRAWN on the board must read as a keyword anchor, not a paragraph — the
// teaching lives in `say` (the voice), which is preserved in full elsewhere.
// We cap drawn slots so the board stays scannable and overlap-free:
//   ANCHOR  — titles, points, labels, headlines (≈3-8 words)
//   LINE    — brief supporting clauses (details, definitions, one-line subs)
const ANCHOR_MAX = 48;   // keyword anchors
const LINE_MAX = 90;     // short supporting clauses

const ANCHOR_KEYS = /^(title|label|name|symbol|term|headline|head|caption|tag|key|word|point|step|item)$/i;
const LINE_KEYS = /^(detail|text|sub|meaning|note|desc|description|content|body|definition|explanation|value|answer)$/i;

function capForKey(key) {
  if (LINE_KEYS.test(key)) return LINE_MAX;
  if (ANCHOR_KEYS.test(key)) return ANCHOR_MAX;
  return ANCHOR_MAX; // unknown drawn keys default to keyword-anchor length
}

function cleanString(value, maxLen = 200) {
  const s = String(value || '').trim().replace(/\s+/g, ' ');
  if (isPlaceholder(s)) return '';
  return s.slice(0, maxLen);
}

// `anchor: true` enforces the drawn-text policy: plain strings + title-like
// object keys become keyword anchors, detail-like keys get a short line. When
// false (e.g. key_concepts), the explicit maxLen is used verbatim.
function cleanArray(arr, maxItems = 8, maxLen = 120, anchor = false) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (item && typeof item === 'object') {
        // Preserve {title, detail} shapes after cleaning their fields
        const cleaned = {};
        for (const [k, v] of Object.entries(item)) {
          if (typeof v === 'string') {
            const cap = anchor ? capForKey(k) : maxLen;
            const cv = cleanString(v, cap);
            if (cv) cleaned[k] = cv;
          } else if (Array.isArray(v)) {
            cleaned[k] = cleanArray(v, maxItems, maxLen, anchor);
          } else if (v != null) {
            cleaned[k] = v;
          }
        }
        return Object.keys(cleaned).length ? cleaned : null;
      }
      return cleanString(item, anchor ? ANCHOR_MAX : maxLen) || null;
    })
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Validate and clean a single board scene.
 * Returns a cleaned scene or null if it's unsalvageable.
 */
export function validateBoardScene(scene) {
  if (!scene || typeof scene !== 'object') return null;

  const intent = normalizeIntent(scene.intent || scene.type);
  if (!VALID_INTENTS.has(intent)) return null;

  const cleaned = { intent };

  // Goal/title
  const goal = cleanString(scene.goal || scene.objective || scene.title, 120);
  if (goal) cleaned.goal = goal;
  const title = cleanString(scene.title, 80);
  if (title) cleaned.title = title;

  // Focus hint for camera zoom
  const focus = cleanString(scene.focus, 80);
  if (focus) cleaned.focus = focus;

  // Spoken teacher line for this beat. This is NARRATION (the voice), not drawn
  // on the board, so it is preserved in full — not capped to the short keyword
  // length the drawn slots use. The narration assembler joins these in order to
  // form the part's spoken script, and the composer uses each beat's word count
  // to time the drawing so the board draws exactly what the voice is saying.
  const say = cleanString(scene.say || scene.narration || scene.spoken, 800);
  if (say) cleaned.say = say;

  const segment = cleanString(scene.segment, 20);
  if (segment) cleaned.segment = segment;

  // Copy over all slot-bearing fields
  // ANCHOR fields are keyword headlines/labels; LINE fields are brief one-line
  // supporting clauses. Both are DRAWN, so both are short — the full teaching is
  // in `say`. `formula` keeps a longer cap (equations can be wide but single-line).
  const anchorSingles = [
    'headline', 'statement', 'concept', 'center', 'root', 'effect', 'subject',
    'object_type', 'low_label', 'high_label', 'x_label', 'y_label', 'start',
    'roof', 'before_title', 'after_title', 'left_title', 'right_title',
    'pros_title', 'cons_title', 'transform',
    // Names a pre-built scientific figure (atom, dna, neuron, cell, wave, gear,
    // battery, magnet, field) for the labeled-diagram templates to render.
    'diagram', 'shape', 'figure',
  ];
  const lineSingles = ['definition', 'sub', 'outcome', 'takeaway', 'answer'];
  const wideSingles = { formula: 120, problem: 120, question: 120 };
  for (const field of anchorSingles) {
    if (scene[field] != null) {
      const val = cleanString(scene[field], ANCHOR_MAX);
      if (val) cleaned[field] = val;
    }
  }
  for (const field of lineSingles) {
    if (scene[field] != null) {
      const val = cleanString(scene[field], LINE_MAX);
      if (val) cleaned[field] = val;
    }
  }
  for (const [field, cap] of Object.entries(wideSingles)) {
    if (scene[field] != null) {
      const val = cleanString(scene[field], cap);
      if (val) cleaned[field] = val;
    }
  }

  // Array slot fields — all drawn, so cleaned under the anchor policy:
  // title-like keys become keyword anchors, detail-like keys a short line.
  const arrayFields = [
    'points', 'items', 'steps', 'children', 'events', 'links', 'cards',
    'terms', 'satellites', 'stages', 'tiers', 'pillars', 'annotations',
    'labels', 'corners', 'stats', 'tiles', 'beats', 'columns', 'cells',
    'markers', 'layers', 'branches', 'notes', 'pros', 'cons', 'before',
    'after', 'left', 'right', 'shared', 'problems', 'solutions', 'inputs',
    'outputs', 'milestones', 'phases', 'nodes', 'features', 'sectors',
    'dependencies', 'perspectives', 'tasks', 'levels', 'causes', 'values',
    'strengths', 'weaknesses', 'opportunities', 'threats', 'definition_points',
    'example_points',
  ];
  for (const field of arrayFields) {
    if (scene[field] != null) {
      const arr = cleanArray(scene[field], 8, LINE_MAX, true);
      if (arr.length) cleaned[field] = arr;
    }
  }

  // Numeric data for graphs
  if (Array.isArray(scene.values)) {
    cleaned.values = scene.values.map(Number).filter((n) => !Number.isNaN(n)).slice(0, 12);
  }
  if (scene.graph_type) cleaned.graph_type = scene.graph_type;
  if (Array.isArray(scene.plot_points)) cleaned.plot_points = scene.plot_points.slice(0, 24);

  // A scene must have at least SOME content beyond the intent
  const contentKeys = Object.keys(cleaned).filter((k) => !['intent', 'goal', 'title', 'focus'].includes(k));
  const hasArrayContent = arrayFields.some((f) => cleaned[f]?.length);
  if (!contentKeys.length && !hasArrayContent && !goal && !title) return null;

  return cleaned;
}

/**
 * Validate an array of board scenes for a part.
 * Removes invalid scenes and ensures variety.
 */
export function validateBoardScenes(scenes) {
  if (!Array.isArray(scenes)) return [];

  const validated = scenes
    .map(validateBoardScene)
    .filter(Boolean);

  if (!validated.length) return [];

  // Ensure intent variety — avoid 3+ identical intents in a row
  const result = [];
  let lastIntent = null;
  let sameCount = 0;

  for (const scene of validated) {
    if (scene.intent === lastIntent) {
      sameCount++;
      // Allow up to 2 consecutive same intents
      if (sameCount >= 2) continue;
    } else {
      sameCount = 0;
      lastIntent = scene.intent;
    }
    result.push(scene);
  }

  return result;
}

/**
 * Validate a complete lesson part.
 */
export function validatePart(part) {
  if (!part || typeof part !== 'object') return null;

  const cleaned = { ...part };

  // Validate board_scenes if present
  if (Array.isArray(part.board_scenes)) {
    cleaned.board_scenes = validateBoardScenes(part.board_scenes);
  }

  // Ensure required fields
  cleaned.title = cleanString(part.title, 120) || 'Lesson Part';
  cleaned.narration = String(part.narration || '').trim();

  // Validate duration
  const duration = Number(part.duration_seconds);
  cleaned.duration_seconds = (duration >= 30 && duration <= 1200) ? duration : 300;

  // Clean key concepts
  if (Array.isArray(part.key_concepts)) {
    cleaned.key_concepts = cleanArray(part.key_concepts, 8, 60);
  }

  return cleaned;
}

/**
 * Validate a complete lesson plan.
 * Returns { valid: boolean, plan: cleanedPlan, issues: string[] }
 */
export function validateLessonPlan(plan) {
  const issues = [];

  if (!plan || typeof plan !== 'object') {
    return { valid: false, plan: null, issues: ['Plan is not an object'] };
  }

  if (!Array.isArray(plan.parts) || !plan.parts.length) {
    return { valid: false, plan: null, issues: ['Plan has no parts'] };
  }

  const cleaned = {
    title: cleanString(plan.title, 150) || 'Lesson',
    subject: cleanString(plan.subject, 150) || '',
    summary: String(plan.summary || '').trim(),
    parts: [],
  };

  for (const part of plan.parts) {
    const validPart = validatePart(part);
    if (validPart) {
      cleaned.parts.push(validPart);
    } else {
      issues.push(`Dropped invalid part: ${part?.title || 'untitled'}`);
    }
  }

  if (!cleaned.parts.length) {
    return { valid: false, plan: null, issues: [...issues, 'All parts were invalid'] };
  }

  // Quality checks
  const contentParts = cleaned.parts.filter((p) => p.part_type !== 'quiz');
  const scenesWithBoards = contentParts.filter((p) => p.board_scenes?.length);

  if (contentParts.length && !scenesWithBoards.length) {
    issues.push('No content parts have board_scenes — visuals will use fallback');
  }

  return {
    valid: cleaned.parts.length > 0,
    plan: cleaned,
    issues,
  };
}

export { isPlaceholder, cleanString, cleanArray };
