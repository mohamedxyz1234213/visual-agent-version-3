// -----------------------------------------------------------------------------
// Whiteboard pipeline entry point
// -----------------------------------------------------------------------------
// One function the planner calls to turn an AI lesson `part` into a finished,
// timed, overlap-free, varied whiteboard `visual_sequence`.
//
//   buildWhiteboardForPart(part, { lessonTitle }) -> [{ time, type, ...payload }]
//
// Internally:
//   part  --pedagogyAdapter-->  pscenes  --sceneComposer-->  visual_sequence
//
// Templates own all geometry, so the result cannot overlap. Template selection
// rotates per scene + per lesson so no two lessons feel identical.
// -----------------------------------------------------------------------------

import { partToPscenes } from './pedagogyAdapter.js';
import { composeStoryboard } from './sceneComposer.js';

export function buildWhiteboardForPart(part, opts = {}) {
  const lessonTitle = opts.lessonTitle || part?.title || '';
  const duration = Number(part?.duration_seconds) || 300;
  const field = opts.field || part?.field || '';
  const partIndex = opts.partIndex ?? 0;

  const pscenes = partToPscenes(part);
  if (!pscenes.length) return [];

  const sequence = composeStoryboard(pscenes, {
    title: part?.title || lessonTitle,
    lessonTitle,
    field,
    partIndex,
  }, duration);
  return sequence;
}

export { partToPscenes } from './pedagogyAdapter.js';
export { composeStoryboard, previewPartComposition } from './sceneComposer.js';
export { assessPartVisuals, assessLessonVisuals } from './visualComposition.js';
