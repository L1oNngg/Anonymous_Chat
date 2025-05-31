// src/pages/RoomSelection.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/feature/Sidebar';
import ChatRoom from './ChatRoom';
import CreateRoomModal from '../components/feature/CreateRoomModal';
import JoinRoomModal from '../components/feature/JoinRoomModal';
import { v4 as uuidv4 } from 'uuid';

const RoomSelection = () => {
  const { state } = useLocation();
  const { username = 'Guest' } = state || {};
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Phòng chung 1', type: 'public', code: null, cloneLimit: null },
  ]);
  const [currentRoom, setCurrentRoom] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const handleCreateRoom = () => setIsCreateModalOpen(true);
  const handleJoinRoom = () => setIsJoinModalOpen(true);

  const handleRoomSubmit = (newRoom) => {
    const roomCode = newRoom.type === 'private' ? uuidv4().slice(0, 8) : null;
    setRooms([...rooms, { id: rooms.length + 1, ...newRoom, code: roomCode }]);
  };

  const handleJoinSubmit = (roomCode) => {
    const room = rooms.find((r) => r.code === roomCode);
    if (room) {
      setCurrentRoom(room.id);
    } else {
      alert('Mã phòng không tồn tại!');
    }
  };

  const handleSwitchRoom = (roomId) => {
    setCurrentRoom(roomId);
  };

  if (!username) {
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