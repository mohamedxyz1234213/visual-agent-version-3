export interface TeacherProfile {
  userId: string;
  subjects: string[];
  schoolYears: string[];
  sections: string[];
  students: string[];
  bio: string;
  qualifications: string[];
  specialization: string;
  rating: number;
  totalLessons: number;
  totalExams: number;
  isVerified: boolean;
}

export interface TeacherDashboard {
  stats: {
    totalStudents: number;
    totalLessons: number;
    pendingSubmissions: number;
    totalExams: number;
    avgClassScore: number;
  };
  recentLessons: TeacherLesson[];
}

export interface TeacherLesson {
  _id: string;
  title: string;
  subjectId?: { _id: string; name: string; color: string };
  status: string;
  isPublished: boolean;
  totalStudents: number;
  averageScore: number;
  createdAt: string;
}

export interface TeacherExercise {
  _id: string;
  title: string;
  type: string;
  difficulty: string;
  xpReward: number;
  estimatedTime: number;
  totalAttempts: number;
  successRate: number;
  isPublished: boolean;
}

export interface TeacherExam {
  _id: string;
  title: string;
  type: string;
  subjectId?: { _id: string; name: string };
  questions: any[];
  duration: number;
  totalPoints: number;
  isPublished: boolean;
  assignedTo?: { _id: string; studentCode?: string }[] | string[];
}

export interface TeacherSubmission {
  _id: string;
  studentId?: { studentCode: string };
  exerciseId?: { title: string; difficulty: string };
  score: number;
  status: string;
  createdAt: string;
}

export interface ClassData {
  [yearName: string]: StudentInClass[];
}

export interface StudentInClass {
  id: string;
  studentCode: string;
  username: string;
  email: string;
  section: string;
  xp: number;
  level: number;
  streak: number;
  averageScore: number;
  totalLessonsCompleted: number;
  lastActivityDate: string;
}

export interface PerQuestionStat {
  questionId: string;
  questionText: string;
  type: string;
  points: number;
  correctCount: number;
  totalAttempts: number;
  correctRate: number;
}

export interface GradeDistribution {
  A: number;
  B: number;
  C: number;
  D: number;
  F: number;
}

export interface StudentExamResult {
  studentCode: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: string;
  passed: boolean;
  timeSpent: number;
  submittedAt: string;
}

export interface ExamAnalytics {
  examTitle: string;
  totalPoints: number;
  passingScore: number;
  totalStudents: number;
  submittedCount: number;
  avgScore: number;
  medianScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  gradeDistribution: GradeDistribution;
  perQuestionStats: PerQuestionStat[];
  studentResults: StudentExamResult[];
}
