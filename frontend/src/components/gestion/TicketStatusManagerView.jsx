import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Plus, Save, Search, Trash2 } from "lucide-react";

import api from "../../api/axios";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Textarea from "../../elements/Textarea";
import Select from "../../elements/Select";
import CloseButton from "../../elements/closeButton";
import AlertModal from "../../elements/AlertModal";
import LoadingOverlay from "../LoadingOverlay";

const ACTIVE_OPTIONS = [
  { value: "YES", label: "Activo" },
  { value: "NO", label: "Inactivo" },
];

const buildInitialForm = () => ({
  id:        null,
  key:       "",
  name:      "",
  detail:    "",
  color:     "#8a8a8a",
  active:    "YES",
  immutable: false,
});

function TicketStatusManagerView() {
  const [loading,      setLoading]      = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [statuses,     setStatuses]     = useState([]);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [alertConfig,  setAlertConfig]  = useState({
    isOpen: false, type: "info", title: "Aviso", message: "",
  });

  const pendingActionRef = useRef(null);

  useEffect(() => { loadStatuses(); }, []);

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
    if (typeof action === "function") await action();
  };

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/ticket-statuses");
      setStatuses(Array.isArray(data?.statuses) ? data.statuses : []);
    } catch (error) {
      openAlert({
        type: "error", title: "Error al cargar",
        message: error.response?.data?.message || "No se pudieron cargar los estatus.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return statuses;
    return statuses.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.key?.toLowerCase().includes(q)
    );
  }, [statuses, searchTerm]);

  const [form, setForm] = useState(buildInitialForm());

  const patchForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const startNew = () => {
    setSelectedItem(null);
    setForm(buildInitialForm());
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    setForm({
      id:        item.id,
      key:       item.key       || "",
      name:      item.name      || "",
      detail:    item.detail    || "",
      color:     item.color     || "#8a8a8a",
      active:    item.active    ? "YES" : "NO",
      immutable: Boolean(item.immutable),
    });
  };

  const handleSave = async () => {
    const key    = form.key.trim().toUpperCase().replace(/\s+/g, "_");
    const name   = form.name.trim();
    const detail = form.detail.trim();

    if (!key || !name) {
      openAlert({ type: "warning", title: "Campos requeridos", message: "La clave y el nombre son obligatorios." });
      return;
    }

    const payload = { key, name, detail, color: form.color, active: form.active === "YES" };

    try {
      setIsSaving(true);
      if (form.id) {
        await api.put(`/admin/ticket-statuses/${form.id}`, payload);
        setStatuses((prev) => prev.map((s) => s.id === form.id ? { ...s, ...payload } : s));
        openAlert({ type: "success", title: "Actualizado", message: `Estatus "${name}" actualizado.` });
      } else {
        const { data } = await api.post("/admin/ticket-statuses", payload);
        setStatuses((prev) => [...prev, data.status]);
        openAlert({ type: "success", title: "Creado", message: `Estatus "${name}" creado.` });
        startNew();
      }
    } catch (error) {
      openAlert({
        type: "error", title: "Error al guardar",
        message: error.response?.data?.message || "No se pudo guardar el estatus.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (item) => {
    if (item.immutable) {
      openAlert({ type: "warning", title: "No permitido", message: "Este estatus es inmutable y no puede eliminarse." });
      return;
    }
    openAlert({
      type: "danger", title: "Eliminar estatus",
      message: `¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await api.delete(`/admin/ticket-statuses/${item.id}`);
          setStatuses((prev) => prev.filter((s) => s.id !== item.id));
          if (selectedItem?.id === item.id) startNew();
        } catch (error) {
          openAlert({
            type: "error", title: "Error al eliminar",
            message: error.response?.data?.message || "No se pudo eliminar el estatus.",
          });
        }
      },
    });
  };

  return (
    <div className="relative space-y-4">
      {loading  && <LoadingOverlay />}
      {isSaving && <LoadingOverlay message="Guardando..." />}

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        onConfirm={handleAlertConfirm}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-xl font-bold text-[var(--ins-text-white)]">Estatus de Tickets</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-[var(--ins-text-white)] placeholder-[var(--ins-text-dark)] focus:outline-none focus:border-[var(--secondary-color)] transition-colors w-44"
            />
          </div>
          <Button variant="primary" className="flex items-center gap-2 text-sm bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white" onClick={startNew}>
            <Plus size={14} /> Nuevo estatus
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Lista */}
        <div className="xl:col-span-3 bg-black/10 rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[var(--ins-text-gray)] text-xs uppercase tracking-widest">
                  <th className="text-left px-4 py-3">Clave</th>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Color</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-[var(--ins-text-gray)] py-8">Sin estatus.</td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-white/5 transition-colors cursor-pointer ${selectedItem?.id === item.id ? "bg-white/10" : "hover:bg-white/5"}`}
                    onClick={() => selectItem(item)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--ins-text-gray)]">{item.key}</td>
                    <td className="px-4 py-3 font-medium text-[var(--ins-text-white)]">
                      {item.name}
                      {item.immutable && <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-[var(--ins-text-dark)]">FIJO</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-[var(--ins-text-gray)] font-mono">{item.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${item.active ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-[var(--ins-text-dark)]"}`}>
                        {item.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                          className="p-1.5 rounded-lg text-[var(--ins-text-dark)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <MoreVertical size={14} className="text-[var(--ins-text-dark)]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formulario */}
        <div className="xl:col-span-2 bg-black/10 rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[var(--ins-text-white)] text-sm">
              {form.id ? "Editar estatus" : "Nuevo estatus"}
            </h3>
            {form.id && <CloseButton onClick={startNew} />}
          </div>

          {form.immutable && (
            <p className="text-xs text-amber-300 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              Este estatus es inmutable. Solo puedes cambiar la descripción y el estado activo.
            </p>
          )}

          <Input
            label="Clave"
            value={form.key}
            onChange={(e) => patchForm("key", e.target.value.toUpperCase().replace(/\s+/g, "_"))}
            placeholder="ABIERTO"
            disabled={Boolean(form.immutable || form.id)}
          />
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => patchForm("name", e.target.value)}
            placeholder="Abierto"
            disabled={Boolean(form.immutable)}
          />
          <Textarea
            label="Descripción"
            value={form.detail}
            onChange={(e) => patchForm("detail", e.target.value)}
            placeholder="Descripción del estatus..."
            rows={3}
          />

          {/* Color */}
          <div>
            <span className="block text-sm text-[var(--ins-text-gray)] mb-1 ml-1">Color</span>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={(e) => patchForm("color", e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5" disabled={Boolean(form.immutable)} />
              <input type="text" value={form.color} onChange={(e) => patchForm("color", e.target.value)} className="flex-1 text-sm rounded-xl bg-white/5 border border-white/10 text-[var(--ins-text-white)] px-3 py-2 font-mono focus:outline-none focus:border-[var(--secondary-color)] transition-colors" maxLength={7} disabled={Boolean(form.immutable)} />
            </div>
          </div>

          <div className="text-sm">
            <span className="block text-[var(--ins-text-gray)] mb-1 ml-1">Estado</span>
            <Select value={form.active} onChange={(v) => patchForm("active", v)} options={ACTIVE_OPTIONS} className="w-full" />
          </div>

          <Button
            type="button"
            variant="primary"
            className="w-full flex items-center justify-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={15} /> {form.id ? "Guardar cambios" : "Crear estatus"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TicketStatusManagerView;
