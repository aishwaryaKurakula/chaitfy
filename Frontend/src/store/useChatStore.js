import { create } from "zustand";
import toast from "react-hot-toast";
import axiosInstance from "../lib/axios";
import useAuthStore from "./useAuthStore";

function isAuthError(error) {
  return (
    error?.response?.status === 401 ||
    error?.response?.data?.message === "No token provided" ||
    error?.response?.data?.message === "Invalid token" ||
    error?.response?.data?.message === "User not found"
  );
}

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: true,
  isMessagesLoading: false,
  messageListenerAttachedTo: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Failed to load contacts");
      }
      set({ allContacts: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Failed to load chats");
      }
      set({ chats: [] });
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const { authUser } = useAuthStore.getState();

    if (!selectedUser?._id || !authUser?._id) {
      toast.error("Select a user before sending a message");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text || "",
      image: messageData.image || "",
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );

      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId ? res.data : message,
        ),
      }));
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((message) => message._id !== tempId),
      }));
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { messageListenerAttachedTo } = get();

    if (!socket) {
      return;
    }

    if (messageListenerAttachedTo === socket.id) {
      return;
    }

    const handleNewMessage = (newMessage) => {
      const { selectedUser } = get();
      const selectedUserId = selectedUser?._id;

      if (!selectedUserId) {
        return;
      }

      const senderId = String(newMessage.senderId);
      const receiverId = String(newMessage.receiverId);
      const activeUserId = String(selectedUserId);

      if (senderId !== activeUserId && receiverId !== activeUserId) {
        return;
      }

      set((state) => {
        const alreadyExists = state.messages.some(
          (message) => message._id === newMessage._id,
        );

        if (alreadyExists) {
          return state;
        }

        return { messages: [...state.messages, newMessage] };
      });
    };

    socket.off("newMessage");
    socket.on("newMessage", handleNewMessage);
    set({ messageListenerAttachedTo: socket.id });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      set({ messageListenerAttachedTo: null });
      return;
    }

    socket.off("newMessage");
    set({ messageListenerAttachedTo: null });
  },
}));

export default useChatStore;
