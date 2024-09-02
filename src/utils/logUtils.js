const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "../logs");

const ensureLogsDirAndFiles = async () => {
  try {
    // Ensure the logs directory exists
    await fs.promises.mkdir(logsDir, { recursive: true });

    // Define paths for log files
    const errorLogFile = path.join(logsDir, "errors.log");
    const requestLogFile = path.join(logsDir, "requests.log");
    const gitLogFile = path.join(logsDir, "git.log");

    // Create empty log files if they do not exist
    await fs.promises.appendFile(errorLogFile, ""); // This will create the file if it doesn't exist
    await fs.promises.appendFile(requestLogFile, ""); // This will create the file if it doesn't exist
    await fs.promises.appendFile(gitLogFile, ""); // This will create the file if it doesn't exist

    console.log("Log directory and files are ready.");
  } catch (err) {
    console.error("Error ensuring log directory and files:", err);
  }
};

module.exports = ensureLogsDirAndFiles;
