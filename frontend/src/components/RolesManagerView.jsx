import { 
  Search,
  Plus,
  MoreVertical,
  ShieldOff
} from "lucide-react";
import Button from "../elements/Button";
import Input from "../elements/Input";

import { useState, useEffect, useRef } from "react";
import LoadingOverlay from "./LoadingOverlay";
import api from "../api/axios";

function RolesManagerView() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
      loadRoles();
  }, []);
  const loadRoles = async () => {
    console.log("Cargando roles...");
    try {
      setLoading(true);
      const { data } = await api.get("/admin/roles");
      setRoles(data || []);
    } catch (error) {
      console.error("Error cargando roles:", error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.2s_ease-out]">
      {loading && <LoadingOverlay />}
      
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
            <Plus size={18} /> Nuevo Rol
          </Button>
        </div>
      </div>
      {/* Grid de Roles usando tus variables de color */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roles.map((role)=>{
          return (
            <RoleCard key={role.id} role={role} onOpenDetails={setSelectedRole} />
          );
        })}
      </div>
      {selectedRole && (
        <RoleDetailModal
          id={selectedRole.id}
          role={selectedRole.role}
          detail={selectedRole.detail}
          onClose={() => setSelectedRole(null)}
        />
      )}
    </div>
  );
}

function RoleCard({ role, onOpenDetails }) {
  const { id, role: name, color, users, permissions, detail } = role;

  const [options, setOptions] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openRoleDetail = async (id, role, detail,) => {
    try {
      setOptions(false);
      onOpenDetails({ id, role, detail });
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };
  return (
    <div
      ref={cardRef}
      className="relative bg-[var(--ins-background)] rounded-2xl p-6 flex flex-col justify-between hover:bg-white/8 transition-colors"
    >
      
      <div className="flex justify-between items-start mb-4">
        <span 
          className="px-3 py-1 rounded-full text-xs font-bold border"
          style={{ 
            color: color, 
            borderColor: `${color}40`,
            backgroundColor: `${color}10` 
          }}
        >
          {name}
        </span>

        <button
          onClick={() => setOptions(!options)}
          className="text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)] transition-colors"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      {options && (
        <div className="absolute right-4 top-12 w-28 bg-[var(--ins-contextual-menu)] rounded-lg shadow-lg z-50 text-[var(--white-color)]">
          <button
            onClick={() => {
              onOpenDetails(role);
              setOptions(false);
            }}
            className="block w-full text-right px-3 py-2  hover:bg-black/10 rounded-lg"
          >
            Editar
          </button>

          <button
            onClick={() => openRoleDetail(id, name, detail)}
            className="block w-full text-right px-3 py-2 text-[var(--danger-color)] hover:bg-black/10 rounded-lg"
          >
            Borrar
          </button>
        </div>
      )}

      <p className="text-sm text-[var(--ins-text-gray)] mb-6">{detail}</p>

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

function RoleDetailModal({ id, role, detail, onClose  }) {
  
  return(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[var(--ins-background)] rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-[var(--ins-text-white)] mb-4 gap-5 flex flex-col">Detalles del Rol</h3>
        <Input
          value={role}
          label="Rol"
          onChange={(e) => console.log("Nuevo valor del rol:", e.target.value)}
          className="mt-5"
        >
        </Input>
        <Input
          value={detail}
          label="Descripción"
          onChange={(e) => console.log("Nuevo valor del rol:", e.target.value)}
          class
        >
        </Input>
        <p className="text-sm text-[var(--ins-text-gray)]">Nombre del rol: {role}</p>
        <p className="text-sm text-[var(--ins-text-gray)]">Descripción: {detail}</p>
        <Button
          variant="secondary"
          size="md"
          className="mt-6"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </div>
    </div>
  )
}

export default RolesManagerView;