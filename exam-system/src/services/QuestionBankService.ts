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

    // 更宽松的匹配：题号、选项、答案
    const isTitle = (s: string) => /^#{2,}\s*/.test(s);
    const isQuestionStart = (s: string) => /^\s*\d+[\.\、．)]\s*/.test(s);
    const isOptionLine = (s: string) => /^\s*[A-Ha-h][\.\、．)\s]+/.test(s);
    const getOptionText = (s: string) => s.replace(/^\s*[A-Ha-h][\.\、．)\s]+/, '').trim();
    const isAnswerLine = (s: string) =>
      /^\s*[（(【\[]?\s*(答案|正确答案|参考答案)\s*[)）】\]]?\s*[:：]?\s*/.test(s);
    const getAnswerText = (s: string) =>
      s.replace(/^\s*[（(【\[]?\s*(答案|正确答案|参考答案)\s*[)）】\]]?\s*[:：]?\s*/, '').trim().toUpperCase();

    const finalizeQuestion = () => {
      if (currentQuestion) {
        // 兜底修正题型与选项
        // 若判断题但未提供选项，自动补全为“对/错”
        if (questionType === 'trueFalse') {
          const normalize = (t: string) => {
            const s = String(t).trim();
            if (/^(对|正确|√|TRUE|T)$/i.test(s)) return '对';
            if (/^(错|错误|×|FALSE|F)$/i.test(s)) return '错';
            return s;
          };
          if (currentOptions.length > 0) {
            const mapped = currentOptions.map(normalize);
            const hasTrue = mapped.includes('对');
            const hasFalse = mapped.includes('错');
            if (hasTrue || hasFalse) {
              // 若包含对/错任一，统一成标准两项，避免与题库自带 A.对/B.错 叠加产生重复
              currentOptions = ['对', '错'];
            } else {
              // 否则对文本去重
              const seen = new Set<string>();
              currentOptions = mapped.filter(x => x && !seen.has(x) && (seen.add(x), true));
            }
          } else {
            // 缺失时再补齐
            currentOptions = ['对', '错'];
          }
        }
        // 若标记为单选但答案包含多个不同的字母，则修正为多选
        const lettersInAnswer = (currentAnswer.match(/[A-H]/gi) || []).map(c => c.toUpperCase());
        const uniqLetters = Array.from(new Set(lettersInAnswer));
        if (questionType === 'single' && uniqLetters.length > 1) {
          questionType = 'multiple';
        }

        this.saveQuestion(questions, {
          id: `q_${questions.length + 1}`,
          type: questionType,
          category: currentCategory,
          question: currentQuestion.trim(),
          options: currentOptions,
          correctAnswer: currentAnswer,
          score: questionType === 'multiple' ? 1.5 : 1
        });
      }
      currentQuestion = '';
      currentOptions = [];
      currentAnswer = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();

      if (!line) continue;

      if (isTitle(line)) {
        currentCategory = line.replace(/^#{2,}\s*/, '').trim();
        continue;
      }

      if (isQuestionStart(line)) {
        // 收尾上一题
        finalizeQuestion();

        currentQuestion = line.replace(/^\s*\d+[\.\、．)]\s*/, '');
        // 题型推断增强：若命中“判断题/是非题”分类或包含“判断题”
        const lower = (currentCategory + ' ' + currentQuestion).toLowerCase();
        if (/(判断|是非)/.test(currentCategory) || /(判断题|对错)/.test(currentQuestion)) {
          questionType = 'trueFalse';
        } else if (/(多选)/.test(currentCategory) || /(多选)/.test(currentQuestion)) {
          questionType = 'multiple';
        } else {
          questionType = 'single';
        }
        continue;
      }

      if (isOptionLine(line)) {
        currentOptions.push(getOptionText(line));
        continue;
      }

      if (isAnswerLine(line)) {
        currentAnswer = getAnswerText(line);

        // 若答案为对/错类，强制判定为判断题，并规范化与补全选项
        if (/^(对|√|TRUE|T|错|×|FALSE|F)$/.test(currentAnswer)) {
          questionType = 'trueFalse';
          if (/^(对|√|TRUE|T)$/.test(currentAnswer)) currentAnswer = '对';
          else if (/^(错|×|FALSE|F)$/.test(currentAnswer)) currentAnswer = '错';
          if (currentOptions.length === 0) {
            currentOptions = ['对', '错'];
          }
        } else {
          // 非判断题：若答案含多个不同选项字母，则自动识别为多选题
          const letters = (currentAnswer.match(/[A-H]/gi) || []).map(c => c.toUpperCase());
          if (Array.from(new Set(letters)).length > 1) {
            questionType = 'multiple';
          }
        }

        continue;
      }

      // 追加到题干
      if (!isTitle(line) && !isQuestionStart(line) && !isOptionLine(line)) {
        currentQuestion = (currentQuestion ? currentQuestion + ' ' : '') + line;
      }
    }

    // 收尾最后一题
    finalizeQuestion();

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
    difficulty?: 'basic' | 'applied';
  }): Promise<ExamPaper> {
    const markdownContent = await this.loadQuestionBank(options.difficulty);
    const questionBank = await this.parseQuestionBank(markdownContent);
    
    const singleQuestions = questionBank.questions.filter(q => q.type === 'single');
    const trueFalseQuestions = questionBank.questions.filter(q => q.type === 'trueFalse');
    const multipleQuestions = questionBank.questions.filter(q => q.type === 'multiple');

    console.info('[QB] Parsed questions by type:', {
      singles: singleQuestions.length,
      trueFalse: trueFalseQuestions.length,
      multiples: multipleQuestions.length,
      difficulty: options.difficulty
    });
    
    // 按题型分别随机，然后按顺序拼接，保证题型顺序：单选 → 判断 → 多选
    // 先从当前题库无放回抽样
    let selectedSingles = this.selectRandomQuestions(singleQuestions, options.singleCount);
    let selectedTrueFalse = this.selectRandomQuestions(trueFalseQuestions, options.trueFalseCount);
    let selectedMultiples = this.selectRandomQuestions(multipleQuestions, options.multipleCount);

    // 若 basic 题库某题型不足，则从 applied 题库补齐
    const needSingle = options.singleCount - selectedSingles.length;
    const needTF = options.trueFalseCount - selectedTrueFalse.length;
    const needMulti = options.multipleCount - selectedMultiples.length;

    if ((needSingle > 0 || needTF > 0 || needMulti > 0) && options.difficulty === 'basic') {
      const fbMd = await this.loadQuestionBank('applied');
      const fbBank = await this.parseQuestionBank(fbMd);

      const exists = new Set<string>([...selectedSingles, ...selectedTrueFalse, ...selectedMultiples].map(q => q.question));

      const fbSingles = fbBank.questions.filter(q => q.type === 'single' && !exists.has(q.question));
      selectedSingles = selectedSingles.concat(this.selectRandomQuestions(fbSingles, Math.max(0, needSingle)));
      selectedSingles.forEach(q => exists.add(q.question));

      const fbTF = fbBank.questions.filter(q => q.type === 'trueFalse' && !exists.has(q.question));
      selectedTrueFalse = selectedTrueFalse.concat(this.selectRandomQuestions(fbTF, Math.max(0, needTF)));
      selectedTrueFalse.forEach(q => exists.add(q.question));

      const fbMulti = fbBank.questions.filter(q => q.type === 'multiple' && !exists.has(q.question));
      selectedMultiples = selectedMultiples.concat(this.selectRandomQuestions(fbMulti, Math.max(0, needMulti)));
      selectedMultiples.forEach(q => exists.add(q.question));
    }

    // 兜底：若仍不足，则允许从已有池中补齐到目标数量（可能重复）
    const topUp = (arr: Question[], pool: Question[], target: number) => {
      if (pool.length === 0) return;
      while (arr.length < target) {
        arr.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    };
    topUp(selectedSingles, singleQuestions, options.singleCount);
    topUp(selectedTrueFalse, trueFalseQuestions, options.trueFalseCount);
    topUp(selectedMultiples, multipleQuestions, options.multipleCount);

    // 如需在题型内打乱，可分别 shuffle
    this.shuffleArray(selectedSingles);
    this.shuffleArray(selectedTrueFalse);
    this.shuffleArray(selectedMultiples);

    let selectedQuestions: Question[] = [
      ...selectedSingles,
      ...selectedTrueFalse,
      ...selectedMultiples
    ];

    // 再保险：按题型进行稳定排序，确保顺序为 单选(0) → 判断(1) → 多选(2)
    const typeOrder: Record<string, number> = { single: 0, trueFalse: 1, multiple: 2 };
    selectedQuestions = selectedQuestions.slice().sort((a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99));
    
    return {
      id: `exam_${Date.now()}`,
      questions: selectedQuestions,
      totalScore: selectedQuestions.reduce((sum, q) => sum + q.score, 0),
      generatedAt: new Date().toISOString()
    };
  }
  
  private selectRandomQuestions(questions: Question[], count: number): Question[] {
    // 无放回抽样：先洗牌再截取，保证唯一性
    const shuffled = [...questions];
    this.shuffleArray(shuffled);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }
  
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  private async loadQuestionBank(difficulty: 'basic' | 'applied' = 'applied'): Promise<string> {
    try {
      // basic -> 根目录题库.md（复制到 public/data/basic.md）；applied -> 现有题库
      const path = difficulty === 'basic' ? '/data/basic.md' : '/data/questionBank.md';
      const response = await fetch(path);
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