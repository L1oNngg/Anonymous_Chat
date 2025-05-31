// src/services/api.js

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
// const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8000';

const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

const fetchMessages = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${roomId}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.map((msg) => ({
      username: msg.username,
      message: msg.content,
      timestamp: msg.timestamp,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

const sendMessage = async (username, content, roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, content, roomId }),
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

const connectWebSocket = (username, roomId, onMessageReceived, onWebSocketError, onWebSocketClose) => {
  const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${username}`); // Bỏ roomId trong URL

  ws.onopen = () => {
    console.log(`WebSocket connected for ${username} in room ${roomId}`);
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

  ws.onclose = (event) => {
    console.log('WebSocket closed:', event);
    if (event.reason) {
      onWebSocketClose(event.reason);
    } else {
      onWebSocketClose('WebSocket disconnected unexpectedly.');
    }
  };

  return ws;
};

const sendWebSocketMessage = (ws, content, roomId, username) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'message',
      username,
      content,
      roomId,
      timestamp: new Date().toISOString(),
    }));
  } else {
    console.error('WebSocket is not open. Cannot send message.');
  }
};

const sendSticker = (ws, content, roomId, username) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log('Sending sticker via WebSocket:', content);
    ws.send(JSON.stringify({
      type: 'sticker',
      username,
      content,
      roomId,
      timestamp: new Date().toISOString(),
    }));
  } else {
    console.error('WebSocket is not open. Cannot send sticker.');
  }
};

export { fetchMessages, sendMessage, connectWebSocket, sendWebSocketMessage, sendSticker };