// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { fetchMessages, connectWebSocket } from '../services/api';

const useChat = (username) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!username) return;

    fetchMessages()
      .then((msgs) => setMessages(msgs))
      .catch((err) => console.error('Lỗi fetch messages:', err));

    const socket = connectWebSocket(username, (data) => {
      console.log('WebSocket received:', data);
      if (data.type === 'message' || data.type === 'sticker') {
        setMessages((prev) => [
          ...prev,
          { username: data.username, message: data.content, timestamp: data.timestamp },
        ]);
      } else if (data.type === 'users') {
        setOnlineUsers(data.users);
      }
    });

    wsRef.current = socket;

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [username]);

  const sendMessage = (content, type = 'message') => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected or not open');
      return;
    }
    console.log('Sending:', { type, username, content });
    ws.send(JSON.stringify({ type, username, content }));
  };

  const sendSticker = (content) => sendMessage(content, 'sticker');

  return { messages, sendMessage, sendSticker, onlineUsers };
};

export default useChat;
