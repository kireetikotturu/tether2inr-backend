const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const nodemailer = require("nodemailer");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Registration
exports.register = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
      referralCode: Joi.string().optional().allow(""),
    });
    const { email, password, referralCode } = await schema.validateAsync(req.body);

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered." });

    let referredBy = null;
    if (referralCode) {
      const refUser = await User.findOne({ referralCode });
      if (!refUser) return res.status(400).json({ error: "Invalid referral code." });
      referredBy = referralCode;
    }

    const hash = await bcrypt.hash(password, 10);
    let uniqueReferral;
    let duplicate;
    do {
      uniqueReferral = generateReferralCode();
      duplicate = await User.findOne({ referralCode: uniqueReferral });
    } while (duplicate);

    await User.create({
      email,
      password: hash,
      referralCode: uniqueReferral,
      referredBy,
    });

    // Generate and store hashed OTP
    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    await OTP.deleteMany({ email }); // Remove old OTPs
    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send email
    await transporter.sendMail({
      from: `"tether2inr" <${EMAIL_USER}>`,
      to: email,
      subject: "Your tether2inr Email Verification Code",
      html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: "Registration successful. OTP sent to email." });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ error: err.details[0].message });
    next(err);
  }
};

// Verify OTP
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required." });

    const otpEntry = await OTP.findOne({ email });
    if (!otpEntry) return res.status(400).json({ error: "OTP not found. Please register or resend OTP." });
    if (otpEntry.expiresAt < new Date()) return res.status(400).json({ error: "OTP expired. Please resend." });

    const valid = await bcrypt.compare(otp, otpEntry.otp);
    if (!valid) return res.status(400).json({ error: "Invalid OTP." });

    await User.updateOne({ email }, { isVerified: true });

    await OTP.deleteMany({ email });

    res.json({ message: "Email verified! You can now login." });
  } catch (err) {
    next(err);
  }
};

// Resend OTP
exports.resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found." });
    if (user.isVerified) return res.status(400).json({ error: "Email already verified." });

    // Rate limit: Only allow resend every 1 min
    const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    if (recentOtp && (Date.now() - recentOtp.createdAt.getTime()) < 60000)
      return res.status(429).json({ error: "Please wait before resending OTP." });

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await transporter.sendMail({
      from: `"tether2inr" <${EMAIL_USER}>`,
      to: email,
      subject: "Your tether2inr Email Verification Code",
      html: `<p>Your OTP code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    });

    res.json({ message: "OTP resent." });
  } catch (err) {
    next(err);
  }
};

// Login
exports.login = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });
    const { email, password } = await schema.validateAsync(req.body);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials." });
    if (!user.isVerified) return res.status(403).json({ error: "Email not verified." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials." });

    // Only "venombar122@gmail.com" is admin
    const role = user.email === "venombar122@gmail.com" ? "admin" : "user";
    if (user.role !== role) {
      user.role = role;
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Updated: Return usdtBalance and referralCode as well
    res.json({
      token,
      role,
      email: user.email,
      usdtBalance: user.usdtBalance,
      referralCode: user.referralCode,
    });
  } catch (err) {
    if (err.isJoi) return res.status(400).json({ error: err.details[0].message });
    next(err);
  }
};