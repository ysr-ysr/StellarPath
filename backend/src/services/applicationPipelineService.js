const { pool } = require('../config/db');
const { generateResponse } = require('./aiService');
const { searchProjects } = require('./chromaService');
const {
  getCandidateResumeData,
  getCandidateProjectsByIds,
} = require('./candidateDataService');
const { generateResumePdf } = require('./pdfService');
const { buildAtsSummaryPrompt, cleanSummary } = require('../utils/aiPromptHelpers');

// --- Helpers duplicated from cvController (to adhere to constraints) ---
function getFieldFromDocument(document, fieldName) {
  if (!document) return '';
  const line = document
    .split('\n')
    .find((item) => item.toLowerCase().startsWith(`${fieldName.toLowerCase()}:`));
  return line ? line.replace(new RegExp(`^${fieldName}:`, 'i'), '').trim() : '';
}

function buildFallbackProjects(retrievedProjects) {
  return retrievedProjects.map((project) => {
    const metadata = project.metadata || {};
    return {
      id: metadata.project_id || project.id,
      name: metadata.name || getFieldFromDocument(project.document, 'Project name') || project.id,
      tech_stack: metadata.tech_stack || getFieldFromDocument(project.document, 'Tech stack'),
      description: getFieldFromDocument(project.document, 'Description'),
      key_achievements: getFieldFromDocument(project.document, 'Key achievements'),
      candidate_id: metadata.candidate_id,
    };
  });
}

function mergeProjectDetails(databaseProjects, fallbackProjects) {
  if (databaseProjects.length === 0) return fallbackProjects;
  const databaseProjectsById = new Map(
    databaseProjects.map((project) => [String(project.id), project])
  );
  return fallbackProjects.map((fallbackProject) => {
    const databaseProject = databaseProjectsById.get(String(fallbackProject.id));
    return databaseProject || fallbackProject;
  });
}
// ------------------------------------------------------------------------

const runPipeline = async (userId, jobId) => {
  // 1. Retrieve Candidate ID from User ID
  const candidateCheck = await pool.query('SELECT id FROM candidates WHERE user_id = $1', [userId]);
  if (candidateCheck.rows.length === 0) {
    throw new Error('Candidate not found');
  }
  const candidateId = candidateCheck.rows[0].id;

  // 2. Retrieve Job Description
  const jobCheck = await pool.query('SELECT description FROM jobs WHERE id = $1', [jobId]);
  if (jobCheck.rows.length === 0) {
    throw new Error('Job not found');
  }
  const jobDescription = jobCheck.rows[0].description;

  // 3. Load Candidate Data (Profile, Skills, Education)
  const { candidate, skills, education } = await getCandidateResumeData(candidateId);
  if (!candidate) {
    throw new Error('Candidate resume data not found');
  }

  // 4. Retrieve Relevant Projects from ChromaDB
  const retrievedProjects = await searchProjects(jobDescription, candidateId);
  const fallbackProjects = buildFallbackProjects(retrievedProjects);
  const projectIds = fallbackProjects.map((project) => project.id);
  const databaseProjects = await getCandidateProjectsByIds(candidateId, projectIds);
  const projects = mergeProjectDetails(databaseProjects, fallbackProjects);

  // 5. Generate ATS Summary using AI
  const prompt = buildAtsSummaryPrompt({
    candidate,
    jobDescription,
    skills,
    projects,
  });
  const summary = cleanSummary(await generateResponse(prompt));

  // 6. Generate PDF Artifact
  const pdfResult = await generateResumePdf({
    candidate,
    summary,
    skills,
    projects,
    education,
  });
  const filePath = pdfResult.filePath;

  // 7. Store Artifact in Database
  const artifactResult = await pool.query(
    'INSERT INTO artifacts (job_id, candidate_id, tailored_cv) VALUES ($1, $2, $3) RETURNING *',
    [jobId, candidateId, filePath]
  );

  return artifactResult.rows[0];
};

module.exports = {
  runPipeline,
};
