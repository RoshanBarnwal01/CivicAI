// User model = the shape of every user record stored in MongoDB.
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // We never store the raw password, only a secure hash of it.
    passwordHash: { type: String, required: true },
    // role decides what this user can do in the app.
    role: { type: String, enum: ["citizen", "officer", "admin"], default: "citizen" },
  },
  { timestamps: true }
);

// Before saving: convert plain password into a hash (bcrypt = secure password scrambler).
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

// Helper used at login: compare typed password with stored hash.
userSchema.methods.comparePassword = function (entered) {
  return bcrypt.compare(entered, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);