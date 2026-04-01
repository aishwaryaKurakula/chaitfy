const Message = require("../models/message.js");
const User = require("../models/User.js");
const cloudinary = require("../lib/cloudinary");
const mongoose = require("mongoose");
const { emitToUser } = require("../lib/socket.js");

const getAllContacts = async (req, res) => {
  try {
    console.log("🔥 REQ.USER IN CONTROLLER:", req.user); // check if user reached controller

    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.log("Controller Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id } = req.params;

    const userToChatId = new mongoose.Types.ObjectId(id);

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    console.log("MESSAGES FOUND:", messages.length);

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessagesByUserId:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    const { text, image } = req.body;
    const senderId = req.user?._id;
    const { id: receiverId } = req.params;
    // Check authentication
    if (!senderId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Validate message
    if (!text && !image) {
      return res.status(400).json({
        message: "Message text or image is required",
      });
    }
    // Prevent sending message to yourself
    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        message: "Cannot send message to yourself",
      });
    }
    // Check if receiver exists
    const receiverExists = await User.findById(receiverId);
    if (!receiverExists) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    // Upload image if exists
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    // Create new message
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    await newMessage.save();

    emitToUser(receiverId, "newMessage", newMessage);
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
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

    const chatPartnerIds = [...latestMessageByPartnerId.keys()];

    // remove self just in case
    const filteredIds = chatPartnerIds.filter(
      (id) => id !== loggedInUserId.toString(),
    );

    const chatPartners = await User.find({ _id: { $in: filteredIds } })
      .select("-password")
      .lean();

    const orderedChatPartners = filteredIds
      .map((id) => {
        const user = chatPartners.find((partner) => partner._id.toString() === id);
        const latestMessage = latestMessageByPartnerId.get(id);

        if (!user || !latestMessage) {
          return null;
        }

        return {
          ...user,
          lastMessage: latestMessage.text || "",
          lastMessageHasImage: Boolean(latestMessage.image),
          lastMessageAt: latestMessage.createdAt,
        };
      })
      .filter(Boolean);

    res.status(200).json(orderedChatPartners);
  } catch (error) {
    console.error("Error in getChatPartners:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  getAllContacts,
  getMessagesByUserId,
  sendMessage,
  getChatPartners,
};
