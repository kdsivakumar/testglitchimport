const AuthService = require("../services/authService");
const ErrorLoggerService = require("../services/errorLoggerService");

exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    await AuthService.register(username, password);
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const token = await AuthService.login(username, password);
    res.json({ token });
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(401).json({ error: err.message });
  }
};
