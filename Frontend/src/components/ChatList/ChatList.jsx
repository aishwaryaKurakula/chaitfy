import { useEffect, useMemo } from "react";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";

import UsersLoadingSkeleton from "../../components/UsersLoadingSkeleton/UsersLoadingSkeleton";
import NoChatsFound from "../../components/NoChatsFound/NoChatsFound";

import "./ChatList.css";

function ChatList({ search = "", hideEmptyState = false, sectionTitle = "" }) {
  const {
    getMyChatPartners,
    chats = [],
    isUsersLoading,
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

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!filteredChats.length) {
    return hideEmptyState ? null : <NoChatsFound />;
  }

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

              <h4 className="chat-name">{chat.username}</h4>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ChatList;
