import { HeartHandshake, ShieldCheck, Rocket, Users, Sparkles, Globe2 } from "lucide-react";

function AboutApp() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: "Seguridad real",
      description: "Autenticación por sesión, validación por dispositivo y controles de acceso por permisos para proteger cada cuenta.",
    },
    {
      icon: Rocket,
      title: "Evolución constante",
      description: "El sistema está pensado para crecer: más módulos, más automatización y una administración más sólida cada temporada.",
    },
    {
      icon: Users,
      title: "Comunidad primero",
      description: "Cada decisión está enfocada en la experiencia del jugador y en facilitar el trabajo del equipo administrativo.",
    },
  ];

  const highlights = [
    "Gestión de sesiones activas por usuario y por dispositivo.",
    "Sistema de permisos dinámicos para controlar menús y accesos.",
    "Flujo administrativo para editar roles y permisos de forma centralizada.",
    "Arquitectura lista para integrar más módulos del launcher.",
  ];

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
      <div className="flex-row w-full max-w-7xl px-4 md:mx-10 mx-0 text-[var(--ins-text-white)]">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-widest mb-2">
              <span>Tierra de Todos</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Acerca de</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              Acerca del Sistema
              <Sparkles size={24} className="text-[var(--secondary-color)]" />
            </h1>

            <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-3xl leading-relaxed">
              Tierra de Todos 3 no es solo una app de soporte para el servidor: es el centro operativo que conecta jugadores,
              administración y seguridad en un solo lugar. Está diseñada para ser confiable, escalable y agradable de usar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2 bg-white/5 rounded-3xl p-6 border border-black/10 shadow-md">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <HeartHandshake size={20} className="text-[var(--secondary-color)]" />
              Nuestra misión
            </h2>

            <p className="text-sm text-[var(--ins-text-gray)] leading-relaxed">
              Crear un entorno donde entrar, jugar y administrar sea simple. Queremos que la tecnología trabaje a favor de la comunidad:
              menos fricción, más orden y una experiencia que se sienta viva, moderna y humana.
            </p>

            <p className="text-sm text-[var(--ins-text-gray)] leading-relaxed mt-4">
              Este sistema está construido para acompañar el crecimiento del proyecto: desde el control de acceso inteligente,
              hasta herramientas para moderación y gestión de cuentas con trazabilidad y seguridad.
            </p>
          </div>

          <div className="bg-black/10 rounded-3xl p-6 border border-black/10 shadow-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Globe2 size={20} className="text-[var(--secondary-color)]" />
              Estado actual
            </h2>

            <div className="space-y-3 text-sm">
              <StatusRow label="Backend" value="Operativo" />
              <StatusRow label="Autenticación" value="Activa" />
              <StatusRow label="Permisos" value="Dinámicos" />
              <StatusRow label="Sesiones" value="Seguras" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article key={pillar.title} className="bg-white/5 rounded-2xl p-5 border border-black/10 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] flex items-center justify-center mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-bold mb-2">{pillar.title}</h3>
                <p className="text-sm text-[var(--ins-text-gray)] leading-relaxed">{pillar.description}</p>
              </article>
            );
          })}
        </div>

        <div className="bg-white/5 rounded-3xl p-6 border border-black/10 shadow-md">
          <h2 className="text-xl font-bold mb-4">Lo que hace especial a TDT3</h2>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((item) => (
              <li
                key={item}
                className="text-sm text-[var(--ins-text-gray)] bg-black/10 border border-black/10 rounded-xl px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-black/10">
      <span className="text-[var(--ins-text-gray)]">{label}</span>
      <span className="font-bold text-[var(--secondary-color)]">{value}</span>
    </div>
  );
}

export default AboutApp;