import { useEffect, useRef, useState } from "react";
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
    getGroupMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();

  const messageEndRef = useRef(null);
  const pressTimerRef = useRef(null);
  const [messageActionTarget, setMessageActionTarget] = useState(null);

  /* Fetch messages when user changes */
  useEffect(() => {
    if (selectedUser?._id) {
      if (selectedUser.isGroup || selectedUser.groupId) {
        getGroupMessages(selectedUser._id);
      } else {
        getMessagesByUserId(selectedUser._id);
      }
    }
  }, [selectedUser, getGroupMessages, getMessagesByUserId]);

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
            const senderId = msg.senderId?._id || msg.senderId;
            const senderName = msg.senderId?.username || selectedUser.username;
            const senderAvatar =
              msg.senderId?.profilePic ||
              selectedUser.profilePic ||
              "/avatar.png";
            const isOwnMessage = String(senderId) === String(authUser?._id);

            return (
              <div
                key={msg._id}
                className={`message-row ${isOwnMessage ? "own" : "other"}`}
                onMouseDown={() => {
                  if (!isOwnMessage || msg.isOptimistic) return;
                  pressTimerRef.current = setTimeout(() => setMessageActionTarget(msg), 450);
                }}
                onMouseUp={() => clearTimeout(pressTimerRef.current)}
                onMouseLeave={() => clearTimeout(pressTimerRef.current)}
                onTouchStart={() => {
                  if (!isOwnMessage || msg.isOptimistic) return;
                  pressTimerRef.current = setTimeout(() => setMessageActionTarget(msg), 450);
                }}
                onTouchEnd={() => clearTimeout(pressTimerRef.current)}
              >

                {!isOwnMessage && (
                  <img
                    src={senderAvatar}
                    alt="profile"
                    className="avatar"
                  />
                )}

                <div className="message-bubble">
                  {selectedUser.isGroup && !isOwnMessage ? (
                    <div className="message-sender-name">{senderName}</div>
                  ) : null}

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

      {messageActionTarget ? (
        <div className="message-action-backdrop" onClick={() => setMessageActionTarget(null)}>
          <div className="message-action-sheet" onClick={(e) => e.stopPropagation()}>
            <button
              className="message-delete-btn"
              onClick={async () => {
                await deleteMessage(messageActionTarget._id);
                setMessageActionTarget(null);
              }}
            >
              Delete message
            </button>
            <button
              className="message-cancel-btn"
              onClick={() => setMessageActionTarget(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

    </div>
  );
}

export default ChatContainer;
