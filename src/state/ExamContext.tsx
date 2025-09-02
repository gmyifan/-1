import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ExamState, ExamPaper, ExamResult, Answer } from '../types';
import { ExamService } from '../services/ExamService';

interface ExamContextType {
  examState: ExamState | null;
  examPaper: ExamPaper | null;
  examResult: ExamResult | null;
  startExam: (paper: ExamPaper) => Promise<void>;
  submitAnswer: (questionId: string, answer: string | string[]) => Promise<void>;
  completeExam: () => Promise<void>;
  navigateToQuestion: (index: number) => void;
  formatTime: (milliseconds: number) => string;
  getProgress: () => { current: number; total: number; percentage: number };
}

type ExamAction =
  | { type: 'SET_EXAM_STATE'; payload: ExamState | null }
  | { type: 'SET_EXAM_PAPER'; payload: ExamPaper | null }
  | { type: 'SET_EXAM_RESULT'; payload: ExamResult | null }
  | { type: 'UPDATE_STATE'; payload: ExamState };

interface ExamContextProviderProps {
  children: React.ReactNode;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

const examReducer = (state: any, action: ExamAction) => {
  switch (action.type) {
    case 'SET_EXAM_STATE':
      return { ...state, examState: action.payload };
    case 'SET_EXAM_PAPER':
      return { ...state, examPaper: action.payload };
    case 'SET_EXAM_RESULT':
      return { ...state, examResult: action.payload };
    case 'UPDATE_STATE':
      return { ...state, examState: action.payload };
    default:
      return state;
  }
};

export const ExamProvider: React.FC<ExamContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(examReducer, {
    examState: null,
    examPaper: null,
    examResult: null
  });

  const examService = React.useRef<ExamService>(new ExamService());

  useEffect(() => {
    const handleStateChange = (newState: ExamState) => {
      dispatch({ type: 'UPDATE_STATE', payload: newState });
    };

    examService.current.onStateChange(handleStateChange);

    return () => {
      examService.current.removeStateChangeListener(handleStateChange);
    };
  }, []);

  const startExam = async (paper: ExamPaper) => {
    try {
      // Store paper in exam service for later use
      (examService.current as any).paper = paper;
      const examState = await examService.current.startExam(paper);
      dispatch({ type: 'SET_EXAM_STATE', payload: examState });
      dispatch({ type: 'SET_EXAM_PAPER', payload: paper });
      dispatch({ type: 'SET_EXAM_RESULT', payload: null });
    } catch (error) {
      console.error('Failed to start exam:', error);
      throw error;
    }
  };

  const submitAnswer = async (questionId: string, answer: string | string[]) => {
    try {
      const updatedState = await examService.current.submitAnswer(questionId, answer);
      dispatch({ type: 'UPDATE_STATE', payload: updatedState });
    } catch (error) {
      console.error('Failed to submit answer:', error);
      throw error;
    }
  };

  const completeExam = async () => {
    try {
      const result = await examService.current.completeExam();
      dispatch({ type: 'SET_EXAM_RESULT', payload: result });
    } catch (error) {
      console.error('Failed to complete exam:', error);
      throw error;
    }
  };

  const navigateToQuestion = (index: number) => {
    examService.current.navigateToQuestion(index);
  };

  const formatTime = (milliseconds: number): string => {
    return examService.current.formatTime(milliseconds);
  };

  const getProgress = () => {
    return examService.current.getProgress();
  };

  const value: ExamContextType = {
    examState: state.examState,
    examPaper: state.examPaper,
    examResult: state.examResult,
    startExam,
    submitAnswer,
    completeExam,
    navigateToQuestion,
    formatTime,
    getProgress
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = (): ExamContextType => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};