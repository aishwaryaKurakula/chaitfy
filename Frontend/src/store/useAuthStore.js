import { create } from "zustand";
import axiosInstance from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  socket: null,

  /* ================= INIT ================= */
  init: () => {
    const token = localStorage.getItem("token");
    if (token) {
      set({ authUser: { token } });
      get().connectSocket();
    } else {
      set({ isCheckingAuth: false });
    }
  },

  /* ================= CHECK AUTH ================= */
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      const user = res.data?.user;
      const token = localStorage.getItem("token");

      if (!user) throw new Error("No user found");

      set({ authUser: { ...user, token: token || null } });
      get().connectSocket();
    } catch (error) {
      console.error("CheckAuth error:", error);
      set({ authUser: null });
      get().disconnectSocket();
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  /* ================= SIGNUP ================= */
  signup: async (data) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!data.email || !emailRegex.test(data.email.trim())) {
      toast.error("Invalid email format");
      return;
    }

    if (!data.password || data.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      const { token, user } = res.data || {};

      if (!token || !user) throw new Error("Invalid signup response");

      localStorage.setItem("token", token);
      set({ authUser: { ...user, token } });

      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  /* ================= LOGIN ================= */
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      const { token, user } = res.data || {};

      if (!token || !user) throw new Error("Invalid login response");

      localStorage.setItem("token", token);
      set({ authUser: { ...user, token } });

      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  /* ================= LOGOUT ================= */
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      get().disconnectSocket();
      localStorage.removeItem("token");
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(error.response?.data?.message || "Error logging out");
    }
  },

  
/* ================= UPDATE USERNAME ================= */
updateUsername: async (username) => {
  try {
    const res = await axiosInstance.put("/auth/username", {
      username, // ✅ fixed
    });

    set((state) => ({
      authUser: { ...state.authUser, username: res.data.username },
    }));

    toast.success("Username updated successfully");
    return res.data;
  } catch (error) {
    console.error("Update username error:", error);
    toast.error(
      error.response?.data?.message || "Error updating username"
    );
    throw error;
  }
},

/* ================= CHANGE PASSWORD ================= */
changePassword: async (currentPassword, newPassword) => {
  try {
    if (!currentPassword || !newPassword) {
      toast.error("All fields required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const res = await axiosInstance.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });

    toast.success(res.data.message || "Password updated");
    return res.data;
  } catch (error) {
    console.error("Change password error:", error);
    toast.error(
      error.response?.data?.message || "Error changing password"
    );
    throw error;
  }
},

/* ================= UPDATE PROFILE ================= */
updateProfile: async (data) => {
  try {
    set({ isUpdatingProfile: true });

    const res = await axiosInstance.put("/auth/profile-pic", data);

    set((state) => ({
      authUser: { ...state.authUser, ...res.data },
    }));

    toast.success("Profile updated successfully");
  } catch (error) {
    console.error("Update profile error:", error);
    toast.error(
      error.response?.data?.message || "Error updating profile"
    );
  } finally {
    set({ isUpdatingProfile: false });
  }
},



  /* ================= SOCKET ================= */
  connectSocket: () => {
    if (get().socket) return;

    const token = get().authUser?.token || localStorage.getItem("token");
    if (!token) return;

    const socket = io(BASE_URL, {
      withCredentials: true,
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    socket.on("onlineUsers", (users) => {
      set({ onlineUsers: users || [] });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
      console.log("Socket disconnected");
    }
  },
}));

export default useAuthStore;