// src/components/feature/ChatMessage.jsx
import React from 'react';
import DOMPurify from 'dompurify';

const ChatMessage = ({ username, message, timestamp, isOwnMessage, isSticker, isEmoji }) =>
{
  // Log để debug props truyền vào
  console.log('ChatMessage props:', { username, message, timestamp, isOwnMessage, isSticker, isEmoji });
  // Thử alert để chắc chắn render (chỉ dùng để test, sau đó xóa)
  // alert(JSON.stringify({ username, message, isSticker }));

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] p-3 rounded-lg ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'
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
        ) : isEmoji ? (
          <span className="text-2xl">{message}</span>
        ) : (
          <p
            className="text-sm break-words"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message) }}
          ></p>
        )}
        <p className="text-xs text-gray-400 text-right mt-1">{formattedTime}</p>
      </div>
    </div>
  );
};

export default ChatMessage;