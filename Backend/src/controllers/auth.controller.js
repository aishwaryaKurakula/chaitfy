const bcrypt = require("bcryptjs");
const generateToken = require("../lib/utils.js");
const User = require("../models/User.js");
const {
  sendWelcomeEmail,
  sendLoginAlertEmail,
} = require("../emails/emailHandlers.js");
const ENV = require("../lib/env.js");
const cloudinary = require("cloudinary").v2;

/* ========================= SIGNUP ========================= */
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // validations
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must have at least 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // generate token
    const token = generateToken(newUser._id, res);

    // send email (non-blocking)
    try {
      await sendWelcomeEmail(
        newUser.email,
        newUser.username,
        ENV.CLIENT_URL
      );
    } catch (err) {
      console.error("Email error:", err.message);
    }

    return res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profilePic: newUser.profilePic,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ========================= LOGIN ========================= */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id, res);
    const loginTime = new Date().toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "long",
      timeZone: "Asia/Kolkata",
    });

    try {
      await sendLoginAlertEmail(
        user.email,
        user.username,
        loginTime,
        ENV.CLIENT_URL
      );
    } catch (err) {
      console.error("Login email error:", err.message);
    }

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* ========================= LOGOUT ========================= */
const logout = async (_, res) => {
  res.cookie("jwt", "", {
    ...generateToken.getCookieOptions(),
    maxAge: 0,
  });

  return res.status(200).json({ message: "Logged out successfully" });
};

/* ========================= UPDATE PROFILE PIC ========================= */
const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({
        message: "Profile picture is required",
      });
    }

    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    ).select("-password");

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ========================= UPDATE USERNAME ========================= */
const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        message: "Username is required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.username = username;
    await user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Username update error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========================= CHANGE PASSWORD ========================= */

/* ========================= CHANGE PASSWORD ========================= */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password change error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


/* ========================= EXPORTS ========================= */
module.exports = {
  signup,
  login,
  logout,
  updateProfile,
  updateUsername,
  changePassword,
};
