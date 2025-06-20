const router = require("express").Router();
const depositCtrl = require("../controllers/depositController");
const { authMiddleware } = require("../middleware/auth");
const { adminMiddleware } = require("../middleware/admin");


router.post("/", authMiddleware, depositCtrl.createDeposit);
router.get("/my", authMiddleware, depositCtrl.getMyDeposits);

// Admin routes:
router.get("/all", authMiddleware, adminMiddleware, depositCtrl.listAllDeposits);
router.patch("/:depositId/status", authMiddleware, adminMiddleware, depositCtrl.updateDepositStatus);

module.exports = router;