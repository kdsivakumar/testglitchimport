const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

// Person-to-Person Message
router.post("/p2p", auth, chatController.sendP2PMessage);

// Get Messages
router.get("/p2p/:userId", auth, chatController.getP2PMessages);

// Send Group Message
router.post("/group/:groupId/message", auth, chatController.sendGroupMessage);

// Get Group Messages
router.get("/group/:groupId/messages", auth, chatController.getGroupMessages);

router.get("/groups/all", auth, chatController.getAllGroups);
// Get groups for a single member
router.get("/groups", auth, chatController.getGroupsByMember);

// Get groups that contain a specific set of members
router.post("/members", auth, chatController.getGroupsByMembers);

// Create Group Chat
router.post("/group", auth, chatController.createGroupChat);
// router.post("/group", auth, chatController.createGroupChat);
router.get("/group/:groupId", auth, chatController.getGroup);
router.put("/group/:groupId", auth, chatController.updateGroup);
router.delete("/group/:groupId", auth, chatController.deleteGroup);

// Route to mark a message as delivered
router.patch(
  "/messages/:messageId/delivered",
  auth,
  chatController.markMessageAsDelivered
);

// Route to mark a message as read
router.patch(
  "/messages/:messageId/read",
  auth,
  chatController.markMessageAsRead
);

module.exports = router;
