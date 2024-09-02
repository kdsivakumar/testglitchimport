const RequestLoggerService = require("../services/requestLoggerService");
const ErrorLoggerService = require("../services/errorLoggerService");
const CombinedLoggerService = require("../services/combinedLoggerService");
const GitService = require("../services/gitService");

class LogController {
  async retrieveLogs(req, res) {
    try {
      const logs = await CombinedLoggerService.getCombinedLogs();
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retrieveLogsByDate(req, res) {
    const { date } = req.params;
    try {
      const logs = await CombinedLoggerService.getCombinedLogsByDate(date);
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async clearLogs(req, res) {
    try {
      await CombinedLoggerService.clearCombinedLogs();
      res.send("Logs cleared successfully");
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retrieveRequestLogs(req, res) {
    try {
      const logs = await RequestLoggerService.getLogs();
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retrieveErrorLogs(req, res) {
    try {
      const logs = await ErrorLoggerService.getLogs();
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retrieveGitLogs(req, res) {
    try {
      const logs = await GitService.getLogs();
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retrieveRequestLogsByDate(req, res) {
    const { date } = req.params;
    try {
      const logs = await RequestLoggerService.getLogsByDate(date);
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retrieveErrorLogsByDate(req, res) {
    const { date } = req.params;
    try {
      const logs = await ErrorLoggerService.getLogsByDate(date);
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async retrieveGitLogsByDate(req, res) {
    const { date } = req.params;
    try {
      const logs = await GitService.getLogsByDate(date);
      res.send(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async clearRequestLogs(req, res) {
    try {
      await RequestLoggerService.clearLogs();
      res.send("Request logs cleared successfully");
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async clearErrorLogs(req, res) {
    try {
      await ErrorLoggerService.clearLogs();
      res.send("Error logs cleared successfully");
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async clearGitLogs(req, res) {
    try {
      await GitService.clearLogs();
      res.send("Error logs cleared successfully");
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new LogController();

// const RequestLoggerService = require("../services/requestLoggerService");
// const ErrorLoggerService = require("../services/errorLoggerService");
// const CombinedLoggerService = require("../services/combinedLoggerService");
// const GitService = require("../services/gitService");

// class LogController {
//   static async handleRequest(serviceMethod, req, res) {
//     try {
//       const { date } = req.params || {};
//       console.log(serviceMethod, date);

//       const data = date ? await serviceMethod(date) : await serviceMethod();
//       res.send(data);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   }

//   static retrieveLogs(req, res) {
//     return LogController.handleRequest(
//       CombinedLoggerService.getCombinedLogs,
//       req,
//       res
//     );
//   }

//   static retrieveLogsByDate(req, res) {
//     return LogController.handleRequest(
//       CombinedLoggerService.getCombinedLogsByDate,
//       req,
//       res
//     );
//   }

//   static clearLogs(req, res) {
//     return LogController.handleRequest(
//       CombinedLoggerService.clearCombinedLogs,
//       req,
//       res
//     );
//   }

//   static retrieveRequestLogs(req, res) {
//     return LogController.handleRequest(RequestLoggerService.getLogs, req, res);
//   }

//   static retrieveErrorLogs(req, res) {
//     return LogController.handleRequest(ErrorLoggerService.getLogs, req, res);
//   }

//   static retrieveGitLogs(req, res) {
//     return LogController.handleRequest(GitService.getLogs, req, res);
//   }

//   static retrieveRequestLogsByDate(req, res) {
//     return LogController.handleRequest(
//       RequestLoggerService.getLogsByDate,
//       req,
//       res
//     );
//   }

//   static retrieveErrorLogsByDate(req, res) {
//     return LogController.handleRequest(
//       ErrorLoggerService.getLogsByDate,
//       req,
//       res
//     );
//   }

//   static retrieveGitLogsByDate(req, res) {
//     return LogController.handleRequest(GitService.getLogsByDate, req, res);
//   }

//   static clearRequestLogs(req, res) {
//     return LogController.handleRequest(
//       RequestLoggerService.clearLogs,
//       req,
//       res
//     );
//   }

//   static clearErrorLogs(req, res) {
//     return LogController.handleRequest(ErrorLoggerService.clearLogs, req, res);
//   }

//   static clearGitLogs(req, res) {
//     return LogController.handleRequest(GitService.clearLogs, req, res);
//   }
// }

// module.exports = LogController;
