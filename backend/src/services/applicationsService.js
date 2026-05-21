const { pool } = require('../config/db');
const applicationPipelineService = require('./applicationPipelineService');

// Helper to get candidate_id from user_id
const getCandidateId = async (userId) => {
  const result = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new Error('Candidate profile not found for this user');
  }
  return result.rows[0].id;
};

const applyToJob = async (userId, jobId) => {
  const candidateId = await getCandidateId(userId);

  // Verify the job exists
  const jobCheck = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId]);
  if (jobCheck.rows.length === 0) {
    throw new Error('Job not found');
  }

  // Check if candidate already applied
  const existingApp = await pool.query(
    'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
    [jobId, candidateId]
  );

  if (existingApp.rows.length > 0) {
    throw new Error('You have already applied to this job');
  }

  // Create application
  const result = await pool.query(
    'INSERT INTO applications (job_id, candidate_id) VALUES ($1, $2) RETURNING *',
    [jobId, candidateId]
  );

  const application = result.rows[0];

  // Run the pipeline
  try {
    await applicationPipelineService.runPipeline(userId, jobId);
  } catch (error) {
    console.error('Pipeline generation failed:', error.message);
  }

  return application;
};

const getCandidateApplications = async (userId) => {
  const candidateId = await getCandidateId(userId);

  const result = await pool.query(
    `SELECT a.id as application_id, a.status, a.created_at, j.id as job_id, j.title, j.company as company_name, j.location
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     WHERE a.candidate_id = $1
     ORDER BY a.created_at DESC`,
    [candidateId]
  );

  return result.rows;
};

module.exports = {
  applyToJob,
  getCandidateApplications,
};
