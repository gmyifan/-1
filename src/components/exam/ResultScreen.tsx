import React, { useState } from 'react';
import { useExam } from '../../state/ExamContext';
import { DocumentService } from '../../services/DocumentService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './ResultScreen.css';

export const ResultScreen: React.FC = () => {
  const { examResult, examPaper } = useExam();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!examResult || !examPaper) {
    return null;
  }

  const { examState, percentage, passed, message } = examResult;

  const handleDownloadWrongQuestions = async () => {
    setIsDownloading(true);
    try {
      const documentService = new DocumentService();
      const wrongQuestions = examPaper.questions.filter(q => 
        examState.wrongQuestions.includes(q.id)
      );
      
      await documentService.generateAndDownloadWrongQuestions(wrongQuestions);
    } catch (error) {
      console.error('Failed to download wrong questions:', error);
      alert('下载错题集失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  const getScoreColor = () => {
    if (percentage >= 90) return '#28a745';
    if (percentage >= 80) return '#17a2b8';
    if (percentage >= 70) return '#ffc107';
    if (percentage >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const getScoreLevel = () => {
    if (percentage >= 90) return '优秀';
    if (percentage >= 80) return '良好';
    if (percentage >= 70) return '中等';
    if (percentage >= 60) return '及格';
    return '不及格';
  };

  const questionResults = examPaper.questions.map(question => {
    const userAnswer = examState.answers[question.id];
    return {
      question,
      userAnswer: userAnswer?.userAnswer || null,
      isCorrect: userAnswer?.isCorrect || false
    };
  });

  const correctCount = questionResults.filter(r => r.isCorrect).length;
  const wrongCount = questionResults.filter(r => !r.isCorrect).length;

  return (
    <div className="result-screen">
      <div className="result-screen__container">
        <Card className="result-screen__score-card" elevation={3}>
          <div className="result-screen__score-header">
            <div className="result-screen__score-icon">
              {passed ? '🎉' : '📊'}
            </div>
            <div className="result-screen__score-title">
              {message}
            </div>
            <div className="result-screen__score-subtitle">
              考试结束，感谢您的参与
            </div>
          </div>

          <div className="result-screen__score-main">
            <div className="result-screen__score-number">
              <div 
                className="result-screen__score-value"
                style={{ color: getScoreColor() }}
              >
                {examState.score.total}
              </div>
              <div className="result-screen__score-max">/ 100</div>
            </div>
            <div className="result-screen__score-details">
              <div className="result-screen__score-percentage">
                {percentage.toFixed(1)}%
              </div>
              <div 
                className="result-screen__score-level"
                style={{ color: getScoreColor() }}
              >
                {getScoreLevel()}
              </div>
            </div>
          </div>

          <div className="result-screen__score-breakdown">
            <div className="result-screen__breakdown-item">
              <div className="result-screen__breakdown-label">单选题</div>
              <div className="result-screen__breakdown-score">
                {examState.score.singleChoice} / 50
              </div>
            </div>
            <div className="result-screen__breakdown-item">
              <div className="result-screen__breakdown-label">判断题</div>
              <div className="result-screen__breakdown-score">
                {examState.score.trueFalse} / 20
              </div>
            </div>
            <div className="result-screen__breakdown-item">
              <div className="result-screen__breakdown-label">多选题</div>
              <div className="result-screen__breakdown-score">
                {examState.score.multipleChoice} / 30
              </div>
            </div>
          </div>
        </Card>

        <Card className="result-screen__stats-card" elevation={2}>
          <div className="result-screen__stats-grid">
            <div className="result-screen__stat-item">
              <div className="result-screen__stat-icon">✅</div>
              <div className="result-screen__stat-content">
                <div className="result-screen__stat-number">{correctCount}</div>
                <div className="result-screen__stat-label">答对</div>
              </div>
            </div>
            <div className="result-screen__stat-item">
              <div className="result-screen__stat-icon">❌</div>
              <div className="result-screen__stat-content">
                <div className="result-screen__stat-number">{wrongCount}</div>
                <div className="result-screen__stat-label">答错</div>
              </div>
            </div>
            <div className="result-screen__stat-item">
              <div className="result-screen__stat-icon">📝</div>
              <div className="result-screen__stat-content">
                <div className="result-screen__stat-number">{examPaper.questions.length}</div>
                <div className="result-screen__stat-label">总题数</div>
              </div>
            </div>
            <div className="result-screen__stat-item">
              <div className="result-screen__stat-icon">⏱️</div>
              <div className="result-screen__stat-content">
                <div className="result-screen__stat-number">
                  {Math.round((90 * 60 * 1000 - examState.timeRemaining) / 60000)}
                </div>
                <div className="result-screen__stat-label">用时(分钟)</div>
              </div>
            </div>
          </div>
        </Card>

        {wrongCount > 0 && (
          <Card className="result-screen__download-card" elevation={2}>
            <div className="result-screen__download-content">
              <div className="result-screen__download-icon">📄</div>
              <div className="result-screen__download-info">
                <div className="result-screen__download-title">下载错题集</div>
                <div className="result-screen__download-text">
                  包含 {wrongCount} 道错题的详细解析，方便复习巩固
                </div>
              </div>
              <Button
                variant="primary"
                onClick={handleDownloadWrongQuestions}
                disabled={isDownloading}
                className="result-screen__download-button"
              >
                {isDownloading ? '下载中...' : '下载错题集'}
              </Button>
            </div>
          </Card>
        )}

        <Card className="result-screen__answers-card" elevation={2}>
          <div className="result-screen__answers-header">
            <div className="result-screen__answers-title">答案解析</div>
            <div className="result-screen__answers-subtitle">
              点击题目查看详细答案
            </div>
          </div>

          <div className="result-screen__answers-grid">
            {questionResults.map((result, index) => (
              <div
                key={result.question.id}
                className={`result-screen__answer-item ${
                  result.isCorrect ? 'result-screen__answer-item--correct' : 'result-screen__answer-item--wrong'
                }`}
              >
                <div className="result-screen__answer-header">
                  <div className="result-screen__answer-number">
                    第 {index + 1} 题
                  </div>
                  <div className="result-screen__answer-status">
                    {result.isCorrect ? '✅ 正确' : '❌ 错误'}
                  </div>
                </div>
                
                <div className="result-screen__answer-question">
                  {result.question.question}
                </div>
                
                <div className="result-screen__answer-details">
                  <div className="result-screen__answer-correct">
                    <strong>正确答案:</strong> {result.question.correctAnswer}
                  </div>
                  {result.userAnswer && (
                    <div className="result-screen__answer-user">
                      <strong>你的答案:</strong> {
                        Array.isArray(result.userAnswer) 
                          ? result.userAnswer.join(', ') 
                          : result.userAnswer
                      }
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="result-screen__actions">
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="result-screen__restart-button"
          >
            重新开始考试
          </Button>
        </div>
      </div>
    </div>
  );
};