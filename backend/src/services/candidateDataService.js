const { pool } = require('../config/db');

function normalizeCandidateId(candidateId) {
  const normalizedCandidateId = Number(candidateId);

  if (!Number.isInteger(normalizedCandidateId) || normalizedCandidateId <= 0) {
    throw new Error('A valid candidate_id is required.');
  }

  return normalizedCandidateId;
}

async function getCandidateById(candidateId) {
  const normalizedCandidateId = normalizeCandidateId(candidateId);

  const result = await pool.query(
    'SELECT * FROM candidates WHERE id = $1',
    [normalizedCandidateId]
  );

  return result.rows[0] || null;
}

async function getCandidateSkills(candidateId) {
  const normalizedCandidateId = normalizeCandidateId(candidateId);

  const result = await pool.query(
    `SELECT id, category, name, level
     FROM skills
     WHERE candidate_id = $1
     ORDER BY category ASC, name ASC`,
    [normalizedCandidateId]
  );

  return result.rows;
}

async function getCandidateEducation(candidateId) {
  const normalizedCandidateId = normalizeCandidateId(candidateId);

  const result = await pool.query(
    `SELECT id, school, diploma
     FROM education
     WHERE candidate_id = $1
     ORDER BY id ASC`,
    [normalizedCandidateId]
  );

  return result.rows;
}

async function getCandidateProjectsByIds(candidateId, projectIds) {
  const normalizedCandidateId = normalizeCandidateId(candidateId);
  const numericProjectIds = projectIds
    .map((projectId) => Number(projectId))
    .filter((projectId) => Number.isInteger(projectId) && projectId > 0);

  if (numericProjectIds.length === 0) {
    return [];
  }

  const result = await pool.query(
    `SELECT id, name, description, tech_stack, key_achievements, candidate_id
     FROM projects
     WHERE candidate_id = $1
       AND id = ANY($2::int[])`,
    [normalizedCandidateId, numericProjectIds]
  );

  const projectsById = new Map(
    result.rows.map((project) => [String(project.id), project])
  );

  // Keep the same ranking order returned by ChromaDB.
  return numericProjectIds
    .map((projectId) => projectsById.get(String(projectId)))
    .filter(Boolean);
}

async function getCandidateResumeData(candidateId) {
  const normalizedCandidateId = normalizeCandidateId(candidateId);

  const [candidate, skills, education] = await Promise.all([
    getCandidateById(normalizedCandidateId),
    getCandidateSkills(normalizedCandidateId),
    getCandidateEducation(normalizedCandidateId),
  ]);

  return {
    candidate,
    skills,
    education,
  };
}

module.exports = {
  getCandidateById,
  getCandidateResumeData,
  getCandidateProjectsByIds,
  normalizeCandidateId,
};
