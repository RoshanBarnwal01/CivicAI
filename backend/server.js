const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 1. CORS & JSON Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// 2. Request Tracker (Logs every request to the terminal so we know it connected)
app.use((req, res, next) => {
  console.log(`➡️  Incoming request: ${req.method} ${req.url}`);
  next();
});

// 3. Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/issues", require("./routes/issue.routes"));

// 4. Database Connection & Server Start (Forced to 127.0.0.1)
const PORT = 5005;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/civicpulse";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    // Explicitly bind to IPv4 local address
    app.listen(PORT, "127.0.0.1", () => {
      console.log(`🚀 Server running strictly at http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("🔴 MongoDB Connection Failed:", err.message);
  });