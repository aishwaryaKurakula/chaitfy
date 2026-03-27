const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const connectDB = require("./lib/db.js");
const ENV = require("./lib/env.js");
const authRoutes = require("./routes/auth.route.js");
const messageRoutes = require("./routes/message.route.js");
const { app, server } = require("./lib/socket.js");

function getAllowedOrigins() {
  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ENV.CLIENT_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean);
}

function normalizeOrigin(origin) {
  return origin?.replace(/\/$/, "");
}

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed = allowedOrigins.some(
        (allowedOrigin) => normalizeOrigin(allowedOrigin) === normalizeOrigin(origin),
      );

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", environment: ENV.NODE_ENV || "development" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

async function startServer() {
  await connectDB();

  server.listen(ENV.PORT || 3000, () => {
    console.log(`Server listening on port ${ENV.PORT || 3000}`);
  });
}

startServer();
