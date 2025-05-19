// src/pages/ChatRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/common/Button';
import ChatMessage from '../components/feature/ChatMessage';
import MatrixBackground from '../components/common/MatrixBackground';
import useChat from '../hooks/useChat';
import stickers from '../data/stickers';
import Notification from '../components/common/Notification';
import '../styles/pages/ChatRoom.css';

const EMOJIS = ['😀', '😂', '😎', '🥺', '❤️', '🔥', '👍', '🎉'];

const ChatRoom = () => {
  const { state } = useLocation();
  const { username = 'Guest' } = state || {};
  const [newMessage, setNewMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState('');
  const [showOnlineUsers, setShowOnlineUsers] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null); // Thêm ref cho container chat
  const { messages, sendMessage, sendSticker, onlineUsers = [], notifications, closeNotification } = useChat(username);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight; // Cuộn xuống cuối
    }
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
    <div className="relative w-full h-screen bg-transparent overflow-hidden">
      <MatrixBackground />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 bg-transparent">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            id={notification.id}
            content={notification.content}
            onClose={closeNotification}
          />
        ))}
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl">
          <div className="flex-1 bg-gray-900 bg-opacity-80 p-6 rounded-lg shadow-[0_0_20px_rgba(0,255,0,0.3)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-orbitron text-3xl text-green-500 font-bold">
                Anonymous Chat Room
              </h2>
              <Button
                type="button"
                className="px-4 py-2 text-base bg-gray-700 hover:bg-gray-600 rounded-lg"
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              >
                {showOnlineUsers ? 'Hide Users' : 'Show Users'}
              </Button>
            </div>
            <p className="mb-6 text-lg text-white font-medium">Username: {username}</p>

            <div
              ref={chatContainerRef}
              className="h-[500px] bg-gray-800 bg-opacity-90 p-4 rounded-md overflow-y-auto scroll-smooth custom-scrollbar"
              style={{ maxHeight: '500px', overflowY: 'auto' }} // Đảm bảo chiều cao cố định
            >
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  username={msg.username}
                  message={msg.message}
                  timestamp={msg.timestamp}
                  isOwnMessage={msg.username === username}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex flex-col gap-4 mt-6">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-700 text-white"
                />
                <Button type="submit" className="px-4 py-2">Send</Button>
                <button
                  type="button"
                  onClick={() => setShowStickers((prev) => !prev)}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  title="Send Sticker"
                >
                  📦
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojis((prev) => !prev)}
                  className="px-3 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
                  title="Add Emoji"
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
          </div>

          {showOnlineUsers && (
            <div className="w-full md:w-64 bg-gray-900 bg-opacity-80 p-4 rounded-lg text-white shadow-inner transition-all duration-300">
              <h3 className="font-bold text-xl mb-4">
                🟢 Online Users ({onlineUsers.length})
              </h3>
              <ul className="list-disc list-inside space-y-2 text-base max-h-64 overflow-y-auto custom-scrollbar">
                {onlineUsers.length > 0 ? (
                  onlineUsers.map((user, i) => (
                    <li key={i} className={user === username ? 'text-green-400 font-semibold' : ''}>
                      {user}
                    </li>
                  ))
                ) : (
                  <li>No users online</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;