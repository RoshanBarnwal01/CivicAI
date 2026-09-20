// server.js = the entry point. It starts the Express server,
// loads settings from .env, connects to MongoDB, and mounts the routes.
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Middleware: parse JSON bodies + allow our frontend to call this API.
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));

// Health check so anyone can confirm the server is alive.
app.get("/", (req, res) => res.json({ status: "ok", message: "CivicPulse API running" }));

// Routes (mount = attach a URL path prefix to a file of handlers)
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/issues", require("./routes/issue.routes"));

// 404 handler: unknown paths get a clear JSON message.
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Connect to the database first, then start listening.
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`ðŸš€ Server running on http://localhost:${PORT}`));
});