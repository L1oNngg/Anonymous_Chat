import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import MatrixBackground from '../components/common/MatrixBackground';

const Welcome = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      navigate('/rooms', { state: { username } });
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <MatrixBackground />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center w-full h-full z-10">
        <div className="bg-black bg-opacity-70 p-5 rounded-md flex flex-col items-center shadow-[0_0_30px_5px_rgba(0,0,0,0.5)]">
          <h2 className="font-orbitron text-4xl text-green-500 mb-4">
            Anonymous Chat
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-64 p-2 mb-4 text-black border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <Button type="submit">Join Chat</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Welcome;