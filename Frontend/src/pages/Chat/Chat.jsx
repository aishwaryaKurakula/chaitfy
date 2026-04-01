import React, { useEffect, useMemo, useState } from "react";
import "./Chat.css";
import { FaPlus, FaSearch, FaUsers } from "react-icons/fa";
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
  const {
    activeTab,
    selectedUser,
    allContacts,
    groups,
    requests,
    getAllContacts,
    getGroups,
    getRequests,
    getBlockedUsers,
    createGroup,
    setSelectedUser,
  } = useChatStore();
  const { authUser, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getGroups();
    getAllContacts();
    getRequests();
    getBlockedUsers();
  }, [getAllContacts, getBlockedUsers, getGroups, getRequests]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return groups;

    return groups.filter((group) =>
      group.name?.toLowerCase().includes(normalizedSearch)
    );
  }, [groups, search]);

  const handleToggleMember = (memberId) => {
    setSelectedMembers((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();

    const newGroup = await createGroup({
      name: groupName,
      memberIds: selectedMembers,
    });

    if (newGroup) {
      setGroupName("");
      setSelectedMembers([]);
      setIsGroupModalOpen(false);
      setSelectedUser({
        ...newGroup,
        isGroup: true,
      });
    }
  };

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
                onClick={() => setIsGroupModalOpen(true)}
                aria-label="Create group"
              >
                <FaPlus />
              </button>
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
            <div className="chat-search-row">
              <div className="chat-search-field">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="chat-search-input"
                />
              </div>

              <button
                type="button"
                className="create-group-icon-btn"
                onClick={() => setIsGroupModalOpen(true)}
                aria-label="Create group"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="mobile-list-layout">
            {requests.length > 0 ? (
              <div className="request-list-section">
                <p className="request-list-heading">Message requests</p>
                {requests.map((request) => (
                  <button
                    type="button"
                    key={request._id}
                    className="request-card"
                    onClick={() => setSelectedUser(request)}
                  >
                    <img
                      src={request.profilePic || "/avatar.png"}
                      alt={request.username}
                      className="request-card-avatar"
                    />
                    <div className="request-card-content">
                      <div className="request-card-top">
                        <h4>{request.username}</h4>
                        <span className="request-card-badge">{request.unreadCount || 1}</span>
                      </div>
                      <p>
                        {request.lastMessage
                          ? request.lastMessage
                          : request.lastMessageHasImage
                            ? "Photo"
                            : "Sent you a message request"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {filteredGroups.length > 0 ? (
              <div className="group-list-section">
                <p className="group-list-heading">Groups</p>
                {filteredGroups.map((group) => (
                  <button
                    type="button"
                    key={group._id}
                    className="group-card"
                    onClick={() => setSelectedUser({ ...group, isGroup: true })}
                  >
                    <div className="group-card-avatar">
                      {group.image ? (
                        <img src={group.image} alt={group.name} />
                      ) : (
                        <FaUsers />
                      )}
                    </div>
                    <div className="group-card-content">
                      <div className="group-card-top">
                        <h4>{group.name}</h4>
                        {group.unreadCount > 0 ? (
                          <span className="group-unread-badge">{group.unreadCount}</span>
                        ) : (
                          <span>
                            {group.lastMessageAt
                              ? new Date(group.lastMessageAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })
                              : ""}
                          </span>
                        )}
                      </div>
                      <p>
                        {group.lastMessage
                          ? group.lastMessage
                          : group.lastMessageHasImage
                            ? "Photo"
                            : `${group.members?.length || 0} members`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            <ChatList search={search} hideEmptyState sectionTitle="Recent chats" />
            <ContactList search={search} hideEmptyState sectionTitle="All contacts" />
          </div>

          <div className="desktop-list-layout">
            {activeTab === "chats" ? (
              <>
                {requests.length > 0 ? (
                  <div className="request-list-section desktop-group-list">
                    <p className="request-list-heading">Message requests</p>
                    {requests.map((request) => (
                      <button
                        type="button"
                        key={request._id}
                        className="request-card"
                        onClick={() => setSelectedUser(request)}
                      >
                        <img
                          src={request.profilePic || "/avatar.png"}
                          alt={request.username}
                          className="request-card-avatar"
                        />
                        <div className="request-card-content">
                          <div className="request-card-top">
                            <h4>{request.username}</h4>
                            <span className="request-card-badge">{request.unreadCount || 1}</span>
                          </div>
                          <p>
                            {request.lastMessage
                              ? request.lastMessage
                              : request.lastMessageHasImage
                                ? "Photo"
                                : "Sent you a message request"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

                {filteredGroups.length > 0 ? (
                  <div className="group-list-section desktop-group-list">
                    <p className="group-list-heading">Groups</p>
                    {filteredGroups.map((group) => (
                      <button
                        type="button"
                        key={group._id}
                        className="group-card"
                        onClick={() => setSelectedUser({ ...group, isGroup: true })}
                      >
                        <div className="group-card-avatar">
                          {group.image ? (
                            <img src={group.image} alt={group.name} />
                          ) : (
                            <FaUsers />
                          )}
                        </div>
                        <div className="group-card-content">
                          <div className="group-card-top">
                            <h4>{group.name}</h4>
                            {group.unreadCount > 0 ? (
                              <span className="group-unread-badge">{group.unreadCount}</span>
                            ) : (
                              <span>
                                {group.lastMessageAt
                                  ? new Date(group.lastMessageAt).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : ""}
                              </span>
                            )}
                          </div>
                          <p>
                            {group.lastMessage
                              ? group.lastMessage
                              : group.lastMessageHasImage
                                ? "Photo"
                                : `${group.members?.length || 0} members`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                <ChatList search={search} />
              </>
            ) : null}
            {activeTab === "contacts" && <ContactList search={search} />}
          </div>

        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-side">
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>

      {isGroupModalOpen ? (
        <div className="group-modal-backdrop" onClick={() => setIsGroupModalOpen(false)}>
          <div className="group-modal" onClick={(e) => e.stopPropagation()}>
            <div className="group-modal-header">
              <div>
                <h3>Create Group</h3>
                <p>Choose a name and add members.</p>
              </div>
              <button type="button" className="group-modal-close" onClick={() => setIsGroupModalOpen(false)}>
                x
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="group-modal-form">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="group-name-input"
                required
              />

              <div className="group-member-list">
                {allContacts.map((contact) => (
                  <label key={contact._id} className="group-member-option">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(contact._id)}
                      onChange={() => handleToggleMember(contact._id)}
                    />
                    <img src={contact.profilePic || "/avatar.png"} alt={contact.username} />
                    <span>{contact.username}</span>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                className="create-group-btn"
                disabled={!groupName.trim() || selectedMembers.length === 0}
              >
                Create Group
              </button>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  );
}

export default Chat;
