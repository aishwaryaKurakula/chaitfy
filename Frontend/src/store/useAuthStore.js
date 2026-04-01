import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import axiosInstance, { BACKEND_ORIGIN } from "../lib/axios";

function getRequestErrorMessage(error, fallbackMessage) {
  if (error?.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  if (!error?.response) {
    return "Unable to reach the server. Please check the backend URL and try again.";
  }

  return error.response?.data?.message || error.message || fallbackMessage;
}

function getSocketUrl() {
  const envSocketUrl = import.meta.env.VITE_SOCKET_URL;

  if (envSocketUrl) {
    return envSocketUrl.replace(/\/$/, "");
  }

  if (BACKEND_ORIGIN) {
    const normalized = BACKEND_ORIGIN.replace(/\/$/, "");

    if (
      normalized === window.location.origin &&
      import.meta.env.MODE !== "development"
    ) {
      console.warn(
        "VITE_SOCKET_URL is not set and BACKEND_ORIGIN matches frontend host. " +
          "If backend is on a different domain, set VITE_SOCKET_URL to backend URL.",
      );
    }

    return normalized;
  }

  if (import.meta.env.MODE === "development") {
    return "http://localhost:3000";
  }

  return null;
}

const SOCKET_URL = getSocketUrl();
console.info("[CHATIFY] SOCKET_URL resolved to:", SOCKET_URL);

const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  socket: null,

  init: () => {
    const token = localStorage.getItem("token");

    if (token) {
      get().checkAuth();
      return;
    }

    set({ isCheckingAuth: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    set({ isCheckingAuth: true });

    try {
      const res = await axiosInstance.get("/auth/check");
      const user = res.data?.user;

      if (!user) {
        throw new Error("No user found");
      }

      set({ authUser: { ...user, token } });
      get().connectSocket();
    } catch (error) {
      console.error("Check auth error:", error);
      localStorage.removeItem("token");
      set({ authUser: null });
      get().disconnectSocket();
    } finally {
      set({ isCheckingAuth: false });
    }
  },

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

      if (!token || !user) {
        throw new Error("Invalid signup response");
      }

      localStorage.setItem("token", token);
      set({ authUser: { ...user, token } });
      get().connectSocket();
      toast.success("Account created successfully");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error(getRequestErrorMessage(error, "Signup failed"));
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login", data);
      const { token, user } = res.data || {};

      if (!token || !user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", token);
      set({ authUser: { ...user, token } });
      get().connectSocket();
      toast.success("Logged in successfully");
    } catch (error) {
      console.error("Login error:", error);
      toast.error(getRequestErrorMessage(error, "Login failed"));
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      get().disconnectSocket();
      localStorage.removeItem("token");
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out successfully");
    }
  },

  updateUsername: async (username) => {
    try {
      const trimmedUsername = username.trim();

      if (!trimmedUsername) {
        toast.error("Username is required");
        return null;
      }

      const res = await axiosInstance.put("/auth/username", {
        username: trimmedUsername,
      });

      set((state) => ({
        authUser: state.authUser
          ? { ...state.authUser, username: res.data.username }
          : state.authUser,
      }));

      toast.success("Username updated successfully");
      return res.data;
    } catch (error) {
      console.error("Update username error:", error);
      toast.error(error.response?.data?.message || "Error updating username");
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      if (!currentPassword || !newPassword) {
        toast.error("All fields are required");
        return null;
      }

      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return null;
      }

      const res = await axiosInstance.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success(res.data.message || "Password updated");
      return res.data;
    } catch (error) {
      console.error("Change password error:", error);
      toast.error(error.response?.data?.message || "Error changing password");
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isUpdatingProfile: true });

      const res = await axiosInstance.put("/auth/profile-pic", data);

      set((state) => ({
        authUser: state.authUser
          ? { ...state.authUser, ...res.data }
          : state.authUser,
      }));

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const existingSocket = get().socket;
    const token = get().authUser?.token || localStorage.getItem("token");

    if (!token || !SOCKET_URL) {
      if (!SOCKET_URL && import.meta.env.MODE !== "development") {
        console.warn("Socket connection skipped: backend socket URL is not configured");
      }
      return;
    }

    if (existingSocket) {
      if (existingSocket.connected) {
        return;
      }

      existingSocket.removeAllListeners();
      existingSocket.disconnect();
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("onlineUsers", (users) => {
      set({ onlineUsers: Array.isArray(users) ? users.map(String) : [] });
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
      set({ onlineUsers: [] });
    });

    socket.on("connect_error", (error) => {
      const message = error?.message || "Socket connection failed";
      console.error(`Socket connection error (${SOCKET_URL}):`, message);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;

    if (!socket) {
      return;
    }

    socket.removeAllListeners();
    socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));

export default useAuthStore;
