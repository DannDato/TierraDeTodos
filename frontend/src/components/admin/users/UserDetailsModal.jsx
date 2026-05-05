import { useEffect, useMemo, useState } from "react";
import {
  X,
  User,
  ShieldCheck,
  Mail,
  Calendar,
  Activity,
  Key,
  Info,
  Smartphone
} from "lucide-react";
import Button from "../../../elements/Button";
import Select from "../../../elements/Select";
import Table from "../../../elements/Table";
import Tabbar from "../../../elements/Tabbar";
import CloseButton from "../../../elements/closeButton";
import InfoRow from "../../../elements/InfoRow";
import Credencial from "../../user/Credencial";

function UserDetailsModal({
  isOpen,
  user,
  availablePermissions,
  selectedPermissions,
  onTogglePermission,
  onSavePermissions,

  // Props de Role
  selectedRole,
  roleOptions,
  onRoleChange,
  onSaveRole,
  isSavingRole,

  // Nuevas Props de Estatus
  selectedStatus,
  statusOptions,
  onStatusChange,
  statusReason,
  onStatusReasonChange,
  originalStatus,

  onClose,
  isSaving,
}) {
  const [activeTab, setActiveTab] = useState("data");
  const [permissionSearch, setPermissionSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("data");
      setPermissionSearch("");
    }
  }, [isOpen]);

  const orderedPermissions = useMemo(
    () => [...(availablePermissions || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [availablePermissions]
  );

  const filteredPermissions = useMemo(() => {
    const q = permissionSearch.trim().toLowerCase();
    if (!q) return orderedPermissions;
    return orderedPermissions.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.key?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [orderedPermissions, permissionSearch]);
  const selectedRoleOption = useMemo(
    () => (roleOptions || []).find((option) => option.value === selectedRole) || null,
    [roleOptions, selectedRole]
  );

  const selectedStatusOption = useMemo(
    () => (statusOptions || []).find((option) => option.value === selectedStatus) || null,
    [statusOptions, selectedStatus]
  );

  const statusColorMap = useMemo(() => {
    const map = {};
    for (const option of statusOptions || []) {
      if (option?.value && option?.color) map[option.value] = option.color;
    }
    return map;
  }, [statusOptions]);

  const toRgba = (hexColor, alpha) => {
    const normalized = typeof hexColor === "string" ? hexColor.trim().replace("#", "") : "";
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return `rgba(41, 208, 150, ${alpha})`;
    }

    const r = Number.parseInt(normalized.slice(0, 2), 16);
    const g = Number.parseInt(normalized.slice(2, 4), 16);
    const b = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const statusHistory = user?.statusHistory || [];
  const devicesHistory = user?.devices || [];

  if (!isOpen || !user) return null;

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "?";
  const currentStatus = selectedStatus || user.status || "INACTIVE";
  const currentStatusColor = statusColorMap[currentStatus] || "#8a8a8a";
  const currentStatusForCredential = {
    label: currentStatus,
    color: currentStatusColor
  };
  const credentialAvatarPreview = user?.avatarUrl || null;
  const credentialAvatarPosX = Number.isFinite(Number(user?.avatarPosX)) ? Number(user.avatarPosX) : 50;
  const credentialAvatarPosY = Number.isFinite(Number(user?.avatarPosY)) ? Number(user.avatarPosY) : 50;
  const credentialAvatarZoom = Number.isFinite(Number(user?.avatarZoom)) ? Number(user.avatarZoom) : 1;
  const credentialAvatarStyle = {
    objectPosition: `${credentialAvatarPosX}% ${credentialAvatarPosY}%`,
    transform: `scale(${credentialAvatarZoom})`
  };

  const getStatusTone = (status) => {
    const color = statusColorMap[status] || "#8a8a8a";
    return {
      color,
      textStyle: { color },
      bgStyle: { backgroundColor: toRgba(color, 0.12) },
      dotStyle: { backgroundColor: color },
      borderStyle: { border: `1px solid ${toRgba(color, 0.25)}` }
    };
  };

  const statusHistoryColumns = [
    {
      key: "createdAt",
      header: "Fecha",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (entry) => (entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "N/A"),
    },
    {
      key: "oldStatus",
      header: "Anterior",
      cellClassName: "font-mono whitespace-nowrap",
      render: (entry) => (
        <span style={{ color: getStatusTone(entry.oldStatus).color }}>
          {entry.oldStatus || "N/A"}
        </span>
      ),
    },
    {
      key: "newStatus",
      header: "Nuevo",
      cellClassName: "font-mono whitespace-nowrap",
      render: (entry) => (
        <span style={{ color: getStatusTone(entry.newStatus).color }}>
          {entry.newStatus || "N/A"}
        </span>
      ),
    },
    {
      key: "changedBy",
      header: "Por",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (entry) => entry.changedByUsername || `ID ${entry.changedBy || "N/A"}`,
    },
    {
      key: "reason",
      header: "Motivo",
      cellClassName: "text-[var(--ins-text-gray)] min-w-[220px]",
      render: (entry) => entry.reason || "Sin motivo registrado",
    },
  ];

  const devicesColumns = [
    {
      key: "folio",
      header: "Folio",
      cellClassName: "text-[var(--ins-text-white)] font-mono text-xs",
      render: (device) => device.folio || "N/A",
    },
    {
      key: "deviceHash",
      header: "Hash",
      cellClassName: "text-[var(--ins-text-gray)] font-mono text-xs break-all",
      render: (device) => device.deviceHash,
    },
    {
      key: "authorized",
      header: "Estado",
      cellClassName: "text-[var(--ins-text-white)]",
      render: (device) => device.authorized,
    },
    {
      key: "firstLogin",
      header: "Primer uso",
      cellClassName: "text-[var(--ins-text-white)]",
      render: (device) => (device.firstLogin ? new Date(device.firstLogin).toLocaleString() : "N/A"),
    },
    {
      key: "lastLogin",
      header: "Último uso",
      cellClassName: "text-[var(--ins-text-white)]",
      render: (device) => (device.lastLogin ? new Date(device.lastLogin).toLocaleString() : "N/A"),
    },
  ];

  const desktopTabs = [
    { id: "data", label: "Datos Generales", icon: <User size={16} />, activeIconClassName: "text-[var(--secondary-color)]", labelClassName: "hidden lg:inline" },
    { id: "permissions", label: "Permisos", icon: <ShieldCheck size={16} />, activeIconClassName: "text-[var(--streammer-color)]", labelClassName: "hidden lg:inline" },
    { id: "devices", label: "Dispositivos", icon: <Smartphone size={16} />, activeIconClassName: "text-[var(--secondary-color)]", labelClassName: "hidden lg:inline" },
  ];

  const mobileTabs = [
    { id: "data", label: "Datos Generales", icon: <User size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
    { id: "permissions", label: "Permisos", icon: <ShieldCheck size={16} />, activeIconClassName: "text-[var(--streammer-color)]" },
    { id: "devices", label: "Dispositivos", icon: <Smartphone size={16} />, activeIconClassName: "text-[var(--secondary-color)]" },
  ];

  return (
    // Contenedor principal fijo al viewport util, respetando el alto del menubar
    <div className="fixed inset-x-0 top-0 bottom-16 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[var(--black-color)]/60 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-6xl h-[calc(100%-2rem)] sm:h-[calc(100%-3rem)] max-h-[820px] flex flex-col rounded-3xl bg-[var(--ins-background)]/50 backdrop-blur-lg border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transform transition-all animate-[slideUp_0.3s_ease-out]">
        <div className="relative flex-shrink-0 px-8 py-6 bg-[var(--white-color)]/[0.02] overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[var(--secondary-color)]/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 relative z-10">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--secondary-color)] to-[var(--streammer-color)] flex items-center justify-center shadow-lg shadow-[var(--secondary-color)]/20 flex-shrink-0">
                <span className="text-2xl font-black text-white drop-shadow-md">{userInitial}</span>
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
                  {user.username}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{ color: currentStatusColor, backgroundColor: toRgba(currentStatusColor, 0.12) }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentStatusColor }}></span>
                    {currentStatus}
                  </span>
                  <span className="text-xs text-[var(--ins-text-gray)] flex items-center gap-1 font-mono">
                    <Key size={12} /> ID: {user.id || "001"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex justify-center pt-1">
              <Tabbar tabs={desktopTabs} activeTab={activeTab} onChange={setActiveTab} variant="glass" size="lg" />
            </div>

            <div className="flex justify-end">
              <CloseButton onClick={onClose} />
            </div>
          </div>
        </div>

        {/* TABS móvil */}
        <div className="lg:hidden md:hidden flex-shrink-0 px-8 pt-6 pb-2">
          <Tabbar tabs={mobileTabs} activeTab={activeTab} onChange={setActiveTab} variant="glass" />
        </div>

        {/* Contenedor pestaña */}
        <div className="flex-1 min-h-0 p-8 pt-4 overflow-y-auto tdt-scrollbar">
          {activeTab === "data" ? (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                <div className="xl:col-span-2">
                  <Credencial
                    user={user}
                    currentStatus={currentStatusForCredential}
                    isInactiveStatus={String(currentStatus).toUpperCase() === "INACTIVE"}
                    isCancelledStatus={String(currentStatus).toUpperCase() === "BANNED"}
                    avatarPreview={credentialAvatarPreview}
                    avatarImageStyle={credentialAvatarStyle}
                    readOnly
                  />
                </div>

                <div className="xl:col-span-3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow icon={<Mail size={18} />} label="Correo Electrónico" value={user.email} />
                    <InfoRow
                      icon={<Calendar size={18} />}
                      label="Fecha de Registro"
                      value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-black/20 p-5 flex flex-col justify-center relative z-20">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)] mb-3 flex items-center gap-2">
                        <ShieldCheck size={14} /> Nivel de rol
                      </p>
                      <Select
                        value={selectedRole}
                        onChange={onRoleChange}
                        options={roleOptions}
                        placeholder="Selecciona un role"
                      />
                      {selectedRoleOption?.color && (
                        <span
                          className="inline-flex w-fit mt-3 text-xs font-bold px-3 py-1 rounded-full"
                          style={{
                            color: selectedRoleOption.color,
                            backgroundColor: toRgba(selectedRoleOption.color, 0.12),
                            border: `1px solid ${toRgba(selectedRoleOption.color, 0.25)}`
                          }}
                        >
                          {selectedRoleOption.label}
                        </span>
                      )}
                    </div>

                    <div className="rounded-2xl bg-black/20 p-5 flex flex-col justify-center relative z-20">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)] mb-3 flex items-center gap-2">
                        <Activity size={14} /> Estatus de Cuenta
                      </p>
                      <Select
                        value={selectedStatus}
                        onChange={onStatusChange}
                        options={statusOptions || []}
                        placeholder="Selecciona estatus"
                      />
                      {selectedStatusOption?.color && (
                        <span
                          className="inline-flex w-fit mt-3 text-xs font-bold px-3 py-1 rounded-full"
                          style={{
                            color: selectedStatusOption.color,
                            backgroundColor: toRgba(selectedStatusOption.color, 0.12),
                            border: `1px solid ${toRgba(selectedStatusOption.color, 0.25)}`
                          }}
                        >
                          {selectedStatusOption.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedStatus && originalStatus && selectedStatus !== originalStatus && (
                    <div className="rounded-2xl bg-black/20 p-5 flex flex-col gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--ins-text-gray)] flex items-center gap-2">
                        <Activity size={14} /> Motivo del cambio de estatus
                        <span className="ml-1 font-mono" style={{ color: getStatusTone(selectedStatus).color }}>{originalStatus} → {selectedStatus}</span>
                      </p>
                      <textarea
                        value={statusReason || ""}
                        onChange={(e) => onStatusReasonChange(e.target.value)}
                        placeholder="Describe el motivo del cambio de estatus..."
                        rows={2}
                        className="w-full bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 rounded-xl px-4 py-2.5 text-sm text-[var(--ins-text-white)] placeholder:text-[var(--ins-text-gray)] resize-none outline-none focus:border-[var(--secondary-color)]/60 transition-colors"
                      />
                    </div>
                  )}

                  <div className="rounded-2xl bg-[var(--black-color)]/20 overflow-hidden">
                    <div className="px-5 py-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-gray)]">Historial del usuario</p>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-gray)]">
                        {statusHistory.length} registros
                      </span>
                    </div>

                    {statusHistory.length === 0 ? (
                      <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-gray)]">
                        No hay movimientos de estatus registrados para este usuario.
                      </div>
                    ) : (
                      <Table
                        columns={statusHistoryColumns}
                        data={statusHistory}
                        rowKey="id"
                        minWidth="min-w-[680px]"
                        layout="embedded"
                        preset="compact"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "permissions" ? (
            // Pestaña de Permisos
            <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
              <div className="relative">
                <input
                  type="text"
                  value={permissionSearch}
                  onChange={(e) => setPermissionSearch(e.target.value)}
                  placeholder="Buscar permiso..."
                  className="w-full bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 rounded-xl px-4 py-2.5 text-sm text-[var(--ins-text-white)] placeholder:text-[var(--ins-text-gray)] focus:outline-none focus:border-[var(--secondary-color)]/50 transition-colors"
                />
                {permissionSearch && (
                  <button
                    type="button"
                    onClick={() => setPermissionSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              {orderedPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--ins-text-gray)] bg-[var(--black-color)]/20 rounded-2xl">
                  <Info size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">No hay permisos disponibles para asignar.</p>
                </div>
              ) : filteredPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-[var(--ins-text-gray)] bg-[var(--black-color)]/20 rounded-2xl">
                  <Info size={32} className="mb-3 opacity-50" />
                  <p className="text-sm font-medium">Sin resultados para &ldquo;{permissionSearch}&rdquo;.</p>
                </div>
              ) : (
                filteredPermissions.map((permission) => {
                  const enabled = selectedPermissions.includes(permission.key);

                  return (
                    <div
                      key={permission.key}
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                        enabled
                          ? "bg-[var(--secondary-color)]/5 border-[var(--secondary-color)]/30"
                          : "bg-[var(--white-color)]/5 border-[var(--white-color)]/5 hover:border-[var(--white-color)]/10 hover:bg-[var(--white-color)]/10"
                      }`}
                    >
                      <div className="pr-4">
                        <h4 className={`text-sm font-bold transition-colors ${enabled ? "text-[var(--ins-text-white)]" : "text-[var(--ins-text-gray)] group-hover:text-[var(--ins-text-white)]"}`}>
                          {permission.name}
                        </h4>
                        <p className="text-[10px] font-mono mt-1 px-1.5 py-0.5 rounded bg-[var(--black-color)]/30 inline-block text-[var(--ins-text-gray)]">
                          {permission.key}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-[var(--ins-text-gray)] mt-2 leading-relaxed">
                            {permission.description}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => onTogglePermission(permission.key)}
                        className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${
                          enabled ? "bg-[var(--secondary-color)] shadow-[0_0_10px_var(--secondary-color)]" : "bg-[var(--black-color)]/50 "
                        }`}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-[var(--white-color)] transition-transform duration-300 shadow-sm ${
                            enabled ? "translate-x-6" : "translate-x-1 opacity-70"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
              <div className="rounded-2xl bg-[var(--black-color)]/20 overflow-hidden">
                <Table
                  columns={devicesColumns}
                  data={devicesHistory}
                  rowKey={(device) => `${device.deviceId}-${device.deviceHash}`}
                  minWidth="min-w-[760px]"
                  emptyColSpan={5}
                  emptyMessage="No hay dispositivos registrados para esta cuenta."
                  layout="embedded"
                  preset="compact"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 px-8 py-5 bg-[var(--black-color)]/20 border-t border-[var(--white-color)]/10 flex items-center justify-end gap-3 backdrop-blur-md">
          {/* <Button variant="secondary" size="md" onClick={onClose} className="hover:bg-[var(--white-color)]/10 border-[var(--white-color)]/10">
            Cancelar
          </Button> */}

          {activeTab === "data" ? (
            <Button variant="primary" size="md" onClick={onSaveRole} disabled={isSavingRole} className="shadow-lg shadow-[var(--secondary-color)]/20">
              {isSavingRole ? (
                <span className="flex items-center gap-2"><Activity size={16} className="animate-spin" /> Guardando...</span>
              ) : "Guardar Datos"}
            </Button>
          ) : activeTab === "permissions" ? (
            <Button variant="primary" size="md" onClick={onSavePermissions} disabled={isSaving} className="shadow-lg shadow-[var(--secondary-color)]/20">
              {isSaving ? (
                <span className="flex items-center gap-2"><Activity size={16} className="animate-spin" /> Guardando...</span>
              ) : "Guardar Permisos"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default UserDetailsModal;