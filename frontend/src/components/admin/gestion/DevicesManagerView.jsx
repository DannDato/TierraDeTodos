import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw, Eye, EyeOff, Search, ShieldAlert, X } from "lucide-react";

import Button from "../../../elements/Button";
import AlertModal from "../../../elements/AlertModal";
import LoadingOverlay from "../../shared/LoadingOverlay";
import CloseButton from "../../../elements/closeButton";
import Select from "../../../elements/Select";
import Table from "../../../elements/Table";
import api from "../../../api/axios";

function DevicesManagerView() {
  const [devices, setDevices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleIpRowIds, setVisibleIpRowIds] = useState(new Set());
  const [detailDevice, setDetailDevice] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });
  const pendingActionRef = useRef(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/devices");
      setDevices(data?.devices || []);
    } catch (error) {
      console.error("Error cargando dispositivos:", error);
      setDevices([]);
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

  const toggleIpVisibility = (deviceId) => {
    const isVisible = visibleIpRowIds.has(deviceId);

    if (!isVisible) {
      openAlert({
        type: "warning",
        title: "Cuidado",
        message: "Cuidado de no filtrar esta informacion",
      });
    }

    setVisibleIpRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) {
        next.delete(deviceId);
      } else {
        next.add(deviceId);
      }
      return next;
    });
  };

  const cropText = (value, max = 40) => {
    const safe = String(value || "").trim();
    if (safe.length <= max) return safe || "N/A";
    return `${safe.slice(0, max)}...`;
  };

  const compactFolio = (folio) => {
    const digits = String(folio || "").replace(/\D/g, "");
    if (!digits) return "N/A";
    return `DV-${digits.slice(-5).padStart(5, "0")}`;
  };

  const authorizationToneMap = {
    PENDING: "text-amber-200 bg-amber-500/15 border-amber-500/30",
    AUTHORIZED: "text-emerald-200 bg-emerald-500/15 border-emerald-500/30",
    DENIED: "text-rose-100 bg-rose-500/20 border-rose-500/40 shadow-[0_0_18px_rgba(244,63,94,0.18)]",
    UNKNOWN: "text-[var(--ins-text-gray)] bg-white/5 border-white/10",
  };

  const openDeviceDetail = async (deviceRow) => {
    try {
      setDetailDevice(deviceRow);
      setDetailData(null);
      setDetailLoading(true);
      const { data } = await api.get(`/admin/devices/${deviceRow.deviceHash}/history`);
      setDetailData(data || null);
    } catch (error) {
      console.error("Error cargando historial del dispositivo:", error);
      openAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "No se pudo cargar el historial del dispositivo.",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAuthorizationUpdated = ({ deviceHash, userId, authorized }) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.deviceHash === deviceHash && Number(device.userId) === Number(userId)
          ? { ...device, authorized }
          : device
      )
    );

    setDetailDevice((prev) => {
      if (!prev) return prev;
      if (prev.deviceHash !== deviceHash || Number(prev.userId) !== Number(userId)) return prev;
      return { ...prev, authorized };
    });

    setDetailData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        usageByUsers: Array.isArray(prev.usageByUsers)
          ? prev.usageByUsers.map((row) =>
              Number(row.userId) === Number(userId) ? { ...row, authorized } : row
            )
          : prev.usageByUsers,
      };
    });
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredDevices = devices.filter((device) => {
    if (!normalizedSearchTerm) return true;

    const haystack = Object.values(device || {})
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");

    return haystack.includes(normalizedSearchTerm);
  });

  const devicesColumns = useMemo(() => ([
    {
      key: "online",
      header: "Online",
      render: (device) => (
        device.isActive ? (
          <span className="inline-flex items-center gap-2 text-emerald-300 text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-[var(--ins-text-gray)] text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--ins-text-gray)]/60" />
            Offline
          </span>
        )
      ),
    },
    {
      key: "folio",
      header: "Folio",
      cellClassName: "text-[var(--ins-text-white)] font-mono text-xs",
      getTitle: (device) => device.folio || "N/A",
      render: (device) => compactFolio(device.folio),
    },
    {
      key: "userAgent",
      header: "User-Agent",
      cellClassName: "text-[var(--ins-text-gray)] text-xs",
      getTitle: (device) => device.userAgent,
      render: (device) => cropText(device.userAgent),
    },
    {
      key: "client",
      header: "Cliente",
      cellClassName: "text-[var(--ins-text-white)] text-xs",
      render: (device) => `${device.browser || "Unknown"} / ${device.os || "Unknown"}`,
    },
    {
      key: "deviceType",
      header: "Tipo",
      cellClassName: "text-[var(--ins-text-gray)] text-xs uppercase",
      render: (device) => device.deviceType || "UNKNOWN",
    },
    {
      key: "authorized",
      header: "Status",
      render: (device) => (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-flex items-center ${authorizationToneMap[device.authorized] || authorizationToneMap.UNKNOWN}`}>
          {device.authorized}
        </span>
      ),
    },
    {
      key: "ipAddress",
      header: "IP",
      cellClassName: "text-[var(--ins-text-white)] text-xs",
      render: (device) => {
        const ipVisible = visibleIpRowIds.has(device.deviceId);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleIpVisibility(device.deviceId);
            }}
            className="inline-flex items-center gap-2 px-2 py-1 rounded bg-[var(--black-color)]/40 border border-[var(--white-color)]/15"
          >
            {ipVisible ? <EyeOff size={12} /> : <Eye size={12} />}
            <span className="font-mono">{ipVisible ? (device.ipAddress || "N/A") : "***.***.***.***"}</span>
          </button>
        );
      },
    },
    {
      key: "username",
      header: "Usuario",
      cellClassName: "text-[var(--ins-text-white)] font-semibold",
      render: (device) => device.username,
    },
    {
      key: "lastLogin",
      header: "Último login",
      cellClassName: "text-[var(--ins-text-white)] text-sm",
      render: (device) => (device.lastLogin ? new Date(device.lastLogin).toLocaleString() : "N/A"),
    },
  ]), [visibleIpRowIds]);

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
          <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)]">Dispositivos Autorizados</h2>
          <p className="text-sm text-[var(--ins-text-gray)] mt-1">Doble clic en una fila para ver detalle e historial.</p>
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

          <Button variant="primary" size="md" className="flex items-center gap-2 self-start shrink-0 whitespace-nowrap" onClick={loadDevices}>
            <RefreshCcw size={16} /> Actualizar
          </Button>
        </div>
      </div>

      <Table
        columns={devicesColumns}
        data={filteredDevices}
        rowKey="deviceId"
        onRowDoubleClick={(row) => openDeviceDetail(row)}
        minWidth="min-w-[920px]"
        emptyColSpan={9}
        emptyMessage={devices.length === 0 ? "No hay dispositivos registrados." : "No hay resultados para la búsqueda."}
      />

      {detailDevice && (
        <DeviceHistoryModal
          device={detailDevice}
          detailData={detailData}
          loading={detailLoading}
          openAlert={openAlert}
          onAuthorizationUpdated={handleAuthorizationUpdated}
          onClose={() => {
            setDetailDevice(null);
            setDetailData(null);
          }}
        />
      )}
    </div>
  );
}

function DeviceHistoryModal({ device, detailData, loading, onClose, openAlert, onAuthorizationUpdated }) {
  const attempts = detailData?.loginAttempts || [];
  const [isIpVisible, setIsIpVisible] = useState(false);
  const [visibleLinkedUserIps, setVisibleLinkedUserIps] = useState(new Set());
  const [visibleAttemptIps, setVisibleAttemptIps] = useState(new Set());
  const [selectedAuthorization, setSelectedAuthorization] = useState(device?.authorized || "PENDING");
  const [isSavingAuthorization, setIsSavingAuthorization] = useState(false);
  const [lastRevokedSessions, setLastRevokedSessions] = useState(0);
  const usageByUsers = detailData?.usageByUsers || [];

  useEffect(() => {
    setSelectedAuthorization(device?.authorized || "PENDING");
    setIsIpVisible(false);
    setVisibleLinkedUserIps(new Set());
    setVisibleAttemptIps(new Set());
    setLastRevokedSessions(0);
  }, [device]);

  const authorizationOptions = [
    { value: "PENDING", label: "Pendiente" },
    { value: "AUTHORIZED", label: "Autorizado" },
    { value: "DENIED", label: "Denegado" },
  ];

  const authorizationToneMap = {
    PENDING: "text-amber-200 bg-amber-500/15 border-amber-500/30",
    AUTHORIZED: "text-emerald-200 bg-emerald-500/15 border-emerald-500/30",
    DENIED: "text-rose-100 bg-rose-500/20 border-rose-500/40 shadow-[0_0_18px_rgba(244,63,94,0.18)]",
    UNKNOWN: "text-[var(--ins-text-gray)] bg-white/5 border-white/10",
  };

  const currentAuthorization = selectedAuthorization || device?.authorized || "UNKNOWN";

  const linkedUsersColumns = [
    {
      key: "username",
      header: "Usuario",
      cellClassName: "text-[var(--ins-text-white)] font-semibold",
      render: (row) => row.username || "unknown-user",
    },
    {
      key: "authorized",
      header: "Estatus",
      render: (row) => (
        <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${authorizationToneMap[row.authorized] || authorizationToneMap.UNKNOWN}`}>
          {row.authorized || "UNKNOWN"}
        </span>
      ),
    },
    {
      key: "registeredIp",
      header: "IP registrada",
      cellClassName: "text-[var(--ins-text-white)] text-xs font-mono",
      render: (row) => {
        const rowKey = `${row.userId}-${row.deviceId || row.username}`;
        return (
          <ProtectedIpValue
            value={row.registeredIp}
            isVisible={visibleLinkedUserIps.has(rowKey)}
            onToggle={() => toggleProtectedIp(rowKey, visibleLinkedUserIps, setVisibleLinkedUserIps)}
          />
        );
      },
    },
    {
      key: "firstLoginAt",
      header: "Primer login",
      cellClassName: "text-[var(--ins-text-white)] text-sm",
      render: (row) => (row.firstLoginAt ? new Date(row.firstLoginAt).toLocaleString() : "N/A"),
    },
    {
      key: "lastLoginAt",
      header: "Último login",
      cellClassName: "text-[var(--ins-text-white)] text-sm",
      render: (row) => (row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "N/A"),
    },
    {
      key: "sessionsCount",
      header: "Inicios",
      cellClassName: "text-[var(--ins-text-white)] text-sm",
      render: (row) => row.sessionsCount ?? 0,
    },
  ];

  const attemptsColumns = [
    {
      key: "username",
      header: "Usuario",
      cellClassName: "text-[var(--ins-text-white)] font-semibold",
      render: (attempt) => attempt.username,
    },
    {
      key: "at",
      header: "Fecha",
      cellClassName: "text-[var(--ins-text-white)] text-sm",
      render: (attempt) => (attempt.at ? new Date(attempt.at).toLocaleString() : "N/A"),
    },
    {
      key: "ip",
      header: "IP",
      cellClassName: "text-[var(--ins-text-white)] text-xs font-mono",
      render: (attempt) => (
        <ProtectedIpValue
          value={attempt.ip}
          isVisible={visibleAttemptIps.has(attempt.id)}
          onToggle={() => toggleProtectedIp(attempt.id, visibleAttemptIps, setVisibleAttemptIps)}
        />
      ),
    },
    {
      key: "userAgent",
      header: "User-Agent",
      cellClassName: "text-[var(--ins-text-gray)] text-xs",
      render: (attempt) => attempt.userAgent || "N/A",
    },
    {
      key: "source",
      header: "Origen",
      cellClassName: "text-[var(--ins-text-gray)] text-xs",
      render: (attempt) => attempt.source || "N/A",
    },
  ];

  const toggleProtectedIp = (key, visibleSet, setter) => {
    const isVisible = visibleSet.has(key);

    if (!isVisible) {
      openAlert?.({
        type: "warning",
        title: "Cuidado",
        message: "Cuidado de no filtrar esta informacion",
      });
    }

    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSaveAuthorization = async () => {
    if (!device?.deviceHash || !device?.userId) return;
    if (currentAuthorization === (device?.authorized || "PENDING")) return;

    try {
      setIsSavingAuthorization(true);
      const { data } = await api.patch(`/admin/devices/${device.deviceHash}/users/${device.userId}/authorization`, {
        authorized: currentAuthorization,
      });

      const revokedSessions = Number(data?.revokedSessions || 0);
      setLastRevokedSessions(revokedSessions);

      onAuthorizationUpdated?.({
        deviceHash: device.deviceHash,
        userId: device.userId,
        authorized: data?.authorized || currentAuthorization,
      });

      openAlert?.({
        type: "success",
        title: "Estatus actualizado",
        message: revokedSessions > 0
          ? `La autorizacion del dispositivo se actualizo correctamente. Se revocaron ${revokedSessions} sesiones activas.`
          : "La autorizacion del dispositivo se actualizo correctamente.",
      });
    } catch (error) {
      setSelectedAuthorization(device?.authorized || "PENDING");
      openAlert?.({
        type: "error",
        title: "No se pudo actualizar",
        message: error.response?.data?.message || "No se pudo actualizar el estatus del dispositivo.",
      });
    } finally {
      setIsSavingAuthorization(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl bg-[var(--ins-background)]/50 backdrop-blur-lg rounded-3xl border border-white/10 overflow-hidden max-h-[80dvh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--white-color)]/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-[var(--ins-text-white)]">Detalle de dispositivo</h3>
            <p className="text-sm text-[var(--ins-text-gray)]">Folio: {detailData?.folio || device.folio || "N/A"}</p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 min-h-0 p-6 space-y-6 overflow-y-auto tdt-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCell label="Hash" value={detailData?.deviceHash || device.deviceHash} mono />
            <InfoCell label="User-Agent completo" value={device.userAgent} />
            <InfoCell label="Fingerprint" value={detailData?.titular?.fingerprintHash || device.fingerprintHash} mono />
            <InfoCell label="Cliente" value={`${detailData?.titular?.browser || device.browser || "Unknown"} / ${detailData?.titular?.os || device.os || "Unknown"}`} />
            <InfoCell label="Plataforma" value={detailData?.titular?.platform || device.platform || "N/A"} />
            <InfoCell label="Tipo de dispositivo" value={detailData?.titular?.deviceType || device.deviceType || "N/A"} />
            <InfoCell label="Zona horaria" value={detailData?.titular?.timezone || device.timezone || "N/A"} />
            <InfoCell label="Resolución" value={detailData?.titular?.screenResolution || device.screenResolution || "N/A"} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] gap-4 items-start">
            <div className="rounded-2xl bg-[var(--black-color)]/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)]">IP registrada</p>
                <button
                  type="button"
                  onClick={() => setIsIpVisible((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 text-[var(--ins-text-white)] text-xs"
                >
                  {isIpVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                  {isIpVisible ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <div className="mt-4 rounded-xl border border-[var(--white-color)]/10 bg-[var(--black-color)]/20 px-4 py-3">
                <p className="text-sm text-[var(--ins-text-white)] font-mono break-all">
                  {isIpVisible ? (detailData?.titular?.registeredIp || device.ipAddress || "N/A") : "***.***.***.***"}
                </p>
              </div>
            </div>

            <div className={`min-w-0 rounded-2xl p-4 ${currentAuthorization === "DENIED" ? "bg-rose-500/10 border border-rose-500/20" : "bg-[var(--black-color)]/20"}`}>
              <div className="grid grid-cols-2 gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)]">Administrar Estatus</p>
                {/* <p className="text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)]">Cambiar estatus</p> */}
              </div>
              <div className="flex items-center justify-between gap-3 mt-4">
                <span className={`inline-flex items-center justify-center text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap mt-5 ${authorizationToneMap[currentAuthorization] || authorizationToneMap.UNKNOWN}`}>
                  {currentAuthorization}
                </span>
                <Select
                  value={selectedAuthorization}
                  onChange={setSelectedAuthorization}
                  options={authorizationOptions}
                  placeholder="Selecciona estatus"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAuthorization}
                  disabled={isSavingAuthorization || currentAuthorization === (device?.authorized || "PENDING")}
                  className="whitespace-nowrap mt-5"
                >
                  {isSavingAuthorization ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>

          {lastRevokedSessions > 0 && currentAuthorization === "DENIED" && (
            <div className="rounded-2xl border border-rose-500/35 bg-rose-500/15 px-4 py-3 text-sm text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.12)]">
              Se revocaron {lastRevokedSessions} sesiones activas asociadas a este dispositivo al cambiarlo a DENIED.
            </div>
          )}

          {currentAuthorization === "DENIED" && (
            <div className="rounded-2xl border border-rose-500/35 bg-rose-500/15 px-4 py-3 text-sm text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.12)] inline-flex items-center gap-2">
              <ShieldAlert size={16} />
              El dispositivo queda bloqueado para futuros inicios de sesión mientras permanezca en estado DENIED.
            </div>
          )}

          <div className="bg-[var(--black-color)]/20 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--white-color)]/10 flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-[var(--ins-text-white)] uppercase tracking-wider">Usuarios vinculados</h4>
              <span className="text-xs font-mono px-2 py-1 rounded-full bg-white/5 text-[var(--ins-text-gray)]">
                {usageByUsers.length} registros
              </span>
            </div>

            {usageByUsers.length === 0 ? (
              <div className="py-8 text-center text-[var(--ins-text-gray)]">No hay relaciones de usuario registradas para este dispositivo.</div>
            ) : (
              <Table
                columns={linkedUsersColumns}
                data={usageByUsers}
                rowKey={(row) => `${row.userId}-${row.deviceId || row.username}`}
                minWidth="min-w-[820px]"
                layout="embedded"
                preset="compactMuted"
              />
            )}
          </div>

          <div className="bg-[var(--black-color)]/20 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--white-color)]/10">
              <h4 className="text-sm font-bold text-[var(--ins-text-white)] uppercase tracking-wider">Historial de inicios de sesión</h4>
            </div>

            {loading ? (
              <div className="py-8 text-center text-[var(--ins-text-gray)]">Cargando historial...</div>
            ) : attempts.length === 0 ? (
              <div className="py-8 text-center text-[var(--ins-text-gray)]">No hay inicios de sesión registrados para este dispositivo.</div>
            ) : (
              <Table
                columns={attemptsColumns}
                data={attempts}
                rowKey="id"
                  minWidth="min-w-[980px]"
                layout="embedded"
                preset="compactMuted"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedIpValue({ value, isVisible, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 px-2 py-1 rounded bg-[var(--black-color)]/40 border border-[var(--white-color)]/15"
      title={isVisible ? "Ocultar IP" : "Mostrar IP"}
    >
      {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
      <span className="font-mono">{isVisible ? (value || "N/A") : "***.***.***.***"}</span>
    </button>
  );
}

function InfoCell({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl bg-[var(--black-color)]/20 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)] mb-1">{label}</p>
      <p className={`text-sm text-[var(--ins-text-white)] break-all ${mono ? "font-mono" : ""}`}>{value || "N/A"}</p>
    </div>
  );
}

export default DevicesManagerView;
