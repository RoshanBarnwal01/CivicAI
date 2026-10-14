const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const auth = require("../middleware/auth");

function analyzeCivicIssue(title = "", description = "", selectedCategory = "") {
    const text = `${title} ${description}`.toLowerCase().trim();

    const highKeywords = [
        "high", "huge", "urgent", "emergency", "critical", "severe", "severity",
        "danger", "dangerous", "massive", "burst", "accident", "crash",
        "injury", "injured", "deep", "fire", "smoke", "spark", "shock",
        "electrocut", "live wire", "exposed wire", "short circuit",
        "collapse", "collapsed", "sinkhole", "flood", "flooding",
        "waterlogging", "submerged", "sewage", "contaminated", "toxic",
        "blocking", "blocked", "unpassable", "hospital", "school",
        "ambulance", "hazard", "hazardous", "major", "worst", "deadly",
        "fatal", "open manhole", "uncovered manhole", "fallen tree",
        "fallen pole", "gas leak", "explosion", "big problem", "huge problem"
    ];

    const lowKeywords = [
        "low", "minor", "small", "slight", "little", "cosmetic",
        "faded", "not urgent", "slow", "dust", "peeling", "tiny"
    ];

    const mediumKeywords = [
        "medium", "moderate", "leak", "leaking", "broken", "outage",
        "overflow", "overflowing", "pothole", "crater", "damaged",
        "damage", "garbage", "trash", "rubbish", "waste", "dump",
        "filth", "stink", "smell", "odor", "dark", "street light",
        "streetlight", "lamp", "flickering", "not working", "drain",
        "drainage", "clogged", "choked", "stagnant", "mosquito",
        "pipe", "no water", "water supply", "low pressure", "repair",
        "crack", "bad condition", "unsafe", "dirty", "issue", "problem"
    ];

    let severity = "medium";
    let confidence = 0.85;

    if (highKeywords.some((kw) => text.includes(kw))) {
        severity = "high";
        confidence = 0.94;
    } else if (lowKeywords.some((kw) => text.includes(kw))) {
        severity = "low";
        confidence = 0.82;
    } else if (mediumKeywords.some((kw) => text.includes(kw))) {
        severity = "medium";
        confidence = 0.86;
    } else if (text.length < 12) {
        severity = "low";
        confidence = 0.78;
    }

    let category = selectedCategory || "General";
    return { severity, category, confidence };
}

// 1. CREATE ISSUE (Citizen)
router.post("/", auth, async (req, res) => {
    try {
        const { title, description, category, address, municipality, location } = req.body;

        const aiResult = analyzeCivicIssue(title, description, category);

        let coordinates = [88.3639, 22.5726];
        if (location) {
            if (Array.isArray(location.coordinates) && location.coordinates.length === 2) {
                coordinates = [Number(location.coordinates[0]), Number(location.coordinates[1])];
            } else if (location.lng !== undefined && location.lat !== undefined) {
                coordinates = [Number(location.lng), Number(location.lat)];
            }
        }

        const userId = req.user._id || req.user.id;

        const newIssue = new Issue({
            title,
            description,
            category: aiResult.category,
            severity: aiResult.severity,
            aiConfidence: aiResult.confidence,
            address: address || "Pinned Location",
            municipality: municipality || "Kolkata Municipal Corporation",
            location: {
                type: "Point",
                coordinates
            },
            ...(userId && userId !== "admin_999" ? { user: userId } : {})
        });

        const savedIssue = await newIssue.save();
        res.status(201).json(savedIssue);
    } catch (err) {
        console.error("Create Issue Error:", err.message);
        res.status(500).json({ message: "Failed to register complaint", error: err.message });
    }
});

// 2. GET LOGGED-IN CITIZEN'S REPORTS
router.get("/my-reports", auth, async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        if (userId === "admin_999") {
            return res.json([]);
        }
        const issues = await Issue.find({ user: userId }).sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch reports" });
    }
});

// 3. GET ALL GLOBAL REPORTS (Officer Command Center)
router.get("/all", auth, async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });

        // Unconditionally synchronize severity on all reports
        const updatedIssues = await Promise.all(
            issues.map(async (doc) => {
                const recheck = analyzeCivicIssue(doc.title, doc.description, doc.category);
                if (doc.severity !== recheck.severity) {
                    doc.severity = recheck.severity;
                    await doc.save().catch(() => { });
                }
                return doc;
            })
        );

        res.json(updatedIssues);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch global issues" });
    }
});

// 4. UPDATE ISSUE STATUS (Officer)
router.put("/:id/status", auth, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Issue.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Issue not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Failed to update status" });
    }
});

// 5. DELETE ISSUE (Officer)
router.delete("/:id", auth, async (req, res) => {
    try {
        await Issue.findByIdAndDelete(req.params.id);
        res.json({ message: "Issue deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete issue" });
    }
});

module.exports = router;