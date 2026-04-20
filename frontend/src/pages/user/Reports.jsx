
import { useEffect, useMemo, useState } from "react";
import { LifeBuoy, MapPinned, MessageSquareWarning, Send, ShieldAlert, UserSearch } from "lucide-react";

import api from "../../api/axios";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import Textarea from "../../elements/Textarea";

const TICKET_TYPES = [
  { value: "SOPORTE", label: "Soporte" },
  { value: "REPORTE", label: "Reporte" },
  { value: "REPORTE_ROBO", label: "Reporte de robo" },
  { value: "PETICION", label: "Petición" },
  { value: "BUG", label: "Bug/Error" },
  { value: "OTRO", label: "Otro" },
];

const PRIORITY_OPTIONS = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

const createInitialForm = () => ({
  type: "SOPORTE",
  priority: "MEDIA",
  subject: "",
  involvedPlayer: "",
  coordX: "",
  coordY: "",
  coordZ: "",
  description: "",
  evidence: "",
});

function Reports() {
  const currentUser = {
    username: localStorage.getItem("username") || "Jugador",
    role: localStorage.getItem("role") || "USER",
  };

  const [formData, setFormData] = useState(createInitialForm());
  const [tickets, setTickets] = useState([]);
  const [playersCatalog, setPlayersCatalog] = useState([]);
  const [showPlayerOptions, setShowPlayerOptions] = useState(false);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const { data } = await api.get("/user/players");
        const users = Array.isArray(data?.players) ? data.players : [];
        const usernames = users
          .map((user) => String(user?.username || "").trim())
          .filter(Boolean);
        setPlayersCatalog([...new Set(usernames)]);
      } catch (error) {
        console.error("Players catalog load error:", error);
        setPlayersCatalog([]);
      }
    };

    loadPlayers();
  }, []);

  const ticketSummary = useMemo(() => {
    const total = tickets.length;
    const urgent = tickets.filter((ticket) => ticket.priority === "URGENTE").length;
    const support = tickets.filter((ticket) => ticket.type === "SOPORTE").length;
    return { total, urgent, support };
  }, [tickets]);

  const filteredPlayers = useMemo(() => {
    const query = String(formData.involvedPlayer || "").trim().toLowerCase();
    if (!query) return playersCatalog.slice(0, 8);

    return playersCatalog
      .filter((username) => username.toLowerCase().includes(query))
      .slice(0, 8);
  }, [playersCatalog, formData.involvedPlayer]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const subject = String(formData.subject || "").trim();
    const involvedPlayer = String(formData.involvedPlayer || "").trim();
    const description = String(formData.description || "").trim();
    const evidence = String(formData.evidence || "").trim();

    const coordX = Number(formData.coordX);
    const coordY = Number(formData.coordY);
    const coordZ = Number(formData.coordZ);

    if (!subject || !involvedPlayer || !description) {
      window.alert("Asunto, jugador involucrado y descripción son obligatorios.");
      return;
    }

    if (![coordX, coordY, coordZ].every((value) => Number.isFinite(value))) {
      window.alert("Coordenadas X, Y, Z son obligatorias y deben ser numéricas.");
      return;
    }

    const now = new Date();
    const nextTicket = {
      id: `TMP-${now.getTime()}`,
      type: formData.type,
      priority: formData.priority,
      subject,
      involvedPlayer,
      coordinates: { x: coordX, y: coordY, z: coordZ },
      description,
      evidence,
      status: "ABIERTO",
      createdAt: now.toISOString(),
      createdBy: currentUser.username,
    };

    setTickets((prev) => [nextTicket, ...prev]);
    setFormData(createInitialForm());
  };

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
      <div className="w-full max-w-7xl px-4 md:px-8 text-[var(--ins-text-white)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Tickets</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Centro de Tickets</h1>

            <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-3xl leading-relaxed">
              Levanta tickets de soporte, reportes, robo o peticiones. Esta vista es front-only por ahora y luego la conectamos a backend.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl border border-black/10 p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--ins-text-gray)] font-bold">Total tickets</p>
            <p className="text-2xl font-extrabold mt-2">{ticketSummary.total}</p>
          </div>
          <div className="bg-white/5 rounded-2xl border border-black/10 p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--ins-text-gray)] font-bold">Urgentes</p>
            <p className="text-2xl font-extrabold mt-2 text-red-300">{ticketSummary.urgent}</p>
          </div>
          <div className="bg-white/5 rounded-2xl border border-black/10 p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--ins-text-gray)] font-bold">Soporte</p>
            <p className="text-2xl font-extrabold mt-2 text-emerald-300">{ticketSummary.support}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <form
            onSubmit={handleSubmit}
            className="xl:col-span-2 bg-black/15 rounded-3xl border border-white/10 p-6 space-y-4"
          >
            <h2 className="text-xl font-bold flex items-center gap-2">
              <LifeBuoy size={18} className="text-[var(--secondary-color)]" />
              Nuevo ticket
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="text-sm">
                <span className="block text-[var(--ins-text-gray)] mb-1 ml-1">Tipo</span>
                <Select
                  value={formData.type}
                  onChange={(value) => handleChange("type", value)}
                  options={TICKET_TYPES}
                  className="w-full"
                />
              </div>

              <div className="text-sm">
                <span className="block text-[var(--ins-text-gray)] mb-1 ml-1">Prioridad</span>
                <Select
                  value={formData.priority}
                  onChange={(value) => handleChange("priority", value)}
                  options={PRIORITY_OPTIONS}
                  className="w-full"
                />
              </div>
            </div>

            <Input
              label="Asunto"
              value={formData.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              placeholder="Ej. Me robaron cofres en coordenadas X Y Z"
            />

            <div className="relative">
              <Input
                label="Jugador involucrado"
                value={formData.involvedPlayer}
                onChange={(event) => {
                  handleChange("involvedPlayer", event.target.value);
                  setShowPlayerOptions(true);
                }}
                onFocus={() => setShowPlayerOptions(true)}
                onBlur={() => setTimeout(() => setShowPlayerOptions(false), 120)}
                placeholder="Escribe para filtrar jugadores..."
              />
              <UserSearch size={16} className="absolute right-2 top-[40px] text-[var(--ins-text-gray)] pointer-events-none" />

              {showPlayerOptions && filteredPlayers.length > 0 && (
                <div className="absolute z-40 mt-2 w-full max-h-48 overflow-y-auto tdt-scrollbar rounded-xl border border-white/10 bg-[var(--ins-background)] shadow-lg">
                  {filteredPlayers.map((username) => (
                    <button
                      key={username}
                      type="button"
                      onMouseDown={() => {
                        handleChange("involvedPlayer", username);
                        setShowPlayerOptions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-[var(--ins-text-white)] hover:bg-white/10 transition-colors"
                    >
                      {username}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-center gap-2 mb-3 text-[var(--ins-text-gray)] text-sm font-semibold">
                <MapPinned size={16} className="text-[var(--secondary-color)]" /> Coordenadas del incidente (obligatorias)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="X"
                  type="number"
                  value={formData.coordX}
                  onChange={(event) => handleChange("coordX", event.target.value)}
                  placeholder="0"
                />
                <Input
                  label="Y"
                  type="number"
                  value={formData.coordY}
                  onChange={(event) => handleChange("coordY", event.target.value)}
                  placeholder="64"
                />
                <Input
                  label="Z"
                  type="number"
                  value={formData.coordZ}
                  onChange={(event) => handleChange("coordZ", event.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <Textarea
              label="Descripción"
              value={formData.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Cuéntanos lo que pasó y agrega contexto suficiente para ayudarte más rápido..."
              rows={6}
            />
            <p className="text-xs text-[var(--ins-text-gray)] -mt-2">
              Si hay más jugadores involucrados, agrégalos explícitamente en esta descripción.
            </p>

            <Input
              label="Evidencia (URL opcional)"
              value={formData.evidence}
              onChange={(event) => handleChange("evidence", event.target.value)}
              placeholder="https://..."
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white flex items-center justify-center gap-2"
            >
              <Send size={16} /> Enviar ticket
            </Button>
          </form>

          <div className="xl:col-span-3 bg-black/15 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquareWarning size={18} className="text-[var(--secondary-color)]" />
              Tickets recientes
            </h2>

            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 py-10 px-4 text-center text-[var(--ins-text-gray)]">
                Aún no hay tickets creados en esta sesión.
              </div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto tdt-scrollbar pr-1">
                {tickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[var(--ins-text-white)]">{ticket.subject}</h3>
                        <p className="text-xs text-[var(--ins-text-gray)] mt-1">
                          {new Date(ticket.createdAt).toLocaleString("es-MX")} • {ticket.createdBy}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 uppercase tracking-wider">
                        {ticket.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3 mb-3">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[var(--ins-text-gray)] uppercase tracking-wider">
                        {ticket.type}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 uppercase tracking-wider">
                        {ticket.priority}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 tracking-wider">
                        Jugador: {ticket.involvedPlayer}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-[var(--secondary-color)]/30 bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] tracking-wider">
                        XYZ: {ticket.coordinates?.x}, {ticket.coordinates?.y}, {ticket.coordinates?.z}
                      </span>
                    </div>

                    <p className="text-sm text-[var(--ins-text-gray)] leading-relaxed">{ticket.description}</p>

                    {ticket.evidence && (
                      <a
                        href={ticket.evidence}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
                      >
                        <ShieldAlert size={14} /> Ver evidencia
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Reports;