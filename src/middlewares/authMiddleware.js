const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const ErrorLoggerService = require("../services/loggerservice/errorLoggerService");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(401).json({ message: "Invalid token" });
  }
};
