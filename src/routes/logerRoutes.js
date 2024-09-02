const express = require("express");
const router = express.Router();
const LogController = require("../controllers/logController");

//combination logs
router.get("/logs", LogController.retrieveLogs);
router.get("/logs/date/:date", LogController.retrieveLogsByDate);
router.post("/logs/clear", LogController.clearLogs);

//separate logs
router.get("/logs/requests", LogController.retrieveRequestLogs);
router.get("/logs/errors", LogController.retrieveErrorLogs);
router.get("/logs/git", LogController.retrieveGitLogs);
router.get(
  "/logs/requests/date/:date",
  LogController.retrieveRequestLogsByDate
);
router.get("/logs/errors/date/:date", LogController.retrieveErrorLogsByDate);
router.get("/logs/git/date/:date", LogController.retrieveGitLogs);
router.post("/logs/requests/clear", LogController.clearRequestLogs);
router.post("/logs/errors/clear", LogController.clearErrorLogs);
router.post("/logs/git/clear", LogController.clearGitLogs);

module.exports = router;
