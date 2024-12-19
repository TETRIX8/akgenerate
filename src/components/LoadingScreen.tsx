import React, { useEffect, useState } from 'react';

const LoadingScreen = () => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#1A1F2C] to-[#403E43]">
      <div className="relative p-4">
        <div className="absolute -inset-20 bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur-3xl animate-pulse" />
        <div className="text-4xl md:text-6xl font-bold text-center relative transition-all duration-500 ease-in-out">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#C8C8C9] to-white animate-fade-in">
            AK PROJECT
          </span>
          <div className="mt-4 flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <div className="absolute -inset-10 border border-white/10 rounded-xl animate-[pulse_2s_infinite] transition-all duration-300" />
          <div className="absolute -inset-20 border border-white/5 rounded-2xl animate-[pulse_3s_infinite] transition-all duration-300" />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;