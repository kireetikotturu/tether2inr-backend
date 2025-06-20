const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const BankDetail = require("../models/BankDetail");

exports.createWithdrawal = async (req, res, next) => {
  try {
    const { amount, bankAccountId } = req.body;
    if (!amount || !bankAccountId) return res.status(400).json({ error: "All fields required" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.usdtBalance < amount) return res.status(400).json({ error: "Insufficient USDT balance" });

    const bankDetail = await BankDetail.findOne({ _id: bankAccountId, user: req.user.userId });
    if (!bankDetail) return res.status(400).json({ error: "Bank account not found" });

    user.usdtBalance -= amount;
    await user.save();

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      bankDetails: {
        accountNumber: bankDetail.accountNumber,
        ifsc: bankDetail.ifsc,
        holderName: bankDetail.holderName
      }
    });

    res.json({ message: "Withdrawal request submitted.", withdrawal });
  } catch (err) {
    next(err);
  }
};

// GET /my
exports.getMyWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    next(err);
  }
};

// GET /all
exports.listAllWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({}).populate("user", "email").sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    next(err);
  }
};

// PATCH /:withdrawalId/status
exports.updateWithdrawalStatus = async (req, res, next) => {
  try {
    const { withdrawalId } = req.params;
    const { status } = req.body; // "approved" or "rejected"
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });
    if (withdrawal.status !== "pending") return res.status(400).json({ error: "Already processed" });

    withdrawal.status = status;
    await withdrawal.save();

    // If rejected, refund USDT to user
    if (status === "rejected") {
      const user = await User.findById(withdrawal.user);
      user.usdtBalance += withdrawal.amount;
      await user.save();
    }

    res.json({ message: "Withdrawal status updated", withdrawal });
  } catch (err) {
    next(err);
  }
};