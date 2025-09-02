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