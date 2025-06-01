// src/components/feature/CreateRoomModal.jsx
import React, { useState } from 'react';
import Button from '../common/Button';

const CreateRoomModal = ({ isOpen, onClose, onSubmit }) => {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('public');
  const [maxConnections, setMaxConnections] = useState(2);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const options = roomType === 'private' ? { max_connections_per_ip: parseInt(maxConnections) } : {};
    onSubmit({ name: roomName, type: roomType, ...options });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl text-green-500 mb-4">Tạo Phòng</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Tên phòng"
            className="p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
            required
          />
          <select
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            className="p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
          >
            <option value="public">Công khai</option>
            <option value="private">Riêng tư</option>
          </select>
          {roomType === 'private' && (
            <input
              type="number"
              value={maxConnections}
              onChange={(e) => setMaxConnections(e.target.value)}
              min="1"
              max="10"
              placeholder="Số kết nối tối đa (1-10)"
              className="p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              required
            />
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600">
              Hủy
            </Button>
            <Button type="submit" className="px-4 py-2 bg-green-600">
              Tạo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;