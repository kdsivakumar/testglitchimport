const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const ErrorLoggerService = require("../services/loggerservice/errorLoggerService");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.replace("Bearer ", "");
  const admin_routs = [
    "/refresh",
    "/logs/clear",
    "/logs/requests/clear",
    "/logs/errors/clear",
    "/logs/git/clear",
  ];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log();

    if (
      (admin_routs.includes(req.path) && decoded.role !== "admin") ||
      (req.method === "DELETE" && decoded.role !== "admin")
    ) {
      return res
        .status(400)
        .json({ message: "Only admin can access this route" });
    }

    next();
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(401).json({ message: "Invalid token" });
  }
};
