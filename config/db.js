const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: parseInt(process.env.MYSQLPORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDB() {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log("✅ Connected to MySQL database successfully!");

    await conn.query(`SET FOREIGN_KEY_CHECKS = 0`);
    conn.release();
    conn = null;

    // --- users ---
    let c = await pool.getConnection();
    await c.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    c.release();
    console.log("✅ users table ready");

    // --- projects ---
    c = await pool.getConnection();
    await c.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    c.release();
    console.log("✅ projects table ready");

    // --- project_members ---
    c = await pool.getConnection();
    await c.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    c.release();
    console.log("✅ project_members table ready");

    // --- tasks ---
    c = await pool.getConnection();
    await c.query(`
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
    c.release();
    console.log("✅ tasks table ready");

    // --- re-enable FK checks ---
    c = await pool.getConnection();
    await c.query(`SET FOREIGN_KEY_CHECKS = 1`);
    c.release();

    console.log("🚀 All tables created successfully!");
  } catch (err) {
    if (conn) conn.release();
    console.error("❌ Error creating tables:", err.message);
    console.error("SQL causing error:", err.sql || "N/A");
  }
}

module.exports = { pool, initDB };