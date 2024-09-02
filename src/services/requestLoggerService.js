const BaseLoggerService = require("./baseLoggerService");

class RequestLoggerService extends BaseLoggerService {
  constructor() {
    super("requests.log");
  }

  logRequest(req, res, next) {
    const start = Date.now();
    const { method, url } = req;

    res.on("finish", async () => {
      const duration = Date.now() - start;
      const logMessage = `Timestamp: ${new Date().toISOString()}\n${method} ${url} ${
        res.statusCode
      } ${duration}ms\n`;

      try {
        await this.appendFile(logMessage);
      } catch (error) {
        console.error("Error logging request:", error);
      }
    });

    next();
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

module.exports = new RequestLoggerService();
