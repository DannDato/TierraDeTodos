import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Newspaper,
  User,
  Users,
  Menu,
  FlagTriangleRight,
  Settings,
  Info,
  ArrowBigDown,
} from "lucide-react";

function MenuBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 0, name: "Inicio", icon: Home, path: "/start", target: "_self", shortAccess: true },
    { id: 1, name: "Usuarios", icon: Users, path: "/userscontrol", target: "_self", shortAccess: false },
    { id: 2, name: "Descarga", icon: ArrowBigDown, path: "/download", target: "_self", shortAccess: true },
    { id: 3, name: "Usuarios", icon: Users, path: "/users", target: "_self", shortAccess: true },
    { id: 4, name: "Cuenta", icon: User, path: "/profile", target: "_self", shortAccess: true },
    { id: 5, name: "Configuración", icon: Settings, path: "/configuration", target: "_self", shortAccess: false },
    { id: 6, name: "Acerca de", icon: Info, path: "/aboutapp", target: "_self", shortAccess: false },
  ];

  const handleNavigate = (path, target) => {
    if (target === "_blank") {
      window.open(path, "_blank", "noopener,noreferrer");
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* BOTTOM BAR */}
      <nav className="fixed bottom-0 left-0 w-full bg-[var(--white-color)] z-50 shadow-lg">

        <div className="flex w-full justify-between h-16 bg-black/5">

          {menuItems
            .filter((item) => item.shortAccess)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path, item.target)}
                  className={`flex-1 flex flex-col items-center justify-center text-sm transition-all duration-300
                    ${isActive
                      ? "text-black scale-110"
                      : "text-black/70 hover:text-black"
                    }`}
                >
                  <Icon size={22} />
                  <span className="text-xs mt-1">{item.name}</span>
                </button>
              );
            })}

          {/* BURGER */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 flex flex-col items-center justify-center text-black/70 hover:text-black transition-all duration-300"
          >
            <Menu size={22} />
            <span className="text-xs mt-1">Menu</span>
          </button>

        </div>
      </nav>

      {/* OVERLAY */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[var(--white-color)] z-50
          transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 flex flex-col gap-6 text-black">

          <h2 className="text-md font-semibold border-b border-gray-700 pb-3 flex items-center gap-2">
            Tierra de Todos
            <img
              src="img/cubo.webp"
              className="max-w-[25px] mt-1 mx-5"
              alt="Cubo"
            />
          </h2>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path, item.target)}
                className={`flex items-center gap-3 text-left transition-all duration-200
                  ${isActive
                    ? "text-[var(--secondary-color)]"
                    : "text-black/70 hover:text-black"
                  }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}

        </div>
      </div>
    </>
  );
}

export default MenuBar;