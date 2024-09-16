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
    const logData = await this.readFile();
    const routeCounts = {};
    const logEntries = logData.split("\n\n"); // Assuming log entries are separated by two newlines
    //logEntries = JSON.parse(logEntries);

    logEntries.forEach((entry) => {
      if (!entry || typeof entry !== "string") {
        console.error("Invalid entry detected:", entry);
        return; // Skip invalid entries
      } else {
        const lines = entry.split("\n");
        if (lines.length < 2) return; // Skip if the entry doesn't have enough lines

        const routeLine = lines[1]; // Route information is on the second line
        const routeMatch = routeLine.match(/GET\s+(\/\S+)/); // Extract the route path

        if (routeMatch) {
          const route = routeMatch[1];
          if (!routeCounts[route]) {
            routeCounts[route] = 0;
          }
          routeCounts[route]++;
        }
      }
    });
    routeCounts["TotalCount"] = Object.values(routeCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    // Convert route counts and log entries to JSON format
    const result = {
      routeCounts,
      logs: logEntries.map((entry) => {
        if (!entry || typeof entry !== "string") {
          console.error("Invalid entry detected:", entry);
          return; // Skip invalid entries
        }
        const lines = entry.split("\n");
        return {
          timestamp: lines[0].replace("Timestamp: ", ""),
          method: lines[1].split(" ")[0],
          route: lines[1].split(" ")[1],
          statusCode: lines[1].split(" ")[2],
          responseTime: lines[1].split(" ")[3],
        };
      }),
    };

    return result;

    // return await this.readFile();
  }

  async getLogsByDate(date) {
    let data = await this.getLogs();
    let logs = {};
    if (data.logs) {
      logs = data.logs.filter((i) => {
        if (i && i.timestamp) {
          return i.timestamp.trim().split("T")[0] === date;
        }
      });
    }
    return logs;
  }

  async clearLogs() {
    return this.clearFile();
  }
}

module.exports = new RequestLoggerService();
