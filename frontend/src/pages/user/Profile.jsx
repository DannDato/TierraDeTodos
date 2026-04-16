import { useState, useEffect, useRef } from "react";
import { User, LogOut, PencilIcon, Monitor, ShieldAlert, Upload } from "lucide-react";
import Button from "../../elements/Button";
import AlertModal from "../../elements/AlertModal";
import api from "../../api/axios";

function Profile() {
  const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };

  // Ícono de usuario por defecto si no hay skin. Lo mantenemos como fallback.
  const UserFallbackIcon = User;

  const [isFlipped, setIsFlipped] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [isSavingAvatarPosition, setIsSavingAvatarPosition] = useState(false);
  const [showDeleteAvatarAlert, setShowDeleteAvatarAlert] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [logoutMode, setLogoutMode] = useState("current");
  const [avatarDraft, setAvatarDraft] = useState({ posX: 50, posY: 50, zoom: 1 });
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data } = await api.get("/user/profile");
        // Asumimos que data trae user.mc_skin_head (URL de la cabeza de la skin)
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

  const triggerAvatarPicker = () => {
    if (isUploadingAvatar) return;
    setIsAvatarMenuOpen(false);
    avatarInputRef.current?.click();
  };

  const getAvatarPositionFromUser = (userValue) => {
    const posX = Number(userValue?.avatarPosX);
    const posY = Number(userValue?.avatarPosY);
    const zoom = Number(userValue?.avatarZoom);

    return {
      posX: Number.isFinite(posX) ? posX : 50,
      posY: Number.isFinite(posY) ? posY : 50,
      zoom: Number.isFinite(zoom) ? zoom : 1,
    };
  };

  const openAvatarEditor = () => {
    if (!user?.avatarUrl) return;
    setAvatarDraft(getAvatarPositionFromUser(user));
    setIsAvatarMenuOpen(false);
    setIsAvatarEditorOpen(true);
  };

  const handleAvatarClick = () => {
    if (isUploadingAvatar || isSavingAvatarPosition) return;
    if (!avatarPreview) {
      triggerAvatarPicker();
      return;
    }
    setIsAvatarMenuOpen((prev) => !prev);
  };

  const handleDeleteAvatar = async () => {
    try {
      setShowDeleteAvatarAlert(false);
      setIsAvatarMenuOpen(false);
      await api.delete("/user/avatar");
      setUser((prev) => ({
        ...prev,
        avatarUrl: null,
        avatarPosX: 50,
        avatarPosY: 50,
        avatarZoom: 1,
      }));
      setIsAvatarEditorOpen(false);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "No se pudo eliminar el avatar";
      window.alert(message);
    }
  };

  const requestDeleteAvatar = () => {
    setIsAvatarMenuOpen(false);
    setShowDeleteAvatarAlert(true);
  };

  const saveAvatarPosition = async () => {
    try {
      setIsSavingAvatarPosition(true);
      const { data } = await api.patch("/user/avatar/position", avatarDraft);
      const avatar = data?.avatar;

      setUser((prev) => ({
        ...prev,
        avatarPosX: avatar?.pos_x ?? avatarDraft.posX,
        avatarPosY: avatar?.pos_y ?? avatarDraft.posY,
        avatarZoom: avatar?.zoom ?? avatarDraft.zoom,
      }));

      setIsAvatarEditorOpen(false);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "No se pudo guardar el encuadre";
      window.alert(message);
    } finally {
      setIsSavingAvatarPosition(false);
    }
  };

  const handleAvatarInputChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      window.alert("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert("La imagen no debe superar 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await api.post("/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const uploadedUrl = data?.avatar?.img;
      if (uploadedUrl) {
        setUser((prev) => ({
          ...prev,
          avatarUrl: uploadedUrl,
          avatarPosX: data?.avatar?.pos_x ?? 50,
          avatarPosY: data?.avatar?.pos_y ?? 50,
          avatarZoom: data?.avatar?.zoom ?? 1,
        }));
        setAvatarDraft({
          posX: data?.avatar?.pos_x ?? 50,
          posY: data?.avatar?.pos_y ?? 50,
          zoom: data?.avatar?.zoom ?? 1,
        });
        setIsAvatarEditorOpen(true);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || "No se pudo subir el avatar";
      window.alert(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const statusConfig = {
    ACTIVE: { label: "Activo" },
    PENDING: { label: "Pendiente" },
    INACTIVE: { label: "Inactivo" },
    BANNED: { label: "Suspendido" },
  };

  if (!user) {
    return <ProfileSkeleton />;
  }

  const currentStatus = {
    label: (statusConfig[user?.status]?.label) || "Desconocido",
    color: user?.statusColor || "#8a8a8a",
  };

  const avatarPreview = user?.avatarUrl || user?.mc_skin_head || null;
  const avatarPosX = Number.isFinite(Number(user?.avatarPosX)) ? Number(user?.avatarPosX) : 50;
  const avatarPosY = Number.isFinite(Number(user?.avatarPosY)) ? Number(user?.avatarPosY) : 50;
  const avatarZoom = Number.isFinite(Number(user?.avatarZoom)) ? Number(user?.avatarZoom) : 1;
  const avatarImageStyle = {
    objectPosition: `${avatarPosX}% ${avatarPosY}%`,
    transform: `scale(${avatarZoom})`,
  };

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

  // Badge de rol modificado para parecer una etiqueta impresa
  const getRoleBadge = (role, roleColor) => {
    const safeRole = role || "N/A";
    const color = roleColor || user?.roleColor || "#29d096";

    return (
      <span
        className="inline-flex justify-center items-center text-[10px] font-mono font-bold px-3 py-0.5 rounded shadow-inner uppercase tracking-wider"
        style={{
          color: "#000",
          backgroundColor: toRgba(color, 0.4),
          border: `1px solid ${toRgba(color, 0.5)}`
        }}
      >
        {safeRole}
      </span>
    );
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

      <AlertModal
        isOpen={showDeleteAvatarAlert}
        type="warning"
        title="Eliminar avatar"
        message="Estas a punto de borrar tu avatar y esta accion no se puede deshacer."
        onClose={() => setShowDeleteAvatarAlert(false)}
        onConfirm={handleDeleteAvatar}
      />

      <div className="w-full max-w-7xl px-4 md:px-8 text-[var(--ins-text-white)]">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Credencial</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Tu Identificación
            </h1>

            <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
              Tu credencial oficial en TierraDeTodos. Haz doble clic para ver ambos lados.
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

        {/* MAIN CONTENT - CREDENTIAL + INFO */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT: CREDENTIAL - SECCIÓN MODIFICADA */}
          <div className="w-full max-w-[340px] lg:max-w-[360px] mx-auto lg:mx-0 lg:shrink-0">
            <style>{`
              .credential-container {
                perspective: 1000px;
              }
              .credential-flipper {
                position: relative;
                width: 100%;
                height: 520px; /* Un poco más alta para los detalles */
                transition: transform 0.6s;
                transform-style: preserve-3d;
              }
              .credential-container.flipped .credential-flipper {
                transform: rotateY(180deg);
              }
              .credential-front,
              .credential-back {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
              }
              .credential-back {
                transform: rotateY(180deg);
              }

              /* Textura de papel crema mejorada (Ref 1) */
              .paper-texture {
                background-color: #f0e8d8; /* var(--white-color) aproximado */
                background-image:
                  repeating-linear-gradient(45deg, rgba(139, 110, 58, 0.01) 0px, rgba(139, 110, 58, 0.01) 2px, transparent 2px, transparent 4px),
                  linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0) 20%, rgba(0,0,0,0.03) 90%, rgba(0,0,0,0.05));
                box-shadow:
                  0 10px 25px -5px rgba(0, 0, 0, 0.6),
                  0 0 1px 1px rgba(139, 110, 58, 0.25) inset;
              }

              /* Tipografía simulando máquina de escribir para datos (Ref 1) */
              .font-mono-dossier {
                font-family: 'Courier New', Courier, monospace;
                letter-spacing: -0.5px;
              }

              /* Efecto de marco de piedra para la foto (Ref 1) */
              .minecraft-mugshot {
                background-image: url('https://www.transparenttextures.com/patterns/dark-dotted.png'), /* Textura base */
                                  linear-gradient(to bottom, #5a5a5a, #4a4a4a);
                border: 4px solid #3a3a3a;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.3);
                image-rendering: pixelated; /* Importante para estilo Minecraft */
              }
            `}</style>

            <div
              className={`credential-container cursor-pointer select-none ${isFlipped ? "flipped" : ""}`}
              onDoubleClick={() => setIsFlipped(!isFlipped)}
            >
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarInputChange}
                className="hidden"
              />

              <div className="credential-flipper">
                {/* FRONT - REDISEÑADO TOTALMENTE */}
                <div className="credential-front">
                  <div className="h-full rounded-2xl paper-texture flex flex-col pt-5 pb-3 px-6 text-gray-900 border border-[rgba(139,110,58,0.3)]">

                    {/* LOGO & HEADER (Ref 2/3) */}
                    <div className="flex items-center gap-3 pb-3 border-b border-[rgba(139,110,58,0.5)] mb-3">
                      <img src="/img/tierradetodos.png" alt="TDT Logo" className="w-20" />
                      <div className="flex-1 text-right">
                        <p className="font-extrabold text-[14px] text-gray-950 uppercase tracking-tight leading-none text-right">Identidad Ciudadana</p>
                        <p className="text-[16px] text-[var(--gray-color)] font-medium mt-1 text-right">Ministerio de Tierra de Todos</p>
                      </div>
                      {/* <span className="ml-auto text-amber-400 font-bold text-[10px] uppercase border border-amber-300 px-2 py-0.5 rounded bg-amber-50">Oficial</span> */}
                    </div>

                    {/* MUGSHOT & NAME AREA */}
                    <div className="flex items-center gap-5 mb-4">
                      {/* Marco de piedra Minecraft (Ref 1) */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={handleAvatarClick}
                          className="minecraft-mugshot w-28 h-36 rounded flex-shrink-0 flex items-center justify-center p-1.5 overflow-hidden relative"
                          title="Subir imagen de perfil"
                          disabled={isUploadingAvatar || isSavingAvatarPosition}
                        >
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="Skin Head"
                              className="w-full h-full object-cover"
                              style={{ imageRendering: 'pixelated', ...avatarImageStyle }}
                            />
                          ) : (
                            <UserFallbackIcon size={60} className="text-[var(--gray-color)]" />
                          )}

                          {!avatarPreview && (
                            <span className="absolute inset-x-0 bottom-0 bg-black/45 text-white text-[9px] py-0.5 flex items-center justify-center gap-1">
                              <Upload size={10} />
                              {isUploadingAvatar ? "Subiendo..." : "Subir"}
                            </span>
                          )}
                        </button>

                        {avatarPreview && isAvatarMenuOpen && (
                          <div className="absolute z-20 top-[calc(100%+6px)] left-0 rounded-lg border border-black/30 bg-[var(--ins-background)] shadow-lg overflow-hidden text-xs min-w-[120px]">
                            <button
                              type="button"
                              onClick={openAvatarEditor}
                              className="block w-full px-3 py-2 text-left text-white hover:bg-white/10"
                            >
                              Mover
                            </button>
                            <button
                              type="button"
                              onClick={triggerAvatarPicker}
                              className="block w-full px-3 py-2 text-left text-white hover:bg-white/10"
                            >
                              Cambiar
                            </button>
                            <button
                              type="button"
                              onClick={requestDeleteAvatar}
                              className="block w-full px-3 py-2 text-left text-red-300 hover:bg-red-500/20"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2.5">
                        {/* Nombre completo con línea base (Ref 1) */}
                        <div className="border-b-2 border-dashed border-[rgba(139,110,58,0.4)] pb-1">
                          <span className="block text-[9px] font-bold uppercase text-[var(--gray-color)] tracking-wider">Nombre Completo:</span>
                          <h3 className="font-bold text-xl text-gray-950 leading-tight tracking-tight">{user.username}</h3>
                        </div>
                        {/* Rango (Ref 3) */}
                        <div className="flex items-center gap-2">
                           <span className="block text-[11px] font-bold uppercase text-[var(--gray-color)] tracking-wider">Rango:</span>
                           {getRoleBadge(user.role, user.roleColor)}
                        </div>
                      </div>
                    </div>

                    {/* DETAILS GRID (3 columnas, estructura formulario Ref 1) */}
                    <div className="grid grid-cols-3 gap-x-4 gap-y-3 font-mono-dossier text-sm text-gray-800 flex-1">
                      <div className="col-span-1 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="block font-bold uppercase text-[12px] text-[var(--gray-color)] tracking-wider">País</span>
                        <span className="block text-[12px] font-bold text-gray-950">{user.country || "MX"}</span>
                      </div>
                      <div className="col-span-2 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="block font-bold uppercase text-[12px] text-[var(--gray-color)] tracking-wider">ID Ciudadano</span>
                        <span className="block text-[12px] font-bold text-gray-950">TDT-{user.id?.toString().padStart(4, '0') || "XXXX"}</span>
                      </div>

                      <div className="col-span-3 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="block font-bold uppercase text-[12px] text-[var(--gray-color)] tracking-wider">Correo Electrónico</span>
                        <span className="block text-[12px] font-bold text-gray-950 break-all">{user.email || "N/A"}</span>
                      </div>

                      <div className="col-span-2 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="block font-bold uppercase text-[12px] text-[var(--gray-color)] tracking-wider">Fecha de registro</span>
                        <span className="block text-[12px] font-bold text-gray-950">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX', {year: 'numeric', month: '2-digit', day: '2-digit'}) : "N/A"}
                        </span>
                      </div>
                      <div className="col-span-1 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="block font-bold uppercase text-[12px] text-[var(--gray-color)] tracking-wider">Emisión</span>
                        <span className="block text-[12px] font-bold text-gray-950">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX', {year: 'numeric', month: '2-digit', day: '2-digit'}) : "N/A"}
                        </span>
                      </div>

                      <div className="col-span-3 flex items-center justify-between gap-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold uppercase text-[12px] text-[var(--gray-color)] tracking-wider">Estatus:</span>
                          <span
                            className="font-bold px-2 py-0.5 rounded text-[12px] uppercase shadow-sm"
                            style={{ color: '#fff', backgroundColor: currentStatus.color }}
                          >
                            {currentStatus.label}
                          </span>
                        </div>
                        {/* Pequeña firma simulada (Ref 3) */}
                        <div className="text-right border-b border-gray-900 pb-0.5 pr-1">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block leading-none">Firma Titular</span>
                            <span className="font-serif italic text-base text-gray-950">{user.username}</span>
                        </div>
                      </div>
                    </div>

                    {/* FOOTER (Ref 3) */}
                    <div className="text-center pt-2 border-t border-[rgba(139,110,58,0.4)] text-[8px] text-[var(--gray-color)] mt-auto">
                      <p className="font-medium tracking-tight">AUTENTICACIÓN BIOMÉTRICA VERIFICADA | © TierraDeTodos</p>
                      <p className="mt-0.5 italic">Haz doble clic para ver el reverso</p>
                    </div>
                  </div>
                </div>

                {/* REVERSO */}
                <div className="credential-back">
                  <div className="h-full rounded-2xl paper-texture flex items-center justify-center p-4 border border-[rgba(139,110,58,0.3)]">

                    <div className="w-full h-full rounded-lg bg-black/10 flex items-center justify-center p-3 shadow-inner overflow-hidden border border-[rgba(139,110,58,0.15)]">
                      <img
                        src="/img/tierradetodos.png"
                        alt="TierraDeTodos Logo Grande"
                        className="object-contain"
                        style={{
                          width: "80%",
                          height: "80%",
                          opacity: 0.8,
                          filter: 'sepia(0.3) contrast(1.1)',
                          transform: "rotate(90deg)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ADDITIONAL INFO - SIN CAMBIOS */}
          <div className="w-full lg:flex-1 min-w-0 space-y-6">

            {/* STATUS */}
            <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentStatus.color }}
                />
                Estatus Actual
              </h2>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 bg-white/5 p-4 rounded-lg border border-white/10">
                  <span className="text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-wider block">
                    Estado
                  </span>
                  <span className="text-lg font-bold" style={{ color: currentStatus.color }}>
                    {currentStatus.label}
                  </span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg border border-white/10 space-y-2 text-sm">
                <div>
                  <span className="text-[var(--ins-text-gray)] text-xs uppercase font-bold">Actualizado por:</span>
                  <p className="font-semibold">{user.status_changed_by || "Sistema"}</p>
                </div>
                <div>
                  <span className="text-[var(--ins-text-gray)] text-xs uppercase font-bold">Fecha de Cambio:</span>
                  <p className="font-semibold">
                    {user.status_changed_at ? new Date(user.status_changed_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* SECURITY */}
            <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-[var(--secondary-color)]" />
                Seguridad
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {user.devices?.map((device) => (
                  <div
                    key={device.id}
                    className={`p-4 rounded-lg border transition-all ${
                      device.isCurrent
                        ? "bg-[var(--secondary-color)]/10 border-[var(--secondary-color)]/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded bg-white/10 text-gray-400 mt-0.5">
                          <Monitor size={16} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            {device.device}
                            {device.isCurrent && (
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Actual
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-[var(--ins-text-gray)] mt-1">
                            Última actividad: {device.lastActive ? new Date(device.lastActive).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-[var(--danger-color)]/5 rounded-lg border border-[var(--danger-color)]/20 flex items-start gap-3">
                <ShieldAlert
                  className="text-[var(--danger-color)] shrink-0 mt-0.5"
                  size={18}
                />
                <div className="flex-1">
                  <h3 className="text-[var(--danger-color)] font-bold text-sm">
                    ¿Ves actividad sospechosa?
                  </h3>
                  <p className="text-[var(--danger-color)]/80 text-xs mt-1 mb-2">
                    Cierra sesión en todos los dispositivos para proteger tu cuenta.
                  </p>
                  <Button
                    variant="cancel"
                    size="sm"
                    className="text-xs"
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

      {isAvatarEditorOpen && avatarPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#151515] border border-white/10 p-5 space-y-4">
            <h3 className="text-lg font-bold text-white">Ajustar avatar</h3>

            <div className="mx-auto w-40 h-48 minecraft-mugshot rounded overflow-hidden p-1.5">
              <img
                src={avatarPreview}
                alt="Vista previa avatar"
                className="w-full h-full object-cover"
                style={{
                  imageRendering: "pixelated",
                  objectPosition: `${avatarDraft.posX}% ${avatarDraft.posY}%`,
                  transform: `scale(${avatarDraft.zoom})`,
                }}
              />
            </div>

            <div className="space-y-3 text-sm text-white">
              <label className="block">
                <span className="text-xs text-white/70">Horizontal ({Math.round(avatarDraft.posX)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={avatarDraft.posX}
                  onChange={(e) => setAvatarDraft((prev) => ({ ...prev, posX: Number(e.target.value) }))}
                  className="w-full"
                />
              </label>

              <label className="block">
                <span className="text-xs text-white/70">Vertical ({Math.round(avatarDraft.posY)}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={avatarDraft.posY}
                  onChange={(e) => setAvatarDraft((prev) => ({ ...prev, posY: Number(e.target.value) }))}
                  className="w-full"
                />
              </label>

              <label className="block">
                <span className="text-xs text-white/70">Zoom ({avatarDraft.zoom.toFixed(2)}x)</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={avatarDraft.zoom}
                  onChange={(e) => setAvatarDraft((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
                  className="w-full"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="cancel"
                size="sm"
                onClick={() => setIsAvatarEditorOpen(false)}
                disabled={isSavingAvatarPosition}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveAvatarPosition}
                disabled={isSavingAvatarPosition}
              >
                {isSavingAvatarPosition ? "Guardando..." : "Listo"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* SKELETON - SIN CAMBIOS */
function ProfileSkeleton() {
  return (
    <section className="min-h-screen py-10 flex items-center justify-center bg-[var(--ins-background)]">
      <div className="w-full max-w-7xl animate-pulse space-y-8 px-4">

        <div className="h-20 bg-white/10 rounded w-1/3" />

        <div className="flex gap-8">
          <div className="lg:w-2/5">
            <div className="h-[500px] bg-white/10 rounded-2xl" />
          </div>
          <div className="lg:w-3/5 space-y-6">
            <div className="h-40 bg-white/10 rounded-2xl" />
            <div className="h-64 bg-white/10 rounded-2xl" />
          </div>
        </div>

      </div>
    </section>
  );
}

export default Profile;