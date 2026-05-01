const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  createTask,
  getTasks,
  updateTaskStatus,
  getDashboardStats
} = require('../controllers/taskController');

router.use(authMiddleware);

router.post('/', roleMiddleware('admin'), createTask);
router.get('/', getTasks);
router.put('/:id/status', updateTaskStatus);
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;