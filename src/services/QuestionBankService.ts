import { Question, QuestionBank, ExamPaper } from '../types';

export class QuestionBankService {
  
  async parseQuestionBank(markdownContent: string): Promise<QuestionBank> {
    const questions: Question[] = [];
    const lines = markdownContent.split('\n');
    
    let currentCategory = '';
    let currentQuestion = '';
    let currentOptions: string[] = [];
    let currentAnswer = '';
    let questionType: 'single' | 'trueFalse' | 'multiple' = 'single';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('##')) {
        currentCategory = line.replace('##', '').trim();
        continue;
      }
      
      if (line.match(/^\d+\./)) {
        if (currentQuestion) {
          this.saveQuestion(questions, {
            id: `q_${questions.length + 1}`,
            type: questionType,
            category: currentCategory,
            question: currentQuestion,
            options: currentOptions,
            correctAnswer: currentAnswer,
            score: questionType === 'multiple' ? 1.5 : 1
          });
        }
        
        currentQuestion = line.replace(/^\d+\.\s*/, '');
        currentOptions = [];
        currentAnswer = '';
        
        if (currentQuestion.includes('判断')) {
          questionType = 'trueFalse';
          currentOptions = ['对', '错'];
        } else if (currentQuestion.includes('多选')) {
          questionType = 'multiple';
        } else {
          questionType = 'single';
        }
        
        continue;
      }
      
      if (line.match(/^[A-Z]/) && line.includes('.')) {
        const option = line.replace(/^[A-Z]\.\s*/, '');
        currentOptions.push(option);
        continue;
      }
      
      if (line.startsWith('答案：')) {
        currentAnswer = line.replace('答案：', '').trim();
        continue;
      }
      
      if (line && !line.startsWith('##') && !line.match(/^\d+\./) && !line.match(/^[A-Z]/)) {
        currentQuestion += ' ' + line;
      }
    }
    
    if (currentQuestion) {
      this.saveQuestion(questions, {
        id: `q_${questions.length + 1}`,
        type: questionType,
        category: currentCategory,
        question: currentQuestion,
        options: currentOptions,
        correctAnswer: currentAnswer,
        score: questionType === 'multiple' ? 1.5 : 1
      });
    }
    
    return { questions };
  }
  
  private saveQuestion(questions: Question[], question: Question) {
    if (question.question && question.options.length > 0 && question.correctAnswer) {
      questions.push(question);
    }
  }
  
  async generateExamPaper(options: {
    singleCount: number;
    trueFalseCount: number;
    multipleCount: number;
  }): Promise<ExamPaper> {
    const markdownContent = await this.loadQuestionBank();
    const questionBank = await this.parseQuestionBank(markdownContent);
    
    const singleQuestions = questionBank.questions.filter(q => q.type === 'single');
    const trueFalseQuestions = questionBank.questions.filter(q => q.type === 'trueFalse');
    const multipleQuestions = questionBank.questions.filter(q => q.type === 'multiple');
    
    const selectedQuestions: Question[] = [];
    
    selectedQuestions.push(...this.selectRandomQuestions(singleQuestions, options.singleCount));
    selectedQuestions.push(...this.selectRandomQuestions(trueFalseQuestions, options.trueFalseCount));
    selectedQuestions.push(...this.selectRandomQuestions(multipleQuestions, options.multipleCount));
    
    this.shuffleArray(selectedQuestions);
    
    return {
      id: `exam_${Date.now()}`,
      questions: selectedQuestions,
      totalScore: selectedQuestions.reduce((sum, q) => sum + q.score, 0),
      generatedAt: new Date().toISOString()
    };
  }
  
  private selectRandomQuestions(questions: Question[], count: number): Question[] {
    const selected: Question[] = [];
    const available = [...questions];
    
    while (selected.length < count && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      selected.push(available[randomIndex]);
      
      if (available.length > count - selected.length) {
        available.splice(randomIndex, 1);
      }
    }
    
    return selected;
  }
  
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  private async loadQuestionBank(): Promise<string> {
    try {
      const response = await fetch('/data/questionBank.md');
      if (!response.ok) {
        throw new Error('Failed to load question bank');
      }
      return await response.text();
    } catch (error) {
      console.error('Error loading question bank:', error);
      throw error;
    }
  }
}