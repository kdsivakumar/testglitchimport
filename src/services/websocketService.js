// src/services/websocketService.js
const { Server } = require("socket.io");
const chatService = require("./chatService");
const notificationService = require("./notificationService");
const { JWT_SECRET } = require("../config/config");
const jwt = require("jsonwebtoken");

class WebSocketService {
  constructor(server) {
    this.sessionStore = {};
    this.io = new Server(server, { cors: { origin: "*" } });
    this.initialize();
  }

  addSession(userId, socketId) {
    if (!this.sessionStore[userId]) {
      this.sessionStore[userId] = new Set();
    }
    this.sessionStore[userId].add(socketId);
  }

  removeSession(userId, socketId) {
    if (this.sessionStore[userId]) {
      this.sessionStore[userId].delete(socketId);
      if (this.sessionStore[userId].size === 0) {
        delete this.sessionStore[userId];
      }
    }
  }

  getSessions(userId) {
    return this.sessionStore[userId] ? [...this.sessionStore[userId]] : [];
  }

  initialize() {
    // Middleware to authenticate socket connection
    this.io.use((socket, next) => {
      const token = socket.handshake.query.token;
      //socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      // Verify JWT token
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error("Authentication error"));
        }
        // Save the decoded user information in the socket
        socket.user = decoded;
        next();
      });
    });

    this.io.on("connection", async (socket) => {
      console.log("Client connected:", socket.id);
      // socket.on("joinUser", async ({ userId }) => {
      const userId = socket.user.userId;
      try {
        socket.userId = userId;
        this.addSession(userId, socket.id);
        console.log(`User ${userId} connected with session ${socket.id}`);

        // Send unread notifications count for P2P and groups on connection
        const unreadP2PCount =
          await notificationService.getUnreadP2PNotificationsCount(userId);
        socket.emit("unreadP2PNotifications", { count: unreadP2PCount });

        const unreadGroupCounts =
          await notificationService.getUnreadGroupNotificationsCount(userId);
        socket.emit("unreadGroupNotifications", { count: unreadGroupCounts });

        //send unreadnotifications p2p chat wise
        const usersWithUnreadCounts =
          await notificationService.getAllUsersWithUnreadCounts(userId);
        socket.emit("usersWithUnreadCounts", usersWithUnreadCounts);
        //each particular group  unread count and last message
        const groupDetails =
          await notificationService.getUnreadGroupCountsAndLastMessageForUser(
            userId
          );
        socket.emit("groupsDetails", groupDetails);
      } catch (error) {
        console.error("Error on joinUser:", error);
      }
      // });

      socket.on("clickonP2P", async ({ otherUserId }) => {
        try {
          const chatlist = await chatService.getMessages(
            socket.userId,
            otherUserId
          );
          socket.emit("p2pchat", chatlist);
        } catch (error) {
          console.error("Error on clickonP2P:", error);
        }
      });

      socket.on("clickonGroup", async ({ groupId }) => {
        try {
          const chatlist = await chatService.getGroupMessages(groupId);
          socket.emit("groupchat", chatlist);
        } catch (error) {
          console.error("Error on clickonGroup:", error);
        }
      });

      socket.on("sendMessage", async ({ recipientId, message }) => {
        try {
          const senderId = socket.userId;
          const newMessage = await chatService.sendMessage(
            senderId,
            recipientId,
            message
          );

          //self message
          this.sendSessionMessages(senderId, "newP2PMessage", newMessage);

          //other user message
          this.sendSessionMessages(recipientId, "newP2PMessage", newMessage);
          const selfchatnotification =
            await notificationService.getp2pLastMesssageWithCount(
              recipientId,
              senderId
            );
          const chatnotification =
            await notificationService.getp2pLastMesssageWithCount(
              senderId,
              recipientId
            );
          this.sendSessionMessages(
            recipientId,
            "newP2PNotification",
            chatnotification
          );
          this.sendSessionMessages(
            senderId,
            "newP2PNotification",
            selfchatnotification
          );
          this.sendunreadP2PCount(recipientId);
        } catch (error) {
          console.error("Error on sendMessage:", error);
        }
      });

      socket.on("sendGroupMessage", async ({ groupId, message }) => {
        try {
          const senderId = socket.userId;
          //console.log("senderId", senderId);

          const newMessage = await chatService.sendGroupMessage(
            senderId,
            groupId,
            message
          );
          //console.log(newMessage);

          const groupMembers = (await chatService.getGroupById(groupId))
            .members;
          //console.log("groupMembers", groupMembers);

          groupMembers.forEach((memberId) => {
            this.sendSessionMessages(memberId, "newGroupMessage", newMessage);
            if (memberId.toString() !== senderId.toString()) {
              this.sendunreadGroupCount(memberId);
            }
          });
        } catch (error) {
          console.error("Error on sendGroupMessage:", error);
        }
      });

      socket.on("markMessageAsRead", async ({ messageId }) => {
        try {
          const userId = socket.userId;
          const message = await chatService.markMessageAsRead(
            messageId,
            userId
          );

          if (message && message.senderId) {
            this.sendSessionMessages(message.senderId, "messageRead", {
              messageId,
              userId,
            });
          }
        } catch (error) {
          console.error("Error on markMessageAsRead:", error);
        }
      });

      socket.on("markMessagesAsRead", async ({ messageId }) => {
        try {
          const userId = socket.userId;
          const message = await chatService.markMessagesAsReadAutoUpdate(
            messageId,
            userId
          );
          console.log(message);

          if (message && message.senderId) {
            this.sendSessionMessages(message.senderId, "messagesRead", {
              messageId,
              userId,
            });
          }
        } catch (error) {
          console.error("Error on markMessagesAsRead:", error);
        }
      });

      socket.on("disconnect", () => {
        this.removeSession(socket.userId, socket.id);
        console.log(
          `User ${socket.userId} disconnected from session ${socket.id}`
        );
      });
    });
  }

  sendSessionMessages(senderId, topic, message) {
    this.getSessions(senderId).forEach((sessionId) => {
      this.io.to(sessionId).emit(topic, message);
    });
  }

  async sendunreadP2PCount(userId) {
    const unreadP2PCount =
      await notificationService.getUnreadP2PNotificationsCount(userId);
    this.sendSessionMessages(userId, "unreadP2PNotifications", {
      count: unreadP2PCount,
    });
  }

  async sendunreadGroupCount(userId) {
    const unreadGroupCounts =
      await notificationService.getUnreadGroupNotificationsCount(userId);
    this.sendSessionMessages(userId, "unreadGroupNotifications", {
      count: unreadGroupCounts,
    });
  }
}

module.exports = WebSocketService;
