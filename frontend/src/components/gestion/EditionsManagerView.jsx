import {
  Search,
  Plus,
  MoreVertical,
  Save,
  Trash2,
  Play,
  Square,
  CalendarRange,
  Users,
  BookOpen,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import CloseButton from "../../elements/closeButton";
import AlertModal from "../../elements/AlertModal";
import LoadingOverlay from "../LoadingOverlay";
import api from "../../api/axios";
import EditionDatesManagerView from "./EditionDatesManagerView";
import EditionRulesManagerView from "./EditionRulesManagerView";

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toDisplayDate = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" });
};

function EditionsManagerView() {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
  });
  const pendingActionRef = useRef(null);

  useEffect(() => {
    loadEditions();
  }, []);

  const loadEditions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/editions");
      setEditions(data || []);
    } catch (error) {
      console.error("Error cargando ediciones:", error);
      setEditions([]);
    } finally {
      setLoading(false);
    }
  };

  const openAlert = ({
    type = "info",
    title = "Aviso",
    message = "",
    onConfirm = null,
    confirmText = "Aceptar",
    cancelText = "Cancelar",
  }) => {
    pendingActionRef.current = onConfirm;
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
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

  const openNewEditionModal = () => {
    setSelectedEdition({
      id: null,
      name: "",
      number: "",
      color: "#1f2937",
      status: "INACTIVE",
      date_start: toInputDate(new Date()),
      date_end: "",
      description: "",
      users: 0,
    });
  };

  const requestDeleteEdition = (editionData) => {
    openAlert({
      type: "warning",
      title: "Eliminar edición",
      message: `Se eliminará la edición ${editionData?.name || ""}. Esta acción no se puede deshacer.`,
      onConfirm: () => handleDeleteEdition(editionData),
      confirmText: "Eliminar",
      cancelText: "Conservar",
    });
  };

  const handleDeleteEdition = async (editionData) => {
    if (!editionData?.id) return;

    try {
      setIsSaving(true);
      await api.delete(`/admin/editions/${editionData.id}`);
      await loadEditions();
      if (selectedEdition?.id === editionData.id) {
        setSelectedEdition(null);
      }
      openAlert({
        type: "success",
        title: "Edición eliminada",
        message: "La edición se eliminó correctamente.",
      });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar la edición.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const requestOpenEdition = (editionData) => {
    openAlert({
      type: "warning",
      title: "Aperturar edición",
      message: `Se abrirá la edición ${editionData?.name || ""} y se cerrará cualquier otra edición activa.`,
      onConfirm: () => handleOpenEdition(editionData),
      confirmText: "Aperturar",
      cancelText: "Cancelar",
    });
  };

  const handleOpenEdition = async (editionData) => {
    if (!editionData?.id) return;

    try {
      setIsSaving(true);
      await api.patch(`/admin/editions/${editionData.id}/open`);
      await loadEditions();
      openAlert({
        type: "success",
        title: "Edición activa",
        message: "La edición fue aperturada correctamente.",
      });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo aperturar",
        message: error.response?.data?.message || "No se pudo aperturar la edición.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const requestCloseEdition = (editionData) => {
    openAlert({
      type: "warning",
      title: "Cerrar edición",
      message: `Se cerrará la edición ${editionData?.name || ""}.`,
      onConfirm: () => handleCloseEdition(editionData),
      confirmText: "Cerrar",
      cancelText: "Cancelar",
    });
  };

  const handleCloseEdition = async (editionData) => {
    if (!editionData?.id) return;

    try {
      setIsSaving(true);
      await api.patch(`/admin/editions/${editionData.id}/close`);
      await loadEditions();
      openAlert({
        type: "success",
        title: "Edición cerrada",
        message: "La edición se cerró correctamente.",
      });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo cerrar",
        message: error.response?.data?.message || "No se pudo cerrar la edición.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdition = async (formData) => {
    const normalizedName = String(formData?.name || "").trim();
    const normalizedNumber = String(formData?.number || "").trim();
    const normalizedDescription = String(formData?.description || "").trim();

    if (!normalizedName || !normalizedNumber || !formData?.date_start) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "Nombre, número y fecha de inicio son obligatorios.",
      });
      return;
    }

    if (formData.date_end && formData.date_end < formData.date_start) {
      openAlert({
        type: "warning",
        title: "Rango inválido",
        message: "La fecha de cierre no puede ser menor a la fecha de inicio.",
      });
      return;
    }

    const payload = {
      name: normalizedName,
      number: normalizedNumber,
      color: formData?.color || "#1f2937",
      status: formData?.status || "INACTIVE",
      date_start: formData?.date_start,
      date_end: formData?.date_end || null,
      description: normalizedDescription,
    };

    const actionText = formData?.id ? "actualizar" : "crear";

    openAlert({
      type: "warning",
      title: `Confirmar ${actionText}`,
      message: `Se va a ${actionText} la edición ${normalizedName}.`,
      onConfirm: async () => {
        try {
          setIsSaving(true);

          if (formData?.id) {
            await api.put(`/admin/editions/${formData.id}`, payload);
          } else {
            await api.post("/admin/editions", payload);
          }

          await loadEditions();
          setSelectedEdition(null);

          openAlert({
            type: "success",
            title: "Edición guardada",
            message: "Los cambios se guardaron correctamente.",
          });
        } catch (error) {
          openAlert({
            type: "error",
            title: "No se pudo guardar",
            message: error.response?.data?.message || "No se pudo guardar la edición.",
          });
        } finally {
          setIsSaving(false);
        }
      },
    });
  };

  const filteredEditions = editions.filter((edition) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      edition.name.toLowerCase().includes(searchLower) ||
      String(edition.number || "").toLowerCase().includes(searchLower) ||
      (edition.description && edition.description.toLowerCase().includes(searchLower))
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
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onClose={closeAlert}
        onConfirm={handleAlertConfirm}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">
            Control de Ediciones
          </h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">
            Administra ciclos del proyecto para separar estadísticas y operación por cada edición.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative">
            <Input
              placeholder="Buscar edición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ins-text-white)]/50 pointer-events-none" size={20} />
          </div>
          <Button
            variant="primary"
            size="md"
            className="flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
            onClick={openNewEditionModal}
          >
            <Plus size={18} /> Nueva Edición
          </Button>
        </div>
      </div>

      {filteredEditions.length === 0 ? (
        <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay ediciones para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredEditions.map((edition) => (
            <EditionCard
              key={edition.id}
              edition={edition}
              onOpenDetails={setSelectedEdition}
              onDeleteEdition={requestDeleteEdition}
              onOpenEdition={requestOpenEdition}
              onCloseEdition={requestCloseEdition}
            />
          ))}
        </div>
      )}

      {selectedEdition && (
        <EditionDetailModal
          editionData={selectedEdition}
          onClose={() => setSelectedEdition(null)}
          onSave={handleSaveEdition}
          onDelete={requestDeleteEdition}
          onOpenEdition={requestOpenEdition}
          onCloseEdition={requestCloseEdition}
          openAlert={openAlert}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function EditionCard({ edition, onOpenDetails, onDeleteEdition, onOpenEdition, onCloseEdition }) {
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

  const isActive = String(edition.status).toUpperCase() === "ACTIVE";

  return (
    <div
      ref={cardRef}
      className="relative min-h-[240px] rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 p-6 flex flex-col justify-between shadow-sm hover:bg-[var(--black-color)]/25 hover:border-[var(--white-color)]/10 transition-all duration-200"
      onDoubleClick={() => onOpenDetails(edition)}
    >
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex items-center gap-2 flex-wrap pr-3">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider"
            style={{
              color: edition.color,
              borderColor: `${edition.color}40`,
              backgroundColor: `${edition.color}10`,
            }}
          >
            EDICIÓN {edition.number}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
              isActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-[var(--white-color)]/15 bg-[var(--black-color)]/20 text-[var(--ins-text-gray)]"
            }`}
          >
            {edition.status}
          </span>
        </div>

        <button
          onClick={() => setOptionsOpen(!optionsOpen)}
          className="rounded-lg p-2 text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)] hover:bg-white/5 transition-colors"
        >
          <MoreVertical size={20} />
        </button>

        {optionsOpen && (
          <div className="absolute right-0 top-10 w-40 bg-[var(--ins-contextual-menu)] border border-[var(--white-color)]/10 rounded-xl shadow-xl z-10 overflow-hidden text-sm">
            <button
              onClick={() => {
                onOpenDetails(edition);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/10 transition-colors"
            >
              Editar
            </button>

            {isActive ? (
              <button
                onClick={() => {
                  onCloseEdition(edition);
                  setOptionsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-amber-200 hover:bg-amber-500/10 transition-colors"
              >
                Cerrar edición
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenEdition(edition);
                  setOptionsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              >
                Aperturar edición
              </button>
            )}

            <button
              onClick={() => {
                onDeleteEdition(edition);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[var(--cancel-color)] hover:bg-[var(--cancel-color)]/10 transition-colors"
            >
              Borrar
            </button>
          </div>
        )}
      </div>

      <h3 className="text-xl font-extrabold text-[var(--ins-text-white)] leading-tight mb-2">{edition.name}</h3>
      <p className="text-sm text-[var(--ins-text-gray)] mb-6 line-clamp-3 min-h-[62px] leading-relaxed">
        {edition.description || "Sin descripción registrada."}
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4 mt-auto border-t border-[var(--white-color)]/5">
        <div className="rounded-2xl bg-black/20 px-4 py-3">
          <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--ins-text-dark)] mb-1 block">PERIODO</span>
          <span className="text-[var(--ins-text-white)] font-bold text-xs">
            {toDisplayDate(edition.date_start)} - {toDisplayDate(edition.date_end)}
          </span>
        </div>
        <div className="rounded-2xl bg-black/20 px-4 py-3">
          <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--ins-text-dark)] mb-1 block">USUARIOS</span>
          <span className="text-[var(--ins-text-white)] font-bold text-lg">{edition.users || 0}</span>
        </div>
      </div>
    </div>
  );
}

function EditionDetailModal({
  editionData,
  onClose,
  onSave,
  onDelete,
  onOpenEdition,
  onCloseEdition,
  openAlert,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    id: editionData?.id || null,
    name: editionData?.name || "",
    number: editionData?.number || "",
    color: editionData?.color || "#1f2937",
    status: editionData?.status || "INACTIVE",
    date_start: toInputDate(editionData?.date_start),
    date_end: toInputDate(editionData?.date_end),
    description: editionData?.description || "",
  });
  const [activeTab, setActiveTab] = useState("dates");

  useEffect(() => {
    setFormData({
      id: editionData?.id || null,
      name: editionData?.name || "",
      number: editionData?.number || "",
      color: editionData?.color || "#1f2937",
      status: editionData?.status || "INACTIVE",
      date_start: toInputDate(editionData?.date_start),
      date_end: toInputDate(editionData?.date_end),
      description: editionData?.description || "",
    });
    setActiveTab("dates");
  }, [editionData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isNewEdition = !formData.id;
  const isActive = String(formData.status).toUpperCase() === "ACTIVE";

  return (
    <div className="fixed inset-0 bg-[var(--black-color)]/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[var(--ins-background)] rounded-[2rem] w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-8 py-6 flex items-center justify-between bg-[var(--black-color)]/10">
          <div>
            <h3 className="text-2xl font-extrabold text-[var(--ins-text-white)] flex items-center gap-3">
              {isNewEdition ? "Nueva Edición" : "Editar Edición"}
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: formData.color, boxShadow: `0 0 10px ${formData.color}80` }}
              ></span>
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">
              {isNewEdition ? "Define una edición del proyecto para separar estadísticas" : `ID interno: #${formData.id}`}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="p-8 overflow-y-auto tdt-scrollbar flex flex-col gap-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Input
              label="Nombre de la Edición"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ej. Tierra de Todos 4"
            />

            <Input
              label="Número de Edición"
              value={formData.number}
              onChange={(e) => handleChange("number", e.target.value)}
              placeholder="Ej. 4"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  label="Color"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  placeholder="#1f2937"
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1">Estado</label>
              <Select
                value={formData.status}
                onChange={(val) => handleChange("status", val)}
                className="w-full"
                options={[
                  { value: "ACTIVE", label: "ACTIVA" },
                  { value: "INACTIVE", label: "INACTIVA" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Input
              label="Fecha de Inicio"
              type="date"
              value={formData.date_start}
              onChange={(e) => handleChange("date_start", e.target.value)}
            />

            <Input
              label="Fecha de Cierre"
              type="date"
              value={formData.date_end}
              onChange={(e) => handleChange("date_end", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe el objetivo y alcance de esta edición..."
              rows={4}
              className="w-full px-4 py-3 outline-none transition border-b border-[var(--ins-text-gray)] text-[var(--white-color)] bg-transparent focus:border-b-[var(--secondary-color)] resize-none"
            />
          </div>

          {!isNewEdition && (
            <>
              <div className="rounded-2xl border border-[var(--white-color)]/10 bg-black/20 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-[var(--ins-text-gray)]">
                  <CalendarRange size={16} />
                  <span>
                    {toDisplayDate(formData.date_start)} - {toDisplayDate(formData.date_end)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--ins-text-gray)]">
                  <Users size={16} />
                  <span>Usuarios asociados: {editionData?.users || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-start gap-4 relative z-10">
                <div className="hidden md:flex justify-center pt-1">
                  <div className="inline-flex p-1 space-x-1 bg-[var(--black-color)]/40 rounded-xl">
                    <button
                      onClick={() => setActiveTab("dates")}
                      className={`px-3 lg:px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                        activeTab === "dates"
                          ? "bg-[var(--white-color)]/10 text-[var(--ins-text-white)] shadow-sm"
                          : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/5"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CalendarRange size={16} className={activeTab === "dates" ? "text-[var(--secondary-color)]" : ""} />
                        <span className="hidden lg:inline">Fechas</span>
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab("rules")}
                      className={`px-3 lg:px-5 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                        activeTab === "rules"
                          ? "bg-[var(--white-color)]/10 text-[var(--ins-text-white)] shadow-sm"
                          : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/5"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <BookOpen size={16} className={activeTab === "rules" ? "text-[var(--streammer-color)]" : ""} />
                        <span className="hidden lg:inline">Reglas</span>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="md:hidden inline-flex p-1 space-x-1 bg-[var(--black-color)]/40 rounded-xl justify-start w-fit">
                  <button
                    onClick={() => setActiveTab("dates")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      activeTab === "dates"
                        ? "bg-[var(--white-color)]/10 text-[var(--ins-text-white)] shadow-sm"
                        : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/5"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2"><CalendarRange size={16} /> Fechas</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("rules")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                      activeTab === "rules"
                        ? "bg-[var(--white-color)]/10 text-[var(--ins-text-white)] shadow-sm"
                        : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/5"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2"><BookOpen size={16} /> Reglas</span>
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--white-color)]/10 bg-[var(--black-color)]/15 p-6">
                {activeTab === "dates" ? (
                  <EditionDatesManagerView editionId={formData.id} openAlert={openAlert} />
                ) : (
                  <EditionRulesManagerView editionId={formData.id} openAlert={openAlert} />
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-8 py-6 border-t border-[var(--black-color)]/20 flex items-center justify-between gap-4 bg-[var(--black-color)]/10">
          <div className="flex items-center gap-3">
            {!isNewEdition && (
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

            {!isNewEdition && (isActive ? (
              <Button
                variant="primary"
                className="bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2"
                onClick={() => onCloseEdition(formData)}
                disabled={isSaving}
              >
                <Square size={16} />
                Cerrar
              </Button>
            ) : (
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
                onClick={() => onOpenEdition(formData)}
                disabled={isSaving}
              >
                <Play size={16} />
                Aperturar
              </Button>
            ))}
          </div>

          <Button
            variant="primary"
            className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2"
            onClick={() => onSave(formData)}
            disabled={isSaving}
          >
            <Save size={18} />
            {isNewEdition ? "Crear Edición" : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditionsManagerView;
