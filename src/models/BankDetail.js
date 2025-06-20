const mongoose = require("mongoose");

const bankDetailSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  holderName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BankDetail", bankDetailSchema);