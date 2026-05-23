const candidateEvaluationService = require('../services/candidateEvaluationService');

const createEvaluation = async (req, res, next) => {
  try {
    const evaluation = await candidateEvaluationService.createEvaluation(
      req.body.candidate_id,
      req.body.job_id
    );

    res.status(201).json({
      candidate_id: evaluation.candidate_id,
      job_id: evaluation.job_id,
      skills_score: evaluation.skills_score,
      projects_score: evaluation.projects_score,
      interview_score: evaluation.interview_score,
      overall_score: evaluation.overall_score,
      recommendation: evaluation.recommendation,
    });
  } catch (error) {
    next(error);
  }
};

const getEvaluationsByJob = async (req, res, next) => {
  try {
    const evaluations = await candidateEvaluationService.getEvaluationsByJob(req.params.jobId);

    res.status(200).json({
      count: evaluations.length,
      evaluations,
    });
  } catch (error) {
    next(error);
  }
};

const sendEvaluationEmail = async (req, res, next) => {
  try {
    const result = await candidateEvaluationService.sendEvaluationNotification(
      req.params.id,
      req.body.type
    );

    res.status(200).json({
      message: 'Evaluation email sent successfully.',
      evaluation_id: result.evaluation.id,
      type: result.email.type,
      to: result.email.to,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvaluation,
  getEvaluationsByJob,
  sendEvaluationEmail,
};
