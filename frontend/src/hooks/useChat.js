// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { fetchMessages, connectWebSocket } from '../services/api';

const useChat = (username) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
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
      } else if (data.type === 'notification') {
        const newNotification = { id: Date.now(), content: data.content };
        setNotifications((prev) => [...prev, newNotification]);
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
        }, 3000);
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
    const timestamp = new Date().toISOString(); // Tạo timestamp ở frontend
    console.log('Sending:', { type, username, content, timestamp });
    ws.send(JSON.stringify({ type, username, content, timestamp }));
  };

  const sendSticker = (content) => sendMessage(content, 'sticker');

  const closeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { messages, sendMessage, sendSticker, onlineUsers, notifications, closeNotification };
};

export default useChat;