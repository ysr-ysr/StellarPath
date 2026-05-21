const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

const requireCandidate = (req, res, next) => {
  if (!req.user || req.user.role !== 'candidate') {
    return res.status(403).json({ message: 'Access denied. Candidate role required.' });
  }
  next();
};

const requireCompany = (req, res, next) => {
  if (!req.user || req.user.role !== 'company') {
    return res.status(403).json({ message: 'Access denied. Company role required.' });
  }
  next();
};

module.exports = {
  verifyToken,
  requireCandidate,
  requireCompany,
};
