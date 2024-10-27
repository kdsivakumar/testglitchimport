const chatService = require("../services/chatService");
const UserService = require("../services/userService");
const errorCodes = require("../utils/errorCodes");

class ChatController {
  async sendP2PMessage(req, res) {
    const { recipientId, message } = req.body;
    try {
      if (!recipientId || !message)
        return res
          .status(400)
          .send({ error: errorCodes.MISSING_REQUIRED_FIELDS });
      const user = await UserService.findUserById(recipientId);
      if (!user)
        return res.status(404).json({ message: "Recipient details not found" });
      const newMessage = await chatService.sendMessage(
        req.user.userId,
        recipientId,
        message
      );
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  }

  async getP2PMessages(req, res) {
    const userId = req.user.userId;
    const otherUserId = req.params.userId;
    try {
      const messages = await chatService.getMessages(userId, otherUserId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }

  async createGroupChat(req, res) {
    const { groupName, members } = req.body;
    try {
      if (!groupName || !members)
        return res
          .status(400)
          .send({ error: errorCodes.createGroupChat.MISSING_REQUIRED_FIELDS });
      const newGroup = await chatService.createGroup(groupName, members);
      res
        .status(201)
        .json({ message: "Group chat created successfully", group: newGroup });
    } catch (error) {
      res.status(error.status || 500).json({
        code: error.code || errorCodes.SERVER_ERROR.code,
        message: error.message || errorCodes.SERVER_ERROR.message,
      });
    }
  }

  async getGroup(req, res) {
    try {
      const group = await chatService.getGroupById(req.params.groupId);
      res.status(200).json(group);
    } catch (error) {
      console.log(error);

      res.status(error.status || 500).json({
        code: error.code || errorCodes.SERVER_ERROR.code,
        message: error.message || errorCodes.SERVER_ERROR.message,
      });
    }
  }

  async updateGroup(req, res) {
    const { name, members } = req.body;
    try {
      const updatedGroup = await chatService.updateGroup(req.params.groupId, {
        name,
        members,
      });
      res
        .status(200)
        .json({ message: "Group updated successfully", group: updatedGroup });
    } catch (error) {
      res.status(error.status || 500).json({
        code: error.code || errorCodes.SERVER_ERROR.code,
        message: error.message || errorCodes.SERVER_ERROR.message,
      });
    }
  }

  async deleteGroup(req, res) {
    try {
      await chatService.deleteGroup(req.params.groupId);
      res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      res.status(error.status || 500).json({
        code: error.code || errorCodes.SERVER_ERROR.code,
        message: error.message || errorCodes.SERVER_ERROR.message,
      });
    }
  }

  async getAllGroups(req, res) {
    try {
      const groups = await chatService.getAllGroups();
      res.status(200).json(groups);
    } catch (error) {
      res.status(error.status || 500).json({
        code: error.code || "SERVER_ERROR",
        message: error.message || "Failed to retrieve groups",
      });
    }
  }

  // Get groups for a single user
  async getGroupsByMember(req, res) {
    const userId = req.user.userId;
    try {
      const groups = await chatService.findGroupsByMember(userId);
      res.status(200).json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups by member" });
    }
  }

  // Get groups that contain a specific set of members
  async getGroupsByMembers(req, res) {
    const memberIds = req.body.memberIds; // Expect an array of member IDs in the request body
    try {
      const groups = await chatService.findGroupsByMembers(memberIds);
      res.status(200).json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups by members" });
    }
  }

  async sendGroupMessage(req, res) {
    const { message } = req.body;
    try {
      // Validate message content
      if (!message || message.trim() === "") {
        return res.status(400).json({
          code: "INVALID_MESSAGE",
          message: "Message content is required.",
        });
      }
      const newMessage = await chatService.sendGroupMessage(
        req.user.userId,
        req.params.groupId,
        message
      );
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to send group message" });
    }
  }

  async getGroupMessages(req, res) {
    try {
      const messages = await chatService.getGroupMessages(req.params.groupId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch group messages" });
    }
  }

  // Mark a message as delivered
  async markMessageAsDelivered(req, res) {
    const messageId = req.params.messageId;
    const userId = req.user.userId;

    try {
      const updatedMessage = await chatService.markMessageAsDelivered(
        messageId,
        userId
      );
      res.status(200).json(updatedMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as delivered" });
    }
  }

  // Mark a message as read
  async markMessageAsRead(req, res) {
    const messageId = req.params.messageId;
    const userId = req.user.userId;

    try {
      const updatedMessage = await chatService.markMessageAsRead(
        messageId,
        userId
      );
      res.status(200).json(updatedMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  }
}

module.exports = new ChatController();
