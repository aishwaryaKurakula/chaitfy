const Message = require("../models/message.js");
const User = require("../models/User.js");
const cloudinary = require("../lib/cloudinary");
const mongoose = require("mongoose");
const { emitToUser } = require("../lib/socket.js");

function includesId(list = [], id) {
  return list.some((item) => String(item) === String(id));
}

async function getUsersByPendingRequestReceiver(receiverId) {
  const pendingMessages = await Message.find({
    receiverId,
    groupId: null,
    requestStatus: "pending",
  }).sort({ createdAt: -1 });

  const latestBySender = new Map();
  pendingMessages.forEach((message) => {
    const senderKey = String(message.senderId);
    if (!latestBySender.has(senderKey)) {
      latestBySender.set(senderKey, message);
    }
  });

  const senderIds = [...latestBySender.keys()];
  const senders = await User.find({ _id: { $in: senderIds } }).select("-password").lean();

  return senderIds
    .map((senderId) => {
      const sender = senders.find((user) => String(user._id) === senderId);
      const latestMessage = latestBySender.get(senderId);
      if (!sender || !latestMessage) {
        return null;
      }

      return {
        ...sender,
        relationshipStatus: "pending_incoming",
        lastMessage: latestMessage.text || "",
        lastMessageHasImage: Boolean(latestMessage.image),
        lastMessageAt: latestMessage.createdAt,
      };
    })
    .filter(Boolean);
}

async function getPendingOutgoingUserIds(senderId) {
  const rows = await Message.find({
    senderId,
    groupId: null,
    requestStatus: "pending",
  }).select("receiverId");

  return new Set(rows.map((row) => String(row.receiverId)));
}

async function getRelationshipStatus(currentUser, otherUserId) {
  if (includesId(currentUser.blockedUsers, otherUserId)) {
    return "blocked";
  }

  if (includesId(currentUser.acceptedContacts, otherUserId)) {
    return "accepted";
  }

  const hasIncomingPending = await Message.exists({
    senderId: otherUserId,
    receiverId: currentUser._id,
    groupId: null,
    requestStatus: "pending",
  });

  if (hasIncomingPending) {
    return "pending_incoming";
  }

  const hasOutgoingPending = await Message.exists({
    senderId: currentUser._id,
    receiverId: otherUserId,
    groupId: null,
    requestStatus: "pending",
  });

  if (hasOutgoingPending) {
    return "pending_outgoing";
  }

  return "none";
}

const getAllContacts = async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user._id).select("-password").lean();
    const loggedInUserId = loggedInUser._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password").lean();

    const incomingRequests = await getUsersByPendingRequestReceiver(loggedInUserId);
    const incomingRequestIds = new Set(incomingRequests.map((user) => String(user._id)));
    const outgoingRequestIds = await getPendingOutgoingUserIds(loggedInUserId);

    const normalizedUsers = users.map((user) => {
      let relationshipStatus = "none";

      if (includesId(loggedInUser.blockedUsers, user._id)) {
        relationshipStatus = "blocked";
      } else if (includesId(loggedInUser.acceptedContacts, user._id)) {
        relationshipStatus = "accepted";
      } else if (incomingRequestIds.has(String(user._id))) {
        relationshipStatus = "pending_incoming";
      } else if (outgoingRequestIds.has(String(user._id))) {
        relationshipStatus = "pending_outgoing";
      }

      return {
        ...user,
        relationshipStatus,
      };
    });

    res.status(200).json(normalizedUsers);
  } catch (error) {
    console.log("Controller Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const requests = await getUsersByPendingRequestReceiver(req.user._id);
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error loading requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("blockedUsers", "_id username email profilePic")
      .lean();

    res.status(200).json(user?.blockedUsers || []);
  } catch (error) {
    console.error("Error loading blocked users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const currentUser = await User.findById(myId).lean();
    const relationshipStatus = await getRelationshipStatus(currentUser, id);

    if (relationshipStatus === "blocked") {
      return res.status(403).json({ message: "You have blocked this user" });
    }

    const userToChatId = new mongoose.Types.ObjectId(id);

    if (relationshipStatus === "accepted") {
      await Message.updateMany(
        {
          senderId: userToChatId,
          receiverId: myId,
          groupId: null,
          readAt: null,
          requestStatus: "accepted",
        },
        {
          $set: { readAt: new Date() },
        },
      );
    }

    const messages = await Message.find({
      groupId: null,
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({
      relationshipStatus,
      messages,
    });
  } catch (error) {
    console.log("Error in getMessagesByUserId:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const senderId = req.user?._id;
    const { id: receiverId } = req.params;

    if (!senderId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!text && !image) {
      return res.status(400).json({
        message: "Message text or image is required",
      });
    }

    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        message: "Cannot send message to yourself",
      });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    if (includesId(sender.blockedUsers, receiverId)) {
      return res.status(403).json({ message: "Unblock this user before messaging them" });
    }

    if (includesId(receiver.blockedUsers, senderId)) {
      return res.status(403).json({ message: "This user has blocked you" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const isAccepted = includesId(sender.acceptedContacts, receiverId);
    const requestStatus = isAccepted ? "accepted" : "pending";

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      requestStatus,
    });
    await newMessage.save();

    emitToUser(receiverId, "newMessage", newMessage);

    res.status(201).json({
      ...newMessage.toObject(),
      relationshipStatus: requestStatus === "accepted" ? "accepted" : "pending_outgoing",
    });
  } catch (error) {
    console.log("Error in sendMessage controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const acceptMessageRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id: senderId } = req.params;

    await Message.updateMany(
      {
        senderId,
        receiverId: currentUserId,
        groupId: null,
        requestStatus: "pending",
      },
      {
        $set: {
          requestStatus: "accepted",
          readAt: new Date(),
        },
      }
    );

    await Promise.all([
      User.findByIdAndUpdate(currentUserId, {
        $addToSet: { acceptedContacts: senderId },
      }),
      User.findByIdAndUpdate(senderId, {
        $addToSet: { acceptedContacts: currentUserId },
      }),
    ]);

    res.status(200).json({ message: "Message request accepted" });
  } catch (error) {
    console.error("Error accepting request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const rejectMessageRequest = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id: senderId } = req.params;

    await Message.deleteMany({
      senderId,
      receiverId: currentUserId,
      groupId: null,
      requestStatus: "pending",
    });

    res.status(200).json({ message: "Message request rejected" });
  } catch (error) {
    console.error("Error rejecting request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const blockUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id: blockedUserId } = req.params;

    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { blockedUsers: blockedUserId },
      $pull: { acceptedContacts: blockedUserId },
    });

    await User.findByIdAndUpdate(blockedUserId, {
      $pull: { acceptedContacts: currentUserId },
    });

    await Message.deleteMany({
      senderId: blockedUserId,
      receiverId: currentUserId,
      groupId: null,
      requestStatus: "pending",
    });

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { id: blockedUserId } = req.params;

    await User.findByIdAndUpdate(currentUserId, {
      $pull: { blockedUsers: blockedUserId },
    });

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getChatPartners = async (req, res) => {
  try {
    const loggedInUser = await User.findById(req.user._id).lean();
    const loggedInUserId = loggedInUser._id;

    const messages = await Message.find({
      groupId: null,
      requestStatus: "accepted",
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    }).sort({ createdAt: -1 });

    const latestMessageByPartnerId = new Map();

    messages.forEach((msg) => {
      const partnerId = msg.senderId.equals(loggedInUserId)
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (!latestMessageByPartnerId.has(partnerId)) {
        latestMessageByPartnerId.set(partnerId, msg);
      }
    });

    const chatPartnerIds = [...latestMessageByPartnerId.keys()].filter(
      (id) => id !== loggedInUserId.toString() && !includesId(loggedInUser.blockedUsers, id)
    );

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } })
      .select("-password")
      .lean();

    const orderedChatPartners = chatPartnerIds
      .map((id) => {
        const user = chatPartners.find((partner) => partner._id.toString() === id);
        const latestMessage = latestMessageByPartnerId.get(id);

        if (!user || !latestMessage) {
          return null;
        }

        return {
          ...user,
          relationshipStatus: "accepted",
          lastMessage: latestMessage.text || "",
          lastMessageHasImage: Boolean(latestMessage.image),
          lastMessageAt: latestMessage.createdAt,
          unreadCount: messages.filter(
            (message) =>
              message.senderId.toString() === id &&
              message.receiverId.toString() === loggedInUserId.toString() &&
              !message.readAt,
          ).length,
        };
      })
      .filter(Boolean);

    res.status(200).json(orderedChatPartners);
  } catch (error) {
    console.error("Error in getChatPartners:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    await Message.findByIdAndDelete(id);

    res.status(200).json({ message: "Message deleted successfully", messageId: id });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllContacts,
  getIncomingRequests,
  getBlockedUsers,
  getMessagesByUserId,
  sendMessage,
  acceptMessageRequest,
  rejectMessageRequest,
  blockUser,
  unblockUser,
  deleteMessage,
  getChatPartners,
};
