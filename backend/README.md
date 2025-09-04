# 网络安全考试系统后端API

## 功能特性

- 用户注册和登录（手机号+密码）
- JWT身份认证
- 考试结果记录
- 错题历史管理
- 用户统计信息
- 数据库自动初始化

## 技术栈

- Node.js + Express
- SQLite数据库
- JWT认证
- bcryptjs密码加密
- 输入验证和安全防护

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器将在 http://localhost:3001 启动

## API接口

### 认证接口

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "your_password"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "phone": "13800138000", 
  "password": "your_password"
}
```

#### 验证Token
```
GET /api/auth/verify
Authorization: Bearer <token>
```

### 考试接口

#### 提交考试结果
```
POST /api/exam/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "examId": "exam_123",
  "score": 85,
  "totalScore": 100,
  "startTime": "2025-01-01T10:00:00.000Z",
  "endTime": "2025-01-01T11:30:00.000Z",
  "wrongQuestions": [...]
}
```

#### 获取错题历史
```
GET /api/exam/wrong-questions?page=1&limit=20&type=single
Authorization: Bearer <token>
```

#### 获取用户统计
```
GET /api/exam/stats
Authorization: Bearer <token>
```

#### 获取考试历史
```
GET /api/exam/history?page=1&limit=10
Authorization: Bearer <token>
```

## 数据库结构

### users 用户表
- id: 主键
- phone: 手机号（唯一）
- password_hash: 密码哈希
- created_at: 创建时间
- updated_at: 更新时间

### exam_records 考试记录表
- id: 主键
- user_id: 用户ID
- exam_id: 考试ID
- score: 得分
- total_score: 总分
- percentage: 百分比
- passed: 是否通过
- start_time: 开始时间
- end_time: 结束时间
- time_used: 用时（秒）
- created_at: 创建时间

### wrong_questions 错题表
- id: 主键
- user_id: 用户ID
- exam_record_id: 考试记录ID
- question_id: 题目ID
- question_type: 题目类型
- question_category: 题目分类
- question_text: 题目内容
- question_options: 选项（JSON）
- correct_answer: 正确答案
- user_answer: 用户答案
- question_score: 题目分值
- created_at: 创建时间

### user_stats 用户统计表
- id: 主键
- user_id: 用户ID
- total_exams: 总考试次数
- total_questions: 总题目数
- total_wrong: 总错题数
- avg_score: 平均分
- best_score: 最高分
- last_exam_date: 最后考试时间
- created_at: 创建时间
- updated_at: 更新时间

## 安全特性

- 密码bcrypt加密（12轮）
- JWT token认证
- 请求频率限制
- 输入验证和清理
- CORS跨域保护
- Helmet安全头

## 环境变量

```bash
# .env 文件
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
```

## 部署说明

1. 设置环境变量
2. 运行 `npm run init-db` 初始化数据库
3. 使用 PM2 或其他进程管理器启动服务
4. 配置反向代理（Nginx）
5. 设置HTTPS证书

## 开发说明

- 使用nodemon自动重启
- SQLite数据库文件位于 `database/exam.db`
- 日志输出到控制台
- 支持热重载开发