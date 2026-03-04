import { useState, useEffect } from "react";
import { User, LogOut, PencilIcon, Monitor, ShieldAlert } from "lucide-react";
import Button from "../../elements/Button";
import AlertModal from "../../elements/AlertModal";

function Profile() {
  const Icon = User;
  const [user, setUser] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const mockUser = {
      id: 1,
      username: "Steve_mata_pros_miencraft",
      email: "steve@minecraft.com",
      country: "MEX",
      role: "Usuario",
      status: "ACTIVE", // ACTIVE | PENDING | INACTIVE | BANNED
      statusReason: "Uso de exploits en eventos oficiales",
      approvedBy: "Admin_Moderador01",
      statusUpdatedAt: "2027-09-15",
      createdAt: "2027-08-01",
      linkedAccounts: {
        discord: "SteveGamer#1234",
        minecraft: "SteveOficial", // Premium account vinculada
      },
      sessions: [
        {
          id: 1,
          device: "Windows 11 • TDT Launcher",
          ip: "189.150.22.10",
          lastActive: "Ahora mismo",
          isCurrent: true,
        },
        {
          id: 2,
          device: "MacBook Pro • Chrome Web",
          ip: "189.150.22.10",
          lastActive: "Hace 2 días",
          isCurrent: false,
        },
      ]
    };

    setUser(mockUser);
  }, []);

  const statusConfig = {
    ACTIVE: {
      label: "Activo",
      color: "bg-emerald-600",
    },
    PENDING: {
      label: "Pendiente",
      color: "bg-yellow-500",
    },
    INACTIVE: {
      label: "Inactivo",
      color: "bg-[var(--ins-text-gray)]",
    },
    BANNED: {
      label: "Suspendido",
      color: "bg-red-600",
    },
  };

  if (!user) {
    return <ProfileSkeleton />;
  }

  const role= user.role.toUpperCase();
  const getRoleBadge = (role) => {
    const baseClass ="inline-flex justify-center items-center text-xs font-bold px-3 py-1 rounded-full shadow-sm w-28";
    switch (role) {
      case "ADMIN":
        return <span className={`${baseClass} text-[var(--admin-color)] bg-[var(--black-color)]/10`}>ADMIN</span>;
      case "MODERADOR":
        return <span className={`${baseClass} text-[var(--moderator-color)] bg-[var(--moderator-color)]/10`}>MODERADOR</span>;
      case "STREAMER":
        return <span className={`${baseClass} text-[var(--streammer-color)] bg-[var(--streammer-color)]/10`}>STREAMER</span>;
      default:
        return <span className={`${baseClass} text-[var(--user-color)] bg-[var(--user-color)]/10`}>USUARIO</span>;
    }
  };
  const currentStatus = statusConfig[user.status];

  const showAlertLogout = () => {setShowAlert(true);};
  const handleLogout = () => {localStorage.removeItem("token"); window.location.href = "/login";};
    
  return (
    <section className="min-h-screen py-10 flex items-center justify-center bg-[var(--ins-background)]">
      <AlertModal
        isOpen={showAlert}
        type="warning"
        title="Un momento..."
        message="Estas a punto de cerrar sesión."
        onClose={() => setShowAlert(false)}
        onConfirm={handleLogout}
      />
      <div className="flex-row w-full max-w-7xl px-4 md:mx-20 mx-0 text-[var(--ins-text-white)]">

        {/* ENCABEZADO DE LA PÁGINA CON BALANCE VISUAL */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          
          {/* Lado Izquierdo: Títulos y Contexto */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>{user.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Perfil</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Tu cuenta
            </h1>
            
            <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
              Gestiona tu información personal, seguridad, vinculación de cuentas y preferencias del Launcher TDT.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" className="flex items-center gap-2 shadow-sm">
              <PencilIcon size={16} /> Editar Perfil
            </Button>
            <Button variant="cancel" size="sm" className="flex items-center gap-2 shadow-sm" onClick={showAlertLogout}>
              <LogOut size={16} /> Cerrar Sesión
            </Button>
          </div>
          
        </div>

        <div className="bg-white/5 rounded-2xl overflow-hidden shadow-md">
          {/* Banner */}
          <div className="relative h-60 w-full overflow-hidden">
            <img
              src="/img/userBanner.webp"
              alt="Banner"
              className="absolute inset-0 h-full w-full object-cover blur-[5px] scale-104"
            />
            <div className="absolute inset-0 bg-gray-600/40" />

            {/* <div className="absolute bottom-8 left-10 flex items-center gap-6 z-10 align-center justify-center"> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 absolute inset-0 m-auto bg-black/15">
              <div className="p-3 bg-[var(--white-color)] rounded-full shadow-lg w-[128px] h-[128px] m-auto flex items-center justify-center">
                <Icon size={72} className="text-[var(--ins-background)]" />
              </div>
              <div className="flex gap-3 align-center flex-col justify-center m-auto flex items-center justify-center">
                <h2 className="font-bold text-[var(--ins-text-white)] md:text-3xl text-sm  text-shadow-lg ">
                  {user.username}
                </h2>
                <p className="text-[var(--ins-text-white)] text-shadow-lg align-center flex">
                 {getRoleBadge(role)}
                </p>
              </div>
            </div>
          </div>

          {/* ================= INFORMACIÓN PERSONAL ================= */}
          <div className="p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">Información Personal</h2>
              <p className="text-sm text-[var(--ins-text-gray)]">
                Información privada asociada a tu cuenta.
              </p>
            </div>

            <div className="md:w-2/3 flex flex-col gap-4">
              <InfoCard title="Dirección de Correo" value={user.email} />
              <div className="flex flex-col sm:flex-row gap-4">
                <InfoCard title="País / Región" value={user.country} />
                <InfoCard
                  title="Fecha de Registro"
                  value={new Date(user.createdAt).toLocaleDateString()}
                />
              </div>
            </div>
          </div>

          <hr className="mx-10 border-black/10" />

          {/* ================= ESTATUS AVANZADO ================= */}
          <div className="p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">Estatus</h2>
              <p className="text-sm text-[var(--ins-text-gray)]">
                Información relacionada al estado actual de tu cuenta.
              </p>
            </div>

            <div className="md:w-2/3 flex flex-col gap-4">
              {/* Ficha tipo dominó */}
              <div className="flex w-full rounded-xl overflow-hidden shadow-sm">
                <div className="flex-1 bg-black/5 p-6 flex items-center justify-center">
                  <span className="text-md font-bold uppercase tracking-wider">
                    Estatus
                  </span>
                </div>
                <div className={`flex-1 ${currentStatus.color} p-6 flex items-center justify-center`}>
                  <span className="text-md font-bold text-white uppercase tracking-wider">
                    {currentStatus.label}
                  </span>
                </div>
              </div>

              {/* Información adicional del estatus */}
              <div className="bg-black/5 p-4 rounded-xl flex flex-col gap-2 text-sm">
                <div>
                  <span className="font-bold">Actualizado por: </span>
                  {user.approvedBy}
                </div>
                <div>
                  <span className="font-bold">Fecha: </span>
                  {new Date(user.statusUpdatedAt).toLocaleDateString()}
                </div>
                {user.status === "BANNED" && (
                  <div className="text-red-600 font-semibold mt-2 border-t border-black/10 pt-2">
                    Motivo: {user.statusReason}
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="mx-10 border-black/10" />

          {/* ================= CUENTAS VINCULADAS ================= */}
          <div className="p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">Conexiones</h2>
              <p className="text-sm text-[var(--ins-text-gray)]">
                Administra tus cuentas vinculadas para iniciar sesión más rápido.
              </p>
            </div>

            <div className="md:w-2/3 flex flex-col gap-4">
              
              {/* Card Discord */}
              <div className="bg-black/5 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center text-white shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight">Discord</h3>
                    <p className="text-sm text-[var(--ins-text-gray)]">{user.linkedAccounts.discord}</p>
                  </div>
                </div>
                <button className="text-sm font-semibold text-[var(--ins-text-gray)] hover:text-red-500 transition-colors">
                  Desvincular
                </button>
              </div>

              {/* Card Minecraft */}
              <div className="bg-black/5 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#2b2b2b] rounded-full flex items-center justify-center text-white shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M2.38 6.57L10.74 5.4v6.86H2.38V6.57zm9.05-1.28L21.62 3.8v8.46h-10.2V5.29zm0 8.01h10.2v8.46l-10.2-1.48v-6.98zM2.38 13.3h8.36v6.86l-8.36-1.15v-5.71z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight">Minecraft Premium</h3>
                    <p className="text-sm text-[var(--ins-text-gray)]">{user.linkedAccounts.minecraft}</p>
                  </div>
                </div>
                <button className="text-sm font-semibold text-[var(--ins-text-gray)] hover:text-red-500 transition-colors">
                  Desvincular
                </button>
              </div>

            </div>
          </div>

          <hr className="mx-10 border-black/10" />

          {/* ================= ACTIVIDAD Y SESIONES ================= */}
          <div className="p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">Seguridad</h2>
              <p className="text-sm text-[var(--ins-text-gray)]">
                Controla los dispositivos desde los que has iniciado sesión recientemente.
              </p>
            </div>

            <div className="md:w-2/3 flex flex-col gap-4">
              
              {user.sessions.map((session) => (
                <div key={session.id} className={`p-4 rounded-xl flex items-center justify-between ${session.isCurrent ? 'bg-[var(--secondary-color)]/10 ' : 'bg-black/5 border-transparent'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${session.isCurrent ? 'bg-emerald-100/ text-emerald-600' : 'bg-black/10 text-gray-600'}`}>
                      <Monitor size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight flex items-center gap-2">
                        {session.device}
                        {session.isCurrent && (
                          <span className="bg-emerald-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider">
                            Actual
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[var(--ins-text-gray)] mt-1">
                        IP: {session.ip} • Última vez: {session.lastActive}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 bg-[var(--danger-color)]/5 rounded-xl flex items-start gap-4 ">
                <ShieldAlert className="text-[var(--danger-color)] shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-[var(--danger-color)] font-bold text-sm">¿Ves actividad sospechosa?</h3>
                  <p className="text-[var(--danger-color)]/80 text-xs mt-1 mb-3">
                    Esto cerrará tu sesión en todos los dispositivos y en el Launcher de TDT, forzando a iniciar sesión nuevamente.
                  </p>
                  <Button variant="cancel" size="sm" className="flex items-center gap-2 shadow-sm" onClick={showAlertLogout}>
                    Cerrar sesión en todos los dispositivos
                  </Button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* 🔹 Componente reutilizable */
function InfoCard({ title, value }) {
  return (
    <div className="bg-black/5 p-4 rounded-xl flex-1">
      <span className="text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-wider block">
        {title}
      </span>
      <span className="text-md font-bold">{value}</span>
    </div>
  );
}

/* 🔹 Skeleton Loader (Actualizado) */
function ProfileSkeleton() {
  return (
    <section className="min-h-screen py-10 flex items-center justify-center bg-[var(--white-color)]">
      <div className="w-full max-w-5xl animate-pulse space-y-8 px-4">
        {/* Banner Skeleton */}
        <div className="h-60 bg-[var(--gray-light-color)] rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--primary-color)]/10" />
        </div>
        {/* Contenido principal simulado */}
        <div className="space-y-4">
          <div className="h-6 w-1/3 rounded bg-[var(--gray-light-color)]" />
          <div className="h-20 rounded-xl bg-[var(--gray-light-color)]" />
          <div className="h-32 rounded-xl bg-[var(--gray-light-color)]" />
        </div>
      </div>
    </section>
  );
}

export default Profile;