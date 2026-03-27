import { useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";
import "./MessageInput.css";

function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    sendMessage({
      text: text.trim(),
      image: imagePreview,
    });

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="message-input-wrapper">
      {imagePreview && (
        <div className="image-preview-container">
          <div className="image-preview-box">
            <img src={imagePreview} alt="Preview" className="preview-img" />
            <button
              onClick={removeImage}
              className="remove-image-btn"
              type="button"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="message-input"
          placeholder="Type your message..."
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden-file-input"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`image-btn ${imagePreview ? "active" : ""}`}
        >
          <ImageIcon size={20} />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="send-btn"
        >
          <SendIcon size={20} />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;