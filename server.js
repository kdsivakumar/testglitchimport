const express = require("express");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const ensureLogsDirAndFiles = require("./src/utils/logUtils");
const requestLogger = require("./src/middlewares/requestLogger");
const errorHandler = require("./src/middlewares/errorHandler");
const connectDB = require("./src/config/dbMango");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure log directory and files are ready
ensureLogsDirAndFiles().then(() => {
  // Middleware
  app.use(express.json());
  app.use(requestLogger); // Log all requests

  // Routes
  app.use("/users", userRoutes);
  app.use("/auth", authRoutes);

  // Error handling middleware should be placed after routes
  app.use(errorHandler);

  // Connect to MongoDB
  connectDB();

  // Start server
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
