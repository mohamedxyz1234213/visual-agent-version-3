// ── XP & Gamification Service ─────────────────────────────────────────────────
import { Student, Achievement, Badge, StudentBadge } from '../../models/index.js';

// XP reward table
const XP_REWARDS = {
  lesson_complete: 50,
  exercise_easy: 10,
  exercise_medium: 25,
  exercise_hard: 50,
  exercise_expert: 100,
  perfect_score_bonus: 0.25, // 25% bonus
  first_attempt_bonus: 10,
  daily_login: 10,
  avatar_session: 30,
  mini_game: 15,
  challenge_participation: 20,
  challenge_winner: 100,
};

// Level thresholds: level N requires level * 100 + (level-1) * 50 XP
export function calculateLevel(xp) {
  let level = 1;
  let required = 0;
  while (required + level * 100 + (level - 1) * 50 <= xp) {
    required += level * 100 + (level - 1) * 50;
    level++;
  }
  return { level, currentLevelXP: xp - required, nextLevelXP: level * 100 + (level - 1) * 50 };
}

// Calculate XP reward for an exercise based on difficulty and performance
export function calculateExerciseXP(difficulty, isPerfect, isFirstAttempt) {
  let xp = XP_REWARDS[`exercise_${difficulty}`] || XP_REWARDS.exercise_easy;
  if (isPerfect) xp = Math.round(xp * (1 + XP_REWARDS.perfect_score_bonus));
  if (isFirstAttempt) xp += XP_REWARDS.first_attempt_bonus;
  return xp;
}

// Award XP to a student and check for level up + achievements
export async function awardXP(studentId, amount, reason) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found');

  const oldLevel = student.level;
  const result = student.addXP(amount);
  student.lastActivityDate = new Date();
  await student.save();

  // Check for new achievements
  const newAchievements = await checkAchievements(student);

  return {
    xpEarned: amount,
    reason,
    totalXP: student.xp,
    level: student.level,
    leveledUp: result.leveledUp,
    newAchievements,
  };
}

// Check and award any new achievements
async function checkAchievements(student) {
  const newAchievements = [];

  const achievementChecks = [
    { type: 'first-lesson', condition: student.totalLessonsCompleted >= 1, title: 'First Lesson', description: 'Completed your first lesson', icon: 'BookOpen' },
    { type: 'first-exercise', condition: student.totalExercisesCompleted >= 1, title: 'First Exercise', description: 'Completed your first exercise', icon: 'Code' },
    { type: 'streak-3', condition: student.streak >= 3, title: 'On Fire', description: '3-day streak', icon: 'Flame', xpBonus: 20, coinBonus: 20 },
    { type: 'streak-7', condition: student.streak >= 7, title: 'Week Warrior', description: '7-day streak', icon: 'Zap', xpBonus: 50, coinBonus: 50 },
    { type: 'streak-14', condition: student.streak >= 14, title: 'Unstoppable', description: '14-day streak', icon: 'Rocket', xpBonus: 100, coinBonus: 100 },
    { type: 'streak-30', condition: student.streak >= 30, title: 'Legend', description: '30-day streak', icon: 'Crown', xpBonus: 200, coinBonus: 200 },
    { type: 'perfect-score', condition: student.averageScore >= 100, title: 'Perfectionist', description: '100% average score', icon: 'Target', xpBonus: 25 },
    { type: 'code-master', condition: student.level >= 10, title: 'Code Master', description: 'Reached level 10', icon: 'Award', xpBonus: 100, coinBonus: 50 },
  ];

  for (const check of achievementChecks) {
    if (!check.condition) continue;
    const existing = await Achievement.findOne({ studentId: student._id, type: check.type });
    if (!existing) {
      const achievement = await Achievement.create({
        studentId: student._id,
        type: check.type,
        title: check.title,
        description: check.description,
        icon: check.icon,
        xpBonus: check.xpBonus || 0,
        coinBonus: check.coinBonus || 0,
      });
      newAchievements.push(achievement);

      // Award bonus XP/coins
      if (check.xpBonus) student.xp += check.xpBonus;
      if (check.coinBonus) student.coins += check.coinBonus;
    }
  }

  if (newAchievements.length > 0) await student.save();
  return newAchievements;
}

// Streak management
export async function updateStreak(studentId) {
  const student = await Student.findById(studentId);
  if (!student) return;

  const today = new Date().toDateString();
  const lastActivity = student.lastActivityDate?.toDateString();

  if (lastActivity === today) return; // Already counted today

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastActivity === yesterday) {
    student.streak += 1;
  } else if (lastActivity !== today) {
    // Streak broken
    if (student.streak > student.longestStreak) {
      student.longestStreak = student.streak;
    }
    student.streak = 1;
  }

  student.lastActivityDate = new Date();
  await student.save();

  return { streak: student.streak, longestStreak: student.longestStreak };
}

export { XP_REWARDS };
