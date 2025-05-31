// src/components/feature/JoinRoomModal.jsx
import React, { useState } from 'react';

const JoinRoomModal = ({ isOpen, onClose, onSubmit }) => {
  const [roomCode, setRoomCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!roomCode.trim()) return;
    onSubmit(roomCode);
    setRoomCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold text-green-500 mb-4 font-orbitron">Nhập mã phòng</h2>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="Mã phòng"
          className="w-full p-2 mb-4 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded mr-2"
          >
            Tham gia
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;