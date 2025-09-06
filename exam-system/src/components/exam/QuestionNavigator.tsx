import React from 'react';
import { useExam } from '../../state/ExamContext';
/* 上一题/下一题已移至题目下方，这里不再需要 Button */
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

  // 计算各题型的连续区间（基于我们已按类型顺序生成试卷）
  const firstIndexOf = (type: 'single'|'trueFalse'|'multiple') => examPaper.questions.findIndex(q => q.type === type);
  const lastIndexOf = (type: 'single'|'trueFalse'|'multiple') => {
    const idx = [...examPaper.questions].reverse().findIndex(q => q.type === type);
    return idx === -1 ? -1 : totalQuestions - 1 - idx;
  };
  const ranges = {
    single: { start: firstIndexOf('single'), end: lastIndexOf('single') },
    trueFalse: { start: firstIndexOf('trueFalse'), end: lastIndexOf('trueFalse') },
    multiple: { start: firstIndexOf('multiple'), end: lastIndexOf('multiple') }
  };

  const handleQuestionClick = (index: number) => {
    navigateToQuestion(index);
  };

  // 上一题/下一题逻辑已移至题目下方

  // 上一题/下一题逻辑已移至题目下方

  const getQuestionStatus = (index: number) => {
    const questionId = examPaper.questions[index].id;
    const answer = examState.answers[questionId];
    
    if (answer) {
      return 'answered';
    }
    return 'unanswered';
  };

  // 仅在渲染时即时计算状态，无需预先数组
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
        {/* 单选题段标题 */}
        {ranges.single.start !== -1 && (
          <div className="question-navigator__section">
            单选题 {ranges.single.start + 1}-{ranges.single.end + 1}
          </div>
        )}
        {examPaper.questions.map((_, index) => {
          const status = getQuestionStatus(index);
          const isCurrent = index === currentQuestion;

          // 在 trueFalse 段起始前插入段标题
          const showTrueFalseTitle = ranges.trueFalse.start === index;
          const showMultipleTitle = ranges.multiple.start === index;

          return (
            <React.Fragment key={index}>
              {showTrueFalseTitle && (
                <div className="question-navigator__section">
                  判断题 {ranges.trueFalse.start + 1}-{ranges.trueFalse.end + 1}
                </div>
              )}
              {showMultipleTitle && (
                <div className="question-navigator__section">
                  多选题 {ranges.multiple.start + 1}-{ranges.multiple.end + 1}
                </div>
              )}
              <button
                className={`question-navigator__item ${'question-navigator__item--' + status} ${isCurrent ? 'question-navigator__item--current' : ''}`}
                onClick={() => handleQuestionClick(index)}
                title={`第 ${index + 1} 题 - ${status === 'answered' ? '已答' : '未答'}`}
              >
                {index + 1}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* 导航栏不再包含 上一题/下一题；仅保留图例 */}

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