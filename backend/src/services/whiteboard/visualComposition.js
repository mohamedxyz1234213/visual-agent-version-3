// -----------------------------------------------------------------------------
// Visual composition preview & quality scoring
// -----------------------------------------------------------------------------
// Dry-runs the template pipeline to see what would render BEFORE committing,
// then scores whether the lesson needs an AI visual-editing pass.
// -----------------------------------------------------------------------------

import { partToPscenes } from './pedagogyAdapter.js';
import { previewPartComposition } from './sceneComposer.js';

const DIAGRAM_INTENTS = new Set(['map', 'formula', 'data', 'cycle']);
const DIAGRAM_FIELDS = /bio|medic|anatom|chem|physic|science|geolog|astronom|ecolog|health|neuro|math|algebra|calculus|geometry|program|engineer|architect/i;

function wordCount(text) {
  return String(text || '').split(/\s+/).filter(Boolean).length;
}

function intentSignature(scenes) {
  return scenes.map((s) => s.intent).join('→');
}

/**
 * Score a part's board_scenes by dry-running composition.
 * Returns { score, issues, preview, needsRefinement }.
 */
export function assessPartVisuals(part, ctx = {}) {
  const pscenes = partToPscenes(part);
  const preview = previewPartComposition(pscenes, {
    title: part.title,
    lessonTitle: ctx.lessonTitle || part.title,
    field: ctx.field || '',
    partIndex: ctx.partIndex ?? 0,
  });

  const issues = [];
  let score = 100;

  if (!preview.boards.length) {
    return { score: 0, issues: ['No boards compose — board_scenes are empty or invalid'], preview, needsRefinement: true };
  }

  // First beat should hook, not bare define
  const first = preview.boards[0];
  if (first && first.intent === 'define' && !String(part.board_scenes?.[0]?.segment || '').match(/hook|prerequisite/i)) {
    issues.push('Opens with define instead of hook — first segment should be hook');
    score -= 18;
  }

  // Thin spoken lines
  const sayWords = preview.boards.map((b) => wordCount(b.say)).filter((n) => n > 0);
  const avgSay = sayWords.length ? sayWords.reduce((a, b) => a + b, 0) / sayWords.length : 0;
  if (avgSay < 18) {
    issues.push(`Spoken lines too thin (avg ${Math.round(avgSay)} words — need 25+ per beat)`);
    score -= 25;
  }

  // Too few teaching beats
  if (preview.boards.length < 4) {
    issues.push(`Only ${preview.boards.length} boards — need 4-7 distinct teaching beats`);
    score -= 20;
  }

  // Repetitive intent pattern (define→process→recap is the generic trap)
  const sig = intentSignature(preview.boards);
  const genericPatterns = [
    'recap→define→process→recap',
    'define→process→recap',
    'define→cluster→recap',
    'define→compare→recap',
  ];
  if (genericPatterns.some((p) => sig.includes(p) || sig === p)) {
    issues.push(`Generic intent sequence "${sig}" — vary diagram/cause/timeline/formula/map beats`);
    score -= 18;
  }

  // Three+ identical intents in a row
  let streak = 1;
  for (let i = 1; i < preview.boards.length; i++) {
    if (preview.boards[i].intent === preview.boards[i - 1].intent) {
      streak++;
      if (streak >= 3) {
        issues.push(`Intent "${preview.boards[i].intent}" repeated 3+ times in a row`);
        score -= 15;
        break;
      }
    } else streak = 1;
  }

  // Same template picked too often within the part
  const templateCounts = {};
  for (const b of preview.boards) {
    templateCounts[b.templateId] = (templateCounts[b.templateId] || 0) + 1;
  }
  for (const [tid, count] of Object.entries(templateCounts)) {
    if (count >= 3) {
      issues.push(`Template "${tid}" used ${count} times in one part — feels identical`);
      score -= 12;
    }
  }

  // Header-only / empty boards
  const emptyBoards = preview.boards.filter((b) => b.headerOnly || b.fragmentCount < 4);
  if (emptyBoards.length) {
    issues.push(`${emptyBoards.length} board(s) render thin/empty (header-only or <4 elements)`);
    score -= emptyBoards.length * 10;
  }

  // Field expects diagrams but none present
  const field = String(ctx.field || '');
  if (DIAGRAM_FIELDS.test(field)) {
    const hasDiagramBoard = preview.boards.some(
      (b) => b.hasDiagram || DIAGRAM_INTENTS.has(b.intent),
    );
    if (!hasDiagramBoard) {
      issues.push(`Field "${field}" should include at least one map/formula/data/cycle board with SVG figure`);
      score -= 20;
    }
  }

  // Cross-part repetition (same intent signature as a prior part)
  if (ctx.priorSignatures?.includes(sig)) {
    issues.push(`Same intent sequence as a previous part ("${sig}") — must differ across parts`);
    score -= 15;
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    issues,
    preview,
    signature: sig,
    needsRefinement: score < 75 || issues.length >= 2,
  };
}

/**
 * Assess every content part in a lesson plan for visual quality.
 */
export function assessLessonVisuals(plan, field = '') {
  const contentParts = (plan.parts || []).filter((p) => p.part_type === 'content');
  const priorSignatures = [];
  const assessments = contentParts.map((part, i) => {
    const assessment = assessPartVisuals(part, {
      lessonTitle: plan.title,
      field,
      partIndex: i,
      priorSignatures,
    });
    priorSignatures.push(assessment.signature);
    return { partIndex: i, title: part.title, ...assessment };
  });
  const needsAny = assessments.some((a) => a.needsRefinement);
  const avgScore = assessments.length
    ? assessments.reduce((s, a) => s + a.score, 0) / assessments.length
    : 0;
  return { assessments, needsRefinement: needsAny || avgScore < 80, avgScore };
}
