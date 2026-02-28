import React, { useEffect, useState } from "react";

import MinecraftBackground from "./MinecraftBackground";

export default function Timeline() {
  const [localTime, setLocalTime] = useState("");
  const [currentDate, setCurrentDate] = useState(null);

  const timelineData = [
    {
      id: 1,
      date: "2026-01-24",
      side: "left",
      icon: "🪨",
      color: "text-gray-400",
      title: "La Era de Piedra",
      description: "Inicio del servidor..."
    },
    {
      id: 2,
      date: "2026-01-30",
      side: "right",
      icon: "🔶",
      color: "text-orange-400",
      title: "El Despertar del Metal",
      description: "Cobre + Evento Parkour"
    },
    {
      id: 3,
      date: "2026-02-06",
      side: "left",
      icon: "⚒️",
      color: "text-gray-300",
      title: "La Forja del Acero",
      description: "Hierro + Redstone"
    },
    {
      id: 4,
      date: "2026-02-13",
      side: "right",
      icon: "🔴",
      color: "text-red-600",
      title: "El Llamado de la Sangre",
      description: "PVP + Torneo."
    },
    {
      id: 5,
      date: "2026-02-20",
      side: "left",
      icon: "🧙‍♂️",
      color: "text-purple-500",
      title: "Los Secretos Arcanos",
      description: "Encantamientos"
    },
    {
      id: 6,
      date: "2026-02-27",
      side: "right",
      icon: "💰",
      color: "text-green-400",
      title: "La Era del Comercio",
      description: "Trade con aldeanos"
    },
    {
      id: 7,
      date: "2026-03-06",
      side: "left",
      icon: "💎",
      color: "text-sky-400",
      title: "El Corazón del Mundo",
      description: "Diamantes + Evento"
    },
    {
      id: 8,
      date: "2026-03-20",
      side: "right",
      icon: "🔥",
      color: "text-orange-500",
      title: "El Fuego Ancestral",
      description: "Apertura del Nether"
    },
    {
      id: 9,
      date: "2026-03-27",
      side: "left",
      icon: "👑",
      color: "text-yellow-400",
      title: "El Juicio Final",
      description: "Evento final"
    }
  ];

  useEffect(() => {
    const eventUTC = new Date("2026-01-25T01:00:00Z");

    setLocalTime(
      eventUTC.toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short"
      })
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  }, []);

  const getItemState = (dateStr) => {
    if (!currentDate) return "future";

    const [y, m, d] = dateStr.split("-").map(Number);
    const itemDate = new Date(y, m - 1, d);
    itemDate.setHours(0, 0, 0, 0);

    const timeDiff = itemDate.getTime() - currentDate.getTime();

    if (timeDiff < 0) return "past";
    if (timeDiff === 0) return "current";
    return "future";
  };

  const formatDateDisplay = (dateStr) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long"
    });
  };

  return (
    <section id="timeline" className="bg-[var(--black-color)] text-[var(--white-color)] py-24 px-6 overflow-hidden bg-minecraft">
      <div className="max-w-6xl mx-auto relative z-10">
      <MinecraftBackground />

        <div className="relative w-full text-center mb-24 space-y-4" data-aos="fade-down">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
            Línea de Tiempo
          </h2>
          <p className="text-xl text-gray-400">
            Apertura: <span className="text-[var(--tertiary-color)] font-bold">{localTime}</span>
          </p>
        </div>

        <div className="relative">
          
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-[2px] md:-translate-x-1/2 bg-white/10" />

          <div className="space-y-12 md:space-y-20">
            {timelineData.map((item) => {
              const state = getItemState(item.date);
              
              // Aquí definimos visualmente qué le pasa a cada estado
              const stateClasses = {
                past: "opacity-75 hover:opacity-100", // <- Mantiene sus colores, solo baja un poco la opacidad
                current: "opacity-100 scale-[1.02]",
                future: "opacity-40 grayscale blur-[0.5px] hover:blur-none hover:opacity-60"
              }[state];

              const cardGlow = state === "current" 
                ? "shadow-[0_0_30px_rgba(255,187,1,0.2)] ring-2 ring-[var(--tertiary-color)]" 
                : state === "past"
                ? "border border-green-500/20 hover:border-green-500/40" // Le damos un leve toque verde al borde si ya pasó
                : "border border-white/5 hover:border-white/20";

              return (
                <div
                  key={item.id}
                  className={`relative w-full md:w-1/2 pl-[80px] pr-4 md:px-8 py-2 z-5
                  ${item.side === "left" ? "md:pr-16 md:pl-8 md:text-right" : "md:ml-auto md:pl-16 md:text-left"} 
                  ${stateClasses} transition-all duration-500`}
                  data-aos="fade-up"
                >
                  
                  <div
                    className={`absolute top-6 z-10
                    left-[8px] md:left-auto md:right-auto md:-translate-x-1/2
                    ${item.side === "left" ? "md:right-[-42px]" : "md:left-[-22px]"} 
                    w-11 h-11 bg-[var(--black-color)] rounded-full 
                    flex items-center justify-center text-xl 
                    border-4 ${state === "current" ? "border-[var(--tertiary-color)] animate-pulse" : "border-[#1a1f2b]"}
                    shadow-lg`}
                  >
                    <span className={item.color}>{item.icon}</span>
                  </div>

                  <div
                    className={`bg-[var(--gray-dark-color)] backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl
                    transition-all duration-300 hover:-translate-y-2
                    ${cardGlow}`}
                  >
                    <span className={`text-sm font-bold uppercase tracking-wider block mb-2 
                      ${state === "current" ? "text-[var(--tertiary-color)]" : state === "past" ? "text-green-400" : "text-gray-500"}`}>
                      {formatDateDisplay(item.date)}
                      {state === "current" && " • HOY"}
                      {state === "past" && " • ✓ COMPLETADO"}
                    </span>

                    <h3 className={`text-2xl font-bold mb-3 ${state === "future" ? "text-gray-400" : "text-[var(--white-color)]"}`}>
                      {item.title}
                    </h3>

                    <p className={`${state === "future" ? "text-gray-500" : "text-gray-300"} text-sm md:text-base leading-relaxed`}>
                      {item.description}
                    </p>
                  </div>
                  
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}