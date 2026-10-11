const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { auth } = require("../middleware/auth");

router.get("/me", auth, async (req, res) => {
    try {
        // RETURN HARDCODED OFFICER DATA
        if (req.user.email === 'gov' || req.user.role === 'officer') {
            return res.json({
                _id: "admin_999",
                name: "Chief Municipal Officer",
                email: "gov",
                role: "officer"
            });
        }

        // RETURN STANDARD CITIZEN DATA
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/me/avatar", auth, async (req, res) => {
    try {
        if (req.user.email === 'gov' || req.user.role === 'officer') {
            return res.status(403).json({ message: "Cannot update hardcoded officer profile." });
        }

        const { avatarUrl } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { avatarUrl },
            { new: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.error("🔴 AVATAR UPDATE ERROR:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;