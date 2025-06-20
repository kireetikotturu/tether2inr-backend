const router = require("express").Router();
const { authMiddleware } = require("../middleware/auth");
const userBankController = require("../controllers/userBankController");

// ...other user routes

// Bank accounts
router.get("/bank-accounts", authMiddleware, userBankController.listBankAccounts);
router.post("/bank-accounts", authMiddleware, userBankController.addBankAccount);

module.exports = router;