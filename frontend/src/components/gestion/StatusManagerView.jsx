import {
  Search,
  Plus,
  MoreVertical,
  Save,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import CloseButton from "../../elements/closeButton";
import AlertModal from "../../elements/AlertModal";
import LoadingOverlay from "../LoadingOverlay";
import api from "../../api/axios";

function StatusManagerView() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });
  const pendingActionRef = useRef(null);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/statuses");
      setStatuses(data || []);
    } catch (error) {
      console.error("Error cargando estatus:", error);
      setStatuses([]);
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

  const openNewStatusModal = () => {
    setSelectedStatus({
      id: null,
      status: "",
      detail: "",
      color: "#8a8a8a",
      asignable: "YES",
      active: "YES",
      users: 0,
    });
  };

  const requestDeleteStatus = (statusData) => {
    openAlert({
      type: "warning",
      title: "Eliminar estatus",
      message: `Se eliminará el estatus ${statusData?.status || ""}. Esta acción no se puede deshacer.`,
      onConfirm: () => handleDeleteStatus(statusData),
    });
  };

  const handleDeleteStatus = async (statusData) => {
    if (!statusData?.id) return;

    try {
      setIsSaving(true);
      await api.delete(`/admin/statuses/${statusData.id}`);
      await loadStatuses();
      if (selectedStatus?.id === statusData.id) {
        setSelectedStatus(null);
      }
      openAlert({
        type: "success",
        title: "Estatus eliminado",
        message: "El estatus se eliminó correctamente.",
      });
    } catch (error) {
      console.error("Error eliminando estatus:", error);
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar el estatus.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStatus = async (formData) => {
    const normalizedStatus = String(formData?.status || "").trim().toUpperCase();
    const normalizedDetail = String(formData?.detail || "").trim();

    if (!normalizedStatus || !normalizedDetail) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "Status y descripción son obligatorios.",
      });
      return;
    }

    const payload = {
      status: normalizedStatus,
      detail: normalizedDetail,
      color: formData?.color || "#8a8a8a",
      asignable: formData?.asignable || "YES",
      active: formData?.active || "YES",
    };

    const actionText = formData?.id ? "actualizar" : "crear";

    openAlert({
      type: "warning",
      title: `Confirmar ${actionText}`,
      message: `Se va a ${actionText} el estatus ${normalizedStatus}.`,
      onConfirm: async () => {
        try {
          setIsSaving(true);

          if (formData?.id) {
            await api.put(`/admin/statuses/${formData.id}`, payload);
          } else {
            await api.post(`/admin/statuses`, payload);
          }

          await loadStatuses();
          setSelectedStatus(null);

          openAlert({
            type: "success",
            title: "Estatus guardado",
            message: "Se ha guardado correctamente.",
          });
        } catch (error) {
          console.error("Error guardando estatus:", error);
          openAlert({
            type: "error",
            title: "No se pudo guardar",
            message: error.response?.data?.message || "No se pudo guardar el estatus.",
          });
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const filteredStatuses = statuses.filter((statusItem) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      statusItem.status.toLowerCase().includes(searchLower) ||
      (statusItem.detail && statusItem.detail.toLowerCase().includes(searchLower))
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">
            Catálogo de Estatus
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
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
            onClick={openNewStatusModal}
          >
            <Plus size={18} /> Nuevo Estatus
          </Button>
        </div>
      </div>

      {filteredStatuses.length === 0 ? (
        <div className="rounded-2xl bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay estatus para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStatuses.map((statusItem) => (
            <StatusCard
              key={statusItem.id}
              statusItem={statusItem}
              onOpenDetails={setSelectedStatus}
              onDeleteStatus={requestDeleteStatus}
            />
          ))}
        </div>
      )}

      {selectedStatus && (
        <StatusDetailModal
          statusData={selectedStatus}
          onClose={() => setSelectedStatus(null)}
          onSave={handleSaveStatus}
          onDelete={requestDeleteStatus}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function StatusCard({ statusItem, onOpenDetails, onDeleteStatus }) {
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
      className="relative bg-[var(--ins-background)] rounded-2xl p-6 flex flex-col justify-between hover:bg-[var(--black-color)]/20 transition-colors"
      onDoubleClick={() => onOpenDetails(statusItem)}
    >
      <div className="flex justify-between items-start mb-4 relative">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold border"
          style={{
            color: statusItem.color,
            borderColor: `${statusItem.color}40`,
            backgroundColor: `${statusItem.color}10`,
          }}
        >
          {statusItem.status}
        </span>

        <button
          onClick={() => setOptionsOpen(!optionsOpen)}
          className="text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)] transition-colors p-1"
        >
          <MoreVertical size={20} />
        </button>

        {optionsOpen && (
          <div className="absolute right-0 top-8 w-32 bg-[var(--gray-dark-color)] rounded-xl shadow-xl z-10 overflow-hidden text-sm">
            <button
              onClick={() => {
                onOpenDetails(statusItem);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/10 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => {
                onDeleteStatus(statusItem);
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
        {statusItem.detail}
      </p>

      <div className="flex gap-6 pt-4 mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-wider text-[var(--ins-text-dark)] mb-1">USUARIOS</span>
          <span className="text-[var(--ins-text-white)] font-bold text-lg">{statusItem.users}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-wider text-[var(--ins-text-dark)] mb-1">ASIGNABLE</span>
          <span className="text-[var(--ins-text-white)] font-bold text-lg">{statusItem.asignable}</span>
        </div>
      </div>
    </div>
  );
}

function StatusDetailModal({ statusData, onClose, onSave, onDelete, isSaving }) {
  const [formData, setFormData] = useState({
    id: statusData?.id || null,
    status: statusData?.status || "",
    detail: statusData?.detail || "",
    color: statusData?.color || "#8a8a8a",
    asignable: statusData?.asignable || "YES",
    active: statusData?.active || "YES",
  });

  useEffect(() => {
    setFormData({
      id: statusData?.id || null,
      status: statusData?.status || "",
      detail: statusData?.detail || "",
      color: statusData?.color || "#8a8a8a",
      asignable: statusData?.asignable || "YES",
      active: statusData?.active || "YES",
    });
  }, [statusData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isNewStatus = !formData.id;

  return (
    <div className="fixed inset-0 bg-[var(--black-color)]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[var(--ins-background)] rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 flex items-center justify-between bg-[var(--black-color)]/10">
          <div>
            <h3 className="text-2xl font-extrabold text-[var(--ins-text-white)] flex items-center gap-3">
              {isNewStatus ? "Nuevo Estatus" : "Editar Estatus"}
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: formData.color, boxShadow: `0 0 10px ${formData.color}80` }}
              ></span>
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">
              {isNewStatus ? "Crea un nuevo estatus para el sistema" : `ID interno: #${formData.id}`}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex flex-col gap-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre del Estatus"
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value.toUpperCase())}
              placeholder="Ej. ACTIVE"
            />

            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  label="Color Hexadecimal"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  placeholder="#8a8a8a"
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
            label="Descripción"
            value={formData.detail}
            onChange={(e) => handleChange("detail", e.target.value)}
            placeholder="Describe este estatus..."
            context="dark"
          />

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
              />
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
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-[var(--black-color)]/20 flex items-center justify-between gap-4 bg-[var(--black-color)]/10">
          <div>
            {!isNewStatus && (
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
            <Button
              variant="primary"
              className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2"
              onClick={() => onSave(formData)}
              disabled={isSaving}
            >
              <Save size={18} />
              {isNewStatus ? "Crear Estatus" : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatusManagerView;
