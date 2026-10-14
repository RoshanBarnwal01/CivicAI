const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const auth = require("../middleware/auth");

// Built-in AI Triage Engine (Runs natively on Render with 0ms latency)
function analyzeCivicIssue(title = "", description = "", selectedCategory = "") {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Explicit Low-Severity Indicators
    const lowKeywords = [
        "low", "minor", "small", "slight", "little", "cosmetic",
        "faded", "not urgent", "slow", "dust", "peeling"
    ];

    // 2. High / Critical Severity Indicators
    const highKeywords = [
        "high", "huge", "urgent", "emergency", "critical", "severe",
        "danger", "dangerous", "massive", "burst", "accident", "crash",
        "injury", "injured", "deep", "fire", "smoke", "spark", "shock",
        "electrocut", "live wire", "exposed wire", "short circuit",
        "collapse", "collapsed", "sinkhole", "flood", "flooding",
        "waterlogging", "submerged", "sewage", "contaminated", "toxic",
        "blocking", "blocked", "unpassable", "hospital", "school",
        "ambulance", "hazard", "hazardous", "major", "worst", "deadly",
        "fatal", "open manhole", "uncovered manhole", "fallen tree",
        "fallen pole", "gas leak", "explosion"
    ];

    // 3. Medium Severity Indicators
    const mediumKeywords = [
        "medium", "moderate", "leak", "leaking", "broken", "outage",
        "overflow", "overflowing", "pothole", "crater", "damaged",
        "damage", "garbage", "trash", "rubbish", "waste", "dump",
        "filth", "stink", "smell", "odor", "dark", "street light",
        "streetlight", "lamp", "flickering", "not working", "drain",
        "drainage", "clogged", "choked", "stagnant", "mosquito",
        "pipe", "no water", "water supply", "low pressure", "repair",
        "crack", "bad condition", "unsafe"
    ];

    let severity = "low";
    let confidence = 0.78;

    if (highKeywords.some((kw) => text.includes(kw))) {
        severity = "high";
        confidence = 0.94;
    } else if (lowKeywords.some((kw) => text.includes(kw))) {
        severity = "low";
        confidence = 0.82;
    } else if (mediumKeywords.some((kw) => text.includes(kw))) {
        severity = "medium";
        confidence = 0.86;
    } else if (selectedCategory === "Public Safety & Hazards") {
        severity = "medium";
        confidence = 0.84;
    }

    // Auto-detect category only if none was specified
    let category = selectedCategory || "General";
    if (!selectedCategory || selectedCategory === "General") {
        if (text.includes("pothole") || text.includes("road") || text.includes("bridge") || text.includes("footpath")) {
            category = "Roads & Infrastructure";
        } else if (text.includes("water") || text.includes("drain") || text.includes("pipe") || text.includes("flood") || text.includes("sewage")) {
            category = "Water Supply & Drainage";
        } else if (text.includes("light") || text.includes("wire") || text.includes("electric") || text.includes("pole") || text.includes("shock")) {
            category = "Street Lighting & Electrical";
        } else if (text.includes("garbage") || text.includes("trash") || text.includes("waste") || text.includes("dump") || text.includes("smell")) {
            category = "Sanitation & Waste";
        } else if (text.includes("fire") || text.includes("danger") || text.includes("accident") || text.includes("hazard")) {
            category = "Public Safety & Hazards";
        }
    }

    return { severity, category, confidence };
}

// 1. CREATE ISSUE (Citizen)
router.post("/", auth, async (req, res) => {
    try {
        const { title, description, category, address, municipality, location } = req.body;

        // Run built-in AI Triage first
        const aiResult = analyzeCivicIssue(title, description, category);
        let finalCategory = aiResult.category;
        let finalSeverity = aiResult.severity;
        let aiConfidence = aiResult.confidence;

        // Optional external AI microservice override if configured in cloud
        const aiUrl = process.env.AI_SERVICE_URL;
        if (aiUrl) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 1500);

                const [catRes, sevRes] = await Promise.all([
                    fetch(`${aiUrl}/ai/predict-category`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: `${title} ${description}` }),
                        signal: controller.signal
                    }),
                    fetch(`${aiUrl}/ai/predict-severity`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: `${title} ${description}` }),
                        signal: controller.signal
                    })
                ]);
                clearTimeout(timeout);

                if (catRes.ok) {
                    const catData = await catRes.json();
                    if (catData.category && (!category || category === "General")) {
                        finalCategory = catData.category;
                    }
                    if (catData.confidence) aiConfidence = catData.confidence;
                }
                if (sevRes.ok) {
                    const sevData = await sevRes.json();
                    if (sevData.severity) finalSeverity = sevData.severity.toLowerCase();
                }
            } catch (aiErr) {
                // Built-in AI Triage result is already set
            }
        }

        // Format GeoJSON coordinates safely
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
            category: finalCategory,
            severity: finalSeverity,
            aiConfidence,
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
        console.error("Fetch My Reports Error:", err.message);
        res.status(500).json({ message: "Failed to fetch reports" });
    }
});

// 3. GET ALL GLOBAL REPORTS (Officer Command Center)
router.get("/all", auth, async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });

        // Auto-recalculate any older issues that were stuck on the old 0.85 fallback
        const updatedIssues = await Promise.all(
            issues.map(async (doc) => {
                if (doc.aiConfidence === 0.85 || !doc.severity) {
                    const recheck = analyzeCivicIssue(doc.title, doc.description, doc.category);
                    doc.severity = recheck.severity;
                    doc.aiConfidence = recheck.confidence;
                    await doc.save().catch(() => { });
                }
                return doc;
            })
        );

        res.json(updatedIssues);
    } catch (err) {
        console.error("Fetch All Issues Error:", err.message);
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