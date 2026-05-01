const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  createProject,
  getProjects,
  addMember,
  getAvailableUsers
} = require('../controllers/projectController');

router.use(authMiddleware);

router.post('/', roleMiddleware('admin'), createProject);
router.get('/', getProjects);
router.post('/add-member', roleMiddleware('admin'), addMember);
router.get('/available-users', roleMiddleware('admin'), getAvailableUsers);

module.exports = router;