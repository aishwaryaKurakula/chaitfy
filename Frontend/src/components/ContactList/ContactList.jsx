import { useEffect } from "react";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import UsersLoadingSkeleton from "../UsersLoadingSkeleton/UsersLoadingSkeleton";
import "./ContactList.css";

function ContactList() {
  const {
    getAllContacts,
    allContacts,
    setSelectedUser,
    isUsersLoading,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  return (
    <div className="contact-list">
      {allContacts.map((contact) => (
        <div
          key={contact._id}
          className="contact-card"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="contact-content">
            <div
              className={`avatar ${
                onlineUsers?.includes(contact._id)
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
  );
}

export default ContactList;