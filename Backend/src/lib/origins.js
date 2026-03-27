const ENV = require("./env.js");

function normalizeOrigin(origin) {
  return origin?.trim().replace(/\/$/, "");
}

function getAllowedOrigins() {
  const origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://chaitfy.netlify.app",
    "https://chatify.netlify.app",
    ENV.CLIENT_URL,
    process.env.FRONTEND_URL,
  ]
    .filter(Boolean)
    .map(normalizeOrigin);

  return [...new Set(origins)];
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  return getAllowedOrigins().includes(normalizeOrigin(origin));
}

module.exports = {
  getAllowedOrigins,
  isAllowedOrigin,
  normalizeOrigin,
};
