const express = require('express');
const { generateCv } = require('../controllers/cvController');
const { verifyToken, requireCandidate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireCandidate);

// POST /api/cv/generate - generate and download an ATS resume PDF.
router.post('/generate', generateCv);

module.exports = router;
