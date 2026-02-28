import React from "react";

export default function Reglas() {
  // temporal (luego esto se toma del backend)
  const reglasData = [
    {
      id: 1,
      titulo: "Reglas principales",
      color: "text-red-400",
      borderColor: "border-red-500/30",
      descripcion:
        "A quien no cumpla con estas reglas se le asignará tiempo de cárcel irrevocable dentro del servidor sin excepción.",
      icon: "❌",
      items: [
        "Prohibido entrar a casas sin permiso.",
        "Prohibido abrir cofres ajenos.",
        "Prohibido robar objetos.",
        "Prohibido matar mascotas.",
        "Prohibidas construcciones flotantes.",
        "Prohibido usar TNT o explosivos.",
        "Prohibido acceder al Nether o End.",
        "Prohibido usar hacks o glitches."
      ]
    },
    {
      id: 2,
      titulo: "Obligaciones",
      color: "text-green-400",
      borderColor: "border-green-500/30",
      icon: "✅",
      items: [
        "Plantar un árbol por cada árbol talado.",
        "Respetar construcciones ajenas.",
        "Mantener convivencia respetuosa.",
        "Reparar daños accidentales.",
        "Respetar decisiones del staff."
      ]
    },
    {
      id: 3,
      titulo: "Reglas técnicas",
      color: "text-yellow-400",
      borderColor: "border-yellow-500/30",
      icon: "⚖️",
      items: [
        "Prohibido uso de X-Ray.",
        "Prohibido mods que den ventaja.",
        "Prohibido macros o automatizaciones.",
        "Prohibido cualquier modificación no vanilla."
      ]
    },
    {
      id: 4,
      titulo: "Indicaciones del staff",
      color: "text-[var(--tertiary-color)]",
      borderColor: "border-[var(--tertiary-color)]", // Asegúrate de que esta variable soporte opacidad o usa un color fallback
      icon: "🎙️",
      items: [
        "No ignorar indicaciones del streamer.",
        "Respetar la jerarquía del servidor.",
        "Comunicar conflictos al streamer correspondiente.",
        "No saltar la cadena de comunicación."
      ]
    }
  ];

  return (
    <section id="reglas" className="scroll-smooth py-20 px-6 md:px-12 lg:px-20 bg-[var(--black-color)] text-[var(--white-color)] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* Encabezado Principal */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--white-color)]" data-aos="fade-up" data-aos-duration="2000">
            Reglas del Servidor
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg" data-aos="fade-up" data-aos-duration="3000">
            Lee detenidamente las normas para mantener una convivencia sana y evitar sanciones.
          </p>
        </div>

        {/* Grid de Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" data-aos="fade-up" data-aos-duration="1000">
          {reglasData.map((section) => (
            <div 
              key={section.id} 
              className={`bg-white/5 rounded-2xl p-6 md:p-8 hover:bg-white/10 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 flex flex-col h-full ${section.borderColor ? `hover:border-b-4 ${section.borderColor}` : ''}`}
            >
              
              {/* Título e Icono de la Tarjeta */}
              <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                <span className="text-3xl bg-black/30 p-3 rounded-xl shadow-inner" data-aos="fade" data-aos-duration="3000" data-aos-delay="500">
                  {section.icon}
                </span>
                <h3 className={`text-2xl font-bold tracking-wide ${section.color}`} data-aos="fade" data-aos-duration="1000">
                  {section.titulo}
                </h3>
              </div>

              {/* Mensaje de Advertencia (Si existe) */}
              {section.descripcion && (
                <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                  <p className="text-sm md:text-base font-medium text-red-300 leading-relaxed">
                    {section.descripcion}
                  </p>
                </div>
              )}

              {/* Lista de Items */}
              <ul className="space-y-3 flex-grow">
                {section.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-300">
                    <span className={`mt-1 text-sm ${section.color}`}>✦</span>
                    <span className="leading-relaxed" data-aos="fade-up" data-aos-duration={500 + index * 200}>{item}</span>
                  </li>
                ))}
              </ul>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}