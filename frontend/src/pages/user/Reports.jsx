
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Reports() {


  return (
    <>  
      <section className="h-screen flex items-center justify-center bg-[var(--white-color)]">
        <div className="max-w-[800px] text-[var(--black-color)] flex flex-col items-center z-20 " >
          <h1 className="text-3xl font-bold mb-4">Reportes de usuario</h1>
          <p className="text-lg font-light mb-8">
            Bienvenido a la sección de reportes de usuario. Aquí puedes ver y gestionar los reportes generados por los usuarios, revisar estadísticas y tomar acciones necesarias para mantener la comunidad segura y activa.
          </p>
        </div>
      </section>
    </>
  );
}


export default Reports;