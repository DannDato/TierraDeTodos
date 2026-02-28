import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../elements/Button";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = ["Inicio", "Noticias", "Reglas", "Streamers", "Timeline"];

  const scrollToSection = (sectionId) => {
    const doScroll = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    };

    // Si NO estamos en home, navegamos primero
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      doScroll();
    }

    setIsOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[var(--black-color)] shadow-lg">
        <nav className="px-6 md:px-10">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <button
              onClick={() => scrollToSection("inicio")}
              className="text-white mx-10"
            >
              <img
                src="/img/dblank.webp"
                alt="Logo"
                data-aos="fade-right"
                data-aos-duration="3000"
                className="w-7 mx-10"
              />
            </button>

            {/* Desktop Menu */}
            <ul className="hidden lg:flex gap-10 text-[var(--white-color)]">
              {navItems.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => scrollToSection(item.toLowerCase())}
                    data-aos="fade-down"
                    data-aos-duration={500 + i * 200}
                    className="hover:text-[var(--secondary-color)] transition-colors cursor-pointer"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop Buttons */}
            <div className="hidden sm:flex gap-3 mx-10 xl:-ml-30"
                data-aos="fade-left"
                data-aos-duration="3000"
            >
              <Button variant="outline" href="/login">
                Entrar
              </Button>
              <Button variant="ghost" href="/register">
                Registrarse
              </Button>
            </div>

            {/* Burger */}
            <button
              className="lg:hidden text-white text-2xl"
              onClick={() => setIsOpen(true)}
            >
              ☰
            </button>
          </div>
        </nav>
      </header>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[var(--black-color)] z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col gap-6 text-white">

          <button
            onClick={() => setIsOpen(false)}
            className="self-end text-xl"
          >
            ✕
          </button>

          {navItems.map((item, i) => (
            <button
              key={i}
              onClick={() => scrollToSection(item.toLowerCase())}
              className="text-lg text-left hover:text-[var(--secondary-color)] transition-colors"
            >
              {item}
            </button>
          ))}

          <div className="border-t border-gray-700 pt-6 flex flex-col gap-3">
            <Button variant="outline" fullWidth href="/login">
              Inicia sesión
            </Button>
            <Button variant="ghost" fullWidth href="/register">
              Registrarse
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;