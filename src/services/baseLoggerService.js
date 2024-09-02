const fs = require("fs");
const path = require("path");

class BaseLoggerService {
  constructor(logFileName) {
    this.logFile = path.join(__dirname, `../logs/${logFileName}`);
  }

  async readFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(this.logFile, "utf8", (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });
  }

  async writeFile(data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(this.logFile, data, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async clearFile() {
    return this.writeFile("");
  }

  async appendFile(data) {
    return new Promise((resolve, reject) => {
      fs.appendFile(this.logFile, data, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
}

module.exports = BaseLoggerService;
