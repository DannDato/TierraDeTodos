import { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  Key,
  Activity,
  Settings,
  Database,
  Smartphone,
  Award,
  Menu,
  X,
} from "lucide-react";
import RolesManagerView from "../../components/admin/gestion/RolesManagerView";
import PermissionsManagerView from "../../components/admin/gestion/PermissionsManagerView";
import StatusManagerView from "../../components/admin/gestion/StatusManagerView";
import SessionsManagerView from "../../components/admin/gestion/SessionsManagerView";
import DevicesManagerView from "../../components/admin/gestion/DevicesManagerView";
import EditionsManagerView from "../../components/admin/gestion/EditionsManagerView";
import TicketCatalogManagerView from "../../components/admin/gestion/TicketCatalogManagerView";
import NewsTypesManagerView from "../../components/admin/gestion/NewsTypesManagerView";
import CommandsManager from "../../components/admin/gestion/CommandsManager";
import CommunitiesManagerView from "../../components/admin/gestion/CommunitiesManagerView";
import SystemPreferencesView from "../../components/admin/gestion/SystemPreferencesView";
import AchievementsManagerView from "../../components/admin/gestion/AchievementsManagerView";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import api from "../../api/axios";


function Gestion() {
  const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };
  const [activeSection, setActiveSection] = useState("editions");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setSectionLoading(false), 220);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const { data } = await api.get("/system/menu");
        setPermissions(Array.isArray(data?.permissions) ? data.permissions : []);
      } catch (_error) {
        setPermissions([]);
      }
    };

    loadPermissions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false);
      }
    };
    if (sidebarOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  const handleSelectSection = (id) => {
    if (id !== activeSection) {
      setSectionLoading(true);
      setTimeout(() => setSectionLoading(false), 180);
    }
    setActiveSection(id);
    setSidebarOpen(false);
  };

  const canManageCommands = permissions.includes("Commands.manage") || permissions.includes("commands.manage");
  const canAdminCommunities = permissions.includes("Communities.admin");

  const menuCategories = [
    {
      title: "Base",
      items: [
        { id: "editions", label: "Control de ediciones", icon: <ShieldCheck size={18} /> },
        { id: "achievements", label: "Insignias y Logros", icon: <Award size={18} /> },
        { id: "ticketCatalogs", label: "Catálogos de Tickets", icon: <Database size={18} /> },
        { id: "newsTypes", label: "Tipos de Noticias",   icon: <Activity size={18} /> },
        ...(canManageCommands ? [{ id: "commands", label: "Comandos del Juego", icon: <Database size={18} /> }] : []),
        ...(canAdminCommunities ? [{ id: "communities", label: "Comunidades", icon: <ShieldCheck size={18} /> }] : []),
      ]
    },
    {
      title: "Seguridad y Accesos",
      items: [
        { id: "roles", label: "Gestión de Roles", icon: <ShieldCheck size={18} /> },
        { id: "permissions", label: "Catálogo de Permisos", icon: <Key size={18} /> },
        { id: "status", label: "Catálogo de Estatus", icon: <Activity size={18} /> },
      ]
    },
    {
      title: "Control de Cuentas",
      items: [
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
    <section className="min-h-screen h-screen py-15 flex items-start justify-center pb-24">
      <LoadingOverlay isVisible={sectionLoading} message="Cargando gestión..." />

      <div className="flex flex-col min-h-full animate-[fadeIn_0.3s_ease-out] p-8 w-full">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
            <span>{currentUser.role}</span>
            <span>/</span>
            <span className="text-[var(--secondary-color)]">Gestión</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
            Gestión del Sistema
          </h1>

          <div className="flex items-start justify-between gap-4 mt-2">
            <p className="text-sm text-[var(--ins-text-gray)] max-w-lg">
              Administra y modera la configuracion completa del comportamiento del sistema, incluyendo roles, permisos, estatus de usuarios, sesiones activas y dispositivos autorizados. Control total para una gestión eficiente y segura.
            </p>
            {/* BOTÓN HAMBURGUESA — solo visible en < lg */}
            <div className="lg:hidden flex-shrink-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--black-color)]/30 text-[var(--ins-text-white)] text-sm font-bold hover:bg-[var(--black-color)]/50 transition-colors"
              >
                <Menu size={18} />
                <span>Menú</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-10">

            {/* OVERLAY — solo en < lg */}
            {sidebarOpen && (
              <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            )}

            {/* SIDEBAR */}
            <div
              ref={sidebarRef}
              className={`
                fixed lg:static z-50 lg:z-auto top-0 left-0 h-full lg:h-auto
                w-72 lg:w-64
                flex flex-col gap-8 pb-8
                lg:bg-transparent
                px-6 pt-8 lg:px-0 lg:pt-0
                flex-shrink-0 self-start
                transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              `}
            >
              {/* Botón cerrar — solo en < lg */}
              <div className="lg:hidden flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

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
                          onClick={() => handleSelectSection(item.id)}
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
            <div className="flex-1 bg-black/10 border border-white/10 rounded-[2rem] flex flex-col relative min-w-0">
            <div className="p-8">
              {activeSection === "editions" && <EditionsManagerView />}
                {activeSection === "achievements" && <AchievementsManagerView />}
                {activeSection === "ticketCatalogs" && <TicketCatalogManagerView />}
                {activeSection === "newsTypes" && <NewsTypesManagerView />}
                {activeSection === "commands" && canManageCommands && <CommandsManager />}
                {activeSection === "communities" && canAdminCommunities && <CommunitiesManagerView />}
                {activeSection === "roles" && <RolesManagerView />}
                {activeSection === "status" && <StatusManagerView />}
                {activeSection === "permissions" && <PermissionsManagerView />}
                {activeSection === "sessions" && <SessionsManagerView />}
                {activeSection === "devices" && <DevicesManagerView />}
                {activeSection === "system" && <SystemPreferencesView />}
            </div>
            </div>
        </div>
        </div>
    </section>
  );
}

export default Gestion;