const ErrorLoggerService = require("../services/errorLoggerService");

const errorHandlingMiddleware = (err, req, res, next) => {
  // Log the error using the ErrorLoggerService
  ErrorLoggerService.logError(err);

  // Send error response
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Include stack trace in development
  });
};

module.exports = errorHandlingMiddleware;
