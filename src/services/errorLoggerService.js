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

  parseLogs(logData) {
    const logEntries = [];
    const lines = logData.split("\n");
    let currentEntry = null;
    let test = null;
    lines.forEach((line) => {
      if (line.startsWith("Timestamp:")) {
        if (currentEntry) {
          logEntries.push(currentEntry);
        }
        currentEntry = {
          timestamp: line.substring("Timestamp: ".length).trim() + "\n",
        };
      } else if (line.startsWith("Error:")) {
        if (currentEntry) {
          test = "e";
          currentEntry.error = line.substring("Error: ".length).trim() + "\n";
        }
      } else if (line.startsWith("Stack:")) {
        if (currentEntry) {
          test = "s";
          currentEntry.stack = line.substring("Stack: ".length).trim() + "\n";
        }
      } else if (test == "e" && currentEntry.error) {
        currentEntry.error += line.substring("Error: ".length).trim() + "\n";
      } else if (test == "s" && currentEntry.stack) {
        currentEntry.stack += line.substring("Error: ".length).trim() + "\n";
      }
    });

    if (currentEntry) {
      logEntries.push(currentEntry);
    }

    return logEntries;
  }

  async getLogs() {
    const logData = await this.readFile();
    return this.parseLogs(logData);
  }

  async getLogsByDate(date) {
    const data = await this.getLogs();
    const logs = data.filter((i) => i.timestamp.trim().split("T")[0] === date);
    return logs;
  }

  async clearLogs() {
    return this.clearFile();
  }
}

module.exports = new ErrorLoggerService();
