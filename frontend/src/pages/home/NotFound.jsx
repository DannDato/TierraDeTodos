
import Button from "../../elements/Button";
import Banner from "../../elements/Banner";
import Footer from "../../components/Footer";

import { ArrowLeft } from "lucide-react";

function Login() {
  const loggedIn = localStorage.getItem("token") !== null;
  let toRoute = loggedIn ? "/start" : "/";
  return (
    <>
      <Banner className="h-[800px]">
        {/* <div className="grid grid-cols-2 max-w-4xl mx-auto shadow-2xl overflow-hidden rounded-3xl"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          <div className="col p-10 bg-[var(--white-color)]" data-aos="fade-left">
            <h2 className="text-3xl font-bold mb-6 text-center">Página no encontrada</h2>
            <p className="text-sm font-light mb-10 text-center leading-relaxed opacity-90">
              Lo sentimos, pero la página que estás buscando no existe. Puede que haya sido eliminada, cambiada de nombre o esté temporalmente no disponible.
            </p>
            <Button href="/">
              Volver al inicio
            </Button>
          </div>
        </div> */}
        <div className="w-full max-w-7xl px-4 md:px-8 mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>Tierra de Todos</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Error</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--white-color)] tracking-tight">
              Algo salio mal...
            </h1>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto shadow-md overflow-hidden rounded-3xl bg-[var(--white-color)]"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
          >
            <div className="p-10 bg-[var(--white-color)] flex flex-col items-start gap-6 relative overflow-hidden">
            
            <div className="w-full flex flex-col items-center gap-2">
              <h2 className="text-3xl font-extrabold text-[var(--black-color)] text-center leading-tight">
                Página no encontrada
              </h2>
              <p className="text-sm font-light text-[var(--gray-color)] text-center max-w-lg leading-relaxed opacity-90">
                Lo sentimos, pero la página que estás buscando no existe. Puede que haya sido eliminada, cambiada de nombre o esté temporalmente no disponible.
              </p>
            </div>

            <div className="w-full flex items-center justify-center pt-4">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                href={toRoute} // Tu lógica de volver al inicio
                className="py-5 text-xl tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[var(--secondary-color)]/30 hover:shadow-[var(--secondary-color)]/50"
              >
                <ArrowLeft size={24} />
                Volver al inicio
              </Button>
            </div>

          </div>

            <div className="p-10 bg-black flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/5" />
              <div className="relative w-full h-full flex items-center justify-center">
              
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-black text-[var(--white-color)]/20 z-10 flex gap-2">
                  <span>4</span>
                  <span>0</span>
                  <span>4</span>
                </div>              

              </div>
            </div>

          </div>
        </div>
      
      </Banner>
      <Footer />
    </>
  );
}

export default Login;