import { useState, useEffect, useRef } from "react";
import { LogOut, PencilIcon, Monitor, ShieldAlert } from "lucide-react";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import FilePickerButton from "../../elements/FilePickerButton";
import AlertModal from "../../elements/AlertModal";
import api from "../../api/axios";
import Credencial from "../../components/Credencial";
import LoadingOverlay from "../../components/LoadingOverlay";

function Profile() {
  const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };

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
  const [streamerForm, setStreamerForm] = useState({
    link: "",
    communityName: "",
    image: "",
  });
  const [streamerImageFile, setStreamerImageFile] = useState(null);
  const [isLoadingStreamer, setIsLoadingStreamer] = useState(false);
  const [isSavingStreamer, setIsSavingStreamer] = useState(false);
  const [streamerNotice, setStreamerNotice] = useState("");
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const [profileResponse, credentialResponse] = await Promise.all([
          api.get("/user/profile"),
          api.get("/user/credential")
        ]);

        const profileData = profileResponse?.data?.user || profileResponse?.data || {};
        const credentialData = credentialResponse?.data?.user || credentialResponse?.data || {};

        setUser({
          ...profileData,
          ...credentialData,
          devices: profileData.devices || []
        });
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

  const currentStatus = {
    label: (statusConfig[user?.status]?.label) || "Desconocido",
    color: user?.statusColor || "#8a8a8a",
  };
  const normalizedStatus = String(user?.status || "").toUpperCase();
  const normalizedRole = String(user?.role || currentUser.role || "").toUpperCase();
  const isStreamerRole = normalizedRole === "STREAMER";
  const isInactiveStatus = normalizedStatus === "INACTIVE";
  const isCancelledStatus = normalizedStatus === "BANNED";
  const statusReason = isCancelledStatus
    ? (user?.status_reason || "No se registro un motivo de baneo.")
    : (isInactiveStatus
      ? "Su cuenta esta en revision esperando a ser autorizada por algun administrador."
      : (user?.status_reason || "Sin observaciones"));

  const avatarPreview = user?.avatarUrl || user?.mc_skin_head || null;
  const avatarPosX = Number.isFinite(Number(user?.avatarPosX)) ? Number(user?.avatarPosX) : 50;
  const avatarPosY = Number.isFinite(Number(user?.avatarPosY)) ? Number(user?.avatarPosY) : 50;
  const avatarZoom = Number.isFinite(Number(user?.avatarZoom)) ? Number(user?.avatarZoom) : 1;
  const avatarImageStyle = {
    objectPosition: `${avatarPosX}% ${avatarPosY}%`,
    transform: `scale(${avatarZoom})`,
  };

  useEffect(() => {
    if (!user || !isStreamerRole) return;

    const loadStreamerProfile = async () => {
      try {
        setIsLoadingStreamer(true);
        const { data } = await api.get("/user/streamer");
        const streamer = data?.streamer || null;

        if (!streamer) {
          setStreamerForm({ link: "", communityName: "", image: "" });
          return;
        }

        setStreamerForm({
          link: streamer.link || "",
          communityName: streamer.communityName || "",
          image: streamer.image || "",
        });
      } catch (_err) {
        setStreamerNotice("No se pudo cargar tu perfil de streamer.");
      } finally {
        setIsLoadingStreamer(false);
      }
    };

    loadStreamerProfile();
  }, [user, isStreamerRole]);

  const handleStreamerChange = (field, value) => {
    setStreamerNotice("");
    setStreamerForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStreamerImageSelect = (file) => {
    if (!file) {
      setStreamerImageFile(null);
      return;
    }

    if (!file.type?.startsWith("image/")) {
      window.alert("Solo se permiten imágenes");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert("La imagen no debe superar 5MB");
      return;
    }

    setStreamerImageFile(file);
  };

  const handleStreamerSubmit = async (event) => {
    event.preventDefault();

    const link = streamerForm.link.trim();
    const communityName = streamerForm.communityName.trim();

    if (!link || !communityName) {
      setStreamerNotice("Link y nombre de comunidad son obligatorios.");
      return;
    }

    try {
      setIsSavingStreamer(true);
      setStreamerNotice("");

      const formData = new FormData();
      formData.append("link", link);
      formData.append("communityName", communityName);

      if (streamerImageFile) {
        formData.append("image", streamerImageFile);
      } else if (streamerForm.image) {
        formData.append("image", streamerForm.image);
      }

      const { data } = await api.put("/user/streamer", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const saved = data?.streamer;
      if (saved) {
        setStreamerForm({
          link: saved.link || "",
          communityName: saved.communityName || "",
          image: saved.image || "",
        });
      }

      setStreamerImageFile(null);
      setStreamerNotice(data?.message || "Perfil de streamer guardado correctamente.");
    } catch (err) {
      setStreamerNotice(err.response?.data?.message || "No se pudo guardar el perfil de streamer.");
    } finally {
      setIsSavingStreamer(false);
    }
  };

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
      <LoadingOverlay
        isVisible={!user || isUploadingAvatar || isSavingAvatarPosition || isLoadingStreamer || isSavingStreamer}
        message={!user ? "Cargando cuenta..." : "Guardando cambios..."}
      />

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

      {user && (
      <div className="w-full max-w-7xl px-4 md:px-8 text-[var(--ins-text-white)]">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">

          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Credencial</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Tu Identificación
            </h1>

            <p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
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

          {/* LEFT: CREDENTIAL */}
          <Credencial
            user={user}
            currentStatus={currentStatus}
            isInactiveStatus={isInactiveStatus}
            isCancelledStatus={isCancelledStatus}
            isFlipped={isFlipped}
            onToggleFlip={() => setIsFlipped(!isFlipped)}
            avatarInputRef={avatarInputRef}
            onAvatarInputChange={handleAvatarInputChange}
            onAvatarClick={handleAvatarClick}
            isUploadingAvatar={isUploadingAvatar}
            isSavingAvatarPosition={isSavingAvatarPosition}
            avatarPreview={avatarPreview}
            avatarImageStyle={avatarImageStyle}
            isAvatarMenuOpen={isAvatarMenuOpen}
            onOpenAvatarEditor={openAvatarEditor}
            onTriggerAvatarPicker={triggerAvatarPicker}
            onRequestDeleteAvatar={requestDeleteAvatar}
          />

          {/* RIGHT: ADDITIONAL INFO - SIN CAMBIOS */}
          <div className="w-full lg:flex-1 min-w-0 space-y-6">

            {/* STATUS */}
            <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentStatus.color }}
                />
                Estatus Actual
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/5 p-4 rounded-lg">
                  <span className="text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-wider block">
                    Estado
                  </span>
                  <span className="text-lg font-bold" style={{ color: currentStatus.color }}>
                    {currentStatus.label}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--ins-text-gray)] text-xs uppercase font-bold block mb-1">Motivo</span>
                  <p className="font-semibold text-sm leading-relaxed break-words">{statusReason}</p>
                </div>

                <div>
                  <span className="text-[var(--ins-text-gray)] text-xs uppercase font-bold block mb-1">Actualizado por</span>
                  <p className="font-semibold text-sm">{user.status_changed_by || "Sistema"}</p>
                  <p className="text-xs text-[var(--ins-text-gray)] mt-1">
                    {user.status_changed_at ? new Date(user.status_changed_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>

              {isCancelledStatus && (
                <div className="mt-4">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full md:w-auto"
                    href="/tickets?type=APELACION&subject=Apelacion%20de%20baneo"
                  >
                    Iniciar apelacion
                  </Button>
                </div>
              )}
            </div>

            {isStreamerRole && (
              <form className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm space-y-4" onSubmit={handleStreamerSubmit}>
                <h2 className="text-xl font-bold">Perfil de Streamer</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Link"
                    value={streamerForm.link}
                    onChange={(event) => handleStreamerChange("link", event.target.value)}
                    placeholder="Pega aqui el link donde haces streams"
                  />

                  <Input
                    label="Nombre de comunidad"
                    value={streamerForm.communityName}
                    onChange={(event) => handleStreamerChange("communityName", event.target.value)}
                    placeholder="Ej. tonotos "
                  />
                </div>

                <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
                  <FilePickerButton
                    label="Imagen de perfil de plataforma"
                    buttonText="Subir imagen"
                    accept="image/*"
                    onFileSelect={handleStreamerImageSelect}
                    fileName={streamerImageFile?.name || ""}
                    disabled={isSavingStreamer}
                    className="md:max-w-sm"
                  />

                  <div className="md:ml-auto">
                    <Button type="submit" variant="primary" size="sm" disabled={isSavingStreamer}>
                      {isSavingStreamer ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>

                {streamerForm.image && (
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-xs text-[var(--ins-text-gray)] mb-2">Imagen actual</p>
                    <img
                      src={streamerForm.image}
                      alt="Imagen de streamer"
                      className="h-28 w-28 object-cover rounded-lg"
                    />
                  </div>
                )}

                {streamerNotice && (
                  <p className="text-sm text-[var(--ins-text-gray)]">{streamerNotice}</p>
                )}

              </form>
            )}

            {/* SECURITY */}
            <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-[var(--secondary-color)]" />
                Seguridad
              </h2>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 tdt-scrollbar">
                {user.devices?.map((device) => (
                  <div
                    key={device.id}
                    className={`p-4 rounded-lg transition-all ${
                      device.isCurrent
                        ? "bg-[var(--secondary-color)]/10"
                        : "bg-white/5"
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
                              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase px-2 py-0.5 rounded-full">
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

              <div className="mt-4 p-4 bg-[var(--danger-color)]/5 rounded-lg flex items-start gap-3">
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
      )}

      {user && isAvatarEditorOpen && avatarPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#151515] p-5 space-y-4">
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

export default Profile;