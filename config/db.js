const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.DATABASE_URL);

async function initDB() {
  let conn;

  try {
    conn = await pool.getConnection();
    console.log("✅ MySQL Connected");

    await conn.execute("SET FOREIGN_KEY_CHECKS = 0");

    // 🔹 USERS
    console.log("Creating users...");
    await conn.execute(
      "CREATE TABLE IF NOT EXISTS users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, email VARCHAR(100) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'member', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB;"
    );

    // 🔹 PROJECTS
    console.log("Creating projects...");
    await conn.execute(
      "CREATE TABLE IF NOT EXISTS projects (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, created_by INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;"
    );

    // 🔹 PROJECT MEMBERS
    console.log("Creating project_members...");
    await conn.execute(
      "CREATE TABLE IF NOT EXISTS project_members (id INT PRIMARY KEY AUTO_INCREMENT, project_id INT NOT NULL, user_id INT NOT NULL, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB;"
    );

    // 🔹 TASKS
    console.log("Creating tasks...");
    await conn.execute(
      "CREATE TABLE IF NOT EXISTS tasks (id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(255) NOT NULL, description TEXT, project_id INT NOT NULL, assigned_to INT, status VARCHAR(20) DEFAULT 'pending', due_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL) ENGINE=InnoDB;"
    );

    await conn.execute("SET FOREIGN_KEY_CHECKS = 1");

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