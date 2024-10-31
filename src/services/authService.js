const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const UserService = require("./userService");

class AuthService {
  async register(username, password, name) {
    const existingUser = await UserService.findUserByUsername(username);
    if (existingUser) throw new Error("User already exists");

    return UserService.createUser(username, password, name);
  }

  async login(username, password) {
    const user = await UserService.findUserByUsername(username);
    if (!user || !(await user.comparePassword(password))) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.username === "admin" ? "admin" : "customer",
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    return token;
  }

  async changePassword(userId, newPassword, oldPassword) {
    const user = await UserService.findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (oldPassword) {
      // For regular users, validate old password
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        return res.status(401).json({ error: "Old password is incorrect." });
      }
    }
    // Set the new password; this will trigger pre-save middleware
    user.password = newPassword;
    await user.save();
  }
  async ensureRootUser() {
    const rootUsername = "admin"; // Define root username
    const rootPassword = "admin@Password"; // Define root password

    const existingUser = await UserService.findUserByUsername(rootUsername);
    if (!existingUser) {
      // Create root user if it doesn't exist
      await UserService.createUser(rootUsername, rootPassword);
      console.log(`Root user created with username: ${rootUsername}`);
    } else {
      console.log(`Root user already exists with username: ${rootUsername}`);
    }
  }
}

module.exports = new AuthService();
