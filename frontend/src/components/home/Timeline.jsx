import React, { useEffect, useState } from "react";
import api from "../../api/axios";

import MinecraftBackground from "./MinecraftBackground";

export default function Timeline() {
  const [localTime, setLocalTime] = useState("");
  const [currentDate, setCurrentDate] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/home/timeline");
        const rows = (data?.timeline || []).map((item, index) => ({
          id: item.id,
          date: item.date,
          side: index % 2 === 0 ? "left" : "right",
          icon: item.emoji || "•",
          color: item.color || "#9ca3af",
          title: item.name,
          description: item.description || "Sin descripción",
        }));

        setTimelineData(rows);

        if (data?.edition?.date_start) {
          const eventUTC = new Date(data.edition.date_start);
          setLocalTime(
            eventUTC.toLocaleString(undefined, {
              dateStyle: "long",
              timeStyle: "short"
            })
          );
        } else {
          setLocalTime("Por definir");
        }
      } catch (error) {
        console.error("Error cargando timeline:", error);
        setTimelineData([]);
        setLocalTime("Por definir");
      } finally {
        setLoading(false);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setCurrentDate(today);
    };

    loadTimeline();
  }, []);

  const getItemState = (dateStr) => {
    if (!currentDate) return "future";

    const itemDate = new Date(dateStr);
    if (Number.isNaN(itemDate.getTime())) return "future";
    itemDate.setHours(0, 0, 0, 0);

    const timeDiff = itemDate.getTime() - currentDate.getTime();

    if (timeDiff < 0) return "past";
    if (timeDiff === 0) return "current";
    return "future";
  };

  const formatDateDisplay = (dateStr) => {
    const baseDate = new Date(dateStr);
    return baseDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long"
    });
  };

  return (
    <section id="timeline" className="text-[var(--white-color)] py-24 px-6 overflow-hidden bg-minecraft z-20">
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

          {loading ? (
            <div className="text-center text-gray-400 text-lg py-12">Cargando timeline...</div>
          ) : timelineData.length === 0 ? (
            <div className="text-center text-gray-400 text-lg py-12">aun no tenemos las fechas definidas</div>
          ) : (
          <div className="space-y-12 md:space-y-20">
            {timelineData.map((item) => {
              const state = getItemState(item.date);
              const isFuture = state === "future";
              const isCurrent = state === "current";
              const isPast = state === "past";
              const accentColor = isFuture ? "#6b7280" : item.color;

              const stateClasses = {
                past: "opacity-100 hover:opacity-100",
                current: "opacity-100 scale-[1.03]",
                future: "opacity-20 grayscale blur-[1px] saturate-50 hover:blur-none hover:opacity-45"
              }[state];

              const cardGlow = state === "current"
                ? "shadow-[0_0_36px_rgba(255,187,1,0.28)] ring-2 ring-[var(--tertiary-color)]"
                : state === "past"
                ? "border border-emerald-400/35 shadow-[0_0_22px_rgba(74,222,128,0.12)] hover:border-emerald-300/55"
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
                    <span style={{ color: accentColor }}>{item.icon}</span>
                  </div>

                  <div
                    className={`bg-[var(--gray-dark-color)] backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-xl
                    transition-all duration-300 hover:-translate-y-2
                    ${cardGlow}`}
                    style={{
                      background: isFuture
                        ? "rgba(17, 17, 17, 0.52)"
                        : isCurrent
                        ? `linear-gradient(135deg, ${item.color}22 0%, rgba(17,17,17,0.96) 28%, rgba(17,17,17,0.92) 100%)`
                        : `linear-gradient(135deg, ${item.color}1f 0%, rgba(17,17,17,0.94) 32%, rgba(17,17,17,0.9) 100%)`
                    }}
                  >
                    <span
                      className="text-sm font-bold uppercase tracking-wider block mb-2"
                      style={{ color: isFuture ? "#6b7280" : "#4ade80" }}
                    >
                      {formatDateDisplay(item.date)}
                      {state === "current" && " • HOY"}
                      {state === "past" && " • ✓ COMPLETADO"}
                    </span>

                    <h3
                      className="text-2xl font-bold mb-3"
                      style={{
                        color: isFuture ? "#9ca3af" : accentColor,
                        textShadow: isPast || isCurrent ? `0 0 18px ${item.color}22` : "none"
                      }}
                    >
                      {item.title}
                    </h3>

                    <p
                      className="text-sm md:text-base leading-relaxed"
                      style={{ color: isFuture ? "rgba(107, 114, 128, 0.82)" : "#d1d5db" }}
                    >
                      {item.description}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
          )}

        </div>
      </div>
    </section>
  );
}