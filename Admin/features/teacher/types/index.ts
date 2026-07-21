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
