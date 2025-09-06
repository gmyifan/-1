import { AuthService } from './AuthService';
import { WrongQuestion, UserStats, ExamRecord, PaginationInfo, ExamResult, Question } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export class UserExamService {
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  async submitExamResult(examResult: ExamResult, examPaper: any): Promise<void> {
    try {
      const { examState } = examResult;
      
      // 准备错题数据
      const wrongQuestions: Question[] = examPaper.questions.filter((q: Question) => 
        examState.wrongQuestions.includes(q.id)
      ).map((q: Question) => {
        const userAnswer = examState.answers[q.id];
        return {
          ...q,
          userAnswer: userAnswer?.userAnswer || ''
        };
      });

      const submitData = {
        examId: examPaper.id,
        score: examState.score.total,
        totalScore: examPaper.totalScore,
        startTime: examState.startTime,
        endTime: examState.endTime,
        wrongQuestions
      };

      const response = await this.authService.authenticatedFetch(
        `${API_BASE_URL}/exam/submit`,
        {
          method: 'POST',
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '提交考试结果失败');
      }

      console.log('考试结果提交成功');
    } catch (error) {
      console.error('提交考试结果失败:', error);
      throw error;
    }
  }

  async getWrongQuestions(
    page: number = 1, 
    limit: number = 20, 
    type?: string
  ): Promise<{ wrongQuestions: WrongQuestion[]; pagination: PaginationInfo }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (type) {
        params.append('type', type);
      }

      const response = await this.authService.authenticatedFetch(
        `${API_BASE_URL}/exam/wrong-questions?${params}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取错题失败');
      }

      const data = await response.json();
      if (data && Array.isArray(data.wrongQuestions)) {
        const normalizeTFOption = (s: string) => {
          const t = String(s || '').trim();
          if (/^(对|正确|√|TRUE|T)$/i.test(t)) return '对';
          if (/^(错|错误|×|FALSE|F)$/i.test(t)) return '错';
          return t;
        };
        data.wrongQuestions = data.wrongQuestions.map((q: WrongQuestion) => {
          if (q.type !== 'trueFalse') return q;
          const opts = Array.isArray(q.options) ? q.options.map(normalizeTFOption) : [];
          let normalizedOptions: string[];
          if (opts.includes('对') || opts.includes('错')) {
            normalizedOptions = ['对', '错'];
          } else {
            const seen = new Set<string>();
            normalizedOptions = opts.filter(x => x && !seen.has(x) && (seen.add(x), true));
            if (normalizedOptions.length === 0) normalizedOptions = ['对', '错'];
          }
          const correctAnswer = normalizeTFOption(q.correctAnswer);
          const userAnswer = normalizeTFOption(q.userAnswer);
          return { ...q, options: normalizedOptions, correctAnswer, userAnswer };
        });
      }
      return data;
    } catch (error) {
      console.error('获取错题失败:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      const response = await this.authService.authenticatedFetch(
        `${API_BASE_URL}/exam/stats`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取统计信息失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取统计信息失败:', error);
      throw error;
    }
  }

  async getExamHistory(
    page: number = 1, 
    limit: number = 10
  ): Promise<{ records: ExamRecord[]; pagination: PaginationInfo }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await this.authService.authenticatedFetch(
        `${API_BASE_URL}/exam/history?${params}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取考试历史失败');
      }

      return await response.json();
    } catch (error) {
      console.error('获取考试历史失败:', error);
      throw error;
    }
  }
}