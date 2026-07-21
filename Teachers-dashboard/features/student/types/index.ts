export interface StudentProfile {
  id: string;
  studentCode: string;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  coins: number;
  totalLessonsCompleted: number;
  totalExercisesCompleted: number;
  averageScore: number;
  totalTimeSpent: number;
  preferences: StudentPreferences;
  status: 'pending' | 'active' | 'suspended' | 'graduated';
}

export interface StudentPreferences {
  language: 'ar' | 'en';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  avatarVoice: boolean;
  avatarDialect: 'msa' | 'egyptian';
}

export interface StudentDashboard {
  student: StudentProfile;
  progress: SubjectProgress[];
  recentSubmissions: Submission[];
  unreadNotifications: number;
  recentAchievements: Achievement[];
}

export interface SubjectProgress {
  subjectId: { _id: string; name: string; color: string };
  completion: number;
  timeSpent: number;
}

export interface Lesson {
  _id: string;
  title: string;
  subjectId: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  totalExercises: number;
  isPublished: boolean;
  order: number;
  content?: string;
  videoUrl?: string;
  codeSnippets?: CodeSnippet[];
}

export interface CodeSnippet {
  language: string;
  code: string;
  explanation?: string;
}

export interface Exercise {
  _id: string;
  title: string;
  description: string;
  type: 'fill-code' | 'find-bug' | 'predict-output' | 'drag-drop' | 'free-code' | 'match-output';
  starterCode?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  coinReward: number;
  estimatedTime: number;
  tags: string[];
  totalAttempts: number;
  successRate: number;
  testCases: TestCase[];
  hints: Hint[];
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  description?: string;
}

export interface Hint {
  order: number;
  text: string;
  cost: number;
}

export interface Submission {
  _id: string;
  exerciseId?: { _id: string; title: string; difficulty: string } | null;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'partial' | 'error';
  score: number;
  timeSpent: number;
  code: string;
  createdAt: string;
}

export interface Achievement {
  _id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  xpBonus: number;
  coinBonus: number;
  unlockedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  level: number;
  streak: number;
  coins: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  myRank: number | null;
  myStats: { xp: number; level: number; streak: number } | null;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
}

export interface WeeklyChallenge {
  _id: string;
  title: string;
  description: string;
  exerciseId: { _id: string; title: string; difficulty: string } | null;
  startDate: string;
  endDate: string;
  rewards: { xp: number; coins: number };
  isParticipating: boolean;
  participantCount: number;
}

export interface AvatarSession {
  sessionId: string;
  avatarUrl: string;
  greetingText: string;
  greetingAudio: string | null;
}

export interface AvatarMessage {
  sessionId: string;
  text: string;
  emotion: string;
  codeSnippet: { language: string; code: string } | null;
  audioUrl: string | null;
}

export interface ConceptMastery {
  concept: string;
  proficiency: number;
  lastPracticed: string;
}
