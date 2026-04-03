const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  updateProfile,
  updateUsername,
  changePassword,
} = require("../controllers/auth.controller.js");

const protectRoute = require("../middleware/auth.middleware.js");
const arcjetProtection = require("../middleware/arcjet.middleware.js");

// ================= AUTH =================
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", protectRoute, logout);

// ================= USER =================

// ✅ update profile picture
router.put("/profile-pic", protectRoute, updateProfile);

// ✅ update username (YOU WERE MISSING THIS)
router.put("/username", protectRoute, updateUsername);

// ✅ change password (YOU WERE MISSING THIS)
router.put("/change-password", protectRoute, changePassword);

// ================= CHECK AUTH =================
router.get("/check", protectRoute, (req, res) => {
  res.status(200).json({
    message: "You are authenticated",
    user: req.user,
  });
});

module.exports = router;
