const fs = require('fs');
const { generateResponse } = require('../services/aiService');
const { searchProjects } = require('../services/chromaService');
const {
  getAuthenticatedCandidateResumeData,
  getCandidateProjectsByIds,
} = require('../services/candidateDataService');
const { generateResumePdf } = require('../services/pdfService');
const { buildAtsSummaryPrompt, cleanSummary } = require('../utils/aiPromptHelpers');
const { createHttpError } = require('../utils/httpError');

const FALLBACK_SUMMARY =
  'Professional summary unavailable. Add more profile details, skills, and projects to improve this section.';

function logResumeStep(message, metadata = {}) {
  console.info('[Resume PDF]', message, metadata);
}

function warnResumeStep(message, error) {
  console.warn('[Resume PDF]', message, error ? error.message : '');
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
  const safeName = String(candidate.name || 'candidate').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `${safeName || 'candidate'}-ats-resume.pdf`;
}

async function retrieveRelevantProjects(jobDescription, candidateId, allProjects) {
  if (!allProjects || allProjects.length === 0) {
    return [];
  }

  try {
    const retrievedProjects = await searchProjects(jobDescription, candidateId);
    const fallbackProjects = buildFallbackProjects(retrievedProjects || []);
    const projectIds = fallbackProjects.map((project) => project.id);
    const databaseProjects = await getCandidateProjectsByIds(candidateId, projectIds);
    const projects = mergeProjectDetails(databaseProjects, fallbackProjects);

    return projects.length > 0 ? projects : allProjects;
  } catch (error) {
    warnResumeStep('Project memory search failed; using saved projects instead.', error);
    return allProjects;
  }
}

async function generateProfessionalSummary({ candidate, jobDescription, skills, projects }) {
  try {
    const prompt = buildAtsSummaryPrompt({
      candidate,
      jobDescription,
      skills,
      projects,
    });
    const summary = cleanSummary(await generateResponse(prompt));
    return summary || FALLBACK_SUMMARY;
  } catch (error) {
    warnResumeStep('AI summary generation failed; using fallback summary.', error);
    return FALLBACK_SUMMARY;
  }
}

// POST /api/cv/generate
// Generate a downloadable ATS-friendly resume PDF for one candidate and job.
const generateCv = async (req, res, next) => {
  let generatedFilePath = null;

  try {
    const jobDescription = req.body.job_description;

    if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
      throw createHttpError('job_description is required.', 400);
    }

    logResumeStep('Generation requested.', { userId: req.user && req.user.userId });

    const {
      candidate,
      skills,
      education,
      projects: savedProjects,
    } = await getAuthenticatedCandidateResumeData(req.user && req.user.userId);

    if (!candidate) {
      throw createHttpError('Candidate profile not found. Complete your candidate profile before generating a resume.', 404);
    }

    if (!candidate.name || !String(candidate.name).trim()) {
      throw createHttpError('Candidate profile is incomplete. Add your name before generating a resume.', 422);
    }

    logResumeStep('Candidate data loaded.', {
      candidateId: candidate.id,
      skills: skills.length,
      projects: savedProjects.length,
      education: education.length,
    });

    const projects = await retrieveRelevantProjects(
      jobDescription.trim(),
      candidate.id,
      savedProjects
    );

    const summary = await generateProfessionalSummary({
      candidate,
      jobDescription: jobDescription.trim(),
      skills,
      projects,
    });

    logResumeStep('Summary and project data prepared.', {
      candidateId: candidate.id,
      projects: projects.length,
      hasGeneratedSummary: summary !== FALLBACK_SUMMARY,
    });

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
      } else if (error) {
        warnResumeStep('PDF download stream failed after headers were sent.', error);
      }
    });
  } catch (error) {
    console.error('[Resume PDF] Generation failed:', {
      message: error.message,
      statusCode: error.statusCode || 500,
      userId: req.user && req.user.userId,
    });

    if (generatedFilePath) {
      fs.promises.unlink(generatedFilePath).catch(() => {});
    }

    next(error);
  }
};

module.exports = {
  generateCv,
};
