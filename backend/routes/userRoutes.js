const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

router.get("/me", auth, async (req, res) => {
    try {
        if (req.user.email === "gov" || req.user._id === "admin_999") {
            return res.json({
                _id: "admin_999",
                name: "Chief Municipal Officer",
                email: "gov",
                role: "officer"
            });
        }

        const user = await User.findById(req.user._id || req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: "citizen"
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;