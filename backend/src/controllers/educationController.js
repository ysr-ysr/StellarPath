const educationService = require('../services/educationService');

const createEducation = async (req, res, next) => {
  try {
    const education = await educationService.createEducation(req.user.userId, req.body);
    res.status(201).json({
      message: 'Education created successfully.',
      education,
    });
  } catch (error) {
    next(error);
  }
};

const getEducation = async (req, res, next) => {
  try {
    const education = await educationService.getEducation(req.user.userId);
    res.status(200).json({
      count: education.length,
      education,
    });
  } catch (error) {
    next(error);
  }
};

const updateEducation = async (req, res, next) => {
  try {
    const education = await educationService.updateEducation(
      req.user.userId,
      req.params.id,
      req.body
    );

    res.status(200).json({
      message: 'Education updated successfully.',
      education,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEducation = async (req, res, next) => {
  try {
    const education = await educationService.deleteEducation(req.user.userId, req.params.id);
    res.status(200).json({
      message: 'Education deleted successfully.',
      education,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEducation,
  getEducation,
  updateEducation,
  deleteEducation,
};
