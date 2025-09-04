const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'exam.db');

function getDatabase() {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('连接数据库失败:', err.message);
    }
  });
}

async function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // 创建用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone VARCHAR(11) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // 创建考试记录表
    const createExamRecordsTable = `
      CREATE TABLE IF NOT EXISTS exam_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_id VARCHAR(50) NOT NULL,
        score REAL NOT NULL,
        total_score REAL NOT NULL,
        percentage REAL NOT NULL,
        passed BOOLEAN NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        time_used INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;
    
    // 创建错题记录表
    const createWrongQuestionsTable = `
      CREATE TABLE IF NOT EXISTS wrong_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_record_id INTEGER NOT NULL,
        question_id VARCHAR(100) NOT NULL,
        question_type VARCHAR(20) NOT NULL,
        question_category VARCHAR(100),
        question_text TEXT NOT NULL,
        question_options TEXT NOT NULL,
        correct_answer VARCHAR(50) NOT NULL,
        user_answer VARCHAR(50),
        question_score REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (exam_record_id) REFERENCES exam_records (id) ON DELETE CASCADE
      )
    `;
    
    // 创建用户错题统计表
    const createUserStatsTable = `
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        total_exams INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        total_wrong INTEGER DEFAULT 0,
        avg_score REAL DEFAULT 0,
        best_score REAL DEFAULT 0,
        last_exam_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `;
    
    // 创建索引
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone)',
      'CREATE INDEX IF NOT EXISTS idx_exam_records_user_id ON exam_records (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_wrong_questions_exam_record_id ON wrong_questions (exam_record_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats (user_id)'
    ];
    
    db.serialize(() => {
      db.run(createUsersTable);
      db.run(createExamRecordsTable);
      db.run(createWrongQuestionsTable);
      db.run(createUserStatsTable);
      
      createIndexes.forEach(indexSql => {
        db.run(indexSql);
      });
      
      db.close((err) => {
        if (err) {
          console.error('关闭数据库失败:', err.message);
          reject(err);
        } else {
          console.log('数据库表创建完成');
          resolve();
        }
      });
    });
  });
}

module.exports = {
  getDatabase,
  initDatabase,
  DB_PATH
};