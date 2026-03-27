import "./MessagesLoadingSkeleton.css";

function MessagesLoadingSkeleton() {
  return (
    <div className="skeleton-container">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className={`skeleton-message ${index % 2 === 0 ? "left" : "right"}`}
        >
          <div className="skeleton-bubble"></div>
        </div>
      ))}
    </div>
  );
}

export default MessagesLoadingSkeleton;