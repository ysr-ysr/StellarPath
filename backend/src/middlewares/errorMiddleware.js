// Central error handler for Express.
// Controllers can call next(error), and Express will send the error here.
const errorMiddleware = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || error.status || 500;
  const isServerError = statusCode >= 500;

  console.error('Error:', {
    message: error.message,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    stack: isServerError ? error.stack : undefined,
  });

  res.status(statusCode).json({
    message: error.message || 'Server error',
  });
};

module.exports = errorMiddleware;
