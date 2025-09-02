import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { Question } from '../types';

export class DocumentService {
  
  async generateWrongQuestionsDoc(wrongQuestions: Question[]): Promise<Blob> {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: '网络安全与信息化知识测试题 - 错题集',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            text: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            text: `共 ${wrongQuestions.length} 道错题`,
            spacing: { after: 600 }
          }),
          
          ...this.generateQuestionTables(wrongQuestions)
        ]
      }]
    });

    return Packer.toBlob(doc);
  }

  private generateQuestionTables(questions: Question[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    questions.forEach((question, index) => {
      paragraphs.push(
        new Paragraph({
          text: `题目 ${index + 1}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        })
      );

      paragraphs.push(
        new Paragraph({
          text: `题目类型: ${this.getQuestionTypeText(question.type)}`,
          spacing: { after: 100 }
        })
      );

      paragraphs.push(
        new Paragraph({
          text: `题目分类: ${question.category}`,
          spacing: { after: 100 }
        })
      );

      paragraphs.push(
        new Paragraph({
          text: `题目内容: ${question.question}`,
          spacing: { after: 200 }
        })
      );

      if (question.type !== 'trueFalse') {
        paragraphs.push(
          new Paragraph({
            text: '选项:',
            spacing: { after: 100 }
          })
        );

        question.options.forEach((option, optionIndex) => {
          const optionLetter = String.fromCharCode(65 + optionIndex);
          paragraphs.push(
            new Paragraph({
              text: `${optionLetter}. ${option}`,
              spacing: { after: 50 },
              indent: { left: 400 }
            })
          );
        });
      }

      paragraphs.push(
        new Paragraph({
          text: `正确答案: ${question.correctAnswer}`,
          spacing: { after: 100 },
          color: '008000'
        })
      );

      paragraphs.push(
        new Paragraph({
          text: '题目分值: ' + (question.type === 'multiple' ? '1.5分' : '1分'),
          spacing: { after: 600 }
        })
      );
    });

    return paragraphs;
  }

  private getQuestionTypeText(type: string): string {
    switch (type) {
      case 'single':
        return '单选题';
      case 'trueFalse':
        return '判断题';
      case 'multiple':
        return '多选题';
      default:
        return '未知类型';
    }
  }

  async downloadFile(data: Blob, filename: string): Promise<void> {
    try {
      saveAs(data, filename);
    } catch (error) {
      console.error('下载文件失败:', error);
      throw new Error('文件下载失败，请重试');
    }
  }

  async generateAndDownloadWrongQuestions(wrongQuestions: Question[]): Promise<void> {
    if (wrongQuestions.length === 0) {
      throw new Error('没有错题需要下载');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `网络安全错题集_${timestamp}.docx`;
    
    try {
      const docBlob = await this.generateWrongQuestionsDoc(wrongQuestions);
      await this.downloadFile(docBlob, filename);
    } catch (error) {
      console.error('生成错题文档失败:', error);
      throw new Error('生成错题文档失败，请重试');
    }
  }

  async generateExamReport(examResult: any): Promise<Blob> {
    const { examState, percentage, passed, message } = examResult;
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: '网络安全与信息化知识测试题 - 考试报告',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            text: `考试时间: ${new Date(examState.startTime!).toLocaleString('zh-CN')}`,
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            text: `结束时间: ${new Date(examState.endTime!).toLocaleString('zh-CN')}`,
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            text: `考试结果: ${message}`,
            spacing: { after: 100 },
            color: passed ? '008000' : 'FF0000'
          }),
          
          new Paragraph({
            text: `得分: ${examState.score.total}分 (${percentage.toFixed(1)}%)`,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            text: '详细得分:',
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            text: `单选题: ${examState.score.singleChoice}分`,
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            text: `判断题: ${examState.score.trueFalse}分`,
            spacing: { after: 100 }
          }),
          
          new Paragraph({
            text: `多选题: ${examState.score.multipleChoice}分`,
            spacing: { after: 400 }
          }),
          
          new Paragraph({
            text: `答题情况: ${Object.keys(examState.answers).length}题 / ${examState.wrongQuestions.length}题错误`,
            spacing: { after: 400 }
          })
        ]
      }]
    });

    return Packer.toBlob(doc);
  }
}