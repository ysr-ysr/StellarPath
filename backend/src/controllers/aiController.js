const { pool } = require('../config/db');
const chromaService = require('../services/chromaService');
const aiService = require('../services/aiService');

// Helper to format projects for the prompt
function formatProjectsForPrompt(projects) {
  if (!projects || projects.length === 0) {
    return 'No relevant candidate projects found.';
  }

  return projects
    .map((project, index) => {
      const metadata = project.metadata || {};
      const name = metadata.name || 'Unnamed Project';
      const techStack = metadata.tech_stack || 'No tech stack listed';

      // Attempt to extract description from the document
      let description = project.document || '';
      const descMatch = description.match(/Description:\s*([^\n]*)/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }

      return `Project ${index + 1}: ${name}\nTechnologies: ${techStack}\nDescription: ${description}`;
    })
    .join('\n\n');
}

// POST /api/ai/analyze-job/:jobId
// Analyze a job description against candidate projects
const analyzeJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const candidateId = Number(req.body.candidate_id || 1);

    // 1. Get job from PostgreSQL using jobId
    const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const job = jobResult.rows[0];

    // 2. Extract job description
    const jobDescription = job.description;

    if (!jobDescription) {
      return res.status(400).json({ message: 'Job has no description to analyze' });
    }

    // 3. Call chromaService.searchProjects
    const matchingProjects = await chromaService.searchProjects(jobDescription, candidateId);

    // 4. Build AI prompt
    const formattedProjects = formatProjectsForPrompt(matchingProjects);

    const prompt = `
You are an AI career coach.
Analyze the following job description against the candidate's past projects.
Provide a brief summary of why the candidate is a good fit and point out any missing skills.

Job Description:
${jobDescription}

Candidate Projects:
${formattedProjects}

Format your response nicely and keep it professional.
`.trim();

    // 5. Call aiService.generateResponse
    const aiAnalysis = await aiService.generateResponse(prompt);

    // 6. Return result
    return res.status(200).json({
      message: 'Job analysis completed successfully',
      jobId: job.id,
      analysis: aiAnalysis,
      projectsRetrieved: matchingProjects.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeJob,
};
