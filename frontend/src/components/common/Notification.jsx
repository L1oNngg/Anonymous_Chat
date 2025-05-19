// src/components/common/Notification.jsx
import React from 'react';
import '../../styles/common/Notification.css';

const Notification = ({ id, content, onClose }) => {
  return (
    <div className="notification" key={id}>
      <div className="notification-content">
        <span>{content}</span>
        <button className="notification-close" onClick={() => onClose(id)}>
          &times;
        </button>
      </div>
    </div>
  );
};

export default Notification;