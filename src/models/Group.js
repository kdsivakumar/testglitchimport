// models/Group.js
const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  groupImage: { type: String, default: null },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

GroupSchema.index({ name: 1, organizationId: 1 }, { unique: true });

GroupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Group", GroupSchema);
