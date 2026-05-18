const { pool } = require('../config/db');
const { generateResponse } = require('./aiService');
const { searchProjects } = require('./chromaService');
const {
  getCandidateById,
  getCandidateProjectsByIds,
  normalizeCandidateId,
} = require('./candidateDataService');

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 10;
const DEFAULT_DIFFICULTY = 'beginner';

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getFieldFromDocument(document, fieldName) {
  if (!document) {
    return '';
  }

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
    };
  });
}

function mergeProjectDetails(databaseProjects, fallbackProjects) {
  if (databaseProjects.length === 0) {
    return fallbackProjects;
  }

  const databaseProjectsById = new Map(
    databaseProjects.map((project) => [String(project.id), project])
  );

  return fallbackProjects.map((fallbackProject) => {
    const databaseProject = databaseProjectsById.get(String(fallbackProject.id));
    return databaseProject || fallbackProject;
  });
}

function buildProjectsContext(projects) {
  return projects
    .slice(0, 5)
    .map((project, index) => {
      const techStack = Array.isArray(project.tech_stack)
        ? project.tech_stack.join(', ')
        : project.tech_stack || 'Not listed';

      return [
        `Project ${index + 1}: ${project.name}`,
        `Description: ${project.description || 'Not listed'}`,
        `Tech stack: ${techStack}`,
      ].join('\n');
    })
    .join('\n\n');
}

// Ollama sometimes wraps JSON in markdown fences. This helper extracts valid JSON.
function parseJsonFromResponse(rawText) {
  const text = String(rawText || '').trim();

  if (!text) {
    throw new Error('AI returned an empty response.');
  }

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text;

  try {
    return JSON.parse(candidate);
  } catch (firstError) {
    const objectMatch = candidate.match(/\{[\s\S]*\}/);
    const arrayMatch = candidate.match(/\[[\s\S]*\]/);
    const jsonSlice = objectMatch || arrayMatch;

    if (!jsonSlice) {
      throw new Error('AI response is not valid JSON.');
    }

    try {
      return JSON.parse(jsonSlice[0]);
    } catch (secondError) {
      throw new Error('AI response is not valid JSON.');
    }
  }
}

function normalizeQuestionList(parsedResponse, expectedCount) {
  let questions = [];

  if (Array.isArray(parsedResponse)) {
    questions = parsedResponse;
  } else if (Array.isArray(parsedResponse.questions)) {
    questions = parsedResponse.questions;
  } else {
    throw new Error('AI did not return a questions array.');
  }

  questions = questions
    .map((question) => String(question || '').trim())
    .filter(Boolean);

  if (questions.length === 0) {
    throw new Error('AI returned no interview questions.');
  }

  return questions.slice(0, expectedCount);
}

function buildQuestionGenerationPrompt({
  jobDescription,
  difficulty,
  questionCount,
  projects,
  candidateName,
}) {
  const projectsContext = buildProjectsContext(projects);

  return `
You are a technical interview coach.

Task:
Generate exactly ${questionCount} short interview questions for a ${difficulty} level candidate.

Rules:
- Return ONLY valid JSON.
- No markdown.
- No explanations.
- No greetings.
- Questions must be technical and beginner-friendly.
- Questions must relate to the candidate projects when possible.
- Each question must be one sentence.
- Maximum 20 words per question.

JSON format:
{
  "questions": [
    "Question 1?",
    "Question 2?"
  ]
}

Candidate name:
${candidateName}

Job description:
${jobDescription}

Candidate projects:
${projectsContext || 'No projects available.'}
`.trim();
}

function buildAnswerValidationPrompt(question, answer) {
  return `
You are an interview answer evaluator.

Task:
Evaluate if the candidate answer is acceptable for the interview question.

Rules:
- Return ONLY valid JSON.
- No markdown.
- No extra keys.
- "acceptable" must be true or false.
- "feedback" must be one short sentence.

JSON format:
{
  "acceptable": true,
  "feedback": "Good explanation of PostgreSQL usage."
}

Question:
${question}

Candidate answer:
${answer}
`.trim();
}

function buildReportInsightsPrompt({ jobDescription, qaPairs, score }) {
  const conversation = qaPairs
    .map((pair, index) => {
      const status = pair.is_acceptable ? 'acceptable' : 'needs improvement';
      return [
        `Question ${index + 1}: ${pair.question}`,
        `Answer: ${pair.answer}`,
        `Result: ${status}`,
        `Feedback: ${pair.feedback || 'No feedback'}`,
      ].join('\n');
    })
    .join('\n\n');

  return `
You are an interview coach writing a final report.

Task:
Based on the interview results, return strengths, weaknesses, and recommendations.

Rules:
- Return ONLY valid JSON.
- No markdown.
- Keep each list item short.
- Maximum 3 items per list.
- Do NOT calculate or mention a numeric score.

JSON format:
{
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Job description:
${jobDescription}

Final score already calculated by the system: ${score}%

Interview transcript:
${conversation}
`.trim();
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 5);
}

function formatListForStorage(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

async function retrieveCandidateProjects(candidateId, jobDescription) {
  const retrievedProjects = await searchProjects(jobDescription, candidateId);
  const fallbackProjects = buildFallbackProjects(retrievedProjects);
  const projectIds = fallbackProjects.map((project) => project.id);
  const databaseProjects = await getCandidateProjectsByIds(candidateId, projectIds);
  return mergeProjectDetails(databaseProjects, fallbackProjects);
}

async function createInterviewSession({
  candidateId,
  jobDescription,
  difficulty,
  totalQuestions,
}) {
  const result = await pool.query(
    `INSERT INTO interview_sessions
      (candidate_id, job_description, difficulty, total_questions)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [candidateId, jobDescription, difficulty, totalQuestions]
  );

  return result.rows[0];
}

async function insertQuestionMessages(sessionId, questions) {
  const savedQuestions = [];

  for (const question of questions) {
    const result = await pool.query(
      `INSERT INTO interview_messages (session_id, role, message)
       VALUES ($1, 'assistant', $2)
       RETURNING id, session_id, role, message, created_at`,
      [sessionId, question]
    );

    savedQuestions.push(result.rows[0]);
  }

  return savedQuestions;
}

async function getSessionById(sessionId) {
  const result = await pool.query(
    'SELECT * FROM interview_sessions WHERE id = $1',
    [sessionId]
  );

  return result.rows[0] || null;
}

async function getQuestionById(sessionId, questionId) {
  const result = await pool.query(
    `SELECT *
     FROM interview_messages
     WHERE id = $1
       AND session_id = $2
       AND role = 'assistant'`,
    [questionId, sessionId]
  );

  return result.rows[0] || null;
}

async function getOrderedQuestions(sessionId) {
  const result = await pool.query(
    `SELECT id, message, created_at
     FROM interview_messages
     WHERE session_id = $1 AND role = 'assistant'
     ORDER BY id ASC`,
    [sessionId]
  );

  return result.rows;
}

async function getOrderedAnswers(sessionId) {
  const result = await pool.query(
    `SELECT id, message, is_acceptable, feedback, created_at
     FROM interview_messages
     WHERE session_id = $1 AND role = 'user'
     ORDER BY id ASC`,
    [sessionId]
  );

  return result.rows;
}

async function hasAnswerForQuestion(sessionId, questionId) {
  const questions = await getOrderedQuestions(sessionId);
  const answers = await getOrderedAnswers(sessionId);
  const questionIndex = questions.findIndex((question) => question.id === questionId);

  if (questionIndex === -1) {
    return false;
  }

  return answers.length > questionIndex;
}

async function insertCandidateAnswer({
  sessionId,
  answer,
  isAcceptable,
  feedback,
}) {
  const result = await pool.query(
    `INSERT INTO interview_messages
      (session_id, role, message, is_acceptable, feedback)
     VALUES ($1, 'user', $2, $3, $4)
     RETURNING id, session_id, role, message, is_acceptable, feedback, created_at`,
    [sessionId, answer, isAcceptable, feedback]
  );

  return result.rows[0];
}

function calculateScore(totalQuestions, acceptableCount) {
  if (!totalQuestions || totalQuestions <= 0) {
    return 0;
  }

  return Math.round((acceptableCount / totalQuestions) * 100);
}

function buildQaPairs(questions, answers) {
  return questions.map((question, index) => {
    const answer = answers[index];

    return {
      question_id: question.id,
      question: question.message,
      answer: answer ? answer.message : '',
      is_acceptable: answer ? Boolean(answer.is_acceptable) : false,
      feedback: answer ? answer.feedback : null,
      answered: Boolean(answer),
    };
  });
}

// 1) Start interview: generate questions with Ollama and save session + messages.
async function startInterview({
  candidateId,
  jobDescription,
  questionCount,
  difficulty = DEFAULT_DIFFICULTY,
}) {
  const normalizedCandidateId = normalizeCandidateId(candidateId);
  const normalizedQuestionCount = Number(questionCount);
  const normalizedJobDescription = String(jobDescription || '').trim();
  const normalizedDifficulty = String(difficulty || DEFAULT_DIFFICULTY).trim().toLowerCase();

  if (!normalizedJobDescription) {
    throw createServiceError('job_description is required.', 400);
  }

  if (
    !Number.isInteger(normalizedQuestionCount) ||
    normalizedQuestionCount < MIN_QUESTIONS ||
    normalizedQuestionCount > MAX_QUESTIONS
  ) {
    throw createServiceError(
      `question_count must be an integer between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}.`,
      400
    );
  }

  const candidate = await getCandidateById(normalizedCandidateId);

  if (!candidate) {
    throw createServiceError('Candidate not found.', 404);
  }

  const projects = await retrieveCandidateProjects(
    normalizedCandidateId,
    normalizedJobDescription
  );

  const prompt = buildQuestionGenerationPrompt({
    jobDescription: normalizedJobDescription,
    difficulty: normalizedDifficulty,
    questionCount: normalizedQuestionCount,
    projects,
    candidateName: candidate.name,
  });

  const aiRawResponse = await generateResponse(prompt, {
    num_predict: 700,
    temperature: 0.3,
  });

  const parsedQuestions = parseJsonFromResponse(aiRawResponse);
  const questions = normalizeQuestionList(parsedQuestions, normalizedQuestionCount);

  const session = await createInterviewSession({
    candidateId: normalizedCandidateId,
    jobDescription: normalizedJobDescription,
    difficulty: normalizedDifficulty,
    totalQuestions: questions.length,
  });

  const savedQuestions = await insertQuestionMessages(session.id, questions);

  return {
    session: {
      id: session.id,
      candidate_id: session.candidate_id,
      job_description: session.job_description,
      difficulty: session.difficulty,
      total_questions: session.total_questions,
      created_at: session.created_at,
    },
    questions: savedQuestions.map((item) => ({
      id: item.id,
      question: item.message,
    })),
  };
}

// 2) Validate one answer with Ollama and store the result.
async function validateAnswer({ sessionId, questionId, answer }) {
  const normalizedSessionId = Number(sessionId);
  const normalizedQuestionId = Number(questionId);
  const normalizedAnswer = String(answer || '').trim();

  if (!Number.isInteger(normalizedSessionId) || normalizedSessionId <= 0) {
    throw createServiceError('A valid session_id is required.', 400);
  }

  if (!Number.isInteger(normalizedQuestionId) || normalizedQuestionId <= 0) {
    throw createServiceError('A valid question_id is required.', 400);
  }

  if (!normalizedAnswer) {
    throw createServiceError('answer is required.', 400);
  }

  const session = await getSessionById(normalizedSessionId);

  if (!session) {
    throw createServiceError('Interview session not found.', 404);
  }

  const question = await getQuestionById(normalizedSessionId, normalizedQuestionId);

  if (!question) {
    throw createServiceError('Interview question not found for this session.', 404);
  }

  const alreadyAnswered = await hasAnswerForQuestion(
    normalizedSessionId,
    normalizedQuestionId
  );

  if (alreadyAnswered) {
    throw createServiceError('This question has already been answered.', 409);
  }

  const prompt = buildAnswerValidationPrompt(question.message, normalizedAnswer);
  const aiRawResponse = await generateResponse(prompt, {
    num_predict: 350,
    temperature: 0.2,
  });

  const parsedValidation = parseJsonFromResponse(aiRawResponse);

  if (typeof parsedValidation.acceptable !== 'boolean') {
    throw new Error('AI validation response is missing "acceptable".');
  }

  const feedback = String(parsedValidation.feedback || 'No feedback provided.').trim();
  const isAcceptable = parsedValidation.acceptable;

  const savedAnswer = await insertCandidateAnswer({
    sessionId: normalizedSessionId,
    answer: normalizedAnswer,
    isAcceptable,
    feedback,
  });

  return {
    session_id: normalizedSessionId,
    question_id: normalizedQuestionId,
    answer_id: savedAnswer.id,
    acceptable: isAcceptable,
    feedback,
  };
}

// 3) Build final report: Node.js calculates score, Ollama writes insights.
async function generateFinalReport(sessionId) {
  const normalizedSessionId = Number(sessionId);

  if (!Number.isInteger(normalizedSessionId) || normalizedSessionId <= 0) {
    throw createServiceError('A valid session id is required.', 400);
  }

  const session = await getSessionById(normalizedSessionId);

  if (!session) {
    throw createServiceError('Interview session not found.', 404);
  }

  const questions = await getOrderedQuestions(normalizedSessionId);
  const answers = await getOrderedAnswers(normalizedSessionId);
  const qaPairs = buildQaPairs(questions, answers);

  const answeredCount = answers.length;
  const acceptableCount = answers.filter((answer) => answer.is_acceptable).length;
  const score = calculateScore(session.total_questions, acceptableCount);

  let strengths = [];
  let weaknesses = [];
  let recommendations = [];

  if (answeredCount > 0) {
    const prompt = buildReportInsightsPrompt({
      jobDescription: session.job_description,
      qaPairs,
      score,
    });

    const aiRawResponse = await generateResponse(prompt, {
      num_predict: 400,
      temperature: 0.3,
    });

    const parsedReport = parseJsonFromResponse(aiRawResponse);
    strengths = normalizeStringList(parsedReport.strengths);
    weaknesses = normalizeStringList(parsedReport.weaknesses);
    recommendations = normalizeStringList(parsedReport.recommendations);
  } else {
    strengths = ['No answers submitted yet.'];
    weaknesses = ['Complete the interview to receive detailed feedback.'];
    recommendations = ['Answer all interview questions before requesting a report.'];
  }

  const strengthsText = formatListForStorage(strengths);
  const weaknessesText = formatListForStorage(weaknesses);
  const recommendationsText = formatListForStorage(recommendations);

  const updatedSessionResult = await pool.query(
    `UPDATE interview_sessions
     SET score = $1,
         strengths = $2,
         weaknesses = $3,
         recommendations = $4
     WHERE id = $5
     RETURNING *`,
    [
      score,
      strengthsText,
      weaknessesText,
      recommendationsText,
      normalizedSessionId,
    ]
  );

  const updatedSession = updatedSessionResult.rows[0];

  return {
    session: {
      id: updatedSession.id,
      candidate_id: updatedSession.candidate_id,
      job_description: updatedSession.job_description,
      difficulty: updatedSession.difficulty,
      total_questions: updatedSession.total_questions,
      created_at: updatedSession.created_at,
    },
    score: {
      percentage: score,
      acceptable_answers: acceptableCount,
      total_questions: updatedSession.total_questions,
      answered_questions: answeredCount,
    },
    strengths,
    weaknesses,
    recommendations,
    qa_pairs: qaPairs,
  };
}

function parseStoredBulletList(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

// Load report data for JSON or PDF export (uses DB cache when available).
async function getInterviewReportData(sessionId) {
  const normalizedSessionId = Number(sessionId);

  if (!Number.isInteger(normalizedSessionId) || normalizedSessionId <= 0) {
    throw createServiceError('A valid session id is required.', 400);
  }

  const session = await getSessionById(normalizedSessionId);

  if (!session) {
    throw createServiceError('Interview session not found.', 404);
  }

  const questions = await getOrderedQuestions(normalizedSessionId);
  const answers = await getOrderedAnswers(normalizedSessionId);
  const qaPairs = buildQaPairs(questions, answers);
  const answeredCount = answers.length;
  const acceptableCount = answers.filter((answer) => answer.is_acceptable).length;

  const candidate = await getCandidateById(session.candidate_id);

  if (!candidate) {
    throw createServiceError('Candidate not found.', 404);
  }

  // If report not saved yet but answers exist, generate it once.
  if (session.score === null && answeredCount > 0) {
    const generated = await generateFinalReport(normalizedSessionId);
    return { candidate, ...generated };
  }

  const scorePercentage =
    session.score !== null
      ? session.score
      : calculateScore(session.total_questions, acceptableCount);

  return {
    candidate,
    session: {
      id: session.id,
      candidate_id: session.candidate_id,
      job_description: session.job_description,
      difficulty: session.difficulty,
      total_questions: session.total_questions,
      created_at: session.created_at,
    },
    score: {
      percentage: scorePercentage,
      acceptable_answers: acceptableCount,
      total_questions: session.total_questions,
      answered_questions: answeredCount,
    },
    strengths: parseStoredBulletList(session.strengths),
    weaknesses: parseStoredBulletList(session.weaknesses),
    recommendations: parseStoredBulletList(session.recommendations),
    qa_pairs: qaPairs,
  };
}

module.exports = {
  startInterview,
  validateAnswer,
  generateFinalReport,
  getInterviewReportData,
  generateInterviewQuestions: startInterview,
};
