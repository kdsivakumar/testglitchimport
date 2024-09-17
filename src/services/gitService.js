const { exec } = require("child_process");
const util = require("util");
const BaseLoggerService = require("./loggerservice/baseLoggerService");

const execPromise = util.promisify(exec);

class GitService extends BaseLoggerService {
  constructor() {
    super("git.log");
  }

  async logPayload(payload) {
    const Message = `Timestamp: ${new Date().toISOString()}\npayload: ${payload}\n\n`;
    try {
      await this.appendFile(Message);
    } catch (error) {
      console.error("Error logging to file:", error);
    }
  }
  async changeDirectory() {
    try {
      const { stdout, stderr } = await execPromise("cd testglitchimport");
      if (stderr) throw new Error(`Fetch error: ${stderr}`);
      console.log(stdout);

      return stdout;
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  async fetch() {
    try {
      const { stdout, stderr } = await execPromise(
        "cd testglitchimport && git fetch"
      );
      if (stderr) throw new Error(`Fetch error: ${stderr}`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  async getCurrentBranch() {
    try {
      const { stdout, stderr } = await execPromise(
        "cd testglitchimport && git symbolic-ref --short HEAD"
      );
      if (stderr) throw new Error(`Branch check error: ${stderr}`);
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  async pull() {
    try {
      const { stdout, stderr } = await execPromise(
        "cd testglitchimport && git pull origin master"
      );
      if (stderr) throw new Error(`Pull error: ${stderr}`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to pull: ${error.message}`);
    }
  }

  async refresh() {
    try {
      const { stdout, stderr } = await execPromise("refresh");
      if (stderr) throw new Error(`refresh error: ${stderr}`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to refresh: ${error.message}`);
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
      } else if (line.startsWith("payload:")) {
        if (currentEntry) {
          test = "p";
          currentEntry.payload =
            line.substring("payload: ".length).trim() + "\n";
        }
      } else if (test == "p" && currentEntry.error) {
        currentEntry.payload +=
          line.substring("payload: ".length).trim() + "\n";
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

module.exports = new GitService();
