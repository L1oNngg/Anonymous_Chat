import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/common/Button';
import ChatMessage from '../components/feature/ChatMessage';
import MatrixBackground from '../components/common/MatrixBackground';
import useChat from '../hooks/useChat';
import stickers from '../data/stickers';

const EMOJIS = ['😀', '😂', '😎', '🥺', '❤️', '🔥', '👍', '🎉'];

const ChatRoom = () => {
  const { state } = useLocation();
  const { username = 'Guest' } = state || {};
  const [newMessage, setNewMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { messages, sendMessage, sendSticker, onlineUsers = [] } = useChat(username);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      sendMessage(newMessage);
      setNewMessage('');
      setError('');
    } else {
      setError('Please enter a message.');
    }
  };

  // Sửa chỗ này: dùng sendSticker thay vì sendMessage khi chọn sticker
  const handleStickerSelect = (stickerUrl) => {
    sendSticker(stickerUrl);
    setShowStickers(false);
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojis(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <MatrixBackground />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl">
          {/* Chat Box */}
          <div className="flex-1 bg-black bg-opacity-70 p-6 rounded-lg shadow-[0_0_30px_5px_rgba(0,0,0,0.5)]">
            <h2 className="font-orbitron text-2xl text-green-500 mb-4">
              Anonymous Chat Room
            </h2>
            <p className="mb-4 text-white">Username: {username}</p>

            <div className="h-64 bg-gray-800 p-4 rounded-md overflow-y-auto mb-4 scroll-smooth">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  username={msg.username}
                  message={msg.message}
                  timestamp={msg.timestamp}
                  isOwnMessage={msg.username === username}
                  isSticker={
                    typeof msg.message === 'string' &&
                    (msg.message.endsWith('.png') || msg.message.endsWith('.gif'))
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
              <div className="flex items-center">
                <input
                  type="text"
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Button type="submit" className="ml-2">Send</Button>
                <button
                  type="button"
                  onClick={() => setShowStickers((prev) => !prev)}
                  className="ml-2 px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 sticker-panel"
                  title="Send Sticker"
                >
                  📦
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojis((prev) => !prev)}
                  className="ml-2 px-2 py-1 bg-pink-500 text-white rounded-md hover:bg-pink-600 emoji-panel"
                  title="Add Emoji"
                >
                  😊
                </button>
              </div>

              {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

              {showEmojis && (
                <div className="emoji-panel flex flex-wrap gap-2 p-2 bg-white rounded-md shadow-md border w-fit max-w-full">
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
                <div className="sticker-panel absolute z-10 flex flex-wrap gap-3 p-3 bg-white rounded-md shadow-md border w-fit max-w-[300px] max-h-64 overflow-y-auto">
                  {stickers.map((sticker) => {
                    console.log('Rendering sticker:', sticker.src);
                    return (
                      <img
                        key={sticker.id}
                        src={sticker.src}
                        alt={sticker.alt}
                        className="w-16 h-16 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => handleStickerSelect(sticker.src)}
                      />
                    );
                  })}
                </div>
              )}
            </form>
          </div>

          {/* Online Users Panel */}
          <div className="w-full md:w-64 bg-gray-900 bg-opacity-70 p-4 rounded-lg text-white shadow-inner">
            <h3 className="font-bold text-lg mb-2">🟢 Online Users</h3>
            <ul className="list-disc list-inside space-y-1 text-sm max-h-64 overflow-y-auto">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user, i) => (
                  <li key={i} className={user === username ? 'text-green-400 font-bold' : ''}>
                    {user}
                  </li>
                ))
              ) : (
                <li>No users online</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
