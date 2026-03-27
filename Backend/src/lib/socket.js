const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User.js");
const ENV = require("./env.js");

const app = express();
const server = http.createServer(app);

const userSocketMap = new Map();

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

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  return getAllowedOrigins().some(
    (allowedOrigin) => normalizeOrigin(allowedOrigin) === normalizedOrigin,
  );
}

function getOnlineUsers() {
  return Array.from(userSocketMap.entries())
    .filter(([, socketIds]) => socketIds.size > 0)
    .map(([userId]) => userId);
}

function getReceiverSocketId(userId) {
  const socketIds = userSocketMap.get(String(userId));
  return socketIds ? Array.from(socketIds)[0] : null;
}

function emitOnlineUsers() {
  io.emit("onlineUsers", getOnlineUsers());
}

function emitToUser(userId, eventName, payload) {
  const socketIds = userSocketMap.get(String(userId));

  if (!socketIds?.size) {
    return false;
  }

  io.to(Array.from(socketIds)).emit(eventName, payload);
  return true;
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by Socket.IO CORS`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized: No token provided"));
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("Unauthorized: User not found"));
    }

    socket.user = user;
    socket.userId = user._id.toString();
    return next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    return next(new Error("Unauthorized: Invalid token"));
  }
});

io.on("connection", (socket) => {
  if (!socket.userId) {
    socket.disconnect(true);
    return;
  }

  const existingSockets = userSocketMap.get(socket.userId) || new Set();
  existingSockets.add(socket.id);
  userSocketMap.set(socket.userId, existingSockets);

  console.log(`Socket connected for ${socket.user.username}: ${socket.id}`);
  emitOnlineUsers();

  socket.on("disconnect", () => {
    const userSockets = userSocketMap.get(socket.userId);

    if (userSockets) {
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        userSocketMap.delete(socket.userId);
      } else {
        userSocketMap.set(socket.userId, userSockets);
      }
    }

    console.log(`Socket disconnected for ${socket.user.username}: ${socket.id}`);
    emitOnlineUsers();
  });
});

module.exports = {
  io,
  app,
  server,
  emitToUser,
  getReceiverSocketId,
};
