const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No authentication token" });
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");

        // BYPASS DATABASE LOOKUP FOR OFFICER
        if (decoded.email === 'gov' || decoded.role === 'officer') {
            req.user = { _id: "admin_999", email: "gov", role: "officer", name: "Chief Municipal Officer" };
            return next();
        }

        // STANDARD CITIZEN LOOKUP
        const user = await User.findById(decoded._id).select("-password");
        if (!user) {
            return res.status(401).json({ message: "Token is valid, but user no longer exists" });
        }

        req.user = { _id: user._id, email: user.email, role: user.role || 'citizen', name: user.name };
        next();
    } catch (err) {
        console.error("🔴 AUTH MIDDLEWARE ERROR:", err.message);
        res.status(401).json({ message: "Token is not valid" });
    }
};

module.exports = { auth };