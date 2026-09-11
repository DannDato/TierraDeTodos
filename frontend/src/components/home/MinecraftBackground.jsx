import React, { useMemo } from "react";

// Animación de fondo fija con cubos de Minecraft para toda la página

export default function MinecraftBackground() {
  const cubes = useMemo(() => {
    const colors = [
      "text-[var(--primary-color)]",
      "text-[var(--secondary-color)]",
      "text-[var(--tertiary-color)]",
      "text-[var(--dirt-color)]"
    ];

    return Array.from({ length: 18 }).map((_, i) => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const left = Math.random() * 100; 
      const size = Math.random() * 40 + 80;
      const duration = Math.random() * 12 + 10; 

      const delay = Math.random() * -25;

      return (
        <div
          key={i}
          className={`mc-cube-anim ${randomColor}`}
          style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        >
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
            <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />
            <polyline points="10,30 50,50 90,30" />
            <line x1="50" y1="50" x2="50" y2="90" />
          </svg>
        </div>
      );
    });
  }, []);

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {cubes}
    </div>
  );
}