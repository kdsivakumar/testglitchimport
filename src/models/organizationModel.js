const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    address: { type: String },
    phone: { type: String },
    domain: { type: String, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  }
  // ,
  // { collection: "chat_server" } // 👈 This tells Mongoose to use the "chat_server" collection
);

// Define a compound index for 'domain' and 'organizationId' to ensure domain uniqueness across organizations
organizationSchema.index({ domain: 1 }, { unique: true });

organizationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
