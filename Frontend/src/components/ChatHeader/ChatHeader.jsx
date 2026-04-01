import { Settings2, X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore";
import { useEffect, useMemo, useState } from "react";
import  useAuthStore  from "../../store/useAuthStore";
import "./ChatHeader.css";

function ChatHeader() {
  const {
    selectedUser,
    setSelectedUser,
    allContacts,
    addGroupMembers,
    removeGroupMember,
    updateGroup,
    leaveGroup,
    relationshipStatus,
    acceptRequest,
    rejectRequest,
    blockUser,
    unblockUser,
  } = useChatStore();
  const { onlineUsers = [], authUser } = useAuthStore();
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

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

  const isGroup = Boolean(selectedUser.isGroup || selectedUser.groupId);
  const isCreator =
    isGroup &&
    String(selectedUser.creatorId?._id || selectedUser.creatorId) === String(authUser?._id);
  const isOnline = onlineUsers.map(String).includes(String(selectedUser._id));
  const subtitle = isGroup
    ? `${selectedUser.members?.length || 0} members`
    : relationshipStatus === "pending_incoming"
      ? "Wants to send you messages"
      : relationshipStatus === "pending_outgoing"
        ? "Request sent"
        : relationshipStatus === "blocked"
          ? "Blocked"
    : isOnline
      ? "Online"
      : "Offline";
  const availableContacts = useMemo(() => {
    if (!isGroup) {
      return [];
    }

    const currentMemberIds = new Set(
      (selectedUser.members || []).map((member) => String(member._id || member))
    );

    return allContacts.filter((contact) => !currentMemberIds.has(String(contact._id)));
  }, [allContacts, isGroup, selectedUser.members]);

  useEffect(() => {
    if (isGroup) {
      setGroupName(selectedUser.name || "");
    }
  }, [isGroup, selectedUser.name]);

  const handleToggleMember = (memberId) => {
    setSelectedMembers((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  };

  const handleSaveGroup = async () => {
    if (groupName.trim() && groupName.trim() !== selectedUser.name) {
      await updateGroup(selectedUser._id, { name: groupName });
    }

    if (selectedMembers.length) {
      await addGroupMembers(selectedUser._id, selectedMembers);
      setSelectedMembers([]);
    }

    setIsManageOpen(false);
  };

  const handleLeaveGroup = async () => {
    await leaveGroup(selectedUser._id);
    setIsManageOpen(false);
  };

  return (
    <>
      <div className="chat-header">
        <div className="chat-user-info">
          <div className={`user-avatar ${isGroup ? "group" : isOnline ? "online" : "offline"}`}>
            <img
              src={selectedUser.image || selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.name || selectedUser.username}
            />
          </div>

          <div className="user-details">
            <h3>{selectedUser.name || selectedUser.username}</h3>
            <p className="status-text">{subtitle}</p>
          </div>
        </div>

        <div className="chat-header-actions">
          {isGroup ? (
            <button className="manage-btn" onClick={() => setIsManageOpen(true)}>
              <Settings2 size={18} />
            </button>
          ) : null}

          <button
            className="close-btn"
            onClick={() => setSelectedUser(null)}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {!isGroup && relationshipStatus !== "accepted" ? (
        <div className="request-action-bar">
          {relationshipStatus === "pending_incoming" ? (
            <>
              <button className="request-accept-btn" onClick={() => acceptRequest(selectedUser._id)}>
                Accept
              </button>
              <button className="request-reject-btn" onClick={() => rejectRequest(selectedUser._id)}>
                Reject
              </button>
            </>
          ) : null}
          {relationshipStatus === "pending_outgoing" ? (
            <div className="request-info-pill">Only request messages are allowed until accepted</div>
          ) : null}
          {relationshipStatus !== "blocked" ? (
            <button className="request-block-btn" onClick={() => blockUser(selectedUser._id)}>
              Block
            </button>
          ) : (
            <button className="request-accept-btn" onClick={() => unblockUser(selectedUser._id)}>
              Unblock
            </button>
          )}
        </div>
      ) : null}

      {isManageOpen ? (
        <div className="group-manage-backdrop" onClick={() => setIsManageOpen(false)}>
          <div className="group-manage-modal" onClick={(e) => e.stopPropagation()}>
            <div className="group-manage-header">
              <div>
                <h3>Manage Group</h3>
                <p>Rename, add members, remove members, or leave.</p>
              </div>
              <button className="group-manage-close" onClick={() => setIsManageOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="group-manage-body">
              <input
                className="group-manage-input"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                disabled={!isCreator}
              />

              <div className="group-member-chip-list">
                {(selectedUser.members || []).map((member) => {
                  const memberId = String(member._id || member);
                  const canRemove = isCreator && memberId !== String(authUser?._id);

                  return (
                    <div key={memberId} className="group-member-chip">
                      <span>{member.username || "Member"}</span>
                      {canRemove ? (
                        <button onClick={() => removeGroupMember(selectedUser._id, memberId)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {isCreator && availableContacts.length ? (
                <div className="group-add-members">
                  <p>Add members</p>
                  <div className="group-add-list">
                    {availableContacts.map((contact) => (
                      <label key={contact._id} className="group-add-option">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(contact._id)}
                          onChange={() => handleToggleMember(contact._id)}
                        />
                        <span>{contact.username}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="group-manage-footer">
              {isCreator ? (
                <button className="group-save-btn" onClick={handleSaveGroup}>
                  Save Changes
                </button>
              ) : null}
              <button className="group-leave-btn" onClick={handleLeaveGroup}>
                Leave Group
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ChatHeader;
