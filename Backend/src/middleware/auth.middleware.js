
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const ENV = require("../lib/env");

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "No token" });
    }
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    console.log("req.user:", req.user);
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = protectRoute;




















