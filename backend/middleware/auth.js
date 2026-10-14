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

        // Only treat as officer if explicitly the 'gov' / 'admin_999' account
        if (decoded.email === "gov" || decoded._id === "admin_999" || decoded.id === "admin_999") {
            req.user = {
                _id: "admin_999",
                id: "admin_999",
                email: "gov",
                role: "officer",
                name: "Chief Municipal Officer"
            };
            return next();
        }

        const userId = decoded._id || decoded.id;
        const user = userId ? await User.findById(userId).select("-password") : null;

        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        req.user = {
            _id: user._id,
            id: user._id,
            email: user.email,
            role: "citizen",
            name: user.name
        };
        next();
    } catch (err) {
        console.error("🔴 AUTH MIDDLEWARE ERROR:", err.message);
        res.status(401).json({ message: "Token is not valid" });
    }
};

// Export as both default function and named { auth } property so no route file ever crashes
auth.auth = auth;
module.exports = auth;