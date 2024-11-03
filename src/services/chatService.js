const Message = require("../models/Message");
const Group = require("../models/Group");
const userService = require("../services/userService");
const errorCodes = require("../utils/errorCodes");

class ChatService {
  async sendMessage(senderId, recipientId, message) {
    // Initialize analytics for the recipient with default values
    const analytics = [
      {
        userId: recipientId,
        readStatus: false,
        readAt: null,
        deliveredStatus: false,
        deliveredAt: null,
      },
    ];

    // Create the message with analytics
    const newMessage = new Message({
      senderId,
      recipientId,
      message,
      analytics,
    });
    // Save the new message
    await newMessage.save();

    // Populate the 'name' fields for both sender and recipient
    return await Message.findById(newMessage._id)
      .populate("senderId", "name") // Populate only the 'name' field of sender
      .populate("recipientId", "name");
  }

  async getMessages(userId, otherUserId) {
    return await Message.find({
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
    })
      .populate("senderId", "name") // Only populate the 'name' field of sender
      .populate("recipientId", "name") // Only populate the 'name' field of recipient
      .exec();
  }

  async doesGroupExist(groupName) {
    return await Group.findOne({ name: groupName });
  }

  async validateMemberIds(memberIds) {
    const results = await Promise.all(
      memberIds.map(async (id) => !!(await userService.findUserById(id)))
    );
    return results.every((result) => result);
  }

  async createGroup(groupName, members) {
    if (await this.doesGroupExist(groupName)) {
      const error = new Error(errorCodes.GROUP_ALREADY_EXISTS.message);
      error.code = errorCodes.GROUP_ALREADY_EXISTS.code;
      error.status = errorCodes.GROUP_ALREADY_EXISTS.status;
      throw error;
    }

    if (!(await this.validateMemberIds(members))) {
      const error = new Error(errorCodes.INVALID_MEMBER_IDS.message);
      error.code = errorCodes.INVALID_MEMBER_IDS.code;
      error.status = errorCodes.INVALID_MEMBER_IDS.status;
      throw error;
    }

    const newGroup = new Group({ name: groupName, members });
    return await newGroup.save();
  }

  async getGroupById(groupId) {
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }
    return group;
  }

  async updateGroup(groupId, updates) {
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }

    if (updates.name && (await this.doesGroupExist(updates.name))) {
      const error = new Error(errorCodes.GROUP_ALREADY_EXISTS.message);
      error.code = errorCodes.GROUP_ALREADY_EXISTS.code;
      error.status = errorCodes.GROUP_ALREADY_EXISTS.status;
      throw error;
    }

    if (updates.members && !(await this.validateMemberIds(updates.members))) {
      const error = new Error(errorCodes.INVALID_MEMBER_IDS.message);
      error.code = errorCodes.INVALID_MEMBER_IDS.code;
      error.status = errorCodes.INVALID_MEMBER_IDS.status;
      throw error;
    }

    if (updates.name) group.name = updates.name;
    if (updates.members) group.members = updates.members;

    return await group.save();
  }

  async deleteGroup(groupId) {
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }
    return group;
  }

  async getAllGroups() {
    return await Group.find().populate("members", "username");
  }

  // Find groups by a single member's ID
  async findGroupsByMember(userId) {
    return await Group.find({ members: userId }).populate(
      "members",
      "username"
    );
  }

  // Find groups containing a specific set of members
  async findGroupsByMembers(memberIds) {
    return await Group.find({ members: { $all: memberIds } }).populate(
      "members",
      "username"
    );
  }

  async sendGroupMessage(senderId, groupId, message) {
    // Find the group and check if the user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }

    // Check if senderId is part of the group's members
    if (!group.members.includes(senderId)) {
      const error = new Error("User is not a member of this group.");
      error.code = "USER_NOT_IN_GROUP";
      error.status = 403;
      throw error;
    }

    // Initialize analytics for each group member, excluding the sender
    const analytics = group.members
      .filter((memberId) => memberId.toString() !== senderId.toString())
      .map((memberId) => ({
        userId: memberId,
        readStatus: false,
        readAt: null,
        deliveredStatus: false,
        deliveredAt: null,
      }));

    // Create the message with groupId, senderId, message, and analytics
    const newMessage = new Message({ senderId, groupId, message, analytics });
    return await newMessage.save();
  }

  async getGroupMessages(groupId) {
    return await Message.find({ groupId }).populate("senderId", "name");
  }

  // Mark a message as delivered
  async markMessageAsDelivered(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    // Find or add analytics entry for this user
    const userAnalytics = message.analytics.find((analytics) =>
      analytics.userId.equals(userId)
    );

    if (userAnalytics) {
      userAnalytics.deliveredStatus = true;
      userAnalytics.deliveredAt = new Date();
    } else {
      message.analytics.push({
        userId: userId,
        deliveredStatus: true,
        deliveredAt: new Date(),
        readStatus: false,
        readAt: null,
      });
    }

    await message.save();
    return message;
  }

  // Mark a message as read
  async markMessageAsRead(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    // Find analytics entry for this user
    const userAnalytics = message.analytics.find((analytics) =>
      analytics.userId.equals(userId)
    );

    if (userAnalytics) {
      userAnalytics.readStatus = true;
      userAnalytics.readAt = new Date();
    } else {
      message.analytics.push({
        userId: userId,
        readStatus: true,
        readAt: new Date(),
        deliveredStatus: false,
        deliveredAt: null,
      });
    }

    await message.save();
    return message;
  }

  // src/services/chatService.js

  async markMessagesAsReadAutoUpdate(messageId, userId) {
    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");

    // Determine if this is a group message or P2P message
    const isGroupMessage = Boolean(message.groupId);
    let messagesToUpdate = [];

    if (isGroupMessage) {
      // For group messages, find all unread messages in the group up to the current messageId
      messagesToUpdate = await Message.find({
        groupId: message.groupId,
        analytics: {
          $elemMatch: { userId: userId, readStatus: false },
        },
        _id: { $lte: messageId }, // Only messages up to this ID
      });
    } else {
      // For P2P messages, find all unread messages in the conversation up to the current messageId
      messagesToUpdate = await Message.find({
        $or: [
          { senderId: message.senderId, recipientId: message.recipientId },
          { senderId: message.recipientId, recipientId: message.senderId },
        ],
        analytics: {
          $elemMatch: { userId: userId, readStatus: false },
        },
        _id: { $lte: messageId },
      });
    }

    // Update each message's read status
    for (let msg of messagesToUpdate) {
      const userAnalytics = msg.analytics.find((analytics) =>
        analytics.userId.equals(userId)
      );

      if (userAnalytics) {
        userAnalytics.readStatus = true;
        userAnalytics.readAt = new Date();
      } else {
        msg.analytics.push({
          userId: userId,
          readStatus: true,
          readAt: new Date(),
          deliveredStatus: false,
          deliveredAt: null,
        });
      }

      await msg.save();
    }

    return messagesToUpdate; // Return the list of updated messages if needed
  }

  // You can add more service methods as needed
}

module.exports = new ChatService();
