const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const issueRoutes = require("./routes/issues.routes"); // Adjust if your file is named differently

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/issues", issueRoutes);

// CLOUD-READY CONFIGURATION: Fallback to local if env variables are not present
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/civicpulse";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    // Removed '127.0.0.1' so Render can expose the server to the internet
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 MongoDB Connection Failed:", err.message);
  });