// src/services/api.js

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
// const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8000';

const API_BASE_URL = 'http://localhost:8000'; // Local testing
const WS_BASE_URL = 'ws://localhost:8000';    // Local testing

// Fetch messages from backend
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

// Send message via REST
const sendMessage = async (username, content) => {
  try {
    const response = await fetch(`${API_BASE_URL}/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, content }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Connect WebSocket
const connectWebSocket = (username, onMessageReceived, onWebSocketError, onWebSocketClose) => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${username}`);

  ws.onopen = () => {
    console.log(`WebSocket connected for ${username}`);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessageReceived(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onWebSocketError) onWebSocketError(error);
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected');
    if (onWebSocketClose) onWebSocketClose();
  };

  return ws;
};

// Send WebSocket text message
const sendWebSocketMessage = (ws, content) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      content,
      timestamp: new Date().toISOString()
    }));
  } else {
    console.error('WebSocket is not open. Cannot send message.');
  }
};

// Send WebSocket sticker
const sendSticker = (ws, content) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('Sending sticker via WebSocket:', content);
    ws.send(JSON.stringify({
      type: 'sticker',
      content,
      timestamp: new Date().toISOString()
    }));
  } else {
    console.error('WebSocket is not open. Cannot send sticker.');
  }
};

// Export everything you need
export { fetchMessages,  sendMessage,  connectWebSocket,  sendWebSocketMessage,  sendSticker };
