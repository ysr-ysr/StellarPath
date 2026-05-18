const express = require('express');
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} = require('../controllers/jobsController');

const router = express.Router();

// GET /api/jobs - get all jobs
router.get('/', getJobs);

// GET /api/jobs/:id - get one job
router.get('/:id', getJobById);

// POST /api/jobs - create one job
router.post('/', createJob);

// PUT /api/jobs/:id - update one job
router.put('/:id', updateJob);

// DELETE /api/jobs/:id - delete one job
router.delete('/:id', deleteJob);

module.exports = router;
