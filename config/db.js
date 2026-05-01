const mysql = require('mysql2');

// Load .env only in local (not needed in Railway)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Create connection pool
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'task_manager',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// Debug log
console.log('📊 Database Connection Config:', {
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || process.env.DB_PORT,
  isRailway: !!process.env.MYSQLHOST
});

runQuery(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, "users");

runQuery(`CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
)`, "projects");

runQuery(`CREATE TABLE IF NOT EXISTS project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_member (project_id, user_id)
)`, "project_members");

runQuery(`CREATE TABLE IF NOT EXISTS tasks (
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
)`, "tasks");

// Connect and initialize DB
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed!');
    console.error('Error:', err.message);
    console.error('\n💡 Check:');
    console.error('1. Railway MySQL service connected');
    console.error('2. Environment variables set');
    process.exit(1);
  }

  console.log('✅ Connected to MySQL database!');

  // Create tables
  connection.query(createTables, (tableErr) => {
    if (tableErr) {
      console.error('❌ Error creating tables:', tableErr.message);
    } else {
      console.log('✅ Tables ready!');
    }
    connection.release();
  });
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('❌ Pool error:', err);
});

// Export promise version (for async/await)
module.exports = pool.promise();