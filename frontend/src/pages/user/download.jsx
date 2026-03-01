import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../elements/button";



function Download() {
  return (
    <>  
      <section className="h-screen flex items-center justify-center bg-[var(--white-color)] px-4">
        
        {/* Contenedor Principal */}
        <div className="w-full max-w-5xl bg-[var(--gray-light-color)] text-[var(--black-color)] rounded-2xl overflow-hidden relative shadow-2xl">
            
            {/* Contenedor del Banner (Aquí definimos la altura mínima y centramos todo) */}
            <div className="relative w-full overflow-hidden flex flex-col items-center justify-center min-h-[450px] md:min-h-[500px]">
              
              {/* 1. IMAGEN DE FONDO (Absolute, al fondo) */}
              <img 
                src="/img/banner.webp"
                alt="Minecraft Landscape"
                className="absolute inset-0 h-full w-full object-cover blur-[5px] scale-110 z-0"
              />
              
              {/* 2. CAPA OSCURA / OVERLAY (Absolute, encima de la imagen) */}
              <div className="absolute inset-0 bg-[var(--gray-color)]/40 z-0" />
              
              {/* 3. CONTENIDO (Relative, por encima de todo gracias al z-10) */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full p-8 md:p-16">
                
                <img 
                  src="img/tdt3.webp" 
                  alt="Tierra de Todos Logo" 
                  className="w-full max-w-[450px] mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                />
                
                <p className="text-[var(--white-color)] text-lg md:text-xl font-medium tracking-wide mb-8 drop-shadow-md">
                  Descarga ahora el launcher oficial de Tierra de Todos,<br className="hidden sm:block" />
                  ¡sé parte de esta nueva historia!
                </p>
                
                <Button variant="primary" size="lg" className="flex flex-row items-center justify-center gap-3">
                {/* Icono de Windows en SVG, color blanco (fill-white) */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 448 512" 
                  className="w-5 h-5 fill-white"
                >
                  <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 31.6v214.2H203.8v198.4zm0-397.9V268.4H448V86.8l-244.2 33.5z"/>
                </svg>
                
                Descargar para Windows
              </Button>
              

              </div>
            </div>

        </div>
      </section>
    </>
  );
}

export default Download;