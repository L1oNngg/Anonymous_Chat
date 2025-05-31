// src/pages/ChatRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/common/Button';
import ChatMessage from '../components/feature/ChatMessage';
import MatrixBackground from '../components/common/MatrixBackground';
import ChatInput from '../components/feature/ChatInput';
import useChat from '../hooks/useChat';
import Notification from '../components/common/Notification';
import '../styles/pages/ChatRoom.css';

const ChatRoom = ({ username, roomId, room }) => {
  const [showOnlineUsers, setShowOnlineUsers] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { messages, sendMessage, sendSticker, onlineUsers = [], notifications, closeNotification } = useChat(
    username,
    roomId
  );

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
                {room?.name || 'Phòng chung'} {room?.type === 'private' ? `(Mã: ${room?.code || 'N/A'})` : ''}
              </h2>
              <Button
                type="button"
                className="px-4 py-2 text-base bg-gray-700 hover:bg-gray-600 rounded-lg"
                onClick={() => setShowOnlineUsers(!showOnlineUsers)}
              >
                {showOnlineUsers ? 'Ẩn người dùng' : 'Hiện người dùng'}
              </Button>
            </div>
            <p className="mb-6 text-lg text-white font-medium">Username: {username}</p>

            <div
              ref={chatContainerRef}
              className="h-[500px] bg-gray-800 bg-opacity-90 p-4 rounded-md overflow-y-auto scroll-smooth custom-scrollbar"
              style={{ maxHeight: '500px', overflowY: 'auto' }}
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

            <ChatInput onSendMessage={sendMessage} onSendSticker={sendSticker} />
          </div>

          {showOnlineUsers && (
            <div className="w-full md:w-64 bg-gray-900 bg-opacity-80 p-4 rounded-lg text-white shadow-inner transition-all duration-300">
              <h3 className="font-bold text-xl mb-4">
                🟢 Người dùng online ({onlineUsers.length})
              </h3>
              <ul className="list-disc list-inside space-y-2 text-base max-h-64 overflow-y-auto custom-scrollbar">
                {onlineUsers.length > 0 ? (
                  onlineUsers.map((user, i) => (
                    <li
                      key={i}
                      className={user === username ? 'text-green-400 font-semibold' : ''}
                    >
                      {user}
                    </li>
                  ))
                ) : (
                  <li>Không có người dùng online</li>
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