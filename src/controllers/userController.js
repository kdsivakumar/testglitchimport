const UserService = require("../services/userService");
const ErrorLoggerService = require("../services/loggerservice/errorLoggerService");
const AuthService = require("../services/authService");
const RoleEnum = require("../config/roleEnum");

exports.getUsers = async (req, res) => {
  try {
    const users = await UserService.getAllUsers(req.orgId);
    res.json(users);
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserService.findUserById(id, req.orgId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, role } = req.body;

  try {
    const user = await UserService.updateUserById(id, name, role, req.orgId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const { orgId } = req.query;
  try {
    if (!orgId && !req.orgId)
      return res.status(400).json({ message: "Organization ID is required" });
    const user = await UserService.deleteUserById(id, req.orgId || orgId);
    await UserService.deleteUserDetailsById(id, req.orgId || orgId);

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
    const { userId, details, username, password, role, orgId } = req.body;
    let userDetails;
    if (!orgId && !req.orgId)
      return res.status(400).json({ message: "Organization ID is required" });
    if (!userId) {
      const user = await AuthService.register(
        username,
        password,
        details.name,
        role,
        req.orgId || orgId
      );
      // req.params = { userId: user.id };
      // req.body.details = details;
      details.username = username;
      details.role = role;
      userDetails = await UserService.updateUserDetailsById(
        user.id,
        details,
        user.organizationId
      );
    } else {
      userDetails = await UserService.createUserDetails(
        userId,
        details,
        req.orgId || orgId
      );
    }
    res.status(201).json({ message: "User details created", userDetails });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get user details by user ID
exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { orgId } = req.query;
    const userDetails = await UserService.findUserDetailsById(
      userId,
      req.orgId || orgId,
      name
    );
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
    const { orgId, name } = req.query;
    const count = parseInt(req.query.count) || 10; // Default count 10
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;

    const { userDetails, totalCount } = await UserService.getAllUserDetails(
      req.orgId || orgId,
      skip,
      count,
      name
    ); // Assuming this function exists in your service
    const totalPages = Math.ceil(totalCount / count); // Calculate total pages
    res.json({
      userDetails,
      pagination: {
        page,
        totalPages,
        totalCount,
        count,
      },
    });
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};

exports.updateUserDetails = async (req, res) => {
  const { userId } = req.params; // Get userId from URL parameters
  const updates = req.body.details; // Get updates from request body
  const { orgId } = req.query;

  try {
    if (!orgId && !req.orgId)
      return res.status(400).json({ message: "Organization ID is required" });
    const updatedUserDetails = await UserService.updateUserDetailsById(
      userId,
      updates,
      req.orgId || orgId
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
  const { deleteUser, orgId } = req.query;

  try {
    if (!orgId && !req.orgId)
      return res.status(400).json({ message: "Organization ID is required" });
    if (deleteUser) {
      await UserService.deleteUserById(id);
    }
    const user = await UserService.deleteUserDetailsById(
      id,
      req.orgId || orgId
    );
    if (!user)
      return res.status(404).json({ message: "User Details not found" });
    await UserService.deleteUserById(id, req.orgId || orgId);

    res.json({ message: "User details deleted successfully" });
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(400).json({ error: err.message });
  }
};
