import { useEffect, useMemo, useState } from "react";
import { X, User, ShieldCheck } from "lucide-react";
import Button from "../elements/Button";
import Select from "../elements/Select";

function UserDetailsModal({
  isOpen,
  user,
  availablePermissions,
  selectedPermissions,
  onTogglePermission,
  onSavePermissions,
  selectedRole,
  roleOptions,
  onRoleChange,
  onSaveRole,
  isSavingRole,
  onClose,
  isSaving,
}) {
  const [activeTab, setActiveTab] = useState("data");

  useEffect(() => {
    if (isOpen) {
      setActiveTab("data");
    }
  }, [isOpen]);

  const orderedPermissions = useMemo(
    () => [...(availablePermissions || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [availablePermissions]
  );

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl rounded-2xl bg-[var(--ins-background)] border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-[var(--ins-text-white)]">{user.username}</h2>
            <p className="text-sm text-[var(--ins-text-gray)]">{user.email}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("data")}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${
                activeTab === "data"
                  ? "bg-white/10 text-[var(--ins-text-white)]"
                  : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <User size={14} /> Datos
              </span>
            </button>

            <button
              onClick={() => setActiveTab("permissions")}
              className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${
                activeTab === "permissions"
                  ? "bg-white/10 text-[var(--ins-text-white)]"
                  : "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)]"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={14} /> Permisos
              </span>
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === "data" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="ID" value={user.id} />
              <InfoRow label="Username" value={user.username} />
              <InfoRow label="Email" value={user.email} />
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--ins-text-gray)]">Rol</p>
                <div className="mt-2 max-w-[260px]">
                  <Select
                    value={selectedRole}
                    onChange={onRoleChange}
                    options={roleOptions}
                    placeholder="Selecciona rol"
                  />
                </div>
              </div>
              <InfoRow label="Estatus" value={user.status} />
              <InfoRow
                label="Registro"
                value={user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {orderedPermissions.length === 0 ? (
                <p className="text-sm text-[var(--ins-text-gray)]">No hay permisos disponibles.</p>
              ) : (
                orderedPermissions.map((permission) => {
                  const enabled = selectedPermissions.includes(permission.key);

                  return (
                    <div
                      key={permission.key}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-[var(--ins-text-white)]">{permission.name}</h4>
                        <p className="text-xs text-[var(--ins-text-gray)]">{permission.key}</p>
                        {permission.description ? (
                          <p className="text-xs text-[var(--ins-text-gray)] mt-1">{permission.description}</p>
                        ) : null}
                      </div>

                      <button
                        onClick={() => onTogglePermission(permission.key)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                          enabled ? "bg-[var(--secondary-color)]" : "bg-white/20"
                        }`}
                        type="button"
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cerrar
          </Button>

          {activeTab === "data" ? (
            <Button variant="primary" size="sm" onClick={onSaveRole} disabled={isSavingRole}>
              {isSavingRole ? "Guardando rol..." : "Guardar rol"}
            </Button>
          ) : null}

          {activeTab === "permissions" ? (
            <Button variant="primary" size="sm" onClick={onSavePermissions} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar permisos"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <p className="text-xs uppercase tracking-wider text-[var(--ins-text-gray)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--ins-text-white)] mt-1">{value || "N/A"}</p>
    </div>
  );
}

export default UserDetailsModal;
