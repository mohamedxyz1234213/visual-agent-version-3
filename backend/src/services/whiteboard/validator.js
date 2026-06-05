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
  /^\[object object\]$/i,
  /^object object$/i,
  /^(point|step|item|concept|topic)\s*\d*$/i,
  /^(text here|content here|add .* here)$/i,
  /^\.+$/,
  /^-+$/,
];

const PROMPT_CONTROL_PATTERNS = [
  /\bshould be (?:explained|taught|shown|demonstrated|introduced|covered)\b/i,
  /\bthis lesson will\b/i,
  /\bthis (?:part|section|beat) (?:will|aims to|seeks to)\b/i,
  /\bso the learner can\b/i,
  /\bmove from definition to mechanism\b/i,
  /\bone coherent explanation\b/i,
  /\bnot in isolation\b/i,
  /\btoday we (?:will|are going to|learn)\b/i,
  /\bin this (?:lesson|part|section|beat)\b/i,
  /\bas (?:we|a reminder|you can see|mentioned|noted|you'll see)\b/i,
  /\bmore precisely,?\b/i,
  /\bto put it (?:simply|another way),?\b/i,
  /\bin other words,?\b/i,
  /\baccording to (?:the )?(?:source|document|material)\b/i,
  /\bbased on (?:the )?(?:source|document|material)\b/i,
  /\bfrom the source material\b/i,
  /\blet me (?:explain|show|walk you through|introduce)\b/i,
  /\bnote that\b/i,
  /\bdecorative motion\b/i,
  /\bno teaching purpose\b/i,
  /\bplaceholder label\b/i,
  /\bgeneric placeholder\b/i,
  /\bsame intent sequence\b/i,
  /\bby the end of (?:this|the) (?:lesson|part|section)\b/i,
  /\bunderstanding .* is essential\b/i,
  /\bthe (?:key|main|important) (?:point|idea|thing|takeaway) is\b/i,
  /\bspecifically,?\s+(?:the|they|we|this)\b/i,
  /\b(skipped|missing) (?:steps?|algebra|derivations?)\b/i,
  /\b(?:text|bullet) walls?\b/i,
  /\bdecoration(?:al)?\b/i,
  /\bfade[ -]in\b/i,
  /\bpre-?appeared\b/i,
  /\bvisual (?:grammar|playbook)\b/i,
  /\bpre-?built templates?\b/i,
  /\bteacher[- ]like pacing\b/i,
  /\btutor (?:identity|philosophy)\b/i,
  /\b(?:5|five) (?:unrelated )?concepts\b/i,
  /\bhidden (?:prerequisite|gap)\b/i,
];

// Whole-sentence meta patterns — these drop the ENTIRE sentence from `say` if
// it matches. Broader than the inline list: catches the whole "this section
// will explain X to the learner" family of meta-sentences the AI emits when
// it's parroting the system prompt instead of actually teaching.
const META_SENTENCE_PATTERNS = [
  /^(today|now|here|in this|as we|to begin|let's begin)\b.*\b(we will|we'll|let us|i will|i'll|aim to|seek to|going to)\b/i,
  /^(specifically,?\s+)\b/i,
  /^(lorem ipsum|placeholder text)\b/i,
  /^(the learner|students?|readers?)\s+(?:will|should|need to|must|can)\b/i,
  /^(is a central (?:concept|idea) in (?:this|the) (?:lesson|part|section))\b/i,
  /^(understanding .* (?:supports?|ties? (?:into|together)) the (?:rest|whole) of (?:the )?(?:topic|lesson))\b/i,
  /^(to elaborate,? this (?:document|lesson|section|part) (?:covers?|explains?|introduces?|describes?|presents?))\b/i,
  /^(how (?:a |the )?.+ (?:begins?|starts?|opens?) with the core idea|then breaks? the topic|then finishes? with application)\b/i,
  /^(.+ )?begins with the core idea,? then breaks? the topic into its main components,? then finishes? with application and review\.?$/i,
  /^(this (?:document|lesson|section|part) (?:covers?|explains?|introduces?|describes?|presents?|outlines?))\b/i,
  /^(the (?:goal|aim|purpose) (?:of (?:this|the))? (?:lesson|part|section|beat) is)\b/i,
  /^(this (?:lesson|part|section|beat) (?:aims to|seeks to|will|is designed to|is meant to))\b/i,
  /^(by the end of (?:this|the)? ?(?:lesson|part|section))\b/i,
  /^(let'?s (?:start|begin|explore|dive in|look at))\b/i,
  /^(note that|keep in mind|remember that|as a reminder)\b/i,
  /^(according to|based on|per) (?:the )?(?:source|document|material|passage)\b/i,
  /^(in (?:this|the) (?:following|next) (?:section|part|beat|segment))\b/i,
  /^(we (?:will|are going to|shall) (?:now )?(?:see|look|examine|explore|discuss|cover|introduce))\b/i,
  /^(first,? let'?s|first,? we)\b.*\b(see|look|examine|introduce|define)\b/i,
  /^(now (?:that|let's))\b/i,
  /^(to (?:summarize|conclude|wrap up|recap))\b/i,
  /^(in (?:summary|conclusion|short))\b/i,
  /^(let me (?:explain|show|introduce|walk))\b/i,
  /^(understanding .* is essential)\b/i,
  /^(the (?:key|main|important) (?:point|idea|takeaway) is)\b/i,
  /^(this (?:shows|demonstrates|illustrates) (?:that|how))\b/i,
  /^(a (?:good|complete) explanation of)\b/i,
  /^(this (?:means|is) that)\b/i,
  /^(so,?\s+the learner)\b/i,
  /^(consequently|therefore),?\s+the (?:learner|student)\b/i,
  /^(moving (?:on|forward))\b/i,
  /^(with (?:that|this) in mind)\b/i,
  /^(it'?s (?:important|worth noting) (?:to|that))\b/i,
  /^((?:step|point|item|concept) \d+)$/i,
  /^((?:definition|explanation|description):)$/i,
];

function isPlaceholder(text) {
  const t = String(text || '').trim();
  if (!t || t.length < 2) return true;
  return PLACEHOLDER_PATTERNS.some((re) => re.test(t));
}

function displayText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(displayText).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    return value.title || value.text || value.label || value.name || value.term
      || value.symbol || value.meaning || value.detail || value.value || value.content || '';
  }
  return '';
}

// ── Drawn-text length policy ────────────────────────────────────────────────
// Text DRAWN on the board must read as a keyword anchor, not a paragraph — the
// teaching lives in `say` (the voice), which is preserved in full elsewhere.
// We cap drawn slots so the board stays scannable and overlap-free:
//   ANCHOR  — titles, points, labels, headlines (≈3-8 words)
//   LINE    — brief supporting clauses (details, definitions, one-line subs)
const ANCHOR_MAX = 48;   // keyword anchors
const LINE_MAX = 90;     // short supporting clauses
// Prose body fields (definitions, details, descriptions) are rendered into
// GROWABLE boxes — the template wraps them and `growBoxesToFitText` stretches
// the container to fit, so we keep the whole sentence instead of chopping it
// to a fragment. This is what kills the "first few words then nothing" collapse.
const PROSE_MAX = 240;

const ANCHOR_KEYS = /^(title|label|name|symbol|term|headline|head|caption|tag|key|word|point|step|item)$/i;
const LINE_KEYS = /^(detail|text|sub|meaning|note|desc|description|content|body|definition|explanation|value|answer)$/i;
// The subset of LINE keys that carry full explanatory sentences (vs. one-word
// values / short subs). These get the generous PROSE_MAX cap.
const PROSE_KEYS = /^(definition|explanation|detail|description|desc|body|content|note|meaning|text)$/i;

function capForKey(key) {
  if (PROSE_KEYS.test(key)) return PROSE_MAX;
  if (LINE_KEYS.test(key)) return LINE_MAX;
  if (ANCHOR_KEYS.test(key)) return ANCHOR_MAX;
  return ANCHOR_MAX; // unknown drawn keys default to keyword-anchor length
}

// Clip to `maxLen` chars WITHOUT slicing through a word — back up to the last
// space so a box never shows "…permeable membrane fro". No ellipsis: the box
// grows to fit, and `fitTextToSlots` adds an ellipsis only if the band is full.
function wordClip(s, maxLen) {
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? cut.slice(0, lastSpace) : cut).trim();
}

function cleanString(value, maxLen = 200) {
  const s = displayText(value).trim().replace(/\s+/g, ' ');
  if (isPlaceholder(s)) return '';
  if (PROMPT_CONTROL_PATTERNS.some((re) => re.test(s))) return '';
  // Drawn slot text (headline, definition, points, steps, columns, terms, …)
  // ALSO needs the meta-stripper. The AI parrots the same prompt-shaped
  // phrases into every field, not just `say` — "How X begins with the core
  // idea, then breaks the topic…" appearing as a `headline` or `points[0]`
  // is what fills the boxes with non-teaching scaffolding. Reject any slot
  // whose text is a meta-sentence; the template will fall back to its
  // concept-name anchor instead.
  if (isMetaSentence(s)) return '';
  // If the slot contains a meta-phrase embedded in longer text (e.g.
  // "In this lesson we will see that the CPU fetches instructions"), strip
  // the meta segment so what survives is teaching content only.
  const stripped = stripMetaClauses(s).trim();
  if (stripped && stripped !== s) return wordClip(stripped, maxLen);
  return wordClip(s, maxLen);
}

// Remove a meta-language clause from the start or middle of a string,
// returning the teaching-content portion. Used by cleanString when a drawn
// slot is mostly teaching but has a meta prefix/phrase glued on
// ("In this lesson we will see that the CPU fetches instructions" →
// "the CPU fetches instructions").
function stripMetaClauses(s) {
  let out = s;
  for (const re of META_SENTENCE_PATTERNS) {
    out = out.replace(re, ' ').replace(/\s+/g, ' ').trim();
  }
  for (const re of PROMPT_CONTROL_PATTERNS) {
    out = out.replace(re, ' ').replace(/\s+/g, ' ').trim();
  }
  return out;
}

/**
 * Strip every meta-language sentence out of a `say` value, then return what's
 * left. This is the primary defense against the AI producing prompt-shaped
 * narration ("In this section, we will explore how...") instead of actual
 * teaching sentences.
 *
 * Returns the cleaned `say` (or '' if nothing real survives). The caller can
 * check `cleaned.isMetaOnly` to know whether the AI was producing only meta
 * scaffolding and the scene should be rebuilt from source content instead.
 */
export function cleanSay(value, maxLen = 800) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return { text: '', isMetaOnly: true, metaRatio: 1, inputWordCount: 0 };

  const sentences = raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  if (!sentences.length) return { text: '', isMetaOnly: true, metaRatio: 1, inputWordCount: 0 };

  const realSentences = sentences.filter((s) => !isMetaSentence(s));
  const totalWords = raw.split(/\s+/).filter(Boolean).length;
  const metaWords = sentences
    .filter((s) => isMetaSentence(s))
    .reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0);
  const metaRatio = totalWords > 0 ? metaWords / totalWords : 0;
  const isMetaOnly = realSentences.length === 0 || metaRatio > 0.5;

  const rejoined = realSentences.join(' ').trim();
  if (!rejoined) return { text: '', isMetaOnly: true, metaRatio, inputWordCount: totalWords };

  return {
    text: rejoined.slice(0, maxLen),
    isMetaOnly,
    metaRatio,
    inputWordCount: totalWords,
  };
}

function isMetaSentence(sentence) {
  const s = String(sentence || '').trim();
  if (!s) return true;
  if (META_SENTENCE_PATTERNS.some((re) => re.test(s))) return true;
  // Also catch anything containing the inline prompt-control phrases even if
  // it's not a clean sentence-prefix match.
  if (PROMPT_CONTROL_PATTERNS.some((re) => re.test(s))) return true;
  // Whole-string placeholder check.
  if (isPlaceholder(s)) return true;
  return false;
}


// `anchor: true` enforces the drawn-text policy: plain strings + title-like
// object keys become keyword anchors, detail-like keys get a short line. When
// false (e.g. key_concepts), the explicit maxLen is used verbatim.
function cleanArray(arr, maxItems = 8, maxLen = 120, anchor = false) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      if (Array.isArray(item)) {
        const row = cleanArray(item, maxItems, maxLen, anchor);
        return row.length ? row : null;
      }
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
          } else if (v && typeof v === 'object') {
            const cap = anchor ? capForKey(k) : maxLen;
            const cv = cleanString(v, cap);
            if (cv) cleaned[k] = cv;
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

// Allowed modular block kinds the AI can ADD into a template's free space.
const ADD_KINDS = new Set(['callout', 'note', 'badge', 'arrow', 'figure', 'label', 'highlight', 'svg']);
// Named fragment categories the AI can REMOVE from a base template.
const REMOVE_CATEGORIES = new Set(['subtitle', 'decoration', 'background', 'connectors', 'labels']);
// Pre-built figures an `add:{kind:'figure'}` block may reference.
const ADD_FIGURES = new Set([
  'atom', 'dna', 'neuron', 'cell', 'wave', 'gear', 'battery', 'magnet', 'field',
  'arrow', 'star', 'check', 'cross', 'bulb', 'flask', 'cog', 'lock', 'globe',
]);
const TEMPLATE_ID_RE = /^[a-z0-9_]{2,64}$/i;

// Sanitize an AI-supplied SVG path `d` string into a SAFE, normalized path that
// fits a unit box [0..100, 0..100]. We tokenize into commands + numbers only —
// any other character (letters outside the command set, parentheses, quotes,
// angle brackets, `url(...)`, scripts) is dropped, so nothing executable or
// external can survive. Coordinates are clamped to the unit box; the composer
// then scales the unit path into the block's measured free region. Returns a
// normalized `d` string or null if nothing valid remains.
const PATH_CMDS = new Set('MLHVCSQTAZmlhvcsqtaz'.split(''));
function sanitizeSvgPath(d) {
  if (typeof d !== 'string') return null;
  if (d.length > 1200) d = d.slice(0, 1200);
  // Keep ONLY path commands, digits, sign, decimal point, comma and spaces.
  const cleaned = d.replace(/[^MLHVCSQTAZmlhvcsqtaz0-9eE,.\-+\s]/g, ' ');
  // Tokenize: each command letter, each number.
  const tokens = cleaned.match(/[MLHVCSQTAZmlhvcsqtaz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g);
  if (!tokens || !tokens.length) return null;
  const out = [];
  let nums = 0;
  for (const tk of tokens) {
    if (PATH_CMDS.has(tk)) {
      out.push(tk);
    } else {
      const n = Number(tk);
      if (!Number.isFinite(n)) continue;
      // Clamp every coordinate into the unit box so the path can never escape
      // its allotted region (the composer scales 0..100 → free rect).
      out.push(String(Math.max(0, Math.min(100, n))));
      nums++;
      if (nums > 400) break; // cap complexity
    }
  }
  if (!nums) return null;
  // Must start with a Move; if not, prepend one so the path is well-formed.
  if (!/^[Mm]/.test(out[0])) out.unshift('M');
  return out.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize the optional AI "pick + patch" fields on a scene.
 * Returns { template?, add?, remove? } — each present only if valid.
 */
function cleanTemplateEdit(scene) {
  const out = {};

  if (typeof scene.template === 'string') {
    const id = scene.template.trim();
    if (TEMPLATE_ID_RE.test(id)) out.template = id;
  }

  if (Array.isArray(scene.add)) {
    const blocks = [];
    for (const raw of scene.add) {
      if (!raw || typeof raw !== 'object') continue;
      const kind = typeof raw.kind === 'string' ? raw.kind.trim().toLowerCase() : '';
      if (!ADD_KINDS.has(kind)) continue;
      const block = { kind };
      const text = cleanString(raw.text || raw.label || raw.title, 140);
      if (text) block.text = text;
      // Optional placement hint: a coarse region the composer maps to free space.
      if (typeof raw.region === 'string') {
        const region = raw.region.trim().toLowerCase();
        if (/^(top|bottom|left|right|center|topleft|topright|bottomleft|bottomright)$/.test(region)) {
          block.region = region;
        }
      }
      if (kind === 'figure') {
        const fig = typeof raw.figure === 'string' ? raw.figure.trim().toLowerCase() : '';
        if (ADD_FIGURES.has(fig)) block.figure = fig;
      }
      if (kind === 'arrow' && typeof raw.dir === 'string') {
        const dir = raw.dir.trim().toLowerCase();
        if (/^(up|down|left|right)$/.test(dir)) block.dir = dir;
      }
      if (kind === 'svg') {
        const safe = sanitizeSvgPath(raw.path || raw.d);
        if (safe) block.path = safe;
      }
      // A figure/arrow/svg block carries geometry; text-only blocks need text.
      if (block.text || kind === 'figure' || kind === 'arrow' || (kind === 'svg' && block.path)) blocks.push(block);
      if (blocks.length >= 4) break;
    }
    if (blocks.length) out.add = blocks;
  }

  if (Array.isArray(scene.remove)) {
    const cats = [];
    for (const raw of scene.remove) {
      if (typeof raw !== 'string') continue;
      const cat = raw.trim().toLowerCase();
      if (REMOVE_CATEGORIES.has(cat) && !cats.includes(cat)) cats.push(cat);
      if (cats.length >= 5) break;
    }
    if (cats.length) out.remove = cats;
  }

  return out;
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
  // on the board. We strip every meta-language sentence first (the AI parrots
  // the system prompt's "this lesson will explain..." phrasing back as content
  // if we don't), then keep what's left up to the cap. If stripping leaves
  // nothing real, the scene is marked `metaOnly` so upstream code can rebuild
  // it from source-grounded content instead of the AI's paraphrase.
  const sayRaw = scene.say || scene.narration || scene.spoken;
  const sayClean = cleanSay(sayRaw, 800);
  if (sayClean.text) cleaned.say = sayClean.text;
  if (sayClean.isMetaOnly) cleaned.metaOnly = true;

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
      const val = cleanString(scene[field], capForKey(field));
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

  // ---------------------------------------------------------------------------
  // AI "pick + patch" template editing.
  // The AI may name a base template by id and request modular edits. We carry
  // these through as sanitized hints; composeScene resolves/applies them and
  // re-runs the fit/overlap passes, so a bad edit can never break the board.
  // ---------------------------------------------------------------------------
  const tpl = cleanTemplateEdit(scene);
  if (tpl.template) cleaned.template = tpl.template;
  if (tpl.add) cleaned.add = tpl.add;
  if (tpl.remove) cleaned.remove = tpl.remove;

  // A scene must have at least SOME content beyond the intent
  const contentKeys = Object.keys(cleaned).filter((k) => !['intent', 'goal', 'title', 'focus'].includes(k));
  const hasArrayContent = arrayFields.some((f) => cleaned[f]?.length);
  if (!contentKeys.length && !hasArrayContent && !goal && !title) return null;

  return cleaned;
}

/**
 * Validate an array of board scenes for a part.
 * Removes invalid scenes, drops scenes whose `say` collapsed to meta-only
 * content, deduplicates consecutive scenes that open with the same boilerplate
 * (the "super duplicated" failure mode), and ensures intent variety.
 */
export function validateBoardScenes(scenes) {
  if (!Array.isArray(scenes)) return [];

  const validated = scenes
    .map(validateBoardScene)
    .filter(Boolean)
    // A scene that lost all its teaching text to the meta strip is a sign the
    // AI was producing only prompt-shaped content for this beat. Drop it
    // upstream code will regenerate from source content if needed.
    .filter((s) => !s.metaOnly);

  if (!validated.length) return [];

  // Cross-scene deduplication: if two consecutive scenes open with the same
  // first ~40 characters of normalized text, the second is a copy — drop it.
  // The user reported seeing the same opening sentence repeated across
  // beats; this catches both exact repeats and "same opener, different
  // second clause" duplicates ("The CPU is the brain of the computer. It
  // executes…" → "The CPU is the brain of the computer. It has a control…").
  // 40 chars covers the first full sentence in nearly every case.
  const PREFIX_LEN = 40;
  const seenPrefixes = new Set();
  const deduped = [];
  for (const scene of validated) {
    const prefix = firstNCharsKey(scene.say || scene.goal || scene.title || '', PREFIX_LEN);
    if (prefix) {
      if (seenPrefixes.has(prefix)) continue;
      seenPrefixes.add(prefix);
    }
    deduped.push(scene);
  }
  if (!deduped.length) return validated;

  // Ensure intent variety — avoid 3+ identical intents in a row
  const result = [];
  let lastIntent = null;
  let sameCount = 0;

  for (const scene of deduped) {
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

// Normalized first N characters of text — collapses case, whitespace, and
// punctuation so "The CPU is the brain..." and "the cpu is the  brain..."
// produce the same key.
function firstNCharsKey(text, n) {
  const s = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!s) return '';
  return s.slice(0, n);
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
