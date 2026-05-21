const { pool } = require('../config/db');
const { getCandidateIdByUserId } = require('./candidateProfileService');
const { createHttpError } = require('../utils/httpError');

function validateEducationInput(payload, isUpdate = false) {
  const { school, diploma } = payload;

  if (!isUpdate && (!school || typeof school !== 'string' || !school.trim())) {
    throw createHttpError('school is required.', 400);
  }

  if (isUpdate && school === undefined && diploma === undefined) {
    throw createHttpError('At least one field is required to update education.', 400);
  }
}

async function getEducationById(educationId, candidateId) {
  const result = await pool.query(
    `SELECT id, school, diploma, candidate_id
     FROM education
     WHERE id = $1 AND candidate_id = $2`,
    [educationId, candidateId]
  );

  return result.rows[0] || null;
}

async function createEducation(userId, payload) {
  validateEducationInput(payload);

  const candidateId = await getCandidateIdByUserId(userId);
  const { school, diploma = null } = payload;

  const result = await pool.query(
    `INSERT INTO education (candidate_id, school, diploma)
     VALUES ($1, $2, $3)
     RETURNING id, school, diploma, candidate_id`,
    [candidateId, school.trim(), diploma]
  );

  return result.rows[0];
}

async function getEducation(userId) {
  const candidateId = await getCandidateIdByUserId(userId);

  const result = await pool.query(
    `SELECT id, school, diploma, candidate_id
     FROM education
     WHERE candidate_id = $1
     ORDER BY id ASC`,
    [candidateId]
  );

  return result.rows;
}

async function updateEducation(userId, educationId, payload) {
  validateEducationInput(payload, true);

  const candidateId = await getCandidateIdByUserId(userId);
  const existingEducation = await getEducationById(educationId, candidateId);

  if (!existingEducation) {
    throw createHttpError('Education record not found.', 404);
  }

  const updatedEducation = {
    school: payload.school !== undefined ? payload.school : existingEducation.school,
    diploma: payload.diploma !== undefined ? payload.diploma : existingEducation.diploma,
  };

  if (!updatedEducation.school || typeof updatedEducation.school !== 'string' || !updatedEducation.school.trim()) {
    throw createHttpError('school is required.', 400);
  }

  const result = await pool.query(
    `UPDATE education
     SET school = $1,
         diploma = $2
     WHERE id = $3 AND candidate_id = $4
     RETURNING id, school, diploma, candidate_id`,
    [updatedEducation.school.trim(), updatedEducation.diploma, educationId, candidateId]
  );

  return result.rows[0];
}

async function deleteEducation(userId, educationId) {
  const candidateId = await getCandidateIdByUserId(userId);

  const result = await pool.query(
    `DELETE FROM education
     WHERE id = $1 AND candidate_id = $2
     RETURNING id, school, diploma, candidate_id`,
    [educationId, candidateId]
  );

  if (result.rows.length === 0) {
    throw createHttpError('Education record not found.', 404);
  }

  return result.rows[0];
}

module.exports = {
  createEducation,
  getEducation,
  updateEducation,
  deleteEducation,
};
