import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchMessages, createWebSocket, sendMessage } from '../services/api';

const useChat = (username, delay = 500) => {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  const loadInitialMessages = useCallback(async () => {
    try {
      const initialMessages = await fetchMessages();
      setMessages(initialMessages);
    } catch (error) {
      console.error('Failed to load initial messages:', error);
    }
  }, []);

  const setupWebSocket = useCallback(() => {
    if (username) {
      wsRef.current = createWebSocket(
        username,
        (newMessages) => {
          setMessages((prevMessages) => [...prevMessages, ...newMessages]);
        },
        () => { console.log('WebSocket connected in hook'); },
        () => { console.log('WebSocket disconnected in hook'); },
        (error) => { console.error('WebSocket error in hook:', error); }
      );
    }
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setupWebSocket();
    }, delay);

    return () => clearTimeout(timer);
  }, [username, setupWebSocket, delay]);

  const handleSendMessage = useCallback((content) => {
    sendMessage(wsRef.current, content);
  }, []);

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  return { messages, sendMessage: handleSendMessage };
};

export default useChat;