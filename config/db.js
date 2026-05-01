const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10
});

const query = (sql, name) => {
  return new Promise((resolve) => {
    pool.query(sql, (err) => {
      if (err) console.error("❌", name, err.message);
      else console.log("✅", name);
      resolve();
    });
  });
};

// ONLY PURE SQL STRINGS (NO EXTRA TEXT)
const users = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('admin','member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const projects = `
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
)`;

const members = `
CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  user_id INT,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)`;

const tasks = `
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  project_id INT,
  assigned_to INT,
  status ENUM('pending','in-progress','completed') DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const initDB = async () => {
  await query(users, "users");
  await query(projects, "projects");
  await query(members, "members");
  await query(tasks, "tasks");

  console.log("🚀 DB READY");
};

pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ DB FAIL:", err.message);
    return;
  }

  console.log("✅ MYSQL CONNECTED");
  conn.release();

  initDB();
});

module.exports = pool.promise();