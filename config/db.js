const mysql = require('mysql2');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

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

console.log("📊 DB:", process.env.MYSQLHOST);

// STRICT SINGLE EXECUTION (IMPORTANT FIX)
const query = (sql, name) => {
  return new Promise((resolve) => {
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("❌ Connection error:", err.message);
        return resolve();
      }

      conn.query(sql, (qerr) => {
        if (qerr) {
          console.error(`❌ ${name} error:`, qerr.message);
        } else {
          console.log(`✅ ${name} ready`);
        }

        conn.release();
        resolve();
      });
    });
  });
};

// TABLES
const users = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const projects = `
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
)`;

const members = `
CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (project_id, user_id)
)`;

const tasks = `
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
)`;

// INIT (STRICT ORDER + WAIT)
const initDB = async () => {
  await query(users, "users");
  await query(projects, "projects");
  await query(members, "project_members");
  await query(tasks, "tasks");

  console.log("🚀 ALL TABLES CREATED SUCCESSFULLY");
};

pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ DB Connection failed:", err.message);
    process.exit(1);
  }

  console.log("✅ MySQL Connected");
  conn.release();

  initDB();
});

module.exports = pool.promise();