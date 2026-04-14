import { useState } from "react";
import {
  ShieldCheck,
  Key,
  Activity,
  Settings,
  Database,
  Smartphone,
} from "lucide-react";
import RolesManagerView from "../../components/gestion/RolesManagerView";
import PermissionsManagerView from "../../components/gestion/PermissionsManagerView";
import StatusManagerView from "../../components/gestion/StatusManagerView";


function Gestion() {
  const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };
  const [activeSection, setActiveSection] = useState("roles");

  const menuCategories = [
    {
      title: "Seguridad y Accesos",
      items: [
        { id: "roles", label: "Gestión de Roles", icon: <ShieldCheck size={18} /> },
        { id: "permissions", label: "Catálogo de Permisos", icon: <Key size={18} /> },
      ]
    },
    {
      title: "Control de Cuentas",
      items: [
        { id: "status", label: "Catálogo de Estatus", icon: <Activity size={18} /> },
        { id: "sessions", label: "Sesiones Globales", icon: <Database size={18} /> },
        { id: "devices", label: "Dispositivos Autorizados", icon: <Smartphone size={18} /> },
      ]
    },
    {
      title: "Avanzado",
      items: [
        { id: "system", label: "Preferencias del Sistema", icon: <Settings size={18} /> },
      ]
    }
  ];

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
      <div className="flex flex-col h-full animate-[fadeIn_0.3s_ease-out] p-8 max-w-[1400px] mx-auto w-full bg-[var(--ins-background)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
            <span>{currentUser.role}</span>
            <span>/</span>
            <span className="text-[var(--secondary-color)]">Usuarios</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
            Jugadores
          </h1>

          <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
            Administra y modera a la comunidad de TDT. Doble click o botón de ojo para abrir detalle y permisos.
          </p>
        </div>

        <div className="flex flex-1 gap-8 min-h-0 overflow-hidden mt-10">

            {/* SIDEBAR INTERNO */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-8 overflow-y-auto custom-scrollbar pb-8">
            {menuCategories.map((category, idx) => (
                <div key={idx}>
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ins-text-dark)] mb-3">
                    {category.title}
                </h3>
                <div className="flex flex-col gap-1">
                    {category.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-colors duration-200 ${
                            isActive
                            ? "bg-[var(--black-color)]/20 text-[var(--ins-text-white)]"
                            : "text-[var(--ins-text-gray)] hover:bg-[var(--black-color)]/10 hover:text-[var(--ins-text-white)]"
                        }`}
                        >
                        <span className={isActive ? "text-[var(--secondary-color)]" : "text-[var(--ins-text-dark)]"}>
                            {item.icon}
                        </span>
                        {item.label}
                        </button>
                    );
                    })}
                </div>
                </div>
            ))}
            </div>

            {/* ÁREA DE CONTENIDO DINÁMICO */}
            <div className="flex-1 bg-[var(--black-color)]/20 rounded-[2rem] overflow-hidden flex flex-col relative">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeSection === "roles" && <RolesManagerView />}
                {activeSection === "status" && <StatusManagerView />}
                {activeSection === "permissions" && <PermissionsManagerView />}
            </div>
            </div>
        </div>
        </div>
    </section>
  );
}

export default Gestion;