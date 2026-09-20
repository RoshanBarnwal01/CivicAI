// Issue model = the shape of every complaint stored in MongoDB.
const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    // Category & severity can be predicted by the AI service later.
    category: { type: String, enum: ["pothole", "garbage", "water", "other"], default: "other" },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    // GeoJSON Point. IMPORTANT: order is [longitude, latitude] â€” NOT [lat, lng]!
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    imageUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    upvotes: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    remarks: [{ text: String, by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, createdAt: Date }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    priorityScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// 2dsphere index = lets MongoDB answer "which issues are near this point?" fast.
issueSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Issue", issueSchema);