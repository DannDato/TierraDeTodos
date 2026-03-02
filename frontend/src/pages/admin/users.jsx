import { useState, useMemo } from "react";
import {
  User,
  LogOut,
  PencilIcon,
  Search,
  Filter,
  ShieldAlert,
  Mail,
  Ban,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Button from "../../elements/Button";
import Input from "../../elements/Input"; 

const mockUsersData = [
  { id: 1, username: "Steve", email: "steve@minecraft.com", role: "ADMIN", status: "ACTIVO", lastConnection: "14/9/2027 15:30", ip: "189.150.22.10", country: "MEX" },
  { id: 2, username: "AlexGamer", email: "alex@gmail.com", role: "USUARIO", status: "PENDIENTE", lastConnection: "13/9/2027 10:15", ip: "201.14.5.99", country: "ARG" },
  { id: 3, username: "DanDato", email: "dan@tdt.com", role: "MODERADOR", status: "ACTIVO", lastConnection: "10/9/2027 08:20", ip: "190.55.44.11", country: "CHL" },
  { id: 4, username: "CreeperBoom", email: "boom@yahoo.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 16:00", ip: "189.150.22.11", country: "MEX" },
  { id: 5, username: "Notch_Fake", email: "notch@mojang.fake", role: "USUARIO", status: "ACTIVO", lastConnection: "01/9/2027 12:00", ip: "88.10.2.1", country: "ESP" },
  { id: 6, username: "Herobrine", email: "hero@brine.com", role: "USUARIO", status: "INACTIVO", lastConnection: "15/8/2027 03:33", ip: "666.666.666.666", country: "UNK" },
  { id: 7, username: "IronGolem", email: "iron@golem.net", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 14:00", ip: "192.168.1.5", country: "COL" },
  { id: 8, username: "ZombiePig", email: "zombie@nether.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 15:25", ip: "10.0.0.5", country: "PER" },
  { id: 9, username: "EnderMan", email: "ender@void.com", role: "USUARIO", status: "PENDIENTE", lastConnection: "12/9/2027 11:11", ip: "172.16.0.1", country: "VEN" },
  { id: 10, username: "DiamondMiner", email: "miner@craft.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 09:30", ip: "200.100.50.25", country: "URY" },
  { id: 11, username: "RedstonePro", email: "red@stone.com", role: "USUARIOUSUARIO", status: "ACTIVO", lastConnection: "13/9/2027 18:45", ip: "150.20.30.40", country: "MEX" },
  { id: 12, username: "BuildMaster", email: "build@master.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 12:15", ip: "189.150.22.12", country: "ARG" },
  { id: 13, username: "PVPKing", email: "pvp@king.com", role: "USUARIO", status: "BANEADO", lastConnection: "05/9/2027 22:00", ip: "201.14.5.100", country: "CHL" },
  { id: 14, username: "FarmBot", email: "farm@bot.com", role: "USUARIO", status: "ACTIVO", lastConnection: "01/8/2027 10:00", ip: "190.55.44.12", country: "ESP" },
  { id: 15, username: "Admin_Test", email: "test@admin.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 15:45", ip: "189.150.22.10", country: "MEX" },
  { id: 16, username: "Mod_Helper", email: "helper@mod.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 08:00", ip: "192.168.1.6", country: "COL" },
  { id: 17, username: "NewPlayer", email: "new@player.com", role: "USUARIO", status: "PENDIENTE", lastConnection: "14/9/2027 15:55", ip: "10.0.0.6", country: "PER" },
  { id: 18, username: "OldVeteran", email: "old@veteran.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 14:30", ip: "172.16.0.2", country: "VEN" },
  { id: 19, username: "GrieferNoob", email: "grief@noob.com", role: "USUARIO", status: "ACTIVO", lastConnection: "10/9/2027 16:20", ip: "200.100.50.26", country: "URY" },
  { id: 20, username: "ServerOwner", email: "owner@server.com", role: "USUARIO", status: "ACTIVO", lastConnection: "14/9/2027 16:05", ip: "150.20.30.41", country: "MEX" },
];

function Users() {
  const currentUser = { role: "ADMIN" }; 

  const [users, setUsers] = useState(mockUsersData);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "TODOS" || u.role === roleFilter;
      const matchesStatus = statusFilter === "TODOS" || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">ADMIN</span>;
      case "MODERADOR":
        return <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full shadow-sm">MODERADOR</span>;
      case "STREAMER":
        return <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">STREAMER</span>;
      default:
        return <span className="bg-[var(--primary-color)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">USUARIO</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVO":
        return <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">ACTIVO</span>;
      case "PENDIENTE":
        return <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">PENDIENTE</span>;
      case "BANEADO":
        return <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">BANEADO</span>;
      default:
        return <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">INACTIVO</span>;
    }
  };

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--white-color)] pb-24">
      <div className="flex-row w-full max-w-7xl px-4 md:mx-10 mx-0">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Usuarios</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--black-color)] tracking-tight">
              Jugadores
            </h1>
            
            <p className="text-sm text-[var(--gray-color)] mt-2 max-w-lg">
              Administra y modera a la comunidad de TDT. Busca, filtra y toma
              acciones rápidas sobre cualquier cuenta.
            </p>
          </div>

          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white">
              <LogOut size={16} /> Exportar CSV
            </Button>
            <Button variant="primary" size="sm" className="flex items-center gap-2 shadow-sm">
              <User size={16} /> Añadir Jugador
            </Button>
          </div>
          
        </div>

        <div className="bg-[var(--gray-light-color)] rounded-3xl overflow-hidden shadow-md p-6">
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">

               <Input 
                  placeholder="Buscar jugador por nombre o email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                 <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
            </div>

            <div className="flex gap-4">
              <select 
                className="bg-white px-4 py-3 rounded-3xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-[var(--secondary-color)] shadow-sm cursor-pointer"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="TODOS">Rol: Todos</option>
                <option value="ADMIN">Admin</option>
                <option value="MODERADOR">Moderador</option>
                <option value="USUARIO">Usuario</option>
              </select>

              <select 
                className="bg-white px-4 py-3 rounded-3xl border border-gray-200 text-sm font-medium text-gray-700 outline-none focus:border-[var(--secondary-color)] shadow-sm cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="TODOS">Estatus: Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="BANEADO">Baneado</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>


          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black/10 text-sm text-[var(--gray-color)]">
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Jugador</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Email</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Rol</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Estatus</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider">Última Conexión (fecha)</th>
                  <th className="py-4 px-4 font-bold uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-black/5 hover:bg-black/5 transition-colors group">
                      

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden shrink-0">

                            <User size={20} className="text-gray-400" />
                          </div>
                          <span className="font-bold text-[var(--black-color)]">{u.username}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-sm text-[var(--gray-color)] font-medium">
                        {u.email.replace(/(.{2})(.*)(?=@)/, "$1***")}
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-4">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Estatus */}
                      <td className="py-4 px-4">
                        {getStatusBadge(u.status)}
                      </td>

                      {/* Conexión */}
                      <td className="py-4 px-4 text-xs text-[var(--gray-color)]">
                        <div>{u.lastConnection}</div>
                        <div className="font-mono text-[10px] mt-1 opacity-70">IP: {u.ip.replace(/(?<=\.)\d+(?=\.)/g, 'x')}</div>
                      </td>

                      {/* Acciones */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white rounded-full text-gray-500 hover:text-[var(--secondary-color)] transition-colors tooltip" title="Editar Perfil">
                            <PencilIcon size={18} />
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

          {/* PAGINACION SIMPLE */}
          <div className="mt-6 flex items-center justify-between text-sm font-medium text-[var(--gray-color)] px-4">
            <span>Mostrando {filteredUsers.length} de {users.length} jugadores</span>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-50" disabled>Anterior</button>
              <button className="w-8 h-8 flex items-center justify-center bg-[var(--black-color)] text-white rounded-lg">1</button>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors">2</button>
              <button className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-colors">3</button>
              <span className="px-2">...</span>
              <button className="p-2 hover:bg-white rounded-lg transition-colors">Siguiente</button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Users;