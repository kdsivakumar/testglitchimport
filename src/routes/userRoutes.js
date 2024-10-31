const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUserDetails,
  getUserDetails,
  getAllUserDetails,
  deleteUserDetails,
  updateUserDetails,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getUsers);
router.get("/:id", authMiddleware, getUserById);
router.put("/:id", authMiddleware, updateUser);
router.delete("/:id", authMiddleware, deleteUser);
router.post("/details", authMiddleware, createUserDetails);
router.get("/:userId/details", authMiddleware, getUserDetails);
router.get("/details/all", authMiddleware, getAllUserDetails);
router.put("/:userId/details", authMiddleware, updateUserDetails);
router.delete("/:id/delete", authMiddleware, deleteUserDetails);

module.exports = router;
