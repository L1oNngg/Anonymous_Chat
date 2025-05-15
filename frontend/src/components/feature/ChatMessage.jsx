import React from 'react';

const ChatMessage = ({ username, message, isOwnMessage }) => {
  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div
        className={`max-w-xs p-2 rounded-lg ${
          isOwnMessage ? 'bg-blue-400 text-white' : 'bg-gray-200 text-black'
        }`}
      >
        <p className="text-sm font-bold">{username}</p>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;