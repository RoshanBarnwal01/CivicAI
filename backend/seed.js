require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB...");

    const exists = await User.findOne({ email: "gov@admin.com" });
    if (!exists) {
        await User.create({
            name: "Demo Officer",
            email: "gov@admin.com",
            passwordHash: "1122",
            role: "officer" // This grants access to the dashboard
        });
        console.log("✅ Demo officer created! You can now log in with 'gov' and '1122'.");
    } else {
        console.log("✅ Demo officer already exists.");
    }
    process.exit();
}).catch(err => {
    console.error("Database error:", err);
    process.exit(1);
});