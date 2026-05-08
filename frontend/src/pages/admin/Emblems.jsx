import { useEffect, useMemo, useRef, useState } from "react";
import { Award, Plus, Save, Search, Trash2, UserRound, X } from "lucide-react";

import api from "../../api/axios";
import AlertModal from "../../elements/AlertModal";
import Button from "../../elements/Button";
import CloseButton from "../../elements/closeButton";
import Input from "../../elements/Input";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import Select from "../../elements/Select";
import Table from "../../elements/Table";

const boolOptions = [
  { value: "true", label: "Si" },
  { value: "false", label: "No" },
];

const buildInitialForm = () => ({
  id: null,
  userId: "",
  editionId: "",
  emblemId: "",
  sourceGoalId: "",
  order: 0,
  isEquipped: false,
});

function EmblemsAdmin() {
  const currentUser = {
    role: localStorage.getItem("role") || "ADMIN",
  };

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editionFilter, setEditionFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const [users, setUsers] = useState([]);
  const [editions, setEditions] = useState([]);
  const [emblems, setEmblems] = useState([]);
  const [goals, setGoals] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });

  const pendingActionRef = useRef(null);

  useEffect(() => {
    loadAll();
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

  const loadAll = async () => {
    try {
      setLoading(true);

      const [usersRes, editionsRes, emblemsRes, goalsRes, assignmentsRes] = await Promise.all([
        api.get("/system/achievements/users"),
        api.get("/admin/editions"),
        api.get("/system/achievements/emblems"),
        api.get("/system/achievements/goals"),
        api.get("/system/achievements/user-emblems"),
      ]);

      setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      setEditions(Array.isArray(editionsRes.data) ? editionsRes.data : []);
      setEmblems(Array.isArray(emblemsRes.data?.emblems) ? emblemsRes.data.emblems : []);
      setGoals(Array.isArray(goalsRes.data?.goals) ? goalsRes.data.goals : []);
      setAssignments(Array.isArray(assignmentsRes.data?.userEmblems) ? assignmentsRes.data.userEmblems : []);
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo cargar",
        message: error.response?.data?.message || "Error al cargar asignaciones de insignias.",
      });

      setUsers([]);
      setEditions([]);
      setEmblems([]);
      setGoals([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const editionOptions = useMemo(() => ([
    { value: "ALL", label: "Todas las ediciones" },
    ...editions.map((edition) => ({
      value: String(edition.id),
      label: `${edition.number} - ${edition.name}`,
    })),
  ]), [editions]);

  const userOptions = useMemo(() => ([
    { value: "ALL", label: "Todos los usuarios" },
    ...users.map((user) => ({
      value: String(user.id),
      label: `${user.username}${user.folio ? ` (${user.folio})` : ""}`,
    })),
  ]), [users]);

  const filteredAssignments = useMemo(() => {
    const search = String(searchTerm || "").trim().toLowerCase();

    return assignments.filter((row) => {
      if (editionFilter !== "ALL" && String(row.editionId) !== editionFilter) return false;
      if (userFilter !== "ALL" && String(row.userId) !== userFilter) return false;

      if (!search) return true;

      const userName = row?.user?.username || "";
      const emblemName = row?.emblem?.name || "";
      const goalTitle = row?.source_goal?.title || "";

      return [userName, emblemName, goalTitle, row?.edition?.name, row?.edition?.number]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(search));
    });
  }, [assignments, editionFilter, userFilter, searchTerm]);

  const assignmentColumns = [
    {
      key: "user",
      header: "Usuario",
      cellClassName: "whitespace-nowrap text-[var(--ins-text-white)] font-semibold",
      render: (row) => row?.user?.username || `ID ${row.userId}`,
    },
    {
      key: "edition",
      header: "Edición",
      cellClassName: "whitespace-nowrap text-[var(--ins-text-gray)]",
      render: (row) => row?.edition ? `${row.edition.number} - ${row.edition.name}` : `ID ${row.editionId}`,
    },
    {
      key: "emblem",
      header: "Emblema",
      cellClassName: "whitespace-nowrap text-[var(--ins-text-white)]",
      render: (row) => row?.emblem?.name || `ID ${row.emblemId}`,
    },
    {
      key: "source_goal",
      header: "Logro Fuente",
      cellClassName: "text-[var(--ins-text-gray)]",
      render: (row) => row?.source_goal?.title || "Manual",
    },
    {
      key: "order",
      header: "Orden",
      cellClassName: "text-[var(--ins-text-white)] font-mono text-xs",
      render: (row) => row.order,
    },
    {
      key: "isEquipped",
      header: "Equipado",
      cellClassName: "text-[var(--ins-text-white)]",
      render: (row) => (
        <span className={row.isEquipped ? "text-emerald-300" : "text-[var(--ins-text-gray)]"}>
          {row.isEquipped ? "Si" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="px-3"
            onClick={() => setSelectedItem({
              ...buildInitialForm(),
              ...row,
              userId: row.userId,
              editionId: row.editionId,
              emblemId: row.emblemId,
              sourceGoalId: row.sourceGoalId || "",
            })}
          >
            Editar
          </Button>
          <Button
            variant="cancel"
            size="sm"
            className="px-3"
            onClick={() => requestDelete(row)}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  const openCreateModal = () => {
    const presetEdition = editionFilter !== "ALL" ? Number(editionFilter) : "";
    const presetUser = userFilter !== "ALL" ? Number(userFilter) : "";
    setSelectedItem({
      ...buildInitialForm(),
      editionId: presetEdition,
      userId: presetUser,
    });
  };

  const requestDelete = (row) => {
    openAlert({
      type: "warning",
      title: "Eliminar asignación",
      message: `Se eliminará la asignación del emblema ${row?.emblem?.name || ""} para ${row?.user?.username || "usuario"}.`,
      onConfirm: () => deleteAssignment(row.id),
    });
  };

  const deleteAssignment = async (id) => {
    try {
      setIsSaving(true);
      await api.delete(`/system/achievements/user-emblems/${id}`);
      await loadAll();
      setSelectedItem((prev) => (prev?.id === id ? null : prev));
      openAlert({ type: "success", title: "Eliminado", message: "Asignación eliminada correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo eliminar",
        message: error.response?.data?.message || "No se pudo eliminar la asignación.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (formData) => {
    const payload = {
      userId: Number(formData.userId),
      editionId: Number(formData.editionId),
      emblemId: Number(formData.emblemId),
      sourceGoalId: formData.sourceGoalId ? Number(formData.sourceGoalId) : null,
      order: Number(formData.order || 0),
      isEquipped: Boolean(formData.isEquipped),
    };

    if (!payload.userId || !payload.editionId || !payload.emblemId) {
      openAlert({
        type: "warning",
        title: "Campos incompletos",
        message: "userId, editionId y emblemId son obligatorios.",
      });
      return;
    }

    try {
      setIsSaving(true);

      if (formData.id) {
        await api.patch(`/system/achievements/user-emblems/${formData.id}`, {
          sourceGoalId: payload.sourceGoalId,
          order: payload.order,
          isEquipped: payload.isEquipped,
        });
      } else {
        await api.post("/system/achievements/user-emblems", payload);
      }

      await loadAll();
      setSelectedItem(null);
      openAlert({ type: "success", title: "Guardado", message: "Asignación guardada correctamente." });
    } catch (error) {
      openAlert({
        type: "error",
        title: "No se pudo guardar",
        message: error.response?.data?.message || "No se pudo guardar la asignación.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="min-h-screen h-screen py-15 flex items-start justify-center pb-24 text-[var(--white-color)] z-[1]">
      <LoadingOverlay isVisible={loading || isSaving} message="Cargando asignaciones de insignias" />
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        onConfirm={handleAlertConfirm}
      />

      <div className="w-full px-0 mx-0 text-[var(--ins-text-white)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Insignias</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight flex items-center gap-3">
              <Award size={30} className="text-[var(--secondary-color)]" />
              Asignación de Insignias
            </h1>
            <p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-3xl leading-relaxed">
              Página exclusiva para administradores con permiso para Asignar insignias manuales, controla orden y estado equipado.
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            className="flex mx-2 items-center gap-2 self-start shrink-0 whitespace-nowrap bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
            onClick={openCreateModal}
          >
            <Plus size={18} /> Nueva asignación
          </Button>
        </div>

        <div className="box-main p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ins-text-gray)] mb-2">Filtro edición</p>
              <Select value={editionFilter} onChange={setEditionFilter} options={editionOptions} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ins-text-gray)] mb-2">Filtro usuario</p>
              <Select value={userFilter} onChange={setUserFilter} options={userOptions} />
            </div>
            <div className="lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ins-text-gray)] mb-2">Buscar</p>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Usuario, emblema, logro..."
                  className="w-full pl-11 pr-10 py-3 rounded-xl bg-black/20 border border-[var(--white-color)]/10 text-sm text-white placeholder:text-white/45 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/45 transition-all"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                {searchTerm ? (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <Table
            columns={assignmentColumns}
            data={filteredAssignments}
            rowKey="id"
            minWidth="min-w-[1080px]"
            emptyColSpan={7}
            emptyMessage="No hay asignaciones para mostrar con los filtros actuales."
            layout="embedded"
          />
        </div>
      </div>

      {selectedItem ? (
        <AssignmentDetailModal
          item={selectedItem}
          users={users}
          editions={editions}
          emblems={emblems}
          goals={goals}
          isSaving={isSaving}
          onClose={() => setSelectedItem(null)}
          onSave={handleSave}
          onDelete={requestDelete}
        />
      ) : null}
    </section>
  );
}

function AssignmentDetailModal({ item, users, editions, emblems, goals, isSaving, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({ ...buildInitialForm(), ...item }));

  useEffect(() => {
    setForm({
      ...buildInitialForm(),
      ...item,
      userId: item?.userId || "",
      editionId: item?.editionId || "",
      emblemId: item?.emblemId || "",
      sourceGoalId: item?.sourceGoalId || "",
      order: Number(item?.order || 0),
      isEquipped: Boolean(item?.isEquipped),
    });
  }, [item]);

  const patchForm = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const userOptions = users.map((user) => ({
    value: String(user.id),
    label: String(user.username || ""),
  }));

  const editionOptions = editions.map((edition) => ({
    value: String(edition.id),
    label: `${edition.number} - ${edition.name}`,
  }));

  const emblemOptions = emblems
    .filter((emblem) => String(emblem.editionId) === String(form.editionId || ""))
    .map((emblem) => ({ value: String(emblem.id), label: `${emblem.name} (${emblem.rarity})` }));

  const sourceGoalOptions = [
    { value: "", label: "Manual (sin logro fuente)" },
    ...goals
      .filter((goal) => String(goal.editionId) === String(form.editionId || "") && String(goal.emblemId) === String(form.emblemId || ""))
      .map((goal) => ({ value: String(goal.id), label: goal.title })),
  ];

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl modal-main">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--white-color)]/10">
          <div>
            <h3 className="text-xl font-bold text-[var(--ins-text-white)] flex items-center gap-2">
              <UserRound size={18} />
              {form.id ? "Editar asignación" : "Nueva asignación"}
            </h3>
            <p className="text-sm text-[var(--ins-text-gray)] mt-1">Vincula un emblema a un usuario y ajusta orden/equipado.</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 min-h-0 p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto tdt-scrollbar">
          <Select
            value={String(form.userId || "")}
            onChange={(value) => patchForm("userId", Number(value))}
            options={userOptions}
            placeholder="Usuario"
            searchable
            searchPlaceholder="Buscar usuario por username..."
          />
          <Select value={String(form.editionId || "")} onChange={(value) => patchForm("editionId", Number(value))} options={editionOptions} placeholder="Edición" />

          <Select value={String(form.emblemId || "")} onChange={(value) => patchForm("emblemId", Number(value))} options={emblemOptions} placeholder="Emblema" />
          <Select value={String(form.sourceGoalId || "")} onChange={(value) => patchForm("sourceGoalId", value ? Number(value) : "")} options={sourceGoalOptions} placeholder="Logro fuente" />

          <Input
            label="Orden"
            type="number"
            value={form.order}
            onChange={(event) => patchForm("order", Number(event.target.value || 0))}
            placeholder="0"
          />

          <div>
            <p className="text-sm text-[var(--ins-text-gray)] mb-2 ml-1">Equipado</p>
            <Select value={String(form.isEquipped)} onChange={(value) => patchForm("isEquipped", String(value) === "true")} options={boolOptions} />
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
  );
}

export default EmblemsAdmin;
