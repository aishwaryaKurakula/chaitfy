const express = require("express");

const {
  getAllContacts,
  getMessagesByUserId,
  sendMessage,
  getChatPartners,
} = require("../controllers/message.controller.js");

const protectRoute = require("../middleware/auth.middleware.js");
const arcjetProtection = require("../middleware/arcjet.middleware.js");

const router = express.Router();
// router.use(arcjetProtection);
router.use(protectRoute);

// Routes
router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

module.exports = router;