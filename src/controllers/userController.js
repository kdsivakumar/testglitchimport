const UserService = require("../services/userService");
const ErrorLoggerService = require("../services/loggerservice/errorLoggerService");

exports.getUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserService.findUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const user = await UserService.updateUserById(id, name);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserService.deleteUserById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};
// Create user details
exports.createUserDetails = async (req, res) => {
  try {
    const { userId, details } = req.body;
    const userDetails = await UserService.createUserDetails(userId, details);
    res.status(201).json({ message: "User details created", userDetails });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user details by user ID
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userDetails = await UserService.findUserDetailsById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: "User details not found" });
    }
    res.status(200).json(userDetails);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllUserDetails = async (req, res) => {
  try {
    const userDetails = await UserService.getAllUserDetails(); // Assuming this function exists in your service
    res.json(userDetails);
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.updateUserDetails = async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameters
  const updates = req.body.details; // Get updates from request body

  try {
    const updatedUserDetails = await UserService.updateUserDetailsById(
      userId,
      updates
    );
    if (!updatedUserDetails) {
      return res.status(404).json({ message: "User details not found" });
    }
    res
      .status(200)
      .json({ message: "User details updated", updatedUserDetails });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUserDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserService.deleteUserDetailsById(id);
    if (!user)
      return res.status(404).json({ message: "User Details not found" });
    res.json({ message: "User details deleted successfully" });
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};
