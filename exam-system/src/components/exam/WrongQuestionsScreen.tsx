import React, { useState, useEffect, useCallback } from 'react';
import { UserExamService } from '../../services/UserExamService';
import { WrongQuestion, UserStats } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import './WrongQuestionsScreen.css';

const formatCorrectAnswer = (type: string, options: string[] | undefined, correctAnswer: string): string => {
  if (type === 'trueFalse') {
    const idx = Array.isArray(options) ? options.indexOf(correctAnswer) : -1;
    const letter = idx >= 0 ? String.fromCharCode(65 + idx) : '';
    return letter ? `${letter} ${correctAnswer}` : correctAnswer;
  }
  const letters = (correctAnswer.match(/[A-H]/gi) || []).map(c => c.toUpperCase());
  if (letters.length && Array.isArray(options) && options.length) {
    const uniq = Array.from(new Set(letters)).sort();
    const texts = uniq
      .map(l => {
        const i = l.charCodeAt(0) - 65;
        return options[i];
      })
      .filter(Boolean);
    return `${uniq.join('')}${texts.length ? ' ' + texts.join('、') : ''}`;
  }
  return correctAnswer;
};

/** 将用户答案（后端存储为字符串）格式化为“字母 + 文本” */
const formatUserAnswer = (type: string, options: string[] | undefined, userAnswer?: string | null): string => {
  if (!userAnswer || userAnswer.trim() === '') return '未作答';
  const opts = Array.isArray(options) ? options : [];
  const parts = userAnswer.split(/[,\s，、]+/).filter(Boolean);

  const mapOne = (val: string): { letter?: string; text: string } => {
    if (/^[A-Ha-h]$/.test(val)) {
      const idx = val.toUpperCase().charCodeAt(0) - 65;
      const text = opts[idx] ?? val.toUpperCase();
      return { letter: String.fromCharCode(65 + idx), text };
    }
    const idx = opts.indexOf(val);
    if (idx >= 0) {
      return { letter: String.fromCharCode(65 + idx), text: opts[idx] };
    }
    return { text: val };
  };

  const mapped = parts.map(mapOne);
  const letters = Array.from(new Set(mapped.map(m => m.letter).filter(Boolean) as string[])).sort();
  const texts = mapped.map(m => m.text).filter(Boolean);

  if (type === 'trueFalse') {
    const primary = parts[0] ?? '';
    const idx = opts.indexOf(primary);
    const letter = idx >= 0 ? String.fromCharCode(65 + idx) : (letters[0] || '');
    const text = idx >= 0 ? opts[idx] : primary;
    return letter ? `${letter} ${text}` : text;
  }

  return letters.length ? `${letters.join('')}${texts.length ? ' ' + texts.join('、') : ''}` : texts.join('、');
};

interface WrongQuestionsScreenProps {
  onBack: () => void;
}

export const WrongQuestionsScreen: React.FC<WrongQuestionsScreenProps> = ({ onBack }) => {
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');

  const userExamService = React.useMemo(() => new UserExamService(), []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [wrongQuestionsData, statsData] = await Promise.all([
        userExamService.getWrongQuestions(currentPage, 10, selectedType || undefined),
        userExamService.getUserStats()
      ]);

      setWrongQuestions(wrongQuestionsData.wrongQuestions);
      setTotalPages(wrongQuestionsData.pagination.totalPages);
      setStats(statsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedType, userExamService]);

  useEffect(() => {
    loadData();
  }, [loadData]);



  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getQuestionTypeText = (type: string) => {
    switch (type) {
      case 'single': return '单选题';
      case 'trueFalse': return '判断题';
      case 'multiple': return '多选题';
      default: return '未知类型';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (loading && currentPage === 1) {
    return (
      <div className="wrong-questions-screen">
        <div className="wrong-questions-screen__loading">
          <div className="wrong-questions-screen__loading-text">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrong-questions-screen">
      <div className="wrong-questions-screen__header">
        <Button
          variant="secondary"
          onClick={onBack}
          className="wrong-questions-screen__back-button"
        >
          ← 返回
        </Button>
        <h1 className="wrong-questions-screen__title">我的错题集</h1>
      </div>

      {stats && (
        <Card className="wrong-questions-screen__stats" elevation={2}>
          <div className="wrong-questions-screen__stats-grid">
            <div className="wrong-questions-screen__stat-item">
              <div className="wrong-questions-screen__stat-number">{stats.total_exams}</div>
              <div className="wrong-questions-screen__stat-label">总考试次数</div>
            </div>
            <div className="wrong-questions-screen__stat-item">
              <div className="wrong-questions-screen__stat-number">{stats.unique_wrong_questions}</div>
              <div className="wrong-questions-screen__stat-label">错题总数</div>
            </div>
            <div className="wrong-questions-screen__stat-item">
              <div className="wrong-questions-screen__stat-number">{stats.avg_score.toFixed(1)}</div>
              <div className="wrong-questions-screen__stat-label">平均分</div>
            </div>
            <div className="wrong-questions-screen__stat-item">
              <div className="wrong-questions-screen__stat-number">{stats.best_score}</div>
              <div className="wrong-questions-screen__stat-label">最高分</div>
            </div>
          </div>
        </Card>
      )}

      <Card className="wrong-questions-screen__filters" elevation={1}>
        <div className="wrong-questions-screen__filter-title">题型筛选</div>
        <div className="wrong-questions-screen__filter-buttons">
          <Button
            variant={selectedType === '' ? 'primary' : 'secondary'}
            onClick={() => handleTypeFilter('')}
            size="small"
          >
            全部
          </Button>
          <Button
            variant={selectedType === 'single' ? 'primary' : 'secondary'}
            onClick={() => handleTypeFilter('single')}
            size="small"
          >
            单选题
          </Button>
          <Button
            variant={selectedType === 'trueFalse' ? 'primary' : 'secondary'}
            onClick={() => handleTypeFilter('trueFalse')}
            size="small"
          >
            判断题
          </Button>
          <Button
            variant={selectedType === 'multiple' ? 'primary' : 'secondary'}
            onClick={() => handleTypeFilter('multiple')}
            size="small"
          >
            多选题
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="wrong-questions-screen__error" elevation={1}>
          <div className="wrong-questions-screen__error-text">{error}</div>
          <Button variant="primary" onClick={loadData}>重试</Button>
        </Card>
      )}

      {wrongQuestions.length === 0 && !loading && !error ? (
        <Card className="wrong-questions-screen__empty" elevation={1}>
          <div className="wrong-questions-screen__empty-icon">🎉</div>
          <div className="wrong-questions-screen__empty-title">暂无错题</div>
          <div className="wrong-questions-screen__empty-text">
            {selectedType ? '该题型暂无错题记录' : '恭喜！您还没有错题记录'}
          </div>
        </Card>
      ) : (
        <div className="wrong-questions-screen__list">
          {wrongQuestions.map((question, index) => (
            <Card key={question.id} className="wrong-questions-screen__question" elevation={1}>
              <div className="wrong-questions-screen__question-header">
                <div className="wrong-questions-screen__question-meta">
                  <span className="wrong-questions-screen__question-type">
                    {getQuestionTypeText(question.type)}
                  </span>
                  <span className="wrong-questions-screen__question-score">
                    {question.score}分
                  </span>
                </div>
                <div className="wrong-questions-screen__question-date">
                  {formatDate(question.examDate)}
                </div>
              </div>

              <div className="wrong-questions-screen__question-content">
                <div className="wrong-questions-screen__question-text">
                  {question.question}
                </div>

                {question.options && question.options.length > 0 && (
                  <div className="wrong-questions-screen__question-options">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="wrong-questions-screen__option">
                        {option}
                      </div>
                    ))}
                  </div>
                )}

                <div className="wrong-questions-screen__answers">
                  <div className="wrong-questions-screen__answer-item wrong-questions-screen__answer-item--correct">
                    <strong>正确答案：</strong>{formatCorrectAnswer(question.type, question.options, question.correctAnswer)}
                  </div>
                  <div className="wrong-questions-screen__answer-item wrong-questions-screen__answer-item--wrong">
                    <strong>你的答案：</strong>{formatUserAnswer(question.type, question.options, question.userAnswer)}
                  </div>
                </div>

                <div className="wrong-questions-screen__exam-info">
                  考试得分：{question.examScore}分 ({question.examPercentage.toFixed(1)}%)
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="wrong-questions-screen__pagination">
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          
          <span className="wrong-questions-screen__pagination-info">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          
          <Button
            variant="secondary"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
};