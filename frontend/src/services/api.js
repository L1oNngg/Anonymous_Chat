// src/services/api.js

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8000';

const fetchMessages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.map(msg => ({
      username: msg.username,
      message: msg.content,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

const createWebSocket = (username, onMessage, onOpen, onClose, onError) => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${username}`);

  ws.onopen = () => {
    console.log(`WebSocket connected for ${username}`);
    if (onOpen) onOpen(); // Make onOpen optional
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'history' && Array.isArray(data.messages)) {
        onMessage(data.messages.map(msg => ({
          username: msg.username,
          message: msg.content,
        })));
      } else if (data.type === 'message' && data.username && data.content) {
        onMessage([{ username: data.username, message: data.content }]);
      } else {
        console.warn('Received unknown message type:', data); // Log unexpected data
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      onError(error); // Propagate parsing errors
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    if (onClose) onClose(); // Make onClose optional
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error); // Make onError optional
  };

  return ws;
};

const sendMessage = (ws, content) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'message', content }));
  } else {
    console.error('WebSocket is not open. Cannot send message.');
  }
};

export { fetchMessages, createWebSocket, sendMessage };