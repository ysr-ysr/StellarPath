const fs = require('fs');
const {
  startInterview,
  validateAnswer,
  generateFinalReport,
  getInterviewReportData,
} = require('../services/interviewService');
const { generateInterviewReportPdf } = require('../services/interviewReportPdfService');

// POST /api/interview/start
const startInterviewSession = async (req, res, next) => {
  try {
    const { candidate_id, job_description, question_count, difficulty } = req.body;

    const result = await startInterview({
      candidateId: candidate_id,
      jobDescription: job_description,
      questionCount: question_count,
      difficulty,
    });

    res.status(201).json({
      message: 'Interview session started successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/interview/answer
const submitInterviewAnswer = async (req, res, next) => {
  try {
    const { session_id, question_id, answer } = req.body;

    const result = await validateAnswer({
      sessionId: session_id,
      questionId: question_id,
      answer,
    });

    res.status(200).json({
      message: 'Answer validated successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/interview/report/:sessionId
const getInterviewReport = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await generateFinalReport(sessionId);

    res.status(200).json({
      message: 'Interview report generated successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/interview/report/:sessionId/pdf - download interview report PDF
const downloadInterviewReportPdf = async (req, res, next) => {
  let generatedFilePath = null;

  try {
    const { sessionId } = req.params;
    const reportData = await getInterviewReportData(sessionId);

    const pdfResult = await generateInterviewReportPdf(reportData);
    generatedFilePath = pdfResult.filePath;

    const safeName = reportData.candidate.name
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase();

    const downloadName = `${safeName || 'candidate'}-interview-report.pdf`;

    res.download(generatedFilePath, downloadName, (error) => {
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
  startInterviewSession,
  submitInterviewAnswer,
  getInterviewReport,
  downloadInterviewReportPdf,
};
