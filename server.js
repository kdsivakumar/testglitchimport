const express = require("express");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const logRoutes = require("./src/routes/logerRoutes");
const gitRoutes = require("./src/routes/gitRoutes");
const chatRoutes = require("./src/routes/chatRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const ensureLogsDirAndFiles = require("./src/utils/logUtils");
const requestLogger = require("./src/middlewares/requestLogger");
const connectDB = require("./src/config/dbMango");
const errorHandlingMiddleware = require("./src/middlewares/errorHandler");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure log directory and files are ready
ensureLogsDirAndFiles().then(() => {
  // Middleware
  app.use(express.json());
  app.use(requestLogger); // Log all requests

  // Example CORS setup
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // Adjust as per your security needs
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  // Routes
  app.use("/users", userRoutes);
  app.use("/auth", authRoutes);
  app.use("/", logRoutes);
  app.use("/git", gitRoutes);
  app.use("/chat", chatRoutes);
  app.use("/notifications", notificationRoutes);

  // Error handling middleware should be placed after routes
  app.use(errorHandlingMiddleware);

  // Connect to MongoDB
  connectDB();

  // Start server
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
