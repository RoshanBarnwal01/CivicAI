// Auth routes: signup and login for citizens, login for staff.
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth, staffOnly } = require("../middleware/auth");

// Helper: create the login token (JWT = a signed digital ID card).
const makeToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

// POST /api/auth/citizen/signup
router.post("/citizen/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: "name, email and password are required" });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: "Email already registered" });

        const user = await User.create({ name, email, passwordHash: password, role: "citizen" });
        res.status(201).json({ token: makeToken(user), user: { id: user._id, name, email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/auth/citizen/login
router.post("/citizen/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password)))
            return res.status(401).json({ message: "Wrong email or password" });
        res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// POST /api/auth/staff/login â€” same idea, but only staff accounts pass.
router.post("/staff/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password)))
            return res.status(401).json({ message: "Wrong email or password" });
        if (!["admin", "officer"].includes(user.role))
            return res.status(403).json({ message: "This login is for staff only" });
        res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/auth/me â€” returns the logged-in user (handy for the frontend).
router.get("/me", auth, (req, res) => {
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

module.exports = router;