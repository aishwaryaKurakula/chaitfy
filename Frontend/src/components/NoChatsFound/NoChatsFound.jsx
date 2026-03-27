import React from "react";
import { FaComments } from "react-icons/fa";
import useChatStore from "../../store/useChatStore";
import "./NoChatsFound.css";

function NoChatsFound() {
  const { setActiveTab } = useChatStore();

  return (
    <div className="nochat-container">
      <div className="nochat-icon-wrapper">
        <FaComments className="nochat-icon" />
      </div>

      <h2 className="nochat-title">No conversations yet</h2>

      <p className="nochat-text">
        Start a new chat by selecting a contact from the contacts tab
      </p>

      <button
        className="nochat-button"
        onClick={() => setActiveTab("contacts")}
      >
        Find contacts
      </button>
    </div>
  );
}

export default NoChatsFound;