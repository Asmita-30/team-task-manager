const mysql = require('mysql2');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Create pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'task_manager',
  port: Number(process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Debug config
console.log('📊 DB Config:', {
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

// Promise wrapper
const query = (sql) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// TABLE QUERIES
const usersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const projectsTable = `
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
`;

const projectMembersTable = `
CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (project_id, user_id)
);
`;

const tasksTable = `
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id INT NOT NULL,
  assigned_to INT,
  status ENUM('pending','in-progress','completed') DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);
`;

// INIT DB (SAFE ORDER)
const initDB = async () => {
  try {
    await query(usersTable);
    console.log("✅ users table ready");

    await query(projectsTable);
    console.log("✅ projects table ready");

    await query(projectMembersTable);
    console.log("✅ project_members table ready");

    await query(tasksTable);
    console.log("✅ tasks table ready");

    console.log("🚀 All tables created successfully!");
  } catch (err) {
    console.error("❌ DB INIT ERROR:", err.message);
  }
};

pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    process.exit(1);
  }

  console.log("✅ Connected to MySQL successfully!");
  conn.release();

  initDB();
});

// Error handling
pool.on('error', (err) => {
  console.error("❌ Pool Error:", err);
});

// Export
module.exports = pool.promise();