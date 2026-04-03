const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const User = require("../models/User.js");
const Message = require("../models/message.js");
const ENV = require("./env.js");
const { isAllowedOrigin } = require("./origins.js");

const app = express();
const server = http.createServer(app);

const userSocketMap = new Map();

async function updateUserLastSeen(userId) {
  if (!userId) {
    return null;
  }

  const lastSeen = new Date();
  await User.findByIdAndUpdate(userId, { lastSeen });
  return lastSeen;
}

async function markPendingMessagesAsDelivered(userId) {
  const deliveredAt = new Date();
  const pendingMessages = await Message.find({
    receiverId: userId,
    groupId: null,
    requestStatus: "accepted",
    isUnsent: false,
    deliveredAt: null,
  }).select("_id senderId");

  if (!pendingMessages.length) {
    return;
  }

  await Message.updateMany(
    {
      _id: { $in: pendingMessages.map((message) => message._id) },
    },
    {
      $set: { deliveredAt },
    },
  );

  pendingMessages.forEach((message) => {
    emitToUser(message.senderId, "messageStatusUpdated", {
      messageId: String(message._id),
      deliveredAt,
      readAt: null,
      status: "delivered",
    });
  });
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

function emitPresenceUpdate(userId, payload = {}) {
  io.emit("userPresenceUpdated", {
    userId: String(userId),
    ...payload,
  });
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
  markPendingMessagesAsDelivered(socket.userId).catch((error) => {
    console.error("Failed to mark pending messages as delivered:", error.message);
  });
  emitOnlineUsers();
  emitPresenceUpdate(socket.userId, {
    isOnline: true,
    lastSeen: socket.user.lastSeen || null,
  });

  socket.on("disconnect", async () => {
    const userSockets = userSocketMap.get(socket.userId);
    let lastSeen = null;

    if (userSockets) {
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        userSocketMap.delete(socket.userId);
        lastSeen = await updateUserLastSeen(socket.userId);
      } else {
        userSocketMap.set(socket.userId, userSockets);
      }
    }

    console.log(`Socket disconnected for ${socket.user.username}: ${socket.id}`);
    emitOnlineUsers();
    emitPresenceUpdate(socket.userId, {
      isOnline: Boolean(userSocketMap.get(socket.userId)?.size),
      lastSeen,
    });
  });
});

module.exports = {
  io,
  app,
  server,
  emitToUser,
  getReceiverSocketId,
  emitPresenceUpdate,
  updateUserLastSeen,
};
