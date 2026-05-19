const { pool } = require('../config/db');
const chromaService = require('../services/chromaService');
const aiService = require('../services/aiService');
const { getCandidateResumeData, getCandidateProjectsByIds } = require('../services/candidateDataService');
const { buildAtsSummaryPrompt, cleanSummary } = require('./cvController');
const interviewService = require('../services/interviewService');

// Helper to format projects for the prompt
function formatProjectsForPrompt(projects) {
  if (!projects || projects.length === 0) {
    return 'No relevant candidate projects found.';
  }
  return projects
    .map((project, index) => {
      const name = project.name || 'Unnamed Project';
      const techStack = Array.isArray(project.tech_stack) 
        ? project.tech_stack.join(', ') 
        : project.tech_stack || 'No tech stack listed';

      let description = project.description || project.document || '';
      const descMatch = description.match(/Description:\s*([^\n]*)/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }
      return `Project ${index + 1}: ${name}\nTechnologies: ${techStack}\nDescription: ${description}`;
    })
    .join('\n\n');
}

// POST /api/ai/analyze-job/:jobId
// Unified endpoint to analyze a job, generate CV summary, and interview questions
const analyzeJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const candidateId = Number(req.body.candidate_id || 1);

    // 1. Get job
    const jobResult = await pool.query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const job = jobResult.rows[0];
    const jobDescription = job.description;

    if (!jobDescription) {
      return res.status(400).json({ message: 'Job has no description to analyze' });
    }

    // 2. Get Candidate Data
    const { candidate, skills } = await getCandidateResumeData(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // 3. Search Chroma for relevant projects
    const chromaProjects = await chromaService.searchProjects(jobDescription, candidateId);
    
    // Fetch full details from DB
    const projectIds = chromaProjects.map(p => p.id);
    let fullProjects = [];
    if (projectIds.length > 0) {
      fullProjects = await getCandidateProjectsByIds(candidateId, projectIds);
      
      // Fallback to chroma projects if DB doesn't have them
      if (fullProjects.length === 0) {
        fullProjects = chromaProjects.map(p => ({
          id: p.id,
          name: p.metadata?.name,
          tech_stack: p.metadata?.tech_stack,
          description: p.document
        }));
      }
    }

    const formattedProjects = formatProjectsForPrompt(fullProjects);

    // 4. Run AI tasks concurrently
    
    // Task A: Fit Analysis
    const analysisPrompt = `
You are an AI career coach.
Analyze the following job description against the candidate's past projects.
Provide a brief summary of why the candidate is a good fit and point out any missing skills.

Job Description:
${jobDescription}

Candidate Projects:
${formattedProjects}

Format your response nicely and keep it professional.
`.trim();

    const analysis = await aiService.generateResponse(analysisPrompt, { temperature: 0.3 });

    // Task B: CV Summary
    const cvPrompt = buildAtsSummaryPrompt({
      candidate,
      jobDescription,
      skills,
      projects: fullProjects
    });
    const rawCv = await aiService.generateResponse(cvPrompt, { temperature: 0.3 });
    const cv = cleanSummary(rawCv);

    // Task C: Interview Questions
    const interviewResult = await interviewService.generateInterviewQuestions({
      candidateId,
      jobDescription,
      questionCount: 3,
      difficulty: 'intermediate'
    });

    // 5. Return structured result
    return res.status(200).json({
      job,
      cv,
      analysis,
      interviewQuestions: interviewResult.questions.map(q => q.question),
      projects: fullProjects
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeJob,
};
