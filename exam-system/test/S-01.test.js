// 测试项目初始化和基础架构
const fs = require('fs');
const path = require('path');

describe('S-01: 项目初始化与基础架构搭建', () => {
  const projectRoot = process.cwd();
  
  test('项目目录结构正确', () => {
    const expectedDirs = [
      'src',
      'src/components',
      'src/services', 
      'src/utils',
      'src/state',
      'src/styles',
      'public',
      'public/data'
    ];
    
    expectedDirs.forEach(dir => {
      expect(fs.existsSync(path.join(projectRoot, dir))).toBe(true);
    });
  });
  
  test('package.json包含必要依赖', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    
    const expectedDeps = [
      'react',
      'react-dom', 
      'typescript',
      'docx',
      'file-saver'
    ];
    
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    expectedDeps.forEach(dep => {
      expect(allDeps[dep]).toBeDefined();
    });
  });
  
  test('tsconfig.json配置正确', () => {
    expect(fs.existsSync(path.join(projectRoot, 'tsconfig.json'))).toBe(true);
    
    const tsConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'tsconfig.json'), 'utf8'));
    
    expect(tsConfig.compilerOptions).toEqual(
      expect.objectContaining({
        target: expect.any(String),
        lib: expect.arrayContaining(['dom', 'es6']),
        jsx: expect.any(String),
        strict: true
      })
    );
  });
  
  test('基础样式文件存在', () => {
    const styleFiles = [
      'src/styles/index.css',
      'src/styles/App.css'
    ];
    
    styleFiles.forEach(file => {
      expect(fs.existsSync(path.join(projectRoot, file))).toBe(true);
    });
  });
});