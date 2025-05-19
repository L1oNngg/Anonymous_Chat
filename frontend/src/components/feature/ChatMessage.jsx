// src/components/feature/ChatMessage.jsx
import React from 'react';

const ChatMessage = ({ username, message, timestamp, isOwnMessage }) => {
  const isSticker =
    typeof message === 'string' &&
    (message.endsWith('.png') || message.endsWith('.gif') || message.endsWith('.jpg') || message.includes('/stickers/'));

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] p-3 rounded-lg ${
          isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'
        } shadow-md`}
      >
        <p className="text-sm font-semibold">{username}</p>
        {isSticker ? (
          <img
            src={message}
            alt="sticker"
            className="w-32 h-32 object-contain mt-1"
            onError={() => console.error('Failed to load sticker:', message)}
          />
        ) : (
          <p className="text-sm break-words">{message}</p>
        )}
        <p className="text-xs text-gray-400 text-right mt-1">{formattedTime}</p>
      </div>
    </div>
  );
};

export default ChatMessage;