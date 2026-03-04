import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/axios"
import { useState } from "react"

import Input from "../../elements/Input" 
import Button from "../../elements/Button"
import Banner from "../../elements/Banner"
import Footer from "../../components/Footer"

import SocialsAuth from "../../components/SocialsAuth"


function Login() {
  let navigate = useNavigate();
  const token = localStorage.getItem("token");
  const[ email, setEmail] = useState("")
  const[ password, setPassword] = useState("")
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  if (token) {return <Navigate to="/start" replace />;}
  
  const handleLogin = async (event) => { 
    event.preventDefault();

    if(localStorage.getItem("token")) {navigate("/start");return;}

    !email ? setEmailError("El correo electrónico es obligatorio") : setEmailError(false);
    !password ? setPasswordError("La contraseña es obligatoria") : setPasswordError(false);

    let regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !regexEmail.test(email)) {setEmailError("Por favor, ingresa un correo electrónico válido");return;}
    
    const { data } = await api.post("/auth/login", {
      email,
      password,
    }).catch((error) => {
      if (error.response && error.response.data && error.response.data.message) {
        setEmailError("Correo o contraseña incorrectos");
        setPasswordError("Correo o contraseña incorrectos");
      }
    });
    if(data.hasOwnProperty("token")) {
      localStorage.setItem("token", data.token);
      navigate("/start");
    } 
  };
  return (
    <>
      <Banner>
        <div className="grid grid-cols-2 max-w-4xl mx-auto"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          <div className="col p-8 bg-[var(--white-color)] rounded-l-3xl" data-aos="fade-left" >
            <h1 className="text-3xl font-bold mb-4 text-[var(--black-color)]">Iniciar sesión</h1>
            <form className="flex flex-col gap-4">
              <Input 
                label="Correo electrónico"
                context="light"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ingresa tu correo electrónico"
                type = "email"
                error={emailError}
              />

              <Input 
                label="Contraseña"
                context="light"
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Ingresa tu contraseña"
                type = "password"
                error={passwordError}
              />
              <SocialsAuth
                onGoogle={() => console.log("Google login")}
                onDiscord={() => console.log("Discord login")}
                onMicrosoft={() => console.log("Microsoft login")}
              />
              <Button variant="primary" className="mt-10" onClick={handleLogin}>Iniciar sesión</Button>
            </form>
          </div>
          <div className="col bg-[var(--black-color)] rounded-r-3xl flex flex-col items-center justify-center p-8 text-[var(--white-color)]" data-aos="fade-right" >
              
              <a href="/">
                <img src="/img/tdt3.webp" alt="Tierra de Todos Logo" className="mb-4" />
              </a>
              <p className="text-sm font-light mb-8 text-center">
                Si no tines una cuenta, puedes crear una fácilmente haciendo clic en el botón de abajo. Únete a nuestra comunidad y comienza tu aventura en Tierra de Todos 3 hoy mismo.
              </p>
              <Button variant="ghost" href="/register" > Crear cuenta </Button>
              <Button variant="ghost" href="/" > Volver al inicio </Button>
          </div>
        </div>
      </Banner>
      <Footer></Footer>
    </>
  )
};

export default Login