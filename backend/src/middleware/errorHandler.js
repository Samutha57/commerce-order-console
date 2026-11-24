export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // Avoid exposing internal error stacks to client in API responses
  const message = err.message || 'An unexpected server error occurred';

  res.status(statusCode).json({
    success: false,
    message
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}
