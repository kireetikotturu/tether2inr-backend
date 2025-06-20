const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  usdtBalance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null }, // stores referralCode of referring user
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  savedBankDetails: [{ type: mongoose.Schema.Types.ObjectId, ref: "BankDetail" }],
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);