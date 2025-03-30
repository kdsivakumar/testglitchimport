const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const UserService = require("./userService");
const RoleEnum = require("../config/roleEnum");

class AuthService {
  async register(username, password, name, role, orgId) {
    if (!role || (RoleEnum.ADMIN !== role && RoleEnum.USER !== role)) {
      throw new Error("Invalid role");
    }
    const organizationService = require("./organizationService");
    const org = await organizationService.getOrganizationById(orgId);
    const existingUser = await UserService.findUserByUsername(username, org.id);
    if (existingUser) throw new Error("User already exists");

    return UserService.createUser(username, password, name, role, orgId);
  }

  async login(username, password, domain) {
    const organizationService = require("./organizationService");

    const org = await organizationService.getOrganization({ domain });
    if ((!org, !org.domain)) throw new Error("Organization not found");

    const user = await UserService.findUserByUsername(username, org.id);
    if (!user || !(await user.comparePassword(password))) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      {
        userId: user._id,
        //role: user.username === "admin" ? "admin" : "customer",
      },
      JWT_SECRET,
      {
        expiresIn: "2h",
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
  async ensureRootUser(org) {
    const rootUsername = "admin"; // Define root username
    const rootPassword = "admin@Password"; // Define root password
    const existingUser = await UserService.findUserByUsername(
      rootUsername,
      org.id
    );

    if (!existingUser) {
      // Create root user if it doesn't exist
      await UserService.createUser(
        rootUsername,
        rootPassword,
        rootUsername,
        RoleEnum.SUPER_ADMIN,
        org.id
      );
      console.log(`Root user created with username: ${rootUsername}`);
    } else {
      console.log(`Root user already exists with username: ${rootUsername}`);
    }
  }
}

module.exports = new AuthService();
