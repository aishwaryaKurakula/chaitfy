import { X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useEffect } from "react";
import  useAuthStore  from "../../store/useAuthStore";
import "./ChatHeader.css";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers = [] } = useAuthStore();

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        setSelectedUser(null);
      }
    };

    window.addEventListener("keydown", handleEscKey);

    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  if (!selectedUser) return null;

  const isOnline = onlineUsers.map(String).includes(String(selectedUser._id));

  return (
    <div className="chat-header">
      <div className="chat-user-info">
        <div className={`user-avatar ${isOnline ? "online" : "offline"}`}>
          <img
            src={selectedUser.profilePic || "/avatar.png"}
            alt={selectedUser.username}
          />
        </div>

        <div className="user-details">
          <h3>{selectedUser.username}</h3>
          <p className="status-text">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <button
        className="close-btn"
        onClick={() => setSelectedUser(null)}
      >
        <X size={20} />
      </button>
    </div>
  );
}

export default ChatHeader;
