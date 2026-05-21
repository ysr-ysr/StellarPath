const fs = require('fs');
const { generateResponse } = require('../services/aiService');
const { searchProjects } = require('../services/chromaService');
const {
  getCandidateResumeData,
  getCandidateProjectsByIds,
  normalizeCandidateId,
} = require('../services/candidateDataService');
const { generateResumePdf } = require('../services/pdfService');
const { buildAtsSummaryPrompt, cleanSummary } = require('../utils/aiPromptHelpers');

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
