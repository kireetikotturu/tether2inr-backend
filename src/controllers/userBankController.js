const BankDetail = require("../models/BankDetail");
const User = require("../models/User");

// List all bank accounts for logged-in user
exports.listBankAccounts = async (req, res, next) => {
  try {
    const banks = await BankDetail.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(banks);
  } catch (err) {
    next(err);
  }
};

// Add a new bank account
exports.addBankAccount = async (req, res, next) => {
  try {
    const { accountNumber, ifsc, holderName } = req.body;
    if (!accountNumber || !ifsc || !holderName) return res.status(400).json({ error: "All fields required." });

    // Prevent duplicates for the same user
    const exists = await BankDetail.findOne({ user: req.user.userId, accountNumber, ifsc });
    if (exists) return res.status(400).json({ error: "Bank account already saved." });

    const bank = await BankDetail.create({
      user: req.user.userId,
      accountNumber,
      ifsc,
      holderName
    });

    // Optionally, save to user's savedBankDetails array
    await User.findByIdAndUpdate(req.user.userId, { $addToSet: { savedBankDetails: bank._id } });

    res.json(bank);
  } catch (err) {
    next(err);
  }
};