import { 
  Search,
  Plus,
  MoreVertical,
  X,
  Save,
} from "lucide-react";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import CloseButton from "../../elements/closeButton";

import { useState, useEffect, useRef } from "react";
import LoadingOverlay from "../LoadingOverlay";
import api from "../../api/axios";

function RolesManagerView() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleSaveRole = async (updatedRole) => {
    console.log("Guardando datos del rol:", updatedRole);
    setSelectedRole(null);
  };

  const filteredRoles = roles.filter((role) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      role.role.toLowerCase().includes(searchLower) ||
      (role.detail && role.detail.toLowerCase().includes(searchLower))
    );
  });


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
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ins-text-white)]/50 pointer-events-none" size={20} />
          </div>
          <Button variant="primary" size="md" className="flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white">
            <Plus size={18} /> Nuevo Rol
          </Button>
        </div>
      </div>

      {/* Grid de Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRoles.map((role) => {
          return (
            <RoleCard key={role.id} role={role} onOpenDetails={setSelectedRole} />
          );
        })}
      </div>

      {/* Renderizado Condicional del Modal */}
      {selectedRole && (
        <RoleDetailModal
          roleData={selectedRole}
          onClose={() => setSelectedRole(null)}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
}

function RoleCard({ role, onOpenDetails }) {
  const { id, role: name, color, users, permissions, detail } = role;

  const [optionsOpen, setOptionsOpen] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative bg-[var(--ins-background)] rounded-2xl p-6 flex flex-col justify-between hover:bg-[var(--black-color)]/20 transition-colors "
      onDoubleClick={() => onOpenDetails(role)}
    >
      <div className="flex justify-between items-start mb-4 relative">
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
          onClick={() => setOptionsOpen(!optionsOpen)}
          className="text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)] transition-colors p-1"
        >
          <MoreVertical size={20} />
        </button>

        {/* Menú contextual posicionado absolutamente respecto a este header */}
        {optionsOpen && (
          <div className="absolute right-0 top-8 w-32 bg-[var(--gray-dark-color)]  rounded-xl shadow-xl z-10 overflow-hidden text-sm">
            <button
              onClick={() => {
                onOpenDetails(role); // Pasamos todo el objeto role
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/10 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => {
                console.log("Eliminar rol", id);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[var(--cancel-color)] hover:bg-[var(--cancel-color)]/10 transition-colors"
            >
              Borrar
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-[var(--ins-text-gray)] mb-6 line-clamp-2 min-h-[40px]">
        {detail}
      </p>

      <div className="flex gap-6 pt-4 mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-wider text-[var(--ins-text-dark)] mb-1">USUARIOS</span>
          <span className="text-[var(--ins-text-white)] font-bold text-lg">{users}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-wider text-[var(--ins-text-dark)] mb-1">PERMISOS</span>
          <span className="text-[var(--ins-text-white)] font-bold text-lg">{permissions}</span>
        </div>
      </div>
    </div>
  );
}


function RoleDetailModal({ roleData, onClose, onSave }) {
  // Estado local para manejar los cambios antes de guardarlos
  const [formData, setFormData] = useState({
    id: roleData?.id || null,
    role: roleData?.role || "",
    detail: roleData?.detail || "",
    color: roleData?.color || "#ffffff",
    asignable: roleData?.asignable || "YES",
    active: roleData?.active || "YES",
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-[var(--black-color)]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
      
      {/* Contenedor del Modal */}
      <div className="bg-[var(--ins-background)] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header del modal */}
        <div className="px-8 py-6  flex items-center justify-between bg-[var(--black-color)]/10">
          <div>
            <h3 className="text-2xl font-extrabold text-[var(--ins-text-white)] flex items-center gap-3">
              Editar Rol
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: formData.color, boxShadow: `0 0 10px ${formData.color}80` }}
              ></span>
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">
              ID interno: #{formData.id}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* Cuerpo del formulario */}
        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre del Rol"
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              placeholder="Ej. SUPER-ADMIN"
            />
            
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  label="Color Hexadecimal"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  placeholder="#FFFFFF"
                />
              </div>
              <div className="w-12 mt-7 flex-shrink-0 flex items-center justify-center">
                <label 
                  className="relative w-10 h-10 rounded-xl border-2 border-[var(--black-color)]/40 cursor-pointer block overflow-hidden transition-transform hover:scale-105"
                  style={{ backgroundColor: formData.color }}
                  title="Elegir color"
                >
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleChange("color", e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          <Input
            label="Descripción Detallada"
            value={formData.detail}
            onChange={(e) => handleChange("detail", e.target.value)}
            placeholder="Describe qué hace este rol..."
            // Si tu componente Input soporta textarea, puedes agregarlo aquí. Si no, funciona como texto normal.
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1">¿Es Asignable?</label>
              <Select
                value={formData.asignable}
                onChange={(e) => handleChange("asignable", e.target.value)}
                className="w-full"
              >
                <option value="YES">SÍ (YES)</option>
                <option value="NO">NO (NO)</option>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1">Estado</label>
              <Select
                value={formData.active}
                onChange={(e) => handleChange("active", e.target.value)}
                className="w-full"
              >
                <option value="YES">Activo (YES)</option>
                <option value="NO">Inactivo (NO)</option>
              </Select>
            </div>
          </div>
          
        </div>

        {/* Footer con Botones */}
        <div className="px-8 py-6 border-t border-[var(--black-color)]/20 flex items-center justify-end gap-4 bg-[var(--black-color)]/10">
          <Button
            variant="secondary"
            className="text-[var(--ins-text-gray)] hover:text-white"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2"
            onClick={() => onSave(formData)}
          >
            <Save size={18} />
            Guardar Cambios
          </Button>
        </div>

      </div>
    </div>
  );
}

export default RolesManagerView;