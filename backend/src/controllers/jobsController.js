const { pool } = require('../config/db');

// GET /api/jobs
// Get all saved jobs, newest first.
const getJobs = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');

    res.status(200).json({
      count: result.rows.length,
      jobs: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id
// Get one job by its id.
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Job not found',
      });
    }

    res.status(200).json({
      job: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/jobs
// Create a new job. Title and company are required.
const createJob = async (req, res, next) => {
  try {
    const { title, company, location, description, url, status } = req.body;

    if (!title || !company) {
      return res.status(400).json({
        message: 'Title and company are required',
      });
    }

    const result = await pool.query(
      `INSERT INTO jobs (title, company, location, description, url, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'FOUND'))
       RETURNING *`,
      [title, company, location, description, url, status]
    );

    res.status(201).json({
      message: 'Job created successfully',
      job: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/jobs/:id
// Update an existing job by id. Title and company are required.
const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, company, location, description, url, status } = req.body;

    if (!title || !company) {
      return res.status(400).json({
        message: 'Title and company are required',
      });
    }

    const result = await pool.query(
      `UPDATE jobs
       SET title = $1,
           company = $2,
           location = $3,
           description = $4,
           url = $5,
           status = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [title, company, location, description, url, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Job not found',
      });
    }

    res.status(200).json({
      message: 'Job updated successfully',
      job: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/jobs/:id
// Delete a job by id.
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Job not found',
      });
    }

    res.status(200).json({
      message: 'Job deleted successfully',
      job: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
