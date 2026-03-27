const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const ENV = require("./env.js");
const socketAuthMiddleware = require("../middleware/socket.auth.middleware");

const app = express();
const server = http.createServer(app);

const userSocketMap = {};

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://chaitfy.netlify.app",  // ✅ matches your app.js
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,        // ✅ dynamic list, not a single hardcoded string
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  if (!socket.user) return;

  const userId = socket.user._id.toString();
  console.log("User connected:", socket.user.username);

  userSocketMap[userId] = socket.id;
  io.emit("onlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.username);
    delete userSocketMap[userId];
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });
});

module.exports = { io, app, server, getReceiverSocketId };