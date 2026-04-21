import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Plus, Save, Search, Trash2, X } from "lucide-react";

import api from "../../api/axios";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import Textarea from "../../elements/Textarea";
import CloseButton from "../../elements/closeButton";
import AlertModal from "../../elements/AlertModal";
import LoadingOverlay from "../LoadingOverlay";

const ACTIVE_OPTIONS = [
  { value: "YES", label: "Activo" },
  { value: "NO", label: "Inactivo" },
];

const buildInitialForm = () => ({
  id: null,
  key: "",
  name: "",
  detail: "",
  color: "#8a8a8a",
  active: "YES",
  immutable: false,
});

function TicketCatalogManagerView() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("types");
  const [catalogs, setCatalogs] = useState({ types: [], priorities: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });

  const pendingActionRef = useRef(null);

  useEffect(() => {
    loadCatalogs();
  }, []);

  const openAlert = ({ type = "info", title = "Aviso", message = "", onConfirm = null }) => {
    pendingActionRef.current = onConfirm;
    setAlertConfig({ isOpen: true, type, title, message });
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

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/ticket-catalogs");
      setCatalogs({
        types: Array.isArray(data?.types) ? data.types : [],
        priorities: Array.isArray(data?.priorities) ? data.priorities : [],
      });
    } catch (error) {
      console.error("Error cargando catálogos de tickets:", error);
      setCatalogs({ types: [], priorities: [] });
      openAlert({
        type: "error",
        title: "No se pudieron cargar",
        message: error.response?.data?.message || "Error al cargar catálogos de tickets.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isTypesTab = activeTab === "types";
  const currentItems = isTypesTab ? catalogs.types : catalogs.priorities;

  const filteredItems = useMemo(() => {
    const search = String(searchTerm || "").trim().toLowerCase();
    if (!search) return currentItems;

    return currentItems.filter((item) => {
      const key = String(item?.key || "").toLowerCase();
      const name = String(item?.name || "").toLowerCase();
      const detail = String(item?.detail || "").toLowerCase();
      return key.includes(search) || name.includes(search) || detail.includes(search);
    });
  }, [currentItems, searchTerm]);

  const openCreateModal = () => setSelectedItem(buildInitialForm());

  const requestDelete = (item) => {
    const label = String(item?.name || item?.key || "registro");
    openAlert({
      type: "warning",
      title: "Eliminar registro",
      message: `Se eliminará ${label}. Esta acción no se puede deshacer.`,
      onConfirm: () => handleDelete(item),
    });
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;

    const base = isTypesTab ? "/admin/ticket-catalogs/types" : "/admin/ticket-catalogs/priorities";

    try {
      setIsSaving(true);
      await api.delete(`${base}/${item.id}`);
      await loadCatalogs();
      if (selectedItem?.id === item.id) setSelectedItem(null);
      openAlert({ type: "success", title: "Eliminado", message: "Se eliminó correctamente." });
    } catch (error) {
      console.error("Error eliminando catálogo:", error);
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar el registro.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (formData) => {
    const key = String(formData?.key || "").trim().toUpperCase().replace(/\s+/g, "_");
    const name = String(formData?.name || "").trim();
    const detail = String(formData?.detail || "").trim();

    if (!key || !name) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "Clave y nombre son obligatorios.",
      });
      return;
    }

    const base = isTypesTab ? "/admin/ticket-catalogs/types" : "/admin/ticket-catalogs/priorities";
    const payload = {
      key,
      name,
      detail,
      color: formData?.color || "#8a8a8a",
      active: formData?.active || "YES",
    };

    try {
      setIsSaving(true);
      if (formData?.id) {
        await api.put(`${base}/${formData.id}`, payload);
      } else {
        await api.post(base, payload);
      }
      await loadCatalogs();
      setSelectedItem(null);
      openAlert({ type: "success", title: "Guardado", message: "Se guardó correctamente." });
    } catch (error) {
      console.error("Error guardando catálogo:", error);
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar el registro.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">Catálogos de Tickets</h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">
            Administra tipos y prioridades disponibles para el centro de tickets.
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
            onClick={openCreateModal}
          >
            <Plus size={18} /> Nuevo
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            isTypesTab
              ? "bg-[var(--secondary-color)] text-white"
              : "bg-white/5 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)]"
          }`}
          onClick={() => {
            setActiveTab("types");
            setSelectedItem(null);
          }}
        >
          Tipos
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            !isTypesTab
              ? "bg-[var(--secondary-color)] text-white"
              : "bg-white/5 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)]"
          }`}
          onClick={() => {
            setActiveTab("priorities");
            setSelectedItem(null);
          }}
        >
          Prioridades
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay elementos para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              onOpenDetails={setSelectedItem}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <CatalogDetailModal
          item={selectedItem}
          title={isTypesTab ? "Tipo" : "Prioridad"}
          onClose={() => setSelectedItem(null)}
          onSave={handleSave}
          onDelete={requestDelete}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function CatalogCard({ item, onOpenDetails, onDelete }) {
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
      className="relative min-h-[200px] rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 p-6 flex flex-col justify-between shadow-sm hover:bg-[var(--black-color)]/25 hover:border-[var(--white-color)]/10 transition-all duration-200"
      onDoubleClick={() => onOpenDetails(item)}
    >
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex items-center gap-2 flex-wrap pr-3">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider"
            style={{
              color: item.color,
              borderColor: `${item.color}40`,
              backgroundColor: `${item.color}10`,
            }}
          >
            {item.key}
          </span>
          {item.immutable && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/25 bg-amber-500/10 text-amber-200">
              Protegido
            </span>
          )}
        </div>

        <button
          onClick={() => setOptionsOpen(!optionsOpen)}
          className="rounded-lg p-2 text-[var(--ins-text-dark)] hover:text-[var(--ins-text-white)] hover:bg-white/5 transition-colors"
        >
          <MoreVertical size={20} />
        </button>

        {optionsOpen && (
          <div className="absolute right-0 top-10 w-32 bg-[var(--ins-contextual-menu)] border border-[var(--white-color)]/10 rounded-xl shadow-xl z-10 overflow-hidden text-sm">
            <button
              onClick={() => {
                onOpenDetails(item);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/10 transition-colors"
            >
              Editar
            </button>
            {!item.immutable && (
              <button
                onClick={() => {
                  onDelete(item);
                  setOptionsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-[var(--ins-text-gray)]">
        <p className="font-bold text-base text-[var(--ins-text-white)]">{item.name}</p>
        <p>{item.detail || "Sin descripción"}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--white-color)]/10 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span className="text-[var(--ins-text-dark)]">Estado</span>
        <span className={item.active === "YES" ? "text-emerald-300" : "text-red-300"}>
          {item.active === "YES" ? "Activo" : "Inactivo"}
        </span>
      </div>
    </div>
  );
}

function CatalogDetailModal({ item, title, onClose, onSave, onDelete, isSaving }) {
  const [formData, setFormData] = useState(buildInitialForm());

  const normalizedColor = /^#[0-9A-Fa-f]{6}$/.test(String(formData.color || ""))
    ? String(formData.color)
    : "#8a8a8a";

  useEffect(() => {
    setFormData({
      ...buildInitialForm(),
      ...item,
    });
  }, [item]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canDelete = Boolean(formData.id) && !formData.immutable;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-3xl border border-[var(--white-color)]/10 bg-[var(--ins-background)] shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--white-color)]/10">
          <div>
            <h3 className="text-xl font-bold text-[var(--ins-text-white)]">
              {formData.id ? `Editar ${title}` : `Nuevo ${title}`}
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">
              Define clave, nombre, color y estado operativo.
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto tdt-scrollbar">
          <Input
            label="Clave"
            value={formData.key}
            onChange={(event) => updateField("key", event.target.value)}
            placeholder="EJ: SOPORTE"
            disabled={Boolean(formData.immutable)}
          />

          <Input
            label="Nombre"
            value={formData.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="EJ: Soporte"
            disabled={Boolean(formData.immutable)}
          />

          <div className="md:col-span-2">
            <Textarea
              label="Descripción"
              value={formData.detail || ""}
              onChange={(event) => {
                if (!formData.immutable) updateField("detail", event.target.value);
              }}
              placeholder="Descripción breve"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-left pl-1 text-[var(--ins-text-white)]">Color</label>
            <div className="flex items-center gap-3">
              <label className="relative h-[46px] w-14 rounded-xl border border-[var(--ins-text-gray)]/60 overflow-hidden cursor-pointer">
                <span className="absolute inset-0" style={{ backgroundColor: normalizedColor }} />
                <input
                  type="color"
                  value={normalizedColor}
                  onChange={(event) => updateField("color", event.target.value)}
                  disabled={Boolean(formData.immutable)}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </label>

              <input
                type="text"
                value={formData.color || ""}
                onChange={(event) => updateField("color", event.target.value.toUpperCase())}
                placeholder="#8A8A8A"
                disabled={Boolean(formData.immutable)}
                className="w-full px-4 py-3 outline-none transition text-[var(--white-color)] border-b border-[var(--ins-text-gray)] bg-transparent placeholder-[var(--white-color)]/40 focus:border-b-[var(--secondary-color)]"
              />
            </div>
          </div>

          <div>
            <span className="block text-[var(--ins-text-gray)] text-sm font-medium mb-1.5 ml-1">Estado</span>
            <Select
              value={formData.active || "YES"}
              onChange={(value) => updateField("active", value)}
              options={ACTIVE_OPTIONS}
              className="w-full"
              disabled={Boolean(formData.immutable)}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--white-color)]/10 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          <div>
            {canDelete && (
              <Button
                type="button"
                variant="danger"
                className="inline-flex items-center gap-2"
                onClick={() => onDelete(formData)}
                disabled={isSaving}
              >
                <Trash2 size={16} /> Eliminar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="inline-flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
              onClick={() => onSave(formData)}
              disabled={isSaving}
            >
              <Save size={16} /> Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketCatalogManagerView;
