const { pool } = require('../config/db');

// Helper to get company_id from user_id
const getCompanyId = async (userId) => {
  const result = await pool.query('SELECT id FROM companies WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new Error('Company profile not found for this user');
  }
  return result.rows[0].id;
};

const createJob = async (userId, title, company, location, description, url, status) => {
  const companyId = await getCompanyId(userId);

  const result = await pool.query(
    `INSERT INTO jobs (title, company, location, description, url, status, company_id)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'OPEN'), $7)
     RETURNING *`,
    [title, company, location, description, url, status, companyId]
  );
  return result.rows[0];
};

const updateJob = async (userId, jobId, title, company, location, description, url, status) => {
  const companyId = await getCompanyId(userId);

  const result = await pool.query(
    `UPDATE jobs
     SET title = $1,
         company = $2,
         location = $3,
         description = $4,
         url = $5,
         status = COALESCE($6, status)
     WHERE id = $7 AND company_id = $8
     RETURNING *`,
    [title, company, location, description, url, status, jobId, companyId]
  );

  if (result.rows.length === 0) {
    throw new Error('Job not found or you do not have permission to update it');
  }

  return result.rows[0];
};

const deleteJob = async (userId, jobId) => {
  const companyId = await getCompanyId(userId);

  const result = await pool.query(
    'DELETE FROM jobs WHERE id = $1 AND company_id = $2 RETURNING *',
    [jobId, companyId]
  );

  if (result.rows.length === 0) {
    throw new Error('Job not found or you do not have permission to delete it');
  }

  return result.rows[0];
};

const listOwnJobs = async (userId) => {
  const companyId = await getCompanyId(userId);

  const result = await pool.query(
    'SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC',
    [companyId]
  );
  return result.rows;
};

const listJobApplications = async (userId, jobId) => {
  const companyId = await getCompanyId(userId);

  // First, verify the job belongs to this company
  const jobCheck = await pool.query('SELECT id FROM jobs WHERE id = $1 AND company_id = $2', [jobId, companyId]);
  if (jobCheck.rows.length === 0) {
    throw new Error('Job not found or access denied');
  }

  // Fetch applications with candidate details
  const result = await pool.query(
    `SELECT a.id as application_id, a.status, a.created_at, c.id as candidate_id, c.name, u.email
     FROM applications a
     JOIN candidates c ON a.candidate_id = c.id
     JOIN users u ON c.user_id = u.id
     WHERE a.job_id = $1
     ORDER BY a.created_at DESC`,
    [jobId]
  );

  return result.rows;
};

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  listOwnJobs,
  listJobApplications,
};
