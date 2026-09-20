// Issue routes: create, list, view, upvote and manage complaints.
const router = require("express").Router();
const Issue = require("../models/Issue");
const { auth, staffOnly } = require("../middleware/auth");

// ---------- PRIORITY SCORE ----------
// Transparent 0-100 score so authorities know what to fix first.
const SEVERITY_POINTS = { low: 20, medium: 50, high: 80 };
const calcPriority = (issue) => {
    let score = SEVERITY_POINTS[issue.severity] || 20;
    score += Math.min(3 * (issue.upvotes + issue.duplicateCount), 15); // crowd bonus
    const daysOpen = Math.floor((Date.now() - new Date(issue.createdAt)) / 86400000);
    score += Math.min(2 * daysOpen, 15); // urgency bonus
    return Math.max(0, Math.min(100, Math.round(score)));
};

// POST /api/issues â€” report a new issue (citizen must be logged in)
router.post("/", auth, async (req, res) => {
    try {
        const { title, description, category, severity, location, imageUrl, audioUrl } = req.body;
        if (!title || !description || !location)
            return res.status(400).json({ message: "title, description and location are required" });

        const issue = await Issue.create({
            title,
            description,
            category: category || "other",
            severity: severity || "medium",
            location, // { type: "Point", coordinates: [lng, lat] }
            imageUrl: imageUrl || "",
            audioUrl: audioUrl || "",
            createdBy: req.user._id,
        });

        issue.priorityScore = calcPriority(issue);
        await issue.save();
        res.status(201).json({ issue });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/issues â€” list issues. Sorted by priority (default). Optional filters.
router.get("/", async (req, res) => {
    try {
        const { status, category, sort } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;

        const sortRule = sort === "new" ? { createdAt: -1 } : { priorityScore: -1 };
        const issues = await Issue.find(filter).sort(sortRule).limit(100);
        res.json({ issues });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/issues/:id â€” one issue's full details
router.get("/:id", async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id).populate("createdBy", "name");
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        res.json({ issue });
    } catch {
        res.status(400).json({ message: "Invalid issue id" });
    }
});

// POST /api/issues/:id/upvote â€” +1 support from a citizen
router.post("/:id/upvote", auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: "Issue not found" });
        if (issue.status === "resolved")
            return res.status(400).json({ message: "Already resolved" });

        issue.upvotes += 1;
        issue.priorityScore = calcPriority(issue);
        await issue.save();
        res.json({ issue });
    } catch {
        res.status(400).json({ message: "Invalid issue id" });
    }
});

module.exports = router;