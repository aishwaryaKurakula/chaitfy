import React from "react";
import { MdGroup } from "react-icons/md";
import useChatStore from "../../store/useChatStore";
import "./NoGroups.css";

function NoGroupsFound({ onCreateGroup }) {
  const { setActiveTab } = useChatStore();

  return (
    <div className="nogroup-container">
      <div className="nogroup-icon-wrapper">
        <MdGroup className="nogroup-icon" />
      </div>

      <h2 className="nogroup-title">No groups yet</h2>

      <p className="nogroup-text">
        Create a new group or ask someone to add you to an existing group
      </p>

      <button
        className="nogroup-button"
        onClick={() => {
          setActiveTab("groups");
          onCreateGroup?.();
        }}
      >
        Create a group
      </button>
    </div>
  );
}

export default NoGroupsFound;
