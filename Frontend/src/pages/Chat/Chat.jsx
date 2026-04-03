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
import NoGroupsFound from "../../components/NoGroups/NoGroups";
import UsersLoadingSkeleton from "../../components/UsersLoadingSkeleton/UsersLoadingSkeleton";
import useAuthStore from "../../store/useAuthStore";

function Chat() {
  const {
    activeTab,
    selectedUser,
    allContacts,
    groups,
    groupRequests,
    requests,
    isChatsLoading,
    isGroupsLoading,
    isRequestsLoading,
    isGroupInvitesLoading,
    getAllContacts,
    getMyChatPartners,
    getGroups,
    getRequests,
    getGroupInvites,
    getBlockedUsers,
    createGroup,
    setSelectedUser,
  } = useChatStore();
  const { authUser, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [mobileTab, setMobileTab] = useState("chats");
  const [viewMode, setViewMode] = useState("list");
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getMyChatPartners();
    getGroups();
    getAllContacts();
    getRequests();
    getGroupInvites();
    getBlockedUsers();
  }, [
    getAllContacts,
    getBlockedUsers,
    getGroupInvites,
    getGroups,
    getMyChatPartners,
    getRequests,
  ]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      if (!mobile) {
        setViewMode("list");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    setViewMode(selectedUser ? "chat" : "list");
  }, [isMobile, selectedUser]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return groups;

    return groups.filter((group) =>
      group.name?.toLowerCase().includes(normalizedSearch)
    );
  }, [groups, search]);

  const isChatsViewLoading =
    isChatsLoading || isGroupsLoading || isRequestsLoading || isGroupInvitesLoading;
  const isGroupsViewLoading = isGroupsLoading || isGroupInvitesLoading;

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

  const handleSelectConversation = (entry) => {
    setSelectedUser(entry);
    if (isMobile) {
      setViewMode("chat");
    }
  };

  const renderGroupList = ({ showEmptyState = false } = {}) => {
    if (!filteredGroups.length) {
      return showEmptyState ? (
        <NoGroupsFound onCreateGroup={() => setIsGroupModalOpen(true)} />
      ) : null;
    }

    return (
      <div className="group-list-section">
        <p className="group-list-heading">Groups</p>
        {filteredGroups.map((group) => (
          <button
            type="button"
            key={group._id}
            className="group-card"
            onClick={() => handleSelectConversation({ ...group, isGroup: true })}
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
    );
  };

  const renderRequests = () => {
    if (!requests.length) return null;

    return (
      <div className="request-list-section">
        <p className="request-list-heading">Message requests</p>
        {requests.map((request) => (
          <button
            type="button"
            key={request._id}
            className="request-card"
            onClick={() => handleSelectConversation(request)}
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
    );
  };

  const renderGroupRequests = () => {
    if (!groupRequests.length) return null;

    return (
      <div className="request-list-section">
        <p className="request-list-heading">Group invites</p>
        {groupRequests.map((group) => (
          <button
            type="button"
            key={group._id}
            className="request-card"
            onClick={() =>
              handleSelectConversation({ ...group, isGroup: true, isGroupRequest: true })
            }
          >
            <div className="group-card-avatar request-group-avatar">
              {group.image ? <img src={group.image} alt={group.name} /> : <FaUsers />}
            </div>
            <div className="request-card-content">
              <div className="request-card-top">
                <h4>{group.name}</h4>
                <span className="request-card-badge">New</span>
              </div>
              <p>{group.creatorId?.username || "Group admin"} invited you to join</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`container ${selectedUser ? "chat-open" : ""}`}>
      <div className="left-side">
        <SidebarNav />
      </div>

      <div className="middle">
        <div className="sidebar">
          {isMobile && viewMode === "chat" ? null : (
            <>
              <div className={`mobile-chat-topbar ${mobileTab === "contacts" ? "mobile-topbar-contacts" : "mobile-topbar-chats"}`}>
                <div className="mobile-chat-brand">
                  <div className="mobile-chat-avatar">
                    <img
                      src={authUser?.profilePic || "/avatar.png"}
                      alt={authUser?.username || "User"}
                    />
                  </div>

                  <div className="mobile-chat-copy">
                    <span className="mobile-chat-title">
                      {mobileTab === "contacts" ? "People" : "Chatify"}
                    </span>
                    <span className="mobile-chat-subtitle">
                      {mobileTab === "contacts"
                        ? "Browse contacts and start new chats"
                        : "Your conversations, groups, and requests"}
                    </span>
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

              <div className="mobile-tab-switcher">
                <button
                  type="button"
                  className={mobileTab === "chats" ? "active" : ""}
                  onClick={() => setMobileTab("chats")}
                >
                  Chats
                </button>
                <button
                  type="button"
                  className={mobileTab === "contacts" ? "active" : ""}
                  onClick={() => setMobileTab("contacts")}
                >
                  Contacts
                </button>
              </div>

              <div className="chat-search">
                <div className="chat-search-row">
                  <div className="chat-search-field">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder={mobileTab === "contacts" ? "Search contacts..." : "Search people..."}
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
            </>
          )}

          {isMobile ? (
            <div className="mobile-list-layout">
              {viewMode === "list" && mobileTab === "chats" ? (
                isChatsViewLoading ? (
                  <UsersLoadingSkeleton />
                ) : (
                  <>
                    {renderRequests()}
                    {renderGroupRequests()}
                    {renderGroupList()}
                    <ChatList
                      search={search}
                      suppressEmptyState={false}
                      sectionTitle="Recent chats"
                    />
                  </>
                )
              ) : null}
              {viewMode === "list" && mobileTab === "contacts" ? (
                <ContactList search={search} hideEmptyState sectionTitle="All contacts" />
              ) : null}
            </div>
          ) : null}

          <div className="desktop-list-layout">
            {activeTab === "chats" ? (
              isChatsViewLoading ? (
                <UsersLoadingSkeleton />
              ) : (
                <>
                  {renderRequests()}
                  {renderGroupRequests()}
                  {renderGroupList()}
                  <ChatList search={search} />
                </>
              )
            ) : null}
            {activeTab === "groups" ? (
              isGroupsViewLoading ? (
                <UsersLoadingSkeleton />
              ) : (
                <>
                  {renderGroupRequests()}
                  {renderGroupList({ showEmptyState: groupRequests.length === 0 })}
                </>
              )
            ) : null}
            {activeTab === "contacts" ? <ContactList search={search} /> : null}
          </div>
        </div>
      </div>

      <div className="right-side">
        {!isMobile ? (
          selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />
        ) : null}
        {isMobile && viewMode === "chat" ? <ChatContainer /> : null}
      </div>

      {isGroupModalOpen ? (
        <div className="group-modal-backdrop" onClick={() => setIsGroupModalOpen(false)}>
          <div className="group-modal" onClick={(e) => e.stopPropagation()}>
            <div className="group-modal-header">
              <div>
                <h3>Create Group</h3>
                <p>Choose a name and add members.</p>
              </div>
              <button
                type="button"
                className="group-modal-close"
                onClick={() => setIsGroupModalOpen(false)}
              >
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
