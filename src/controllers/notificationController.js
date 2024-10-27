const notificationService = require("../services/notificationService");

class NotificationController {
  // Get unread notifications for a user
  async getUnreadNotifications(req, res) {
    try {
      const notifications =
        await notificationService.getUnreadNotificationsCount(req.user.userId);
      res.status(200).json({ notifications });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  // Get unread P2P notifications count
  async getUnreadP2PNotificationsCount(req, res) {
    const userId = req.user.userId;
    try {
      const p2pCount = await notificationService.getUnreadP2PNotificationsCount(
        userId
      );
      res.status(200).json({ p2pCount });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch P2P unread notifications count" });
    }
  }

  // Get unread Group notifications count
  async getUnreadGroupNotificationsCount(req, res) {
    const userId = req.user.userId;
    try {
      const groupCount =
        await notificationService.getUnreadGroupNotificationsCount(userId);
      res.status(200).json({ groupCount });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch Group unread notifications count" });
    }
  }

  // Get detailed unread notifications for P2P messages
  async getUnreadP2PNotifications(req, res) {
    const userId = req.user.userId;
    try {
      const notifications = await notificationService.getUnreadP2PNotifications(
        userId
      );
      res.status(200).json(notifications);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch P2P unread notifications" });
    }
  }

  // Get detailed unread notifications for group messages
  async getUnreadGroupNotifications(req, res) {
    const userId = req.user.userId;
    try {
      const notifications =
        await notificationService.getUnreadGroupNotifications(userId);
      res.status(200).json(notifications);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch group unread notifications" });
    }
  }
}

module.exports = new NotificationController();
