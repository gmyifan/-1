const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: '未提供认证token' });
      return;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ user: { id: decoded.userId, phone: decoded.phone, isAdmin: !!decoded.isAdmin } });
  } catch (e) {
    res.status(401).json({ error: 'token无效或已过期' });
  }
};