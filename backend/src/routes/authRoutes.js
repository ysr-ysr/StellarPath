const express = require('express');
const {
  registerCandidate,
  registerCompany,
  login,
} = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/register-candidate
router.post('/register-candidate', registerCandidate);

// POST /api/auth/register-company
router.post('/register-company', registerCompany);

// POST /api/auth/login
router.post('/login', login);

module.exports = router;
