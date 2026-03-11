import { useState } from "react";
import { 
  ShieldCheck, 
  Key, 
  Activity, 
  Settings, 
  Database,
  Smartphone,
  ShieldAlert,
  Search,
  Plus,
  MoreVertical
} from "lucide-react";
import Button from "../../elements/Button";

function Gestion() {
  const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };
  const [activeSection, setActiveSection] = useState("roles");

  const menuCategories = [
    {
      title: "Seguridad y Accesos",
      items: [
        { id: "roles", label: "Gestión de Roles", icon: <ShieldCheck size={18} /> },
        { id: "permissions", label: "Catálogo de Permisos", icon: <Key size={18} /> },
        { id: "presets", label: "Presets por Role", icon: <ShieldAlert size={18} /> },
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
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
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

        {/* CONTENEDOR PRINCIPAL */}
        <div className="flex flex-1 gap-8 min-h-0 overflow-hidden">
            
            {/* SIDEBAR INTERNO */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-8 overflow-y-auto custom-scrollbar pb-8">
            {menuCategories.map((category, idx) => (
                <div key={idx}>
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--ins-text-dark)] mb-3 pl-4">
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
                {activeSection === "permissions" && (
                <div className="flex flex-col items-center justify-center h-full text-[var(--ins-text-dark)]">
                    <Key size={48} className="mb-4 opacity-50" />
                    <p className="font-bold">Módulo de Permisos en construcción...</p>
                </div>
                )}
            </div>
            </div>
        </div>
        </div>
    </section>
  );
}

// ==========================================
// VISTA: GESTOR DE ROLES
// ==========================================
function RolesManagerView() {
  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">
            Gestión de Roles
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ins-text-dark)]" size={18} />
            <input 
              type="text" 
              placeholder="Buscar role..." 
              className="bg-[var(--ins-background)] border-none rounded-2xl pl-11 pr-4 py-3 text-sm text-[var(--ins-text-white)] placeholder:text-[var(--ins-text-dark)] focus:ring-2 focus:ring-[var(--secondary-color)] outline-none transition-all w-64"
            />
          </div>
          <Button variant="primary" size="md" className="flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white">
            <Plus size={18} /> Nuevo Role
          </Button>
        </div>
      </div>

      {/* Grid de Roles usando tus variables de color */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RoleCard name="ADMIN" color="var(--admin-color)" users={3} permissions={42} description="Acceso total al sistema y configuraciones." />
        <RoleCard name="POLICE" color="var(--police-color)" users={5} permissions={28} description="Moderación avanzada y gestión de reportes." />
        <RoleCard name="MODERATOR" color="var(--moderator-color)" users={12} permissions={15} description="Gestión básica de usuarios y chat." />
        <RoleCard name="VIP" color="var(--vip-color)" users={45} permissions={8} description="Usuarios con beneficios cosméticos y acceso prioritario." />
        <RoleCard name="USER" color="var(--user-color)" users={1240} permissions={4} description="Role por defecto para nuevos jugadores." />
      </div>
    </div>
  );
}

function RoleCard({ name, color, users, permissions, description }) {
  return (
    <div className="bg-[var(--ins-background)] rounded-2xl p-6 flex flex-col justify-between hover:bg-[var(--black-color)]/40 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <span 
          className="px-3 py-1 rounded-full text-xs font-bold border"
          style={{ 
            color: color, 
            borderColor: `${color}40`, // 40 es opacidad en hex
            backgroundColor: `${color}10` 
          }}
        >
          {name}
        </span>
        <button className="text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)] transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
      <p className="text-sm text-[var(--ins-text-gray)] mb-6">{description}</p>
      <div className="flex gap-4 border-t border-[var(--black-color)]/20 pt-4">
        <div className="text-xs">
          <span className="text-[var(--ins-text-dark)] block mb-1">USUARIOS</span>
          <span className="text-[var(--ins-text-white)] font-bold">{users}</span>
        </div>
        <div className="text-xs">
          <span className="text-[var(--ins-text-dark)] block mb-1">PERMISOS</span>
          <span className="text-[var(--ins-text-white)] font-bold">{permissions}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISTA: GESTOR DE ESTATUS
// ==========================================
function StatusManagerView() {
  return (
    <div className="animate-[fadeIn_0.2s_ease-out]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">
            Catálogo de Estatus
          </h2>
        </div>
        <Button variant="primary" size="md" className="flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white">
          <Plus size={18} /> Agregar Estatus
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatusCard name="ACTIVE" colorClass="text-[var(--active-color)] bg-[var(--active-color)]/10 border-[var(--active-color)]/20" dotClass="bg-[var(--active-color)]" desc="El usuario tiene acceso total a la plataforma." />
        <StatusCard name="INACTIVE" colorClass="text-[var(--warning-color)] bg-[var(--warning-color)]/10 border-[var(--warning-color)]/20" dotClass="bg-[var(--warning-color)]" desc="Cuenta deshabilitada temporalmente o sin confirmar." />
        <StatusCard name="BANNED" colorClass="text-[var(--danger-color)] bg-[var(--danger-color)]/10 border-[var(--danger-color)]/20" dotClass="bg-[var(--danger-color)]" desc="Acceso revocado permanentemente por infracciones." />
      </div>
    </div>
  );
}

function StatusCard({ name, colorClass, dotClass, desc }) {
  return (
    <div className="bg-[var(--ins-background)] rounded-2xl p-6 hover:bg-[var(--black-color)]/40 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <span className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${colorClass}`}>
          <span className={`w-2 h-2 rounded-full animate-pulse ${dotClass}`}></span>
          {name}
        </span>
        <button className="text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)]">
          <MoreVertical size={20} />
        </button>
      </div>
      <p className="text-sm text-[var(--ins-text-gray)] leading-relaxed">{desc}</p>
    </div>
  );
}

export default Gestion;