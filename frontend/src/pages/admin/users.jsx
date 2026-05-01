import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  LogOut,
  Search,
  Eye,
  Ban,
  Mail,
  X,
} from "lucide-react";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";

import api from "../../api/axios";

import UserDetailsModal from "../../components/UserDetailsModal";
import LoadingOverlay from "../../components/LoadingOverlay";
import AlertModal from "../../elements/AlertModal";

// const roleOptions = [
//   { value: "TODOS", label: "Role: Todos" },
//   { value: "MOD", label: "Moderador" },
//   { value: "POLICE", label: "Policía" },
//   { value: "STREAMER", label: "Streamer" },
//   { value: "USER", label: "Usuario" },
// ];

function Users() {
  const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };

  const roleOptionsDefault = [{ value: "TODOS", label: "Role: Todos", color: null }];
  const statusOptionsDefault = [{ value: "TODOS", label: "Estatus: Todos", color: null }];

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [roleOptions, setRoleOptions] = useState(roleOptionsDefault);
  const [statusOptions, setStatusOptions] = useState(statusOptionsDefault);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });
  const pendingActionRef = useRef(null);

  useEffect(() => {
    loadUsers();
  }, []);


  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      const { data } = await api.get("/admin/users");
      setUsers(data?.users || []);

      const dynamicRoleOptions = Array.isArray(data?.allRoles)
        ? data.allRoles.map((role) => ({
            value: role?.role,
            label: role?.role || role?.detail,
            color: role?.color || null,
          }))
        : [];

      const dynamicStatusOptions = Array.isArray(data?.allStatuses)
        ? data.allStatuses.map((s) => ({
            value: s?.status,
            label: s?.detail || s?.status,
            color: s?.color || null,
          }))
        : [];

      setRoleOptions([...roleOptionsDefault, ...dynamicRoleOptions]);
      setStatusOptions([...statusOptionsDefault, ...dynamicStatusOptions]);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
      setRoleOptions(roleOptionsDefault);
      setLoadError(error.response?.data?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyUserDetailsState = (userId, data) => {
    const detailedUser = data?.user || null;

    setSelectedUserId(userId);
    setSelectedUser(detailedUser);
    setAvailablePermissions(data?.availablePermissions || []);
    setAvailableRoles(data?.availableRoles || []);
    setAvailableStatuses(data?.availableStatuses || []);
    setSelectedPermissions(detailedUser?.permissions || []);
    setSelectedRole(detailedUser?.role || "");
    setSelectedStatus(detailedUser?.status || "");
  };

  const loadUserDetails = async (userId) => {
    const { data } = await api.get(`/admin/user/${userId}`);
    applyUserDetailsState(userId, data);
    return data;
  };

  const openUserDetails = async (userId) => {
    try {
      await loadUserDetails(userId);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const banUserbyId = async (userId,userRole) => {
    console.log(`Intentando banear al usuario con ID ${userId} y rol ${userRole}`);
    try {
      await api.patch(`/admin/user/${userId}/details`, {
        status: "BANNED",
        reason: "Baneado por moderación desde panel admin",
        role:userRole
      });
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, status: "BANNED", statusColor: statusColorMap["BANNED"] || user.statusColor || null }
            : user
        )
      );
    } catch (error) {
      console.error("Error banning user:", error);
      openAlert({
        type: "error",
        title: "Error al banear usuario",
        message: error.response?.data?.message || "No se pudo banear al usuario.",
      });
    }
  }

  const closeUserDetails = () => {
    setIsDetailsOpen(false);
    setSelectedUserId(null);
    setSelectedUser(null);
    setAvailablePermissions([]);
    setAvailableRoles([]);
    setAvailableStatuses([]);
    setSelectedPermissions([]);
    setSelectedRole("");
    setSelectedStatus("");
    setStatusReason("");
    setIsSavingPermissions(false);
    setIsSavingRole(false);
  };

  const handleTogglePermission = (permissionKey) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionKey)
        ? prev.filter((key) => key !== permissionKey)
        : [...prev, permissionKey]
    );
  };

  const openAlert = ({ type = "info", title = "Aviso", message = "", onConfirm = null }) => {
    pendingActionRef.current = onConfirm;
    setAlertConfig({
      isOpen: true,
      type,
      title,
      message,
    });
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

  const savePermissions = async () => {
    if (!selectedUserId) return;

    try {
      setIsSavingPermissions(true);
      await api.patch(`/admin/user/${selectedUserId}/permissions`, {
        permissionKeys: selectedPermissions,
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUserId ? { ...user, permissions: selectedPermissions } : user
        )
      );

      await loadUserDetails(selectedUserId);
    } catch (error) {
      console.error("Error saving permissions:", error);
      openAlert({
        type: "error",
        title: "Error al guardar permisos",
        message: error.response?.data?.message || "No se pudieron guardar los permisos del usuario.",
      });
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) return;

    openAlert({
      type: "warning",
      title: "Confirmar cambios de permisos",
      message: "¿Deseas aplicar estos cambios de permisos al usuario?",
      onConfirm: savePermissions,
    });
  };

  const saveUserData = async () => {
    if (!selectedUserId || !selectedRole || !selectedStatus) return;

    const roleChanged = selectedRole !== selectedUser?.role;
    const statusChanged = selectedStatus !== selectedUser?.status;

    if (!roleChanged && !statusChanged) {
      openAlert({
        type: "info",
        title: "Sin cambios",
        message: "No hay cambios en rol o estatus para guardar.",
      });
      return;
    }

    try {
      setIsSavingRole(true);
      const { data } = await api.patch(`/admin/user/${selectedUserId}/details`, {
        role: selectedRole,
        status: selectedStatus,
        reason: statusReason.trim() || undefined,
      });

      await loadUserDetails(selectedUserId);

      const updatedStatus = statusChanged ? selectedStatus : selectedUser?.status;
      const updatedRole = selectedRole;
      const rolePermissions = data?.permissionKeys || [];

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUserId
            ? {
                ...user,
                role: updatedRole,
                roleColor:
                  availableRoles.find((item) => item?.role === updatedRole)?.color || user.roleColor || null,
                status: updatedStatus,
                statusColor:
                  availableStatuses.find((item) => item?.status === updatedStatus)?.color || user.statusColor || null,
                permissions: roleChanged ? rolePermissions : user.permissions,
              }
            : user
        )
      );

      if (statusChanged) setStatusReason("");
    } catch (error) {
      console.error("Error saving user data:", error);
      openAlert({
        type: "error",
        title: "Error al guardar datos",
        message: error.response?.data?.message || "No se pudieron actualizar los datos del usuario.",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleSaveUserData = async () => {
    if (!selectedUserId || !selectedRole || !selectedStatus) return;

    openAlert({
      type: "warning",
      title: "Confirmar cambios de datos",
      message: "Se guardarán los cambios de rol y estatus. Si cambias el rol, se reemplazarán los permisos actuales por los permisos preset del nuevo rol. ¿Deseas continuar?",
      onConfirm: saveUserData,
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "TODOS" || u.role === roleFilter;
      const matchesStatus = statusFilter === "TODOS" || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

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

  const roleColorMap = useMemo(() => {
    const map = {};

    for (const option of roleOptions) {
      if (option?.value && option.value !== "TODOS" && option?.color) {
        map[option.value] = option.color;
      }
    }

    for (const option of availableRoles) {
      if (option?.role && option?.color) {
        map[option.role] = option.color;
      }
    }

    if (selectedUser?.role && selectedUser?.roleColor) {
      map[selectedUser.role] = selectedUser.roleColor;
    }

    return map;
  }, [roleOptions, availableRoles, selectedUser]);

  const statusColorMap = useMemo(() => {
    const map = {};
    for (const option of statusOptions) {
      if (option?.value && option.value !== "TODOS" && option?.color) {
        map[option.value] = option.color;
      }
    }
    for (const option of availableStatuses) {
      if (option?.status && option?.color) {
        map[option.status] = option.color;
      }
    }
    if (selectedUser?.status && selectedUser?.statusColor) {
      map[selectedUser.status] = selectedUser.statusColor;
    }
    return map;
  }, [statusOptions, availableStatuses, selectedUser]);

  const getRoleBadge = (role, roleColor) => {
    const baseClass = "inline-flex justify-center items-center text-xs font-bold px-3 py-1 rounded-full shadow-sm min-w-[112px]";
    const safeRole = role || "N/A";
    const color = roleColor || roleColorMap[role] || "#29d096";

    return (
      <span
        className={baseClass}
        style={{
          color,
          backgroundColor: toRgba(color, 0.12),
          border: `1px solid ${toRgba(color, 0.25)}`
        }}
      >
        {safeRole}
      </span>
    );
  };

  const getStatusBadge = (status, statusColor) => {
    const baseClass = "inline-flex justify-center items-center text-xs font-bold px-3 py-1 rounded-full shadow-sm min-w-[112px]";
    const safeStatus = status || "N/A";
    const color = statusColor || statusColorMap[status] || "#8a8a8a";
    return (
      <span
        className={baseClass}
        style={{
          color,
          backgroundColor: toRgba(color, 0.12),
          border: `1px solid ${toRgba(color, 0.25)}`
        }}
      >
        {safeStatus}
      </span>
    );
  };

  const modalRoleOptions = useMemo(
    () =>
      (availableRoles || []).map((role) => ({
        value: role?.role,
        label: role?.role || role?.detail,
        color: role?.color || null,
      })),
    [availableRoles]
  );

  const modalStatusOptions = useMemo(
    () =>
      (availableStatuses || []).map((s) => ({
        value: s?.status,
        label: s?.detail || s?.status,
        color: s?.color || null,
      })),
    [availableStatuses]
  );

  return (
    <section className="min-h-screen py-15 flex items-start justify-center pb-24">
      <LoadingOverlay
        isVisible={isLoading || isSavingPermissions || isSavingRole}
        message={isLoading ? "Cargando usuarios..." : "Guardando cambios..."}
      />

      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        onConfirm={handleAlertConfirm}
      />

      <UserDetailsModal
        isOpen={isDetailsOpen}
        user={selectedUser}
        availablePermissions={availablePermissions}
        selectedPermissions={selectedPermissions}
        onTogglePermission={handleTogglePermission}
        onSavePermissions={handleSavePermissions}
        selectedRole={selectedRole}
        roleOptions={modalRoleOptions}
        onRoleChange={setSelectedRole}
        onSaveRole={handleSaveUserData}
        isSavingRole={isSavingRole}
        selectedStatus={selectedStatus}
        statusOptions={modalStatusOptions}
        onStatusChange={setSelectedStatus}
        statusReason={statusReason}
        onStatusReasonChange={setStatusReason}
        originalStatus={selectedUser?.status}
        onClose={closeUserDetails}
        isSaving={isSavingPermissions}
      />

      <div className="flex-row w-full max-w-7xl px-4 md:mx-10 mx-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Usuarios</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Jugadores
            </h1>

            <p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
              Administra y modera a la comunidad de TDT. Doble click o botón de ojo para abrir detalle y permisos.
            </p>
          </div>

          {/* <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" className="flex items-center gap-2 ">
              <LogOut size={16} /> Exportar CSV
            </Button>
          </div> */}
        </div>

        <div className="bg-black/20 rounded-[2rem] border border-[var(--white-color)]/5 overflow-hidden shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar jugador por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 rounded-xl px-4 py-2.5 text-sm text-[var(--ins-text-white)] placeholder:text-[var(--ins-text-gray)] focus:outline-none focus:border-[var(--secondary-color)]/50 transition-colors pr-10"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] transition-colors"
                >
                  <X size={14} />
                </button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ins-text-gray)] pointer-events-none" size={16} />
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
              <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            </div>
          </div>

          <div className="overflow-x-auto tdt-scrollbar">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="bg-black/10 text-sm text-[var(--ins-text-gray)]">
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Jugador</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Email</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">rol</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Estatus</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Última Conexión</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-gray-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-[var(--danger-color)]">
                      <div className="flex flex-col items-center gap-3">
                        <span>{loadError}</span>
                        <Button variant="secondary" size="sm" onClick={loadUsers}>
                          Reintentar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      onDoubleClick={() => openUserDetails(u.id)}
                      className="border-b border-black/10 hover:bg-black/5 transition-colors group cursor-pointer"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-[var(--black-color)]/30 border border-[var(--white-color)]/10 rounded-2xl flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                            <button
                              onClick={() => openUserDetails(u.id)}
                            >

                              <User size={20} className="text-[var(--ins-text-gray)]" />
                            </button>
                          </div>
                          <div>
                            <span className="font-bold text-[var(--ins-text-white)] block">{u.username}</span>
                            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--ins-text-dark)]">ID {u.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-sm text-[var(--ins-text-gray)] font-medium">
                        {(u.email || "").replace(/(.{2})(.*)(?=@)/, "$1***")}
                      </td>

                      <td className="py-4 px-4">{getRoleBadge(u.role, u.roleColor)}</td>

                      <td className="py-4 px-4">{getStatusBadge(u.status, u.statusColor)}</td>

                      <td className="py-4 px-4 text-xs text-[var(--gray-color)]">
                        <div>
                          {u.lastConnection ? new Date(u.lastConnection).toLocaleString() : "N/A"}
                        </div>
                        <div className="font-mono text-[10px] mt-1 opacity-70 uppercase tracking-[0.14em]">Permisos: {(u.permissions || []).length}</div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 rounded-xl bg-[var(--black-color)]/20 border border-transparent text-gray-500 hover:text-blue-400 hover:border-blue-400/20 transition-colors"
                            title="Ver detalle"
                            onClick={() => openUserDetails(u.id)}
                          >
                            <Eye size={18} />
                          </button>
                          <button className="p-2 rounded-xl bg-[var(--black-color)]/20 border border-transparent text-gray-500 hover:text-red-500 hover:border-red-500/20 transition-colors" title="Banear/Suspender">
                            <Ban size={18} onClick={()=> banUserbyId(u.id,u.role)}/>
                          </button>
                          <button className="p-2 rounded-xl bg-[var(--black-color)]/20 border border-transparent text-gray-500 hover:text-blue-500 hover:border-blue-500/20 transition-colors" title="Enviar Mensaje">
                            <Mail size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-gray-500">
                      No se encontraron jugadores con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm font-medium text-[var(--gray-color)] px-1">
            <span>Mostrando {filteredUsers.length} de {users.length} jugadores</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Users;
