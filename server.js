const dotenv = require('dotenv');
dotenv.config();

const db = require('./config/db');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

app.use(express.json());

// Home route for Railway health check
app.get('/', (req, res) => {
  res.send('Team Task Manager Backend is running');
});

// Test database connection
db.query('SELECT 1')
  .then(() => console.log('✅ Connected to MySQL database successfully!'))
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});