const fs = require("fs");
const path = require("path");
const logFile = path.join(__dirname, "../logs/requests.log");

const logRequest = (req, res, next) => {
  const start = Date.now();
  const { method, url } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `Timestamp: ${new Date().toISOString()}\n${method} ${url} ${
      res.statusCode
    } ${duration}ms\n\n`;

    fs.appendFile(logFile, logMessage, (err) => {
      if (err) console.error("Error logging request:", err);
    });
  });

  next();
};

module.exports = logRequest;
