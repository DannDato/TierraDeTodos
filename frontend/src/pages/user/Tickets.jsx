
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LifeBuoy,
  Lock,
  MapPinned,
  MessageCircle,
  MessageSquareWarning,
  Send,
  ShieldAlert,
  UserSearch,
  X,
} from "lucide-react";

import api from "../../api/axios";
import LoadingOverlay from "../../components/LoadingOverlay";
import AlertModal from "../../elements/AlertModal";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import Textarea from "../../elements/Textarea";
import { useSearchParams } from "react-router-dom";

const createInitialForm = (types = [], priorities = []) => ({
  type: String(types[0]?.key || ""),
  priority: String(priorities[0]?.key || ""),
  subject: "",
  involvedPlayer: "",
  coordX: "",
  coordY: "",
  coordZ: "",
  description: "",
  evidence: "",
});

const STATUS_STYLE = {
  ABIERTO:   { text: "text-emerald-300",                border: "border-transparent", bg: "bg-emerald-500/10" },
  CERRADO:   { text: "text-[var(--ins-text-dark)]",     border: "border-transparent", bg: "bg-white/5"        },
  RECHAZADO: { text: "text-red-300",                    border: "border-transparent", bg: "bg-red-500/10"     },
};
const statusStyle = (key) => STATUS_STYLE[key] ?? STATUS_STYLE["CERRADO"];

function Tickets() {
  const [searchParams] = useSearchParams();
  const currentUser = {
    id:       Number(localStorage.getItem("userId")),
    username: localStorage.getItem("username") || "Jugador",
    role:     localStorage.getItem("role") || "USER",
  };

  // catálogos
  const [ticketTypes,     setTicketTypes]     = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [catalogLoading,  setCatalogLoading]  = useState(true);

  // mis tickets (cargados desde API)
  const [tickets,        setTickets]        = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // formulario
  const [formData,          setFormData]          = useState(createInitialForm());
  const [submitting,        setSubmitting]         = useState(false);
  const [playersCatalog,    setPlayersCatalog]    = useState([]);
  const [showPlayerOptions, setShowPlayerOptions] = useState(false);

  // modal de chat
  const [chatTicket,  setChatTicket]  = useState(null);
  const [chatData,    setChatData]    = useState(null); // { ticket, messages }
  const [chatLoading, setChatLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });

  const openAlert = ({ type = "info", title = "Aviso", message = "" }) => {
    setAlertConfig({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // ── carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setCatalogLoading(true);
        const { data } = await api.get("/system/tickets/catalogs");
        const types      = Array.isArray(data?.types)      ? data.types      : [];
        const priorities = Array.isArray(data?.priorities) ? data.priorities : [];
        setTicketTypes(types);
        setPriorityOptions(priorities);
        setFormData(createInitialForm(types, priorities));
      } catch {
        setTicketTypes([]);
        setPriorityOptions([]);
      } finally {
        setCatalogLoading(false);
      }
    };

    const loadPlayers = async () => {
      try {
        const { data } = await api.get("/user/players");
        const users = Array.isArray(data?.players) ? data.players : [];
        setPlayersCatalog([...new Set(users.map((u) => String(u?.username || "").trim()).filter(Boolean))]);
      } catch {
        setPlayersCatalog([]);
      }
    };

    const loadMyTickets = async () => {
      try {
        setTicketsLoading(true);
        const { data } = await api.get("/user/tickets");
        setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      } catch {
        setTickets([]);
      } finally {
        setTicketsLoading(false);
      }
    };

    loadCatalogs();
    loadPlayers();
    loadMyTickets();
  }, []);

  useEffect(() => {
    if (!ticketTypes.length || !priorityOptions.length) return;

    const requestedType = String(searchParams.get("type") || "").trim().toUpperCase();
    const requestedSubject = String(searchParams.get("subject") || "").trim();

    if (!requestedType && !requestedSubject) return;

    const existsType = ticketTypes.some((item) => String(item?.key || "").toUpperCase() === requestedType);

    setFormData((prev) => ({
      ...prev,
      type: existsType ? requestedType : prev.type,
      subject: requestedSubject || prev.subject,
    }));
  }, [searchParams, ticketTypes, priorityOptions]);

  // ── derived ────────────────────────────────────────────────────────────────
  const typeSelectOptions     = useMemo(() => ticketTypes.map((i)     => ({ value: i.key, label: i.name })), [ticketTypes]);
  const prioritySelectOptions = useMemo(() => priorityOptions.map((i) => ({ value: i.key, label: i.name })), [priorityOptions]);
  const typeMap     = useMemo(() => new Map(ticketTypes.map((i)     => [i.key, i])), [ticketTypes]);
  const priorityMap = useMemo(() => new Map(priorityOptions.map((i) => [i.key, i])), [priorityOptions]);

  const summary = useMemo(() => {
    const total    = tickets.length;
    const abiertos = tickets.filter((t) => t.statusKey === "ABIERTO").length;
    const cerrados = tickets.filter((t) => t.statusKey !== "ABIERTO").length;
    return { total, abiertos, cerrados };
  }, [tickets]);

  const maxReached = summary.abiertos >= 2;

  const filteredPlayers = useMemo(() => {
    const q = String(formData.involvedPlayer || "").trim().toLowerCase();
    return playersCatalog.filter((u) => !q || u.toLowerCase().includes(q)).slice(0, 8);
  }, [playersCatalog, formData.involvedPlayer]);

  // ── handlers formulario ────────────────────────────────────────────────────
  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (maxReached) {
      openAlert({ type: "warning", title: "Límite alcanzado", message: "Tienes 2 tickets abiertos. Espera a que se resuelva alguno." });
      return;
    }
    if (!formData.type || !formData.priority) {
      openAlert({ type: "warning", title: "Catálogos incompletos", message: "No hay catálogos disponibles." });
      return;
    }

    const subject        = formData.subject.trim();
    const involvedPlayer = formData.involvedPlayer.trim();
    const description    = formData.description.trim();
    const coordX = formData.coordX === "" ? null : Number(formData.coordX);
    const coordY = formData.coordY === "" ? null : Number(formData.coordY);
    const coordZ = formData.coordZ === "" ? null : Number(formData.coordZ);

    if (!subject || !description) {
      openAlert({ type: "warning", title: "Campos requeridos", message: "Asunto y descripción son obligatorios." });
      return;
    }

    const hasAnyCoord = [coordX, coordY, coordZ].some((v) => v !== null);
    if (hasAnyCoord && ![coordX, coordY, coordZ].every(Number.isFinite)) {
      openAlert({ type: "warning", title: "Coordenadas inválidas", message: "Si llenas coordenadas, X, Y y Z deben ser numéricas." });
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post("/user/tickets", {
        typeKey: formData.type, priorityKey: formData.priority,
        subject,
        involvedPlayer: involvedPlayer || null,
        coordX,
        coordY,
        coordZ,
        description,
        evidence: formData.evidence.trim() || null,
      });
      setTickets((prev) => [data.ticket, ...prev]);
      setFormData(createInitialForm(ticketTypes, priorityOptions));
    } catch (err) {
      openAlert({ type: "error", title: "No se pudo crear", message: err.response?.data?.message || "No se pudo crear el ticket." });
    } finally {
      setSubmitting(false);
    }
  };

  // ── chat modal ─────────────────────────────────────────────────────────────
  const openChat = useCallback(async (ticket) => {
    // Feedback inmediato en UI: al abrir conversación se considera leído.
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, unreadCount: 0 } : t)));

    setChatTicket(ticket);
    setChatData(null);
    setChatLoading(true);
    try {
      const { data } = await api.get(`/user/tickets/${ticket.id}/messages`);
      setChatData(data);
    } catch {
      setChatData({ ticket, messages: [] });
    } finally {
      setChatLoading(false);
    }
  }, []);

  const closeChat = useCallback(() => { setChatTicket(null); setChatData(null); }, []);

  const handleMessageSent = useCallback((newMsg) => {
    setChatData((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
  }, []);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <section className="min-h-screen py-15 flex items-start justify-center pb-24 min-h-screen h-screen">
      <LoadingOverlay
        isVisible={catalogLoading || ticketsLoading || submitting}
        message={submitting ? "Enviando ticket..." : "Cargando datos..."}
      />
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />
      <div className="w-full px-0 mx-0 text-[var(--ins-text-white)]">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-widest mb-2">
            <span>{currentUser.role}</span><span>/</span>
            <span className="text-[var(--secondary-color)]">Tickets</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Centro de Tickets</h1>
          <p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-3xl leading-relaxed">
            Levanta tickets de soporte, reportes, robo o peticiones usando los catálogos definidos en Gestión.
          </p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Total tickets" value={summary.total} />
          <SummaryCard label="Abiertos"       value={summary.abiertos} color="text-emerald-300" />
          <SummaryCard label="Cerrados"        value={summary.cerrados} color="text-[var(--ins-text-dark)]" />
        </div>

        {/* Cuerpo */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* ── Formulario ── */}
          <form onSubmit={handleSubmit} className="xl:col-span-2 bg-black/10 rounded-3xl p-6 space-y-4 border border-white/10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LifeBuoy size={18} className="text-[var(--secondary-color)]" />
              Nuevo ticket
            </h2>

            {maxReached && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/12 px-4 py-3 text-amber-300 text-sm">
                <Lock size={16} className="flex-shrink-0" />
                Tienes 2 tickets abiertos. Espera a que se resuelvan antes de crear uno nuevo.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-sm">
                <span className="block text-[var(--ins-text-gray)] mb-1 ml-1">Tipo</span>
                <Select value={formData.type} onChange={(v) => handleChange("type", v)} options={typeSelectOptions} className="w-full" disabled={catalogLoading || typeSelectOptions.length === 0 || maxReached} />
              </div>
              <div className="text-sm">
                <span className="block text-[var(--ins-text-gray)] mb-1 ml-1">Prioridad</span>
                <Select value={formData.priority} onChange={(v) => handleChange("priority", v)} options={prioritySelectOptions} className="w-full" disabled={catalogLoading || prioritySelectOptions.length === 0 || maxReached} />
              </div>
            </div>

            {!catalogLoading && (typeSelectOptions.length === 0 || prioritySelectOptions.length === 0) && (
              <p className="text-xs text-amber-300">No hay catálogos de tipos/prioridades activos.</p>
            )}

            <Input label="Asunto" value={formData.subject} onChange={(e) => handleChange("subject", e.target.value)} placeholder="Ej. Me robaron cofres en X Y Z" disabled={maxReached} />

            <div className="relative">
              <Input
                label="Jugador involucrado"
                value={formData.involvedPlayer}
                onChange={(e) => { handleChange("involvedPlayer", e.target.value); setShowPlayerOptions(true); }}
                onFocus={() => setShowPlayerOptions(true)}
                onBlur={() => setTimeout(() => setShowPlayerOptions(false), 120)}
                placeholder="Escribe para filtrar jugadores..."
                disabled={maxReached}
              />
              <UserSearch size={16} className="absolute right-2 top-[40px] text-[var(--ins-text-gray)] pointer-events-none" />
              {showPlayerOptions && filteredPlayers.length > 0 && (
                <div className="absolute z-40 mt-2 w-full max-h-48 overflow-y-auto tdt-scrollbar rounded-xl shadow-lg">
                  {filteredPlayers.map((u) => (
                    <button key={u} type="button" onMouseDown={() => { handleChange("involvedPlayer", u); setShowPlayerOptions(false); }} className="w-full text-left px-3 py-2 text-sm text-[var(--ins-text-white)] hover:bg-white/10 transition-colors">{u}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-black/10 p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-3 text-[var(--ins-text-gray)] text-sm font-semibold">
                <MapPinned size={16} className="text-[var(--secondary-color)]" /> Coordenadas del incidente (opcionales)
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[["coordX","X","0"],["coordY","Y","64"],["coordZ","Z","0"]].map(([field, lbl, ph]) => (
                  <Input key={field} label={lbl} type="number" value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} placeholder={ph} disabled={maxReached} />
                ))}
              </div>
            </div>

            <Textarea label="Descripción" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Cuéntanos lo que pasó con suficiente contexto..." rows={5} disabled={maxReached} />
            <p className="text-xs text-[var(--ins-text-gray)] -mt-2">Si hay más jugadores involucrados, agrégalos en la descripción.</p>

            <Input label="Evidencia (URL opcional)" value={formData.evidence} onChange={(e) => handleChange("evidence", e.target.value)} placeholder="https://..." disabled={maxReached} />

            <Button type="submit" variant="primary" className="w-full bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center justify-center gap-2" disabled={maxReached || submitting || catalogLoading || typeSelectOptions.length === 0 || prioritySelectOptions.length === 0}>
              <Send size={16} /> {submitting ? "Enviando..." : "Enviar ticket"}
            </Button>
          </form>

          {/* ── Lista de tickets ── */}
          <div className="xl:col-span-3 bg-black/10 rounded-3xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquareWarning size={18} className="text-[var(--secondary-color)]" />
              Mis tickets
            </h2>

            {ticketsLoading ? (
              <div className="rounded-2xl bg-black/10 py-10 px-4 text-center text-[var(--ins-text-gray)]">Cargando tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl bg-black/10 py-10 px-4 text-center text-[var(--ins-text-gray)]">Aún no has creado ningún ticket.</div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto tdt-scrollbar pr-1">
                {tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} typeMap={typeMap} priorityMap={priorityMap} onDoubleClick={openChat} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chat modal ── */}
      {chatTicket && (
        <TicketChatModal
          chatData={chatData}
          loading={chatLoading}
          currentUser={currentUser}
          typeMap={typeMap}
          priorityMap={priorityMap}
          onClose={closeChat}
          onMessageSent={handleMessageSent}
          onAlert={openAlert}
        />
      )}
    </section>
  );
}

// ─── SummaryCard ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color = "text-[var(--ins-text-white)]" }) {
  return (
    <div className="bg-black/10 rounded-2xl p-4 border border-white/10">
      <p className="text-xs uppercase tracking-widest text-[var(--ins-text-gray)] font-bold">{label}</p>
      <p className={`text-2xl font-extrabold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

// ─── TicketCard ───────────────────────────────────────────────────────────────
function TicketCard({ ticket, typeMap, priorityMap, onDoubleClick }) {
  const st = statusStyle(ticket.statusKey);
  return (
    <article
      className="rounded-2xl bg-black/10 p-4 border border-white/10 cursor-pointer hover:bg-black/20 transition-colors select-none"
      onDoubleClick={() => onDoubleClick(ticket)}
      title="Doble click para abrir historial"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--ins-text-white)]">{ticket.subject}</h3>
          <p className="text-xs text-[var(--ins-text-gray)] mt-1">
            {new Date(ticket.createdAt).toLocaleString("es-MX")} · #{ticket.id}
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
          <BadgeAmber>{priorityMap.get(ticket.priorityKey)?.name || ticket.priorityKey}</BadgeAmber>
          {ticket.involvedPlayer ? <BadgeSky>Jugador: {ticket.involvedPlayer}</BadgeSky> : null}
          {ticket.coordX !== null && ticket.coordY !== null && ticket.coordZ !== null ? (
            <BadgeSecondary>XYZ: {ticket.coordX}, {ticket.coordY}, {ticket.coordZ}</BadgeSecondary>
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
      <p className="text-xs text-[var(--ins-text-dark)] mt-3 italic">Doble click para abrir historial</p>
    </article>
  );
}

// ─── TicketChatModal ──────────────────────────────────────────────────────────
function TicketChatModal({ chatData, loading, currentUser, typeMap, priorityMap, onClose, onMessageSent, onAlert }) {
  const [newMessage, setNewMessage] = useState("");
  const [sending,    setSending]    = useState(false);
  const bottomRef = useRef(null);

  const ticket   = chatData?.ticket;
  const messages = chatData?.messages ?? [];
  const isOpen   = ticket?.statusKey === "ABIERTO";

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

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !ticket || !isOpen) return;
    try {
      setSending(true);
      const { data } = await api.post(`/user/tickets/${ticket.id}/messages`, { message: text });
      onMessageSent(data.message);
      setNewMessage("");
    } catch (err) {
      onAlert?.({ type: "error", title: "Mensaje no enviado", message: err.response?.data?.message || "No se pudo enviar el mensaje." });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const st = ticket ? statusStyle(ticket.statusKey) : { text:"", border:"", bg:"" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] bg-[var(--ins-background)]/50 backdrop-blur-lg border border-white/10 max-h-[80hv] mt-[-60px]">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 bg-black/10 ">
          <div className="flex-1 min-w-0">
            {ticket ? (
              <>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${st.border} ${st.bg} ${st.text} uppercase tracking-wider`}>{ticket.statusKey}</span>
                  <span className="text-[10px] font-bold text-[var(--ins-text-dark)] uppercase tracking-wider">#{ticket.id}</span>
                </div>
                <h3 className="font-bold text-[var(--ins-text-white)] text-lg leading-tight truncate">{ticket.subject}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge>{typeMap.get(ticket.typeKey)?.name || ticket.typeKey}</Badge>
                  <BadgeAmber>{priorityMap.get(ticket.priorityKey)?.name || ticket.priorityKey}</BadgeAmber>
                  {ticket.involvedPlayer ? <BadgeSky>Jugador: {ticket.involvedPlayer}</BadgeSky> : null}
                  {ticket.coordX !== null && ticket.coordY !== null && ticket.coordZ !== null ? (
                    <BadgeSecondary>XYZ: {ticket.coordX}, {ticket.coordY}, {ticket.coordZ}</BadgeSecondary>
                  ) : null}
                </div>
                {ticket.evidence && (
                  <a href={ticket.evidence} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200">
                    <ShieldAlert size={13} /> Ver evidencia
                  </a>
                )}
              </>
            ) : (
              <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            )}
          </div>
          <button type="button" onClick={onClose} className="flex-shrink-0 p-1.5 rounded-lg text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Historial de mensajes */}
        <div className="flex-1 overflow-y-auto tdt-scrollbar px-6 py-4 space-y-3 min-h-0" style={{ minHeight: "200px" }}>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[var(--ins-text-gray)] text-sm">Cargando historial...</div>
          ) : orderedMessages.length === 0 ? (
            <div className="text-center text-[var(--ins-text-gray)] text-sm py-8">Sin mensajes todavía.</div>
          ) : (
            orderedMessages.map((msg, idx) => {
              const sourceScreen = String(msg?.sourceScreen || "").toUpperCase();
              const authorRole = String(msg?.authorRole || "").toUpperCase();

              // Pantalla TICKETS: lo enviado desde tickets va a la derecha/verde.
              // Mensajes legacy sin bandera: si no son SYSTEM, se consideran del lado tickets.
              const isMine = sourceScreen
                ? sourceScreen === "TICKETS"
                : authorRole !== "SYSTEM";

              const isSystem = sourceScreen === "REPORTS" || authorRole === "SYSTEM";
              return (
                <div key={msg.id ?? idx} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  <span className="text-[10px] text-[var(--ins-text-dark)] mb-1 px-1">
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

        {/* Área de respuesta */}
        <div className="px-6 py-4 bg-black/10 border-t border-white/10">
          {isOpen ? (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para salto de línea)" rows={2} />
              </div>
              <Button type="button" variant="primary" className="flex-shrink-0 bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center gap-1 px-4 py-3" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                <Send size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-white/7 px-4 py-3 text-[var(--ins-text-gray)] text-sm border border-white/10">
              <Lock size={16} className="flex-shrink-0" />
              Este ticket está {ticket?.statusKey?.toLowerCase() || "cerrado"}. No se pueden agregar más mensajes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Badges utilitarios ──────────────────────────────────────────────────────
const Badge          = ({ children }) => <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/10 text-[var(--ins-text-gray)] uppercase tracking-wider">{children}</span>;
const BadgeAmber     = ({ children }) => <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 uppercase tracking-wider">{children}</span>;
const BadgeSky       = ({ children }) => <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-sky-500/15 text-sky-300 tracking-wider">{children}</span>;
const BadgeSecondary = ({ children }) => <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--secondary-color)]/15 text-[var(--secondary-color)] tracking-wider">{children}</span>;

export default Tickets;