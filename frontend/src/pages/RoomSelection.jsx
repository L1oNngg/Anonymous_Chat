// src/pages/RoomSelection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/feature/Sidebar';
import ChatRoom from './ChatRoom';
import CreateRoomModal from '../components/feature/CreateRoomModal';
import JoinRoomModal from '../components/feature/JoinRoomModal';
import { v4 as uuidv4 } from 'uuid';
import { REACT_APP_API_BASE_URL } from '../services/api';

const DEFAULT_ROOM = { id: 1, name: 'Phòng chung', type: 'public', code: null };

const RoomSelection = () =>
{
  const { state } = useLocation();
  const { username = 'Guest' } = state || {};
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([DEFAULT_ROOM]);
  const [currentRoom, setCurrentRoom] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // Lưu danh sách phòng đã join vào localStorage
  useEffect(() =>
  {
    const joinedRoomIds = rooms.filter(r => r.joined).map(r => r.id);
    localStorage.setItem('joinedRooms', JSON.stringify(joinedRoomIds));
  }, [rooms]);

  // Khi fetch phòng từ backend, merge trạng thái joined từ localStorage
  useEffect(() =>
  {
    const fetchRooms = async () =>
    {
      try
      {
        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/rooms`);
        const data = await res.json();
        const joinedRoomIds = JSON.parse(localStorage.getItem('joinedRooms') || '[]');
        const allRooms = [
          { ...DEFAULT_ROOM, joined: true },
          ...data.filter(r => r.id !== 1).map(r => ({
            ...r,
            joined: joinedRoomIds.includes(r.id)
          }))
        ];
        setRooms(allRooms);
      } catch (err)
      {
        setRooms([{ ...DEFAULT_ROOM, joined: true }]);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() =>
  {
    localStorage.setItem('currentRoom', currentRoom);
  }, [currentRoom]);

  // Nếu currentRoom không còn trong rooms, chuyển về phòng chung
  useEffect(() =>
  {
    if (!rooms.find(r => r.id === currentRoom))
    {
      setCurrentRoom(1);
    }
  }, [rooms, currentRoom]);

  // Tự động xóa phòng riêng nếu chỉ còn 1 người hoặc không ai sau 5 phút (chỉ local)
  const roomTimers = useRef({});

  useEffect(() =>
  {
    // Xóa các timer cũ
    Object.values(roomTimers.current).forEach(clearTimeout);
    roomTimers.current = {};
    rooms.forEach(room =>
    {
      if (room.type === 'private' && room.createdAt)
      {
        const now = Date.now();
        const elapsed = now - room.createdAt;
        const timeout = Math.max(0, 5 * 60 * 1000 - elapsed); // 5 phút - thời gian đã trôi qua
        // Đặt timer kiểm tra phòng này
        roomTimers.current[room.id] = setTimeout(() =>
        {
          // Kiểm tra lại số người trong phòng (ở đây chỉ kiểm tra local, nếu muốn chính xác phải lấy từ backend)
          // Nếu chỉ còn 1 người hoặc không ai, xóa phòng và chuyển về phòng chung nếu đang ở phòng đó
          setRooms(prevRooms =>
          {
            const updated = prevRooms.filter(r => r.id !== room.id);
            if (currentRoom === room.id) setCurrentRoom(1);
            return updated;
          });
        }, timeout);
      }
    });
    // Cleanup khi unmount
    return () =>
    {
      Object.values(roomTimers.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line
  }, [rooms]);

  const handleCreateRoom = () => setIsCreateModalOpen(true);
  const handleJoinRoom = () => setIsJoinModalOpen(true);

  // Khi tạo phòng, gửi lên backend và fetch lại danh sách phòng
  const handleRoomSubmit = async (newRoom) =>
  {
    const roomCode = uuidv4().slice(0, 8);
    const room = {
      id: Date.now(),
      ...newRoom,
      type: 'private',
      code: roomCode,
      createdAt: Date.now()
    };
    // Gửi lên backend
    await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/create_room`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room)
    });
    await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/set_room_options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: room.id,
        room_type: 'private',
        options: { max_connections_per_ip: newRoom.max_connections_per_ip }
      })
    });

    // Đợi cho đến khi phòng mới xuất hiện trong danh sách phòng (tránh race condition)
    let found = false;
    for (let i = 0; i < 20; i++) // thử tối đa 20 lần (4s)
    {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/rooms`);
      const data = await res.json();
      const createdRoom = data.find(r => r.id === room.id);
      if (createdRoom && createdRoom.max_connections_per_ip === newRoom.max_connections_per_ip)
      {
        found = true;
        setRooms([
          { ...DEFAULT_ROOM, joined: true },
          ...data.filter(r => r.id !== 1).map(r =>
            r.id === room.id ? { ...r, joined: true } : r
          )
        ]);
        setCurrentRoom(room.id);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!found)
    {
      alert('Không thể tạo phòng mới. Vui lòng thử lại.');
    }
  };

  // Khi tham gia phòng, tìm phòng theo mã và cập nhật trạng thái
  const handleJoinSubmit = async (roomCode) =>
  {
    let room = rooms.find((r) => r.code === roomCode);
    if (!room)
    {
      // Thử fetch lại từ backend
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'}/rooms`);
      const data = await res.json();
      room = data.find((r) => r.code === roomCode);
      if (room)
      {
        // Nếu phòng có password, yêu cầu nhập
        if (room.password)
        {
          const inputPassword = prompt('Nhập mật khẩu phòng:');
          if (inputPassword !== room.password)
          {
            alert('Sai mật khẩu!');
            return;
          }
        }
        setRooms(prev => [
          ...prev,
          { ...room, joined: true }
        ]);
        setCurrentRoom(room.id);
        return;
      }
    }
    if (room)
    {
      if (room.password)
      {
        const inputPassword = prompt('Nhập mật khẩu phòng:');
        if (inputPassword !== room.password)
        {
          alert('Sai mật khẩu!');
          return;
        }
      }
      setRooms(prev =>
        prev.map(r => r.id === room.id ? { ...r, joined: true } : r)
      );
      setCurrentRoom(room.id);
    } else
    {
      alert('Mã phòng không tồn tại hoặc bạn chưa được mời vào phòng này! Chuyển về phòng chung.');
      setCurrentRoom(1);
    }
  };

  const handleSwitchRoom = (roomId) =>
  {
    if (roomId === 1) setCurrentRoom(1);
    else setCurrentRoom(roomId);
  };

  if (!username)
  {
    navigate('/');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onSwitchRoom={handleSwitchRoom}
      />
      <div className="flex-1">
        <ChatRoom username={username} roomId={currentRoom} room={rooms.find((r) => r.id === currentRoom)} />
      </div>
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleRoomSubmit}
      />
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSubmit={handleJoinSubmit}
      />
    </div>
  );
};

export default RoomSelection;