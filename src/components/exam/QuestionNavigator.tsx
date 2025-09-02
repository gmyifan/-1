import React from 'react';
import { useExam } from '../../state/ExamContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './QuestionNavigator.css';

export const QuestionNavigator: React.FC = () => {
  const { examState, examPaper, navigateToQuestion } = useExam();

  if (!examState || !examPaper) {
    return null;
  }

  const currentQuestion = examState.currentQuestion;
  const totalQuestions = examPaper.questions.length;
  const answeredQuestions = Object.keys(examState.answers);

  const handleQuestionClick = (index: number) => {
    navigateToQuestion(index);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      navigateToQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      navigateToQuestion(currentQuestion + 1);
    }
  };

  const getQuestionStatus = (index: number) => {
    const questionId = examPaper.questions[index].id;
    const answer = examState.answers[questionId];
    
    if (answer) {
      return 'answered';
    }
    return 'unanswered';
  };

  const questionStatuses = examPaper.questions.map((_, index) => getQuestionStatus(index));
  const answeredCount = answeredQuestions.length;

  return (
    <Card className="question-navigator" elevation={2}>
      <div className="question-navigator__header">
        <div className="question-navigator__title">
          题目导航
        </div>
        <div className="question-navigator__progress">
          已答 {answeredCount} / {totalQuestions} 题
        </div>
      </div>

      <div className="question-navigator__grid">
        {examPaper.questions.map((_, index) => {
          const status = getQuestionStatus(index);
          const isCurrent = index === currentQuestion;
          
          return (
            <button
              key={index}
              className={`question-navigator__item ${
                `question-navigator__item--${status}`
              } ${
                isCurrent ? 'question-navigator__item--current' : ''
              }`}
              onClick={() => handleQuestionClick(index)}
              title={`第 ${index + 1} 题 - ${
                status === 'answered' ? '已答' : '未答'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="question-navigator__navigation">
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          上一题
        </Button>
        
        <div className="question-navigator__current">
          {currentQuestion + 1} / {totalQuestions}
        </div>
        
        <Button
          variant="secondary"
          onClick={handleNext}
          disabled={currentQuestion === totalQuestions - 1}
        >
          下一题
        </Button>
      </div>

      <div className="question-navigator__legend">
        <div className="question-navigator__legend-item">
          <div className="question-navigator__legend-color question-navigator__legend-color--current"></div>
          <span>当前题目</span>
        </div>
        <div className="question-navigator__legend-item">
          <div className="question-navigator__legend-color question-navigator__legend-color--answered"></div>
          <span>已答题</span>
        </div>
        <div className="question-navigator__legend-item">
          <div className="question-navigator__legend-color question-navigator__legend-color--unanswered"></div>
          <span>未答题</span>
        </div>
      </div>
    </Card>
  );
};