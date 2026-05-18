const express = require('express');
const { generateCv } = require('../controllers/cvController');

const router = express.Router();

// POST /api/cv/generate - generate and download an ATS resume PDF.
router.post('/generate', generateCv);

module.exports = router;
