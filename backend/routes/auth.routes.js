const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // HARDCODED OFFICER BYPASS
        if (email === 'gov') {
            if (password === '1122') {
                const token = jwt.sign(
                    { _id: "admin_999", email: "gov", role: "officer" },
                    process.env.JWT_SECRET || "fallback_secret_key",
                    { expiresIn: "24h" }
                );
                return res.status(200).json({
                    token,
                    user: { _id: "admin_999", name: "Chief Municipal Officer", email: "gov", role: "officer" }
                });
            } else {
                return res.status(400).json({ message: "Invalid officer passcode." });
            }
        }

        // STANDARD CITIZEN LOGIN
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password." });

        const token = jwt.sign(
            { _id: user._id, role: user.role || 'citizen' },
            process.env.JWT_SECRET || "fallback_secret_key",
            { expiresIn: "24h" }
        );

        res.status(200).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        res.status(500).json({ message: "Server error during login." });
    }
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Prevent regular users from registering as 'gov'
        if (email === 'gov') return res.status(400).json({ message: "Reserved ID" });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, role: role || 'citizen' });
        await user.save();

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET || "fallback_secret_key");
        res.status(201).json({ token });
    } catch (err) {
        res.status(500).json({ message: "Server error during registration." });
    }
});

module.exports = router;