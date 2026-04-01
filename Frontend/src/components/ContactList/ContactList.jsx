import { useEffect, useMemo } from "react";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import UsersLoadingSkeleton from "../UsersLoadingSkeleton/UsersLoadingSkeleton";
import NoChatsFound from "../NoChatsFound/NoChatsFound";
import "./ContactList.css";

function ContactList({ search = "", hideEmptyState = false, sectionTitle = "" }) {
  const {
    getAllContacts,
    allContacts,
    setSelectedUser,
    isUsersLoading,
  } = useChatStore();

  const { onlineUsers = [] } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return allContacts;
    }

    return allContacts.filter((contact) =>
      contact.username?.toLowerCase().includes(normalizedSearch)
    );
  }, [allContacts, search]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (!filteredContacts.length) {
    return hideEmptyState ? null : <NoChatsFound />;
  }

  return (
    <div className="contact-list-section">
      {sectionTitle ? <p className="contact-list-heading">{sectionTitle}</p> : null}

      <div className="contact-list">
      {filteredContacts.map((contact) => (
        <div
          key={contact._id}
          className="contact-card"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="contact-content">
            <div
              className={`avatar ${
                onlineUsers.map(String).includes(String(contact._id))
                  ? "online"
                  : "offline"
              }`}
            >
              <img
                src={contact.profilePic || "/avatar.png"}
                alt={contact.username}
              />
            </div>

            <h4 className="contact-name">{contact.username}</h4>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}

export default ContactList;
