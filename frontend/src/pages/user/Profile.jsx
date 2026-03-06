import { useState, useEffect } from "react";
import { User, LogOut, PencilIcon, Monitor, ShieldAlert } from "lucide-react";
import Button from "../../elements/Button";
import AlertModal from "../../elements/AlertModal";
import api from "../../api/axios";

function Profile() {
  const Icon = User;

  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [logoutMode, setLogoutMode] = useState("current");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await api.get("/user/profile");
        setUser(data.user || data);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "No se pudo cargar la información del perfil";

        setError(message);
        setShowAlert(true);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", {
        allDevices: logoutMode === "all",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  const showAlertLogout = (mode = "current") => {
    setLogoutMode(mode);
    setShowAlert(true);
  };

  const statusConfig = {
    ACTIVE: { label: "Activo", color: "bg-emerald-600" },
    PENDING: { label: "Pendiente", color: "bg-yellow-500" },
    INACTIVE: { label: "Inactivo", color: "bg-gray-500" },
    BANNED: { label: "Suspendido", color: "bg-red-600" },
  };

  if (!user) {
    return <ProfileSkeleton />;
  }

  const currentStatus = statusConfig[user?.status] || {
    label: "Desconocido",
    color: "bg-gray-500",
  };

  const getRoleBadge = (role) => {
    const baseClass =
      "inline-flex justify-center items-center text-xs font-bold px-3 py-1 rounded-full shadow-sm w-28";

    const r = role?.toUpperCase();

    switch (r) {
      case "ADMIN":
        return (
          <span
            className={`${baseClass} text-[var(--admin-color)] bg-[var(--admin-color)]/10 border border-[var(--admin-color)]/20`}
          >
            ADMIN
          </span>
        );

      case "MODERADOR":
        return (
          <span
            className={`${baseClass} text-[var(--moderator-color)] bg-[var(--moderator-color)]/10 border border-[var(--moderator-color)]/20`}
          >
            MODERADOR
          </span>
        );

      case "STREAMER":
        return (
          <span
            className={`${baseClass} text-[var(--streammer-color)] bg-[var(--streammer-color)]/10 border border-[var(--streammer-color)]/20`}
          >
            STREAMER
          </span>
        );

      default:
        return (
          <span
            className={`${baseClass} text-[var(--user-color)] bg-[var(--user-color)]/10 border border-[var(--user-color)]/20`}
          >
            USUARIO
          </span>
        );
    }
  };

  return (
    <section className="min-h-screen py-10 flex items-center justify-center bg-[var(--ins-background)]">
      <AlertModal
        isOpen={showAlert}
        type="warning"
        title="Un momento..."
        message={logoutMode === "all" ? "Estas a punto de cerrar sesión en todos los dispositivos." : "Estas a punto de cerrar sesión."}
        onClose={() => setShowAlert(false)}
        onConfirm={handleLogout}
      />

      <div className="flex-row w-full max-w-7xl px-4 md:mx-20 mx-0 text-[var(--ins-text-white)]">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>{user.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Perfil</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Tu cuenta
            </h1>

            <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
              Gestiona tu información personal, seguridad, vinculación de cuentas
              y preferencias del Launcher TDT.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" className="flex items-center gap-2 shadow-sm">
              <PencilIcon size={16} /> Editar Perfil
            </Button>

            <Button
              variant="cancel"
              size="sm"
              className="flex items-center gap-2 shadow-sm"
              onClick={() => showAlertLogout("current")}
            >
              <LogOut size={16} /> Cerrar Sesión
            </Button>
          </div>

        </div>

        <div className="bg-white/5 rounded-2xl overflow-hidden shadow-md">

          {/* BANNER */}
          <div className="relative h-60 w-full overflow-hidden">

            <img
              src="/img/userBanner.webp"
              alt="Banner"
              className="absolute inset-0 h-full w-full object-cover blur-[5px] scale-105"
            />

            <div className="absolute inset-0 bg-gray-600/40" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 absolute inset-0 m-auto bg-black/15">

              <div className="p-3 bg-[var(--white-color)] rounded-full shadow-lg w-[128px] h-[128px] m-auto flex items-center justify-center">
                <Icon size={72} className="text-[var(--ins-background)]" />
              </div>

              <div className="flex gap-3 flex-col justify-center m-auto items-center">
                <h2 className="font-bold text-[var(--ins-text-white)] md:text-3xl text-sm text-shadow-lg">
                  {user.username}
                </h2>

                <p className="text-[var(--ins-text-white)] text-shadow-lg">
                  {getRoleBadge(user.role)}
                </p>
              </div>

            </div>
          </div>

          {/* INFORMACION PERSONAL */}
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
                  value={
                    user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"
                  }
                />
              </div>
            </div>

          </div>

          <hr className="mx-10 border-black/10" />

          {/* STATUS */}
          <div className="p-10 flex flex-col md:flex-row gap-10">

            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">Estatus</h2>
            </div>

            <div className="md:w-2/3 flex flex-col gap-4">

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

              <div className="bg-black/5 p-4 rounded-xl flex flex-col gap-2 text-sm">
                <div>
                  <span className="font-bold">Actualizado por: </span>
                  {user.status_changed_by || "Sistema"}
                </div>

                <div>
                  <span className="font-bold">Fecha: </span>
                  {user.status_changed_at
                    ? new Date(user.status_changed_at).toLocaleDateString()
                    : "N/A"}
                </div>

                {user.status === "BANNED" && (
                  <div className="text-red-600 font-semibold mt-2 border-t border-black/10 pt-2">
                    Motivo: {user.status_reason}
                  </div>
                )}
              </div>

            </div>
          </div>

          <hr className="mx-10 border-black/10" />

          {/* DISPOSITIVOS */}
          <div className="p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">Seguridad</h2>
            </div>
            <div className="md:w-2/3 flex flex-col gap-4">
              {user.devices?.map((device) => (
                <div
                  key={device.id}
                  className={`p-4 rounded-xl flex items-center justify-between ${
                    device.isCurrent
                      ? "bg-[var(--secondary-color)]/10"
                      : "bg-black/5"
                  }`}
                >

                  <div className="flex items-center gap-4">

                    <div className="p-3 rounded-full bg-black/10 text-gray-600">
                      <Monitor size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        {device.device}

                        {device.isCurrent && (
                          <span className="bg-emerald-500 text-white text-[10px] uppercase px-2 py-0.5 rounded-full">
                            Actual
                          </span>
                        )}
                      </h3>

                      <p className="text-xs text-[var(--ins-text-gray)] mt-1">
                        • Última vez:{" "}
                        {device.lastActive
                          ? new Date(device.lastActive).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>

                  </div>

                </div>
              ))}

              <div className="mt-4 p-4 bg-[var(--danger-color)]/5 rounded-xl flex items-start gap-4">
                <ShieldAlert
                  className="text-[var(--danger-color)] shrink-0 mt-0.5"
                  size={20}
                />

                <div>
                  <h3 className="text-[var(--danger-color)] font-bold text-sm">
                    ¿Ves actividad sospechosa?
                  </h3>

                  <p className="text-[var(--danger-color)]/80 text-xs mt-1 mb-3">
                    Esto cerrará tu sesión en todos los dispositivos.
                  </p>

                  <Button
                    variant="cancel"
                    size="sm"
                    className="flex items-center gap-2 shadow-sm"
                    onClick={() => showAlertLogout("all")}
                  >
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

/* COMPONENTE INFO */
function InfoCard({ title, value }) {
  return (
    <div className="bg-black/5 p-4 rounded-xl flex-1">
      <span className="text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-wider block">
        {title}
      </span>
      <span className="text-md font-bold">{value || "N/A"}</span>
    </div>
  );
}

/* SKELETON */
function ProfileSkeleton() {
  return (
    <section className="min-h-screen py-10 flex items-center justify-center bg-[var(--ins-background)]">
      <div className="w-full max-w-5xl animate-pulse space-y-8 px-4">

        <div className="h-60 bg-white/10 rounded-2xl" />

        <div className="space-y-4">
          <div className="h-6 w-1/3 rounded bg-white/10" />
          <div className="h-20 rounded-xl bg-white/10" />
          <div className="h-32 rounded-xl bg-white/10" />
        </div>

      </div>
    </section>
  );
}

export default Profile;