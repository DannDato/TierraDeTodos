import {
  Search,
  Plus,
  Save,
  Trash2,
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

function PermissionsManagerView() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });
  const pendingActionRef = useRef(null);

  const normalizePermission = (permission) => ({
    id: permission?.id,
    key: String(permission?.key || "").trim().toLowerCase(),
    name: String(permission?.name || "").trim(),
    description: String(permission?.description || "").trim(),
    active: Boolean(permission?.active),
  });

  useEffect(() => { loadPermissions();}, []); // Carga inicial de permisos con las [] para que solo se ejecute una vez

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/permissions");
      setPermissions((data || []).map(normalizePermission));
    } catch (error) {
      console.error("Error cargando permisos:", error);
      setPermissions([]);
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

  const openNewPermissionModal = () => {
    setSelectedPermission({
      id: null,
      key: "",
      name: "",
      description: "",
      active: true,
    });
  };

  const requestDeletePermission = (permissionData) => {
    openAlert({
      type: "warning",
      title: "Eliminar permiso",
      message: `Se eliminará el permiso ${permissionData?.key || ""}. Esta acción no se puede deshacer.`,
      onConfirm: () => handleDeletePermission(permissionData),
    });
  };

  const handleDeletePermission = async (permissionData) => {
    if (!permissionData?.id) return;

    try {
      setIsSaving(true);
      await api.delete(`/admin/permissions/${permissionData.id}`);
      await loadPermissions();
      if (selectedPermission?.id === permissionData.id) {
        setSelectedPermission(null);
      }

      openAlert({
        type: "success",
        title: "Permiso eliminado",
        message: "Se eliminó correctamente.",
      });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar el permiso.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePermission = async (formData) => {
    const normalizedKey = String(formData?.key || "").trim().toLowerCase();
    const normalizedName = String(formData?.name || "").trim();
    const normalizedDescription = String(formData?.description || "").trim();
    const normalizedActive = Boolean(formData?.active);

    if (!normalizedKey || !normalizedName) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "Clave y nombre son obligatorios.",
      });
      return;
    }

    const actionText = formData?.id ? "actualizar" : "crear";

    openAlert({
      type: "warning",
      title: `Confirmar ${actionText}`,
      message: `Se va a ${actionText} el permiso ${normalizedKey}.`,
      onConfirm: async () => {
        try {
          setIsSaving(true);

          const payload = {
            key: normalizedKey,
            name: normalizedName,
            description: normalizedDescription,
            active: normalizedActive,
          };

          if (formData?.id) {
            await api.put(`/admin/permissions/${formData.id}`, payload);
          } else {
            await api.post(`/admin/permissions`, payload);
          }

          await loadPermissions();
          setSelectedPermission(null);

          openAlert({
            type: "success",
            title: "Permiso guardado",
            message: "Cambios guardados correctamente.",
          });
        } catch (error) {
          openAlert({
            type: "error",
            title: "No se pudo guardar",
            message: error.response?.data?.message || "No se pudo guardar el permiso.",
          });
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const handleTogglePermission = async (permissionData) => {
    if (!permissionData?.id) return;

    const previousActive = Boolean(permissionData.active);
    const nextActive = !previousActive;

    // Optimistic update para respuesta visual inmediata.
    setPermissions((prev) =>
      prev.map((item) =>
        item.id === permissionData.id ? { ...item, active: nextActive } : item
      )
    );

    try {
      await api.put(`/admin/permissions/${permissionData.id}`, {
        key: permissionData.key,
        name: permissionData.name,
        description: permissionData.description,
        active: nextActive,
      });

      // openAlert({
      //   type: "success",
      //   title: nextActive ? "Permiso activado" : "Permiso desactivado",
      //   message: `El permiso ${permissionData.key} fue ${nextActive ? "activado" : "desactivado"}.`,
      // });
    } catch (error) {
      setPermissions((prev) =>
        prev.map((item) =>
          item.id === permissionData.id ? { ...item, active: previousActive } : item
        )
      );

      openAlert({
        type: "error",
        title: "No se pudo actualizar",
        message: error.response?.data?.message || "No se pudo cambiar el estado del permiso.",
      });
    }
  };

  const filteredPermissions = permissions.filter((permission) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(permission.name || "").toLowerCase().includes(searchLower) ||
      (permission.key && permission.key.toLowerCase().includes(searchLower))
    );
  });


  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.2s_ease-out]">
      <LoadingOverlay isVisible={loading || isSaving} />
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
            Gestión de Permisos
          </h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">
            Controla las capacidades disponibles y su estado operativo dentro del sistema.
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
            onClick={openNewPermissionModal}
          >
            <Plus size={18} /> Nuevo Permiso
          </Button>
        </div>
      </div>

      {/* Grid de Permisos */}
      {filteredPermissions.length === 0 ? (
        <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay permisos para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPermissions.map((permission) => {
            return (
              <PermissionCard
                key={permission.id}
                permission={permission}
                onOpenDetails={(permissionData) => setSelectedPermission({ ...permissionData })}
                onTogglePermission={handleTogglePermission}
              />
            );
          })}
        </div>
      )}

      {/* Renderizado Condicional del Modal */}
      {selectedPermission && (
        <PermissionDetailModal
          permissionData={selectedPermission}
          onClose={() => setSelectedPermission(null)}
          onSave={handleSavePermission}
          onDelete={requestDeletePermission}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function PermissionCard({ permission, onOpenDetails, onTogglePermission }) {
  return (
    <div
      key={permission.key}
      className={`group min-h-[180px] flex flex-col justify-between p-5 rounded-3xl border transition-all duration-200 z-0 shadow-sm
        ${
          permission.active
            ? "bg-[var(--secondary-color)]/5 border-[var(--secondary-color)]/25 hover:border-[var(--secondary-color)]/35"
            : "bg-[var(--white-color)]/5 border-[var(--white-color)]/5 hover:border-[var(--white-color)]/10 hover:bg-[var(--white-color)]/10"
        }`
      }
      onDoubleClick={() => onOpenDetails(permission)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="pr-4 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-sm font-bold transition-colors ${permission.active ? "text-[var(--ins-text-white)]" : "text-[var(--ins-text-gray)] group-hover:text-[var(--ins-text-white)]"}`}>
              {permission.name}
            </h4>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${permission.active ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-[var(--white-color)]/10 bg-white/5 text-[var(--ins-text-gray)]"}`}>
              {permission.active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <p className="text-[10px] font-mono mt-2 px-1.5 py-0.5 rounded bg-[var(--black-color)]/30 inline-block text-[var(--ins-text-gray)] break-all">
            {permission.key}
          </p>
          {permission.description && (
            <p className="text-xs text-[var(--ins-text-gray)] mt-3 leading-relaxed line-clamp-3 min-h-[54px]">
              {permission.description}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePermission(permission);
          }}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 z-10 mt-1 ${
            permission.active ? "bg-[var(--secondary-color)] shadow-[0_0_10px_var(--secondary-color)]" : "bg-[var(--black-color)]/50 "
          }`}
          type="button"
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-[var(--white-color)] transition-transform duration-300 shadow-sm ${
              permission.active ? "translate-x-6" : "translate-x-1 opacity-70"
            }`}
          />
        </button>
      </div>

      <div className="pt-4 mt-4 border-t border-[var(--white-color)]/5 flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--ins-text-dark)]">DOBLE CLICK PARA EDITAR</span>
        <span className="text-xs font-mono text-[var(--ins-text-gray)]">{permission.id}</span>
      </div>
    </div>
  );
}


function PermissionDetailModal({ permissionData, onClose, onSave, onDelete, isSaving }) {
  // Estado local para manejar los cambios antes de guardarlos
  const [formData, setFormData] = useState({
    id: permissionData?.id || null,
    key: permissionData?.key || "",
    name: permissionData?.name || "",
    description: permissionData?.description || "",
    active: Boolean(permissionData?.active),
  });

  useEffect(() => {
    setFormData({
      id: permissionData?.id || null,
      key: permissionData?.key || "",
      name: permissionData?.name || "",
      description: permissionData?.description || "",
      active: Boolean(permissionData?.active),
    });
  }, [permissionData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isNewPermission = !formData.id;

  return (
    <div className="fixed inset-0 bg-[var(--black-color)]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">

      {/* Contenedor del Modal */}
      <div className="bg-[var(--ins-background)] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header del modal */}
        <div className="px-8 py-6  flex items-center justify-between bg-[var(--black-color)]/10">
          <div>
            <h3 className="text-2xl font-extrabold text-[var(--ins-text-white)] flex items-center gap-3">
              {isNewPermission ? "Nuevo Permiso" : "Editar Permiso"}
              <span
                className="w-3 h-3 rounded-full"
              ></span>
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">
              {isNewPermission ? "Crea un nuevo permiso para el sistema" : `ID interno: #${formData.id}`}
            </p>
          </div>

          <CloseButton onClick={onClose} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
          <Input
            label="Clave del permiso"
            value={formData.key}
            onChange={(e) => handleChange("key", e.target.value)}
          />
          <Input
            label="Nombre"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 pt-0">
          <Select
            value={formData.active}
            onChange={(value) => handleChange("active", value)}
            className="w-full"
            options={[
              { value: true, label: "Activo" },
              { value: false, label: "Inactivo" }
            ]}
          />
          <div className="flex items-end text-xs text-[var(--ins-text-gray)] pb-3">
            Tip: doble click en una card para abrir este editor.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 p-8 pt-0">
          <Input
            label="Descripción"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 pt-0">
          {!isNewPermission && (
            <Button
              variant="cancel"
              size="md"
              onClick={() => onDelete(formData)}
              disabled={isSaving}
            >
              <Trash2 size={18} /> Eliminar
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() => onSave(formData)}
            disabled={isSaving}
          >
            <Save size={18} /> Guardar
          </Button>
        </div>

        {/* Cuerpo del formulario */}


      </div>
    </div>
  );
}

export default PermissionsManagerView;