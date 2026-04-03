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
  const selectedUserId = selectedUser?._id;
  const isGroupChat = Boolean(selectedUser?.isGroup || selectedUser?.groupId);
  const isGroupRequest = Boolean(selectedUser?.isGroupRequest);

  const renderMessageStatus = (msg) => {
    if (selectedUser?.isGroup || selectedUser?.groupId || msg.isOptimistic || msg.isUnsent) {
      return null;
    }

    const status = msg.status || (msg.readAt ? "read" : msg.deliveredAt ? "delivered" : "sent");
    const tickLabel = status === "sent" ? "✓" : "✓✓";

    return (
      <span className={`message-status message-status-${status}`} aria-label={status}>
        {tickLabel}
      </span>
    );
  };

  const getMessageDateLabel = (value) => {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
  };

  /* Fetch messages when user changes */
  useEffect(() => {
    if (!selectedUserId || isGroupRequest) {
      return;
    }

    if (isGroupChat) {
      getGroupMessages(selectedUserId);
    } else {
      getMessagesByUserId(selectedUserId);
    }
  }, [selectedUserId, isGroupChat, isGroupRequest, getGroupMessages, getMessagesByUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      return undefined;
    }

    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUserId, subscribeToMessages, unsubscribeFromMessages]);

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
        ) : selectedUser.isGroupRequest ? (
          <NoConversationPlaceholder name={selectedUser.name || selectedUser.username} />
        ) : messages.length === 0 ? (
          <NoConversationPlaceholder name={selectedUser.username} />
        ) : (
          messages.map((msg, index) => {
            const senderId = msg.senderId?._id || msg.senderId;
            const senderName = msg.senderId?.username || selectedUser.username;
            const senderAvatar =
              msg.senderId?.profilePic ||
              selectedUser.profilePic ||
              "/avatar.png";
            const isOwnMessage = String(senderId) === String(authUser?._id);
            const currentDateLabel = getMessageDateLabel(msg.createdAt);
            const previousDateLabel =
              index > 0 ? getMessageDateLabel(messages[index - 1].createdAt) : null;
            const showDateDivider = index === 0 || currentDateLabel !== previousDateLabel;

            return (
              <div key={msg._id}>
                {showDateDivider ? (
                  <div className="message-date-divider">
                    <span>{currentDateLabel}</span>
                  </div>
                ) : null}

                <div
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

                    {msg.image && !msg.isUnsent && (
                      <img
                        src={msg.image}
                        alt="shared"
                        className="message-image"
                      />
                    )}

                    {msg.isUnsent ? (
                      <div className="message-text message-text-unsent">
                        {isOwnMessage ? "You unsent this message" : "This message was unsent"}
                      </div>
                    ) : msg.text ? (
                      <div className="message-text">
                        {msg.text}
                      </div>
                    ) : null}

                    <div className="message-meta">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                      {isOwnMessage ? renderMessageStatus(msg) : null}
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
              Unsend message
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
