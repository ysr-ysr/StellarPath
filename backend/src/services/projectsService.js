const { pool } = require('../config/db');
const { addProject } = require('./chromaService');
const { getCandidateIdByUserId } = require('./candidateProfileService');
const { createHttpError } = require('../utils/httpError');

function validateProjectInput(payload, isUpdate = false) {
  const { name, description, tech_stack, key_achievements } = payload;

  if (!isUpdate && (!name || typeof name !== 'string' || !name.trim())) {
    throw createHttpError('name is required.', 400);
  }

  if (
    isUpdate &&
    name === undefined &&
    description === undefined &&
    tech_stack === undefined &&
    key_achievements === undefined
  ) {
    throw createHttpError('At least one field is required to update a project.', 400);
  }
}

async function getProjectById(projectId, candidateId) {
  const result = await pool.query(
    `SELECT id, name, description, tech_stack, key_achievements, candidate_id
     FROM projects
     WHERE id = $1 AND candidate_id = $2`,
    [projectId, candidateId]
  );

  return result.rows[0] || null;
}

async function syncProjectToChroma(project) {
  try {
    await addProject(project);
  } catch (error) {
    throw createHttpError(error.message, 500);
  }
}

async function createProject(userId, payload) {
  validateProjectInput(payload);

  const candidateId = await getCandidateIdByUserId(userId);
  const {
    name,
    description = null,
    tech_stack = null,
    key_achievements = null,
  } = payload;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO projects (candidate_id, name, description, tech_stack, key_achievements)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, description, tech_stack, key_achievements, candidate_id`,
      [candidateId, name.trim(), description, tech_stack, key_achievements]
    );

    const project = result.rows[0];
    await syncProjectToChroma(project);
    await client.query('COMMIT');

    return project;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getProjects(userId) {
  const candidateId = await getCandidateIdByUserId(userId);

  const result = await pool.query(
    `SELECT id, name, description, tech_stack, key_achievements, candidate_id
     FROM projects
     WHERE candidate_id = $1
     ORDER BY id ASC`,
    [candidateId]
  );

  return result.rows;
}

async function updateProject(userId, projectId, payload) {
  validateProjectInput(payload, true);

  const candidateId = await getCandidateIdByUserId(userId);
  const existingProject = await getProjectById(projectId, candidateId);

  if (!existingProject) {
    throw createHttpError('Project not found.', 404);
  }

  const updatedProject = {
    name: payload.name !== undefined ? payload.name : existingProject.name,
    description:
      payload.description !== undefined ? payload.description : existingProject.description,
    tech_stack: payload.tech_stack !== undefined ? payload.tech_stack : existingProject.tech_stack,
    key_achievements:
      payload.key_achievements !== undefined
        ? payload.key_achievements
        : existingProject.key_achievements,
  };

  if (!updatedProject.name || typeof updatedProject.name !== 'string' || !updatedProject.name.trim()) {
    throw createHttpError('name is required.', 400);
  }
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE projects
       SET name = $1,
           description = $2,
           tech_stack = $3,
           key_achievements = $4
       WHERE id = $5 AND candidate_id = $6
       RETURNING id, name, description, tech_stack, key_achievements, candidate_id`,
      [
        updatedProject.name.trim(),
        updatedProject.description,
        updatedProject.tech_stack,
        updatedProject.key_achievements,
        projectId,
        candidateId,
      ]
    );

    const project = result.rows[0];
    await syncProjectToChroma(project);
    await client.query('COMMIT');

    return project;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteProject(userId, projectId) {
  const candidateId = await getCandidateIdByUserId(userId);

  const result = await pool.query(
    `DELETE FROM projects
     WHERE id = $1 AND candidate_id = $2
     RETURNING id, name, description, tech_stack, key_achievements, candidate_id`,
    [projectId, candidateId]
  );

  if (result.rows.length === 0) {
    throw createHttpError('Project not found.', 404);
  }

  return result.rows[0];
}

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
