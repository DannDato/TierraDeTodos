import { useState, useEffect } from "react";
import { User, LogOut, Settings } from "lucide-react";
import Button from "../../elements/button";

function Profile() {
  const Icon = User;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const mockUser = {
      id: 1,
      username: "Steve",
      email: "steve@minecraft.com",
      country: "MEX",
      role: "Usuario",
      status: "ACTIVE", // ACTIVE | PENDING | INACTIVE | BANNED
      statusReason: "Uso de exploits en eventos oficiales",
      approvedBy: "Admin_Moderador01",
      statusUpdatedAt: "2027-09-15",
      createdAt: "2027-08-01",
    };

    setTimeout(() => {
      setUser(mockUser);
    }, 1000);
  }, []);

  // 🔹 Configuración dinámica de estatus
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
      color: "bg-gray-500",
    },
    BANNED: {
      label: "Suspendido",
      color: "bg-red-600",
    },
  };

  if (!user) {
    return <ProfileSkeleton />;
  }

  const currentStatus = statusConfig[user.status];

  return (
    <section className="h-screen flex items-center justify-center bg-[var(--white-color)]">
      <div className="flex-row w-full max-w-5xl">

        <h1 className="text-2xl md:text-3xl font-bold mb-8">
          Tu perfil
        </h1>

        <div className="bg-[var(--gray-light-color)] rounded-2xl overflow-hidden shadow-md">

          {/* Banner */}
          <div className="relative h-60 w-full overflow-hidden">
            <img
              src="/img/banner.webp"
              alt="Banner"
              className="absolute inset-0 h-full w-full object-cover blur-[5px] scale-104"
            />
            <div className="absolute inset-0 bg-black/40" />

            <div className="absolute bottom-6 left-10 flex items-end gap-6 z-10">
              <div className="p-3 bg-white rounded-full shadow-lg">
                <Icon size={72} />
              </div>
              <div>
                <h2 className="text-4xl font-bold text-white">
                  {user.username}
                </h2>
                <p className="text-white/70 text-sm">
                  Rol: {user.role}
                </p>
              </div>
            </div>

            {/* Botones (lógica futura) */}
            <div className="absolute top-6 right-8 z-10 flex gap-3">
              <Button variant="primary" size="sm">
                <Settings size={14} /> Editar Perfil
              </Button>
              <Button variant="cancel" size="sm">
                <LogOut size={14} /> Cerrar Sesión
              </Button>
            </div>
          </div>

          {/* Información */}
          <div className="p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">
                Información Personal
              </h2>
              <p className="text-sm text-gray-500">
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

          {/* 🔥 ESTATUS AVANZADO */}
          <div className="p-10 flex flex-col md:flex-row gap-10">

            <div className="md:w-1/3">
              <h2 className="text-2xl font-bold mb-3">
                Estatus
              </h2>
              <p className="text-sm text-gray-500">
                Información relacionada al estado actual de tu cuenta.
              </p>
            </div>

            <div className="md:w-2/3 flex flex-col gap-4">

              {/* Ficha tipo dominó */}
              <div className="flex w-full rounded-xl overflow-hidden shadow-md border border-black/10">

                <div className="flex-1 bg-gray-100 p-6 flex items-center justify-center">
                  <span className="text-lg font-bold uppercase tracking-wider">
                    Estatus
                  </span>
                </div>

                <div className={`flex-1 ${currentStatus.color} p-6 flex items-center justify-center`}>
                  <span className="text-xl font-bold text-white uppercase tracking-wider">
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
                  <div className="text-red-600 font-semibold">
                    Motivo: {user.statusReason}
                  </div>
                )}
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
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
        {title}
      </span>
      <span className="text-md">{value}</span>
    </div>
  );
}

/* 🔹 Skeleton Loader */
function ProfileSkeleton() {
  return (
    <section className="h-screen flex items-center justify-center bg-[var(--white-color)]">
      <div className="w-full max-w-5xl animate-pulse space-y-8">

        {/* Banner Skeleton */}
        <div className="h-60 bg-[var(--gray-light-color)] rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[var(--primary-color)]/10" />
        </div>

        {/* Título */}
        <div className="space-y-4 px-4">
          <div className="h-6 w-1/3 rounded bg-[var(--gray-light-color)]" />
          
          {/* Cards */}
          <div className="h-20 rounded-xl bg-[var(--gray-light-color)]" />
          <div className="h-20 rounded-xl bg-[var(--gray-light-color)]" />
        </div>

        {/* Estatus tipo dominó skeleton */}
        <div className="flex rounded-xl overflow-hidden shadow-sm border border-[var(--gray-color)]/20">
          <div className="flex-1 h-16 bg-[var(--gray-light-color)]" />
          <div className="flex-1 h-16 bg-[var(--primary-color)]/30" />
        </div>

      </div>
    </section>
  );
}

export default Profile;