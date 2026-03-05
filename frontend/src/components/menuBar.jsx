import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  User,
  Users,
  Menu,
  Settings,
  Info,
  LogOut, 
} from "lucide-react";
import AlertModal from "../elements/AlertModal"; 

function MenuBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false); 

  const menuItems = [
    { id: 0, name: "Inicio", icon: Home, path: "/start", target: "_self", shortAccess: true },
    { id: 1, name: "Usuarios", icon: Users, path: "/userscontrol", target: "_self", shortAccess: false },
    { id: 2, name: "Usuarios", icon: Users, path: "/users", target: "_self", shortAccess: true },
    { id: 3, name: "Cuenta", icon: User, path: "/profile", target: "_self", shortAccess: true },
    { id: 4, name: "Configuración", icon: Settings, path: "/configuration", target: "_self", shortAccess: false },
    { id: 5, name: "Acerca de", icon: Info, path: "/aboutapp", target: "_self", shortAccess: false },
  ];

  const handleNavigate = (path, target) => {
    if (target === "_blank") {
      window.open(path, "_blank", "noopener,noreferrer");
    } else {
      navigate(path);
    }
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      <AlertModal
        isOpen={showAlert}
        type="warning"
        title="Un momento..."
        message="Estas a punto de cerrar sesión."
        onClose={() => setShowAlert(false)}
        onConfirm={handleLogout}
      />

      {/* BOTTOM BAR */}
      <nav className="fixed bottom-0 left-0 w-full bg-[var(--white-color)] z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex w-full justify-between h-16">
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
                      : "text-black/70 hover:text-[var(--secondary-color)]"
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
            className="flex-1 flex flex-col items-center justify-center text-black/70 hover:text-[var(--secondary-color)] transition-all duration-300"
          >
            <Menu size={22} />
            <span className="text-xs mt-1">Menu</span>
          </button>
        </div>
      </nav>

      {/* OVERLAY */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isOpen ? "opacity-100 visible bg-black/20" : "opacity-0 invisible"}`}
      />

      {/* SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-[var(--white-color)] z-50
          transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Contenido Superior */}
        <div className="p-6 flex flex-col gap-6 text-black flex-1">
          <h2 className="text-md font-semibold  pb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              Tierra de Todos
              <img src="img/cubo.webp" className="w-6 mt-1" alt="Cubo" />
            </span>
          </h2>

          <div className="flex flex-col gap-5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path, item.target)}
                  className={`flex items-center gap-3 text-left transition-all duration-200
                    ${isActive
                      ? "text-[var(--secondary-color)] font-medium"
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

        <div className="p-6 ">
          <button
            onClick={() => {
              setIsOpen(false); 
              setShowAlert(true); 
            }}
            className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-[var(--cancel-color)] hover:bg-[var(--cancel-color)]/10 transition-all duration-200 font-semibold"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default MenuBar;