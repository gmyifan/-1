const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const { phone, password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (phone === '19905416876' && password === '694034080') {
      const token = jwt.sign({ userId: 0, phone, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({
        message: '登录成功',
        user: { id: 0, phone, isAdmin: true },
        token
      });
      return;
    }
    res.status(401).json({ error: '仅支持管理员登录' });
  } catch (e) {
    console.error('admin login error:', e);
    res.status(500).json({ error: '服务器错误' });
  }
};