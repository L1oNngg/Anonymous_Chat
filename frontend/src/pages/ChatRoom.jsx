import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Button from '../components/common/Button';
import ChatMessage from '../components/feature/ChatMessage';
import MatrixBackground from '../components/common/MatrixBackground';
import useChat from '../hooks/useChat';

const ChatRoom = () => {
  const { state } = useLocation();
  const { username = 'Guest' } = state || {};
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, sendMessage } = useChat(username);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <MatrixBackground />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-full p-4 z-10">
        <div className="bg-black bg-opacity-70 p-6 rounded-lg shadow-[0_0_30px_5px_rgba(0,0,0,0.5)] w-full max-w-md">
          <h2 className="font-orbitron text-2xl text-green-500 mb-4">
            Anonymous Chat Room
          </h2>
          <p className="mb-4 text-white">Username: {username}</p>
          <div className="h-64 bg-gray-800 p-4 rounded-md overflow-y-auto mb-4">
            {messages.map((msg, index) => (
              <ChatMessage
                key={index}
                username={msg.username}
                message={msg.message}
                isOwnMessage={msg.username === username}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <Button type="submit" className="ml-2">
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;