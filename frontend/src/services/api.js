// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost';
const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost';

const fetchSessionId = async (username) =>
{
  try
  {
    const response = await fetch(`${API_BASE_URL}/session/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok)
    {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    localStorage.setItem('sessionId', data.sessionId);
    return data.sessionId;
  } catch (error)
  {
    console.error('Error fetching session ID:', error);
    throw error;
  }
};

const fetchMessages = async (roomId) =>
{
  try
  {
    const response = await fetch(`${API_BASE_URL}/messages/${roomId}/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('sessionId') || ''}`,
      },
    });
    if (!response.ok)
    {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.map((msg) => ({
      username: msg.username,
      message: typeof msg.content === 'object' && msg.content.text ? msg.content.text : msg.content,
      timestamp: msg.timestamp,
    }));
  } catch (error)
  {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

const sendMessage = async (username, content, roomId, type = 'message') =>
{
  try
  {
    let payloadContent = {};
    if (type === 'message' && typeof content === 'string')
    {
      payloadContent = { text: content };
    } else if (type === 'message' && typeof content === 'object' && content.text)
    {
      payloadContent = { text: content.text };
    } else if (type === 'sticker')
    {
      // Nếu content là object {sticker_id: ...}
      if (typeof content === 'object' && content.sticker_id)
      {
        payloadContent = { sticker_id: content.sticker_id };
      }
      // Nếu content là string (sticker_id), dùng trực tiếp
      else if (typeof content === 'string')
      {
        payloadContent = { sticker_id: content };
      }
    }
    const response = await fetch(`${API_BASE_URL}/send/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('sessionId') || ''}`,
      },
      body: JSON.stringify({ username, content: payloadContent, roomId, type }),
    });
    if (!response.ok)
    {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error)
  {
    console.error('Error sending message:', error);
    throw error;
  }
};

const connectWebSocket = (username, roomId, onMessageReceived, onWebSocketError, onWebSocketClose) =>
{
  const sessionId = localStorage.getItem('sessionId') || '';
  const ws = new WebSocket(
    `${WS_BASE_URL}/ws/chat/${username}?sessionId=${sessionId}${roomId ? `&roomId=${roomId}` : ''}`
  );

  ws.onopen = () =>
  {
    console.log(`WebSocket connected for ${username} in room ${roomId}`);
  };

  ws.onmessage = (event) =>
  {
    try
    {
      const data = JSON.parse(event.data);
      onMessageReceived(data);
    } catch (error)
    {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) =>
  {
    console.error('WebSocket error:', error);
    if (onWebSocketError) onWebSocketError(error);
  };

  ws.onclose = (event) =>
  {
    console.log('WebSocket closed:', event);
    if (event.reason)
    {
      onWebSocketClose(event.reason);
    } else
    {
      onWebSocketClose('WebSocket disconnected unexpectedly.');
    }
  };

  return ws;
};

const sendWebSocketMessage = (ws, content, roomId, username) =>
{
  if (ws && ws.readyState === WebSocket.OPEN)
  {
    ws.send(JSON.stringify({
      type: 'message',
      username,
      content,
      roomId,
      timestamp: new Date().toISOString(),
    }));
  } else
  {
    console.error('WebSocket is not open. Cannot send message.');
  }
};

const sendSticker = (ws, content, roomId, username) =>
{
  if (ws && ws.readyState === WebSocket.OPEN)
  {
    console.log('Sending sticker via WebSocket:', content);
    ws.send(JSON.stringify({
      type: 'sticker',
      username,
      content,
      roomId,
      timestamp: new Date().toISOString(),
    }));
  } else
  {
    console.error('WebSocket is not open. Cannot send sticker.');
  }
};

export { fetchMessages, sendMessage, connectWebSocket, sendWebSocketMessage, sendSticker, fetchSessionId };