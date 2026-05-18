// Project controller actions will be added here later.
const getProjects = (req, res) => {
  res.status(200).json({
    message: 'Projects route is ready',
    projects: [],
  });
};

module.exports = {
  getProjects,
};
