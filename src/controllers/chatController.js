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
      const user = await UserService.findUserById(
        recipientId,
        req.userDetails.organizationId
      );
      if (!user)
        return res.status(404).json({ message: "Recipient details not found" });
      const newMessage = await chatService.sendMessage(
        req.user.userId,
        recipientId,
        message,
        req.userDetails.organizationId
      );
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  }

  // async getP2PMessages(req, res) {
  //   const userId = req.user.userId;
  //   const otherUserId = req.params.userId;
  //   const count = parseInt(req.query.count) || 2; // Default count 10
  //   const page = parseInt(req.query.page) || 1;
  //   const skip = (page - 1) * count;

  //   try {
  //     const { messages, totalCount } = await chatService.getMessages(
  //       userId,
  //       otherUserId,
  //       req.userDetails.organizationId,
  //       skip,
  //       count
  //     );
  //     const totalPages = Math.ceil(totalCount / count); // Calculate total pages

  //     res.status(200).json({
  //       messages,
  //       pagination: {
  //         page,
  //         totalPages,
  //         totalCount,
  //         count,
  //       },
  //     });
  //   } catch (error) {
  //     console.log(error);

  //     res.status(500).json({ error: "Failed to fetch messages" });
  //   }
  // }

  async getP2PMessages(req, res) {
    const userId = req.user.userId;
    const otherUserId = req.params.userId;
    const count = parseInt(req.query.count) || 10;
    const { messageId, lastMessageId, message } = req.query; // ID of the last message from the previous page
    try {
      const messages = await chatService.getMessages(
        userId,
        otherUserId,
        req.userDetails.organizationId,
        count,
        lastMessageId,
        message,
        messageId
      );
      res.status(200).json(messages);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }

  async createGroupChat(req, res) {
    const { groupName, members, orgId } = req.body;
    try {
      if (!orgId && !req.orgId)
        return res.status(400).json({ message: "Organization ID is required" });

      if (!groupName || !members)
        return res
          .status(400)
          .send({ error: errorCodes.createGroupChat.MISSING_REQUIRED_FIELDS });
      const newGroup = await chatService.createGroup(
        groupName,
        members,
        req.orgId || orgId
      );
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
      const { orgId } = req.query;
      const group = await chatService.getGroupById(
        req.params.groupId,
        req.orgId || orgId
      );
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
    const { orgId } = req.query;
    try {
      const updatedGroup = await chatService.updateGroup(
        req.params.groupId,
        {
          name,
          members,
        },
        req.orgId || orgId
      );
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
    const { orgId } = req.query;
    try {
      await chatService.deleteGroup(req.params.groupId, req.orgId || orgId);
      res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      res.status(error.status || 500).json({
        code: error.code || errorCodes.SERVER_ERROR.code,
        message: error.message || errorCodes.SERVER_ERROR.message,
      });
    }
  }

  async getAllGroups(req, res) {
    const { orgId, name } = req.query;
    const count = parseInt(req.query.count) || 10; // Default count 10
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    try {
      const { groups, totalCount } = await chatService.getAllGroups(
        req.orgId || orgId,
        skip,
        count,
        name
      );
      const totalPages = Math.ceil(totalCount / count); // Calculate total pages
      res.status(200).json({
        groups,
        pagination: {
          page,
          totalPages,
          totalCount,
          count,
        },
      });
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
    const { orgId } = req.query;

    try {
      const groups = await chatService.findGroupsByMember(
        userId,
        req.orgId || orgId
      );
      res.status(200).json(groups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch groups by member" });
    }
  }

  // Get groups that contain a specific set of members
  async getGroupsByMembers(req, res) {
    const memberIds = req.body.memberIds; // Expect an array of member IDs in the request body
    const { orgId } = req.query;
    try {
      const groups = await chatService.findGroupsByMembers(
        memberIds,
        req.orgId || orgId
      );
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
        message,
        req.userDetails.organizationId
      );
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to send group message" });
    }
  }

  async getGroupMessages(req, res) {
    try {
      const messages = await chatService.getGroupMessages(
        req.user.userId,
        req.params.groupId,
        req.userDetails.organizationId
      );
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
        userId,
        req.userDetails.organizationId
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
        userId,
        req.userDetails.organizationId
      );
      res.status(200).json(updatedMessage);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  }
}

module.exports = new ChatController();
