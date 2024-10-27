// utils/errorCodes.js
module.exports = {
  sendP2PMessage: {
    message: "Error sending P2P message",
    MISSING_REQUIRED_FIELDS: "recipientId or message fields are missing",
  },
  createGroupChat: {
    MISSING_REQUIRED_FIELDS: "groupName or members Array fields are missing",
  },
  GROUP_ALREADY_EXISTS: {
    code: "GROUP_ALREADY_EXISTS",
    message: "A group with this name already exists.",
    status: 409,
  },
  INVALID_MEMBER_IDS: {
    code: "INVALID_MEMBER_IDS",
    message: "One or more member IDs are invalid.",
    status: 400,
  },
  GROUP_NOT_FOUND: {
    code: "GROUP_NOT_FOUND",
    message: "Group not found.",
    status: 404,
  },
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    message: "User not found.",
    status: 404,
  },
  INVALID_MESSAGE: {
    code: "INVALID_MESSAGE",
    message: "Message content is required.",
    status: 400,
  },
  SERVER_ERROR: {
    code: "SERVER_ERROR",
    message: "An internal server error occurred.",
    status: 500,
  },
};
