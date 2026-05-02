const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool(process.env.DATABASE_URL);

async function initDB() {
  let conn;

  try {
    conn = await pool.getConnection();

    console.log("✅ Connected to MySQL database successfully!");

    await conn.query(`SET FOREIGN_KEY_CHECKS = 0`);

    await conn.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS project_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB
`);

await conn.query(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INT NOT NULL,
    assigned_to INT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB
`);

    await conn.query(`SET FOREIGN_KEY_CHECKS = 1`);

    console.log("🚀 All tables created successfully!");

  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
  } finally {
    if (conn) conn.release();
  }
}

initDB();

module.exports = pool;
