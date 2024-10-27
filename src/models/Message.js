const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  groupId: { type: String, required: false },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  readStatus: { type: Boolean, default: false }, // false if unread, true if read
  readAt: { type: Date, default: null }, // timestamp for when the message was read
  deliveredStatus: { type: Boolean, default: false }, // Delivery status of each user
  deliveredAt: { type: Date, default: null },
  analytics: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ID of each recipient
      readStatus: { type: Boolean, default: false }, // Read status of each user
      readAt: { type: Date, default: null }, // Timestamp of when each user read the message
      deliveredStatus: { type: Boolean, default: false }, // Delivery status of each user
      deliveredAt: { type: Date, default: null },
    },
  ],
});

MessageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  const message = this;

  // Calculate if all users have marked the message as delivered
  const allDelivered = message.analytics.every(
    (a) => a.deliveredStatus === true
  );
  if (allDelivered) {
    message.deliveredStatus = true;
    message.deliveredAt = message.analytics.reduce(
      (latest, a) => (a.deliveredAt > latest ? a.deliveredAt : latest),
      message.deliveredAt
    );
  }

  // Calculate if all users have marked the message as read
  const allRead = message.analytics.every((a) => a.readStatus === true);
  if (allRead) {
    message.readStatus = true;
    message.readAt = message.analytics.reduce(
      (latest, a) => (a.readAt > latest ? a.readAt : latest),
      message.readAt
    );
    if (!message.deliveredStatus) {
      message.deliveredStatus = true;
      message.deliveredAt = message.analytics.reduce(
        (latest, a) => (a.readAt > latest ? a.readAt : latest),
        message.readAt
      );
    }
  }

  next();
});

module.exports = mongoose.model("Message", MessageSchema);
