const mongoose = require("mongoose");
const Group = require("../models/Group.js");
const Message = require("../models/message.js");
const User = require("../models/User.js");
const cloudinary = require("../lib/cloudinary");
const { emitToUser } = require("../lib/socket.js");

const DEFAULT_GROUP_IMAGE =
  "https://ui-avatars.com/api/?name=Chatify+Group&background=10b981&color=ffffff";

async function getNormalizedGroupsForUser(userId) {
  const groups = await Group.find({ members: userId })
    .populate("members", "_id username profilePic")
    .populate("creatorId", "_id username")
    .sort({ updatedAt: -1 })
    .lean();

  const groupIds = groups.map((group) => group._id);

  const latestMessages = await Message.aggregate([
    { $match: { groupId: { $in: groupIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$groupId",
        lastMessage: { $first: "$text" },
        lastMessageHasImage: { $first: { $toBool: "$image" } },
        lastMessageAt: { $first: "$createdAt" },
      },
    },
  ]);

  const latestByGroupId = new Map(
    latestMessages.map((item) => [item._id.toString(), item])
  );

  return groups.map((group) => {
    const latest = latestByGroupId.get(group._id.toString());

    return {
      ...group,
      isGroup: true,
      lastMessage: latest?.lastMessage || "",
      lastMessageHasImage: latest?.lastMessageHasImage || false,
      lastMessageAt: latest?.lastMessageAt || group.updatedAt,
      unreadCount: 0,
    };
  });
}

const createGroup = async (req, res) => {
  try {
    const { name, description = "", memberIds = [] } = req.body;
    const creatorId = req.user._id;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const uniqueMembers = [
      ...new Set([...memberIds.map(String), creatorId.toString()]),
    ];

    if (uniqueMembers.length < 2) {
      return res.status(400).json({
        message: "Add at least one other member to create a group",
      });
    }

    const members = await User.find({ _id: { $in: uniqueMembers } }).select("_id");

    if (members.length !== uniqueMembers.length) {
      return res.status(400).json({ message: "Some selected members were not found" });
    }

    const group = await Group.create({
      name: name.trim(),
      description: description.trim(),
      creatorId,
      members: uniqueMembers,
      image: DEFAULT_GROUP_IMAGE,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("members", "_id username profilePic")
      .populate("creatorId", "_id username");

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const normalizedGroups = await getNormalizedGroupsForUser(userId);
    res.status(200).json(normalizedGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findOne({ _id: id, members: userId });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    await Message.updateMany(
      {
        groupId: id,
        senderId: { $ne: userId },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
      }
    );

    const messages = await Message.find({ groupId: id })
      .populate("senderId", "_id username profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const senderId = req.user._id;
    const { id } = req.params;

    if (!text && !image) {
      return res.status(400).json({ message: "Message text or image is required" });
    }

    const group = await Group.findOne({ _id: id, members: senderId }).populate(
      "members",
      "_id"
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    let imageUrl = "";
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      groupId: group._id,
      text,
      image: imageUrl,
      readBy: [senderId],
    });

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "_id username profilePic"
    );

    await Group.findByIdAndUpdate(group._id, { $set: { updatedAt: new Date() } });

    group.members.forEach((member) => {
      emitToUser(member._id, "newGroupMessage", populatedMessage);
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateGroup = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;
    const { name, description, image } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.creatorId.toString() !== userId) {
      return res.status(403).json({ message: "Only the group creator can edit the group" });
    }

    if (name?.trim()) {
      group.name = name.trim();
    }

    if (typeof description === "string") {
      group.description = description.trim();
    }

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      group.image = uploadResponse.secure_url;
    }

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "_id username profilePic")
      .populate("creatorId", "_id username")
      .lean();

    updatedGroup.isGroup = true;
    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addGroupMembers = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;
    const { memberIds = [] } = req.body;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.creatorId.toString() !== userId) {
      return res.status(403).json({ message: "Only the group creator can add members" });
    }

    const newMemberIds = [...new Set(memberIds.map(String))].filter(
      (memberId) => !group.members.some((existing) => existing.toString() === memberId)
    );

    if (!newMemberIds.length) {
      return res.status(400).json({ message: "No new members selected" });
    }

    const users = await User.find({ _id: { $in: newMemberIds } }).select("_id");
    if (users.length !== newMemberIds.length) {
      return res.status(400).json({ message: "Some selected members were not found" });
    }

    group.members.push(...newMemberIds);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "_id username profilePic")
      .populate("creatorId", "_id username");

    res.status(200).json({ ...updatedGroup.toObject(), isGroup: true });
  } catch (error) {
    console.error("Error adding members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const removeGroupMember = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id, memberId } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.creatorId.toString() !== userId) {
      return res.status(403).json({ message: "Only the group creator can remove members" });
    }

    if (memberId === group.creatorId.toString()) {
      return res.status(400).json({ message: "Creator cannot be removed from the group" });
    }

    group.members = group.members.filter((member) => member.toString() !== memberId);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate("members", "_id username profilePic")
      .populate("creatorId", "_id username");

    res.status(200).json({ ...updatedGroup.toObject(), isGroup: true });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { id } = req.params;

    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some((member) => member.toString() === userId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    if (group.creatorId.toString() === userId) {
      if (group.members.length === 1) {
        await Group.findByIdAndDelete(id);
        await Message.deleteMany({ groupId: id });
        return res.status(200).json({ message: "Group deleted successfully" });
      }

      const nextCreator = group.members.find((member) => member.toString() !== userId);
      group.creatorId = nextCreator;
    }

    group.members = group.members.filter((member) => member.toString() !== userId);
    await group.save();

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupMessages,
  sendGroupMessage,
  updateGroup,
  addGroupMembers,
  removeGroupMember,
  leaveGroup,
};
