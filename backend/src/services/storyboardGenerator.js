import { Lesson, LessonPart, StoryboardScene } from '../models/Lesson.js';
import { Quiz, QuizQuestion } from '../models/Quiz.js';

function normalizeQuizQuestionType(value) {
  const normalized = String(value || '').trim().toLowerCase();
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
  return 'mcq';
}

/**
 * Persist the AI lesson plan to MongoDB.
 * @param {import('mongoose').Document} lesson - existing Lesson document
 * @param {Object} plan - parsed AI plan
 * @returns {Promise<import('mongoose').Document>} updated lesson
 */
export async function saveLessonPlan(lesson, plan) {
  lesson.title = plan.title || lesson.title;
  lesson.subject = plan.subject || undefined;
  lesson.summary = plan.summary || undefined;
  await lesson.save();

  for (const partData of plan.parts || []) {
    const part = await LessonPart.create({
      lessonId: lesson._id,
      orderIndex: partData.order_index || 0,
      title: partData.title || 'Part',
      narration: partData.narration,
      durationSeconds: partData.duration_seconds || 120,
      partType: partData.part_type || 'content',
    });

    // Save storyboard scenes
    const scenes = (partData.visual_sequence || []).map((s) => ({
      partId: part._id,
      timeOffset: parseFloat(s.time) || 0,
      actionType: s.type || 'draw_text',
      payload: Object.fromEntries(Object.entries(s).filter(([k]) => k !== 'time' && k !== 'type')),
    }));
    if (scenes.length > 0) {
      await StoryboardScene.insertMany(scenes);
    }

    // Save quiz if this is a quiz part
    if (['quiz', 'final_quiz'].includes(partData.part_type) && partData.quiz_questions?.length) {
      const quiz = await Quiz.create({ partId: part._id });
      const questions = partData.quiz_questions.map((q) => ({
        quizId: quiz._id,
        orderIndex: q.order_index || 0,
        questionType: normalizeQuizQuestionType(q.question_type),
        questionText: q.question_text || '',
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
      }));
      await QuizQuestion.insertMany(questions);
    }
  }

  lesson.status = 'ready';
  await lesson.save();
  return lesson;
}
