const projectsService = require('../services/projectsService');

const createProject = async (req, res, next) => {
  try {
    const project = await projectsService.createProject(req.user.userId, req.body);
    res.status(201).json({
      message: 'Project created successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await projectsService.getProjects(req.user.userId);
    res.status(200).json({
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectsService.updateProject(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      message: 'Project updated successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await projectsService.deleteProject(req.user.userId, req.params.id);
    res.status(200).json({
      message: 'Project deleted successfully.',
      project,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
};
