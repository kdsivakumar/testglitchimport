const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const auth = require("../middlewares/authMiddleware");

// Route to get unread notifications for the authenticated user
router.get("/chat/unread", auth, notificationController.getUnreadNotifications);

// Get unread P2P notifications count
router.get(
  "/chat/unread/p2p/count",
  auth,
  notificationController.getUnreadP2PNotificationsCount
);

// Get unread Group notifications count
router.get(
  "/chat/unread/group/count",
  auth,
  notificationController.getUnreadGroupNotificationsCount
);

// Get detailed unread notifications for P2P messages
router.get(
  "/chat/unread/p2p",
  auth,
  notificationController.getUnreadP2PNotifications
);

// Get detailed unread notifications for group messages
router.get(
  "/chat/unread/group",
  auth,
  notificationController.getUnreadGroupNotifications
);

module.exports = router;
