const Message = require("../models/Message");
const userService = require("./userService");
const chatService = require("./chatService");

class NotificationService {
  // Get total unread notifications count (P2P + Group)
  async getUnreadNotificationsCount(userId) {
    const p2pCount = await this.getUnreadP2PNotificationsCount(userId);
    const groupCount = await this.getUnreadGroupNotificationsCount(userId);

    return { p2pCount, groupCount, totalUnread: p2pCount + groupCount };
  }

  // Get unread P2P notifications count
  async getUnreadP2PNotificationsCount(userId) {
    return await Message.countDocuments({
      recipientId: userId,
      analytics: {
        $elemMatch: { userId: userId, readStatus: false },
      },
      groupId: { $exists: false }, // Ensure it's a P2P message by checking groupId doesn't exist
    });
  }

  // Get unread Group notifications count
  async getUnreadGroupNotificationsCount(userId, groupId, organizationId) {
    return await Message.countDocuments({
      groupId: groupId || { $exists: true }, // Ensure it's a group message
      analytics: {
        $elemMatch: { userId: userId, readStatus: false },
      },
      organizationId,
    });
  }

  // Get detailed unread notifications for P2P messages
  async getUnreadP2PNotifications(userId) {
    return await Message.find({
      recipientId: userId,
      analytics: {
        $elemMatch: { userId: userId, readStatus: false },
      },
      groupId: { $exists: false },
    })
      .populate("senderId", "username")
      .exec();
  }

  // Get detailed unread notifications for group messages
  async getUnreadGroupNotifications(userId) {
    return await Message.find({
      groupId: { $exists: true },
      analytics: {
        $elemMatch: { userId: userId, readStatus: false },
      },
    })
      .populate("senderId", "username")
      .populate("groupId", "groupName")
      .exec();
  }

  async getp2pchatunreadCount(id, userId) {
    return await Message.countDocuments({
      senderId: id,
      recipientId: userId,
      analytics: {
        $elemMatch: { userId: userId, readStatus: false },
      },
    });
  }

  async getp2pLastMessage(id, userId) {
    return await Message.findOne({
      $or: [
        { senderId: id, recipientId: userId },
        { senderId: userId, recipientId: id },
      ],
    }).sort({ timestamp: -1 }); // Sort by timestamp in descending order to get the latest message
  }

  async getp2pLastMesssageWithCount(id, userId) {
    // Count unread messages sent to the current user from this sender
    const unreadCount = await this.getp2pchatunreadCount(id, userId);

    // Get the last message for user
    const lastMessage = await this.getp2pLastMessage(id, userId);
    const user = await userService.findUserById(id);
    return {
      id: id,
      userId: id,
      name: user.name,
      unreadCount,
      lastMessage,
    };
  }
  async getAllUsersWithUnreadCounts(userId, organizationId) {
    // Get all users
    const users = await userService.getAllUsers(organizationId);
    const um = await chatService.markMessagesAsDeliveredAutoUpdate(
      userId,
      organizationId
    );
    console.log("getAllUsersWithUnreadCounts", um);
    // Map over each user to fetch their unread message count
    const usersWithUnreadCounts = await Promise.all(
      users.map(async (user) => {
        // Skip the current user themselves
        if (user._id.toString() === userId.toString()) return null;

        // Count unread messages sent to the current user from this sender
        const unreadCount = await this.getp2pchatunreadCount(user._id, userId);

        // Get the last message for user
        const lastMessage = await this.getp2pLastMessage(user._id, userId);
        return {
          id: user._id,
          userId: user._id,
          name: user.name,
          unreadCount,
          lastMessage,
        };
      })
    );

    // Filter out null values (which represent the current user)
    return usersWithUnreadCounts.filter((user) => user !== null);
  }

  async getUnreadGroupCountsAndLastMessageForUser(userId, orgId) {
    // Fetch all groups the user belongs to
    const groups = await chatService.findGroupsByMember(userId, orgId);
    //Group.find({ members: userId });

    // Map over each group to fetch unread count and last message
    const groupDetails = await Promise.all(
      groups.map(async (group) => {
        // Get unread message count for this group
        const unreadCount = await this.getUnreadGroupNotificationsCount(
          userId,
          group._id,
          orgId
        );

        // Get the last message in this group
        const lastMessage = await Message.findOne({ groupId: group._id }).sort({
          timestamp: -1,
        }); // Sort by timestamp in descending order
        //.select("message senderId timestamp"); // Select only necessary fields

        return {
          id: group._id,
          groupName: group.name,
          members: group.members,
          unreadCount,
          lastMessage,
        };
      })
    );

    return groupDetails;
  }

  async getGroupUnreadCountAndLastMsg(userId, group, orgId) {
    // Get unread message count for this group
    const unreadCount = await this.getUnreadGroupNotificationsCount(
      userId,
      group._id,
      orgId
    );

    // Get the last message in this group
    const lastMessage = await Message.findOne({ groupId: group._id }).sort({
      timestamp: -1,
    }); // Sort by timestamp in descending order
    //.select("message senderId timestamp"); // Select only necessary fields

    return {
      id: group._id,
      groupName: group.name,
      members: group.members,
      unreadCount,
      lastMessage,
    };
  }
}

module.exports = new NotificationService();
