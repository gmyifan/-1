const { sql } = require('@vercel/postgres');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

async function ensureSchema() {
  // 可选：初始化 users 表（仅当不存在时）
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(11) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: '未提供认证token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded?.isAdmin) return res.status(403).json({ error: '仅管理员可访问' });

    await ensureSchema();
    const { rows } = await sql`SELECT COUNT(*)::int AS count FROM users`;
    const count = rows?.[0]?.count ?? 0;
    res.status(200).json({ count });
  } catch (e) {
    console.error('users count error:', e);
    res.status(500).json({ error: '统计用户失败' });
  }
};