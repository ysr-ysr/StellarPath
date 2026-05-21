const authService = require('../services/authService');

const registerCandidate = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const result = await authService.registerCandidate(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

const registerCompany = async (req, res, next) => {
  try {
    const { email, password, company_name } = req.body;

    if (!email || !password || !company_name) {
      return res.status(400).json({ message: 'Email, password, and company_name are required' });
    }

    const result = await authService.registerCompany(email, password, company_name);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Email already registered') {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await authService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  registerCandidate,
  registerCompany,
  login,
};
