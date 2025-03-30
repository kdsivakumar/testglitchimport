const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/config");
const ErrorLoggerService = require("../services/loggerservice/errorLoggerService");
const userService = require("../services/userService");
const RoleEnum = require("../config/roleEnum");

module.exports = async (req, res, next) => {
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
    if (decoded.userId) {
      const userDetails = await userService.findUserById(decoded.userId);
      req.userDetails = userDetails;
      if (
        userDetails.status === userService.StatusEnum.INACTIVE ||
        !userDetails
      ) {
        return res
          .status(410)
          .json({ message: "Profile is in inactive state" });
      }
    }

    if (
      req.baseUrl == "/organizations" &&
      req.userDetails.role !== RoleEnum.SUPER_ADMIN
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (
      (admin_routs.includes(req.path) &&
        (req.userDetails.role !== RoleEnum.ADMIN ||
          req.userDetails.role !== RoleEnum.SUPER_ADMIN)) ||
      ((req.method === "DELETE" || req.method === "PUT") &&
        req.userDetails.role !== RoleEnum.ADMIN &&
        req.userDetails.role !== RoleEnum.SUPER_ADMIN)
    ) {
      return res
        .status(400)
        .json({ message: "Only admin can access this route" });
    }
    const userPaths = ["/:id/delete", "/:userId/details", "/:id"];

    const orgId =
      req.userDetails.role === RoleEnum.SUPER_ADMIN
        ? null
        : req.userDetails.organizationId;
    req.orgId = orgId;
    if (
      (req.method === "DELETE" || req.method === "PUT") &&
      req.baseUrl === "/users" &&
      userPaths.includes(req.route.path)
    ) {
      const user = await userService.findUserById(
        req.params.id || req.params.userId,
        req.orgId
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (
        user.username === "rootUser" ||
        (user.username === "admin" &&
          user.role === RoleEnum.SUPER_ADMIN &&
          req.method !== "PUT")
      ) {
        return res
          .status(400)
          .json({ message: "Cannot Edit or delete root user" });
      }
    }

    next();
  } catch (err) {
    ErrorLoggerService.logError(err);
    res.status(401).json({ message: "Invalid token" });
  }
};
