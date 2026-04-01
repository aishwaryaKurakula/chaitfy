const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const connectDB = require("./lib/db.js");
const ENV = require("./lib/env.js");
const { getAllowedOrigins, isAllowedOrigin } = require("./lib/origins.js");
const authRoutes = require("./routes/auth.route.js");
const messageRoutes = require("./routes/message.route.js");
const groupRoutes = require("./routes/group.route.js");
const { app, server } = require("./lib/socket.js");

const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin: [
    "https://chatify.vercel.app",
    "http://localhost:5173",
    ...allowedOrigins.filter(
      (origin) =>
        origin !== "https://chatify.vercel.app" &&
        origin !== "http://localhost:5173"
    ),
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const preflightCorsOptions = {
  ...corsOptions,
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin) || corsOptions.origin.includes(origin)) {
      return callback(null, true);
    }

    console.error("Blocked CORS origin:", origin);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
};

app.use(cors(corsOptions));
app.options(/.*/, cors(preflightCorsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    environment: ENV.NODE_ENV || "development",
    allowedOrigins,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

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

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};
