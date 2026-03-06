import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios"
import { useState } from "react"

import Input from "../../elements/Input" 
import Button from "../../elements/Button"
import Banner from "../../elements/Banner"
import Footer from "../../components/Footer"
import LoadingOverlay from "../../components/LoadingOverlay";
import SocialsAuth from "../../components/SocialsAuth"
import AlertModal from "../../elements/AlertModal";
import { ArrowLeft, LogIn } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Estados de los inputs
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [Rpassword, setRpassword] = useState("");
  const [RpasswordError, setRpasswordError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showAlert, setShowAlert] = useState(false);

  if (token) { return <Navigate to="/start" replace />; }

  const validate = (event) => {
    event.preventDefault();
    
    // Reset de errores
    setUsernameError(username ? false : "El nombre de usuario es obligatorio");
    setEmailError(email ? false : "El correo electrónico es obligatorio");
    setPasswordError(password ? false : "La contraseña es obligatoria");
    setRpasswordError(Rpassword ? false : "Debes repetir la contraseña");

    if (password && Rpassword && password !== Rpassword) {
      setRpasswordError("Las contraseñas no coinciden");
      return;
    }

    if (username && email && password && Rpassword && password === Rpassword) {
      setShowAlert(true);
    }
  };

  const handleRegister = async () => {
    setShowAlert(false);
    setLoading(true)
    try {
      const { data } = await api.post("/auth/register", {
          username,
          email,
          password
        },
      );  

      // nvo dispositivo
      if (data.type === "new_device") {
        // return navigate("/verifyAccess", { state: { usuario } });
        localStorage.setItem("tempUser", username);
        return navigate("/verifyAccess");
      }

      // login Directo
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/start");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Error al conectar con el servidor";
      setUsernameError(message);
      setEmailError(message);
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={showAlert}
        type="info"
        title="Última revisión"
        message="Revisa que tu información sea correcta antes de continuar. Si todo está bien, haz clic en 'Aceptar' para completar tu registro."
        onClose={() => setShowAlert(false)}
        onConfirm={handleRegister}
      />
      {loading && <LoadingOverlay />}
      <Banner className="h-[800px]">
        <div className="grid grid-cols-2 max-w-4xl mx-auto shadow-2xl overflow-hidden rounded-3xl"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          {/* LADO IZQUIERDO: BIENVENIDA (Invertido respecto al login para balance visual) */}
          <div className="col bg-[var(--black-color)] flex-col items-center justify-center p-10 text-[var(--white-color)]  hidden md:flex" data-aos="fade-left">
            <a href="/" className="hover:scale-105 transition-transform duration-300">
              <img src="/img/tdt3.webp" alt="Tierra de Todos Logo" className="mb-6 w-48" />
            </a>
            <p className="text-sm font-light mb-10 text-center leading-relaxed opacity-90">
              Si ya tienes una cuenta, puedes iniciar sesión fácilmente. Únete a nuestra comunidad y continúa tu aventura hoy mismo.
            </p>
            <div className="grid w-full gap-3 grid-cols-1 md:grid-cols-2">
              <Button variant="ghost" href="/" className="flex items-center justify-center gap-2 border-none hover:bg-white/10">
                <ArrowLeft size={16} /> Volver al inicio
              </Button>
              <Button variant="ghost" href="/login">
                <LogIn size={16} /> Iniciar sesión
              </Button>
            </div>
          </div>

          {/* LADO DERECHO: FORMULARIO */}
          <div className="col p-10 bg-[var(--white-color)]" data-aos="fade-right">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[var(--black-color)]">Registrarse</h1>
              <div className="h-1 w-12 bg-[var(--secondary-color)] rounded-full mt-2" />
              <p className="text-xs text-[var(--ins-text-dark)] mt-4 leading-relaxed font-medium">
                Crea una cuenta para unirte a nuestra comunidad y comenzar tu aventura.
              </p>
            </div>

            <form className="flex flex-col gap-3" onSubmit={validate}>
              <Input
                label="Nombre de usuario"
                context="light"
                placeholder="Ej. Steve_Gamer"
                type="text"
                name="username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={usernameError}
              />
              <Input
                label="Correo electrónico"
                context="light"
                placeholder="tu@correo.com"
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contraseña"
                  context="light"
                  placeholder="••••••••"
                  type="password"
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={passwordError}
                />
                <Input
                  label="Repetir"
                  context="light"
                  placeholder="••••••••"
                  type="password"
                  name="Rpassword"
                  id="Rpassword"
                  value={Rpassword}
                  onChange={(e) => setRpassword(e.target.value)}
                  error={RpasswordError}
                />
              </div>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-black/10"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[var(--white-color)] px-2 text-[var(--ins-text-dark)] font-bold">O regístrate con</span>
                </div>
              </div>

              <SocialsAuth
                onGoogle={() => console.log("Google register")}
                onDiscord={() => console.log("Discord register")}
                onMicrosoft={() => console.log("Microsoft register")}
              />

              <Button variant="primary" className="mt-4 w-full py-4" type="submit">
                Crear cuenta ahora
              </Button>
            </form>
          </div>
        </div>
      </Banner>
      <Footer />
    </>
  )
}

export default Register;