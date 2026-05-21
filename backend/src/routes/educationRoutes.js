const express = require('express');
const {
  createEducation,
  getEducation,
  updateEducation,
  deleteEducation,
} = require('../controllers/educationController');
const { verifyToken, requireCandidate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireCandidate);

router.post('/', createEducation);
router.get('/', getEducation);
router.put('/:id', updateEducation);
router.delete('/:id', deleteEducation);

module.exports = router;
