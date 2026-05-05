import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Plus, Save, Search, Trash2, X } from "lucide-react";

import api from "../../../api/axios";
import Button from "../../../elements/Button";
import Input from "../../../elements/Input";
import Textarea from "../../../elements/Textarea";
import CloseButton from "../../../elements/closeButton";
import AlertModal from "../../../elements/AlertModal";
import LoadingOverlay from "../../shared/LoadingOverlay";

const buildInitialForm = () => ({
  id: null,
  name: "",
  description: "",
  color: "#f59e0b",
});

function NewsTypesManagerView() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [types, setTypes] = useState([]);
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
    loadTypes();
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

  const loadTypes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/news-types");
      setTypes(Array.isArray(data?.types) ? data.types : []);
    } catch (error) {
      setTypes([]);
      openAlert({
        type: "error",
        title: "No se pudieron cargar",
        message: error.response?.data?.message || "Error al cargar tipos de noticias.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const search = String(searchTerm || "").trim().toLowerCase();
    if (!search) return types;

    return types.filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      const description = String(item?.description || "").toLowerCase();
      return name.includes(search) || description.includes(search);
    });
  }, [types, searchTerm]);

  const openCreateModal = () => setSelectedItem(buildInitialForm());

  const requestDelete = (item) => {
    const label = String(item?.name || "registro");
    openAlert({
      type: "warning",
      title: "Eliminar tipo",
      message: `Se eliminará ${label}. Esta acción no se puede deshacer.`,
      onConfirm: () => handleDelete(item),
    });
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;

    try {
      setIsSaving(true);
      await api.delete(`/admin/news-types/${item.id}`);
      await loadTypes();
      if (selectedItem?.id === item.id) setSelectedItem(null);
      openAlert({ type: "success", title: "Eliminado", message: "Se eliminó correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar el tipo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (formData) => {
    const name = String(formData?.name || "").trim().toUpperCase();
    const description = String(formData?.description || "").trim();

    if (!name) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "El nombre es obligatorio.",
      });
      return;
    }

    const payload = {
      name,
      description,
      color: formData?.color || "#f59e0b",
    };

    try {
      setIsSaving(true);
      if (formData?.id) {
        await api.put(`/admin/news-types/${formData.id}`, payload);
      } else {
        await api.post("/admin/news-types", payload);
      }
      await loadTypes();
      setSelectedItem(null);
      openAlert({ type: "success", title: "Guardado", message: "Se guardó correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar el tipo.",
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
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">Tipos de Noticias</h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">
            Administra los tipos disponibles para crear noticias en el sistema.
          </p>
        </div>

        <div className="flex flex-col items-start self-start md:self-end sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:w-auto">
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
            className="flex items-center gap-2 self-start shrink-0 whitespace-nowrap bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
            onClick={openCreateModal}
          >
            <Plus size={18} /> Nuevo
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay tipos de noticia para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <NewsTypeCard
              key={item.id}
              item={item}
              onOpenDetails={setSelectedItem}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <NewsTypeDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleSave}
          onDelete={requestDelete}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function NewsTypeCard({ item, onOpenDetails, onDelete }) {
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
      className="relative min-h-[190px] rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 p-6 flex flex-col justify-between shadow-sm hover:bg-[var(--black-color)]/25 hover:border-[var(--white-color)]/10 transition-all duration-200"
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
            {item.name}
          </span>
        </div>

        <button
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ins-text-dark)] hover:bg-white/10 hover:text-white transition-colors"
          onClick={() => setOptionsOpen((prev) => !prev)}
        >
          <MoreVertical size={16} />
        </button>

        {optionsOpen && (
          <div className="absolute right-0 top-10 w-36 rounded-xl border border-white/10 bg-[var(--ins-background)] shadow-lg overflow-hidden z-20">
            <button
              type="button"
              onClick={() => {
                setOptionsOpen(false);
                onOpenDetails(item);
              }}
              className="w-full px-3 py-2 text-left text-sm text-[var(--ins-text-white)] hover:bg-white/10 transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => {
                setOptionsOpen(false);
                onDelete(item);
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 transition-colors"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-extrabold text-[var(--ins-text-white)] leading-tight mb-1">{item.name}</h3>
        <p className="text-sm text-[var(--ins-text-gray)] line-clamp-3">{item.description || "Sin descripción"}</p>
      </div>
    </div>
  );
}

function NewsTypeDetailModal({ item, onClose, onSave, onDelete, isSaving }) {
  const [form, setForm] = useState(() => ({ ...buildInitialForm(), ...item }));

  useEffect(() => {
    setForm({ ...buildInitialForm(), ...item });
  }, [item]);

  const patchForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--ins-background)]/50 backdrop-blur-lg shadow-2xl p-6 max-h-[80dvh] overflow-hidden flex flex-col border border-white/10">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-extrabold text-[var(--ins-text-white)]">
            {form.id ? "Editar tipo" : "Nuevo tipo"}
          </h3>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto tdt-scrollbar pr-1">
          <div className="space-y-4">
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => patchForm("name", e.target.value.toUpperCase())}
              placeholder="NOTICIA"
            />

            <Textarea
              label="Descripción"
              value={form.description}
              onChange={(e) => patchForm("description", e.target.value)}
              placeholder="Describe el propósito de este tipo"
              rows={3}
            />

            <div>
              <span className="block text-sm text-[var(--ins-text-gray)] mb-1 ml-1">Color</span>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => patchForm("color", e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => patchForm("color", e.target.value)}
                  className="flex-1 text-sm rounded-xl bg-white/5 border border-white/10 text-[var(--ins-text-white)] px-3 py-2 font-mono focus:outline-none focus:border-[var(--secondary-color)] transition-colors"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 flex-shrink-0">
          {form.id ? (
            <Button
              type="button"
              variant="cancel"
              className="flex items-center gap-2"
              onClick={() => onDelete(form)}
              disabled={isSaving}
            >
              <Trash2 size={16} /> Eliminar
            </Button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
            <Button
              type="button"
              variant="primary"
              className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-2"
              onClick={() => onSave(form)}
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

export default NewsTypesManagerView;
