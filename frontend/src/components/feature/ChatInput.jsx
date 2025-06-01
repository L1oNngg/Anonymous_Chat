// src/components/feature/ChatInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import stickers from '../../data/stickers';

const EMOJIS = ['😀', '😂', '😎', '🥺', '❤️', '🔥', '👍', '🎉'];

// Debounce function
const debounce = (func, delay) =>
{
  let timeoutId;
  return (...args) =>
  {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const ChatInput = ({ onSendMessage, onSendSticker }) =>
{
  const [newMessage, setNewMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false); // Thêm trạng thái gửi
  const inputRef = useRef(null);

  useEffect(() =>
  {
    if (showEmojis || showStickers)
    {
      const handleClickOutside = (e) =>
      {
        if (!e.target.closest('.emoji-panel') && !e.target.closest('.sticker-panel'))
        {
          setShowEmojis(false);
          setShowStickers(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojis, showStickers]);

  const debouncedSendMessage = debounce((message) =>
  {
    if (isSending) return;
    setIsSending(true);
    onSendMessage(message);
    setIsSending(false);
  }, 500); // Debounce 500ms

  const handleSendMessage = (e) =>
  {
    e.preventDefault();
    if (newMessage.trim())
    {
      // Gửi trực tiếp string, không bọc thành object
      onSendMessage(newMessage.trim());
      setNewMessage('');
      setError('');
    } else
    {
      setError('Vui lòng nhập tin nhắn.');
    }
  };

  const handleStickerSelect = (stickerUrl) =>
  {
    if (isSending) return;
    setIsSending(true);
    // Lấy sticker_id từ URL, ví dụ "/stickers/angry_1.jpg" => "angry_1"
    const match = stickerUrl.match(/\/stickers\/([a-zA-Z0-9_]+)\.(jpg|png|gif)$/i);
    const sticker_id = match && match[1] ? match[1] : null;
    if (sticker_id)
    {
      onSendSticker(sticker_id);
    } else
    {
      setError('Không xác định được sticker!');
      console.error('Sticker URL không hợp lệ:', stickerUrl);
    }
    setShowStickers(false);
    setIsSending(false);
  };

  const handleEmojiSelect = (emoji) =>
  {
    setNewMessage((prev) => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSendMessage} className="flex flex-col gap-4 mt-6">
      <div className="flex items-center gap-2">
        <input
          type="text"
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="flex-1 p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-700 text-white"
          disabled={isSending} // Vô hiệu hóa input khi đang gửi
        />
        <Button type="submit" className="px-4 py-2" disabled={isSending}>
          Gửi
        </Button>
        <button
          type="button"
          onClick={() => setShowStickers((prev) => !prev)}
          className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          title="Gửi sticker"
          disabled={isSending}
        >
          📦
        </button>
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          className="px-3 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
          title="Thêm emoji"
          disabled={isSending}
        >
          😊
        </button>
      </div>

      {error && <p className="text-red-400 text-base mt-2">{error}</p>}

      {showEmojis && (
        <div className="emoji-panel flex flex-wrap gap-2 p-3 bg-gray-800 bg-opacity-90 rounded-md shadow-md border border-gray-600 w-fit max-w-full">
          {EMOJIS.map((emoji, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleEmojiSelect(emoji)}
              className="text-2xl hover:scale-110 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {showStickers && (
        <div className="sticker-panel absolute z-10 flex flex-wrap gap-3 p-3 bg-gray-800 bg-opacity-90 rounded-md shadow-md border border-gray-600 w-fit max-w-[300px] max-h-64 overflow-y-auto">
          {stickers.map((sticker) => (
            <img
              key={sticker.src}
              src={sticker.src}
              alt={sticker.alt}
              className="w-16 h-16 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => handleStickerSelect(sticker.src)}
            />
          ))}
        </div>
      )}
    </form>
  );
};

export default ChatInput;