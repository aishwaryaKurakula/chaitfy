const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const  ENV  = require("../lib/env.js");

const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from socket auth
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log("❌ No token provided");
      return next(new Error("Unauthorized"));
    }

    // Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("❌ User not found");
      return next(new Error("Unauthorized"));
    }

    // Attach user
    socket.user = user;
    socket.userId = user._id.toString();

    console.log("✅ Socket authenticated:", user.username);

    next();
  } catch (err) {
    console.log("❌ Socket auth error:", err.message);
    next(new Error("Unauthorized"));
  }
};

module.exports = socketAuthMiddleware;