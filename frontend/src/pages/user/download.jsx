import Button from "../../elements/Button";
import { PencilIcon, LogOut } from "lucide-react";

function Download() {
  const user = {
    role: "Usuario",
  };

  return (
    <section className="min-h-screen py-10 flex items-center justify-center bg-[var(--white-color)]">
      <div className="w-full max-w-7xl px-4 md:mx-20 mx-0">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">

          {/* Lado Izquierdo */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>{user.role}</span>
              <span>/</span>
              <span className="text-emerald-600">Descargas</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Launcher TDT
            </h1>

            <p className="text-sm text-gray-500 mt-2 max-w-lg">
              Descarga el launcher oficial y comienza tu aventura en Tierra de Todos.
            </p>
          </div>

          {/* Lado Derecho */}
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" className="flex items-center gap-2 shadow-sm">
              <PencilIcon size={16} /> Accion 1
            </Button>
            <Button variant="cancel" size="sm" className="flex items-center gap-2 shadow-sm">
              <LogOut size={16} /> Accion 2
            </Button>
          </div>
        </div>

        {/* BANNER */}
        <div className="relative w-full overflow-hidden flex flex-col items-center justify-center min-h-[450px] md:min-h-[500px] rounded-2xl">

          <img
            src="/img/banner.webp"
            alt="Minecraft Landscape"
            className="absolute inset-0 h-full w-full object-cover blur-[5px] scale-110 z-0"
          />

          <div className="absolute inset-0 bg-black/40 z-0" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full p-8 md:p-16">

            <img
              src="/img/tdt3.webp"
              alt="Tierra de Todos Logo"
              className="w-full max-w-[450px] mb-6 drop-shadow-lg"
            />

            <p className="text-white text-lg md:text-xl font-medium tracking-wide mb-8 drop-shadow-md">
              Descarga ahora el launcher oficial de Tierra de Todos,
              <br className="hidden sm:block" />
              ¡sé parte de esta nueva historia!
            </p>

            <Button
              variant="primary"
              size="lg"
              className="flex flex-row items-center justify-center gap-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                className="w-5 h-5 fill-white"
              >
                <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 31.6v214.2H203.8v198.4zm0-397.9V268.4H448V86.8l-244.2 33.5z" />
              </svg>

              Descargar para Windows
            </Button>

          </div>
        </div>

      </div>
    </section>
  );
}

export default Download;