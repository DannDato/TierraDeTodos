import { User, Upload } from "lucide-react";
import cancelledStamp from "../img/cancelled.webp";

function Credencial({
  user,
  currentStatus,
  isInactiveStatus,
  isCancelledStatus,
  isFlipped = false,
  onToggleFlip = () => {},
  avatarInputRef,
  onAvatarInputChange = () => {},
  onAvatarClick = () => {},
  isUploadingAvatar = false,
  isSavingAvatarPosition = false,
  avatarPreview,
  avatarImageStyle = {},
  isAvatarMenuOpen = false,
  onOpenAvatarEditor = () => {},
  onTriggerAvatarPicker = () => {},
  onRequestDeleteAvatar = () => {},
  readOnly = false,
}) {
  const UserFallbackIcon = User;

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

  const getRoleBadge = (role, roleColor) => {
    const safeRole = role || "N/A";
    const color = roleColor || user?.roleColor || "#29d096";

    return (
      <span
        className="inline-flex justify-center items-center text-[10px] font-mono font-bold px-3 py-0.5 rounded shadow-inner uppercase tracking-wider"
        style={{
          color: "#000",
          backgroundColor: toRgba(color, 0.4),
          border: `1px solid ${toRgba(color, 0.5)}`,
        }}
      >
        {safeRole}
      </span>
    );
  };

  const getCredentialPaperStyle = (roleColor, roleExtra) => {
    const color = roleColor || user?.roleColor;
    const extra = roleExtra || user?.roleExtra || color;
    if (!color) {
      return {
        backgroundColor: "#f0e8d8",
        borderColor: "rgba(139,110,58,0.3)",
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(139, 110, 58, 1) inset",
      };
    }

    return {
      backgroundColor: color,
      borderColor: extra || color,
      boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 1px 1px ${extra || color} inset`,
    };
  };

  const credentialPaperStyle = getCredentialPaperStyle(user?.roleColor, user?.roleExtra);

  const credentialThemeStyle = {
    "--credential-label-color": user?.roleComplementary || "var(--gray-color)",
    "--credential-data-color": user?.roleEnfasis || "#111827",
    "--credential-id-color": user?.roleExtra || "var(--gray-color)",
  };

  return (
    <div className="w-full max-w-[340px] lg:max-w-[360px] mx-auto lg:mx-0 lg:shrink-0">
      <style>{`
        .credential-container {
          perspective: 1000px;
        }
        .credential-flipper {
          position: relative;
          width: 100%;
          height: 520px;
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

        .credential-themed .credential-label {
          color: var(--credential-label-color) !important;
        }

        .credential-themed .credential-data {
          color: var(--credential-data-color) !important;
        }

        .credential-themed .credential-id {
          color: var(--credential-id-color) !important;
        }

        .paper-texture {
          background-color: #f0e8d8;
          background-image:
            repeating-linear-gradient(45deg, rgba(139, 110, 58, 0.01) 0px, rgba(139, 110, 58, 0.01) 2px, transparent 2px, transparent 4px);
          box-shadow:
            0 10px 25px -5px rgba(0, 0, 0, 0.6),
            0 0 1px 1px rgba(139, 110, 58, 1) inset;
        }

        .font-mono-dossier {
          font-family: 'Courier New', Courier, monospace;
          letter-spacing: -0.5px;
        }

        .minecraft-mugshot {
          background-image: url('https://www.transparenttextures.com/patterns/dark-dotted.png'),
                            linear-gradient(to bottom, #5a5a5a, #4a4a4a);
          border: 4px solid #3a3a3a;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.3);
          image-rendering: pixelated;
        }
      `}</style>

      {isInactiveStatus ? (
        <div className="h-[520px] rounded-2xl paper-texture border border-[rgba(139,110,58,0.3)] flex items-center justify-center p-6 text-center">
          <div className="space-y-3">
            <p className="text-[13px] uppercase tracking-[0.2em] font-bold text-[var(--gray-color)]">Estado de Solicitud</p>
            <h3 className="text-2xl font-extrabold text-gray-900">Tramite en proceso</h3>
            <p className="text-[13px] text-gray-700 font-mono-dossier max-w-[260px] mx-auto">
              Tu cuenta aun no ha sido autorizada. La credencial estara disponible cuando el estatus cambie a activo.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`credential-container credential-themed relative ${readOnly ? "" : "cursor-pointer"} select-none ${isFlipped ? "flipped" : ""}`}
          style={credentialThemeStyle}
          onDoubleClick={readOnly ? undefined : onToggleFlip}
        >
          {!readOnly && (
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={onAvatarInputChange}
              className="hidden"
            />
          )}

          <div className="credential-flipper">
            <div className="credential-front">
              <div
                className="h-full rounded-2xl paper-texture flex flex-col pt-5 pb-3 px-6 text-gray-900 border border-[rgba(139,110,58,0.3)]"
                style={credentialPaperStyle}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-[rgba(139,110,58,0.5)] mb-3">
                  <img src="/img/tierradetodos.png" alt="TDT Logo" className="w-20" />
                  <div className="flex-1 text-right">
                    <p className="credential-data font-extrabold text-[17px] text-gray-950 uppercase tracking-tight leading-none text-right">Identidad Ciudadana</p>
                    <p className="text-[12px] credential-label font-medium mt-1 text-right font-mono-dossier">Ministerio de Tierra de Todos</p>
                  </div>
                </div>

                <div className="border-b-2 border-dashed border-[rgba(139,110,58,0.4)] pb-2 mb-3">
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <span className="credential-label block text-[9px] font-bold uppercase tracking-wider">Nombre de usuario:</span>
                      <h3 className="credential-data font-bold text-xl leading-tight tracking-tight font-mono-dossier truncate">{user.username}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                      <span className="credential-label font-bold uppercase text-[9px] tracking-wider">Estatus:</span>
                      <span
                        className="font-bold px-2 py-0.5 rounded text-[9px] uppercase shadow-sm"
                        style={{ color: "#fff", backgroundColor: currentStatus.color }}
                      >
                        {currentStatus.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-5 my-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={onAvatarClick}
                      className="minecraft-mugshot w-28 h-36 rounded flex-shrink-0 flex items-center justify-center p-1.5 overflow-hidden relative"
                      title="Subir imagen de perfil"
                      disabled={readOnly || isUploadingAvatar || isSavingAvatarPosition}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Skin Head"
                          className="w-full h-full object-cover"
                          style={{ imageRendering: "pixelated", ...avatarImageStyle }}
                        />
                      ) : (
                        <UserFallbackIcon size={60} className="credential-label" />
                      )}

                      {!readOnly && !avatarPreview && (
                        <span className="absolute inset-x-0 bottom-0 bg-black/45 text-white text-[9px] py-0.5 flex items-center justify-center gap-1">
                          <Upload size={10} />
                          {isUploadingAvatar ? "Subiendo..." : "Subir"}
                        </span>
                      )}
                    </button>

                    {!readOnly && avatarPreview && isAvatarMenuOpen && (
                      <div className="absolute z-20 top-[calc(100%+6px)] left-0 rounded-lg border border-black/30 bg-[var(--ins-background)] shadow-lg overflow-hidden text-xs min-w-[120px]">
                        <button
                          type="button"
                          onClick={onOpenAvatarEditor}
                          className="block w-full px-3 py-2 text-left text-white hover:bg-white/10"
                        >
                          Mover
                        </button>
                        <button
                          type="button"
                          onClick={onTriggerAvatarPicker}
                          className="block w-full px-3 py-2 text-left text-white hover:bg-white/10"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={onRequestDeleteAvatar}
                          className="block w-full px-3 py-2 text-left text-red-300 hover:bg-red-500/20"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 h-36 flex flex-col justify-between">
                    <div className="grid grid-cols-3 gap-x-3 gap-y-2 font-mono-dossier text-sm flex-1 mt-2">
                      <div className="col-span-1 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="credential-label block font-bold uppercase text-[12px] tracking-wider">Pais</span>
                        <span className="credential-data block text-[12px] font-bold">{user.country || "MX"}</span>
                      </div>
                      <div className="col-span-2 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="credential-label block font-bold uppercase text-[12px] tracking-wider">ID Ciudadano</span>
                        <span className="credential-id block text-[12px] font-bold">{user.folio || `TDT-${user.id?.toString().padStart(8, "0") || "XXXXXXXX"}`}</span>
                      </div>

                      <div className="col-span-3 space-y-0.5 border-b border-[rgba(139,110,58,0.25)] pb-1">
                        <span className="credential-label block font-bold uppercase text-[12px] tracking-wider">Comunidad</span>
                        <span className="credential-data block text-[12px] font-bold break-all">TierraDeTodos</span>
                      </div>

                      <div className="col-span-3 border-b border-[rgba(139,110,58,0.25)] pb-1 space-y-0.5">
                        <span className="credential-label block font-bold uppercase text-[12px] tracking-wider">Fecha de registro</span>
                        <span className="credential-data block text-[12px] font-bold font-mono-dossier">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" }) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-[rgba(139,110,58,0.25)] pb-2 mb-2">
                  <span className="credential-label block font-bold uppercase text-[12px] tracking-wider">Insignias</span>
                  <div className="mt-1 h-12 rounded border border-dashed border-[rgba(139,110,58,0.35)] bg-black/5" />
                </div>

                <div>
                  <div className="flex items-center justify-end gap-1 pt-0.5">
                    <div className="text-right border-b border-gray-900 pb-0.5 pr-1 min-w-[120px]">
                      <span className="credential-label text-[9px] font-bold uppercase tracking-widest block leading-none">Firma Titular</span>
                      <span className="credential-data font-serif italic text-base">{user.username}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2 border-t border-[rgba(139,110,58,0.4)] text-[8px] mt-auto">
                  <p className="credential-label font-medium tracking-tight">Identidad única verificada | © TierraDeTodos</p>
                  <p className="credential-label mt-0.5 italic">Haz doble clic para ver el reverso</p>
                </div>
              </div>
            </div>

            <div className="credential-back">
              <div
                className="h-full rounded-2xl paper-texture flex items-center justify-center p-4 border border-[rgba(139,110,58,0.3)]"
                style={credentialPaperStyle}
              >
                <div className="w-full h-full rounded-lg bg-black/10 flex items-center justify-center p-3 shadow-inner overflow-hidden border border-[rgba(139,110,58,0.15)]">
                  <img
                    src="/img/tierradetodos.png"
                    alt="TierraDeTodos Logo Grande"
                    className="object-contain"
                    style={{
                      width: "80%",
                      height: "80%",
                      opacity: 0.8,
                      filter: "sepia(0.3) contrast(1.1)",
                      transform: "rotate(90deg)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {isCancelledStatus && (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
              <img
                src={cancelledStamp}
                alt="Credencial cancelada"
                className="w-[88%] max-w-[320px] opacity-80"
                style={{ transform: "rotate(-12deg)" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Credencial;
