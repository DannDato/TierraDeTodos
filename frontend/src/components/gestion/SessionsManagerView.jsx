import { useEffect, useRef, useState } from "react";
import { RefreshCcw, LogOut, Search } from "lucide-react";

import Button from "../../elements/Button";
import Input from "../../elements/Input";
import AlertModal from "../../elements/AlertModal";
import LoadingOverlay from "../LoadingOverlay";
import api from "../../api/axios";

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

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative">
            <Input
              placeholder="Buscar en cualquier campo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--ins-text-white)]/50 pointer-events-none" size={20} />
          </div>

          <Button variant="primary" size="md" className="flex items-center gap-2" onClick={loadSessions}>
            <RefreshCcw size={16} /> Actualizar
          </Button>
        </div>
      </div>

      <div className="bg-black/20 rounded-3xl overflow-hidden shadow-md p-6">
        <div className="overflow-x-auto tdt-scrollbar">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="bg-black/10 text-sm text-[var(--ins-text-gray)]">
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Online</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Usuario</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Dispositivo</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">User-Agent</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider">Inicio de sesión</th>
                <th className="py-4 px-4 font-bold uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[var(--ins-text-gray)]">
                    {sessions.length === 0 ? "No hay sesiones activas." : "No hay resultados para la búsqueda."}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="border-b border-black/10 hover:bg-black/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[var(--ins-text-white)] font-semibold">{session.username}</td>
                    <td className="py-4 px-4 text-[var(--ins-text-white)] font-mono text-xs" title={session.deviceFolio || "N/A"}>
                      {compactFolio(session.deviceFolio)}
                    </td>
                    <td className="py-4 px-4 text-[var(--ins-text-gray)] text-xs" title={session.device || "unknown-device"}>
                      {truncateUserAgent(session.device, 40)}
                    </td>
                    <td className="py-4 px-4 text-[var(--ins-text-white)] text-sm">
                      {session.startedAt ? new Date(session.startedAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="cancel"
                        size="sm"
                        className="inline-flex items-center gap-1 whitespace-nowrap px-3"
                        onClick={() => requestRevokeSession(session)}
                      >
                        <LogOut size={14} /> Cerrar sesión
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SessionsManagerView;
