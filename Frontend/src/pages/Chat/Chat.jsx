import React, { useState } from "react";
import "./Chat.css";
import { FaSearch } from "react-icons/fa";

import useChatStore from "../../store/useChatStore";

import SidebarNav from "../../components/sidebarNav/SidebarNav";
import ChatList from "../../components/ChatList/ChatList";
import ContactList from "../../components/ContactList/ContactList";
import ChatContainer from "../../components/ChatContainer/ChatContainer";
import NoConversationPlaceholder from "../../components/NoCon/NoConversationPlaceholder";

function Chat() {
  const { activeTab, selectedUser } = useChatStore();
  const [search, setSearch] = useState("");

  return (
    <div className="container">
      
      {/* LEFT SIDE */}
      <div className="left-side">
        <SidebarNav />
      </div>

      {/* MIDDLE SIDEBAR */}
      <div className="middle">
        <div className="sidebar">
          
          {/* SEARCH */}
          <div className="chat-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="chat-search-input"
            />
          </div>

          {/* CONDITIONAL LIST */}
          {activeTab === "chats" && <ChatList search={search} />}
          {activeTab === "contacts" && <ContactList search={search} />}

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