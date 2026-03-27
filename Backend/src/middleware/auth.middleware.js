const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const ENV = require("../lib/env");

function getTokenFromRequest(req) {
  const cookieToken = req.cookies?.jwt;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

const protectRoute = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = protectRoute;
