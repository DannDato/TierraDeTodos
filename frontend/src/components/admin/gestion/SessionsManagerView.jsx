import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw, LogOut, Search, X } from "lucide-react";

import Button from "../../../elements/Button";
import AlertModal from "../../../elements/AlertModal";
import Table from "../../../elements/Table";
import LoadingOverlay from "../../shared/LoadingOverlay";
import api from "../../../api/axios";

function SessionsManagerView() {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });
  const pendingActionRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/sessions");
      setSessions(data?.sessions || []);
    } catch (error) {
      console.error("Error cargando sesiones globales:", error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

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

  const requestRevokeSession = (session) => {
    openAlert({
      type: "warning",
      title: "Cerrar sesión",
      message: `Se cerrará la sesión de ${session.username}.`,
      onConfirm: () => revokeSession(session.id),
    });
  };

  const revokeSession = async (sessionId) => {
    try {
      setIsSaving(true);
      await api.patch(`/admin/sessions/${sessionId}/revoke`);
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      openAlert({
        type: "success",
        title: "Sesión cerrada",
        message: "La sesión fue cerrada correctamente.",
      });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      openAlert({
        type: "error",
        title: "No se pudo cerrar",
        message: error.response?.data?.message || "No se pudo cerrar la sesión.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const truncateUserAgent = (value, maxLength = 40) => {
    const safeValue = String(value || "unknown-device").trim();
    if (safeValue.length <= maxLength) return safeValue;
    return `${safeValue.slice(0, maxLength)}...`;
  };

  const compactFolio = (folio) => {
    const digits = String(folio || "").replace(/\D/g, "");
    if (!digits) return "N/A";
    return `DV-${digits.slice(-5).padStart(5, "0")}`;
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredSessions = sessions.filter((session) => {
    if (!normalizedSearchTerm) return true;

    const haystack = Object.values(session || {})
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");

    return haystack.includes(normalizedSearchTerm);
  });

  const sessionsColumns = useMemo(() => ([
    {
      key: "online",
      header: "Online",
      render: () => (
        <span className="inline-flex items-center gap-2 text-emerald-300 text-xs font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </span>
      ),
    },
    {
      key: "username",
      header: "Usuario",
      cellClassName: "text-[var(--ins-text-white)] font-semibold",
      render: (session) => session.username,
    },
    {
      key: "deviceFolio",
      header: "Dispositivo",
      cellClassName: "text-[var(--ins-text-white)] font-mono text-xs",
      getTitle: (session) => session.deviceFolio || "N/A",
      render: (session) => compactFolio(session.deviceFolio),
    },
    {
      key: "device",
      header: "User-Agent",
      cellClassName: "text-[var(--ins-text-gray)] text-xs",
      getTitle: (session) => session.device || "unknown-device",
      render: (session) => truncateUserAgent(session.device, 40),
    },
    {
      key: "startedAt",
      header: "Inicio de sesión",
      cellClassName: "text-[var(--ins-text-white)] text-sm",
      render: (session) => (session.startedAt ? new Date(session.startedAt).toLocaleString() : "N/A"),
    },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (session) => (
        <Button
          variant="cancel"
          size="sm"
          className="inline-flex items-center gap-1 whitespace-nowrap px-3"
          onClick={() => requestRevokeSession(session)}
        >
          <LogOut size={14} /> Cerrar sesión
        </Button>
      ),
    },
  ]), [requestRevokeSession]);

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
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">Sesiones Globales</h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">Listado de sesiones activas actualmente.</p>
        </div>

        <div className="flex flex-col items-start self-start md:self-end sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar en cualquier campo..."
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

          <Button variant="primary" size="md" className="flex items-center gap-2 self-start shrink-0 whitespace-nowrap" onClick={loadSessions}>
            <RefreshCcw size={16} /> Actualizar
          </Button>
        </div>
      </div>

      <Table
        columns={sessionsColumns}
        data={filteredSessions}
        rowKey="id"
        minWidth="min-w-[860px]"
        emptyColSpan={6}
        emptyMessage={sessions.length === 0 ? "No hay sesiones activas." : "No hay resultados para la búsqueda."}
      />
    </div>
  );
}

export default SessionsManagerView;
