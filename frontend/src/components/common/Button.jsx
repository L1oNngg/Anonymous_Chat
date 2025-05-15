import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ to, children, className = '', type = 'button', ...props }) => {
  const baseClasses = 'inline-block px-6 py-3 m-2 text-lg text-white bg-blue-400 rounded-md hover:bg-blue-500 transition-colors duration-300';

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