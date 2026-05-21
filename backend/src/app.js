const express = require('express');
const cors = require('cors');

const jobsRoutes = require('./routes/jobsRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const skillsRoutes = require('./routes/skillsRoutes');
const educationRoutes = require('./routes/educationRoutes');
const cvRoutes = require('./routes/cvRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const companyJobsRoutes = require('./routes/companyJobsRoutes');
const applicationsRoutes = require('./routes/applicationsRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

// Allow frontend applications to call this API.
app.use(cors());

// Parse incoming JSON request bodies.
app.use(express.json());

// Root route for quick API checks in the browser.
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the StellarPath API',
  });
});

// API routes
app.use('/api/jobs', jobsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/company/jobs', companyJobsRoutes);
app.use('/api/applications', applicationsRoutes);

// Error middleware should be registered after routes.
app.use(errorMiddleware);

module.exports = app;
