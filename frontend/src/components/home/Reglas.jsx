import React, { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Reglas() {
  const [reglasData, setReglasData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/home/rules");
        setReglasData(data?.rules || []);
      } catch (error) {
        console.error("Error cargando reglas:", error);
        setReglasData([]);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  return (
    <section id="reglas" className="scroll-smooth py-20 px-6 md:px-12 lg:px-20 rounded-[30px] mx-2 md:mx-10 text-[var(--white-color)] min-h-screen relative z-20">
      <div className="max-w-7xl mx-auto space-y-16">

        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--white-color)]" data-aos="fade-up" data-aos-duration="2000">
            Reglas del Servidor
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg" data-aos="fade-up" data-aos-duration="3000">
            Lee detenidamente las normas para mantener una convivencia sana y evitar sanciones.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 text-lg" data-aos="fade-up" data-aos-duration="1000">
            Cargando reglas...
          </div>
        ) : reglasData.length === 0 ? (
          <div className="text-center text-gray-400 text-lg" data-aos="fade-up" data-aos-duration="1000">
            aun no tenemos las reglas definidas
          </div>
        ) : (
        <div className="max-w-4xl mx-auto bg-black/45 rounded-[28px] border border-white/8 shadow-2xl backdrop-blur-sm overflow-hidden" data-aos="fade-up" data-aos-duration="1000">
          <div className="px-6 md:px-8 py-5 border-b border-white/8 bg-black/20">
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              Cada punto marca una regla obligatoria dentro de la edición actual. Léelas completas antes de entrar al servidor.
            </p>
          </div>

          <ul className="divide-y divide-white/6">
            {reglasData.map((rule, index) => (
              <li
                key={rule.id || `${rule.category}-${index}`}
                className="flex items-start gap-4 px-6 md:px-8 py-5 hover:bg-white/[0.03] transition-colors duration-300"
                data-aos="fade-up"
                data-aos-duration={500 + index * 70}
              >
                <div className="flex items-center gap-3 pt-0.5 shrink-0 min-w-[48px]">
                  <span
                    className="w-3 h-3 rounded-full shadow-[0_0_14px_currentColor]"
                    style={{ color: rule.color || "#ffffff", backgroundColor: rule.color || "#ffffff" }}
                  />
                  <span className="text-lg leading-none" style={{ color: rule.color || "#ffffff" }}>
                    {rule.icon || "•"}
                  </span>
                </div>

                <p className="leading-relaxed text-gray-200 md:text-[1.02rem]">
                  {rule.item}
                </p>
              </li>
            ))}
          </ul>
        </div>
        )}

      </div>
    </section>
  );
}