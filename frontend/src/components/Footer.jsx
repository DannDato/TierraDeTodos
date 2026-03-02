import Button from "../elements/Button";

function Footer() {
  return (
    <footer className="bg-[var(--black-color)] text-[var(--white-color)] pt-16 pb-8 border-t border-white/5 relative z-20">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mb-12">
          
          <div className="flex flex-col text-center md:text-left items-center md:items-start">
            <h2 className="text-3xl font-extrabold mb-4 tracking-wide">
              Tierra de <span className="text-[var(--tertiary-color)]">Todos 3</span>
            </h2>
            <p className="text-sm md:text-base font-light text-gray-400 max-w-sm">
              El servidor de Minecraft donde la aventura, la creatividad y la comunidad se unen.
            </p>
          </div>
          
          <div className="flex flex-col text-center md:text-right items-center md:items-end justify-center gap-4">
            <Button 
              variant="discord" 
              size="md" 
              className="shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all" 
              fullWidth={false} 
              target="_blank" 
              href="https://discord.gg/tdt3"
            >
              Únete a Discord
            </Button>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm">
              Únete a nuestro Discord para estar al tanto de los sneak peeks antes del lanzamiento.
            </p>
          </div>

        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs md:text-sm font-light text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} Tierra de Todos 3. Todos los derechos reservados.
          </p>
          
          <p className="text-xs md:text-sm font-light text-gray-500 flex items-center gap-1.5 justify-center">
            Construido bloque a bloque con amor 
            <span className="text-[var(--secondary-color)] animate-pulse">♥</span>
            By: <span className="text-gray-300 font-medium hover:text-[var(--primary-color)] transition-colors cursor-default">DannDato</span>
          </p>
        </div>
        
      </div>
    </footer>
  );
}

export default Footer;