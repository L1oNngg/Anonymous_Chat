// src/components/feature/ChatInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import Button from '../common/Button';
import stickers from '../../data/stickers';

const EMOJIS = ['😀', '😂', '😎', '🥺', '❤️', '🔥', '👍', '🎉'];

const ChatInput = ({ onSendMessage, onSendSticker }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (showEmojis || showStickers) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.emoji-panel') && !e.target.closest('.sticker-panel')) {
          setShowEmojis(false);
          setShowStickers(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojis, showStickers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
      setError('');
    } else {
      setError('Vui lòng nhập tin nhắn.');
    }
  };

  const handleStickerSelect = (stickerUrl) => {
    onSendSticker(stickerUrl);
    setShowStickers(false);
  };

  const handleEmojiSelect = (emoji) => {
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
        />
        <Button type="submit" className="px-4 py-2">
          Gửi
        </Button>
        <button
          type="button"
          onClick={() => setShowStickers((prev) => !prev)}
          className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
          title="Gửi sticker"
        >
          📦
        </button>
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          className="px-3 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
          title="Thêm emoji"
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
              key={sticker.id}
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