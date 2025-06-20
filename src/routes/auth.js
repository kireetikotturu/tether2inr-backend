const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const authCtrl = require("../controllers/authController");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many requests, try again later." },
});

router.post("/register", limiter, authCtrl.register);
router.post("/verify-otp", limiter, authCtrl.verifyOtp);
router.post("/resend-otp", limiter, authCtrl.resendOtp);
router.post("/login", limiter, authCtrl.login);

module.exports = router;