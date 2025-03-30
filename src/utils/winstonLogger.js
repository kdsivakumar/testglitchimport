// logger.js
const winston = require("winston");
require("winston-daily-rotate-file");

// Define log levels and formats
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json() // Use JSON format for structured logs
);

// Dynamically set the log level based on the environment
const logLevel = process.env.NODE_ENV === "production" ? "error" : "info";

// Daily rotation setup
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: "../logs/%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "info",
  zippedArchive: true, // Optionally zip old log files
  maxSize: "20m", // Limit file size to 20MB
  maxFiles: "14d", // Keep log files for 14 days
});

// Logger setup
const logger = winston.createLogger({
  level: logLevel, // Log level (error in production, info in development)
  format: logFormat, // Use the logFormat with timestamp and JSON format
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Colorize logs for better readability in dev
        winston.format.simple()
      ),
    }),
    // File transport for production with rotation
    dailyRotateFileTransport,
  ],
});

module.exports = logger;
