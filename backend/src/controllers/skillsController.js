const skillsService = require('../services/skillsService');

const createSkill = async (req, res, next) => {
  try {
    const skill = await skillsService.createSkill(req.user.userId, req.body);
    res.status(201).json({
      message: 'Skill created successfully.',
      skill,
    });
  } catch (error) {
    next(error);
  }
};


const getSkills = async (req, res, next) => {
  try {
    const skills = await skillsService.getSkills(req.user.userId);
    res.status(200).json({
      count: skills.length,
      skills,
    });
  } catch (error) {
    next(error);
  }
};

const updateSkill = async (req, res, next) => {
  try {
    const skill = await skillsService.updateSkill(req.user.userId, req.params.id, req.body);
    res.status(200).json({
      message: 'Skill updated successfully.',
      skill,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSkill = async (req, res, next) => {
  try {
    const skill = await skillsService.deleteSkill(req.user.userId, req.params.id);
    res.status(200).json({
      message: 'Skill deleted successfully.',
      skill,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill,
};
