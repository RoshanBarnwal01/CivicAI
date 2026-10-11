const express = require("express");
const router = express.Router();
const Issue = require("../models/Issue");
const { auth } = require("../middleware/auth");

// POST: Create new report & Intercept with AI Microservice
router.post("/", auth, async (req, res) => {
    try {
        const { title, category, description, address, municipality, location } = req.body;
        let aiCategory = category;
        let aiSeverity = "medium";
        let aiConfidence = 0;

        try {
            const aiText = `${title}. ${description}`;
            const catResponse = await fetch("http://localhost:8000/ai/predict-category", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: aiText })
            });
            const sevResponse = await fetch("http://localhost:8000/ai/predict-severity", {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: aiText })
            });

            const catData = await catResponse.json();
            const sevData = await sevResponse.json();

            if (catData.confidence >= 0.7) {
                aiCategory = catData.predicted_category;
                aiConfidence = catData.confidence;
            }
            aiSeverity = sevData.predicted_severity;
        } catch (aiError) {
            console.error("⚠️ AI Microservice Offline. Bypassing AI sorting.");
        }

        // Format location properly for GeoJSON / Schema requirements ([lng, lat])
        const lat = location?.lat || 22.5726;
        const lng = location?.lng || 88.3639;

        const newIssue = new Issue({
            title,
            category: aiCategory,
            severity: aiSeverity,
            ai_confidence: aiConfidence,
            description,
            address: address || "Kolkata, West Bengal",
            municipality: municipality || "Kolkata Municipal Corporation",
            location: {
                type: "Point",
                coordinates: [lng, lat],
                lat: lat,
                lng: lng
            },
            user: req.user._id,
            status: "open"
        });

        await newIssue.save();
        console.log(`✅ Saved new issue to Database: ${title}`);
        res.status(201).json(newIssue);
    } catch (err) {
        console.error("🔴 ISSUE SUBMIT DATABASE ERROR:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET: Citizen fetches their own reports
router.get("/my-reports", auth, async (req, res) => {
    try {
        const issues = await Issue.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// GET: Officer fetches ALL global reports
router.get("/all", auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ message: "Access denied." });
        }
        const issues = await Issue.find().sort({ ai_confidence: -1, createdAt: -1 });
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: "Server error fetching all issues" });
    }
});

// PUT: Officer updates an issue's status
router.put("/:id/status", auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') return res.status(403).json({ message: "Access denied." });
        const { status } = req.body;
        const updatedIssue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updatedIssue);
    } catch (err) {
        res.status(500).json({ message: "Server error updating status" });
    }
});

// DELETE: Officer removes/deletes an issue report
router.delete("/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ message: "Access denied." });
        }
        await Issue.findByIdAndDelete(req.params.id);
        res.json({ message: "Issue deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error deleting issue" });
    }
});

module.exports = router;