const router = require("express").Router();
const withdrawalCtrl = require("../controllers/withdrawalController");
const { authMiddleware } = require("../middleware/auth");
const { adminMiddleware } = require("../middleware/admin");
console.log("withdrawalCtrl:", withdrawalCtrl);

router.post("/", authMiddleware, withdrawalCtrl.createWithdrawal);
router.get("/my", authMiddleware, withdrawalCtrl.getMyWithdrawals);

// Admin routes:
router.get("/all", authMiddleware, adminMiddleware, withdrawalCtrl.listAllWithdrawals);
router.patch("/:withdrawalId/status", authMiddleware, adminMiddleware, withdrawalCtrl.updateWithdrawalStatus);

module.exports = router;


