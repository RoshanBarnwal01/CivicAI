const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/userRoutes");
const issueRoutes = require("./routes/issue.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Fast Health Check to Wake Up Render Instance
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/issues", issueRoutes);

const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/civicpulse";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 MongoDB Connection Failed:", err.message);
  });