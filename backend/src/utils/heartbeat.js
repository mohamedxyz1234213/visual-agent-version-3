import { Lesson } from '../models/Lesson.js';

export function startLessonHeartbeat(lessonId, intervalMs = 45_000) {
  const timer = setInterval(async () => {
    try {
      await Lesson.updateOne({ _id: lessonId }, { $set: { lastHeartbeat: new Date() } });
    } catch (err) {
      console.warn(`[heartbeat] lesson ${lessonId}:`, err.message);
    }
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
