// src/hooks/useChat.js
import { useState, useEffect, useRef } from 'react';
import { fetchMessages, connectWebSocket, sendWebSocketMessage, sendSticker, fetchSessionId, sendMessage as apiSendMessage } from '../services/api';
import nacl from 'tweetnacl';

// Hàm chuyển Uint8Array thành base64 trong trình duyệt
const uint8ArrayToBase64 = (array) =>
{
  const binaryString = String.fromCharCode(...array);
  return btoa(binaryString);
};

// Debounce function
const debounce = (func, delay) =>
{
  let timeoutId;
  return (...args) =>
  {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const useChat = (username, roomId) =>
{
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);
  const [keyPair, setKeyPair] = useState(null);
  const [publicKeys, setPublicKeys] = useState({});
  const [isSending, setIsSending] = useState(false);

  useEffect(() =>
  {
    if (!username || !roomId) return;

    const newKeyPair = nacl.box.keyPair();
    setKeyPair(newKeyPair);

    const initializeSession = async () =>
    {
      console.log(`Fetching sessionId for ${username}`);
      localStorage.removeItem('sessionId');
      try
      {
        const sessionId = await fetchSessionId(username);
        console.log(`Fetched sessionId: ${sessionId}`);
        localStorage.setItem('sessionId', sessionId);
      } catch (error)
      {
        console.error('Failed to fetch sessionId:', error);
        setNotifications((prev) => [...prev, { id: Date.now(), content: 'Không thể lấy session ID.' }]);
        return;
      }

      const socket = connectWebSocket(
        username,
        roomId,
        (data) =>
        {
          if (data.type === 'message' || data.type === 'sticker')
          {
            let messageContent;
            let isSticker = false;
            let isEmoji = false;
            if (data.content && data.content.encryptedContent && keyPair)
            {
              const theirPublicKey = publicKeys[data.username];
              if (theirPublicKey)
              {
                const nonce = new Uint8Array(atob(data.content.nonce).split('').map(c => c.charCodeAt(0)));
                const encryptedContent = new Uint8Array(atob(data.content.encryptedContent).split('').map(c => c.charCodeAt(0)));
                const decrypted = nacl.box.open(encryptedContent, nonce, new Uint8Array(atob(theirPublicKey).split('').map(c => c.charCodeAt(0))), keyPair.secretKey);
                messageContent = decrypted ? new TextDecoder().decode(decrypted) : 'Tin nhắn mã hóa (không thể giải mã)';
              } else
              {
                messageContent = 'Tin nhắn mã hóa (thiếu khóa công khai)';
              }
            } else if (data.content && typeof data.content === 'object')
            {
              if (data.content.sticker_id)
              {
                messageContent = `/stickers/${data.content.sticker_id}.jpg`;
                isSticker = true;
              } else if (data.content.emoji)
              {
                messageContent = data.content.emoji;
                isEmoji = true;
              } else if (data.content.text)
              {
                messageContent = data.content.text;
              } else
              {
                messageContent = 'Tin nhắn không xác định';
              }
            } else if (typeof data.content === 'string')
            {
              messageContent = data.content;
            } else
            {
              messageContent = 'Tin nhắn không hợp lệ';
            }
            setMessages((prev) => [...prev, {
              username: data.username,
              message: messageContent,
              timestamp: data.timestamp,
              isSticker,
              isEmoji
            }]);
          } else if (data.type === 'users')
          {
            setOnlineUsers(data.users);
          } else if (data.type === 'notification')
          {
            const newNotification = { id: Date.now(), content: data.content };
            setNotifications((prev) => [...prev, newNotification]);
            setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id)), 5000);
          } else if (data.type === 'session')
          {
            localStorage.setItem('sessionId', data.sessionId);
          } else if (data.type === 'publicKey')
          {
            setPublicKeys((prev) =>
            {
              const updatedKeys = { ...prev, [data.username]: data.publicKey };
              console.log('Updated publicKeys:', updatedKeys);
              return updatedKeys;
            });
          } else if (data.type === 'history')
          {
            setMessages(data.messages.map(msg =>
            {
              let messageContent = '';
              let isSticker = false;
              let isEmoji = false;
              if (msg.content && typeof msg.content === 'object')
              {
                if (msg.content.sticker_id)
                {
                  messageContent = `/stickers/${msg.content.sticker_id}.jpg`;
                  isSticker = true;
                } else if (msg.content.emoji)
                {
                  messageContent = msg.content.emoji;
                  isEmoji = true;
                } else if (msg.content.text)
                {
                  messageContent = msg.content.text;
                } else
                {
                  messageContent = 'Tin nhắn không xác định';
                }
              } else if (typeof msg.content === 'string')
              {
                messageContent = msg.content;
              } else
              {
                messageContent = 'Tin nhắn không hợp lệ';
              }
              return {
                username: msg.username,
                message: messageContent,
                timestamp: msg.timestamp,
                isSticker,
                isEmoji
              };
            }));
          }
        },
        (error) =>
        {
          console.error('WebSocket error:', error);
          setNotifications((prev) => [...prev, { id: Date.now(), content: 'Lỗi kết nối WebSocket.' }]);
        },
        (reason) =>
        {
          // Do nothing on disconnect, no notification
        }
      );

      wsRef.current = socket;

      // Gửi publicKey chỉ khi WebSocket mở
      socket.addEventListener('open', () =>
      {
        socket.send(JSON.stringify({
          type: 'publicKey',
          username,
          publicKey: uint8ArrayToBase64(newKeyPair.publicKey),
          roomId
        }));
      });

      return () =>
      {
        if (wsRef.current)
        {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    };

    fetchMessages(roomId).then((msgs) =>
    {
      const filteredMessages = msgs.map(msg =>
      {
        let messageContent = '';
        let isSticker = false;
        let isEmoji = false;
        if (msg.content && typeof msg.content === 'object')
        {
          if (msg.content.sticker_id)
          {
            messageContent = `/stickers/${msg.content.sticker_id}.jpg`;
            isSticker = true;
          } else if (msg.content.emoji)
          {
            messageContent = msg.content.emoji;
            isEmoji = true;
          } else if (msg.content.text)
          {
            messageContent = msg.content.text;
          } else
          {
            messageContent = 'Tin nhắn không xác định';
          }
        } else if (typeof msg.content === 'string')
        {
          messageContent = msg.content;
        } else
        {
          messageContent = 'Tin nhắn không hợp lệ';
        }
        return {
          username: msg.username,
          message: messageContent,
          timestamp: msg.timestamp,
          isSticker,
          isEmoji
        };
      });
      setMessages(filteredMessages);
    }).catch((err) =>
    {
      console.error('Lỗi fetch messages:', err);
      setNotifications((prev) => [...prev, { id: Date.now(), content: 'Không thể tải tin nhắn.' }]);
    });

    initializeSession();

    return () =>
    {
      if (wsRef.current)
      {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [username, roomId]);

  const debouncedSendMessage = debounce((content, type) =>
  {
    if (isSending || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !keyPair || !username) return;

    setIsSending(true);

    const sessionId = localStorage.getItem('sessionId');
    let apiContent = content;

    if (type === 'message')
    {
      if (typeof content === 'string')
      {
        apiContent = { text: content };
      } else if (typeof content === 'object' && (content.emoji || content.text))
      {
        apiContent = content;
      }
    } else if (type === 'sticker')
    {
      if (typeof content === 'string' && content && content !== 'unknown')
      {
        apiContent = { sticker_id: content };
      } else
      {
        setNotifications((prev) => [...prev, { id: Date.now(), content: 'Sticker không hợp lệ!' }]);
        setIsSending(false);
        return;
      }
    }

    apiSendMessage(username, apiContent, roomId, type).catch((error) =>
    {
      console.error('Failed to save message to server:', error);
      setNotifications((prev) => [...prev, { id: Date.now(), content: 'Không thể lưu tin nhắn lên server.' }]);
    });

    // Chỉ lấy public key của các user khác mình
    const recipients = onlineUsers.filter(u => u !== username);
    if (recipients.length === 0)
    {
      setIsSending(false);
      return;
    }

    const allPublicKeysAvailable = recipients.every(recipient => !!publicKeys[recipient]);
    if (!allPublicKeysAvailable)
    {
      setIsSending(false);
      return;
    }

    recipients.forEach(recipient =>
    {
      const theirPublicKey = publicKeys[recipient] ? new Uint8Array(atob(publicKeys[recipient]).split('').map(c => c.charCodeAt(0))) : null;
      let messageContent = content;
      if (theirPublicKey && type === 'message')
      {
        const nonce = nacl.randomBytes(nacl.box.nonceLength);
        const encrypted = nacl.box(new TextEncoder().encode(content), nonce, theirPublicKey, keyPair.secretKey);
        messageContent = { encryptedContent: uint8ArrayToBase64(encrypted), nonce: uint8ArrayToBase64(nonce) };
      } else if (type === 'sticker')
      {
        messageContent = content;
      }
      if (type === 'message') sendWebSocketMessage(wsRef.current, messageContent, roomId, username);
      else if (type === 'sticker') sendSticker(wsRef.current, messageContent, roomId, username);
    });

    setIsSending(false);
  }, 500);

  const sendMessage = (content, type = 'message') => debouncedSendMessage(content, type);
  const sendSticker = (content) => debouncedSendMessage(content, 'sticker');

  const closeNotification = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  return { messages, sendMessage, sendSticker, onlineUsers, notifications, closeNotification };
};

export default useChat;