const fs = require("fs");
const path = require("path");
const logFile = path.join(__dirname, "../logs/requests.log");
const logger = require("../utils/logger");

const logRequest = (req, res, next) => {
  const start = Date.now();
  const { method, url } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `Timestamp: ${new Date().toISOString()}\n${method} ${url} ${
      res.statusCode
    } ${duration}ms\n\n`;

    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error("Error logging request:", err);
    });
  });

  next();
};

function requestLogger(req, res, next) {
  const start = Date.now();
  const requestId =
    req.headers["x-request-id"] || Math.random().toString(36).substring(2, 10);

  // Attach request ID to the request object
  req.requestId = requestId;

  // Log request start
  logger.info(`Request: ${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    body: Object.keys(req.body).length > 0 ? req.body : undefined,
  });

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`Response: ${req.method} ${req.originalUrl}`, {
      requestId,
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length") || "0",
    });
  });

  // Log if response closes prematurely
  res.on("close", () => {
    const duration = Date.now() - start;
    logger.warn(`Client disconnected: ${req.method} ${req.originalUrl}`, {
      requestId,
      duration: `${duration}ms`,
      status: res.statusCode,
    });
  });

  next();
}

(module.exports = logRequest), requestLogger;
