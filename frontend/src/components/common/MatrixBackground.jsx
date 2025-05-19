// src/components/common/MatrixBackground.jsx
import React, { useEffect, useRef } from 'react';

const MatrixBackground = () =>
{
  const canvasRef = useRef(null);

  useEffect(() =>
  {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    const drawMatrixRain = () =>
    {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Giảm độ mờ nền
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Giảm độ sáng ký tự
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++)
      {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height || Math.random() > 0.99)
        { // Giảm tần suất rơi
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(drawMatrixRain, 50); // Tăng thời gian giữa các frame
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full opacity-100" // Giảm opacity
    />
  );
};

export default MatrixBackground;