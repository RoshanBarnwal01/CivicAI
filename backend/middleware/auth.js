// Auth middleware = the security guard of the API.
// It reads the login token (JWT) from the request header, checks it,
// and only lets the request through if the token is valid.
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        // Expected header: Authorization: Bearer <token>
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
        if (!token) return res.status(401).json({ message: "No token, login required" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: "User no longer exists" });

        req.user = user; // attach the logged-in user to the request
        next(); // allow the request to continue to the route
    } catch {
        res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Same as auth, but also checks the user is admin or officer.
const staffOnly = (req, res, next) => {
    if (req.user && ["admin", "officer"].includes(req.user.role)) return next();
    res.status(403).json({ message: "Staff access only" });
};

module.exports = { auth, staffOnly };