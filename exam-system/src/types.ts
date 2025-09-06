export interface Question {
  id: string;
  type: 'single' | 'trueFalse' | 'multiple';
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  score: number;
}

export interface QuestionBank {
  questions: Question[];
}

export interface ExamPaper {
  id: string;
  questions: Question[];
  totalScore: number;
  generatedAt: string;
}

export interface Answer {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timestamp: string;
}

export interface ExamScore {
  total: number;
  singleChoice: number;
  trueFalse: number;
  multipleChoice: number;
}

export interface ExamState {
  status: 'notStarted' | 'inProgress' | 'completed';
  startTime?: string;
  endTime?: string;
  timeLimit: number;
  timeRemaining: number;
  currentQuestion: number;
  answers: Record<string, Answer>;
  score: ExamScore;
  wrongQuestions: string[];
}

export interface ExamResult {
  examState: ExamState;
  percentage: number;
  passed: boolean;
  message: string;
}

// 用户相关类型
export interface User {
  id: number;
  phone: string;
  isAdmin?: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterCredentials {
  phone: string;
  password: string;
}

// 错题相关类型
export interface WrongQuestion {
  id: number;
  questionId: string;
  type: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string;
  score: number;
  examScore: number;
  examPercentage: number;
  examDate: string;
  createdAt: string;
}

export interface UserStats {
  total_exams: number;
  total_questions: number;
  total_wrong: number;
  avg_score: number;
  best_score: number;
  unique_wrong_questions: number;
  last_exam_date?: string;
}

export interface ExamRecord {
  id: number;
  exam_id: string;
  score: number;
  total_score: number;
  percentage: number;
  passed: boolean;
  start_time: string;
  end_time: string;
  time_used: number;
  created_at: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}