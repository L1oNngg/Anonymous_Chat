import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import stickers from "../data/stickers";
import "./ChatInput.css";

function ChatInput({ onSendMessage, onSendSticker }) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showStickers, setShowStickers] = useState(false);

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
  };

  const send = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="chat-input">
      <div className="controls">
        <button onClick={() => setShowEmoji((prev) => !prev)}>😊</button>
        <button onClick={() => setShowStickers((prev) => !prev)}>🌟</button>
      </div>

      {showEmoji && <EmojiPicker onEmojiClick={handleEmojiClick} />}

      {showStickers && (
        <div className="sticker-panel">
          {stickers.map((s) => (
            <img
              key={s.id}
              src={s.src}
              alt={s.alt || "sticker"}
              onClick={() => {
                onSendSticker(s.src);
                setShowStickers(false);
              }}
              className="sticker"
            />
          ))}
        </div>
      )}

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={send}>Send</button>
    </div>
  );
}

export default ChatInput;
