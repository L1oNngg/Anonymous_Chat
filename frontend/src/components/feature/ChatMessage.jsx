import React from 'react';

const ChatMessage = ({ username, message, isOwnMessage }) => {
  const isSticker =
    typeof message === 'string' &&
    (message.endsWith('.png') ||
      message.endsWith('.gif') ||
      message.endsWith('.jpg') ||
      message.includes('/stickers/'));

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-xs p-2 rounded-lg ${
          isOwnMessage ? 'bg-blue-400 text-white' : 'bg-gray-200 text-black'
        }`}
      >
        <p className="text-sm font-bold">{username}</p>
        {isSticker ? (
          <img
            src={message}
            alt="sticker"
            className="w-24 h-24 object-contain mt-1"
            onError={() => console.error('Failed to load sticker:', message)}
          />
        ) : (
          <p>{message}</p>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
