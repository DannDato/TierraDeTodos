import Input from "../../elements/Input" 
import Button from "../../elements/Button"
import Banner from "../../elements/Banner"
import SocialsAuth from "../../components/SocialsAuth"


function Register() {
  return (
    <>
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
                placeholder="Ingresa tu nombre de usuario"
                type = "text"
              />
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
              <Input 
                label="Repetir contraseña"
                placeholder="Repite tu contraseña"
                type = "password"
              />
              <SocialsAuth
                onGoogle={() => console.log("Google login")}
                onDiscord={() => console.log("Discord login")}
                onMicrosoft={() => console.log("Microsoft login")}
              />
              <Button variant="primary" className="mt-10">Registrarse</Button>
            </form>
          </div>
        </div>
      </Banner>
    </>
  )
}

export default Register