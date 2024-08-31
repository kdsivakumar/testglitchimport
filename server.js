const express = require("express");
const userRoutes = require("./src/routes/userRoutes");
const authRoutes = require("./src/routes/authRoutes");
const connectDB = require("./src/config/dbMango");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware test
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/auth", authRoutes);

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
