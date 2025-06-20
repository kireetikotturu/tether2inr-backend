const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  txHash: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  network: { type: String, enum: ["TRC20", "ERC20"], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Deposit", depositSchema);