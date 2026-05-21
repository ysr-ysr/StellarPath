const companyJobsService = require('../services/companyJobsService');

const createJob = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { title, company, location, description, url, status } = req.body;

    if (!title || !company) {
      return res.status(400).json({ message: 'Title and company are required' });
    }

    const job = await companyJobsService.createJob(userId, title, company, location, description, url, status);
    res.status(201).json({ message: 'Job created successfully', job });
  } catch (error) {
    if (error.message.includes('Company profile not found')) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, company, location, description, url, status } = req.body;

    if (!title || !company) {
      return res.status(400).json({ message: 'Title and company are required' });
    }

    const job = await companyJobsService.updateJob(userId, id, title, company, location, description, url, status);
    res.status(200).json({ message: 'Job updated successfully', job });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const job = await companyJobsService.deleteJob(userId, id);
    res.status(200).json({ message: 'Job deleted successfully', job });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('permission')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

const listOwnJobs = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const jobs = await companyJobsService.listOwnJobs(userId);
    res.status(200).json({ count: jobs.length, jobs });
  } catch (error) {
    if (error.message.includes('Company profile not found')) {
      return res.status(403).json({ message: error.message });
    }
    next(error);
  }
};

const listJobApplications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { jobId } = req.params;

    const applications = await companyJobsService.listJobApplications(userId, jobId);
    res.status(200).json({ count: applications.length, applications });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  createJob,
  updateJob,
  deleteJob,
  listOwnJobs,
  listJobApplications,
};
