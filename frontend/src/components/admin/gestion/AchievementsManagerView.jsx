import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Calendar,
  Download,
  Gem,
  Link2,
  MoreVertical,
  Plus,
  Save,
  Search,
  Target,
  Trash2,
  X,
} from "lucide-react";

import api from "../../../api/axios";
import AlertModal from "../../../elements/AlertModal";
import Button from "../../../elements/Button";
import CloseButton from "../../../elements/closeButton";
import Input from "../../../elements/Input";
import LoadingOverlay from "../../shared/LoadingOverlay";
import Select from "../../../elements/Select";
import Tabbar from "../../../elements/Tabbar";
import Textarea from "../../../elements/Textarea";
import EmblemTemplate from "../../../templates/emblems.psd?url";
import AchievementDetailModal from "./AchievementDetailModal";
import { createPortal } from "react-dom";

const EMBLEM_RARITY_OPTIONS = [
  { value: "common", label: "Common" },
  { value: "rare", label: "Rare" },
  { value: "epic", label: "Epic" },
  { value: "legendary", label: "Legendary" },
  { value: "mythic", label: "Mythic" },
];

const ACHIEVEMENT_TYPE_OPTIONS = [
  { value: "STAT", label: "Estadística" },
  { value: "CUSTOM", label: "Personalizado" },
];

const ACHIEVEMENT_OPERATOR_OPTIONS = [
  { value: "GTE", label: "Mayor o igual" },
  { value: "LTE", label: "Menor o igual" },
  { value: "EQ", label: "Igual" },
];

const ACHIEVEMENT_RARITY_OPTIONS = [
  { value: "COMMON", label: "Common" },
  { value: "UNCOMMON", label: "Uncommon" },
  { value: "RARE", label: "Rare" },
  { value: "EPIC", label: "Epic" },
  { value: "LEGENDARY", label: "Legendary" },
  { value: "MYTHIC", label: "Mythic" },
];

const GOAL_TYPE_OPTIONS = [];
const GOAL_PROGRESS_OPTIONS = [];

const yesNoOptions = [
  { value: "false", label: "No" },
  { value: "true", label: "Si" },
];

const tabs = [
  { id: "emblems", label: "Insignias", icon: <Gem size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
  { id: "goals", label: "Logros", icon: <Target size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
];

const buildInitialEmblem = () => ({
  id: null,
  editionId: "",
  name: "",
  description: "",
  iconUrl: "",
  rarity: "common",
  color: "#9CA3AF",
  isHidden: false,
  isActive: true,
});

const buildInitialAchievement = () => ({
  id: null,
  key: "",
  name: "",
  description: "",
  hint: "",
  type: "STAT",
  rarity: "COMMON",
  goal: 1,
  operator: "GTE",
  statDefinitionId: "",
  isSecret: false,
  isActive: true,
  isRepeatable: false,
  points: 0,
  icon: "",
  sortOrder: 0,
  prizeEmblemId: "",
});

const buildInitialGoal = () => ({
  id: null,
  editionId: "",
  emblemId: "",
  title: "",
  description: "",
  type: "custom",
  targetValue: 1,
  progressType: "cumulative",
  isHidden: false,
  isRepeatable: false,
  startDate: "",
  endDate: "",
});

const toBool = (value) => String(value) === "true";

function AchievementsManagerView() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("emblems");
  const [searchTerm, setSearchTerm] = useState("");
  const [editionFilter, setEditionFilter] = useState("ALL");
  const [editions, setEditions] = useState([]);
  const [emblems, setEmblems] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [statDefinitions, setStatDefinitions] = useState([]);
  const [selectedEmblem, setSelectedEmblem] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });

  const pendingActionRef = useRef(null);

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

  const loadAll = async () => {
    try {
      setLoading(true);
      const [editionsRes, emblemsRes, achievementsRes, statsRes] = await Promise.all([
        api.get("/admin/editions"),
        api.get("/system/achievements/emblems"),
        api.get("/system/achievements/catalog-v2"),
        api.get("/system/achievements/stat-definitions"),
      ]);

      setEditions(Array.isArray(editionsRes.data) ? editionsRes.data : []);
      setEmblems(Array.isArray(emblemsRes.data?.emblems) ? emblemsRes.data.emblems : []);
      setAchievements(Array.isArray(achievementsRes.data?.achievements) ? achievementsRes.data.achievements : []);
      setStatDefinitions(Array.isArray(statsRes.data?.stats) ? statsRes.data.stats : []);
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudieron cargar",
        message: error.response?.data?.message || "Error al cargar insignias y logros.",
      });
      setEditions([]);
      setEmblems([]);
      setAchievements([]);
      setStatDefinitions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const editionOptions = useMemo(() => {
    const base = [{ value: "ALL", label: "Todas las ediciones" }];
    const rows = editions.map((edition) => ({
      value: String(edition.id),
      label: `${edition.number} - ${edition.name}`,
    }));
    return [...base, ...rows];
  }, [editions]);

  const filteredEmblems = useMemo(() => {
    const search = String(searchTerm || "").trim().toLowerCase();
    return emblems.filter((item) => {
      if (editionFilter !== "ALL" && String(item.editionId) !== editionFilter) return false;
      if (!search) return true;
      return [item.name, item.description, item.rarity]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [emblems, editionFilter, searchTerm]);

  const filteredAchievements = useMemo(() => {
    const search = String(searchTerm || "").trim().toLowerCase();
    return achievements.filter((item) => {
      if (!search) return true;
      return [item.key, item.name, item.description, item.type, item.rarity, item?.statDefinition?.name, item?.prizeEmblem?.name]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [achievements, searchTerm]);

  const openCreateEmblem = () => {
    const baseEditionId = editionFilter !== "ALL" ? Number(editionFilter) : "";
    setSelectedEmblem({ ...buildInitialEmblem(), editionId: baseEditionId });
  };

  const openCreateGoal = () => {
    setSelectedAchievement(buildInitialAchievement());
  };

  const requestDeleteEmblem = (item) => {
    openAlert({
      type: "warning",
      title: "Eliminar emblema",
      message: `Se eliminará ${item?.name || "emblema"}. Esta acción no se puede deshacer.`,
      onConfirm: () => deleteEmblem(item),
    });
  };

  const deleteEmblem = async (item) => {
    if (!item?.id) return;
    try {
      setIsSaving(true);
      await api.delete(`/system/achievements/emblems/${item.id}`);
      await loadAll();
      if (selectedEmblem?.id === item.id) setSelectedEmblem(null);
      openAlert({ type: "success", title: "Eliminado", message: "Emblema eliminado correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar el emblema.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeleteAchievement = (item) => {
    openAlert({
      type: "warning",
      title: "Eliminar logro",
      message: `Se eliminará ${item?.name || "achievement"}. Esta acción no se puede deshacer.`,
      onConfirm: () => deleteAchievement(item),
    });
  };

  const deleteAchievement = async (item) => {
    if (!item?.id) return;
    try {
      setIsSaving(true);
      await api.delete(`/system/achievements/catalog-v2/${item.id}`);
      await loadAll();
      if (selectedAchievement?.id === item.id) setSelectedAchievement(null);
      openAlert({ type: "success", title: "Eliminado", message: "Achievement eliminado correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar el achievement.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveEmblem = async (form) => {
    const payload = {
      editionId: Number(form.editionId),
      name: String(form.name || "").trim(),
      description: String(form.description || "").trim(),
      iconUrl: String(form.iconUrl || "").trim(),
      rarity: String(form.rarity || "common").trim().toLowerCase(),
      color: String(form.color || "#9CA3AF").trim(),
      isHidden: Boolean(form.isHidden),
      isActive: Boolean(form.isActive),
    };

    if (!payload.editionId || !payload.name || !payload.description) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "editionId, name y description son obligatorios.",
      });
      return;
    }

    try {
      setIsSaving(true);
      if (form.id) {
        await api.put(`/system/achievements/emblems/${form.id}`, payload);
      } else {
        await api.post("/system/achievements/emblems", payload);
      }

      await loadAll();
      setSelectedEmblem(null);
      openAlert({ type: "success", title: "Guardado", message: "Emblema guardado correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar el emblema.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveAchievement = async (form) => {
    const payload = {
      key: String(form.key || "").trim().toUpperCase(),
      name: String(form.name || "").trim(),
      description: String(form.description || "").trim(),
      hint: String(form.hint || "").trim() || null,
      type: String(form.type || "STAT").trim().toUpperCase(),
      rarity: String(form.rarity || "COMMON").trim().toUpperCase(),
      goal: Number(form.goal || 0),
      operator: form.type === "STAT" ? form.operator : null,
      statDefinitionId: form.type === "STAT" ? Number(form.statDefinitionId || 0) : null,
      isSecret: Boolean(form.isSecret),
      isActive: Boolean(form.isActive),
      isRepeatable: Boolean(form.isRepeatable),
      points: Number(form.points || 0),
      icon: String(form.icon || "").trim() || null,
      sortOrder: Number(form.sortOrder || 0),
      prizeEmblemId: Number(form.prizeEmblemId || 0) || null,
    };

    if (!payload.key || !payload.name || !payload.description) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "key, name y description son obligatorios.",
      });
      return;
    }

    try {
      setIsSaving(true);
      if (form.id) {
        await api.put(`/system/achievements/catalog-v2/${form.id}`, payload);
      } else {
        await api.post("/system/achievements/catalog-v2", payload);
      }

      await loadAll();
      setSelectedAchievement(null);
      openAlert({ type: "success", title: "Guardado", message: "Achievement guardado correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar el achievement.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadEmblemIcon = async (file) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("emblemIcon", file);

    const { data } = await api.post("/system/achievements/emblems/upload-icon", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data?.url || null;
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
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">Insignias y Logros</h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">
            Gestiona insignias de edición y define qué logros las otorgan al completarse.
          </p>
        </div>

        <div className="flex flex-col items-start self-start md:self-end sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Select value={editionFilter} onChange={setEditionFilter} options={editionOptions} />
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
            onClick={activeTab === "emblems" ? openCreateEmblem : openCreateGoal}
          >
            <Plus size={18} /> Nuevo
          </Button>

          <Button
            variant="outline"
            size="md"
            className="flex items-center gap-2 self-start shrink-0 whitespace-nowrap"
            href={EmblemTemplate}
            download="plantilla-insignias.psd"
            target="_blank"
          >
            <Download size={18} /> Descargar plantilla
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Tabbar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="glass" />
      </div>

      {activeTab === "emblems" ? (
        filteredEmblems.length === 0 ? (
          <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
            No hay insignias para mostrar.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredEmblems.map((item) => (
              <EmblemCard
                key={item.id}
                item={item}
                onOpenDetails={setSelectedEmblem}
                onDelete={requestDeleteEmblem}
              />
            ))}
          </div>
        )
      ) : filteredAchievements.length === 0 ? (
        <div className="rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 py-12 text-center text-[var(--ins-text-gray)]">
          No hay logros para mostrar.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredAchievements.map((item) => (
            <AchievementCard
              key={item.id}
              item={item}
              onOpenDetails={setSelectedAchievement}
              onDelete={requestDeleteAchievement}
            />
          ))}
        </div>
      )}

      {selectedEmblem && (
        <EmblemDetailModal
          item={selectedEmblem}
          editions={editions}
          onClose={() => setSelectedEmblem(null)}
          onSave={saveEmblem}
          onDelete={requestDeleteEmblem}
          onUploadIcon={uploadEmblemIcon}
          isSaving={isSaving}
        />
      )}

      {selectedAchievement && (
        <AchievementDetailModal
          item={selectedAchievement}
          stats={statDefinitions}
          emblems={emblems}
          onClose={() => setSelectedAchievement(null)}
          onSave={saveAchievement}
          onDelete={requestDeleteAchievement}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

function EmblemCard({ item, onOpenDetails, onDelete }) {
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
      className="relative min-h-[210px] rounded-3xl border border-[var(--white-color)]/5 bg-[var(--black-color)]/20 p-6 flex flex-col justify-between shadow-sm hover:bg-[var(--black-color)]/25 hover:border-[var(--white-color)]/10 transition-all duration-200"
      onDoubleClick={() => onOpenDetails(item)}
    >
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex items-center gap-2 flex-wrap pr-3">
          <span
            className="px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider"
            style={{
              color: item.color,
              borderColor: `${item.color}40`,
              backgroundColor: `${item.color}12`,
            }}
          >
            {item.rarity}
          </span>
          {item.isHidden ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-500/25 bg-amber-500/10 text-amber-200">
              Oculto
            </span>
          ) : null}
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
            <button
              onClick={() => {
                onDelete(item);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-[var(--ins-text-gray)]">
        <p className="font-bold text-base text-[var(--ins-text-white)]">{item.name}</p>
        <p>{item.description || "Sin descripción"}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--white-color)]/10 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span className="text-[var(--ins-text-dark)]">Estado</span>
        <span className={item.isActive ? "text-emerald-300" : "text-red-300"}>
          {item.isActive ? "Activo" : "Inactivo"}
        </span>
      </div>
    </div>
  );
}

function AchievementCard({ item, onOpenDetails, onDelete }) {
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
      onDoubleClick={() => onOpenDetails(item)}
    >
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex items-center gap-2 flex-wrap pr-3">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider border-cyan-500/25 bg-cyan-500/10 text-cyan-200">
            {item.type}
          </span>
          {item.isSecret ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-violet-500/25 bg-violet-500/10 text-violet-200">
              Secreto
            </span>
          ) : null}
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
            <button
              onClick={() => {
                onDelete(item);
                setOptionsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-[var(--ins-text-gray)]">
        <p className="font-bold text-base text-[var(--ins-text-white)]">{item.name}</p>
        <p>{item.description || "Sin descripción"}</p>
        <p className="text-xs text-[var(--ins-text-dark)] flex items-center gap-2">
          <Link2 size={12} /> Estadística: {item?.statDefinition?.name || "Personalizado"}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--white-color)]/10 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
        <span className="text-[var(--ins-text-dark)]">Objetivo</span>
        <span className="text-[var(--ins-text-white)]">{item.goal}</span>
      </div>
    </div>
  );
}

function EmblemDetailModal({ item, editions, onClose, onSave, onDelete, onUploadIcon, isSaving }) {
  const [form, setForm] = useState(() => ({ ...buildInitialEmblem(), ...item }));
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [iconFileName, setIconFileName] = useState("");
  const iconInputRef = useRef(null);

  useEffect(() => {
    setForm({ ...buildInitialEmblem(), ...item });
    setIconFileName("");
  }, [item]);

  const editionOptions = editions.map((edition) => ({
    value: String(edition.id),
    label: `${edition.number} - ${edition.name}`,
  }));

  const patchForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleUploadIcon = async (file) => {
    if (!(file instanceof File)) return;

    try {
      setIsUploadingIcon(true);
      const uploadedUrl = await onUploadIcon?.(file);
      if (uploadedUrl) {
        patchForm("iconUrl", uploadedUrl);
        setIconFileName(file.name || "");
      }
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleIconInputChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      void handleUploadIcon(file);
    }

    event.target.value = "";
  };

  return createPortal((
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[min(700px,calc(100dvh-2rem))] max-h-[700px] w-full max-w-4xl flex-col rounded-3xl border border-white/10 bg-[var(--ins-background)]/95 shadow-2xl md:w-[82vw]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--white-color)]/10">
          <div>
            <h3 className="text-xl font-bold text-[var(--ins-text-white)]">
              {form.id ? "Editar Emblema" : "Nuevo Emblema"}
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">Configura datos del emblema y su disponibilidad.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 min-h-0 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto tdt-scrollbar">
          <Select label="Edición" value={String(form.editionId || "")} onChange={(value) => patchForm("editionId", Number(value))} options={editionOptions} />
          <Select label="Rareza" value={form.rarity} onChange={(value) => patchForm("rarity", value)} options={EMBLEM_RARITY_OPTIONS} />

          <Input label="Nombre" value={form.name} onChange={(e) => patchForm("name", e.target.value)} placeholder="Guardián de Edición" />
          <div className="space-y-2">
            <span className="block text-sm text-[var(--ins-text-gray)] mb-1 ml-1">Icono</span>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleIconInputChange}
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="px-3 py-2"
                onClick={() => iconInputRef.current?.click()}
                disabled={isSaving || isUploadingIcon}
              >
                {isUploadingIcon ? "Subiendo..." : "Subir imagen"}
              </Button>
              {iconFileName ? (
                <span className="text-xs text-[var(--ins-text-gray)] truncate">{iconFileName}</span>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 min-h-[56px]">
              {form.iconUrl ? (
                <div className="flex items-center gap-3 min-w-0">
                  <img src={form.iconUrl} alt="Preview icono" className="w-10 h-10 rounded object-cover border border-white/20" />
                  <span className="text-xs text-[var(--ins-text-gray)]">Icono cargado</span>
                </div>
              ) : (
                <span className="text-xs text-[var(--ins-text-gray)]">Sin icono cargado</span>
              )}
              {form.iconUrl ? (
                <Button type="button" variant="cancel" size="sm" className="px-2 py-1" onClick={() => patchForm("iconUrl", "")} disabled={isSaving || isUploadingIcon}>
                  Quitar
                </Button>
              ) : null}
            </div>
          </div>

          <div className="md:col-span-2">
            <Textarea label="Descripción" value={form.description} onChange={(e) => patchForm("description", e.target.value)} rows={3} placeholder="Descripción del emblema" />
          </div>

          <div>
            <p className="text-sm text-[var(--ins-text-gray)] mb-2 ml-1">Activo</p>
            <Select value={String(Boolean(form.isActive))} onChange={(value) => patchForm("isActive", toBool(value))} options={yesNoOptions} />
          </div>

          <div>
            <p className="text-sm text-[var(--ins-text-gray)] mb-2 ml-1">Oculto</p>
            <Select value={String(Boolean(form.isHidden))} onChange={(value) => patchForm("isHidden", toBool(value))} options={yesNoOptions} />
          </div>

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

        <div className="mt-6 px-6 pb-6 flex items-center justify-between gap-3 flex-shrink-0">
          {form.id ? (
            <Button type="button" variant="cancel" className="flex items-center gap-2" onClick={() => onDelete(form)} disabled={isSaving}>
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
              disabled={isSaving || isUploadingIcon}
            >
              <Save size={16} /> Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}

function GoalDetailModal({ item, editions, emblems, onClose, onSave, onDelete, isSaving }) {
  const [form, setForm] = useState(() => ({ ...buildInitialGoal(), ...item }));

  useEffect(() => {
    setForm({
      ...buildInitialGoal(),
      ...item,
      editionId: item?.editionId || "",
      emblemId: item?.emblemId || "",
      startDate: item?.startDate ? String(item.startDate).slice(0, 10) : "",
      endDate: item?.endDate ? String(item.endDate).slice(0, 10) : "",
    });
  }, [item]);

  const editionOptions = editions.map((edition) => ({
    value: String(edition.id),
    label: `${edition.number} - ${edition.name}`,
  }));

  const emblemOptions = emblems
    .filter((emblem) => String(emblem.editionId) === String(form.editionId || ""))
    .map((emblem) => ({ value: String(emblem.id), label: emblem.name }));

  const patchForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return createPortal((
    <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[min(700px,calc(100dvh-2rem))] max-h-[700px] w-full max-w-5xl flex-col rounded-3xl border border-white/10 bg-[var(--ins-background)]/95 shadow-2xl md:w-[82vw]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--white-color)]/10">
          <div>
            <h3 className="text-xl font-bold text-[var(--ins-text-white)]">{form.id ? "Editar Logro" : "Nuevo Logro"}</h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">Define objetivo y emblema que se otorgará al completarlo.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 min-h-0 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto tdt-scrollbar">
          <Select label="Edición" value={String(form.editionId || "")} onChange={(value) => patchForm("editionId", Number(value))} options={editionOptions} />
          <Select label="Emblema" value={String(form.emblemId || "")} onChange={(value) => patchForm("emblemId", Number(value))} options={emblemOptions} />

          <Input label="Título" value={form.title} onChange={(e) => patchForm("title", e.target.value)} placeholder="Mata 100 mobs" />
          <Select label="Tipo" value={form.type} onChange={(value) => patchForm("type", value)} options={GOAL_TYPE_OPTIONS} />

          <Input label="Meta" type="number" value={form.targetValue} onChange={(e) => patchForm("targetValue", Number(e.target.value || 0))} placeholder="100" />
          <Select label="Tipo de progreso" value={form.progressType} onChange={(value) => patchForm("progressType", value)} options={GOAL_PROGRESS_OPTIONS} />

          <div className="md:col-span-2">
            <Textarea label="Descripción" value={form.description} onChange={(e) => patchForm("description", e.target.value)} rows={3} placeholder="Descripción del logro" />
          </div>

          <Input label="Inicio" type="date" value={form.startDate || ""} onChange={(e) => patchForm("startDate", e.target.value)} />
          <Input label="Fin" type="date" value={form.endDate || ""} onChange={(e) => patchForm("endDate", e.target.value)} />

          <div>
            <p className="text-sm text-[var(--ins-text-gray)] mb-2 ml-1">Oculto</p>
            <Select value={String(Boolean(form.isHidden))} onChange={(value) => patchForm("isHidden", toBool(value))} options={yesNoOptions} />
          </div>

          <div>
            <p className="text-sm text-[var(--ins-text-gray)] mb-2 ml-1">Repetible</p>
            <Select value={String(Boolean(form.isRepeatable))} onChange={(value) => patchForm("isRepeatable", toBool(value))} options={yesNoOptions} />
          </div>
        </div>

        <div className="mt-6 px-6 pb-6 flex items-center justify-between gap-3 flex-shrink-0">
          {form.id ? (
            <Button type="button" variant="cancel" className="flex items-center gap-2" onClick={() => onDelete(form)} disabled={isSaving}>
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
  ), document.body);
}

export default AchievementsManagerView;
