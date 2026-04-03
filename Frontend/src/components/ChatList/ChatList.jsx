import { useEffect, useMemo } from "react";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";

import UsersLoadingSkeleton from "../../components/UsersLoadingSkeleton/UsersLoadingSkeleton";
import NoChatsFound from "../../components/NoChatsFound/NoChatsFound";

import "./ChatList.css";

function ChatList({
  search = "",
  hideEmptyState = false,
  sectionTitle = "",
  forceLoading = false,
  suppressEmptyState = false,
}) {
  const {
    getMyChatPartners,
    chats = [],
    groups = [],
    requests = [],
    groupRequests = [],
    isChatsLoading,
    setSelectedUser,
  } = useChatStore();

  const { onlineUsers = [] } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  const filteredChats = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return chats;
    }

    return chats.filter((chat) =>
      chat.username?.toLowerCase().includes(normalizedSearch)
    );
  }, [chats, search]);

  const hasOtherConversationSections =
    requests.length > 0 || groupRequests.length > 0 || groups.length > 0;

  if (forceLoading || isChatsLoading) return <UsersLoadingSkeleton />;
  if (!filteredChats.length) {
    if (suppressEmptyState) {
      return null;
    }
    if (hasOtherConversationSections) {
      return null;
    }
    return hideEmptyState ? null : <NoChatsFound />;
  }

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) {
      return "";
    }

    const date = new Date(timestamp);
    const now = new Date();
    const isSameDay = date.toDateString() === now.toDateString();

    if (isSameDay) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="chat-list-section">
      {sectionTitle ? <p className="chat-list-heading">{sectionTitle}</p> : null}

      {filteredChats.map((chat) => {
        const isOnline = onlineUsers
          .map(String)
          .includes(String(chat._id));

        return (
          <div
            key={chat._id}
            className="chat-card"
            onClick={() => setSelectedUser(chat)}
          >
            <div className="chat-content">
              <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                <div className="avatar-img-wrapper">
                  <img
                    src={chat.profilePic || "/avatar.png"}
                    alt={chat.username}
                    className="avatar-img"
                  />
                </div>
              </div>

              <div className="chat-meta">
                <div className="chat-meta-top">
                  <h4 className="chat-name">{chat.username}</h4>
                  <span className="chat-time">
                    {formatLastMessageTime(chat.lastMessageAt)}
                  </span>
                </div>

                <div className="chat-meta-bottom">
                  <p className="chat-preview">
                    {chat.lastMessage
                      ? chat.lastMessage
                      : chat.lastMessageHasImage
                        ? "Photo"
                        : "Start a conversation"}
                  </p>
                  {chat.unreadCount > 0 ? (
                    <span className="chat-unread-badge">{chat.unreadCount}</span>
                  ) : isOnline ? (
                    <span className="chat-status-pill">Active</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChatList;
