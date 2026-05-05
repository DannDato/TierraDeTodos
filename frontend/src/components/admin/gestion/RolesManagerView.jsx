import {
  Search,
  Plus,
  MoreVertical,
  Save,
  Trash2,
  ShieldCheck,
  Activity,
  Info,
  X,
} from "lucide-react";
import Button from "../../../elements/Button";
import Input from "../../../elements/Input";
import Select from "../../../elements/Select";
import CloseButton from "../../../elements/closeButton";
import AlertModal from "../../../elements/AlertModal";

import { useState, useEffect, useRef } from "react";
import LoadingOverlay from "../../shared/LoadingOverlay";
import api from "../../../api/axios";

function RolesManagerView() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });
  const pendingActionRef = useRef(null);

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

  const openAlert = ({ type = "info", title = "Aviso", message = "", onConfirm = null }) => {
    pendingActionRef.current = onConfirm;
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const closeAlert = () => {
    pendingActionRef.current = null;
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAlertConfirm = async () => {
    const action = pendingActionRef.current;
    closeAlert();
    if (typeof action === "function") {
      await action();
    }
  };

  const openNewRoleModal = () => {
    setAvailablePermissions([]);
    setSelectedPermissions([]);
    setSelectedRole({
      id: null,
      role: "",
      detail: "",
      color: "#29d096",
      complementary: "#6b7280",
      enfasis: "#111827",
      extra: "#f5f5f5",
      asignable: "YES",
      active: "YES",
      users: 0,
      permissions: 0,
    });
  };

  const openRoleDetails = async (roleData) => {
    setSelectedRole(roleData);

    if (!roleData?.id) {
      setAvailablePermissions([]);
      setSelectedPermissions([]);
      return;
    }

    try {
      const { data } = await api.get(`/admin/roles/${roleData.id}/permissions`);
      setAvailablePermissions(data?.availablePermissions || []);
      setSelectedPermissions(data?.permissionKeys || []);
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudieron cargar permisos",
        message: error.response?.data?.message || "No se pudieron cargar los permisos del role.",
      });
      setAvailablePermissions([]);
      setSelectedPermissions([]);
    }
  };

  const handleToggleRolePermission = (permissionKey) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((key) => key !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole?.id) {
      openAlert({
        type: "warning",
        title: "Role sin guardar",
        message: "Primero guarda el role para poder configurar permisos preset.",
      });
      return;
    }

    openAlert({
      type: "warning",
      title: "Actualizar permisos del role",
      message: `Se actualizarán los permisos preset del role ${selectedRole.role} y se sincronizarán sus usuarios.`,
      onConfirm: async () => {
        try {
          setIsSavingPermissions(true);
          await api.patch(`/admin/roles/${selectedRole.id}/permissions`, {
            permissionKeys: selectedPermissions,
          });
          await loadRoles();
          openAlert({
            type: "success",
            title: "Permisos actualizados",
            message: "Los permisos preset del role se guardaron correctamente.",
          });
        } catch (error) {
          openAlert({
            type: "error",
            title: "No se pudo guardar",
            message: error.response?.data?.message || "No se pudieron guardar los permisos del role.",
          });
        } finally {
          setIsSavingPermissions(false);
        }
      },
    });
  };

  const requestDeleteRole = (roleData) => {
    openAlert({
      type: "warning",
      title: "Eliminar role",
      message: `Se eliminará el role ${roleData?.role || ""}. Esta acción no se puede deshacer.`,
      onConfirm: () => handleDeleteRole(roleData),
    });
  };

  const handleDeleteRole = async (roleData) => {
    if (!roleData?.id) return;

    try {
      setIsSaving(true);
      await api.delete(`/admin/roles/${roleData.id}`);
      await loadRoles();
      if (selectedRole?.id === roleData.id) {
        setSelectedRole(null);
      }
      openAlert({
        type: "success",
        title: "Role eliminado",
        message: "El role se eliminó correctamente.",
      });
    } catch (error) {
      console.error("Error eliminando role:", error);
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar el role.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRole = async (formData) => {
    const normalizedRole = String(formData?.role || "").trim().toUpperCase();
    const normalizedDetail = String(formData?.detail || "").trim();

    if (!normalizedRole || !normalizedDetail) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "Role y descripción son obligatorios.",
      });
      return;
    }

    const payload = {
      role: normalizedRole,
      detail: normalizedDetail,
      color: formData?.color || "#29d096",
      complementary: formData?.complementary || "#6b7280",
      enfasis: formData?.enfasis || "#111827",
      extra: formData?.extra || "#f5f5f5",
      asignable: formData?.asignable || "YES",
      active: formData?.active || "YES",
    };

    const actionText = formData?.id ? "actualizar" : "crear";

    openAlert({
      type: "warning",
      title: `Confirmar ${actionText}`,
      message: `Se va a ${actionText} el role ${normalizedRole}.`,
      onConfirm: async () => {
        try {
          setIsSaving(true);

          if (formData?.id) {
            await api.put(`/admin/roles/${formData.id}`, payload);
          } else {
            await api.post(`/admin/roles`, payload);
          }

          await loadRoles();
          setSelectedRole(null);

          openAlert({
            type: "success",
            title: "Rol guardado",
            message: "Se ha guardado correctamente.",
          });
        } catch (error) {
          console.error("Error guardando rol:", error);
          openAlert({
            type: "error",
            title: "No se pudo guardar",
            message: error.response?.data?.message || "No se pudo guardar el rol.",
          });
        } finally {
          setIsSaving(false);
        }
      },
    });
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
      <LoadingOverlay isVisible={loading || isSaving || isSavingPermissions} />
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        onConfirm={handleAlertConfirm}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">
            Gestión de Roles
          </h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">
            Organiza jerarquías, alcance operativo y permisos preset para cada tipo de cuenta.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 rounded-xl px-4 py-2.5 text-sm text-[var(--ins-text-white)] placeholder:text-[var(--ins-text-gray)] focus:outline-none focus:border-[var(--secondary-color)]/50 transition-colors pr-10"
            />
            {searchTerm ? (
              <button type="button" onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] transition-colors">
                <X size={14} />
              </button>
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] pointer-events-none" size={16} />
            )}
          </div>
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
            onClick={openNewRoleModal}
          >
            <Plus size={18} /> Nuevo Rol
          </Button>
        </div>
      </div>

      {/* Grid de Roles */}
      {filteredRoles.length === 0 ? (
        <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay roles para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRoles.map((role) => {
            return (
              <RoleCard
                key={role.id}
                role={role}
                onOpenDetails={openRoleDetails}
                onDeleteRole={requestDeleteRole}
              />
            );
          })}
        </div>
      )}

      {/* Renderizado Condicional del Modal */}
      {selectedRole && (
        <RoleDetailModal
          roleData={selectedRole}
          onClose={() => setSelectedRole(null)}
          onSave={handleSaveRole}
          onDelete={requestDeleteRole}
          isSaving={isSaving}
          availablePermissions={availablePermissions}
          selectedPermissions={selectedPermissions}
          onTogglePermission={handleToggleRolePermission}
          onSavePermissions={handleSaveRolePermissions}
          isSavingPermissions={isSavingPermissions}
        />
      )}
    </div>
  );
}

function RoleCard({ role, onOpenDetails, onDeleteRole }) {
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
      className="relative min-h-[220px] rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 p-6 flex flex-col justify-between shadow-sm hover:bg-[var(--black-color)]/25 hover:border-[var(--white-color)]/10 transition-all duration-200"
      onDoubleClick={() => onOpenDetails(role)}
    >
      <div className="flex justify-between items-start mb-4 relative">
        <span
          className="px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider"
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
          className="rounded-lg p-2 text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)] hover:bg-white/5 transition-colors"
        >
          <MoreVertical size={20} />
        </button>

        {/* Menú contextual posicionado absolutamente respecto a este header */}
        {optionsOpen && (
          <div className="absolute right-0 top-10 w-32 bg-[var(--ins-contextual-menu)] border border-[var(--white-color)]/10 rounded-xl shadow-xl z-10 overflow-hidden text-sm">
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
                onDeleteRole(role);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[var(--cancel-color)] hover:bg-[var(--cancel-color)]/10 transition-colors"
            >
              Borrar
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-[var(--ins-text-gray)] mb-6 line-clamp-3 min-h-[62px] leading-relaxed">
        {detail}
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4 mt-auto border-t border-[var(--white-color)]/5">
        <div className="rounded-2xl bg-black/20 px-4 py-3">
          <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--ins-text-dark)] mb-1 block">USUARIOS</span>
          <span className="text-[var(--ins-text-white)] font-bold text-lg">{users}</span>
        </div>
        <div className="rounded-2xl bg-black/20 px-4 py-3">
          <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--ins-text-dark)] mb-1 block">PERMISOS</span>
          <span className="text-[var(--ins-text-white)] font-bold text-lg">{permissions}</span>
        </div>
      </div>
    </div>
  );
}


function RoleDetailModal({
  roleData,
  onClose,
  onSave,
  onDelete,
  isSaving,
  availablePermissions,
  selectedPermissions,
  onTogglePermission,
  onSavePermissions,
  isSavingPermissions,
}) {
  const [activeTab, setActiveTab] = useState("data");

  // Estado local para manejar los cambios antes de guardarlos
  const [formData, setFormData] = useState({
    id: roleData?.id || null,
    role: roleData?.role || "",
    detail: roleData?.detail || "",
    color: roleData?.color || "#ffffff",
    complementary: roleData?.complementary || "#6b7280",
    enfasis: roleData?.enfasis || "#111827",
    extra: roleData?.extra || "#f5f5f5",
    asignable: roleData?.asignable || "YES",
    active: roleData?.active || "YES",
  });

  useEffect(() => {
    setActiveTab("data");
    setFormData({
      id: roleData?.id || null,
      role: roleData?.role || "",
      detail: roleData?.detail || "",
      color: roleData?.color || "#29d096",
      complementary: roleData?.complementary || "#6b7280",
      enfasis: roleData?.enfasis || "#111827",
      extra: roleData?.extra || "#f5f5f5",
      asignable: roleData?.asignable || "YES",
      active: roleData?.active || "YES",
    });
  }, [roleData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isNewRole = !formData.id;
  const orderedPermissions = [...(availablePermissions || [])].sort((a, b) =>
    String(a?.name || "").localeCompare(String(b?.name || ""))
  );

  return (
    <div className="fixed inset-0 bg-[var(--black-color)]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="bg-[var(--ins-background)] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header del modal */}
        <div className="px-8 py-6  flex items-center justify-between bg-[var(--black-color)]/10">
          <div>
            <h3 className="text-2xl font-extrabold text-[var(--ins-text-white)] flex items-center gap-3">
              {isNewRole ? "Nuevo Rol" : "Editar Rol"}
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: formData.color, boxShadow: `0 0 10px ${formData.color}80` }}
              ></span>
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">
              {isNewRole ? "Crea un nuevo rol para el sistema" : `ID interno: #${formData.id}`}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {!isNewRole && (
          <div className="flex-shrink-0 px-8 pt-5 pb-2">
            <div className="inline-flex p-1 space-x-1 bg-[var(--black-color)]/40 rounded-xl">
              <button
                onClick={() => setActiveTab("data")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeTab === "data"
                    ? "bg-[var(--white-color)]/10 text-[var(--ins-text-white)] shadow-sm"
                    : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/5"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Activity size={16} className={activeTab === "data" ? "text-[var(--secondary-color)]" : ""} />
                  Datos del Rol
                </span>
              </button>

              <button
                onClick={() => setActiveTab("permissions")}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeTab === "permissions"
                    ? "bg-[var(--white-color)]/10 text-[var(--ins-text-white)] shadow-sm"
                    : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/5"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={16} className={activeTab === "permissions" ? "text-[var(--streammer-color)]" : ""} />
                  Permisos
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Cuerpo del formulario */}
        <div className="p-8 overflow-y-auto tdt-scrollbar flex flex-col gap-10">

          {(isNewRole || activeTab === "data") && (
            <>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nombre del Rol"
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value.toUpperCase())}
                  placeholder="Ej. SUPER-ADMIN"
                />

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="Color Fondo"
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
                context="dark"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="Color Complementary"
                      value={formData.complementary}
                      onChange={(e) => handleChange("complementary", e.target.value)}
                      placeholder="#6B7280"
                    />
                  </div>
                  <div className="w-12 mt-7 flex-shrink-0 flex items-center justify-center">
                    <label
                      className="relative w-10 h-10 rounded-xl border-2 border-[var(--black-color)]/40 cursor-pointer block overflow-hidden transition-transform hover:scale-105"
                      style={{ backgroundColor: formData.complementary }}
                      title="Elegir color complementary"
                    >
                      <input
                        type="color"
                        value={formData.complementary}
                        onChange={(e) => handleChange("complementary", e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="Color Enfasis"
                      value={formData.enfasis}
                      onChange={(e) => handleChange("enfasis", e.target.value)}
                      placeholder="#111827"
                    />
                  </div>
                  <div className="w-12 mt-7 flex-shrink-0 flex items-center justify-center">
                    <label
                      className="relative w-10 h-10 rounded-xl border-2 border-[var(--black-color)]/40 cursor-pointer block overflow-hidden transition-transform hover:scale-105"
                      style={{ backgroundColor: formData.enfasis }}
                      title="Elegir color enfasis"
                    >
                      <input
                        type="color"
                        value={formData.enfasis}
                        onChange={(e) => handleChange("enfasis", e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      label="Color Extra"
                      value={formData.extra}
                      onChange={(e) => handleChange("extra", e.target.value)}
                      placeholder="#F5F5F5"
                    />
                  </div>
                  <div className="w-12 mt-7 flex-shrink-0 flex items-center justify-center">
                    <label
                      className="relative w-10 h-10 rounded-xl border-2 border-[var(--black-color)]/40 cursor-pointer block overflow-hidden transition-transform hover:scale-105"
                      style={{ backgroundColor: formData.extra }}
                      title="Elegir color extra"
                    >
                      <input
                        type="color"
                        value={formData.extra}
                        onChange={(e) => handleChange("extra", e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1">¿Es Asignable?</label>
                  <Select
                    value={formData.asignable}
                    onChange={(val) => handleChange("asignable", val)}
                    className="w-full"
                    options={[
                      { value: "YES", label: "SÍ" },
                      { value: "NO", label: "NO" }
                    ]}
                  >
                  </Select>
                </div>

                <div className="flex flex-col gap-2 mb-20">
                  <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1">Activo</label>
                  <Select
                    value={formData.active}
                    onChange={(val) => handleChange("active", val)}
                    className="w-full"
                    options={[
                      { value: "YES", label: "SÍ" },
                      { value: "NO", label: "NO" }
                    ]}
                  >
                  </Select>
                </div>
              </div>

            </>
          )}

          {!isNewRole && activeTab === "permissions" && (
            <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
              {orderedPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--ins-text-gray)] bg-[var(--black-color)]/20 rounded-2xl">
                  <Info size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">No hay permisos disponibles para asignar.</p>
                </div>
              ) : (
                orderedPermissions.map((permission) => {
                  const enabled = selectedPermissions.includes(permission.key);

                  return (
                    <div
                      key={permission.key}
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                        enabled
                          ? "bg-[var(--secondary-color)]/5 border-[var(--secondary-color)]/30"
                          : "bg-[var(--white-color)]/5 border-[var(--white-color)]/5 hover:border-[var(--white-color)]/10 hover:bg-[var(--white-color)]/10"
                      }`}
                    >
                      <div className="pr-4">
                        <h4 className={`text-sm font-bold transition-colors ${enabled ? "text-[var(--ins-text-white)]" : "text-[var(--ins-text-gray)] group-hover:text-[var(--ins-text-white)]"}`}>
                          {permission.name}
                        </h4>
                        <p className="text-[10px] font-mono mt-1 px-1.5 py-0.5 rounded bg-[var(--black-color)]/30 inline-block text-[var(--ins-text-gray)]">
                          {permission.key}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-[var(--ins-text-gray)] mt-2 leading-relaxed">
                            {permission.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => onTogglePermission(permission.key)}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${
                          enabled ? "bg-[var(--secondary-color)] shadow-[0_0_10px_var(--secondary-color)]" : "bg-[var(--black-color)]/50 "
                        }`}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-[var(--white-color)] transition-transform duration-300 shadow-sm ${
                            enabled ? "translate-x-6" : "translate-x-1 opacity-70"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Footer con Botones */}
        <div className="px-8 py-6 border-t border-[var(--black-color)]/20 flex items-center justify-between gap-4 bg-[var(--black-color)]/10">
          <div>
            {!isNewRole && (
              <Button
                variant="cancel"
                className="text-[var(--danger-color)] border border-[var(--danger-color)]/30 hover:bg-[var(--danger-color)]/10 flex items-center gap-2"
                onClick={() => onDelete(formData)}
                disabled={isSaving}
              >
                <Trash2 size={16} />
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4">
          {/* <Button
            variant="secondary"
            className="text-[var(--ins-text-gray)] hover:text-white"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button> */}
          <Button
            variant="primary"
            className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2"
            onClick={activeTab === "permissions" && !isNewRole ? onSavePermissions : () => onSave(formData)}
            disabled={activeTab === "permissions" && !isNewRole ? isSavingPermissions : isSaving}
          >
            <Save size={18} />
            {activeTab === "permissions" && !isNewRole
              ? (isSavingPermissions ? "Guardando permisos..." : "Guardar Permisos")
              : (isNewRole ? "Crear Rol" : "Guardar Cambios")}
          </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default RolesManagerView;