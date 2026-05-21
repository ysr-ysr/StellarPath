const express = require('express');
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require('../controllers/projectsController');
const { verifyToken, requireCandidate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireCandidate);

router.post('/', createProject);
router.get('/', getProjects);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
