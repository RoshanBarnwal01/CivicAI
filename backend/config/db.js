// This file connects our server to the MongoDB database.
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("âœ… MongoDB connected");
    } catch (err) {
        console.error("âŒ MongoDB connection failed:", err.message);
        process.exit(1); // stop the server if DB is not reachable
    }
};

module.exports = connectDB;