const Message = require("../models/Message");

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
  async getUnreadGroupNotificationsCount(userId) {
    console.log(userId);

    return await Message.countDocuments({
      groupId: { $exists: true }, // Ensure it's a group message
      analytics: {
        $elemMatch: { userId: userId, readStatus: false },
      },
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
}

module.exports = new NotificationService();
