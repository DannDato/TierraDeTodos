import React from 'react';

function LoadingOverlay({ message = "Cargando..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md bg-black/30 transition-all">
      {/* Spinner con colores de TDT */}
      <div className="relative flex items-center justify-center">
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