const express = require("express");
const router = express.Router();
const gitWebhookController = require("../controllers/gitWebhookController");
const authMiddleware = require("../middlewares/authMiddleware");

// POST route for Git webhook
router.post("/webhook", authMiddleware, gitWebhookController.handleWebhook);
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Test successfull" });
});
router.get("/refresh", gitWebhookController.refresh);
module.exports = router;
