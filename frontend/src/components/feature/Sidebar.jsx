// src/components/feature/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ rooms, currentRoom, onCreateRoom, onJoinRoom, onSwitchRoom }) =>
{
  const publicRoom = rooms.find(r => r.id === 1);

  return (
    <div className="w-64 h-screen bg-gray-900 p-4 flex flex-col shadow-lg border-r border-green-500 font-sans">
      <h2 className="text-xl font-bold text-green-400 mb-6 font-orbitron tracking-wide drop-shadow-lg">Phòng Chat</h2>
      <button
        onClick={onCreateRoom}
        className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white py-2 px-4 rounded-lg mb-2 font-semibold shadow transition-all"
      >
        + Tạo phòng
      </button>
      <button
        onClick={onJoinRoom}
        className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-2 px-4 rounded-lg mb-6 font-semibold shadow transition-all"
      >
        🔑 Nhập mã phòng
      </button>
      <div>
        <h3 className="text-sm font-semibold text-green-300 mb-2">Phòng chung</h3>
        {publicRoom && (
          <div
            key={publicRoom.id}
            onClick={() => onSwitchRoom(publicRoom.id)}
            className={`flex items-center gap-2 p-2 mb-1 rounded-lg cursor-pointer border border-transparent transition-all
              ${currentRoom === publicRoom.id
                ? 'bg-green-700 text-white border-green-400 shadow'
                : 'bg-gray-800 text-green-200 hover:bg-green-800 hover:text-white'}
            `}
            style={{ fontWeight: currentRoom === publicRoom.id ? 'bold' : 'normal' }}
          >
            <span className="material-icons text-green-300">public</span>
            {publicRoom.name}
          </div>
        )}
        <h3 className="text-sm font-semibold text-pink-300 mt-2 mb-2">Phòng riêng</h3>
        {rooms
          .filter((room) => room.type === 'private' && room.joined) // chỉ hiện phòng đã join
          .map((room) => (
            <div
              key={room.id}
              onClick={() => onSwitchRoom(room.id)}
              className={`flex items-center gap-2 p-2 mb-1 rounded-lg cursor-pointer border border-transparent transition-all
                ${currentRoom === room.id
                  ? 'bg-pink-700 text-white border-pink-400 shadow'
                  : 'bg-gray-800 text-pink-200 hover:bg-pink-800 hover:text-white'}
              `}
              style={{ fontWeight: currentRoom === room.id ? 'bold' : 'normal' }}
            >
              <span className="material-icons text-pink-300">lock</span>
              {room.name}
              <span className="ml-auto text-xs bg-pink-600 text-white px-2 py-0.5 rounded">Mã: {room.code}</span>
            </div>
          ))}
      </div>
      <Link to="/" className="mt-auto text-gray-400 hover:text-green-300 font-semibold transition-all">
        Đăng xuất
      </Link>
    </div>
  );
};

export default Sidebar;