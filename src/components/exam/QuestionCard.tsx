import React from 'react';
import { useExam } from '../../state/ExamContext';
import { Question } from '../../types';
import { Card } from '../ui/Card';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  userAnswer?: string | string[];
  onAnswerChange: (answer: string | string[]) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionIndex,
  userAnswer,
  onAnswerChange
}) => {
  const { examState } = useExam();

  const handleSingleChoice = (option: string) => {
    onAnswerChange(option);
  };

  const handleMultipleChoice = (option: string) => {
    const currentAnswers = Array.isArray(userAnswer) ? userAnswer : [];
    const newAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(a => a !== option)
      : [...currentAnswers, option];
    onAnswerChange(newAnswers);
  };

  const handleTrueFalse = (answer: string) => {
    onAnswerChange(answer);
  };

  const isAnswerSelected = (option: string) => {
    if (question.type === 'multiple') {
      return Array.isArray(userAnswer) && userAnswer.includes(option);
    }
    return userAnswer === option;
  };

  return (
    <Card className="question-card" elevation={2}>
      <div className="question-card__header">
        <div className="question-card__number">
          第 {questionIndex + 1} 题
        </div>
        <div className="question-card__type">
          {question.type === 'single' && '单选题'}
          {question.type === 'trueFalse' && '判断题'}
          {question.type === 'multiple' && '多选题'}
        </div>
        <div className="question-card__score">
          {question.score}分
        </div>
      </div>

      <div className="question-card__content">
        <div className="question-card__question">
          {question.question}
        </div>

        <div className="question-card__options">
          {question.type === 'trueFalse' ? (
            <>
              {['对', '错'].map((option, index) => (
                <button
                  key={option}
                  className={`question-card__option question-card__option--truefalse ${
                    isAnswerSelected(option) ? 'question-card__option--selected' : ''
                  }`}
                  onClick={() => handleTrueFalse(option)}
                >
                  <span className="question-card__option-letter">
                    {index === 0 ? 'A' : 'B'}
                  </span>
                  <span className="question-card__option-text">{option}</span>
                </button>
              ))}
            </>
          ) : (
            question.options.map((option, index) => (
              <button
                key={index}
                className={`question-card__option ${
                  isAnswerSelected(option) ? 'question-card__option--selected' : ''
                }`}
                onClick={() => {
                  if (question.type === 'single') {
                    handleSingleChoice(option);
                  } else if (question.type === 'multiple') {
                    handleMultipleChoice(option);
                  }
                }}
              >
                <span className="question-card__option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="question-card__option-text">{option}</span>
                {question.type === 'multiple' && (
                  <span className="question-card__option-checkbox">
                    {isAnswerSelected(option) ? '✓' : ''}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {question.type === 'multiple' && (
        <div className="question-card__hint">
          提示：多选题选择所有正确选项，错选、漏选均不得分
        </div>
      )}
    </Card>
  );
};