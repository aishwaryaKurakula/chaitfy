import { useEffect } from "react";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";

import UsersLoadingSkeleton from "../../components/UsersLoadingSkeleton/UsersLoadingSkeleton";
import NoChatsFound from "../../components/NoChatsFound/NoChatsFound";

import "./ChatList.css";

function ChatList() {
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

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!chats.length) return <NoChatsFound />;

  return (
    <>
      {chats.map((chat) => {
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
    </>
  );
}

export default ChatList;