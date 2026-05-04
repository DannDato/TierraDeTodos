import CommunityCard from "./CommunityCard";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Input from "../../elements/Input";
import Button from "../../elements/Button";
import FilePickerButton from "../../elements/FilePickerButton";
import LoadingOverlay from "../LoadingOverlay";
import InfoRow from "../../elements/InfoRow";
import AlertModal from "../../elements/AlertModal";
import { Video, User, Link as LinkIcon, Hash, Palette, FileText, Users } from "lucide-react";

function MembersTable({ members = [] }) {
  return (
    <div className="rounded-3xl bg-[var(--black-color)]/20 overflow-hidden mt-8 border border-white/10">
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-white)]">Miembros</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-white)]">
          {members.length} registros
        </span>
      </div>

      {members.length === 0 ? (
        <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-white)]">
          No hay miembros en esta comunidad.
        </div>
      ) : (
        <div className="overflow-x-auto tdt-scrollbar">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[var(--white-color)]/5 text-[10px] uppercase tracking-[0.22em] text-[var(--ins-text-white)]">
              <tr>
                <th className="px-5 py-3 font-bold">#</th>
                <th className="px-5 py-3 font-bold"></th>
                <th className="px-5 py-3 font-bold">Usuario</th>
                <th className="px-5 py-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => {
                const memberName = member?.nombre || member?.username || "N/A";
                const isLeader = String(member?.account || member?.role || "").toLowerCase() === "leader";
                const avatarSrc = member?.profileImage || member?.avatarUrl || null;

                return (
                  <tr key={member?.id || `${memberName}-${index}`} className="border-t border-[var(--white-color)]/5 align-top">
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">{index + 1}</td>
                    <td className="px-5 py-3">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={memberName}
                          className="w-8 h-8 rounded-full border object-cover"
                          style={{ borderColor: "var(--white-color)" }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 text-[var(--ins-text-white)] flex items-center justify-center text-xs font-bold uppercase">
                          {String(memberName).charAt(0)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">{memberName}</td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                      {isLeader ? (
                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-green-500/20 text-green-400">Lider</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-blue-500/20 text-blue-400">Miembro</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CommunityManager({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    plataforma: "",
    streamer: "",
    streamerLogo: null, // archivo
    canal: "",
    nombreComunidad: "",
    nombreCorto: "",
    color: "#FFFFFF",
    color2: "#222222",
    descripcionComunidad: ""
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
  });

  const [communityData, setCommunityData] = useState(null);

  const hasCommunityManage = () => {
    return api.get("/user/communities/can-manage").then(res => res.data.canManage).catch(() => false);
  };

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !hasCommunityManage()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let pending = 2;
    const finish = () => {
      pending--;
      if (pending === 0 && isMounted) setLoading(false);
    };
    api.get("/user/my-community")
      .then(res => {
        if (!isMounted) return;
        const c = res.data.community;
        if (c) {
          setCommunityData(c); // Guarda el objeto completo
          setFormData({
            plataforma: c.leader?.streamer?.platform || "",
            streamer: c.leader?.streamer?.username || "",
            streamerLogo: null,
            canal: c.leader?.streamer?.link || "",
            nombreComunidad: c.name || "",
            nombreCorto: c.shortname || "",
            color: c.color || "#FFFFFF",
            color2: c.color2 || "#222222",
            descripcionComunidad: c.description || ""
          });
          setHasFormChanges(false);
        }
      })
      .catch(() => {})
      .finally(finish);
    api.get("/user/community/members")
      .then(res => { if (isMounted) setMembers(res.data.members || []); })
      .catch(() => { if (isMounted) setMembers([]); })
      .finally(finish);
    return () => { isMounted = false; };
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasFormChanges(true);
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = "";
      if (formData.streamerLogo) {
        const logoForm = new FormData();
        logoForm.append("logo", formData.streamerLogo);
        const token = localStorage.getItem("token");
        const uploadRes = await api.post("/user/communities/logo", logoForm, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        logoUrl = uploadRes.data.url;
      }
      const token = localStorage.getItem("token");
      await api.post(
        "/user/communities",
        {
          platform: formData.plataforma,
          streamerUsername: formData.streamer,
          streamerImage: logoUrl,
          streamerLink: formData.canal,
          communityName: formData.nombreComunidad,
          shortname: formData.nombreCorto,
          color: formData.color,
          color2: formData.color2,
          description: formData.descripcionComunidad,
          logo_url: logoUrl
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setAlertConfig({
        isOpen: true,
        type: "success",
        title: "Comunidad actualizada",
        message: "Comunidad guardada correctamente.",
      });
      setHasFormChanges(false);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        type: "error",
        title: "Error al guardar",
        message: err.response?.data?.message || err.message || "No se pudo guardar la comunidad",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  if (!hasCommunityManage()) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--ins-background)] rounded-2xl shadow-2xl p-8 w-full max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-4 text-[var(--secondary-color)]">Sin permiso</h2>
          <p className="mb-6">No tienes permiso para gestionar comunidades.</p>
          <Button onClick={onClose} variant="primary">Cerrar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[120] transition-opacity duration-200">
      {/* Overlay igual que AlertModal */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <LoadingOverlay
        isVisible={loading}
        message="Cargando información de la comunidad..."
      />
      <AlertModal
        isOpen={alertConfig.isOpen}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
        onConfirm={closeAlert}
        confirmText="Cerrar"
        cancelText="Cerrar"
        className="z-[260]"
      />
      <div className="relative w-full max-w-5xl rounded-2xl  bg-[var(--ins-background)]/50 backdrop-blur-lg border border-white/10 p-8 shadow-2xl ring-1 ring-white/10 animate-fadeInUp h-[90vh] mt-[-65px]" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--ins-text-gray)] hover:text-[var(--secondary-color)] text-2xl font-bold">×</button>
        <h2 className="text-2xl font-bold mb-6 text-[var(--white-color)] flex items-center gap-2">
          <Video size={28} style={{ color: "var(--secondary-color)" }} /> Gestionar comunidad
        </h2>
        {/* Mostrar mensaje de cargando solo si loading y NO hay overlay */}
        {/* El overlay ya cubre el modal, así que no mostramos el mensaje duplicado */}
        {/* Ocultar el contenido del modal mientras loading */}
        {!loading && (
          <>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <div className="lg:col-span-1 my-2 flex flex-col h-full justify-between">
                  <div className="flex flex-col items-center">
                    <h4 className="text-md font-bold mb-2 text-[var(--secondary-color)]">Previsualización</h4>
                    <div style={{ maxWidth: 340, width: "100%" }}>
                      <CommunityCard
                        community={{
                          ...communityData,
                          name: formData.nombreComunidad || communityData?.name,
                          description: formData.descripcionComunidad || communityData?.description,
                          color: formData.color || communityData?.color,
                          color2: formData.color2 || communityData?.color2,
                          logo_url: formData.streamerLogo ? URL.createObjectURL(formData.streamerLogo) : communityData?.logo_url,
                          leader: {
                            ...((communityData && communityData.leader) || {}),
                            profileImage: formData.streamerLogo ? URL.createObjectURL(formData.streamerLogo) : communityData?.leader?.profileImage,
                            streamer: { platform: formData.plataforma || communityData?.leader?.streamer?.platform },
                          },
                        }}
                      />
                    </div>
                    <div className="w-full mt-3" style={{ maxWidth: 340 }}>
                      <FilePickerButton
                        label="Cambiar imagen de comunidad"
                        onFileSelect={(file) => handleChange("streamerLogo", file)}
                        accept="image/*"
                      />
                      {formData.streamerLogo && (
                        <span className="text-xs text-green-400 mt-2 block">Imagen seleccionada: {formData.streamerLogo.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="w-full pt-4 self-center mt-auto mb-3" style={{ maxWidth: 340 }}>
                    {hasFormChanges && (
                      <div className="flex justify-center mt-3 ">
                        <Button type="submit" variant="primary">Guardar cambios</Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-[var(--secondary-color)]">Información del canal</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow
                      icon={<User size={16} />}
                      label="Nombre de streamer"
                      value={<Input name="streamer" value={formData.streamer} onChange={(e) => handleChange("streamer", e.target.value)} placeholder="Tu usuario en la plataforma" />}
                    />
                    <InfoRow
                      icon={<Video size={16} />}
                      label="Plataforma"
                      value={<Input name="plataforma" value={formData.plataforma} onChange={(e) => handleChange("plataforma", e.target.value)} placeholder="Twitch, YouTube, Kick..." />}
                    />
                  </div>

                  <InfoRow
                    icon={<LinkIcon size={16} />}
                    label="Canal"
                    value={<Input name="canal" value={formData.canal} onChange={(e) => handleChange("canal", e.target.value)} placeholder="https://www.twitch.tv/tu_usuario" />}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow
                      icon={<Users size={16} />}
                      label="Nombre de la comunidad"
                      value={<Input name="nombreComunidad" value={formData.nombreComunidad} onChange={(e) => handleChange("nombreComunidad", e.target.value)} placeholder="Nombre de la comunidad" />}
                    />
                    <InfoRow
                      icon={<Hash size={16} />}
                      label="Nombre corto"
                      value={<Input name="nombreCorto" value={formData.nombreCorto} onChange={(e) => handleChange("nombreCorto", e.target.value)} placeholder="Nombre corto para visualización" />}
                    />
                  </div>

                  <InfoRow
                    icon={<FileText size={16} />}
                    label="Descripcion"
                    value={<Input name="descripcionComunidad" value={formData.descripcionComunidad} onChange={(e) => handleChange("descripcionComunidad", e.target.value)} placeholder="Describe tu comunidad" />}
                  />

                  <div className="flex gap-6">
                    {/* Color primario */}
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs text-[var(--ins-text-white)] flex items-center gap-1">
                        <Palette size={14} /> Color primario
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={formData.color}
                          onChange={(e) => handleChange("color", e.target.value)}
                          placeholder="#FFFFFF"
                        />
                        <label
                          className="w-10 h-10 rounded-xl cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105"
                          style={{ backgroundColor: formData.color }}
                          title="Elegir color primario"
                        >
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => handleChange("color", e.target.value)}
                            className="opacity-0 w-full h-full cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Color secundario */}
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs text-[var(--ins-text-white)] flex items-center gap-1">
                        <Palette size={14} /> Color secundario
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={formData.color2}
                          onChange={(e) => handleChange("color2", e.target.value)}
                          placeholder="#222222"
                        />
                        <label
                          className="w-10 h-10 rounded-xl cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105"
                          style={{ backgroundColor: formData.color2 }}
                          title="Elegir color secundario"
                        >
                          <input
                            type="color"
                            value={formData.color2}
                            onChange={(e) => handleChange("color2", e.target.value)}
                            className="opacity-0 w-full h-full cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </form>
            <MembersTable members={members} />
          </>
        )}
      </div>
    </div>
  );
}
