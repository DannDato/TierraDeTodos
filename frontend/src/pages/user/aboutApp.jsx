
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function AboutApp() {


  return (
    <>  
      <section className="h-screen flex items-center justify-center bg-[var(--white-color)]">
        <div className="max-w-[800px] text-[var(--black-color)] flex flex-col items-center z-20 " >
          <h1 className="text-3xl font-bold mb-4">Acerca de la aplicación</h1>
          <p className="text-lg font-light mb-8">
            Bienvenido a la sección "Acerca de la aplicación". Aquí puedes obtener información sobre Tierra de Todos 3, sus características, actualizaciones y cómo aprovechar al máximo tu experiencia en la plataforma.
          </p>
        </div>
      </section>
    </>
  );
}


export default AboutApp;