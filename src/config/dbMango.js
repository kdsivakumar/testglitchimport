const mongoose = require("mongoose");
require("dotenv").config();
const AuthService = require("../services/authService");
const OrganizationService = require("../services/organizationService"); // Import the service to check for root organization

// Local MongoDB URI
const localUri = "mongodb://localhost:27017/chat_server_data";

// Function to sync data from Atlas to local DB
const syncData = async () => {
  try {
    // Connect to local MongoDB using createConnection
    const localDbConnection = mongoose.createConnection(localUri);

    // Wait for the connection to be established
    await new Promise((resolve, reject) => {
      localDbConnection.once("open", resolve);
      localDbConnection.on("error", reject);
    });

    console.log("Connected to local MongoDB");

    // Register models on the local connection
    const UserLocal = localDbConnection.model(
      "User",
      require("../models/userModel").schema
    );
    const GroupLocal = localDbConnection.model(
      "Group",
      require("../models/Group").schema
    );
    const MessageLocal = localDbConnection.model(
      "Message",
      require("../models/Message").schema
    );
    const UserDetailsLocal = localDbConnection.model(
      "UserDetails",
      require("../models/userDetails").schema
    );

    // Fetch all data from MongoDB Atlas (Cloud)
    const users = await User.find();
    const groups = await Group.find();
    const messages = await Message.find();
    const userDetails = await UserDetails.find();

    // Insert the data into the local MongoDB
    await UserLocal.insertMany(users);
    await GroupLocal.insertMany(groups);
    await MessageLocal.insertMany(messages);
    await UserDetailsLocal.insertMany(userDetails);

    console.log("Data synchronized successfully!");

    // Close the connection to local MongoDB
    localDbConnection.close();
  } catch (error) {
    console.error("Error syncing data:", error);
  } finally {
    mongoose.disconnect(); // Disconnect from Atlas after the process
  }
};
mongoose.set("toJSON", {
  virtuals: true,
  transform: (doc, converted) => {
    delete converted._id;
  },
});
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      writeConcern: { w: "majority" },
    });

    console.log("MongoDB connected");

    // // Get DB instance
    // const db = mongoose.connection.db;

    // // Check if collection exists
    // const collections = await db.listCollections().toArray();
    // const collectionNames = collections.map((col) => col.name);

    // if (!collectionNames.includes("chat_server")) {
    //   await db.createCollection("chat_server");
    //   console.log(`Collection ${"chat_server"} created.`);
    // } else {
    //   console.log(`Collection ${"chat_server"} already exists.`);
    // }

    const org = await OrganizationService.ensureRootOrganization();
    await AuthService.ensureRootUser(org);
    console.log("MongoDB connected");
    // Call the sync function
    // syncData();
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(2); // Exit process with failure
  }
};

module.exports = connectDB;
