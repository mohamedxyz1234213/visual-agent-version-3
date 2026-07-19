import mongoose from 'mongoose';

const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentCode: { type: String, unique: true, index: true }, // STU-{YEAR}-{SEQ}
    nationalId: { type: String, default: '' }, // 14 digits, encrypted in production
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
    coins: { type: Number, default: 0 },
    streakFreezes: { type: Number, default: 0 },

    // AI tracking
    weaknesses: [String], // concept tags
    strengths: [String],
    totalTimeSpent: { type: Number, default: 0 }, // minutes
    totalLessonsCompleted: { type: Number, default: 0 },
    totalExercisesCompleted: { type: Number, default: 0 },
    totalExamsCompleted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },

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

// Auto-generate student code
studentSchema.pre('save', async function (next) {
  if (this.studentCode) return next();
  const year = new Date().getFullYear();
  const count = await mongoose.model('Student').countDocuments();
  this.studentCode = `STU-${year}-${String(count + 1).padStart(4, '0')}`;
  next();
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

// Add XP and check for level up
studentSchema.methods.addXP = function (amount) {
  this.xp += amount;
  const newLevel = this.calculateLevel();
  const leveledUp = newLevel > this.level;
  this.level = newLevel;
  this.lastActivityDate = new Date();
  return { leveledUp, newLevel, totalXP: this.xp };
};

export const Student = mongoose.model('Student', studentSchema);
