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
  groups: [],
  requests: [],
  blockedUsers: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  relationshipStatus: "none",
  isUsersLoading: true,
  isMessagesLoading: false,
  isCreatingGroup: false,
  messageListenerAttachedTo: null,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: (selectedUser) =>
    set((state) => ({
      selectedUser,
      relationshipStatus: selectedUser?.relationshipStatus || "accepted",
      chats: state.chats.map((chat) =>
        chat._id === selectedUser?._id ? { ...chat, unreadCount: 0 } : chat
      ),
    })),

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

  getGroups: async () => {
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Failed to load groups");
      }
      set({ groups: [] });
    }
  },

  getRequests: async () => {
    try {
      const res = await axiosInstance.get("/messages/requests");
      set({ requests: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Failed to load requests");
      }
      set({ requests: [] });
    }
  },

  getBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/blocked");
      set({ blockedUsers: Array.isArray(res.data) ? res.data : [] });
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Failed to load blocked users");
      }
      set({ blockedUsers: [] });
    }
  },

  createGroup: async ({ name, description = "", memberIds = [] }) => {
    set({ isCreatingGroup: true });

    try {
      const res = await axiosInstance.post("/groups", {
        name,
        description,
        memberIds,
      });

      set((state) => ({
        groups: [{ ...res.data, isGroup: true }, ...state.groups],
      }));

      toast.success("Group created successfully");
      return { ...res.data, isGroup: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  updateGroup: async (groupId, payload) => {
    try {
      const res = await axiosInstance.patch(`/groups/${groupId}`, payload);

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, ...res.data, isGroup: true } : group
        ),
        selectedUser:
          state.selectedUser?._id === groupId
            ? { ...state.selectedUser, ...res.data, isGroup: true }
            : state.selectedUser,
      }));

      toast.success("Group updated successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
      throw error;
    }
  },

  addGroupMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.patch(`/groups/${groupId}/members`, { memberIds });

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, ...res.data, isGroup: true } : group
        ),
        selectedUser:
          state.selectedUser?._id === groupId
            ? { ...state.selectedUser, ...res.data, isGroup: true }
            : state.selectedUser,
      }));

      toast.success("Members added successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
      throw error;
    }
  },

  removeGroupMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);

      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? { ...group, ...res.data, isGroup: true } : group
        ),
        selectedUser:
          state.selectedUser?._id === groupId
            ? { ...state.selectedUser, ...res.data, isGroup: true }
            : state.selectedUser,
      }));

      toast.success("Member removed successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
      throw error;
    }
  },

  leaveGroup: async (groupId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/leave`);

      set((state) => ({
        groups: state.groups.filter((group) => group._id !== groupId),
        selectedUser: state.selectedUser?._id === groupId ? null : state.selectedUser,
        messages: state.selectedUser?._id === groupId ? [] : state.messages,
      }));

      toast.success(res.data.message || "Left group successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
      throw error;
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({
        messages: Array.isArray(res.data?.messages) ? res.data.messages : [],
        relationshipStatus: res.data?.relationshipStatus || "none",
      });
      get().getMyChatPartners();
      get().getRequests();
      get().getAllContacts();
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
      set({ messages: [], relationshipStatus: "none" });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ messages: Array.isArray(res.data) ? res.data : [], relationshipStatus: "accepted" });
      get().getGroups();
    } catch (error) {
      if (!isAuthError(error)) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
      set({ messages: [] });
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  acceptRequest: async (userId) => {
    try {
      await axiosInstance.post(`/messages/requests/${userId}/accept`);
      await Promise.all([
        get().getRequests(),
        get().getMyChatPartners(),
        get().getAllContacts(),
        get().getMessagesByUserId(userId),
      ]);
      toast.success("Request accepted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
      throw error;
    }
  },

  rejectRequest: async (userId) => {
    try {
      await axiosInstance.post(`/messages/requests/${userId}/reject`);
      set((state) => ({
        requests: state.requests.filter((request) => request._id !== userId),
        messages: state.selectedUser?._id === userId ? [] : state.messages,
        relationshipStatus: state.selectedUser?._id === userId ? "none" : state.relationshipStatus,
      }));
      await get().getAllContacts();
      toast.success("Request rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
      throw error;
    }
  },

  blockUser: async (userId) => {
    try {
      await axiosInstance.post(`/messages/block/${userId}`);
      await Promise.all([
        get().getBlockedUsers(),
        get().getRequests(),
        get().getAllContacts(),
        get().getMyChatPartners(),
      ]);

      set((state) => ({
        relationshipStatus: state.selectedUser?._id === userId ? "blocked" : state.relationshipStatus,
      }));

      toast.success("User blocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
      throw error;
    }
  },

  unblockUser: async (userId) => {
    try {
      await axiosInstance.post(`/messages/unblock/${userId}`);
      await Promise.all([get().getBlockedUsers(), get().getAllContacts()]);

      if (get().selectedUser?._id === userId) {
        set({ relationshipStatus: "none" });
      }

      toast.success("User unblocked");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unblock user");
      throw error;
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
    const isGroup = Boolean(selectedUser.groupId || selectedUser.isGroup);
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: isGroup ? null : selectedUser._id,
      groupId: isGroup ? selectedUser._id : null,
      text: messageData.text || "",
      image: messageData.image || "",
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      readBy: isGroup ? [authUser._id] : [],
      requestStatus: isGroup ? "accepted" : get().relationshipStatus === "accepted" ? "accepted" : "pending",
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {
      const endpoint = isGroup
        ? `/groups/${selectedUser._id}/messages`
        : `/messages/send/${selectedUser._id}`;
      const res = await axiosInstance.post(endpoint, messageData);

      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === tempId ? res.data : message
        ),
        relationshipStatus: res.data.relationshipStatus || state.relationshipStatus,
        chats: state.chats.some((chat) => chat._id === selectedUser._id)
          ? state.chats.map((chat) =>
              chat._id === selectedUser._id
                ? {
                    ...chat,
                    lastMessage: res.data.text || "",
                    lastMessageHasImage: Boolean(res.data.image),
                    lastMessageAt: res.data.createdAt,
                  }
                : chat
            )
          : state.chats,
        groups: isGroup
          ? state.groups.map((group) =>
              group._id === selectedUser._id
                ? {
                    ...group,
                    lastMessage: res.data.text || "",
                    lastMessageHasImage: Boolean(res.data.image),
                    lastMessageAt: res.data.createdAt,
                  }
                : group
            )
          : state.groups,
      }));

      if (!isGroup && res.data.relationshipStatus !== "accepted") {
        get().getAllContacts();
        get().getRequests();
      }
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((message) => message._id !== tempId),
      }));
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      const { selectedUser } = get();

      set((state) => ({
        messages: state.messages.filter((message) => message._id !== messageId),
      }));

      if (selectedUser?.isGroup || selectedUser?.groupId) {
        await get().getGroupMessages(selectedUser._id);
        await get().getGroups();
      } else if (selectedUser?._id) {
        await get().getMessagesByUserId(selectedUser._id);
        await get().getMyChatPartners();
      }

      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
      throw error;
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
      const authUserId = useAuthStore.getState().authUser?._id;

      if (!authUserId) {
        return;
      }

      if (newMessage.requestStatus === "pending" && String(newMessage.receiverId) === String(authUserId)) {
        get().getRequests();
        get().getAllContacts();
      }

      const partnerId =
        String(newMessage.senderId) === String(authUserId)
          ? String(newMessage.receiverId)
          : String(newMessage.senderId);

      set((state) => {
        const existingChat = state.chats.find((chat) => String(chat._id) === partnerId);
        const isOpenConversation = selectedUserId && String(selectedUserId) === partnerId;

        if (newMessage.requestStatus !== "accepted") {
          return state;
        }

        if (!existingChat) {
          get().getMyChatPartners();
          return state;
        }

        const updatedChat = {
          ...existingChat,
          lastMessage: newMessage.text || "",
          lastMessageHasImage: Boolean(newMessage.image),
          lastMessageAt: newMessage.createdAt,
          unreadCount:
            String(newMessage.senderId) === String(authUserId) || isOpenConversation
              ? 0
              : (existingChat.unreadCount || 0) + 1,
        };

        return {
          chats: [updatedChat, ...state.chats.filter((chat) => String(chat._id) !== partnerId)],
        };
      });

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
        const alreadyExists = state.messages.some((message) => message._id === newMessage._id);
        if (alreadyExists) {
          return state;
        }
        return { messages: [...state.messages, newMessage] };
      });
    };

    const handleNewGroupMessage = (newMessage) => {
      const { selectedUser } = get();
      const authUserId = useAuthStore.getState().authUser?._id;
      const groupId = String(newMessage.groupId);
      const isOpenGroup =
        Boolean(selectedUser?.isGroup || selectedUser?.groupId) &&
        String(selectedUser?._id) === groupId;

      set((state) => {
        const existingGroup = state.groups.find((group) => String(group._id) === groupId);
        if (!existingGroup) {
          get().getGroups();
          return state;
        }

        const updatedGroup = {
          ...existingGroup,
          lastMessage: newMessage.text || "",
          lastMessageHasImage: Boolean(newMessage.image),
          lastMessageAt: newMessage.createdAt,
          unreadCount: isOpenGroup
            ? 0
            : String(newMessage.senderId?._id || newMessage.senderId) === String(authUserId)
              ? 0
              : (existingGroup.unreadCount || 0) + 1,
        };

        return {
          groups: [updatedGroup, ...state.groups.filter((group) => String(group._id) !== groupId)],
        };
      });

      if (!isOpenGroup) {
        return;
      }

      set((state) => {
        const alreadyExists = state.messages.some((message) => message._id === newMessage._id);
        if (alreadyExists) {
          return state;
        }

        return {
          messages: [
            ...state.messages,
            {
              ...newMessage,
              readBy:
                String(newMessage.senderId?._id || newMessage.senderId) === String(authUserId)
                  ? newMessage.readBy
                  : [...(newMessage.readBy || []), authUserId].filter(Boolean),
            },
          ],
        };
      });
    };

    const handleRequestAccepted = ({ userId }) => {
      const { selectedUser } = get();

      get().getMyChatPartners();
      get().getRequests();
      get().getAllContacts();

      if (selectedUser?._id && String(selectedUser._id) === String(userId)) {
        get().getMessagesByUserId(userId);
      }
    };

    socket.off("newMessage");
    socket.on("newMessage", handleNewMessage);
    socket.off("newGroupMessage");
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.off("requestAccepted");
    socket.on("requestAccepted", handleRequestAccepted);
    set({ messageListenerAttachedTo: socket.id });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      set({ messageListenerAttachedTo: null });
      return;
    }

    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("requestAccepted");
    set({ messageListenerAttachedTo: null });
  },
}));

export default useChatStore;
