const fs = require('fs');
const { generateResponse } = require('../services/aiService');
const { searchProjects } = require('../services/chromaService');
const {
  getCandidateResumeData,
  getCandidateProjectsByIds,
  normalizeCandidateId,
} = require('../services/candidateDataService');
const { generateResumePdf } = require('../services/pdfService');

function createHttpError(message, statusCode) {
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
      candidate_id: metadata.candidate_id,
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
  return projects.slice(0, 3).map((project, index) => {
    return [
      `Project ${index + 1}: ${project.name}`,
      `Tech Stack: ${project.tech_stack || 'Not listed'}`,
      `Description: ${project.description || 'Not listed'}`,
      `Key Achievements: ${project.key_achievements || 'Not listed'}`,
    ].join('\n');
  }).join('\n\n');
}

function buildSkillsContext(skills) {
  if (!skills || skills.length === 0) {
    return 'No skills listed.';
  }

  return skills.map((skill) => skill.name).join(', ');
}

function buildAtsSummaryPrompt({ candidate, jobDescription, skills, projects }) {
  return `
You are an ATS resume summary generator.

Task:
Generate a polished professional summary for the top of an ATS resume.

Strict rules:
- Output exactly 3 concise lines.
- Each line must be a complete professional sentence.
- Use third-person resume style without pronouns.
- Do not use "I", "my", "we", "our", "the candidate", or "a passionate".
- Do not start with "Here is".
- No storytelling.
- No company voice.
- No greetings.
- No explanations.
- Do not invent experience.
- Use only the candidate data below.
- Keep the language natural, direct, and recruiter-friendly.
- Mention the role, strongest technical stack, AI/project focus, and job-relevant keywords.
- Avoid awkward lists such as "using CSS & HTML5"; write clean phrases like "with React, Node.js, PostgreSQL, and AI APIs".

Candidate name:
${candidate.name}

Candidate title:
${candidate.title || 'Not listed'}

Job description:
${jobDescription}

Candidate skills:
${buildSkillsContext(skills)}

Retrieved candidate projects:
${buildProjectsContext(projects)}
`.trim();
}

function cleanSummary(summary) {
  return String(summary || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, ''))
    .replace(/^(professional summary|résumé|resume summary)\s*:\s*/i, '')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .slice(0, 3)
    .join('\n');
}

function buildDownloadFileName(candidate) {
  const safeName = candidate.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `${safeName || 'candidate'}-ats-resume.pdf`;
}

// POST /api/cv/generate
// Generate a downloadable ATS-friendly resume PDF for one candidate and job.
const generateCv = async (req, res, next) => {
  let generatedFilePath = null;

  try {
    const candidateId = normalizeCandidateId(req.body.candidate_id);
    const jobDescription = req.body.job_description;

    if (!jobDescription || typeof jobDescription !== 'string') {
      throw createHttpError('job_description is required.', 400);
    }

    const { candidate, skills, education } = await getCandidateResumeData(candidateId);

    if (!candidate) {
      throw createHttpError('Candidate not found.', 404);
    }

    const retrievedProjects = await searchProjects(jobDescription, candidateId);
    const fallbackProjects = buildFallbackProjects(retrievedProjects);
    const projectIds = fallbackProjects.map((project) => project.id);
    const databaseProjects = await getCandidateProjectsByIds(candidateId, projectIds);
    const projects = mergeProjectDetails(databaseProjects, fallbackProjects);

    const prompt = buildAtsSummaryPrompt({
      candidate,
      jobDescription,
      skills,
      projects,
    });

    const summary = cleanSummary(await generateResponse(prompt));

    const pdfResult = await generateResumePdf({
      candidate,
      summary,
      skills,
      projects,
      education,
    });

    generatedFilePath = pdfResult.filePath;

    res.download(generatedFilePath, buildDownloadFileName(candidate), (error) => {
      fs.promises.unlink(generatedFilePath).catch(() => {});

      if (error && !res.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    if (generatedFilePath) {
      fs.promises.unlink(generatedFilePath).catch(() => {});
    }

    next(error);
  }
};

module.exports = {
  generateCv,
};
