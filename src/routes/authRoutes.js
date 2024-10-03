const express = require("express");
const {
  register,
  login,
  changePassword,
} = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", authMiddleware, register);
router.post("/login", login);
router.post("/change-password/:userId", authMiddleware, changePassword);

module.exports = router;
