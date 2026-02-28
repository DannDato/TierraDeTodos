import React, { useMemo } from "react";

export default function MinecraftBackground() {
  // Generamos los datos de los cubos una sola vez al cargar usando useMemo
  const cubes = useMemo(() => {
    // Array con las variables de tus colores
    const colors = [
      "text-[var(--primary-color)]",
      "text-[var(--secondary-color)]",
      "text-[var(--tertiary-color)]",
      "text-[var(--dirt-color)]"
    ];

    // Creamos 15 cubos con valores aleatorios
    return Array.from({ length: 15 }).map((_, i) => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const left = Math.random() * 100; // Posición horizontal (0% a 100%)
      const size = Math.random() * 40 + 100; // Tamaño entre 100px y 140px
      const duration = Math.random() * 15 + 10; 

      const delay = Math.random() * -25;

      return (
        <div
          key={i}
          className={`mc-cube-anim ${randomColor} z-1 `}
          style={{
            left: `${left}%`,
            width: `${size}px`,
            height: `${size}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        >
          {/* SVG de un cubo isométrico dibujado con líneas (Outline) */}
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
            {/* Contorno exterior (hexágono) */}
            <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" />
            {/* Líneas interiores que le dan la forma 3D de cubo */}
            <polyline points="10,30 50,50 90,30" />
            <line x1="50" y1="50" x2="50" y2="90" />
          </svg>
        </div>
      );
    });
  }, []);

  return (
    // pointer-events-none asegura que los cubos no estorben al hacer clic en el texto
    <div className="absolute inset-0 z-0 pointer-events-none">
      {cubes}
    </div>
  );
}