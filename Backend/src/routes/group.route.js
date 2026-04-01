const express = require("express");
const {
  createGroup,
  getGroups,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
} = require("../controllers/group.controller.js");
const protectRoute = require("../middleware/auth.middleware.js");

const router = express.Router();

router.use(protectRoute);

router.get("/", getGroups);
router.post("/", createGroup);
router.patch("/:id", updateGroup);
router.patch("/:id/members", addGroupMembers);
router.delete("/:id/members/:memberId", removeGroupMember);
router.post("/:id/leave", leaveGroup);
router.get("/:id/messages", getGroupMessages);
router.post("/:id/messages", sendGroupMessage);

module.exports = router;
