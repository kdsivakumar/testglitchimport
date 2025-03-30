const winston = require("winston");
const { createLogger, format, transports } = winston;
const { combine, timestamp, json, errors, printf } = format;
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const util = require("util");
// Configure logs directory
const LOGS_DIR = path.join(__dirname, "../logs");

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Application-specific log format
const applicationLogFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  json()
);

// Custom format to match your exact requirements
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  // Format metadata as JSON string without quotes around properties
  const metaString =
    Object.keys(metadata).length > 0
      ? util
          .inspect(metadata, {
            depth: null,
            colors: false,
            compact: true,
            breakLength: Infinity,
          })
          .replace(/'/g, '"')
      : "";

  return `${timestamp} [${level}]: ${JSON.stringify(message)} ${metaString}`;
});

// Create transports
const createTransport = (level, filename, maxFiles = "14d") => {
  return new DailyRotateFile({
    level,
    filename: `${LOGS_DIR}/${filename}-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles,
    format: combine(
      timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
      customFormat
    ),
  });
};

// Logger instance
const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  transports: [
    // Console transport (human-readable during development)
    new transports.Console({
      format: combine(
        format.colorize(),
        timestamp(),
        format.printf(({ level, message, timestamp, stack, ...meta }) => {
          const metaString = Object.keys(meta).length
            ? JSON.stringify(meta)
            : "";
          return `${timestamp} [${level}]: ${message} ${metaString}${
            stack ? `\n${stack}` : ""
          }`;
        })
      ),
      silent: process.env.NODE_ENV === "production", // Only log to console in dev
    }),

    // Application logs (info level)
    createTransport("info", "application"),

    // HTTP request logs
    createTransport("http", "http"),

    // Error logs
    createTransport("error", "error", "30d"),
  ],
  exceptionHandlers: [createTransport("error", "exceptions", "30d")],
  rejectionHandlers: [createTransport("error", "rejections", "30d")],
  exitOnError: false,
});

// Custom application logger methods
logger.applicationLog = (message, meta = {}) => {
  logger.info(message, { ...meta, type: "application" });
};

logger.httpLog = (req, res, responseTime) => {
  logger.http("HTTP Request", {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    type: "http",
  });
};

// Error handling
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    message: error.message,
    stack: error.stack,
    type: "uncaught",
  });
  if (!logger.transports.some((t) => t.handleExceptions)) {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    type: "rejection",
  });
});

module.exports = logger;
