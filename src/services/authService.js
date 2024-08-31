const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../config/config");
const UserService = require("./userService");

class AuthService {
  async register(username, password) {
    const existingUser = await UserService.findUserByUsername(username);
    if (existingUser) throw new Error("User already exists");

    return UserService.createUser(username, password);
  }

  async login(username, password) {
    const user = await UserService.findUserByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    return token;
  }
}

module.exports = new AuthService();
