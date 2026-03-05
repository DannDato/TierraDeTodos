import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios"
import { useState } from "react"

import Input from "../../elements/Input" 
import Button from "../../elements/Button"
import Banner from "../../elements/Banner"
import Footer from "../../components/Footer"
import LoadingOverlay from "../../components/LoadingOverlay";

import SocialsAuth from "../../components/SocialsAuth"

import { 
  ShieldCheck,
  ArrowLeft,

} from "lucide-react";


function VerifyAccess() {
  let navigate = useNavigate();
  const usuario = localStorage.getItem("tempUser");

  //estados
  const token = localStorage.getItem("token");
  const[ codigo, setCodigo] = useState("")
  const [codigoError, setCodigoError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (token) {return <Navigate to="/start" replace />;}
  
  const handleCode = async (event) => { 
    event.preventDefault();
    !codigo ? setCodigoError("El código es obligatorio") : setCodigoError(false);
    setLoading(true);
    const { data } = await api.post("/auth/verify-code", {
      usuario,
      codigo,
    }).catch((error) => {
      error.response ? setCodigoError(error.response.data.message) : setCodigoError("Error de conexión. Por favor, inténtalo de nuevo.");
    }).finally(() => {
      setLoading(false);
    });
    if(data.hasOwnProperty("token")) {
      localStorage.setItem("token", data.token);
      navigate("/start");
    }

  };
  return (
    <>
      <Banner>
        {loading && <LoadingOverlay />}
        <div className="grid grid-cols-2 max-w-xl mx-auto"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          <div className="col p-8 bg-[var(--white-color)] rounded-3xl shadow-xl border border-black/5" data-aos="fade-left">
            {/* Encabezado */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 text-[var(--black-color)]">Código de verificación</h1>
              <div className="p-10">
                <div className="h-1 w-16 bg-[var(--secondary-color)] rounded-full mb-4" /> {/* Acento visual */}
                <h3 className="text-md mb-4 text-[var(--dirt-color)] font-bold flex items-center gap-2">
                  <ShieldCheck size={20} /> Hemos detectado un nuevo dispositivo
                </h3>
                <p className="font-light text-sm text-[var(--black-color)] leading-relaxed text-left">
                  Para proteger tu cuenta, enviamos un código a tu correo. 
                  Por favor, ingresa los dígitos a continuación para verificar tu identidad.
                </p>
                <form className="flex flex-col gap-4 mt-10" onSubmit={(e) => e.preventDefault()}>
                  {/* Contenedor del Input con énfasis */}
                  <div className="bg-black/5 p-6 rounded-2xl  focus-within:border-[var(--secondary-color)] transition-all">
                    <Input
                      label="Ingresa el código de 6 dígitos"
                      context="light"
                      name="codigo"
                      id="codigo"
                      // Estilo extra para que se vea imponente
                      className="text-5xl tracking-[0.5em] text-center font-black uppercase placeholder:tracking-normal placeholder:text-sm"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.toUpperCase())} // Forzar mayúsculas si es alfanumérico
                      placeholder="------"
                      type="text"
                      maxLength={6} // Limitar a 6 caracteres si es el caso
                      error={codigoError}
                    />
                  </div>

                  {/* Links de Acción Secundaria */}
                  <div className="flex flex-col gap-3 mt-2">
                    <button 
                      type="button"
                      className="text-xs text-[var(--secondary-color)] hover:underline font-semibold text-left w-fit"
                      onClick={() => console.log("Reenviando...")}
                    >
                      ¿No recibiste el código? Reenviar correo
                    </button>
                    
                    <div className="flex justify-between items-center border-t border-black/10 pt-4 mt-2">
                      <a href="/login" className="text-xs text-[var(--ins-text-dark)] hover:text-black flex items-center gap-1 transition-colors">
                        <ArrowLeft size={14} /> Volver al inicio de sesión
                      </a>
                      <a href="/help" className="text-xs text-[var(--ins-text-dark)] hover:text-black transition-colors">
                        ¿Necesitas ayuda?
                      </a>
                    </div>
                  </div>

                  <Button variant="primary" className="mt-6 w-full py-4 text-lg" onClick={handleCode}>
                    Verificar
                  </Button>
                </form>
              </div>
            </div>

            

            {/* Footer de navegación rápida */}
            <div className="mt-8 flex justify-center gap-6">
              <a href="/" className="text-[10px] uppercase tracking-widest text-[var(--ins-text-dark)] hover:text-[var(--secondary-color)] font-bold">Inicio</a>
              <a href="/register" className="text-[10px] uppercase tracking-widest text-[var(--ins-text-dark)] hover:text-[var(--secondary-color)] font-bold">Crear cuenta</a>
            </div>
          </div>
          
        </div>
      </Banner>
      <Footer></Footer>
    </>
  )
};

export default VerifyAccess