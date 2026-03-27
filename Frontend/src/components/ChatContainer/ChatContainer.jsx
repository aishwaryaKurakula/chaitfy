import { useEffect, useRef } from "react";
import useAuthStore from "../../store/useAuthStore";
import useChatStore from "../../store/useChatStore";
import ChatHeader from "../../components/ChatHeader/ChatHeader";
import NoConversationPlaceholder from "../../components/NoCon/NoConversationPlaceholder";
import MessageInput from "../../components/MessageInput/MessageInput";
import MessagesLoadingSkeleton from "../../components/MessagesLoadingSkeleton/MessagesLoadingSkeleton";
import "./ChatContainer.css";

function ChatContainer() {

  const {
    selectedUser,
    messages = [],
    isMessagesLoading,
    getMessagesByUserId,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);

  /* Fetch messages when user changes */
  useEffect(() => {
    if (selectedUser?._id) {
      getMessagesByUserId(selectedUser._id);
    }
  }, [selectedUser, getMessagesByUserId]);

  useEffect(() => {
    if (!selectedUser?._id) {
      return undefined;
    }

    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, subscribeToMessages, unsubscribeFromMessages]);

  /* Auto scroll to bottom */
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className="no-chat-selected">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">

      <ChatHeader />

      <div className="chat-body">

        {isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : messages.length === 0 ? (
          <NoConversationPlaceholder name={selectedUser.username} />
        ) : (
          messages.map((msg) => {

            const isOwnMessage = String(msg.senderId) === String(authUser?._id);

            return (
              <div
                key={msg._id}
                className={`message-row ${isOwnMessage ? "own" : "other"}`}
              >

                {!isOwnMessage && (
                  <img
                    src={selectedUser.profilePic || "/avatar.png"}
                    alt="profile"
                    className="avatar"
                  />
                )}

                <div className="message-bubble">

                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="shared"
                      className="message-image"
                    />
                  )}

                  {msg.text && (
                    <div className="message-text">
                      {msg.text}
                    </div>
                  )}

                  <div className="message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>

                </div>

                {isOwnMessage && (
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt="profile"
                    className="avatar"
                  />
                )}

              </div>
            );
          })
        )}

        <div ref={messageEndRef} />

      </div>

      <MessageInput />

    </div>
  );
}

export default ChatContainer;
