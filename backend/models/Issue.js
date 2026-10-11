const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  severity: { type: String, default: 'medium' },
  ai_confidence: { type: Number, default: 0 },
  description: { type: String, required: true },
  address: { type: String, required: true },
  municipality: { type: String, required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model("Issue", issueSchema);