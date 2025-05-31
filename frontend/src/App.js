import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import ChatRoom from './pages/ChatRoom';
import RoomSelection from './pages/RoomSelection'; // <-- Add this line

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="/rooms" element={<RoomSelection />} />
      </Routes>
    </Router>
  );
};

export default App;