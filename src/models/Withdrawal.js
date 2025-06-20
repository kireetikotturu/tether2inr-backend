const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  // Change bankDetails from String to Object
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    holderName: String
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Withdrawal", withdrawalSchema);