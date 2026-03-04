import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios"
import { useState } from "react"

import Input from "../../elements/Input" 
import Button from "../../elements/Button"
import Banner from "../../elements/Banner"
import SocialsAuth from "../../components/SocialsAuth"
import AlertModal from "../../elements/AlertModal";


function Register() {
  //valida si el usuario ya tiene un token, si es así lo redirige al inicio
  const token = localStorage.getItem("token");
  if (token) {return <Navigate to="/start" replace />;}
  
  // definiendo los estados de los inputs
  const[ username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const[ email, setEmail ] = useState("");
  const [emailError, setEmailError] = useState(false);
  const[ password, setPassword]=useState("");
  const [passwordError, setPasswordError] = useState(false);
  const[ Rpassword, setRpassword]=useState("");
  const [RpasswordError, setRpasswordError] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState(false);

  const [showAlert, setShowAlert] = useState(false);

  const validate = async (event) =>{
    event.preventDefault();  
    !username ? setUsernameError("El nombre de usuario es obligatorio") : setUsernameError(false);
    !email ? setEmailError("El correo electrónico es obligatorio") : setEmailError(false);
    !password ? setPasswordError("La contraseña es obligatoria") : setPasswordError(false);
    !Rpassword ? setRpasswordError("La contraseña es obligatoria") : setRpasswordError(false);
    password !== Rpassword ? setPasswordMatchError("Las contraseñas no coinciden") : setPasswordMatchError(false);
    
    if(username && email && password && Rpassword && password === Rpassword) {
      showAlertRegister();
    }
  };

  const HandleRegister = async () => {
    console.log("Registrando usuario...");
  }

  const showAlertRegister = () => {setShowAlert(true);};

  return (
    <>
      <AlertModal
        isOpen={showAlert}
        type="info"
        title="Ultima revision"
        message="Revisa que tu información sea correcta antes de continuar. Si todo está bien, haz clic en 'Aceptar' para completar tu registro."
        onClose={() => setShowAlert(false)}
        onConfirm={HandleRegister}
      />
      <Banner>
        <div className="grid grid-cols-2 max-w-4xl mx-auto"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          <div className="col bg-[var(--black-color)] rounded-l-3xl flex flex-col items-center justify-center p-8 text-[var(--white-color)]" data-aos="fade-left" >
              <img src="/img/tdt3.webp" alt="Tierra de Todos Logo" className="mb-4" />
              <p className="text-sm font-light mb-8 text-center">
                Si ya tienes una cuenta, puedes iniciar sesión fácilmente haciendo clic en el botón de abajo. Únete a nuestra comunidad y continúa tu aventura en Tierra de Todos 3 hoy mismo.
              </p>
              <Button variant="ghost" href="/login" > Iniciar sesión </Button>
              <Button variant="ghost" href="/" > Volver al inicio </Button>
          </div>
          <div className="col p-8 bg-[var(--white-color)] rounded-r-3xl" data-aos="fade-right" >
            <h1 className="text-3xl font-bold mb-4 text-[var(--black-color)]">Registrarse</h1>
            <p className="text-sm font-light mb-8 text-center">
              Crea una cuenta para unirte a nuestra comunidad y comenzar tu aventura en Tierra de Todos 3 hoy mismo.
            </p>
            <form className="flex flex-col gap-4">
              <Input 
                label="Nombre de usuario"
                context="light"
                placeholder="Ingresa tu nombre de usuario"
                type = "text"
                name="username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={usernameError}
              />
              <Input 
                label="Correo electrónico"
                context="light"
                placeholder="Ingresa tu correo electrónico"
                type = "email"
                name = "email"
                id = "email"
                value = {email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
              />
              <Input 
                label="Contraseña"
                context="light"
                placeholder="Ingresa tu contraseña"
                type = "password"
                name = "password"
                id = "password"
                value = {password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError || passwordMatchError}
              />
              <Input 
                label="Repetir contraseña"
                context="light"
                placeholder="Repite tu contraseña"
                type = "password"
                name = "Rpassword"
                id = "Rpassword"
                value = {Rpassword}
                onChange={(e) => setRpassword(e.target.value)}
                error={RpasswordError || passwordMatchError}
              />
              <SocialsAuth
                onGoogle={() => console.log("Google login")}
                onDiscord={() => console.log("Discord login")}
                onMicrosoft={() => console.log("Microsoft login")}
              />
              <Button variant="primary" className="mt-10" onClick={validate}>Registrarse</Button>
            </form>
          </div>
        </div>
      </Banner>
    </>
  )
}

export default Register