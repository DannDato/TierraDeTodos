import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleDashed, Copy, Search, X } from "lucide-react";

import api from "../../api/axios";
import Table from "../../elements/Table";
import LoadingOverlay from "../../components/shared/LoadingOverlay";

function Commands() {
  const currentUser = {
    role: localStorage.getItem("role") || "USER",
    username: localStorage.getItem("username") || "Jugador",
  };

  const [loadingCommands, setLoadingCommands] = useState(true);
  const [commands, setCommands] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedCommandId, setExpandedCommandId] = useState(null);
  const [copiedCommandId, setCopiedCommandId] = useState(null);
  const didFetchRef = useRef(false);
  const rowClickTimeoutRef = useRef(null);
  const copiedResetTimeoutRef = useRef(null);

  const copyCommand = async (command, id) => {
    const value = String(command || "").trim();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
    } catch (_error) {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedCommandId(id);
    if (copiedResetTimeoutRef.current) {
      clearTimeout(copiedResetTimeoutRef.current);
    }
    copiedResetTimeoutRef.current = setTimeout(() => setCopiedCommandId(null), 1200);
  };

  const handleRowClick = (id) => {
    if (rowClickTimeoutRef.current) {
      clearTimeout(rowClickTimeoutRef.current);
    }

    // Delay short click to avoid conflict with row double click (copy action)
    rowClickTimeoutRef.current = setTimeout(() => {
      setExpandedCommandId((prev) => (prev === id ? null : id));
    }, 200);
  };

  const handleRowDoubleClick = (command, id) => {
    if (rowClickTimeoutRef.current) {
      clearTimeout(rowClickTimeoutRef.current);
    }
    copyCommand(command, id);
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    const loadCommands = async () => {
      try {
        setLoadingCommands(true);
        const { data } = await api.get("/user/commands");
        const payload = Array.isArray(data) ? data : data?.commands;
        setCommands(Array.isArray(payload) ? payload : []);
      } catch (_error) {
        setCommands([]);
      } finally {
        setLoadingCommands(false);
      }
    };

    loadCommands();

    return () => {
      if (rowClickTimeoutRef.current) {
        clearTimeout(rowClickTimeoutRef.current);
      }
      if (copiedResetTimeoutRef.current) {
        clearTimeout(copiedResetTimeoutRef.current);
      }
    };
  }, []);

  const filteredCommands = useMemo(() => {
    const q = String(search || "").trim().toLowerCase();
    if (!q) return commands;

    return commands.filter((item) => {
      const detailsText = String(item?.details || "");
      return (
        String(item?.id || "").toLowerCase().includes(q) ||
        String(item?.command || "").toLowerCase().includes(q) ||
        String(item?.description || "").toLowerCase().includes(q) ||
        detailsText.toLowerCase().includes(q)
      );
    });
  }, [commands, search]);

  const commandColumns = [
    {
      key: "id",
      header: "ID",
      cellClassName: "font-mono text-xs",
    },
    {
      key: "command",
      header: "Comando",
      cellClassName: "font-mono",
    },
    {
      key: "description",
      header: "Descripción",
      cellClassName: "text-[var(--ins-text-gray)]",
    },
    {
      key: "copy",
      header: "Copiar",
      headerClassName: "text-center",
      cellClassName: "text-center",
      render: (item) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            copyCommand(item.command, item.id);
          }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/15 bg-black/20 hover:bg-black/35 hover:border-white/30 transition-colors"
          title="Copiar comando"
          aria-label="Copiar comando"
        >
          {copiedCommandId === item.id ? (
            <Check size={14} className="text-emerald-300" />
          ) : (
            <Copy size={14} className="text-[var(--ins-text-gray)]" />
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen h-screen py-15 flex items-start justify-center pb-24 text-[var(--white-color)] z-[1]">
      <LoadingOverlay isVisible={loadingCommands} message="Cargando comandos" />

      <div className="w-full px-0 mx-0 text-[var(--ins-text-white)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Comandos</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Tus comandos
            </h1>
            <p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-3xl leading-relaxed">
              Son los comandos que puedes utiizar dentro del juego segun tus permisos en Tierra de Todos. Haz click en cada comando para ver su explicación completa.
            </p>
          </div>

          <div className="relative w-full md:w-[360px]">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ID, comando o descripción..."
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-black/20 border border-[var(--white-color)]/10 text-sm text-white placeholder:text-white/45 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/45 transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" size={18} />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="box-main p-6">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-xl font-bold mb-0 flex items-center gap-2 text-[var(--ins-text-white)]">
              <CircleDashed size={24} style={{ color: "var(--secondary-color)" }} />
              Lista de comandos
            </h2>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-gray)]">
              {filteredCommands.length} resultado(s)
            </span>
          </div>

          <div className=" p-6">
            <Table
              columns={commandColumns}
              data={filteredCommands}
              rowKey="id"
              minWidth="min-w-[720px]"
              layout="embedded"
              preset="compact"
              emptyColSpan={4}
              emptyMessage="No se encontraron comandos con ese filtro."
              onRowClick={(item) => handleRowClick(item.id)}
              onRowDoubleClick={(item) => handleRowDoubleClick(item.command, item.id)}
              isRowExpanded={(item) => expandedCommandId === item.id}
              renderExpandedRow={(item) => (
                <>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--ins-text-gray)] mb-1">
                    Explicación completa de <span className="pl-5 text-[var(--ins-text-white)] font-mono normal-case tracking-normal">{item.command}</span>
                  </p>
                  <p className="text-xs text-[var(--ins-text-gray)] mb-3 leading-relaxed">
                    Si tienes dudas, copia el comando exactamente como aparece y úsalo dentro del chat del juego. Esta sección te dice cuándo conviene usarlo y qué esperar al ejecutarlo.
                  </p>
                  <p className="text-sm text-[var(--ins-text-white)] whitespace-pre-wrap leading-relaxed">
                    {String(item.details || "Sin explicación adicional para este comando.")}
                  </p>
                </>
              )}
              expandedRowClassName="border-t border-[var(--white-color)]/5 bg-white/10 animate-[fadeIn_0.22s_ease-out]"
              expandedRowCellClassName="px-5 py-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Commands;