const express = require('express');
const { getSkills } = require('../controllers/skillsController');

const router = express.Router();

router.get('/', getSkills);

module.exports = router;
