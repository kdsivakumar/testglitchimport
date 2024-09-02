const BaseLoggerService = require("./baseLoggerService");

class ErrorLoggerService extends BaseLoggerService {
  constructor() {
    super("errors.log");
  }

  async logError(err) {
    const errorMessage = `Timestamp: ${new Date().toISOString()}\nError: ${
      err.message
    }\nStack: ${err.stack}\n\n`;
    try {
      await this.appendFile(errorMessage);
    } catch (error) {
      console.error("Error logging to file:", error);
    }
  }

  async getLogs() {
    return this.readFile();
  }

  async getLogsByDate(date) {
    const data = await this.getLogs();
    const logs = data.split("\n\n").filter((log) => log.includes(date));
    return logs.join("\n\n");
  }

  async clearLogs() {
    return this.clearFile();
  }
}

module.exports = new ErrorLoggerService();
