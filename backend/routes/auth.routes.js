const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let bcrypt;
try {
    bcrypt = require("bcryptjs");
} catch (err) {
    bcrypt = require("bcrypt");
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// 1. REGISTER CITIZEN ACCOUNT
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please enter all required fields." });
        }

        const cleanEmail = email.trim().toLowerCase();

        if (cleanEmail === "gov") {
            return res.status(400).json({ message: "Reserved Officer ID cannot be registered." });
        }

        // Case-insensitive lookup
        let existingUser = await User.findOne({
            email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
        });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists. Please sign in." });
        }

        const user = new User({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: "citizen"
        });

        await user.save();

        // Force single-hashed password directly in MongoDB (bypasses User.js pre-save double hashing)
        await User.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword, email: cleanEmail, __v: 1 } }
        );

        const token = jwt.sign(
            { _id: user._id, id: user._id, email: cleanEmail, role: "citizen" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: cleanEmail,
                role: "citizen"
            }
        });
    } catch (err) {
        console.error("Register Error:", err.message);
        res.status(500).json({ message: "Server error during registration." });
    }
});

// 2. LOGIN (CITIZEN & OFFICER)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password." });
        }

        const cleanInput = email.trim();

        // Hardcoded Municipal Officer Bypass
        if (cleanInput.toLowerCase() === "gov") {
            if (password !== "1122") {
                return res.status(401).json({ message: "Invalid Officer credentials." });
            }
            const officerToken = jwt.sign(
                { _id: "admin_999", id: "admin_999", email: "gov", role: "officer" },
                JWT_SECRET,
                { expiresIn: "7d" }
            );
            return res.json({
                token: officerToken,
                user: {
                    _id: "admin_999",
                    name: "Chief Municipal Officer",
                    email: "gov",
                    role: "officer"
                }
            });
        }

        // Citizen Lookup (Case-insensitive)
        const cleanEmail = cleanInput.toLowerCase();
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials. Account not found." });
        }

        let isMatch = await bcrypt.compare(password, user.password);

        // Auto-repair accounts that were double-hashed before this fix (__v === 0)
        if (!isMatch && user.__v === 0) {
            const salt = await bcrypt.genSalt(10);
            const fixedHash = await bcrypt.hash(password, salt);
            await User.updateOne(
                { _id: user._id },
                { $set: { password: fixedHash, email: cleanEmail, __v: 1 } }
            );
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials. Incorrect password." });
        }

        const token = jwt.sign(
            { _id: user._id, id: user._id, email: user.email, role: "citizen" },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: "citizen"
            }
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server error during login." });
    }
});

module.exports = router;