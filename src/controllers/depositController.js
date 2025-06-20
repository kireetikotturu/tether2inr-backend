const Deposit = require("../models/Deposit");
const User = require("../models/User");

exports.createDeposit = async (req, res, next) => {
  try {
    const { amount, txHash, network } = req.body;
    if (!amount || !txHash || !network) return res.status(400).json({ error: "All fields required" });

    const deposit = await Deposit.create({
      user: req.user.userId,
      amount,
      txHash,
      network,
    });
    res.json({ message: "Deposit request submitted.", deposit });
  } catch (err) {
    next(err);
  }
};

exports.getMyDeposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    next(err);
  }
};

// ...existing code

exports.listAllDeposits = async (req, res, next) => {
  try {
    const deposits = await Deposit.find({}).populate("user", "email").sort({ createdAt: -1 });
    res.json(deposits);
  } catch (err) {
    next(err);
  }
};

exports.updateDepositStatus = async (req, res, next) => {
  try {
    const { depositId } = req.params;
    const { status } = req.body; // "approved" or "rejected"
    const deposit = await Deposit.findById(depositId);
    if (!deposit) return res.status(404).json({ error: "Deposit not found" });
    if (deposit.status !== "pending") return res.status(400).json({ error: "Already processed" });

    deposit.status = status;
    await deposit.save();

    // If approved, add to user's balance
    if (status === "approved") {
      const user = await require("../models/User").findById(deposit.user);
      user.usdtBalance += deposit.amount;
      await user.save();
    }

    res.json({ message: "Deposit status updated", deposit });
  } catch (err) {
    next(err);
  }
};