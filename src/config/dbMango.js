const mongoose = require("mongoose");
require("dotenv").config();
const AuthService = require("../services/authService");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      writeConcern: { w: "majority" },
    });
    AuthService.ensureRootUser();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(2); // Exit process with failure
  }
};

module.exports = connectDB;
