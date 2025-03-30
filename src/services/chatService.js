const Message = require("../models/Message");
const Group = require("../models/Group");
const errorCodes = require("../utils/errorCodes");
const logger = require("../utils/logger");
class ChatService {
  constructor() {}
  async sendMessage(senderId, recipientId, message, organizationId) {
    // if (!(await this.validateMemberIds([recipientId], organizationId))) {
    //   const error = new Error(errorCodes.INVALID_MEMBER_IDS.message);
    //   error.code = errorCodes.INVALID_MEMBER_IDS.code;
    //   error.status = errorCodes.INVALID_MEMBER_IDS.status;
    //   throw error;
    // }
    // Initialize analytics for the recipient with default values
    logger.info(
      `Message Request Received senderId: ${senderId} recipientId: ${recipientId} message:${message} organizationId:${organizationId}`
    );
    const analytics = [
      {
        userId: recipientId,
        readStatus: senderId === recipientId ? true : false,
        readAt: senderId === recipientId ? new Date() : null,
        deliveredStatus: senderId === recipientId ? true : false,
        deliveredAt: senderId === recipientId ? new Date() : null,
      },
    ];
    if (senderId !== recipientId) {
      analytics.push({
        userId: senderId,
        readStatus: true,
        readAt: new Date(),
        deliveredStatus: true,
        deliveredAt: new Date(),
      });
    }
    // Create the message with analytics
    const newMessage = new Message({
      senderId,
      recipientId,
      message,
      analytics,
      organizationId,
    });
    // Save the new message
    await newMessage.save();
    logger.info(`Message saved ${newMessage}`);
    await this.sendWebSocketEvent("newP2PMessage", newMessage);
    // Populate the 'name' fields for both sender and recipient
    return await Message.findById(newMessage._id)
      .populate("senderId", "name") // Populate only the 'name' field of sender
      .populate("recipientId", "name");
  }

  // async getMessages(userId, otherUserId, organizationId, skip, limit) {
  //   const messages = await Message.find({
  //     $or: [
  //       { senderId: userId, recipientId: otherUserId },
  //       { senderId: otherUserId, recipientId: userId },
  //     ],
  //     organizationId: organizationId,
  //   })
  //     .skip(skip)
  //     .limit(limit)
  //     .populate("senderId", "name") // Only populate the 'name' field of sender
  //     .populate("recipientId", "name") // Only populate the 'name' field of recipient
  //     .exec();
  //   const totalCount = await Message.countDocuments({
  //     $or: [
  //       { senderId: userId, recipientId: otherUserId },
  //       { senderId: otherUserId, recipientId: userId },
  //     ],
  //     organizationId: organizationId,
  //   });
  //   const last = messages[messages.length - 1];
  //   if (last)
  //     await this.markMessagesAsReadAutoUpdate(last.id, userId, organizationId);

  //   return { messages, totalCount };
  // }

  async getMessages(
    userId,
    otherUserId,
    organizationId,
    limit,
    lastMessageId,
    message,
    messageId
  ) {
    if (!lastMessageId) {
      await this.markMessagesAsReadAutoUpdate(
        userId,
        otherUserId,
        organizationId
      );
    }
    let query = {
      $or: [
        { senderId: userId, recipientId: otherUserId },
        { senderId: otherUserId, recipientId: userId },
      ],
      organizationId: organizationId,
    };

    if (lastMessageId) {
      query["_id"] = { $lt: lastMessageId }; // Fetch messages before the lastMessageId
    }

    if (message) {
      query["message"] = { $regex: new RegExp(message, "i") }; // Case-insensitive search
    }
    let combinedMessages = [];

    if (messageId) {
      // Get 5 messages before the searched message
      let beforeMessages = await Message.find({
        ...query,
        _id: { $lt: messageId },
      })
        .sort({ _id: -1 }) // Sort to get messages before the messageId in descending order
        .limit(5)
        .populate("senderId", "name")
        .populate("recipientId", "name")
        .exec();

      // Get the searched message (the messageId itself)
      let messageDetails = await Message.findById(messageId)
        .populate("senderId", "name")
        .populate("recipientId", "name")
        .exec();

      // Get 5 messages after the searched message
      let afterMessages = await Message.find({
        ...query,
        _id: { $gt: messageId },
      })
        .sort({ _id: 1 }) // Sort to get messages after the messageId in ascending order
        .limit(5)
        .populate("senderId", "name")
        .populate("recipientId", "name")
        .exec();

      // Combine before messages, the searched message, and after messages
      return (combinedMessages = [
        ...beforeMessages.reverse(),
        messageDetails,
        ...afterMessages,
      ]);
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 }) // Sort in descending order to get the latest messages
      .limit(limit)
      .populate("senderId", "name")
      .populate("recipientId", "name")
      .exec();
    if (!lastMessageId) {
      await this.sendWebsocketP2pNotification(otherUserId, userId);
    }
    return messages;
  }

  async doesGroupExist(groupName, orgId) {
    return await Group.findOne({ name: groupName, organizationId: orgId });
  }

  async validateMemberIds(memberIds, orgId) {
    const userService = require("../services/userService");

    const results = await Promise.all(
      memberIds.map(async (id) => !!(await userService.findUserById(id, orgId)))
    );
    return results.every((result) => result);
  }

  async createGroup(groupName, members, orgId) {
    if (await this.doesGroupExist(groupName, orgId)) {
      const error = new Error(errorCodes.GROUP_ALREADY_EXISTS.message);
      error.code = errorCodes.GROUP_ALREADY_EXISTS.code;
      error.status = errorCodes.GROUP_ALREADY_EXISTS.status;
      throw error;
    }

    if (!(await this.validateMemberIds(members, orgId))) {
      const error = new Error(errorCodes.INVALID_MEMBER_IDS.message);
      error.code = errorCodes.INVALID_MEMBER_IDS.code;
      error.status = errorCodes.INVALID_MEMBER_IDS.status;
      throw error;
    }

    const newGroup = new Group({
      name: groupName,
      members,
      organizationId: orgId,
    });
    return await newGroup.save();
  }

  async getGroupById(groupId, organizationId) {
    const group = await Group.findOne({ _id: groupId, organizationId });
    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }
    return group;
  }

  async updateGroup(groupId, updates, organizationId) {
    const group = await Group.findOne({ _id: groupId, organizationId });
    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }

    if (
      updates.name &&
      (await this.doesGroupExist(updates.name, organizationId))
    ) {
      const error = new Error(errorCodes.GROUP_ALREADY_EXISTS.message);
      error.code = errorCodes.GROUP_ALREADY_EXISTS.code;
      error.status = errorCodes.GROUP_ALREADY_EXISTS.status;
      throw error;
    }

    if (
      updates.members &&
      !(await this.validateMemberIds(updates.members, organizationId))
    ) {
      const error = new Error(errorCodes.INVALID_MEMBER_IDS.message);
      error.code = errorCodes.INVALID_MEMBER_IDS.code;
      error.status = errorCodes.INVALID_MEMBER_IDS.status;
      throw error;
    }

    if (updates.name) group.name = updates.name;
    if (updates.members) group.members = updates.members;

    return await group.save();
  }

  async deleteGroup(groupId, organizationId) {
    const group = await Group.findOneAndDelete({
      _id: groupId,
      organizationId,
    });
    console.log(group);

    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }
    return group;
  }

  async getAllGroups(organizationId, skip, limit, name) {
    let totalCount;
    let groups;
    let query = {}; // Define the base query

    // Filter by organizationId if provided
    if (organizationId) {
      query.organizationId = organizationId;
    }

    // Filter by name if provided (searching inside details.name)
    if (name) {
      query["details.name"] = { $regex: new RegExp(name, "i") }; // Case-insensitive search
    }

    // Get the total count of matching documents
    totalCount = await Group.countDocuments(query);

    // Fetch the filtered user details with pagination
    groups = await Group.find(query)
      .populate("members", "username")
      .skip(skip)
      .limit(limit)
      .exec();

    return { groups, totalCount };

    // if (organizationId) {
    //   return await Group.find({ organizationId }).populate(
    //     "members",
    //     "username"
    //   );
    // } else {
    //   return await Group.find().populate("members", "username");
    // }
  }

  // Find groups by a single member's ID
  async findGroupsByMember(userId, organizationId) {
    return await Group.find({ members: userId, organizationId }).populate(
      "members",
      "username"
    );
  }

  // Find groups containing a specific set of members
  async findGroupsByMembers(memberIds, organizationId) {
    return await Group.find({
      members: { $all: memberIds },
      organizationId,
    }).populate("members", "username");
  }

  async sendGroupMessage(senderId, groupId, message, organizationId) {
    // Find the group and check if the user is a member
    const group = await Group.findOne({ _id: groupId, organizationId });
    if (!group) {
      const error = new Error(errorCodes.GROUP_NOT_FOUND.message);
      error.code = errorCodes.GROUP_NOT_FOUND.code;
      error.status = errorCodes.GROUP_NOT_FOUND.status;
      throw error;
    }
    console.log(group, senderId);

    // Check if senderId is part of the group's members
    if (!group.members.includes(senderId)) {
      const error = new Error("User is not a member of this group.");
      error.code = "USER_NOT_IN_GROUP";
      error.status = 403;
      throw error;
    }

    // Initialize analytics for each group member, excluding the sender
    const analytics = group.members
      // .filter((memberId) => memberId.toString() !== senderId.toString())
      .map((memberId) => ({
        userId: memberId,
        readStatus: memberId.toString() !== senderId.toString() ? false : true,
        readAt: memberId.toString() !== senderId.toString() ? null : new Date(),
        deliveredStatus:
          memberId.toString() !== senderId.toString() ? false : true,
        deliveredAt:
          memberId.toString() !== senderId.toString() ? null : new Date(),
      }));

    // Create the message with groupId, senderId, message, and analytics
    const newMessage = new Message({
      senderId,
      groupId,
      message,
      analytics,
      organizationId,
    });
    return await newMessage.save();
  }

  async getGroupMessages(
    userId,
    groupId,
    organizationId,
    limit,
    lastMessageId
  ) {
    let updatedMsgs;
    if (!lastMessageId) {
      updatedMsgs = await this.markGroupMessagesAsReadAutoUpdate(
        userId,
        groupId,
        organizationId
      );
    }
    let query = {
      groupId,
      organizationId,
    };

    if (lastMessageId) {
      query["_id"] = { $lt: lastMessageId }; // Fetch messages before the lastMessageId
    }

    const messages = await Message.find(query)
      .sort({ _id: -1 }) // Sort in descending order to get the latest messages
      .limit(limit)
      .populate("senderId", "name")
      .exec();
    if (!lastMessageId && updatedMsgs) {
      this.sendWebsocketGroupNotification(userId, groupId, organizationId);
    }
    return messages;
    // return await Message.find({ groupId, organizationId }).populate(
    //   "senderId",
    //   "name"
    // );
  }

  // Mark a message as delivered
  async markMessageAsDelivered(messageId, userId, organizationId) {
    const message = await Message.findOne({ _id: messageId, organizationId });
    if (!message) throw new Error("Message not found");

    // Find or add analytics entry for this user
    const userAnalytics = message.analytics.find((analytics) =>
      analytics.userId.equals(userId)
    );
    if (
      message.deliveredStatus &&
      userAnalytics &&
      userAnalytics.deliveredStatus
    ) {
      return;
      //throw new Error("Message already delivered to this user");
    }

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
  async markMessageAsRead(messageId, userId, organizationId) {
    const message = await Message.findOne({ _id: messageId, organizationId });
    if (!message) throw new Error("Message not found");

    // Find analytics entry for this user
    const userAnalytics = message.analytics.find((analytics) =>
      analytics.userId.equals(userId)
    );

    if (userAnalytics && userAnalytics.readStatus) {
      return;
      // throw new Error("Message already read by this user");
    }

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

  async markMessagesAsReadAutoUpdateById(messageId, userId, organizationId) {
    const message = await Message.findOne({ _id: messageId, organizationId });
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
        if (!userAnalytics.deliveredStatus) {
          userAnalytics.deliveredStatus = true;
          userAnalytics.deliveredAt = new Date();
        }
      }
      // else {
      //   msg.analytics.push({
      //     userId: userId,
      //     readStatus: true,
      //     readAt: new Date(),
      //     deliveredStatus: true,
      //     deliveredAt: new Date(),
      //   });
      // }

      await msg.save();
    }

    return messagesToUpdate; // Return the list of updated messages if needed
  }

  async markMessagesAsReadAutoUpdate(userId, otherUserId, organizationId) {
    // Determine if this is a group message or P2P message
    let messagesToUpdate = [];
    const updatedMessages = [];
    const date = new Date();

    // if (false) {
    //   // For group messages, find all unread messages in the group up to the current messageId
    //   messagesToUpdate = await Message.find({
    //     groupId: message.groupId,
    //     analytics: {
    //       $elemMatch: { userId: userId, readStatus: false },
    //     },
    //     _id: { $lte: messageId }, // Only messages up to this ID
    //   });
    // } else {
    console.log(userId, otherUserId);
    // Step 1: Update deliveredStatus and deliveredAt
    await Message.updateMany(
      {
        senderId: otherUserId,
        recipientId: userId,
        organizationId: organizationId,
        analytics: {
          $elemMatch: {
            userId: userId, // Match specific userId in the analytics array
            deliveredStatus: false, // Only match messages where readStatus is false
          },
        },
      },
      {
        $set: {
          "analytics.$[elem].deliveredStatus": true,
          "analytics.$[elem].deliveredAt": date,
        },
      },
      {
        arrayFilters: [{ "elem.userId": userId }],
      }
    );

    // Step 2: Update readStatus and readAt
    messagesToUpdate = await Message.updateMany(
      {
        senderId: otherUserId,
        recipientId: userId,
        organizationId: organizationId,
        analytics: {
          $elemMatch: {
            userId: userId, // Match specific userId in the analytics array
            readStatus: false, // Only match messages where readStatus is false
          },
        },
      },
      {
        $set: {
          "analytics.$[elem].readStatus": true,
          "analytics.$[elem].readAt": date,
        },
      },
      {
        arrayFilters: [{ "elem.userId": userId }],
      }
    );
    // await Message.find({
    //   // $or: [
    //   //   { senderId: userId, recipientId: otherUserId },
    //   //   { senderId: otherUserId, recipientId: userId },
    //   // ],
    //   senderId: userId,
    //   recipientId: otherUserId,
    //   organizationId: organizationId,
    //   analytics: {
    //     $elemMatch: {
    //       userId: userId,
    //       readStatus: false,
    //     },
    //   },
    // });
    // }

    // // Update each message's read status
    // for (let msg of messagesToUpdate) {
    //   const userAnalytics = msg.analytics.find((analytics) =>
    //     analytics.userId.equals(userId)
    //   );

    //   if (userAnalytics) {
    //     userAnalytics.readStatus = true;
    //     userAnalytics.readAt = new Date();
    //     if (!userAnalytics.deliveredStatus) {
    //       userAnalytics.deliveredStatus = true;
    //       userAnalytics.deliveredAt = new Date();
    //     }
    //   }
    //   // Save the updated message & push to response array
    //   const updatedMessage = await msg.save();
    //   updatedMessages.push(updatedMessage);
    // }
    if (messagesToUpdate.modifiedCount) {
      const query = {
        senderId: otherUserId,
        recipientId: userId,
        analytics: {
          $elemMatch: {
            userId: userId, // Match specific userId in the analytics array
            readStatus: true, // Only match messages where readStatus is false
            readAt: date,
          },
        },
        organizationId: organizationId,
      };
      await this.findAndSendToUpdatedMessages(query, "messageRead");
      return messagesToUpdate.modifiedCount;
      // this.sendWebSocketEvent("messageRead", updatedMessages);
    }
    return updatedMessages; // Return the list of updated messages if needed
  }

  async markMessagesAsDeliveredAutoUpdate(userId, organizationId) {
    // Determine if this is a group message or P2P message
    // const isGroupMessage = Boolean(message.groupId);
    let messagesToUpdate = [];
    const updatedMessages = [];
    const date = new Date();
    if (false) {
      // For group messages, find all unread messages in the group up to the current messageId
      messagesToUpdate = await Message.find({
        groupId: message.groupId,
        analytics: {
          $elemMatch: { userId: userId, deliveredStatus: false },
        },
      });
    } else {
      // For P2P messages, find all unread messages in the conversation up to the current messageId
      messagesToUpdate = await Message.updateMany(
        {
          recipientId: userId,
          analytics: {
            $elemMatch: {
              userId: userId, // Match specific userId in the analytics array
              deliveredStatus: false, // Only match messages where readStatus is false
            },
          },
          organizationId: organizationId,
        },
        {
          $set: {
            "analytics.$[elem].deliveredStatus": true,
            "analytics.$[elem].deliveredAt": date,
          },
        },
        {
          arrayFilters: [
            { "elem.userId": userId, "elem.deliveredStatus": false },
          ],
        }
      );
      console.log(messagesToUpdate, userId);
      const test = await Message.find({
        recipientId: userId,
        analytics: {
          $elemMatch: {
            userId: userId, // Match specific userId in the analytics array
            deliveredStatus: false, // Only match messages where readStatus is false
          },
        },
        organizationId: organizationId,
      });
      console.log(test);

      console.log(`Updated ${messagesToUpdate.modifiedCount} messages.`);
      if (messagesToUpdate.modifiedCount) {
        const query = {
          recipientId: userId,
          "analytics.userId": userId,
          "analytics.deliveredStatus": true,
          "analytics.deliveredAt": date,
          organizationId: organizationId,
        };
        this.findAndSendToUpdatedMessages(query, "messageDelivered");
        return messagesToUpdate.modifiedCount;
      }
      // messagesToUpdate = await Message.find({
      //   recipientId: userId,
      //   organizationId: organizationId,
      //   "analytics.userId": userId,
      //   "analytics.deliveredStatus": false,
      // });
    }

    // for (const message of messagesToUpdate) {
    //   // Update the analytics array for the specific user
    //   message.analytics = message.analytics.map((entry) => {
    //     if (entry.userId?.toString() === userId && !entry.deliveredStatus) {
    //       return {
    //         ...entry,
    //         deliveredStatus: true,
    //         deliveredAt: new Date(),
    //       };
    //     }
    //     return entry;
    //   });

    //   // Save the updated message & push to response array
    //   const updatedMessage = await message.save();
    //   updatedMessages.push(updatedMessage);
    // }
    // if (updatedMessages.length) {
    //   this.sendWebSocketEvent("messageDelivered", updatedMessages);
    // }
    return messagesToUpdate; //updatedMessages; // Return the list of updated messages if needed
  }

  async updateMessages(updatedMessages) {
    const bulkOps = [];
    const newUpdatedData = [];

    // Process messages in batches to avoid overloading the event loop
    const BATCH_SIZE = 1000; // Adjust the batch size depending on your system

    // Iterate over the messages in smaller batches
    for (let i = 0; i < updatedMessages.length; i += BATCH_SIZE) {
      const batch = updatedMessages.slice(i, i + BATCH_SIZE);

      for (const message of batch) {
        const allDelivered = message.analytics.every(
          (a) => a.deliveredStatus === true
        );
        const allRead = message.analytics.every((a) => a.readStatus === true);

        if (allDelivered) {
          message.deliveredStatus = true;
          message.deliveredAt = message.analytics.reduce(
            (latest, a) => (a.deliveredAt > latest ? a.deliveredAt : latest),
            message.deliveredAt
          );
        }

        if (allRead) {
          message.readStatus = true;
          message.readAt = message.analytics.reduce(
            (latest, a) => (a.readAt > latest ? a.readAt : latest),
            message.readAt
          );
          if (!message.deliveredStatus) {
            message.deliveredStatus = true;
            message.deliveredAt = message.readAt;
          }
        }

        // Push bulk operation update
        bulkOps.push({
          updateOne: {
            filter: { _id: message._id },
            update: {
              $set: {
                deliveredStatus: message.deliveredStatus,
                deliveredAt: message.deliveredAt,
                readStatus: message.readStatus,
                readAt: message.readAt,
                updatedAt: Date.now(),
              },
            },
          },
        });

        newUpdatedData.push(message);
      }

      // Perform bulk update for the batch
      if (bulkOps.length > 0) {
        await Message.bulkWrite(bulkOps);
        bulkOps.length = 0; // Clear the bulkOps array after each batch
      }
    }

    return newUpdatedData;
  }

  async findAndSendToUpdatedMessages(query, topic) {
    const updatedMessages = await Message.find(query);
    let newUpdatedData = [];
    newUpdatedData = await this.updateMessages(updatedMessages);
    // for (const message of updatedMessages) {
    //   const allDelivered = message.analytics.every(
    //     (a) => a.deliveredStatus === true
    //   );
    //   const allRead = message.analytics.every((a) => a.readStatus === true);

    //   if (allDelivered) {
    //     message.deliveredStatus = true;
    //     message.deliveredAt = message.analytics.reduce(
    //       (latest, a) => (a.deliveredAt > latest ? a.deliveredAt : latest),
    //       message.deliveredAt
    //     );
    //   }

    //   if (allRead) {
    //     message.readStatus = true;
    //     message.readAt = message.analytics.reduce(
    //       (latest, a) => (a.readAt > latest ? a.readAt : latest),
    //       message.readAt
    //     );
    //     if (!message.deliveredStatus) {
    //       message.deliveredStatus = true;
    //       message.deliveredAt = message.readAt;
    //     }
    //   }
    //   const msg = await message.save();
    //   newUpdatedData.push(msg);
    // }

    if (updatedMessages.length) {
      this.sendWebSocketEvent(
        topic,
        newUpdatedData.length ? newUpdatedData : updatedMessages
      );
    }
    return newUpdatedData;
  }

  async sendWebsocketP2pNotification(senderId, recipientId) {
    const WebSocketService = require("./websocketService");
    const webSocketService = new WebSocketService();
    await webSocketService.getP2pNotificationAnsSend(senderId, recipientId);
  }

  async sendWebsocketGroupNotification(userId, groupId, organizationId) {
    const WebSocketService = require("./websocketService");
    const webSocketService = new WebSocketService();
    const group = await this.getGroupById(groupId, organizationId);
    const notification = await this.getGroupUnreadCountAndLastMsg(
      userId,
      group,
      organizationId
    );
    await webSocketService.sendSessionMessages(
      userId,
      "newGroupNotification",
      notification
    );
  }

  async sendWebSocketEvent(topic, message) {
    const WebSocketService = require("./websocketService");
    const webSocketService = new WebSocketService();
    const activeSessions = await webSocketService.getAllSessions();
    if (Array.isArray(message)) {
      message.forEach(async (msg) => {
        //console.log(msg, topic);

        if (
          activeSessions.has(msg.recipientId?.toString()) ||
          activeSessions.has(msg.senderId?.toString())
        ) {
          console.log(msg, topic);

          await webSocketService.broadcastMessage(
            msg.analytics.map((item) => item.userId),
            topic,
            msg
          );
        }
      });
    } else {
      if (
        activeSessions.has(message.recipientId.toString()) ||
        activeSessions.has(message.senderId.toString())
      ) {
        await webSocketService.broadcastMessage(
          message.analytics.map((item) => item.userId),
          topic,
          message
        );
      }
    }
  }

  async markGroupMessagesAsReadAutoUpdate(userId, groupID, organizationId) {
    // Determine if this is a group message or P2P message
    let messagesToUpdate = [];
    const updatedMessages = [];
    const date = new Date();

    // Step 1: Update deliveredStatus and deliveredAt
    await Message.updateMany(
      {
        groupId: groupID,
        organizationId: organizationId,
        analytics: {
          $elemMatch: {
            userId: userId, // Match specific userId in the analytics array
            deliveredStatus: false, // Only match messages where readStatus is false
          },
        },
      },
      {
        $set: {
          "analytics.$[elem].deliveredStatus": true,
          "analytics.$[elem].deliveredAt": date,
        },
      },
      {
        arrayFilters: [{ "elem.userId": userId }],
      }
    );

    // Step 2: Update readStatus and readAt
    messagesToUpdate = await Message.updateMany(
      {
        groupId: groupID,
        organizationId: organizationId,
        analytics: {
          $elemMatch: {
            userId: userId, // Match specific userId in the analytics array
            readStatus: false, // Only match messages where readStatus is false
          },
        },
      },
      {
        $set: {
          "analytics.$[elem].readStatus": true,
          "analytics.$[elem].readAt": date,
        },
      },
      {
        arrayFilters: [{ "elem.userId": userId }],
      }
    );
    console.log("messagesToUpdate", messagesToUpdate);
    if (messagesToUpdate.modifiedCount) {
      const query = {
        groupId: groupID,
        analytics: {
          $elemMatch: {
            userId: userId, // Match specific userId in the analytics array
            readStatus: true, // Only match messages where readStatus is false
            readAt: date,
          },
        },
        organizationId: organizationId,
      };
      await this.findAndSendToUpdatedMessages(query, "messageRead");
      return messagesToUpdate.modifiedCount;
      // this.sendWebSocketEvent("messageRead", updatedMessages);
    }
    return updatedMessages.length; // Return the list of updated messages if needed
  }

  async getGroupUnreadCountAndLastMsg(userId, group, orgId) {
    // Get unread message count for this group
    const unreadCount = await Message.countDocuments({
      groupId: group._id || { $exists: true }, // Ensure it's a group message
      analytics: {
        $elemMatch: { userId: userId, readStatus: false },
      },
      organizationId: orgId,
    });

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

  // You can add more service methods as needed
  async deleteGroupsByOrgId(orgId) {
    return await Group.deleteMany({ organizationId: orgId });
  }

  async deleteMessagesByOrgId(orgId) {
    return await Message.deleteMany({ organizationId: orgId });
  }

  async reassignOrgGroups(orgId, newOrgId) {
    await Group.updateMany(
      { organizationId: orgId },
      { organizationId: newOrgId }
    );
  }
  async reassignOrgMessages(orgId, newOrgId) {
    await Message.updateMany(
      { organizationId: orgId },
      { organizationId: newOrgId }
    );
  }
}

module.exports = new ChatService();
