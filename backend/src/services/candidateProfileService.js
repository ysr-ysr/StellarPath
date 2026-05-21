const { pool } = require('../config/db');
const { createHttpError } = require('../utils/httpError');

async function getCandidateIdByUserId(userId) {
  if (!userId) {
    throw createHttpError('Authenticated user is required.', 401);
  }

  const result = await pool.query(
    'SELECT id FROM candidates WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw createHttpError('Candidate profile not found for this user.', 404);
  }

  return result.rows[0].id;
}

module.exports = {
  getCandidateIdByUserId,
};
