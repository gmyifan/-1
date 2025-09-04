const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 提交考试结果
router.post('/submit', authenticateToken, [
  body('examId').notEmpty().withMessage('考试ID不能为空'),
  body('score').isNumeric().withMessage('分数必须为数字'),
  body('totalScore').isNumeric().withMessage('总分必须为数字'),
  body('startTime').isISO8601().withMessage('开始时间格式错误'),
  body('endTime').isISO8601().withMessage('结束时间格式错误'),
  body('wrongQuestions').isArray().withMessage('错题列表必须为数组')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const {
      examId,
      score,
      totalScore,
      startTime,
      endTime,
      wrongQuestions
    } = req.body;

    const userId = req.user.userId;
    const percentage = (score / totalScore) * 100;
    const passed = percentage >= 60;
    const timeUsed = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);

    const db = getDatabase();

    // 插入考试记录
    db.run(
      `INSERT INTO exam_records 
       (user_id, exam_id, score, total_score, percentage, passed, start_time, end_time, time_used)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, examId, score, totalScore, percentage, passed, startTime, endTime, timeUsed],
      function(err) {
        if (err) {
          console.error('插入考试记录失败:', err);
          db.close();
          return res.status(500).json({ error: '保存考试记录失败' });
        }

        const examRecordId = this.lastID;

        // 插入错题记录
        if (wrongQuestions.length > 0) {
          const wrongQuestionStmt = db.prepare(`
            INSERT INTO wrong_questions 
            (user_id, exam_record_id, question_id, question_type, question_category, 
             question_text, question_options, correct_answer, user_answer, question_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          wrongQuestions.forEach(q => {
            wrongQuestionStmt.run([
              userId,
              examRecordId,
              q.id,
              q.type,
              q.category || '',
              q.question,
              JSON.stringify(q.options),
              q.correctAnswer,
              q.userAnswer || '',
              q.score
            ]);
          });

          wrongQuestionStmt.finalize();
        }

        // 更新用户统计
        db.run(`
          UPDATE user_stats SET
            total_exams = total_exams + 1,
            total_questions = total_questions + ?,
            total_wrong = total_wrong + ?,
            avg_score = (
              SELECT AVG(score) FROM exam_records WHERE user_id = ?
            ),
            best_score = (
              SELECT MAX(score) FROM exam_records WHERE user_id = ?
            ),
            last_exam_date = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [
          Math.round(totalScore), // 总题数
          wrongQuestions.length,
          userId,
          userId,
          endTime,
          userId
        ], (err) => {
          db.close();
          if (err) {
            console.error('更新用户统计失败:', err);
          }
        });

        res.json({
          message: '考试结果保存成功',
          examRecordId,
          score,
          percentage,
          passed
        });
      }
    );
  } catch (error) {
    console.error('提交考试结果错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户错题历史
router.get('/wrong-questions', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 20, type } = req.query;
  const offset = (page - 1) * limit;

  const db = getDatabase();

  let whereClause = 'WHERE wq.user_id = ?';
  let params = [userId];

  if (type && ['single', 'multiple', 'trueFalse'].includes(type)) {
    whereClause += ' AND wq.question_type = ?';
    params.push(type);
  }

  const query = `
    SELECT 
      wq.*,
      er.score as exam_score,
      er.percentage as exam_percentage,
      er.created_at as exam_date
    FROM wrong_questions wq
    JOIN exam_records er ON wq.exam_record_id = er.id
    ${whereClause}
    ORDER BY wq.created_at DESC
    LIMIT ? OFFSET ?
  `;

  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('查询错题失败:', err);
      db.close();
      return res.status(500).json({ error: '查询错题失败' });
    }

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM wrong_questions wq
      ${whereClause}
    `;

    db.get(countQuery, params.slice(0, -2), (err, countResult) => {
      db.close();
      
      if (err) {
        console.error('查询错题总数失败:', err);
        return res.status(500).json({ error: '查询错题总数失败' });
      }

      const wrongQuestions = rows.map(row => ({
        id: row.id,
        questionId: row.question_id,
        type: row.question_type,
        category: row.question_category,
        question: row.question_text,
        options: JSON.parse(row.question_options),
        correctAnswer: row.correct_answer,
        userAnswer: row.user_answer,
        score: row.question_score,
        examScore: row.exam_score,
        examPercentage: row.exam_percentage,
        examDate: row.exam_date,
        createdAt: row.created_at
      }));

      res.json({
        wrongQuestions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// 获取用户统计信息
router.get('/stats', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const db = getDatabase();

  db.get(`
    SELECT 
      us.*,
      (SELECT COUNT(*) FROM wrong_questions WHERE user_id = ?) as unique_wrong_questions
    FROM user_stats us
    WHERE us.user_id = ?
  `, [userId, userId], (err, stats) => {
    if (err) {
      console.error('查询用户统计失败:', err);
      db.close();
      return res.status(500).json({ error: '查询统计信息失败' });
    }

    db.close();
    res.json(stats || {
      total_exams: 0,
      total_questions: 0,
      total_wrong: 0,
      avg_score: 0,
      best_score: 0,
      unique_wrong_questions: 0
    });
  });
});

// 获取考试历史
router.get('/history', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const db = getDatabase();

  db.all(`
    SELECT *
    FROM exam_records
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [userId, parseInt(limit), parseInt(offset)], (err, records) => {
    if (err) {
      console.error('查询考试历史失败:', err);
      db.close();
      return res.status(500).json({ error: '查询考试历史失败' });
    }

    db.get('SELECT COUNT(*) as total FROM exam_records WHERE user_id = ?', [userId], (err, countResult) => {
      db.close();
      
      if (err) {
        console.error('查询考试历史总数失败:', err);
        return res.status(500).json({ error: '查询考试历史总数失败' });
      }

      res.json({
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

module.exports = router;