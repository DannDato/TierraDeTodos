import CommunityCard from "./CommunityCard";
import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import Input from "../../elements/Input";
import Button from "../../elements/Button";
import FilePickerButton from "../../elements/FilePickerButton";
import LoadingOverlay from "../LoadingOverlay";
import { Video } from "lucide-react";

function MembersTable({ members = [] }) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-2 text-[var(--secondary-color)]">Miembros de la comunidad</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-black/10 rounded-xl">
          <thead>
            <tr className="text-left text-xs text-[var(--ins-text-gray)] uppercase">
              <th className="py-2 px-4">Usuario</th>
              <th className="py-2 px-4">Rol</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={2} className="py-4 px-4 text-center text-[var(--ins-text-gray)]">Sin miembros</td></tr>
            ) : (
              members.map((m, i) => (
                <tr key={i} className="border-b border-[var(--ins-border)]">
                  <td className="py-2 px-4">{m.username}</td>
                  <td className="py-2 px-4">{m.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [communityData, setCommunityData] = useState(null);

  const hasCommunityManage = () => {
    const perms = JSON.parse(localStorage.getItem("permissions") || "[]");
    return perms.includes("community.manage") || localStorage.getItem("role") === "SUPER-ADMIN";
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

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
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
      setSuccess("Comunidad guardada correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "No se pudo guardar la comunidad");
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
      <div className="relative w-full max-w-5xl rounded-2xl  bg-[var(--ins-background)]/95 p-8 shadow-2xl ring-1 ring-white/10 animate-fadeInUp" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--ins-text-gray)] hover:text-[var(--secondary-color)] text-2xl font-bold">×</button>
        <h2 className="text-2xl font-bold mb-6 text-[var(--white-color)] flex items-center gap-2">
          <Video size={28} style={{ color: "var(--secondary-color)" }} /> Gestionar comunidad
        </h2>
        {/* Mostrar mensaje de cargando solo si loading y NO hay overlay */}
        {/* El overlay ya cubre el modal, así que no mostramos el mensaje duplicado */}
        {!loading && error && <div className="text-center text-red-500 mb-2">{error}</div>}
        {!loading && success && <div className="text-center text-green-500 mb-2">{success}</div>}
        {/* Ocultar el contenido del modal mientras loading */}
        {!loading && (
          <>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-4">
                <Input label="Plataforma" name="plataforma" value={formData.plataforma} onChange={e => handleChange("plataforma", e.target.value)} placeholder="Twitch, YouTube, etc." />
                <Input label="Nombre de streamer" name="streamer" value={formData.streamer} onChange={e => handleChange("streamer", e.target.value)} placeholder="Tu nombre de usuario en la plataforma de streaming" />
                <FilePickerButton label="Imagen/Logo de Streamer" onFileSelect={file => handleChange("streamerLogo", file)} accept="image/*" />
                {formData.streamerLogo && (
                  <span className="text-xs text-green-400">Logo seleccionado: {formData.streamerLogo.name}</span>
                )}
              </div>
              <Input label="Link a tu canal" name="canal" value={formData.canal} onChange={e => handleChange("canal", e.target.value)} placeholder="https://www.twitch.tv/tu_usuario" />
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <Input label="Nombre de la comunidad" name="nombreComunidad" value={formData.nombreComunidad} onChange={e => handleChange("nombreComunidad", e.target.value)} placeholder="Nombre de la comunidad" />
                <Input label="Nombre corto" name="nombreCorto" value={formData.nombreCorto} onChange={e => handleChange("nombreCorto", e.target.value)} placeholder="Por si necesitamos un nombre mas cortito" />

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="my-6 flex flex-col items-center">
                  <h4 className="text-md font-bold mb-2 text-[var(--secondary-color)]">Previsualización</h4>
                  <div style={{ maxWidth: 340, width: '100%' }}>
                    <CommunityCard community={{
                      ...communityData,
                      // Sobrescribe con los datos del form si se están editando
                      name: formData.nombreComunidad || communityData?.name,
                      description: formData.descripcionComunidad || communityData?.description,
                      color: formData.color || communityData?.color,
                      color2: formData.color2 || communityData?.color2,
                      logo_url: formData.streamerLogo ? URL.createObjectURL(formData.streamerLogo) : (communityData?.logo_url),
                      leader: {
                        ...((communityData && communityData.leader) || {}),
                        profileImage: formData.streamerLogo ? URL.createObjectURL(formData.streamerLogo) : (communityData?.leader?.profileImage),
                        streamer: { platform: formData.plataforma || communityData?.leader?.streamer?.platform }
                      }
                    }} />
                  </div>
                </div>
                <div className="flex flex-col gap-4 justify-end">
                  <div className="flex flex-row gap-6 items-end">
                  <div className="flex flex-col items-center gap-1">
                    <Input label="Color primario" value={formData.color} onChange={e => handleChange("color", e.target.value)} placeholder="#FFFFFF" className="w-32" />
                      <label className="relative w-10 h-10 rounded-xl  cursor-pointer block overflow-hidden transition-transform hover:scale-105" style={{ backgroundColor: formData.color }} title="Elegir color primario">
                        <input type="color" value={formData.color} onChange={e => handleChange("color", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </label>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Input label="Color secundario" value={formData.color2} onChange={e => handleChange("color2", e.target.value)} placeholder="#222222" className="w-32" />
                      <label className="relative w-10 h-10 rounded-xl  cursor-pointer block overflow-hidden transition-transform hover:scale-105" style={{ backgroundColor: formData.color2 }} title="Elegir color secundario">
                        <input type="color" value={formData.color2} onChange={e => handleChange("color2", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </label>
                    </div>
                  </div>
                  <Input label="Descripción de la comunidad" name="descripcionComunidad" value={formData.descripcionComunidad} onChange={e => handleChange("descripcionComunidad", e.target.value)} placeholder="Describe tu comunidad" />
                  <div className="flex justify-end mt-2 ">
                    <Button type="submit" variant="primary">Guardar cambios</Button>
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
