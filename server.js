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
const WebSocketService = require("./src/services/websocketService");
const http = require("http");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Ensure log directory and files are ready
ensureLogsDirAndFiles().then(() => {
  // Middleware
  app.use(express.json());
  app.use(requestLogger);

  // CORS setup (use cors package or adjust headers as needed)
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
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

  // Initialize WebSocket Service
  new WebSocketService(server);

  // Connect to MongoDB
  connectDB();

  // Start server on the same port for HTTP and WebSocket
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
