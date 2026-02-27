import Input from "../elements/Input" 
import Button from "../elements/Button"
import Banner from "../elements/Banner"

import SocialsAuth from "../components/SocialsAuth"


function Login() {
  return (
    <>
      <Banner>
        <div className="grid grid-cols-2 max-w-4xl mx-auto"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          <div className="col p-8 bg-[var(--white-color)] rounded-l-3xl" data-aos="fade-left" data-aos-delay="800">
            <h1 className="text-3xl font-bold mb-4 text-[var(--black-color)]">Iniciar sesión</h1>
            <form className="flex flex-col gap-4">
              <Input 
                label="Correo electrónico"
                placeholder="Ingresa tu correo electrónico"
                type = "email"
              />

              <Input 
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                type = "password"
              />
              <SocialsAuth
                onGoogle={() => console.log("Google login")}
                onDiscord={() => console.log("Discord login")}
                onMicrosoft={() => console.log("Microsoft login")}
              />
              <Button variant="primary" className="mt-10">Iniciar sesión</Button>
            </form>
          </div>
          <div className="col bg-[var(--black-color)] rounded-r-3xl flex flex-col items-center justify-center p-8 text-[var(--white-color)]" data-aos="fade-right" data-aos-delay="800">
              <img src="/img/tdt3.webp" alt="Tierra de Todos Logo" className="mb-4" />
              <p className="text-sm font-light mb-8 text-center">
                Si no tines una cuenta, puedes crear una fácilmente haciendo clic en el botón de abajo. Únete a nuestra comunidad y comienza tu aventura en Tierra de Todos 3 hoy mismo.
              </p>
              <a
                href="/register"
                className="inline-block text-[var(--white-color)] underline rounded-md transition-all duration-300 hover:scale-105 font-medium"
              >
                Crear cuenta
              </a>
          </div>
        </div>
      </Banner>
    </>
  )
}

export default Login