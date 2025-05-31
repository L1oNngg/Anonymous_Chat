// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { fetchMessages, connectWebSocket, sendWebSocketMessage, sendSticker } from '../services/api';

const useChat = (username, roomId) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!username || !roomId) return;

    fetchMessages(roomId)
      .then((msgs) => setMessages(msgs))
      .catch((err) => {
        console.error('Lỗi fetch messages:', err);
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), content: 'Không thể tải tin nhắn.' },
        ]);
      });

    const socket = connectWebSocket(
      username,
      roomId,
      (data) => {
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
          }, 5000);
        } else if (data.type === 'history') {
          setMessages(data.messages.map((msg) => ({
            username: msg.username,
            message: msg.content,
            timestamp: msg.timestamp,
          })));
        }
      },
      (error) => {
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), content: 'Lỗi kết nối WebSocket.' },
        ]);
      },
      (reason) => {
        setNotifications((prev) => [
          ...prev,
          { id: Date.now(), content: reason },
        ]);
      }
    );

    wsRef.current = socket;

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [username, roomId]);

  const sendMessage = (content, type = 'message') => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setNotifications((prev) => [
        ...prev,
        { id: Date.now(), content: 'WebSocket không kết nối. Vui lòng thử lại.' },
      ]);
      return;
    }
    if (type === 'message') {
      sendWebSocketMessage(ws, content, roomId, username);
    } else if (type === 'sticker') {
      sendSticker(ws, content, roomId, username);
    }
  };

  const sendSticker = (content) => sendMessage(content, 'sticker');

  const closeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { messages, sendMessage, sendSticker, onlineUsers, notifications, closeNotification };
};

export default useChat;