const express = require('express');
const {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill,
} = require('../controllers/skillsController');
const { verifyToken, requireCandidate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireCandidate);

router.post('/', createSkill);
router.get('/', getSkills);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

module.exports = router;
