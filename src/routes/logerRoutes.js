const express = require("express");
const router = express.Router();
const LogController = require("../controllers/logController");
const authMiddleware = require("../middlewares/authMiddleware");

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
