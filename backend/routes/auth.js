const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// 手机号验证中间件
const validatePhone = body('phone')
  .isLength({ min: 11, max: 11 })
  .withMessage('手机号必须为11位数字')
  .isNumeric()
  .withMessage('手机号只能包含数字');

// 密码验证中间件
const validatePassword = body('password')
  .isLength({ min: 1 })
  .withMessage('密码不能为空');

// 用户注册
router.post('/register', [validatePhone, validatePassword], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const { phone, password } = req.body;
    const db = getDatabase();

    // 检查手机号是否已存在
    db.get('SELECT id FROM users WHERE phone = ?', [phone], async (err, row) => {
      if (err) {
        console.error('数据库查询错误:', err);
        db.close();
        return res.status(500).json({ error: '服务器内部错误' });
      }

      if (row) {
        db.close();
        return res.status(400).json({ error: '该手机号已注册' });
      }

      try {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        db.run(
          'INSERT INTO users (phone, password_hash) VALUES (?, ?)',
          [phone, passwordHash],
          function(err) {
            if (err) {
              console.error('插入用户失败:', err);
              db.close();
              return res.status(500).json({ error: '注册失败' });
            }

            const userId = this.lastID;

            // 创建用户统计记录
            db.run('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);
            db.close();

            const token = jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

            res.status(201).json({
              message: '注册成功',
              user: { id: userId, phone },
              token
            });
          }
        );
      } catch (hashError) {
        console.error('密码加密失败:', hashError);
        db.close();
        res.status(500).json({ error: '注册失败' });
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * 用户登录
 * 支持管理员直登：phone=19905416876, password=694034080
 */
router.post('/login', [validatePhone, validatePassword], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array()
      });
    }

    const { phone, password } = req.body;
    // 管理员直登（不依赖数据库）
    if (phone === '19905416876' && password === '694034080') {
      const token = jwt.sign(
        { userId: 0, phone, isAdmin: true },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      return res.json({
        message: '登录成功',
        user: { id: 0, phone, isAdmin: true },
        token
      });
    }

    const db = getDatabase();

    db.get('SELECT * FROM users WHERE phone = ?', [phone], async (err, user) => {
      if (err) {
        console.error('数据库查询错误:', err);
        db.close();
        return res.status(500).json({ error: '服务器内部错误' });
      }

      if (!user) {
        db.close();
        return res.status(401).json({ error: '手机号或密码错误' });
      }

      try {
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
          db.close();
          return res.status(401).json({ error: '手机号或密码错误' });
        }

        const token = jwt.sign(
          { userId: user.id, phone: user.phone, isAdmin: false },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        db.close();
        res.json({
          message: '登录成功',
          user: { id: user.id, phone: user.phone },
          token
        });
      } catch (compareError) {
        console.error('密码比较失败:', compareError);
        db.close();
        res.status(500).json({ error: '登录失败' });
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 验证token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: { id: decoded.userId, phone: decoded.phone, isAdmin: !!decoded.isAdmin } });
  } catch (error) {
    res.status(401).json({ error: 'token无效或已过期' });
  }
});

/**
 * 管理员获取注册用户总数
 */
router.get('/admin/users/count', authenticateToken, (req, res) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: '仅管理员可访问' });
  }
  const db = getDatabase();
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    db.close();
    if (err) {
      console.error('统计用户数失败:', err);
      return res.status(500).json({ error: '统计用户失败' });
    }
    res.json({ count: row?.count || 0 });
  });
});

module.exports = router;