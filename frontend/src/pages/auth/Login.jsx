import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useState } from "react";

import Input from "../../elements/Input";
import Button from "../../elements/Button";
import Banner from "../../elements/Banner";
import Footer from "../../components/Footer";
import LoadingOverlay from "../../components/LoadingOverlay";
import SocialsAuth from "../../components/SocialsAuth";

import { ArrowLeft, Pencil } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false)

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [usuarioError, setUsuarioError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  if (token) { return <Navigate to="/start" replace />; }

  const handleLogin = async (event) => {
    event.preventDefault();
    
    // Validaciones básicas
    if (!usuario) return setUsuarioError("El usuario es obligatorio");
    if (!password) return setPasswordError("La contraseña es obligatoria");
    
    setUsuarioError(false);
    setPasswordError(false);
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { usuario, password });

      // nvo dispositivo
      if (data.type === "new_device") {
        // return navigate("/verifyAccess", { state: { usuario } });
        localStorage.setItem("tempUser", usuario);
        return navigate("/verifyAccess");
      }

      // login Directo
      if (data.token) {
        localStorage.setItem("token", data.token);
        // localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/start");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Error al conectar con el servidor";
      setUsuarioError(message);
      setPasswordError(message);
      setLoading(false);
    }
  };

  return (
    <>
      <Banner className="h-[800px]">
        {loading && <LoadingOverlay />}
        <div className="grid grid-cols-2 max-w-4xl mx-auto shadow-2xl overflow-hidden rounded-3xl"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {/* LADO IZQUIERDO: FORMULARIO */}
          <div className="col p-10 bg-[var(--white-color)]" data-aos="fade-left">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[var(--black-color)]">Iniciar sesión</h1>
              <div className="h-1 w-12 bg-[var(--secondary-color)] rounded-full mt-2" />
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleLogin}>
              <Input
                label="Usuario o correo electrónico"
                context="light"
                name="usuario"
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ingresa tu usuario"
                type="text"
                error={usuarioError}
              />

              <Input
                label="Contraseña"
                context="light"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                type="password"
                error={passwordError}
              />

              <div className="flex justify-end">
                <a href="/forgot-password" 
                   className="text-xs font-semibold text-[var(--ins-text-dark)] hover:text-[var(--secondary-color)] transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/10"></span></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[var(--white-color)] px-2 text-[var(--ins-text-dark)] font-bold">O continúa con</span>
                </div>
              </div>

              <SocialsAuth
                onGoogle={() => console.log("Google login")}
                onDiscord={() => console.log("Discord login")}
                onMicrosoft={() => console.log("Microsoft login")}
              />

              <Button variant="primary" className="mt-6 w-full py-4" type="submit">
                Iniciar sesión
              </Button>
            </form>
          </div>

          {/* LADO DERECHO: BIENVENIDA */}
          <div className="col bg-[var(--black-color)] flex-col items-center justify-center p-10 text-[var(--white-color)]  hidden md:flex" data-aos="fade-right">
            <a href="/" className="hover:scale-105 transition-transform duration-300">
              <img src="/img/tdt3.webp" alt="Tierra de Todos Logo" className="mb-6 w-48" />
            </a>
            
            <p className="text-sm font-light mb-10 text-center leading-relaxed opacity-90">
              Si no tienes una cuenta, puedes crear una fácilmente. Únete a nuestra comunidad y comienza tu aventura en <span className="text-[var(--secondary-color)] font-bold">Tierra de Todos 3</span> hoy mismo.
            </p>
            
            <div className="grid w-full gap-3 grid-cols-1 md:grid-cols-2">
              <Button variant="ghost" href="/" className="flex items-center justify-center gap-2 border-none hover:bg-white/10">
                <ArrowLeft size={16} /> Volver al inicio
              </Button>
              <Button variant="ghost" href="/register">
                <Pencil size={16} /> Crear cuenta
              </Button>
            </div>
          </div>
        </div>
      </Banner>
      <Footer />
    </>
  );
}

export default Login;