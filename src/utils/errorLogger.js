const fs = require("fs");
const path = require("path");
const logFile = path.join(__dirname, "../logs/errors.log");

const logError = (err) => {
  const errorMessage = `Timestamp: ${new Date().toISOString()}\nError: ${
    err.message
  }\nStack: ${err.stack}\n\n`;

  fs.appendFile(logFile, errorMessage, (error) => {
    if (error) console.error("Error logging to file:", error);
  });
};

module.exports = logError;
