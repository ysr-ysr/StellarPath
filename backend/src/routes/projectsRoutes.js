const express = require('express');
const { getProjects } = require('../controllers/projectsController');

const router = express.Router();

router.get('/', getProjects);

module.exports = router;
