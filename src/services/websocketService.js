// // src/services/websocketService.js
// const { Server } = require("socket.io");
// const chatService = require("./chatService");
// const notificationService = require("./notificationService");
// const { JWT_SECRET } = require("../config/config");
// const jwt = require("jsonwebtoken");

// class WebSocketService {
//   constructor(server) {
//     this.sessionStore = {};
//     this.io = new Server(server, { cors: { origin: "*" } });
//     this.initialize();
//   }

//   addSession(userId, socketId) {
//     if (!this.sessionStore[userId]) {
//       this.sessionStore[userId] = new Set();
//     }
//     this.sessionStore[userId].add(socketId);
//   }

//   removeSession(userId, socketId) {
//     if (this.sessionStore[userId]) {
//       this.sessionStore[userId].delete(socketId);
//       if (this.sessionStore[userId].size === 0) {
//         delete this.sessionStore[userId];
//       }
//     }
//   }

//   getSessions(userId) {
//     return this.sessionStore[userId] ? [...this.sessionStore[userId]] : [];
//   }

//   getsessionStore() {
//     return this.sessionStore;
//   }

//   initialize() {
//     // Middleware to authenticate socket connection
//     this.io.use((socket, next) => {
//       const token = socket.handshake.query.token;
//       //socket.handshake.auth.token;

//       if (!token) {
//         const err = new Error("Authentication error");
//         err.data = { content: "Please check the token" }; // additional details
//         return next(err);
//       }

//       // Verify JWT token
//       jwt.verify(token, JWT_SECRET, async (err, decoded) => {
//         if (err) {
//           const err = new Error("Authentication error");
//           err.data = { content: "Please pass valid token" }; // additional details
//           return next(err);
//         }
//         // Save the decoded user information in the socket
//         socket.user = decoded;
//         if (decoded.userId) {
//           const userService = require("./userService");

//           const userDetails = await userService.findUserById(decoded.userId);
//           socket.userDetails = userDetails;
//           if (
//             userDetails.status === userService.StatusEnum.INACTIVE ||
//             !userDetails
//           ) {
//             return next(new Error("Profile is in inactive state"));
//           }
//         }
//         next();
//       });
//     });

//     this.io.on("connection", async (socket) => {
//       console.log("Client connected:", socket.id);
//       // socket.on("joinUser", async ({ userId }) => {
//       const userId = socket.user.userId;
//       try {
//         socket.userId = userId;
//         this.addSession(userId, socket.id);
//         console.log(`User ${userId} connected with session ${socket.id}`);

//         // Send unread notifications count for P2P and groups on connection
//         const unreadP2PCount =
//           await notificationService.getUnreadP2PNotificationsCount(userId);
//         socket.emit("unreadP2PNotifications", { count: unreadP2PCount });

//         const unreadGroupCounts =
//           await notificationService.getUnreadGroupNotificationsCount(userId);
//         socket.emit("unreadGroupNotifications", { count: unreadGroupCounts });

//         //send unreadnotifications p2p chat wise
//         // const usersWithUnreadCounts =
//         //   await notificationService.getAllUsersWithUnreadCounts(
//         //     userId,
//         //     socket.userDetails.organizationId
//         //   );
//         // socket.emit("usersWithUnreadCounts", usersWithUnreadCounts);
//         //each particular group  unread count and last message
//         const groupDetails =
//           await notificationService.getUnreadGroupCountsAndLastMessageForUser(
//             userId
//           );
//         socket.emit("groupsDetails", groupDetails);
//       } catch (error) {
//         console.error("Error on joinUser:", error);
//       }
//       // });

//       socket.on("clickonP2P", async ({ otherUserId, limit, lastMessageId }) => {
//         try {
//           const chatlist = await chatService.getMessages(
//             socket.userId,
//             otherUserId,
//             socket.userDetails.organizationId,
//             limit || 10,
//             lastMessageId
//           );
//           const selfchatnotification =
//             await notificationService.getp2pLastMesssageWithCount(
//               otherUserId,
//               socket.userId
//             );
//           this.sendSessionMessages(
//             socket.userId,
//             "newP2PNotification",
//             selfchatnotification
//           );
//           socket.emit("p2pchat", chatlist);
//         } catch (error) {
//           console.error("Error on clickonP2P:", error);
//         }
//       });

//       socket.on("clickonGroup", async ({ groupId }) => {
//         try {
//           const chatlist = await chatService.getGroupMessages(groupId);
//           socket.emit("groupchat", chatlist);
//         } catch (error) {
//           console.error("Error on clickonGroup:", error);
//         }
//       });

//       socket.on("sendMessage", async ({ recipientId, message }) => {
//         try {
//           const senderId = socket.userId;
//           const newMessage = await chatService.sendMessage(
//             senderId,
//             recipientId,
//             message,
//             socket.userDetails.organizationId
//           );

//           //self message
//           this.sendSessionMessages(senderId, "newP2PMessage", newMessage);

//           //other user message
//           this.sendSessionMessages(recipientId, "newP2PMessage", newMessage);
//           const selfchatnotification =
//             await notificationService.getp2pLastMesssageWithCount(
//               recipientId,
//               senderId
//             );
//           const chatnotification =
//             await notificationService.getp2pLastMesssageWithCount(
//               senderId,
//               recipientId
//             );
//           this.sendSessionMessages(
//             recipientId,
//             "newP2PNotification",
//             chatnotification
//           );
//           this.sendSessionMessages(
//             senderId,
//             "newP2PNotification",
//             selfchatnotification
//           );
//           this.sendunreadP2PCount(recipientId);
//         } catch (error) {
//           console.error("Error on sendMessage:", error);
//         }
//       });

//       socket.on("sendGroupMessage", async ({ groupId, message }) => {
//         try {
//           const senderId = socket.userId;
//           //console.log("senderId", senderId);

//           const newMessage = await chatService.sendGroupMessage(
//             senderId,
//             groupId,
//             message,
//             socket.userDetails.organizationId
//           );
//           //console.log(newMessage);

//           const groupMembers = (await chatService.getGroupById(groupId))
//             .members;
//           //console.log("groupMembers", groupMembers);

//           groupMembers.forEach((memberId) => {
//             this.sendSessionMessages(memberId, "newGroupMessage", newMessage);
//             if (memberId.toString() !== senderId.toString()) {
//               this.sendunreadGroupCount(memberId);
//             }
//           });
//         } catch (error) {
//           console.error("Error on sendGroupMessage:", error);
//         }
//       });

//       socket.on("markMessageAsDelivered", async ({ messageId }) => {
//         try {
//           const userId = socket.userId;
//           const message = await chatService.markMessageAsDelivered(
//             messageId,
//             userId,
//             socket.userDetails.organizationId
//           );

//           if (message && message.senderId && message.recipientId) {
//             this.sendSessionMessages(
//               message.senderId,
//               "messageDelivered",
//               message
//             );
//             this.sendSessionMessages(
//               message.recipientId,
//               "messageDelivered",
//               message
//             );
//           }
//         } catch (error) {
//           console.error("Error on markMessageAsRead:", error);
//         }
//       });

//       socket.on("markMessageAsRead", async ({ messageId }) => {
//         try {
//           const userId = socket.userId;
//           const message = await chatService.markMessageAsRead(
//             messageId,
//             userId,
//             socket.userDetails.organizationId
//           );

//           if (message && message.senderId) {
//             this.sendSessionMessages(message.senderId, "messageRead", {
//               messageId,
//               userId,
//             });
//           }
//         } catch (error) {
//           console.error("Error on markMessageAsRead:", error);
//         }
//       });

//       socket.on("markMessagesAsRead", async ({ messageId }) => {
//         try {
//           const userId = socket.userId;
//           const message = await chatService.markMessagesAsReadAutoUpdate(
//             messageId,
//             userId
//           );
//           console.log(message);

//           if (message && message.senderId) {
//             this.sendSessionMessages(message.senderId, "messagesRead", {
//               messageId,
//               userId,
//             });
//           }
//         } catch (error) {
//           console.error("Error on markMessagesAsRead:", error);
//         }
//       });

//       socket.on("disconnect", (reason) => {
//         this.removeSession(socket.userId, socket.id);
//         console.log(
//           `User ${socket.userId} disconnected from session ${socket.id} reason ${reason}`
//         );
//       });
//     });
//   }

//   sendSessionMessages(senderId, topic, message) {
//     this.getSessions(senderId).forEach((sessionId) => {
//       this.io.to(sessionId).emit(topic, message);
//     });
//   }

//   async sendunreadP2PCount(userId) {
//     const unreadP2PCount =
//       await notificationService.getUnreadP2PNotificationsCount(userId);
//     this.sendSessionMessages(userId, "unreadP2PNotifications", {
//       count: unreadP2PCount,
//     });
//   }

//   async sendunreadGroupCount(userId) {
//     const unreadGroupCounts =
//       await notificationService.getUnreadGroupNotificationsCount(userId);
//     this.sendSessionMessages(userId, "unreadGroupNotifications", {
//       count: unreadGroupCounts,
//     });
//   }
// }

// module.exports = WebSocketService;

// const { Server } = require("socket.io");
// const Redis = require("ioredis");
// const jwt = require("jsonwebtoken");
// const chatService = require("./chatService");
// const notificationService = require("./notificationService");
// const { JWT_SECRET, REDIS_URL } = require("../config/config");

// // Initialize Redis Client
// const redisClient = new Redis(REDIS_URL);

// class WebSocketService {
//   constructor(server) {
//     if (!WebSocketService.instance) {
//       this.io = new Server(server, { cors: { origin: "*" } });
//       this.redisClient = new Redis(REDIS_URL);

//       this.redisClient.on("ready", async () => {
//         console.log("Redis connected, clearing old sessions...");
//         await this.clearSessionsOnStart();
//       });

//       this.initialize();
//       WebSocketService.instance = this; // Store instance
//     }
//     return WebSocketService.instance;
//   }

//   async clearSessionsOnStart() {
//     try {
//       if (!this.redisClient) {
//         console.error("Redis client not initialized!");
//         return;
//       }

//       const keys = await this.redisClient.keys("sessions:*");
//       if (keys.length) {
//         await this.redisClient.del(keys);
//         console.log(`✅ Cleared ${keys.length} old Redis sessions.`);
//       }
//     } catch (error) {
//       console.error("❌ Error clearing Redis sessions:", error);
//     }
//   }

//   async addSession(userId, socketId) {
//     await this.redisClient.sadd(`sessions:${userId}`, socketId);
//   }

//   async removeSession(userId, socketId) {
//     await this.redisClient.srem(`sessions:${userId}`, socketId);
//     const sessionCount = await this.redisClient.scard(`sessions:${userId}`);
//     if (sessionCount === 0) {
//       await this.redisClient.del(`sessions:${userId}`);
//     }
//   }

//   async getSessions(userId) {
//     return await this.redisClient.smembers(`sessions:${userId}`);
//   }

//   async getAllSessions() {
//     const keys = await this.redisClient.keys("sessions:*");
//     const sessions = {};
//     for (const key of keys) {
//       const userId = key.split(":")[1];
//       sessions[userId] = await this.redisClient.smembers(key);
//     }
//     return sessions;
//   }

//   /** Middleware to authenticate socket connections */
//   initialize() {
//     this.io.use(async (socket, next) => {
//       const token = socket.handshake.query.token;
//       if (!token) return next(new Error("Authentication error: Missing token"));

//       jwt.verify(token, JWT_SECRET, async (err, decoded) => {
//         if (err) return next(new Error("Authentication error: Invalid token"));

//         socket.user = decoded;
//         if (decoded.userId) {
//           const userService = require("./userService");
//           const userDetails = await userService.findUserById(decoded.userId);
//           socket.userDetails = userDetails;

//           if (
//             !userDetails ||
//             userDetails.status === userService.StatusEnum.INACTIVE
//           ) {
//             return next(new Error("User is inactive"));
//           }
//         }
//         next();
//       });
//     });

//     /** WebSocket connection handling */
//     this.io.on("connection", async (socket) => {
//       console.log("Client connected:", socket.id);
//       const userId = socket.user.userId;

//       try {
//         socket.userId = userId;
//         await this.addSession(userId, socket.id);
//         console.log(`User ${userId} connected with session ${socket.id}`);

//         /** Send unread notification counts */
//         const unreadP2PCount =
//           await notificationService.getUnreadP2PNotificationsCount(userId);
//         socket.emit("unreadP2PNotifications", { count: unreadP2PCount });

//         const unreadGroupCounts =
//           await notificationService.getUnreadGroupNotificationsCount(userId);
//         socket.emit("unreadGroupNotifications", { count: unreadGroupCounts });

//         const groupDetails =
//           await notificationService.getUnreadGroupCountsAndLastMessageForUser(
//             userId
//           );
//         socket.emit("groupsDetails", groupDetails);
//       } catch (error) {
//         console.error("Error on connection:", error);
//       }

//       /** Fetch messages on click */
//       socket.on("clickonP2P", async ({ otherUserId, limit, lastMessageId }) => {
//         try {
//           const chatlist = await chatService.getMessages(
//             userId,
//             otherUserId,
//             socket.userDetails.organizationId,
//             limit || 10,
//             lastMessageId
//           );
//           socket.emit("p2pchat", chatlist);
//           await this.getP2pNotificationAnsSend(otherUserId, userId);
//         } catch (error) {
//           console.error("Error on clickonP2P:", error);
//         }
//       });

//       /** Handle message sending */
//       socket.on("sendMessage", async ({ recipientId, message }) => {
//         try {
//           const senderId = socket.userId;
//           const newMessage = await chatService.sendMessage(
//             senderId,
//             recipientId,
//             message,
//             socket.userDetails.organizationId
//           );

//           await this.broadcastMessage(
//             senderId,
//             recipientId,
//             "newP2PMessage",
//             newMessage
//           );
//           // await this.getP2pNotificationAnsSend(senderId, recipientId);
//           await this.updateNotifications(senderId, recipientId);
//         } catch (error) {
//           console.error("Error on sendMessage:", error);
//         }
//       });

//       /** Handle message delivery */
//       socket.on("markMessageAsDelivered", async ({ messageId }) => {
//         try {
//           const userId = socket.userId;
//           const message = await chatService.markMessageAsDelivered(
//             messageId,
//             userId,
//             socket.userDetails.organizationId
//           );
//           if (message) {
//             console.log(message);

//             await this.broadcastMessage(
//               message.senderId,
//               message.recipientId,
//               "messageDelivered",
//               message
//             );
//           }
//         } catch (error) {
//           console.error("Error on markMessageAsDelivered:", error);
//         }
//       });

//       socket.on("markMessageAsRead", async ({ messageId }) => {
//         try {
//           const userId = socket.userId;
//           const message = await chatService.markMessageAsRead(
//             messageId,
//             userId,
//             socket.userDetails.organizationId
//           );
//           console.log(message);

//           if (message && message.senderId) {
//             await this.broadcastMessage(
//               message.senderId,
//               message.recipientId,
//               "messageRead",
//               message
//             );

//             await this.getP2pNotificationAnsSend(
//               message.senderId,
//               message.recipientId
//             );
//           }
//         } catch (error) {
//           console.error("Error on markMessageAsRead:", error);
//         }
//       });

//       /** Handle user disconnection */
//       socket.on("disconnect", async () => {
//         await this.removeSession(userId, socket.id);
//         console.log(`User ${userId} disconnected from session ${socket.id}`);
//       });
//     });
//   }

//   /** Broadcast message to user sessions */
//   async broadcastMessage(senderId, recipientId, topic, message) {
//     const senderSessions = await this.getSessions(senderId);
//     senderSessions.forEach((sessionId) =>
//       this.io.to(sessionId).emit(topic, message)
//     );

//     const recipientSessions = await this.getSessions(recipientId);
//     recipientSessions.forEach((sessionId) =>
//       this.io.to(sessionId).emit(topic, message)
//     );
//   }

//   async sendSessionMessages(senderId, topic, message) {
//     const senderSessions = await this.getSessions(senderId);

//     senderSessions.forEach((sessionId) => {
//       this.io.to(sessionId).emit(topic, message);
//     });
//   }

//   /** Update unread message notifications */
//   async updateNotifications(senderId, recipientId) {
//     this.getP2pNotificationAnsSend(recipientId, senderId);
//     this.getP2pNotificationAnsSend(senderId, recipientId);
//   }

//   async getP2pNotificationAnsSend(senderId, recipientId) {
//     const Notification = await notificationService.getp2pLastMesssageWithCount(
//       senderId,
//       recipientId
//     );
//     await this.sendSessionMessages(
//       recipientId,
//       "newP2PNotification",
//       Notification
//     );
//   }
// }

// module.exports = WebSocketService;

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatService = require("./chatService");
const notificationService = require("./notificationService");
const { JWT_SECRET } = require("../config/config");

class WebSocketService {
  constructor(server) {
    if (!WebSocketService.instance) {
      this.io = new Server(server, { cors: { origin: "*" } });
      this.initialize();
      WebSocketService.instance = this; // Store instance
    }
    return WebSocketService.instance;
  }

  initialize() {
    this.io.use(async (socket, next) => {
      const token = socket.handshake.query.token;
      if (!token) return next(new Error("Authentication error: Missing token"));

      jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return next(new Error("Authentication error: Invalid token"));

        socket.user = decoded;
        socket.userId = decoded.userId;
        if (decoded.userId) {
          const userService = require("./userService");
          const userDetails = await userService.findUserById(decoded.userId);
          socket.userDetails = userDetails;

          if (
            !userDetails ||
            userDetails.status === userService.StatusEnum.INACTIVE
          ) {
            return next(new Error("User is inactive"));
          }
        }
        next();
      });
    });

    this.io.on("connection", async (socket) => {
      console.log("Client connected:", socket.id, socket.user.userId);
      const userId = socket.user.userId;
      socket.join(userId);

      try {
        /** Send unread notification counts */
        const unreadP2PCount =
          await notificationService.getUnreadP2PNotificationsCount(userId);
        socket.emit("unreadP2PNotifications", { count: unreadP2PCount });

        const unreadGroupCounts =
          await notificationService.getUnreadGroupNotificationsCount(userId);
        socket.emit("unreadGroupNotifications", { count: unreadGroupCounts });

        const groupDetails =
          await notificationService.getUnreadGroupCountsAndLastMessageForUser(
            userId
          );
        socket.emit("groupsDetails", groupDetails);
      } catch (error) {
        console.error("Error on connection:", error);
      }

      /** Fetch messages on click */
      socket.on(
        "clickonP2P",
        async ({ otherUserId, limit, lastMessageId, message }) => {
          try {
            const chatlist = await chatService.getMessages(
              userId,
              otherUserId,
              socket.userDetails.organizationId,
              limit || 10,
              lastMessageId,
              message
            );
            socket.emit("p2pchat", chatlist);
            await this.getP2pNotificationAnsSend(otherUserId, userId);
          } catch (error) {
            console.error("Error on clickonP2P:", error);
          }
        }
      );

      /** Handle message sending */
      socket.on("sendMessage", async ({ recipientId, message }) => {
        try {
          const senderId = socket.userId;
          const newMessage = await chatService.sendMessage(
            senderId,
            recipientId,
            message,
            socket.userDetails.organizationId
          );
          await this.broadcastMessage(
            [senderId, recipientId],
            "newP2PMessage",
            newMessage
          );
          // await this.getP2pNotificationAnsSend(senderId, recipientId);
          await this.updateNotifications(senderId, recipientId);
        } catch (error) {
          console.error("Error on sendMessage:", error);
        }
      });

      /** Handle Group message sending */
      socket.on("sendGroupMessage", async ({ groupId, message }) => {
        try {
          const senderId = socket.userId;
          console.log(socket.userId, socket.userDetails);

          const newMessage = await chatService.sendGroupMessage(
            senderId,
            groupId,
            message,
            socket.userDetails.organizationId
          );
          const userList = newMessage.analytics.map((item) => item.userId);
          await this.broadcastMessage(userList, "newGroupMessage", newMessage);
          await this.sendWebsocketGroupNotification(
            userList,
            groupId,
            socket.userDetails.organizationId
          );
        } catch (error) {
          console.error("Error on sendMessage:", error);
        }
      });

      /** Handle message delivery */
      socket.on("markMessageAsDelivered", async ({ messageId }) => {
        try {
          const userId = socket.userId;
          const message = await chatService.markMessageAsDelivered(
            messageId,
            userId,
            socket.userDetails.organizationId
          );
          if (message) {
            const userList = message.analytics.map((item) => item.userId);

            await this.broadcastMessage(userList, "messageDelivered", message);
          }
        } catch (error) {
          console.error("Error on markMessageAsDelivered:", error);
        }
      });

      socket.on("markMessageAsRead", async ({ messageId }) => {
        try {
          const userId = socket.userId;
          const message = await chatService.markMessageAsRead(
            messageId,
            userId,
            socket.userDetails.organizationId
          );

          if (message && message.senderId) {
            const userList = message.analytics.map((item) => item.userId);

            await this.broadcastMessage(userList, "messageRead", message);
            if (message.groupId) {
              await this.sendWebsocketGroupNotification(
                userList,
                message.groupId,
                socket.userDetails.organizationId
              );
            } else {
              await this.getP2pNotificationAnsSend(
                message.senderId,
                message.recipientId
              );
            }
          }
        } catch (error) {
          console.error("Error on markMessageAsRead:", error);
        }
      });

      /** Handle user disconnection */
      socket.on("disconnect", async () => {
        console.log(`User ${userId} disconnected from session ${socket.id}`);
      });
    });
  }

  /** Broadcast message */
  async broadcastMessage(ids, topic, message) {
    ids.forEach((id) => {
      this.io
        .to(typeof id === "string" ? id : id.toString())
        .emit(topic, message);
    });
    console.log("broadcast success on ", ids);
  }

  async sendSessionMessages(recipientId, topic, message) {
    this.io
      .to(
        typeof recipientId === "string" ? recipientId : recipientId.toString()
      )
      .emit(topic, message);
  }

  /** Update unread message notifications */
  async updateNotifications(senderId, recipientId) {
    this.getP2pNotificationAnsSend(recipientId, senderId);
    this.getP2pNotificationAnsSend(senderId, recipientId);
  }

  async getP2pNotificationAnsSend(senderId, recipientId) {
    const Notification = await notificationService.getp2pLastMesssageWithCount(
      senderId,
      recipientId
    );
    await this.sendSessionMessages(
      recipientId,
      "newP2PNotification",
      Notification
    );
  }

  async sendWebsocketGroupNotification(userList, groupId, organizationId) {
    const sessions = await this.getAllSessions();
    userList.forEach(async (id) => {
      if (sessions.has(id === "string" ? id : id.toString())) {
        await chatService.sendWebsocketGroupNotification(
          id === "string" ? id : id.toString(),
          groupId,
          organizationId
        );
      }
    });
  }

  async getAllSessions() {
    return await this.io.sockets.adapter.rooms;
  }
}

module.exports = WebSocketService;
