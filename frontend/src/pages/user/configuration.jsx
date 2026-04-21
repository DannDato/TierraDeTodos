function Configuration() {


  return (
    <>  
      <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
        <div className="w-full max-w-7xl px-4 md:px-8 text-[var(--ins-text-white)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-widest mb-2">
                <span>Tierra de Todos</span>
                <span>/</span>
                <span className="text-[var(--secondary-color)]">Configuracion</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Configuración</h1>
            </div>
          </div>

          <div className="max-w-3xl rounded-3xl bg-black/15 p-8 shadow-md">
            <p className="hidden lg:block text-base md:text-lg text-[var(--ins-text-gray)] leading-relaxed">
            Bienvenido a la sección de configuración. Aquí puedes ajustar tus preferencias, gestionar tu cuenta y personalizar tu experiencia en Tierra de Todos 3.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}


export default Configuration;