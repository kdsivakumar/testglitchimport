const { exec } = require("child_process");
const util = require("util");
const BaseLoggerService = require("./baseLoggerService");

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
      return stdout;
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  async fetch() {
    try {
      const { stdout, stderr } = await execPromise("git fetch");
      if (stderr) throw new Error(`Fetch error: ${stderr}`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }

  async getCurrentBranch() {
    try {
      const { stdout, stderr } = await execPromise(
        "git symbolic-ref --short HEAD"
      );
      if (stderr) throw new Error(`Branch check error: ${stderr}`);
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }

  async pull() {
    try {
      const { stdout, stderr } = await execPromise("git pull origin master");
      if (stderr) throw new Error(`Pull error: ${stderr}`);
      return stdout;
    } catch (error) {
      throw new Error(`Failed to pull: ${error.message}`);
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

module.exports = new GitService();
