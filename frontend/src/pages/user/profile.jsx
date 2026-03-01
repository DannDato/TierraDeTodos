
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Profile() {


  return (
    <>  
      <section className="h-screen flex items-center justify-center bg-[var(--white-color)]">
        <div className="max-w-[800px] text-[var(--black-color)] flex flex-col items-center z-20 " >
          <h1 className="text-3xl font-bold mb-4">Perfil de usuario</h1>
          <p className="text-lg font-light mb-8">
            Bienvenido a tu perfil de usuario. Aquí puedes ver y editar tu información personal, revisar tus estadísticas de juego y gestionar tus preferencias. Personaliza tu experiencia en Tierra de Todos 3 y mantente al tanto de tus logros y progreso en el juego.
          </p>
        </div>
      </section>
    </>
  );
}


export default Profile;