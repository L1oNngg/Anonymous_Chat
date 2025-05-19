// src/components/common/Button.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ to, children, className = '', type = 'button', ...props }) => {
  const baseClasses = 'inline-block px-4 py-2 text-base text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-400';

  if (to) {
    return (
      <Link
        to={to}
        className={`${baseClasses} ${className}`}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;