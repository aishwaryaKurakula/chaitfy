import React, { useState } from "react";
import "./Chat.css";
import { FaSearch } from "react-icons/fa";
import { FiLogOut, FiSettings } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import useChatStore from "../../store/useChatStore";
import SidebarNav from "../../components/SidebarNav/SidebarNav";
import ChatList from "../../components/ChatList/ChatList";
import ContactList from "../../components/ContactList/ContactList";
import ChatContainer from "../../components/ChatContainer/ChatContainer";
import NoConversationPlaceholder from "../../components/NoCon/NoConversationPlaceholder";
import useAuthStore from "../../store/useAuthStore";

function Chat() {
  const { activeTab, selectedUser } = useChatStore();
  const { authUser, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  return (
    <div className={`container ${selectedUser ? "chat-open" : ""}`}>
      
      {/* LEFT SIDE */}
      <div className="left-side">
        <SidebarNav />
      </div>

      {/* MIDDLE SIDEBAR */}
      <div className="middle">
        <div className="sidebar">
          <div className="mobile-chat-topbar">
            <div className="mobile-chat-brand">
              <div className="mobile-chat-avatar">
                <img
                  src={authUser?.profilePic || "/avatar.png"}
                  alt={authUser?.username || "User"}
                />
              </div>

              <div className="mobile-chat-copy">
                <span className="mobile-chat-title">Chatify</span>
                <span className="mobile-chat-subtitle">Your conversations and contacts</span>
              </div>
            </div>

            <div className="mobile-chat-actions">
              <button
                type="button"
                className="mobile-action-btn"
                onClick={() => navigate("/settings")}
                aria-label="Open settings"
              >
                <FiSettings />
              </button>
              <button
                type="button"
                className="mobile-action-btn"
                onClick={logout}
                aria-label="Log out"
              >
                <FiLogOut />
              </button>
            </div>
          </div>

          {/* SEARCH */}
          <div className="chat-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="chat-search-input"
            />
          </div>

          <div className="mobile-list-layout">
            <ChatList search={search} hideEmptyState sectionTitle="Recent chats" />
            <ContactList search={search} hideEmptyState sectionTitle="All contacts" />
          </div>

          <div className="desktop-list-layout">
            {activeTab === "chats" && <ChatList search={search} />}
            {activeTab === "contacts" && <ContactList search={search} />}
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-side">
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>

    </div>
  );
}

export default Chat;
