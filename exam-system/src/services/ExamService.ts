import { ExamPaper, ExamState, ExamResult, Answer, ExamScore } from '../types';

export class ExamService {
  private examState: ExamState | null = null;
  private timer: NodeJS.Timeout | null = null;
  private callbacks: Array<(state: ExamState) => void> = [];

  async startExam(paper: ExamPaper): Promise<ExamState> {
    this.examState = {
      status: 'inProgress',
      startTime: new Date().toISOString(),
      timeLimit: 90 * 60 * 1000, // 90 minutes in milliseconds
      timeRemaining: 90 * 60 * 1000,
      currentQuestion: 0,
      answers: {},
      score: {
        total: 0,
        singleChoice: 0,
        trueFalse: 0,
        multipleChoice: 0
      },
      wrongQuestions: []
    };

    this.startTimer();
    this.notifyStateChange();
    return this.examState;
  }

  async submitAnswer(questionId: string, userAnswer: string | string[]): Promise<ExamState> {
    if (!this.examState || this.examState.status !== 'inProgress') {
      throw new Error('Exam is not in progress');
    }

    const question = this.findQuestionById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = this.checkAnswer(question, userAnswer);
    
    this.examState.answers[questionId] = {
      questionId,
      userAnswer,
      isCorrect,
      timestamp: new Date().toISOString()
    };

    this.updateScore();
    this.notifyStateChange();
    return this.examState;
  }

  async completeExam(): Promise<ExamResult> {
    if (!this.examState) {
      throw new Error('No exam in progress');
    }

    this.examState.status = 'completed';
    this.examState.endTime = new Date().toISOString();
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    this.identifyWrongQuestions();
    this.updateScore();

    const percentage = (this.examState.score.total / 100) * 100;
    const passed = percentage >= 60;
    const message = passed ? '恭喜通过考试' : '继续加油';

    const result: ExamResult = {
      examState: this.examState,
      percentage,
      passed,
      message
    };

    this.notifyStateChange();
    return result;
  }

  async getExamState(): Promise<ExamState | null> {
    return this.examState;
  }

  navigateToQuestion(index: number): void {
    if (!this.examState || this.examState.status !== 'inProgress') {
      return;
    }

    if (index >= 0 && index < this.getExamPaper()?.questions.length!) {
      this.examState.currentQuestion = index;
      this.notifyStateChange();
    }
  }

  private startTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      if (!this.examState || this.examState.status !== 'inProgress') {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        return;
      }

      this.examState.timeRemaining -= 1000;

      if (this.examState.timeRemaining <= 0) {
        this.examState.timeRemaining = 0;
        this.autoSubmitExam();
      }

      this.notifyStateChange();
    }, 1000);
  }

  private autoSubmitExam(): void {
    this.completeExam().catch(error => {
      console.error('Auto submit failed:', error);
    });
  }

  private checkAnswer(question: any, userAnswer: string | string[]): boolean {
    if (question.type === 'multiple') {
      const userAnswerArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
      const correctAnswerArray = question.correctAnswer.split(',').map((a: string) => a.trim());
      return userAnswerArray.length === correctAnswerArray.length &&
             userAnswerArray.every(answer => correctAnswerArray.includes(answer));
    } else {
      const userAnswerStr = Array.isArray(userAnswer) ? userAnswer[0] : userAnswer;
      return userAnswerStr === question.correctAnswer;
    }
  }

  private updateScore(): void {
    if (!this.examState) return;

    let total = 0;
    let singleChoice = 0;
    let trueFalse = 0;
    let multipleChoice = 0;

    Object.values(this.examState.answers).forEach(answer => {
      const question = this.findQuestionById(answer.questionId);
      if (!question) return;

      const score = answer.isCorrect ? question.score : 0;
      total += score;

      switch (question.type) {
        case 'single':
          singleChoice += score;
          break;
        case 'trueFalse':
          trueFalse += score;
          break;
        case 'multiple':
          multipleChoice += score;
          break;
      }
    });

    this.examState.score = {
      total,
      singleChoice,
      trueFalse,
      multipleChoice
    };
  }

  private identifyWrongQuestions(): void {
    if (!this.examState) return;

    this.examState.wrongQuestions = Object.values(this.examState.answers)
      .filter(answer => !answer.isCorrect)
      .map(answer => answer.questionId);
  }

  private findQuestionById(questionId: string): any {
    const paper = this.getExamPaper();
    return paper?.questions.find(q => q.id === questionId);
  }

  private getExamPaper(): ExamPaper | null {
    return (this as any).paper || null;
  }

  private notifyStateChange(): void {
    if (this.examState) {
      this.callbacks.forEach(callback => callback(this.examState!));
    }
  }

  onStateChange(callback: (state: ExamState) => void): void {
    this.callbacks.push(callback);
  }

  removeStateChangeListener(callback: (state: ExamState) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getProgress(): { current: number; total: number; percentage: number } {
    if (!this.examState) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const paper = this.getExamPaper();
    const total = paper?.questions.length || 0;
    const answered = Object.keys(this.examState.answers).length;
    const percentage = total > 0 ? (answered / total) * 100 : 0;

    return { current: answered, total, percentage };
  }
}