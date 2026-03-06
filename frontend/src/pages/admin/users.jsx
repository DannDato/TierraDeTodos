import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  LogOut,
  Search,
  Eye,
  Ban,
  Mail,
} from "lucide-react";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import api from "../../api/axios";
import UserDetailsModal from "../../components/UserDetailsModal";
import AlertModal from "../../elements/AlertModal";

const roleOptions = [
  { value: "TODOS", label: "Rol: Todos" },
  { value: "ADMIN", label: "Admin" },
  { value: "MOD", label: "Moderador" },
  { value: "POLICE", label: "Policía" },
  { value: "STREAMER", label: "Streamer" },
  { value: "USER", label: "Usuario" },
];

const statusOptions = [
  { value: "TODOS", label: "Estatus: Todos" },
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "BANNED", label: "Baneado" },
  { value: "BLOCKED", label: "Bloqueado" },
];

function Users() {
  const currentUser = { role: "ADMIN" };

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
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
      const { data } = await api.get("/user/admin/users");
      setUsers(data?.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsers([]);
      setLoadError(error.response?.data?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  const openUserDetails = async (userId) => {
    try {
      const { data } = await api.get(`/user/admin/users/${userId}`);
      setSelectedUserId(userId);
      setSelectedUser(data?.user || null);
      setAvailablePermissions(data?.availablePermissions || []);
      setAvailableRoles(data?.availableRoles || []);
      setSelectedPermissions(data?.user?.permissions || []);
      setSelectedRole(data?.user?.role || "");
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Error loading user details:", error);
    }
  };

  const closeUserDetails = () => {
    setIsDetailsOpen(false);
    setSelectedUserId(null);
    setSelectedUser(null);
    setAvailablePermissions([]);
    setAvailableRoles([]);
    setSelectedPermissions([]);
    setSelectedRole("");
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
      await api.patch(`/user/admin/users/${selectedUserId}/permissions`, {
        permissionKeys: selectedPermissions,
      });

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUserId ? { ...user, permissions: selectedPermissions } : user
        )
      );

      closeUserDetails();
      openAlert({
        type: "success",
        title: "Permisos actualizados",
        message: "Los permisos del usuario se guardaron correctamente.",
      });
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

  const saveRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    try {
      setIsSavingRole(true);
      const { data } = await api.patch(`/user/admin/users/${selectedUserId}/role`, {
        role: selectedRole,
      });

      const rolePermissions = data?.permissionKeys || [];

      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUserId
            ? { ...user, role: selectedRole, permissions: rolePermissions }
            : user
        )
      );

      setSelectedPermissions(rolePermissions);
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              role: selectedRole,
              permissions: rolePermissions,
            }
          : prev
      );
      openAlert({
        type: "success",
        title: "Rol actualizado",
        message: "El rol se actualizó y se reasignaron los permisos preset correctamente.",
      });
    } catch (error) {
      console.error("Error saving role:", error);
      openAlert({
        type: "error",
        title: "Error al guardar rol",
        message: error.response?.data?.message || "No se pudo actualizar el rol del usuario.",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    openAlert({
      type: "warning",
      title: "Confirmar cambio de rol",
      message: "Cambiar el rol reemplazará los permisos actuales por los permisos preset del nuevo rol. ¿Deseas continuar?",
      onConfirm: saveRole,
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

  const getRoleBadge = (role) => {
    const baseClass = "inline-flex justify-center items-center text-xs font-bold px-3 py-1 rounded-full shadow-sm w-28";
    switch (role) {
      case "ADMIN":
        return <span className={`${baseClass} text-[var(--admin-color)] bg-[var(--black-color)]/10`}>ADMIN</span>;
      case "MOD":
        return <span className={`${baseClass} text-[var(--moderator-color)] bg-[var(--moderator-color)]/10`}>MODERADOR</span>;
      case "STREAMER":
        return <span className={`${baseClass} text-[var(--streammer-color)] bg-[var(--streammer-color)]/10`}>STREAMER</span>;
      case "POLICE":
        return <span className={`${baseClass} text-[var(--secondary-color)] bg-[var(--secondary-color)]/10`}>POLICÍA</span>;
      default:
        return <span className={`${baseClass} text-[var(--user-color)] bg-[var(--user-color)]/10`}>USUARIO</span>;
    }
  };

  const getStatusBadge = (status) => {
    const baseClass = "inline-flex justify-center items-center text-xs font-bold px-3 py-1 rounded-full shadow-sm w-28";
    switch (status) {
      case "ACTIVE":
        return <span className={`${baseClass} text-[var(--active-color)] bg-[var(--active-color)]/10`}>ACTIVO</span>;
      case "INACTIVE":
        return <span className={`${baseClass} text-[var(--gray-color)] bg-[var(--gray-color)]/10`}>INACTIVO</span>;
      case "BANNED":
        return <span className={`${baseClass} text-[var(--danger-color)] bg-[var(--danger-color)]/10`}>BANEADO</span>;
      default:
        return <span className={`${baseClass} text-[var(--warning-color)] bg-[var(--warning-color)]/10`}>BLOQUEADO</span>;
    }
  };

  const modalRoleOptions = availableRoles.map((role) => ({
    value: role,
    label: role,
  }));

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
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
        onSaveRole={handleSaveRole}
        isSavingRole={isSavingRole}
        onClose={closeUserDetails}
        isSaving={isSavingPermissions}
      />

      <div className="flex-row w-full max-w-7xl px-4 md:mx-10 mx-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Usuarios</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Jugadores
            </h1>

            <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
              Administra y modera a la comunidad de TDT. Doble click o botón de ojo para abrir detalle y permisos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" className="flex items-center gap-2 ">
              <LogOut size={16} /> Exportar CSV
            </Button>
          </div>
        </div>

        <div className="bg-white/5 rounded-3xl overflow-hidden shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Input
                placeholder="Buscar jugador por nombre o email..."
                value={searchTerm}
                context="dark"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>

            <div className="flex gap-4">
              <Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} />
              <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/10 text-sm text-[var(--ins-text-gray)]">
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Jugador</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Email</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Rol</th>
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
                          <div className="w-10 h-10 bg-[var(--ins-text-dark)] rounded-full flex items-center justify-center shadow-sm overflow-hidden shrink-0">
                            <User size={20} className="text-[var(--ins-text-gray)]" />
                          </div>
                          <span className="font-bold text-[var(--ins-text-white)]">{u.username}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-sm text-[var(--ins-text-gray)] font-medium">
                        {(u.email || "").replace(/(.{2})(.*)(?=@)/, "$1***")}
                      </td>

                      <td className="py-4 px-4">{getRoleBadge(u.role)}</td>

                      <td className="py-4 px-4">{getStatusBadge(u.status)}</td>

                      <td className="py-4 px-4 text-xs text-[var(--gray-color)]">
                        <div>
                          {u.lastConnection ? new Date(u.lastConnection).toLocaleString() : "N/A"}
                        </div>
                        <div className="font-mono text-[10px] mt-1 opacity-70">Permisos: {(u.permissions || []).length}</div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-blue-400 transition-colors"
                            title="Ver detalle"
                            onClick={() => openUserDetails(u.id)}
                          >
                            <Eye size={18} />
                          </button>
                          <button className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-red-500 transition-colors" title="Banear/Suspender">
                            <Ban size={18} />
                          </button>
                          <button className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-blue-500 transition-colors" title="Enviar Mensaje">
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

          <div className="mt-6 flex items-center justify-between text-sm font-medium text-[var(--gray-color)] px-4">
            <span>Mostrando {filteredUsers.length} de {users.length} jugadores</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Users;
