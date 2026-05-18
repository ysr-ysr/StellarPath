const express = require('express');
const {
  startInterviewSession,
  submitInterviewAnswer,
  getInterviewReport,
  downloadInterviewReportPdf,
} = require('../controllers/interviewController');

const router = express.Router();

// POST /api/interview/start - create session and generate questions
router.post('/start', startInterviewSession);

// POST /api/interview/answer - validate one candidate answer
router.post('/answer', submitInterviewAnswer);

// GET /api/interview/report/:sessionId - calculate score and build final report
router.get('/report/:sessionId', getInterviewReport);

// GET /api/interview/report/:sessionId/pdf - download styled interview report PDF
router.get('/report/:sessionId/pdf', downloadInterviewReportPdf);

module.exports = router;
