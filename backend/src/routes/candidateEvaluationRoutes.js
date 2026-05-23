const express = require('express');
const {
  createEvaluation,
  getEvaluationsByJob,
  sendEvaluationEmail,
} = require('../controllers/candidateEvaluationController');
const { verifyToken, requireCompany } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireCompany);

router.post('/', createEvaluation);
router.get('/job/:jobId', getEvaluationsByJob);
router.post('/:id/send-email', sendEvaluationEmail);

module.exports = router;
