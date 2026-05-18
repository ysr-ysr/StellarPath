// Central error handler for Express.
// Controllers can call next(error), and Express will send the error here.
const errorMiddleware = (error, req, res, next) => {
  console.error('Error:', error.message);

  res.status(error.statusCode || 500).json({
    message: error.message || 'Server error',
  });
};

module.exports = errorMiddleware;
