import mongoose from 'mongoose';

const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentCode: { type: String, unique: true, index: true }, // e.g., A3X8K2M1
    nationalId: { type: String, default: '' }, // 14 digits, encrypted in production
    parentPhone: { type: String, default: '' },
    dateOfBirth: { type: Date },
    schoolEmail: { type: String, default: '', lowercase: true, trim: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    schoolYearId: { type: Schema.Types.ObjectId, ref: 'SchoolYear' },
    section: { type: String, default: '' },

    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    teacherIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    parentUserId: { type: Schema.Types.ObjectId, ref: 'User' },

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date },
    lastStreakUpdate: { type: Date },  // track when streak was last updated
    coins: { type: Number, default: 0 },
    streakFreezes: { type: Number, default: 0 },
    weeklyXP: { type: Number, default: 0 },       // XP earned this week (resets Monday)
    weeklyXPWeek: { type: Number },                // ISO week number to know when to reset
    highestWeeklyRank: { type: Number, default: null }, // best weekly rank achieved

    // AI tracking
    weaknesses: [String], // concept tags
    strengths: [String],
    totalTimeSpent: { type: Number, default: 0 }, // minutes
    totalLessonsCompleted: { type: Number, default: 0 },
    totalExercisesCompleted: { type: Number, default: 0 },
    totalExamsCompleted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },

    // Adaptive Learning Profile
    onboardingCompleted: { type: Boolean, default: false },
    onboardingCompletedAt: { type: Date },
    learningProfile: {
      learningStyle: { type: String, enum: ['visual', 'reading', 'hands-on', 'video', ''], default: '' },
      pacing: { type: String, enum: ['slow', 'moderate', 'fast', ''], default: '' },
      practiceFrequency: { type: String, enum: ['low', 'medium', 'high', ''], default: '' },
      problemSolvingApproach: { type: String, enum: ['research', 'ask-help', 'debug', 'break', ''], default: '' },
      experienceLevel: { type: String, enum: ['absolute-beginner', 'some-experience', 'intermediate', 'advanced', ''], default: '' },
    },

    // Preferences
    preferences: {
      language: { type: String, enum: ['ar', 'en'], default: 'en' },
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
      avatarVoice: { type: Boolean, default: true },
      avatarDialect: { type: String, enum: ['msa', 'egyptian'], default: 'msa' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    },

    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'graduated'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

// Generate a random alphanumeric student code (e.g., A3X8K2M1)
function generateStudentCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Auto-generate unique student code
studentSchema.pre('save', async function () {
  if (this.studentCode) return;
  let code;
  let attempts = 0;
  do {
    code = generateStudentCode();
    attempts++;
    const exists = await mongoose.model('Student').findOne({ studentCode: code }).lean();
    if (!exists) break;
  } while (attempts < 10);
  this.studentCode = code;
});

// Calculate level from XP
studentSchema.methods.calculateLevel = function () {
  // Level formula: level * 100 + (level-1)*50
  let level = 1;
  let required = 0;
  while (required + level * 100 + (level - 1) * 50 <= this.xp) {
    required += level * 100 + (level - 1) * 50;
    level++;
  }
  return level;
};

// Get the current ISO week number for weekly XP reset
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Add XP and check for level up + weekly tracking
studentSchema.methods.addXP = function (amount) {
  this.xp += amount;
  const newLevel = this.calculateLevel();
  const leveledUp = newLevel > this.level;
  this.level = newLevel;
  this.lastActivityDate = new Date();

  // Weekly XP tracking with auto-reset
  const currentWeek = getWeekNumber(new Date());
  if (this.weeklyXPWeek !== currentWeek) {
    // New week — reset weekly XP
    this.weeklyXP = amount;
    this.weeklyXPWeek = currentWeek;
    // Save the last week's rank before resetting
    this.highestWeeklyRank = null;
  } else {
    this.weeklyXP += amount;
  }

  return { leveledUp, newLevel, totalXP: this.xp };
};

export const Student = mongoose.model('Student', studentSchema);
