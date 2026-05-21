const express = require('express');
const {
  createJob,
  updateJob,
  deleteJob,
  listOwnJobs,
  listJobApplications,
} = require('../controllers/companyJobsController');
const { verifyToken, requireCompany } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes here require the user to be a logged-in company
router.use(verifyToken, requireCompany);

// POST /api/company/jobs
router.post('/', createJob);

// GET /api/company/jobs
router.get('/', listOwnJobs);

// PUT /api/company/jobs/:id
router.put('/:id', updateJob);

// DELETE /api/company/jobs/:id
router.delete('/:id', deleteJob);

// GET /api/company/jobs/:jobId/applications
router.get('/:jobId/applications', listJobApplications);

module.exports = router;
