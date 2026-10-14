const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const auth = require("../middleware/auth");

// 1. CREATE ISSUE (Citizen)
router.post("/", auth, async (req, res) => {
    try {
        const { title, description, category, address, municipality, location } = req.body;

        let finalCategory = category || "General";
        let finalSeverity = "medium";
        let aiConfidence = 0.85;

        // Fast 1.5s timeout so cloud server never hangs when local AI server is offline
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
                    if (catData.category) finalCategory = catData.category;
                    if (catData.confidence) aiConfidence = catData.confidence;
                }
                if (sevRes.ok) {
                    const sevData = await sevRes.json();
                    if (sevData.severity) finalSeverity = sevData.severity.toLowerCase();
                }
            } catch (aiErr) {
                // Fallback silently if AI service is unreachable
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
        res.json(issues);
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