import React, { useState, useEffect } from 'react';
import { useExam } from '../../state/ExamContext';
import { Timer } from './Timer';
import { QuestionCard } from './QuestionCard';
import { QuestionNavigator } from './QuestionNavigator';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './ExamScreen.css';

export const ExamScreen: React.FC = () => {
  const { examState, examPaper, submitAnswer, completeExam, navigateToQuestion } = useExam();
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    if (examState && examPaper) {
      const currentQuestion = examPaper.questions[examState.currentQuestion];
      if (currentQuestion) {
        const existingAnswer = examState.answers[currentQuestion.id];
        setCurrentAnswer(existingAnswer?.userAnswer || '');
      }
    }
  }, [examState, examPaper]);

  const handleAnswerChange = (answer: string | string[]) => {
    setCurrentAnswer(answer);
    
    if (examState && examPaper) {
      const currentQuestion = examPaper.questions[examState.currentQuestion];
      if (currentQuestion) {
        submitAnswer(currentQuestion.id, answer);
      }
    }
  };

  const handleSubmitExam = () => {
    setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      await completeExam();
      setShowConfirmSubmit(false);
    } catch (error) {
      console.error('Failed to submit exam:', error);
      alert('提交考试失败，请重试');
    }
  };

  const handleCancelSubmit = () => {
    setShowConfirmSubmit(false);
  };

  if (!examState || !examPaper) {
    return (
      <div className="exam-screen">
        <Card className="exam-screen__error">
          <div className="exam-screen__error-content">
            <div className="exam-screen__error-icon">⚠️</div>
            <div className="exam-screen__error-text">
              考试数据加载失败，请刷新页面重试
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (examState.status === 'completed') {
    return null; // Will be handled by ResultScreen
  }

  const currentQuestion = examPaper.questions[examState.currentQuestion];
  const progress = {
    answered: Object.keys(examState.answers).length,
    total: examPaper.questions.length,
    percentage: (Object.keys(examState.answers).length / examPaper.questions.length) * 100
  };

  return (
    <div className="exam-screen">
      <div className="exam-screen__header">
        <Timer />
        <Card className="exam-screen__progress" elevation={2}>
          <div className="exam-screen__progress-content">
            <div className="exam-screen__progress-text">
              答题进度: {progress.answered} / {progress.total}
            </div>
            <div className="exam-screen__progress-bar">
              <div 
                className="exam-screen__progress-fill"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="exam-screen__main">
        <div className="exam-screen__question-area">
          {currentQuestion && (
            <>
              <QuestionCard
                question={currentQuestion}
                questionIndex={examState.currentQuestion}
                userAnswer={currentAnswer}
                onAnswerChange={handleAnswerChange}
              />
              {/* 题目下方的上一题/下一题与进度 */}
              <Card className="exam-screen__in-question-nav" elevation={2}>
                <div className="exam-screen__in-question-nav-content">
                  <Button
                    variant="secondary"
                    onClick={() => examState.currentQuestion > 0 && navigateToQuestion(examState.currentQuestion - 1)}
                    disabled={examState.currentQuestion === 0}
                  >
                    上一题
                  </Button>
                  <div className="exam-screen__in-question-nav-current">
                    {examState.currentQuestion + 1} / {progress.total}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => examState.currentQuestion < progress.total - 1 && navigateToQuestion(examState.currentQuestion + 1)}
                    disabled={examState.currentQuestion === progress.total - 1}
                  >
                    下一题
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>

        <div className="exam-screen__sidebar">
          <QuestionNavigator />
          
          <Card className="exam-screen__actions" elevation={2}>
            <div className="exam-screen__actions-content">
              <div className="exam-screen__actions-info">
                <div className="exam-screen__actions-title">
                  {progress.answered === progress.total ? '所有题目已完成' : '继续答题'}
                </div>
                <div className="exam-screen__actions-text">
                  {progress.answered === progress.total 
                    ? '检查无误后可以提交考试' 
                    : `还有 ${progress.total - progress.answered} 题未完成`
                  }
                </div>
              </div>
              
              <Button
                variant={progress.answered === progress.total ? 'primary' : 'secondary'}
                onClick={handleSubmitExam}
                disabled={progress.answered === 0}
                className="exam-screen__submit-button"
              >
                {progress.answered === progress.total ? '提交考试' : '提前交卷'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {showConfirmSubmit && (
        <div className="exam-screen__confirm-overlay">
          <Card className="exam-screen__confirm-dialog" elevation={3}>
            <div className="exam-screen__confirm-content">
              <div className="exam-screen__confirm-icon">⚠️</div>
              <div className="exam-screen__confirm-title">
                确认提交考试
              </div>
              <div className="exam-screen__confirm-text">
                提交后将无法修改答案，确定要提交吗？
                <br />
                <br />
                <strong>当前进度:</strong> {progress.answered} / {progress.total} 题已完成
              </div>
              
              <div className="exam-screen__confirm-actions">
                <Button
                  variant="secondary"
                  onClick={handleCancelSubmit}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmSubmit}
                >
                  确认提交
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};