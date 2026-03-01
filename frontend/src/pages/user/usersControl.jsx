
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function UsersControl() {


  return (
    <>  
      <section className="h-screen flex items-center justify-center bg-[var(--white-color)]">
        <div className="max-w-[800px] text-[var(--black-color)] flex flex-col items-center z-20 " >
          <h1 className="text-3xl font-bold mb-4">Control de usuarios</h1>
          <p className="text-lg font-light mb-8">
            Bienvenido a la sección de control de usuarios. Aquí puedes gestionar y supervisar las cuentas de los usuarios, revisar sus actividades y ajustar sus permisos según sea necesario.
          </p>
        </div>
      </section>
    </>
  );
}


export default UsersControl;