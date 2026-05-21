const { pool } = require('../config/db');
const { getCandidateIdByUserId } = require('./candidateProfileService');
const { createHttpError } = require('../utils/httpError');

function validateSkillInput(payload, isUpdate = false) {
  const { category, name, level } = payload;

  if (!isUpdate && (!name || typeof name !== 'string' || !name.trim())) {
    throw createHttpError('name is required.', 400);
  }

  if (isUpdate && category === undefined && name === undefined && level === undefined) {
    throw createHttpError('At least one field is required to update a skill.', 400);
  }
}

async function getSkillById(skillId, candidateId) {
  const result = await pool.query(
    `SELECT id, category, name, level, candidate_id
     FROM skills
     WHERE id = $1 AND candidate_id = $2`,
    [skillId, candidateId]
  );

  return result.rows[0] || null;
}

async function createSkill(userId, payload) {
  validateSkillInput(payload);

  const candidateId = await getCandidateIdByUserId(userId);
  const { category = null, name, level = null } = payload;

  const result = await pool.query(
    `INSERT INTO skills (candidate_id, category, name, level)
     VALUES ($1, $2, $3, $4)
     RETURNING id, category, name, level, candidate_id`,
    [candidateId, category, name.trim(), level]
  );

  return result.rows[0];
}

async function getSkills(userId) {
  const candidateId = await getCandidateIdByUserId(userId);

  const result = await pool.query(
    `SELECT id, category, name, level, candidate_id
     FROM skills
     WHERE candidate_id = $1
     ORDER BY category ASC NULLS LAST, name ASC`,
    [candidateId]
  );

  return result.rows;
}

async function updateSkill(userId, skillId, payload) {
  validateSkillInput(payload, true);

  const candidateId = await getCandidateIdByUserId(userId);
  const existingSkill = await getSkillById(skillId, candidateId);

  if (!existingSkill) {
    throw createHttpError('Skill not found.', 404);
  }

  const updatedSkill = {
    category: payload.category !== undefined ? payload.category : existingSkill.category,
    name: payload.name !== undefined ? payload.name : existingSkill.name,
    level: payload.level !== undefined ? payload.level : existingSkill.level,
  };

  if (!updatedSkill.name || typeof updatedSkill.name !== 'string' || !updatedSkill.name.trim()) {
    throw createHttpError('name is required.', 400);
  }

  const result = await pool.query(
    `UPDATE skills
     SET category = $1,
         name = $2,
         level = $3
     WHERE id = $4 AND candidate_id = $5
     RETURNING id, category, name, level, candidate_id`,
    [updatedSkill.category, updatedSkill.name.trim(), updatedSkill.level, skillId, candidateId]
  );

  return result.rows[0];
}

async function deleteSkill(userId, skillId) {
  const candidateId = await getCandidateIdByUserId(userId);

  const result = await pool.query(
    `DELETE FROM skills
     WHERE id = $1 AND candidate_id = $2
     RETURNING id, category, name, level, candidate_id`,
    [skillId, candidateId]
  );

  if (result.rows.length === 0) {
    throw createHttpError('Skill not found.', 404);
  }

  return result.rows[0];
}

module.exports = {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill,
};
