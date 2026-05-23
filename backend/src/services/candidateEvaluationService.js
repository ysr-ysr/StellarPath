const { pool } = require('../config/db');
const { searchProjects } = require('./chromaService');
const { sendEvaluationEmail } = require('./emailService');
const { createHttpError } = require('../utils/httpError');

const STOPWORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'all', 'also', 'and', 'any',
  'are', 'because', 'been', 'being', 'but', 'can', 'candidate', 'company',
  'could', 'create', 'develop', 'developer', 'development', 'each', 'engineer',
  'experience', 'from', 'has', 'have', 'into', 'job', 'more', 'must', 'our',
  'per', 'role', 'should', 'such', 'that', 'the', 'their', 'them', 'then',
  'this', 'through', 'using', 'was', 'with', 'work', 'will', 'you', 'your',
]);

function normalizePositiveInteger(value, fieldName) {
  const normalized = Number(value);

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw createHttpError(`${fieldName} must be a positive integer.`, 400);
  }

  return normalized;
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function extractKeywords(text) {
  return Array.from(
    new Set(
      String(text || '')
        .toLowerCase()
        .match(/[a-z0-9+#.]+/g) || []
    )
  ).filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function getRecommendation(overallScore) {
  if (overallScore >= 90) {
    return 'Strongly Recommended';
  }

  if (overallScore >= 75) {
    return 'Recommended';
  }

  if (overallScore >= 60) {
    return 'Potential Match';
  }

  return 'Not Recommended';
}

async function getCandidate(candidateId) {
  const result = await pool.query(
    `SELECT c.*, u.email AS user_email
     FROM candidates c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.id = $1`,
    [candidateId]
  );

  const candidate = result.rows[0];

  if (!candidate) {
    throw createHttpError('Candidate not found.', 404);
  }

  return {
    ...candidate,
    email: candidate.email || candidate.user_email,
  };
}

async function getJob(jobId) {
  const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
  const job = result.rows[0];

  if (!job) {
    throw createHttpError('Job not found.', 404);
  }

  return job;
}

async function getCandidateSkills(candidateId) {
  const result = await pool.query(
    'SELECT name FROM skills WHERE candidate_id = $1',
    [candidateId]
  );

  return result.rows.map((skill) => skill.name).filter(Boolean);
}

async function getLatestInterviewScore(candidateId) {
  const result = await pool.query(
    `SELECT score
     FROM interview_sessions
     WHERE candidate_id = $1
       AND score IS NOT NULL
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [candidateId]
  );

  return result.rows.length > 0 ? clampScore(result.rows[0].score) : 0;
}

function calculateSkillsScore(jobDescription, skills) {
  const jobKeywords = new Set(extractKeywords(jobDescription));
  const skillKeywords = Array.from(
    new Set(skills.flatMap((skill) => extractKeywords(skill)))
  );

  if (skillKeywords.length === 0 || jobKeywords.size === 0) {
    return 0;
  }

  const matchedSkills = skillKeywords.filter((keyword) => jobKeywords.has(keyword));
  return clampScore((matchedSkills.length / skillKeywords.length) * 100);
}

async function calculateProjectsScore(jobDescription, candidateId) {
  const results = await searchProjects(jobDescription, candidateId, 1);

  if (results.length === 0 || results[0].distance === undefined || results[0].distance === null) {
    return 0;
  }

  return clampScore((1 / (1 + Number(results[0].distance))) * 100);
}

async function createEvaluation(candidateIdValue, jobIdValue) {
  const candidateId = normalizePositiveInteger(candidateIdValue, 'candidate_id');
  const jobId = normalizePositiveInteger(jobIdValue, 'job_id');

  await getCandidate(candidateId);
  const job = await getJob(jobId);
  const skills = await getCandidateSkills(candidateId);

  const skillsScore = calculateSkillsScore(job.description, skills);
  const projectsScore = await calculateProjectsScore(job.description, candidateId);
  const interviewScore = await getLatestInterviewScore(candidateId);
  const overallScore = clampScore(
    skillsScore * 0.40 + projectsScore * 0.35 + interviewScore * 0.25
  );
  const recommendation = getRecommendation(overallScore);

  const result = await pool.query(
    `INSERT INTO candidate_evaluations
      (candidate_id, job_id, skills_score, projects_score, interview_score, overall_score, recommendation)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      candidateId,
      jobId,
      skillsScore,
      projectsScore,
      interviewScore,
      overallScore,
      recommendation,
    ]
  );

  return result.rows[0];
}

async function getEvaluationsByJob(jobIdValue) {
  const jobId = normalizePositiveInteger(jobIdValue, 'jobId');
  await getJob(jobId);

  const result = await pool.query(
    `SELECT e.*, c.name AS candidate_name
     FROM candidate_evaluations e
     JOIN candidates c ON c.id = e.candidate_id
     WHERE e.job_id = $1
     ORDER BY e.overall_score DESC, e.created_at DESC`,
    [jobId]
  );

  return result.rows;
}

async function getEvaluation(evaluationIdValue) {
  const evaluationId = normalizePositiveInteger(evaluationIdValue, 'evaluation id');
  const result = await pool.query(
    'SELECT * FROM candidate_evaluations WHERE id = $1',
    [evaluationId]
  );

  const evaluation = result.rows[0];

  if (!evaluation) {
    throw createHttpError('Evaluation not found.', 404);
  }

  return evaluation;
}

async function sendEvaluationNotification(evaluationIdValue, type) {
  const evaluation = await getEvaluation(evaluationIdValue);
  const [candidate, job] = await Promise.all([
    getCandidate(evaluation.candidate_id),
    getJob(evaluation.job_id),
  ]);

  const emailResult = await sendEvaluationEmail({
    type,
    candidate,
    job,
    evaluation,
  });

  return {
    evaluation,
    email: emailResult,
  };
}

module.exports = {
  createEvaluation,
  getEvaluationsByJob,
  sendEvaluationNotification,
};
