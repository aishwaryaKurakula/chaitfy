const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const ENV = require("./env.js");
const socketAuthMiddleware = require("../middleware/socket.auth.middleware");
const app = express();
const server = http.createServer(app);

// Store online users: { userId: socketId }
const userSocketMap = new Map();

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

// Middleware to authenticate socket connection
io.use(socketAuthMiddleware);

 function getReceiverSocketId(userId) {
  return userSocketMap[userId]
}

// Helper to get a receiver's socket ID by userId
function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Listen for connections
io.on("connection", (socket) => {
  console.log("connected")
  if (!socket.user) return;

  const userId = socket.user._id.toString();
  console.log("User connected:", socket.user.username);


  // Add user to online map
  userSocketMap[userId] = socket.id;

  // Notify all clients about current online users
  io.emit("onlineUsers", Object.keys(userSocketMap));

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.username);
    delete userSocketMap[userId];
    io.emit("onlineUsers", Object.keys(userSocketMap));
  });
});

module.exports = { io, app, server, getReceiverSocketId };