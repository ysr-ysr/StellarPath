// Skill controller actions will be added here later.
const getSkills = (req, res) => {
  res.status(200).json({
    message: 'Skills route is ready',
    skills: [],
  });
};

module.exports = {
  getSkills,
};
