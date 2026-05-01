const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: false  // explicit safety
});

async function initDB() {
  let conn;

  try {
    conn = await pool.getConnection();
    console.log("✅ MySQL Connected");

    // Run each table separately with individual try/catch for debugging
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','member') DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ users table ready");

await conn.query(`
  CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  )
`);
    console.log("✅ projects table ready");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ project_members table ready");

    await conn.query(`
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
      )
    `);
    console.log("✅ tasks table ready");

    console.log("🚀 ALL TABLES READY");

  } catch (err) {
    console.error("❌ DB ERROR:", err.message);
    console.error("Full error:", err);
  } finally {
    if (conn) conn.release();
  }
}

initDB();

module.exports = pool;