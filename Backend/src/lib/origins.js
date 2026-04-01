const ENV = require("./env.js");

function normalizeOrigin(origin) {
  return origin?.trim().replace(/\/$/, "");
}

function getAllowedOrigins() {
  const origins = [
    ENV.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://chatifyhere.netlify.app",
    "https://chatifyhere.netlify.app",
    "https://chatify-0cv3.onrender.com",
    "https://chatify-0cv3.onrender.com",
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

  const normalized = normalizeOrigin(origin);

  // allow common preview hosts that may use subdomains or path variations
  const genericAllowed = /^(https?:\/\/)?([a-z0-9-]+\.)?(netlify\.app|onrender\.com)$/i;

  if (genericAllowed.test(normalized)) {
    return true;
  }

  return getAllowedOrigins().includes(normalized);
}

module.exports = {
  getAllowedOrigins,
  isAllowedOrigin,
  normalizeOrigin,
};
