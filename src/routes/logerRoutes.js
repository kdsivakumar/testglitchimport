const express = require("express");
const router = express.Router();
const LogController = require("../controllers/logController");
const authMiddleware = require("../middlewares/authMiddleware");
const path = require("path");
const fs = require("fs");
const logger = require("../utils/logger"); // Import logger

// Define your logs directory path (must match your logger configuration)
const LOGS_DIR = path.join(__dirname, "../logs");

// Get list of all log files
router.get("/customlogs", (req, res) => {
  fs.readdir(LOGS_DIR, (err, files) => {
    if (err) {
      // logger.error('Failed to read log directory', { error: err });
      return res.status(500).json({ error: "Failed to read log directory" });
    }

    const logFiles = files.filter((file) => file.endsWith(".log"));
    res.json({ logs: logFiles });
  });
});

// View specific log file with filtering
router.get("/customlogs/:filename", (req, res) => {
  const { filename } = req.params;
  const { level, search, limit = 100 } = req.query;

  // Security check to prevent directory traversal
  if (filename.includes("..") || !filename.endsWith(".log")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filePath = path.join(LOGS_DIR, filename);

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      logger.error("Failed to read log file", { file: filename, error: err });
      return res.status(404).json({ error: "Log file not found" });
    }

    let lines = data.split("\n").filter((line) => line.trim() !== "");

    // Apply filters if provided
    if (level) {
      lines = lines.filter((line) => line.includes(`[${level}]`));
    }

    if (search) {
      lines = lines.filter((line) =>
        line.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply limit
    lines = lines.slice(-limit);

    res.json({
      filename,
      count: lines.length,
      logs: lines,
    });
  });
});

// Clear/rotate log files
router.delete("/customlogs/:filename", (req, res) => {
  const { filename } = req.params;

  // Security check
  if (filename.includes("..") || !filename.endsWith(".log")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filePath = path.join(LOGS_DIR, filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      logger.error("Failed to delete log file", { file: filename, error: err });
      return res.status(500).json({ error: "Failed to delete log file" });
    }

    logger.info("Log file deleted via API", { file: filename });
    res.json({ message: "Log file deleted successfully" });
  });
});

// Clear all logs older than X days
router.post("/customlogs/cleanup", (req, res) => {
  const { daysToKeep = 7 } = req.body;
  const now = Date.now();
  const cutoff = now - daysToKeep * 24 * 60 * 60 * 1000;

  fs.readdir(LOGS_DIR, (err, files) => {
    if (err) {
      logger.error("Failed to read log directory for cleanup", { error: err });
      return res.status(500).json({ error: "Failed to read log directory" });
    }

    const deletionPromises = files.map((file) => {
      if (!file.endsWith(".log")) return Promise.resolve();

      const filePath = path.join(LOGS_DIR, file);

      return new Promise((resolve) => {
        fs.stat(filePath, (err, stats) => {
          if (err) {
            logger.warn("Could not check file stats during cleanup", {
              file,
              error: err,
            });
            return resolve();
          }

          if (stats.mtimeMs < cutoff) {
            fs.unlink(filePath, (err) => {
              if (err) {
                logger.warn("Failed to delete old log file", {
                  file,
                  error: err,
                });
              } else {
                logger.info("Deleted old log file", { file });
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    });

    Promise.all(deletionPromises)
      .then(() => {
        res.json({
          message: `Cleanup completed - kept logs from last ${daysToKeep} days`,
        });
      })
      .catch((error) => {
        logger.error("Error during log cleanup", { error });
        res
          .status(500)
          .json({ error: "Partial cleanup completed with errors" });
      });
  });
});

//combination logs
router.get("/logs", LogController.retrieveLogs);
router.get("/logs/date/:date", LogController.retrieveLogsByDate);
router.delete("/logs/clear", authMiddleware, LogController.clearLogs);

//separate logs
router.get("/logs/requests", LogController.retrieveRequestLogs);
router.get("/logs/errors", LogController.retrieveErrorLogs);
router.get("/logs/git", LogController.retrieveGitLogs);
router.get(
  "/logs/requests/date/:date",
  LogController.retrieveRequestLogsByDate
);
router.get("/logs/errors/date/:date", LogController.retrieveErrorLogsByDate);
router.get("/logs/git/date/:date", LogController.retrieveGitLogsByDate);
router.delete(
  "/logs/requests/clear",
  authMiddleware,
  LogController.clearRequestLogs
);
router.delete(
  "/logs/errors/clear",
  authMiddleware,
  LogController.clearErrorLogs
);
router.delete("/logs/git/clear", authMiddleware, LogController.clearGitLogs);

module.exports = router;
