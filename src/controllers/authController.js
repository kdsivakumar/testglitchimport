const AuthService = require("../services/authService");
const ErrorLoggerService = require("../services/loggerservice/errorLoggerService");

exports.register = async (req, res) => {
  const { username, password, name } = req.body;

  try {
    await AuthService.register(username, password, name);
    res.status(201).json({ message: "User created successfully!" });
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

exports.changePassword = async (req, res) => {
  const { newPassword, oldPassword } = req.body;
  const userId = req.params.userId || req.user.userId; // Use the ID from the params or the authenticated user ID

  try {
    if (req.user.role === "admin") {
      // Admin can change any user's password
      await AuthService.changePassword(userId, newPassword);
      return res.json({ message: "Password changed successfully." }); // Use return to prevent further execution
    } else {
      if (!oldPassword) {
        return res.status(400).json({ error: "Old password is required." }); // Return to stop execution
      }
      // Regular user must provide old password
      await AuthService.changePassword(userId, newPassword, oldPassword);
      return res.json({ message: "Password changed successfully." }); // Use return to prevent further execution
    }
  } catch (err) {
    ErrorLoggerService.logError(err);
    return res.status(401).json({ error: err.message }); // Use return to prevent further execution
  }
};
