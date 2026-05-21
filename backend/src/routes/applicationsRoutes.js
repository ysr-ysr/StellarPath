const express = require('express');
const {
  applyToJob,
  getCandidateApplications,
} = require('../controllers/applicationsController');
const { verifyToken, requireCandidate } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes here require the user to be a logged-in candidate
router.use(verifyToken, requireCandidate);

// POST /api/applications/:jobId/apply
router.post('/:jobId/apply', applyToJob);

// GET /api/applications/my-applications
router.get('/my-applications', getCandidateApplications);

module.exports = router;
