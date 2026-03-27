const jwt = require("jsonwebtoken");
const ENV = require("./env.js");

function getCookieOptions() {
  const isProduction = ENV.NODE_ENV === "production";

  return {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  };
}

const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, getCookieOptions());
  return token;
};

generateToken.getCookieOptions = getCookieOptions;

module.exports = generateToken;
