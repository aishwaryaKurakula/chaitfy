import React from "react";
import { MessageCircleIcon } from "lucide-react";
import "./NoConversationPlaceholder.css";

const NoConversationPlaceholder = ({ name }) => {
  return (
    <div className="nochat-container">
      <div className="icon-wrapper">
        <MessageCircleIcon className="icon" />
      </div>

      <h3 className="title">
        Start your conversation with {name}
      </h3>

      <div className="content-section">
        <p className="description">
          This is the beginning of your conversation. Send a message to start chatting!
        </p>
        <div className="divider"></div>
      </div>

      <div className="button-group">
        <button className="chat-btn">👋 Say Hello</button>
        <button className="chat-btn">🤝 How are you?</button>
        <button className="chat-btn">📅 Meet up soon?</button>
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;