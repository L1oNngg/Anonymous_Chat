// src/components/feature/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ rooms, currentRoom, onCreateRoom, onJoinRoom, onSwitchRoom }) => {
  return (
    <div className="w-64 h-screen bg-gray-800 p-4 flex flex-col">
      <h2 className="text-lg font-bold text-green-500 mb-4 font-orbitron">Phòng Chat</h2>
      <button
        onClick={onCreateRoom}
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mb-2"
      >
        Tạo phòng
      </button>
      <button
        onClick={onJoinRoom}
        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded mb-4"
      >
        Nhập mã phòng
      </button>
      <div>
        <h3 className="text-sm font-semibold text-gray-400">Phòng công khai</h3>
        {rooms
          .filter((room) => room.type === 'public')
          .map((room) => (
            <div
              key={room.id}
              onClick={() => onSwitchRoom(room.id)}
              className={`p-2 hover:bg-gray-700 cursor-pointer rounded ${
                currentRoom === room.id ? 'bg-gray-600' : ''
              }`}
            >
              {room.name}
            </div>
          ))}
        <h3 className="text-sm font-semibold text-gray-400 mt-4">Phòng riêng</h3>
        {rooms
          .filter((room) => room.type === 'private')
          .map((room) => (
            <div
              key={room.id}
              onClick={() => onSwitchRoom(room.id)}
              className={`p-2 hover:bg-gray-700 cursor-pointer rounded ${
                currentRoom === room.id ? 'bg-gray-600' : ''
              }`}
            >
              {room.name} 🔒
            </div>
          ))}
      </div>
      <Link to="/" className="mt-auto text-gray-400 hover:text-gray-200">
        Đăng xuất
      </Link>
    </div>
  );
};

export default Sidebar;