const express = require("express");

const {
  getAllContacts,
  getIncomingRequests,
  getBlockedUsers,
  getMessagesByUserId,
  sendMessage,
  acceptMessageRequest,
  rejectMessageRequest,
  markMessagesAsRead,
  blockUser,
  unblockUser,
  deleteMessage,
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
router.get("/requests", getIncomingRequests);
router.get("/blocked", getBlockedUsers);
router.post("/requests/:id/accept", acceptMessageRequest);
router.post("/requests/:id/reject", rejectMessageRequest);
router.post("/read/:id", markMessagesAsRead);
router.post("/block/:id", blockUser);
router.post("/unblock/:id", unblockUser);
router.delete("/:id", deleteMessage);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);

module.exports = router;
