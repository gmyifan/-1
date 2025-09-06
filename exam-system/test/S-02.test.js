// 测试数据模型与类型定义
const fs = require('fs');
const path = require('path');

describe('S-02: 数据模型与类型定义', () => {
  const projectRoot = process.cwd();
  
  test('types.ts文件存在', () => {
    expect(fs.existsSync(path.join(projectRoot, 'src/types.ts'))).toBe(true);
  });
  
  test('包含必需的类型定义', () => {
    const typesContent = fs.readFileSync(path.join(projectRoot, 'src/types.ts'), 'utf8');
    
    const expectedTypes = [
      'Question',
      'QuestionBank', 
      'ExamPaper',
      'ExamState',
      'Answer',
      'ExamScore',
      'ExamResult'
    ];
    
    expectedTypes.forEach(type => {
      expect(typesContent.includes(`export interface ${type}`) || 
             typesContent.includes(`export type ${type}`)).toBe(true);
    });
  });
  
  test('支持三种题型', () => {
    const typesContent = fs.readFileSync(path.join(projectRoot, 'src/types.ts'), 'utf8');
    
    expect(typesContent.includes('single')).toBe(true);
    expect(typesContent.includes('trueFalse')).toBe(true);
    expect(typesContent.includes('multiple')).toBe(true);
  });
  
  test('TypeScript编译通过', () => {
    const result = require('child_process').spawnSync('npx', ['tsc', '--noEmit'], {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    
    expect(result.status).toBe(0);
  });
});