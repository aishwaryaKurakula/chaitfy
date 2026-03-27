const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.route.js");
const messageRoutes = require("./routes/message.route.js");
const connectDB = require("./lib/db.js");
const ENV = require("./lib/env.js");
const arcjetProtection = require("./middleware/arcjet.middleware.js");
const { app, server } = require("./lib/socket.js");

dotenv.config();

const PORT = ENV.PORT || 3000;

const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Keep this after CORS and parsers
// app.use(arcjetProtection);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../Frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../Frontend/dist/index.html"));
  });
}

server.listen(PORT, async () => {
  try {
    await connectDB();
    // console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
});
