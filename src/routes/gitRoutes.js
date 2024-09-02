const express = require("express");
const router = express.Router();
const gitWebhookController = require("../controllers/gitWebhookController");

// POST route for Git webhook
router.post("/webhook", gitWebhookController.handleWebhook);
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Test successful" });
});

module.exports = router;
