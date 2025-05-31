// src/components/feature/CreateRoomModal.jsx
import React, { useState } from 'react';

const CreateRoomModal = ({ isOpen, onClose, onSubmit }) => {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('public');
  const [cloneLimit, setCloneLimit] = useState(false);
  const [maxClones, setMaxClones] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!roomName.trim()) return;
    onSubmit({
      name: roomName,
      type: roomType,
      cloneLimit: roomType === 'private' && cloneLimit ? maxClones : null,
    });
    setRoomName('');
    setRoomType('public');
    setCloneLimit(false);
    setMaxClones(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold text-green-500 mb-4 font-orbitron">Tạo phòng mới</h2>
        <input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Tên phòng"
          className="w-full p-2 mb-4 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <select
          value={roomType}
          onChange={(e) => setRoomType(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="public">Công khai</option>
          <option value="private">Riêng</option>
        </select>
        {roomType === 'private' && (
          <div className="mb-4">
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={cloneLimit}
                onChange={(e) => setCloneLimit(e.target.checked)}
                className="mr-2"
              />
              Giới hạn tài khoản clone
            </label>
            {cloneLimit && (
              <input
                type="number"
                value={maxClones}
                onChange={(e) => setMaxClones(e.target.value)}
                min="1"
                className="w-full p-2 mt-2 bg-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            )}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded mr-2"
          >
            Tạo
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

export default CreateRoomModal;