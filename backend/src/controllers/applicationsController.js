const applicationsService = require('../services/applicationsService');

const applyToJob = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { jobId } = req.params;

    const application = await applicationsService.applyToJob(userId, jobId);

    res.status(201).json({ 
      message: 'Applied to job successfully and ATS resume generated', 
      application 
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('already applied')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const getCandidateApplications = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const applications = await applicationsService.getCandidateApplications(userId);
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    if (error.message.includes('Candidate profile not found')) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  applyToJob,
  getCandidateApplications,
};
