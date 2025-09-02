import React from 'react';
import { useExam } from '../../state/ExamContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './StartScreen.css';

export const StartScreen: React.FC = () => {
  const { startExam } = useExam();

  const handleStartExam = async () => {
    try {
      // In a real implementation, this would call the QuestionBankService
      // For now, we'll simulate it with a mock paper
      const mockPaper = {
        id: 'exam_1',
        questions: [], // This would be populated by the QuestionBankService
        totalScore: 100,
        generatedAt: new Date().toISOString()
      };
      
      await startExam(mockPaper);
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert('开始考试失败，请重试');
    }
  };

  return (
    <div className="start-screen">
      <Card className="start-screen__card" elevation={3}>
        <div className="start-screen__content">
          <div className="start-screen__header">
            <h1 className="start-screen__title">
              网络安全与信息化知识测试题
            </h1>
            <div className="start-screen__subtitle">
              在线考试系统
            </div>
          </div>

          <div className="start-screen__info">
            <div className="start-screen__info-item">
              <div className="start-screen__info-icon">📝</div>
              <div className="start-screen__info-content">
                <div className="start-screen__info-title">考试说明</div>
                <div className="start-screen__info-text">
                  系统将随机生成试卷，包含单选题、判断题和多选题
                </div>
              </div>
            </div>

            <div className="start-screen__info-item">
              <div className="start-screen__info-icon">📊</div>
              <div className="start-screen__info-content">
                <div className="start-screen__info-title">题目分布</div>
                <div className="start-screen__info-text">
                  • 单选题：50题 × 1分 = 50分<br/>
                  • 判断题：20题 × 1分 = 20分<br/>
                  • 多选题：20题 × 1.5分 = 30分<br/>
                  • 总分：100分
                </div>
              </div>
            </div>

            <div className="start-screen__info-item">
              <div className="start-screen__info-icon">⏱️</div>
              <div className="start-screen__info-content">
                <div className="start-screen__info-title">考试时间</div>
                <div className="start-screen__info-text">
                  90分钟倒计时，时间到自动提交
                </div>
              </div>
            </div>

            <div className="start-screen__info-item">
              <div className="start-screen__info-icon">✅</div>
              <div className="start-screen__info-content">
                <div className="start-screen__info-title">及格标准</div>
                <div className="start-screen__info-text">
                  60分及以上为通过考试
                </div>
              </div>
            </div>

            <div className="start-screen__info-item">
              <div className="start-screen__info-icon">📋</div>
              <div className="start-screen__info-content">
                <div className="start-screen__info-title">考试功能</div>
                <div className="start-screen__info-text">
                  • 支持题目导航和答案修改<br/>
                  • 实时显示答题进度<br/>
                  • 自动评分和结果分析<br/>
                  • 错题集下载功能
                </div>
              </div>
            </div>
          </div>

          <div className="start-screen__warning">
            <div className="start-screen__warning-icon">⚠️</div>
            <div className="start-screen__warning-text">
              请确保网络连接稳定，考试过程中请勿刷新页面
            </div>
          </div>

          <div className="start-screen__actions">
            <Button
              variant="primary"
              size="large"
              onClick={handleStartExam}
              className="start-screen__start-button"
            >
              开始考试
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};