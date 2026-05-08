import { useEffect, useMemo, useRef, useState } from "react";
import { MoreVertical, Save, Search, Trash2, Users, X } from "lucide-react";

import api from "../../../api/axios";
import Button from "../../../elements/Button";
import Input from "../../../elements/Input";
import Textarea from "../../../elements/Textarea";
import Select from "../../../elements/Select";
import Tabbar from "../../../elements/Tabbar";
import CloseButton from "../../../elements/closeButton";
import AlertModal from "../../../elements/AlertModal";
import LoadingOverlay from "../../shared/LoadingOverlay";

const communityDetailTabs = [
  { id: "info", label: "Información", icon: <Save size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
  { id: "members", label: "Miembros", icon: <Users size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
];

const buildInitialForm = (item = {}) => ({
  id: item.id ?? null,
  name: item.name ?? "",
  description: item.description ?? "",
  logo_url: item.logo_url ?? "",
});

function CommunitiesManagerView() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [communities, setCommunities] = useState([]);
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
    loadCommunities();
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

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/communities");
      setCommunities(Array.isArray(data?.communities) ? data.communities : []);
    } catch (error) {
      setCommunities([]);
      openAlert({
        type: "error",
        title: "No se pudieron cargar",
        message: error.response?.data?.message || "Error al cargar comunidades.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const search = String(searchTerm || "").trim().toLowerCase();
    if (!search) return communities;
    return communities.filter((c) => {
      const name = String(c?.name || "").toLowerCase();
      const leader = String(c?.leaderUsername || "").toLowerCase();
      return name.includes(search) || leader.includes(search);
    });
  }, [communities, searchTerm]);

  const requestDelete = (item) => {
    openAlert({
      type: "warning",
      title: "Eliminar comunidad",
      message: `Se eliminará "${item.name}", se borrarán todos los miembros y las solicitudes pendientes quedarán rechazadas. Esta acción no se puede deshacer.`,
      onConfirm: () => handleDelete(item),
    });
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;
    try {
      setIsSaving(true);
      await api.delete(`/admin/communities/${item.id}`);
      await loadCommunities();
      if (selectedItem?.id === item.id) setSelectedItem(null);
      openAlert({ type: "success", title: "Eliminada", message: "Comunidad eliminada correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar la comunidad.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (formData) => {
    const name = String(formData?.name || "").trim();
    if (!name) {
      openAlert({ type: "warning", title: "Campos incompletos", message: "El nombre es obligatorio." });
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/admin/communities/${formData.id}`, {
        name,
        description: String(formData?.description || "").trim(),
        logo_url: String(formData?.logo_url || "").trim() || null,
      });
      await loadCommunities();
      setSelectedItem(null);
      openAlert({ type: "success", title: "Guardado", message: "Comunidad actualizada correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar la comunidad.",
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
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">Comunidades</h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">
            Visualiza y administra las comunidades registradas en el sistema.
          </p>
        </div>

        <div className="flex flex-col items-start self-start md:self-end sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar por nombre o líder..."
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
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay comunidades para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <CommunityCard
              key={item.id}
              item={item}
              onOpenDetails={setSelectedItem}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <CommunityDetailModal
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

function CommunityCard({ item, onOpenDetails, onDelete }) {
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
      className="relative min-h-[160px] rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 p-6 flex flex-col justify-between shadow-sm hover:bg-[var(--black-color)]/25 hover:border-[var(--white-color)]/10 transition-all duration-200"
      onDoubleClick={() => onOpenDetails(item)}
    >
      <div className="flex justify-between items-start mb-3 relative">
        <div className="flex items-center gap-3 pr-3 flex-1 min-w-0">
          {item.logo_url ? (
            <img
              src={item.logo_url}
              alt={item.name}
              className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
              style={{ borderColor: item.color || "#ffffff30" }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-extrabold"
              style={{
                backgroundColor: `${item.color || "#888"}20`,
                color: item.color || "#aaa",
                border: `2px solid ${item.color || "#888"}40`,
              }}
            >
              {String(item.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[var(--ins-text-white)] truncate leading-tight">{item.name}</h3>
            <p className="text-xs text-[var(--ins-text-gray)] truncate">@{item.leaderUsername || "—"}</p>
          </div>
        </div>

        <button
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ins-text-dark)] hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
          onClick={() => setOptionsOpen((prev) => !prev)}
        >
          <MoreVertical size={16} />
        </button>

        {optionsOpen && (
          <div className="absolute right-0 top-10 w-36 rounded-xl border border-white/10 bg-[var(--ins-background)] shadow-lg overflow-hidden z-20">
            <button
              type="button"
              onClick={() => { setOptionsOpen(false); onOpenDetails(item); }}
              className="w-full px-3 py-2 text-left text-sm text-[var(--ins-text-white)] hover:bg-white/10 transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => { setOptionsOpen(false); onDelete(item); }}
              className="w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 transition-colors"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <span
          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.color || "#888" }}
          title={item.color || "Sin color"}
        />
        <span className="text-xs font-mono text-[var(--ins-text-gray)]">{item.color || "—"}</span>
        {item.color2 && item.color2 !== "#222222" && (
          <>
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color2 }}
              title={item.color2}
            />
            <span className="text-xs font-mono text-[var(--ins-text-gray)]">{item.color2}</span>
          </>
        )}
      </div>
    </div>
  );
}

function CommunityDetailModal({ item, onClose, onSave, onDelete, isSaving }) {
  const [form, setForm] = useState(() => buildInitialForm(item));
  const [tab, setTab] = useState("info"); // "info" | "members"
  const [memberOptions, setMemberOptions] = useState({ roles: [], statuses: [] });
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [bulkRole, setBulkRole] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  // Alerts inside modal
  const [innerAlert, setInnerAlert] = useState(null); // { type, message }
  const pendingBulkRef = useRef(null);

  useEffect(() => {
    setForm(buildInitialForm(item));
  }, [item]);

  // Load member options when switching to the member tab
  useEffect(() => {
    if (tab !== "members" || memberOptions.roles.length > 0) return;
    const load = async () => {
      try {
        setOptionsLoading(true);
        const { data } = await api.get(`/admin/communities/${item.id}/member-options`);
        setMemberOptions({
          roles: Array.isArray(data?.roles) ? data.roles : [],
          statuses: Array.isArray(data?.statuses) ? data.statuses : [],
        });
      } catch (_e) {
        setMemberOptions({ roles: [], statuses: [] });
      } finally {
        setOptionsLoading(false);
      }
    };
    load();
  }, [tab, item.id, memberOptions.roles.length]);

  const patchForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Dirty check — compare against original item
  const isDirty = useMemo(() => {
    return (
      form.name !== (item.name ?? "") ||
      form.description !== (item.description ?? "") ||
      form.logo_url !== (item.logo_url ?? "")
    );
  }, [form, item]);

  const handleRemoveLogo = async () => {
    if (!item.logo_url) {
      // Logo was only typed in the form, not saved yet — just clear local field
      patchForm("logo_url", "");
      return;
    }
    try {
      await api.delete(`/admin/communities/${item.id}/logo`);
      patchForm("logo_url", "");
      // Refresh parent silently by calling onSave with the cleared logo
      // The parent will reload the list. We update local form only.
    } catch (_e) {
      setInnerAlert({ type: "error", message: "No se pudo borrar el logo." });
    }
  };

  const requestBulkAction = () => {
    if (!bulkRole && !bulkStatus) {
      setInnerAlert({ type: "warning", message: "Selecciona al menos un rol o estatus para aplicar." });
      return;
    }

    const parts = [];
    if (bulkRole) parts.push(`rol → ${bulkRole}`);
    if (bulkStatus) parts.push(`estatus → ${bulkStatus}`);

    pendingBulkRef.current = handleBulkAction;
    setInnerAlert({
      type: "confirm",
      message: `Se aplicará a TODOS los miembros de "${item.name}": ${parts.join(", ")}. ¿Continuar?`,
    });
  };

  const handleBulkAction = async () => {
    try {
      setIsApplying(true);
      setBulkResult(null);
      const { data } = await api.post(`/admin/communities/${item.id}/bulk-action`, {
        role: bulkRole || undefined,
        status: bulkStatus || undefined,
      });
      setBulkResult({ type: "success", message: data.message });
      setBulkRole("");
      setBulkStatus("");
    } catch (e) {
      setBulkResult({ type: "error", message: e.response?.data?.message || "Error al aplicar acción." });
    } finally {
      setIsApplying(false);
    }
  };

  const handleInnerAlertConfirm = async () => {
    const action = pendingBulkRef.current;
    pendingBulkRef.current = null;
    setInnerAlert(null);
    if (typeof action === "function") await action();
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--ins-background)]/50 backdrop-blur-lg shadow-2xl p-6 max-h-[80dvh] overflow-hidden flex flex-col border border-white/10">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-extrabold text-[var(--ins-text-white)]">{item.name}</h3>
            <p className="text-xs text-[var(--ins-text-gray)] mt-0.5">@{item.leaderUsername || "—"}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 mb-4">
          <Tabbar tabs={communityDetailTabs} activeTab={tab} onChange={setTab} variant="glass" />
        </div>

        {/* Inner alert banner */}
        {innerAlert && (
          <div
            className={`mb-3 flex-shrink-0 rounded-xl px-4 py-3 text-sm flex items-start justify-between gap-3 ${
              innerAlert.type === "error"
                ? "bg-red-500/10 border border-red-500/30 text-red-300"
                : innerAlert.type === "warning"
                ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-300"
                : innerAlert.type === "confirm"
                ? "bg-orange-500/10 border border-orange-500/30 text-orange-200"
                : "bg-[var(--secondary-color)]/10 border border-[var(--secondary-color)]/30 text-[var(--ins-text-white)]"
            }`}
          >
            <span className="flex-1">{innerAlert.message}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {innerAlert.type === "confirm" && (
                <button
                  type="button"
                  onClick={handleInnerAlertConfirm}
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-orange-500/30 hover:bg-orange-500/50 transition-colors"
                >
                  Confirmar
                </button>
              )}
              <button type="button" onClick={() => setInnerAlert(null)} className="opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB: INFO ── */}
        {tab === "info" && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto tdt-scrollbar pr-1">
              <div className="space-y-4">
                <Input
                  label="Nombre"
                  value={form.name}
                  onChange={(e) => patchForm("name", e.target.value)}
                  placeholder="Nombre de la comunidad"
                />

                <Textarea
                  label="Descripción"
                  value={form.description}
                  onChange={(e) => patchForm("description", e.target.value)}
                  placeholder="Descripción de la comunidad"
                  rows={3}
                />

                {/* Logo field with remove button */}
                <div>
                  <Input
                    label="URL del logo"
                    value={form.logo_url}
                    onChange={(e) => patchForm("logo_url", e.target.value)}
                    placeholder="https://..."
                  />
                  {form.logo_url && (
                    <div className="mt-2 flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <img
                        src={form.logo_url}
                        alt="Logo preview"
                        className="w-10 h-10 rounded-full object-cover border border-white/20 flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                      <span className="text-xs text-[var(--ins-text-gray)] break-all flex-1 min-w-0">{form.logo_url}</span>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="flex-shrink-0 p-1.5 rounded-lg text-red-300 hover:bg-red-500/20 transition-colors"
                        title="Borrar imagen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between gap-3 flex-shrink-0">
              <Button
                type="button"
                variant="cancel"
                className="flex items-center gap-2"
                onClick={() => onDelete(form)}
                disabled={isSaving}
              >
                <Trash2 size={16} /> Eliminar
              </Button>

              <Button
                type="button"
                variant="primary"
                className="flex items-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white disabled:opacity-40"
                onClick={() => onSave(form)}
                disabled={isSaving || !isDirty}
              >
                <Save size={16} /> Guardar
              </Button>
            </div>
          </>
        )}

        {/* ── TAB: MEMBERS (bulk actions) ── */}
        {tab === "members" && (
          <>
            <div className="flex-1 min-h-0">
              {optionsLoading ? (
                <p className="text-sm text-[var(--ins-text-gray)] text-center py-8">Cargando opciones...</p>
              ) : (
                <div className="space-y-5 max-h-[calc(80dvh-280px)] overflow-y-auto tdt-scrollbar">
                  <p className="text-xs text-[var(--ins-text-gray)] leading-relaxed">
                    Aplica un <strong className="text-[var(--ins-text-white)]">rol</strong> o <strong className="text-[var(--ins-text-white)]">estatus</strong> a <em>todos</em> los miembros de esta comunidad de una sola vez. Ambos campos son opcionales — activa solo los que quieras cambiar.
                  </p>

                  {/* Role select */}
                  <div>
                    <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1 mb-1.5 block">Nuevo rol</label>
                    <Select
                      value={bulkRole}
                      onChange={(val) => setBulkRole(val)}
                      options={[
                        { value: "", label: "— Sin cambio —" },
                        ...memberOptions.roles.map((r) => ({
                          value: r.role,
                          label: `${r.role} — ${r.detail}`,
                        })),
                      ]}
                    />
                  </div>

                  {/* Status select */}
                  <div>
                    <label className="text-sm font-bold text-[var(--ins-text-gray)] ml-1 mb-1.5 block">Nuevo estatus</label>
                    <Select
                      value={bulkStatus}
                      onChange={(val) => setBulkStatus(val)}
                      options={[
                        { value: "", label: "— Sin cambio —" },
                        ...memberOptions.statuses.map((s) => ({
                          value: s.status,
                          label: `${s.status} — ${s.detail}`,
                        })),
                      ]}
                    />
                  </div>

                  {/* Result banner */}
                  {bulkResult && (
                    <div
                      className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-2 ${
                        bulkResult.type === "success"
                          ? "bg-green-500/10 border border-green-500/30 text-green-300"
                          : "bg-red-500/10 border border-red-500/30 text-red-300"
                      }`}
                    >
                      <span>{bulkResult.message}</span>
                      <button type="button" onClick={() => setBulkResult(null)} className="opacity-60 hover:opacity-100">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex-shrink-0">
              <Button
                type="button"
                variant="primary"
                className="w-full flex items-center justify-center gap-2 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white disabled:opacity-40"
                onClick={requestBulkAction}
                disabled={isApplying || (!bulkRole && !bulkStatus)}
              >
                Aplicar a todos los miembros
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CommunitiesManagerView;
