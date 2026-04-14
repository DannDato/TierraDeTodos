import React, { useEffect, useState } from 'react';

function LoadingOverlay({ message = "Cargando...", isVisible = true }) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [isActive, setIsActive] = useState(isVisible);

  useEffect(() => {
    let timeoutId;

    if (isVisible) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsActive(true));
    } else {
      setIsActive(false);
      timeoutId = setTimeout(() => setShouldRender(false), 220);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md bg-black/30 transition-opacity duration-200 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Spinner con colores de TDT */}
      <div className={`relative flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-100' : 'scale-95'}`}>
        <div className="w-16 h-16 border-4 border-[var(--secondary-color)]/20 border-t-[var(--secondary-color)] rounded-full animate-spin"></div>
        {/* <img 
          src="/img/cubo.webp" 
          alt="Cubo" 
          className="absolute w-6 animate-pulse" 
        /> */}
      </div>
      
      <p className="mt-4 text-white font-bold tracking-widest uppercase text-md animate-pulse">
        {message}
      </p>
    </div>
  );
}

export default LoadingOverlay;