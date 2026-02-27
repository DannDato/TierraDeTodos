import Button from "../elements/Button";

function Footer() {
  return (
    <footer className="bg-black text-[var(--white-color)] pt-12 pb-6 border-t border-[var(--secondary-color)]/30 relative z-20">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 mb-10">
          <div className="flex flex-col text-center ">
            <h2 className="text-3xl font-bold mb-5">
              Tierra de <span className="text-[var(--tertiary-color)]">Todos 3</span>
            </h2>
            <p className="text-sm font-light text-[var(--white-color)]/70 mb-4 ">
              El servidor de Minecraft donde la aventura, la creatividad y la comunidad se unen.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-center ">
            <div className="px-5 py-3 ">
              <Button variant="discord" size="md" className={"text-center"} fullWidth={false} target="_blank" href="https://discord.gg/tdt3">
                únete a Discord
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-[var(--white-color)]/70 text-center ">
              Únete a nuestro Discord para estar al tanto de los sneak peeks antes del lanzamiento.
            </p>
          </div>

        </div>
        <div className="border-t border-[var(--white-color)]/10 pt-5 text-center justify-between items-center gap-2">
          <p className="text-xs font-light text-[var(--white-color)]/50">
            © 2026 Tierra de Todos 3. Todos los derechos reservados.
          </p>
          <p className="text-xs font-light text-[var(--white-color)]/50 flex items-center gap-1 justify-center">
            Construido bloque a bloque con amor <span className="text-[var(--secondary-color)]">♥</span>
            By: DannDato
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;