import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Lock, MessageCircle, MessageSquareWarning, RefreshCw, Search, Send, ShieldAlert, User, X, XCircle } from "lucide-react";

import api from "../../api/axios";
import LoadingOverlay from "../../components/shared/LoadingOverlay";
import AlertModal from "../../elements/AlertModal";
import Button from "../../elements/Button";
import Switch from "../../elements/Switch";
import Textarea from "../../elements/Textarea";

const STATUS_STYLE = {
  ABIERTO:   { text: "text-emerald-300",            border: "border-transparent", bg: "bg-emerald-500/10" },
  CERRADO:   { text: "text-[var(--ins-text-dark)]", border: "border-transparent", bg: "bg-white/5" },
  RECHAZADO: { text: "text-red-300",                border: "border-transparent", bg: "bg-red-500/10" },
};

const statusStyle = (key) => STATUS_STYLE[key] ?? STATUS_STYLE.CERRADO;

const copyTpCommandToClipboard = async (x, y, z) => {
  const command = `/tp ${x} ${y} ${z}`;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(command);
      return true;
    }
  } catch {
    // Intenta con fallback legacy cuando Clipboard API no este disponible.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = command;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return Boolean(ok);
  } catch {
    return false;
  }
};

function Reports() {
  const currentUser = {
    role: localStorage.getItem("role") || "ADMIN",
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const searchInputRef = useRef(null);

  const [ticketTypes, setTicketTypes] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [canCloseTicket, setCanCloseTicket] = useState(false);

  const [chatTicket, setChatTicket] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
    reload: false,
  });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "Confirmar",
  });
  const pendingConfirmRef = useRef(null);

  const openAlert = ({ type = "info", title = "Aviso", message = "", reload = false }) => {
    setAlertConfig({ isOpen: true, type, title, message, reload });
  };

  const closeAlert = () => {
    const shouldReload = Boolean(alertConfig.reload);
    setAlertConfig((prev) => ({ ...prev, isOpen: false, reload: false }));

    if (shouldReload) {
      window.location.reload();
    }
  };

  const openConfirm = ({ type = "warning", title, message, confirmText = "Confirmar", onConfirm }) => {
    pendingConfirmRef.current = onConfirm;
    setConfirmConfig({ isOpen: true, type, title, message, confirmText });
  };

  const closeConfirm = () => {
    pendingConfirmRef.current = null;
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirmed = () => {
    const action = pendingConfirmRef.current;
    pendingConfirmRef.current = null;
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
    action?.();
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const { data } = await api.get("/system/tickets/catalogs");
        setTicketTypes(Array.isArray(data?.types) ? data.types : []);
        setPriorityOptions(Array.isArray(data?.priorities) ? data.priorities : []);
      } catch {
        setTicketTypes([]);
        setPriorityOptions([]);
      }
    };

    loadCatalogs();
  }, []);

  const loadTickets = useCallback(async (q, includeClosed, includeRejected) => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/reports/tickets", {
        params: {
          q: q || undefined,
          includeClosed,
          includeRejected,
        },
      });

      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      setCanCloseTicket(Boolean(data?.canCloseTicket));
      setLastUpdatedAt(new Date());
      setLoadError(false);
    } catch {
      setTickets([]);
      setCanCloseTicket(false);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets(searchTerm.trim(), showClosed, showRejected);
    }, 220);

    return () => clearTimeout(timer);
  }, [searchTerm, showClosed, showRejected, loadTickets]);

  const refreshTickets = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadTickets(searchTerm.trim(), showClosed, showRejected);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadTickets, searchTerm, showClosed, showRejected]);

  useEffect(() => {
    // Refresco operativo: mantiene la bandeja sincronizada mientras el modal esta cerrado.
    if (chatTicket) return undefined;
    const intervalId = setInterval(() => {
      loadTickets(searchTerm.trim(), showClosed, showRejected);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [chatTicket, loadTickets, searchTerm, showClosed, showRejected]);

  useEffect(() => {
    const onSlashFocusSearch = (event) => {
      if (event.key !== "/") return;

      const tagName = String(event.target?.tagName || "").toLowerCase();
      const isTypingElement = tagName === "input" || tagName === "textarea" || event.target?.isContentEditable;
      if (isTypingElement) return;

      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener("keydown", onSlashFocusSearch);
    return () => window.removeEventListener("keydown", onSlashFocusSearch);
  }, []);

  const priorityMap = useMemo(
    () => new Map(priorityOptions.map((p) => [p.key, p])),
    [priorityOptions]
  );

  const typeMap = useMemo(
    () => new Map(ticketTypes.map((t) => [t.key, t])),
    [ticketTypes]
  );

  const openChat = useCallback(async (ticket) => {
    // Feedback inmediato en UI: al abrir conversación se considera leído.
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, unreadCount: 0 } : t)));

    setChatTicket(ticket);
    setChatData(null);
    setChatLoading(true);

    try {
      const { data } = await api.get(`/admin/reports/tickets/${ticket.id}/messages`);
      setChatData(data);
    } catch {
      setChatData({ ticket, messages: [] });
    } finally {
      setChatLoading(false);
    }
  }, []);

  const closeChat = useCallback(() => {
    setChatTicket(null);
    setChatData(null);
  }, []);

  const handleMessageSent = useCallback((newMessage) => {
    setChatData((prev) => (prev ? { ...prev, messages: [...prev.messages, newMessage] } : prev));
  }, []);

  return (
    <section className="min-h-screen py-15 flex items-start justify-center pb-24">
      <LoadingOverlay isVisible={loading || chatLoading} message="Cargando reportes..." />
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        confirmText="Aceptar"
        cancelText=""
      />
      <AlertModal
        isOpen={confirmConfig.isOpen}
        type={confirmConfig.type}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText="Cancelar"
        onClose={closeConfirm}
        onConfirm={handleConfirmed}
      />
      <div className="w-full max-w-7xl px-0 mx-0 text-[var(--ins-text-white)]">

        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="px-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-widest mb-2">
                <span>ADMIN</span><span>/</span><span className="text-[var(--secondary-color)]">Reports</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Atención de Tickets</h1>
              <p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-3xl leading-relaxed">
                Bandeja operativa para atención de tickets. Se muestran primero por urgencia y dentro de cada nivel, del más viejo al más nuevo.
              </p>
            </div>

            <div className="relative w-full md:w-[360px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por asunto, ID, jugador o usuario..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-black/10 text-sm text-white placeholder:text-white/45 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/45 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={refreshTickets}
                disabled={loading || isRefreshing}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-white/12 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                title="Actualizar tickets ahora"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </button>
              <span className="text-[11px] text-[var(--ins-text-dark)]">
                {lastUpdatedAt ? `Actualizado: ${lastUpdatedAt.toLocaleTimeString("es-MX")}` : "Sin sincronizar"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                label="Ver cerrados"
                checked={showClosed}
                onChange={setShowClosed}
              />
              <Switch
                label="Ver rechazados"
                checked={showRejected}
                onChange={setShowRejected}
              />
            </div>
          </div>
        </div>

        <div className="box-main p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquareWarning size={18} className="text-[var(--secondary-color)]" />
            Tickets pendientes
            {!loading && tickets.length > 0 && (
              <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--secondary-color)]/15 text-[var(--secondary-color)]">
                {tickets.length}
              </span>
            )}
          </h2>

          {loading ? (
            <div className="box-main py-10 px-4 text-center text-[var(--ins-text-gray)]">Cargando tickets...</div>
          ) : loadError ? (
            <div className="box-main py-10 px-4 text-center">
              <p className="text-red-300 font-bold mb-2">No se pudo cargar la bandeja</p>
              <p className="text-[var(--ins-text-gray)] text-sm mb-4">Revisa tu conexión e intenta de nuevo.</p>
              <button
                type="button"
                onClick={refreshTickets}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 text-sm font-bold text-[var(--ins-text-gray)] hover:text-white hover:bg-white/12 transition-colors"
              >
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="box-main py-10 px-4 text-center text-[var(--ins-text-gray)]">
              {searchTerm.trim() ? `Sin resultados para "${searchTerm.trim()}".` : "No hay tickets pendientes por atender."}
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto tdt-scrollbar pr-1">
              {tickets.map((ticket) => (
                <AdminTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  typeMap={typeMap}
                  priorityMap={priorityMap}
                  onDoubleClick={openChat}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {chatTicket && (
        <AdminTicketChatModal
          chatData={chatData}
          loading={chatLoading}
          currentUser={currentUser}
          canCloseTicket={canCloseTicket}
          priorityMap={priorityMap}
          typeMap={typeMap}
          onClose={closeChat}
          onMessageSent={handleMessageSent}
          onTicketClosed={(updatedTicket) => {
            setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t)));
            setChatData((prev) => prev ? { ...prev, ticket: { ...prev.ticket, ...updatedTicket } } : prev);
          }}
          onAlert={openAlert}
          onRequestRefresh={refreshTickets}
          onRequestConfirm={openConfirm}
        />
      )}
    </section>
  );
}

function AdminTicketCard({ ticket, typeMap, priorityMap, onDoubleClick }) {
  const st = statusStyle(ticket.statusKey);
  const priority = priorityMap.get(ticket.priorityKey);

  const handleCopyTp = useCallback(async (event) => {
    event.stopPropagation();
    const copied = await copyTpCommandToClipboard(ticket.coordX, ticket.coordY, ticket.coordZ);
    if (copied) {
      window.dispatchEvent(new CustomEvent("tdt:toast", {
        detail: {
          type: "success",
          title: "Comando copiado",
          message: `/tp ${ticket.coordX} ${ticket.coordY} ${ticket.coordZ}`,
        },
      }));
    }
  }, [ticket.coordX, ticket.coordY, ticket.coordZ]);

  return (
    <article
      className="rounded-2xl bg-black/30 p-4 cursor-pointer hover:bg-black/40 transition-colors select-none"
      onClick={() => onDoubleClick(ticket)}
      title="Click para abrir conversación"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--ins-text-white)]">{ticket.subject}</h3>
          <p className="text-xs text-[var(--ins-text-gray)] mt-1">
            {new Date(ticket.createdAt).toLocaleString("es-MX")} · #{ticket.id} · {ticket.author?.username || "Usuario"}
          </p>
        </div>
        <div className="flex flex-col items-end justify-center self-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${st.border} ${st.bg} ${st.text} uppercase tracking-wider`}>
            {ticket.statusKey}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{typeMap.get(ticket.typeKey)?.name || ticket.typeKey}</Badge>
          <span
            className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"
            style={{
              backgroundColor: `${priority?.color || "#f59e0b"}26`,
              color: priority?.color || "#f59e0b",
            }}
          >
            {priority?.name || ticket.priorityKey}
          </span>
          {ticket.involvedPlayer ? <BadgeSky>Jugador: {ticket.involvedPlayer}</BadgeSky> : null}
          {ticket.coordX !== null && ticket.coordY !== null && ticket.coordZ !== null ? (
            <BadgeSecondary
              onClick={handleCopyTp}
              onDoubleClick={(event) => event.stopPropagation()}
              title="Click para copiar /tp"
            >
              XYZ: {ticket.coordX}, {ticket.coordY}, {ticket.coordZ}
            </BadgeSecondary>
          ) : null}
        </div>
        <div className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/8 text-[var(--ins-text-gray)] flex-shrink-0">
          <MessageCircle size={18} />
          {Number(ticket.unreadCount) > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center">
              {ticket.unreadCount > 99 ? "99+" : ticket.unreadCount}
            </span>
          )}
        </div>
      </div>

      {ticket.evidence && (
        <a href={ticket.evidence} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200">
          <ShieldAlert size={12} /> Ver evidencia
        </a>
      )}

      <p className="text-xs text-[var(--ins-text-dark)] mt-3 italic">Click para abrir conversación</p>
    </article>
  );
}

function AdminTicketChatModal({ chatData, loading, currentUser, canCloseTicket, priorityMap, typeMap, onClose, onMessageSent, onTicketClosed, onAlert, onRequestRefresh, onRequestConfirm }) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const bottomRef = useRef(null);

  const ticket = chatData?.ticket;
  const messages = chatData?.messages ?? [];
  const isOpen = ticket?.statusKey === "ABIERTO";

  const orderedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return Number(a?.id || 0) - Number(b?.id || 0);
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !ticket || !isOpen) return;

    try {
      setSending(true);
      const { data } = await api.post(`/admin/reports/tickets/${ticket.id}/messages`, { message: text });
      onMessageSent(data.message);
      setNewMessage("");
    } catch (err) {
      onAlert?.({ type: "error", title: "Mensaje no enviado", message: err.response?.data?.message || "No se pudo enviar respuesta del sistema." });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const confirmAndReject = () => {
    onRequestConfirm?.({
      type: "warning",
      title: "¿Rechazar este ticket?",
      message: "El usuario será notificado y el ticket quedará marcado como rechazado. Esta acción no se puede deshacer.",
      confirmText: "Sí, rechazar",
      onConfirm: doRejectTicket,
    });
  };

  const doRejectTicket = async () => {
    if (!ticket || ticket.statusKey !== "ABIERTO") return;
    try {
      setRejecting(true);
      const { data } = await api.patch(`/admin/reports/tickets/${ticket.id}/reject`);
      onTicketClosed?.(data.ticket);
      onAlert?.({ type: "success", title: "Ticket rechazado", message: "El ticket se rechazó correctamente.", reload: true });
      await onRequestRefresh?.();
    } catch (err) {
      onAlert?.({ type: "error", title: "No se pudo rechazar", message: err.response?.data?.message || "No se pudo rechazar el ticket." });
    } finally {
      setRejecting(false);
    }
  };

  const confirmAndClose = () => {
    onRequestConfirm?.({
      type: "warning",
      title: "¿Cerrar este ticket?",
      message: "Se marcará como resuelto. El usuario podrá ver el cierre desde su panel.",
      confirmText: "Sí, cerrar",
      onConfirm: doCloseTicket,
    });
  };

  const doCloseTicket = async () => {
    if (!ticket || ticket.statusKey !== "ABIERTO") return;
    try {
      setClosing(true);
      const { data } = await api.patch(`/admin/reports/tickets/${ticket.id}/close`);
      onTicketClosed?.(data.ticket);
      onAlert?.({ type: "success", title: "Ticket cerrado", message: "El ticket se cerró correctamente.", reload: true });
      await onRequestRefresh?.();
    } catch (err) {
      onAlert?.({ type: "error", title: "No se pudo cerrar", message: err.response?.data?.message || "No se pudo cerrar el ticket." });
    } finally {
      setClosing(false);
    }
  };

  const st = ticket ? statusStyle(ticket.statusKey) : { text: "", border: "", bg: "" };
  const priority = ticket ? priorityMap.get(ticket.priorityKey) : null;

  const handleCopyTp = useCallback(async () => {
    if (!ticket || ticket.coordX === null || ticket.coordY === null || ticket.coordZ === null) return;
    const copied = await copyTpCommandToClipboard(ticket.coordX, ticket.coordY, ticket.coordZ);
    if (copied) {
      onAlert?.({
        type: "success",
        title: "Comando copiado",
        message: `/tp ${ticket.coordX} ${ticket.coordY} ${ticket.coordZ}`,
      });
    } else {
      onAlert?.({
        type: "error",
        title: "No se pudo copiar",
        message: "El navegador no pudo copiar el comando al portapapeles.",
      });
    }
  }, [onAlert, ticket]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-3xl rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col h-full md:h-auto md:max-h-[88vh] bg-[var(--ins-background)]/60 backdrop-blur-lg border border-white/10 md:mt-[-60px]">

        <div className="flex items-start justify-between gap-4 px-6 py-5 bg-black/10 border-b border-white/8">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {ticket ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${st.border} ${st.bg} ${st.text} uppercase tracking-wider`}>{ticket.statusKey}</span>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ backgroundColor: `${priority?.color || "#f59e0b"}26`, color: priority?.color || "#f59e0b" }}>{priority?.name || ticket.priorityKey}</span>
                  <span className="text-[10px] font-bold text-[var(--ins-text-dark)] uppercase tracking-wider">#{ticket.id}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[var(--ins-text-white)] text-xl leading-tight flex-1 min-w-0">{ticket.subject}</h3>
                  {canCloseTicket && ticket.statusKey === "ABIERTO" ? (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        className="text-xs"
                        onClick={confirmAndClose}
                        disabled={closing || rejecting}
                      >
                        <CheckCircle2 size={14} /> {closing ? "Cerrando..." : "Cerrar"}
                      </Button>
                      <Button
                        type="button"
                        variant="warning"
                        className="text-xs"
                        onClick={confirmAndReject}
                        disabled={closing || rejecting}
                      >
                        <XCircle size={14} /> {rejecting ? "Rechazando..." : "Rechazar"}
                      </Button>
                    </>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{typeMap.get(ticket.typeKey)?.name || ticket.typeKey}</Badge>
                  {ticket.involvedPlayer ? <BadgeSky>Jugador: {ticket.involvedPlayer}</BadgeSky> : null}
                  {ticket.coordX !== null && ticket.coordY !== null && ticket.coordZ !== null ? (
                    <BadgeSecondary onClick={handleCopyTp} title="Click para copiar /tp">
                      XYZ: {ticket.coordX}, {ticket.coordY}, {ticket.coordZ}
                    </BadgeSecondary>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            )}
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} className="flex-shrink-0 p-2 rounded-xl text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto tdt-scrollbar px-6 py-4 space-y-3 min-h-0" style={{ minHeight: "220px" }}>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[var(--ins-text-gray)] text-sm">Cargando conversación...</div>
          ) : orderedMessages.length === 0 ? (
            <div className="text-center text-[var(--ins-text-gray)] text-sm py-8">Sin mensajes todavía.</div>
          ) : (
            orderedMessages.map((msg, idx) => {
              const sourceScreen = String(msg?.sourceScreen || "").toUpperCase();
              const authorRole = String(msg?.authorRole || "").toUpperCase();

              // Pantalla REPORTS: lo enviado desde reports va a la derecha/verde.
              // Mensajes legacy sin bandera: SYSTEM se considera del lado reports.
              const isMine = sourceScreen
                ? sourceScreen === "REPORTS"
                : authorRole === "SYSTEM";

              const isSystem = sourceScreen === "REPORTS" || authorRole === "SYSTEM";
              return (
                <div key={msg.id ?? idx} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-[var(--ins-text-dark)] mb-1 px-1 inline-flex items-center gap-1">
                    {isMine ? null : <User size={11} />}
                    {isMine ? "TÚ" : isSystem ? "SISTEMA" : "USUARIO"} · {new Date(msg.createdAt).toLocaleString("es-MX")}
                  </span>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isMine ? "bg-emerald-500/20 text-emerald-100" : "bg-sky-500/20 text-sky-100"}`}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-6 py-4 bg-black/10">
          {isOpen ? (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Responder como sistema... (Enter para enviar, Shift+Enter para salto de línea)"
                  rows={2}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                className="flex-shrink-0 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-1 px-4 py-3"
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
              >
                <Send size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-white/7 px-4 py-3 text-[var(--ins-text-gray)] text-sm">
              <Lock size={16} className="flex-shrink-0" />
              Este ticket está {ticket?.statusKey?.toLowerCase() || "cerrado"}. No se pueden agregar más mensajes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Badge = ({ children }) => (
  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/10 text-[var(--ins-text-gray)] uppercase tracking-wider">{children}</span>
);

const BadgeSky = ({ children }) => (
  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-sky-500/15 text-sky-300 tracking-wider">{children}</span>
);

const BadgeSecondary = ({ children, onClick, onDoubleClick, title }) => {
  if (onClick) {
    return (
      <button
        type="button"
        className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--secondary-color)]/15 text-[var(--secondary-color)] tracking-wider hover:bg-[var(--secondary-color)]/25 transition-colors cursor-copy"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        title={title}
      >
        {children}
      </button>
    );
  }

  return (
    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--secondary-color)]/15 text-[var(--secondary-color)] tracking-wider" title={title}>
      {children}
    </span>
  );
};

export default Reports;
