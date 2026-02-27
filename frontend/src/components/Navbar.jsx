import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../elements/Button";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[var(--black-color)] shadow-lg">
        <nav className="px-6 md:px-10">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link to="/" className="text-white mx-10">
              <img
                src="/img/dblank.webp"
                alt="Logo"
                className="w-7 mx-10"
              />
            </Link>

            {/* Desktop Menu */}
            <ul className="hidden lg:flex gap-10 text-[var(--white-color)]">
              {["Inicio", "Timeline", "Noticias", "Reglas", "Streamers"].map((item, i) => (
                <li key={i} className="hover:text-[var(--secondary-color)] transition-colors cursor-pointer" href={`#${item.toLowerCase()}`} >
                  {item}
                </li>
              ))}
            </ul>

            {/* Desktop Buttons */}
            <div className="hidden sm:flex gap-3 mx-10 xl:-ml-30">
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
          {["Inicio", "Timeline", "Noticias", "Reglas", "Streamers"].map((item, i) => (
            <Link key={i} to="/" onClick={() => setIsOpen(false)} className="text-lg hover:text-[var(--secondary-color)] transition-colors">
              {item}
            </Link>
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