const express = require('express');
const { analyzeJob } = require('../controllers/aiController');

const router = express.Router();

router.post('/analyze-job/:jobId', analyzeJob);

module.exports = router;
