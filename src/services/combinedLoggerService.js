const ErrorLoggerService = require("./errorLoggerService");
const RequestLoggerService = require("./requestLoggerService");

class CombinedLoggerService {
  async getCombinedLogs() {
    return Promise.all([
      RequestLoggerService.getLogs(),
      ErrorLoggerService.getLogs(),
    ]).then(([requestLogs, errorLogs]) => {
      return `--- Request Logs ---\n${requestLogs}\n--- Error Logs ---\n${errorLogs}`;
    });
  }

  async getCombinedLogsByDate(date) {
    return Promise.all([
      RequestLoggerService.getLogsByDate(date),
      ErrorLoggerService.getLogsByDate(date),
    ]).then(([requestLogs, errorLogs]) => {
      return `--- Request Logs for ${date} ---\n${requestLogs}\n--- Error Logs for ${date} ---\n${errorLogs}`;
    });
  }

  async clearCombinedLogs() {
    return Promise.all([
      RequestLoggerService.clearLogs(),
      ErrorLoggerService.clearLogs(),
    ]).then(() => "Combined logs cleared successfully");
  }
}

module.exports = new CombinedLoggerService();
