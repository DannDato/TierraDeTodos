import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Input from "../../elements/Input";
import Button from "../../elements/Button";
import FilePickerButton from "../../elements/FilePickerButton";
import AlertModal from "../../elements/AlertModal";
import LoadingOverlay from "../../components/LoadingOverlay";
import CommunityManager from "../../components/community/CommunityManager";
import CommunityCard from "../../components/community/CommunityCard";

import { Video,  Mail, User, Calendar, Users, Info, File } from "lucide-react";

function Community() {
    const [showForm, setShowForm] = useState(false);
    const [manageComunity, setManageComunity] = useState(false);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showJoinAlert, setShowJoinAlert] = useState(false);

    const handleOpen = (community) => {
        setSelected(community);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setSelected(null);
    };

    const handleJoin = () => {
        api.post(`/user/community/${selected.id}/join`)
        .then(res => {
            alert("Solicitud enviada. El líder de la comunidad revisará tu solicitud y decidirá si te acepta o no.");
        })
        .catch(err => {
            alert("Error al solicitar unirse a la comunidad");
        });
        setShowJoinAlert(true);
    };
    const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };
    // ...existing code...
    const [formData, setFormData] = useState({
        plataforma: "",
        streamer: "",
        streamerLogo: "",
        canal: "",
        nombreComunidad: "",
        nombreCorto: "",
        color: "#FFFFFF"
    });
    const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    const [communities, setCommunities] = useState([]);
    const [loadingCommunities, setLoadingCommunities] = useState(false);
    const [errorCommunities, setErrorCommunities] = useState("");

    useEffect(() => {
        setLoadingCommunities(true);
        setErrorCommunities("");
        api.get("/user/communities")
            .then(res => {
                setCommunities(res.data.communities || []);
                const isManager = res.data.isManager || false;
                isManager ? setManageComunity(true) : setManageComunity(false);
            })
            .catch(err => {
                setErrorCommunities("No se pudieron cargar las comunidades");
            })
            .finally(() => setLoadingCommunities(false));
    }, []);
    return (
        <div>
        <section className="min-h-screen py-10 flex flex-col items-center bg-[var(--ins-background)] pb-24 text-[var(--white-color)] z-[1]">

            <div className="w-full max-w-7xl px-4 md:px-8 text-[var(--ins-text-white)]">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                        <span>{currentUser.role}</span>
                        <span>/</span>
                        <span className="text-[var(--secondary-color)]">Comunidades</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        Comunidades
                        </h1>

                        <p className="hidden lg:block text-sm text-[var(--ins-text-gray)] mt-2 max-w-lg">
                        Las comunidades que participan en Tierra de Todos
                        </p>
                    </div>
                    <Button
                        hidden={!manageComunity}
                        variant="primary"
                        onClick={() => setShowForm(true)}
                        type="button"
                    >
                        Gestiona tu comunidad
                    </Button>
                </div>
            {/* FORMULARIO DE COMUNIDAD VISIBLE PARA USUARIOS CON community.manage */}

            </div>
            <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-7xl px-4 md:px-8 my-5">
                <div className="w-full ">
                    <div className="bg-black/20 rounded-2xl p-6 backdrop-blur-sm p-10">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Video size={24} style={{ color: "var(--secondary-color)" }}/>
                            Comunidades registradas
                        </h2>
                        {loadingCommunities ? (
                            <div className="text-[var(--ins-text-gray)]">Cargando comunidades...</div>
                        ) : errorCommunities ? (
                            <div className="text-red-500">{errorCommunities}</div>
                        ) : communities.length === 0 ? (
                            <div className="text-[var(--ins-text-gray)]">No hay comunidades registradas.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hover:bounce">
                                {communities.map((community) => (
                                    <div key={community.id} className="cursor-pointer hover:scale-[1.03] transition-transform" onClick={() => handleOpen(community)}>
                                        <CommunityCard community={community} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Modal de gestión de comunidad fuera del mapeo para evitar múltiples instancias */}
            <CommunityManager isOpen={showForm} onClose={() => setShowForm(false)} />
            {/* Modal de detalle de comunidad */}
            <CommunityDetailModal isOpen={showModal} community={selected} onClose={handleClose} onJoin={handleJoin} />
            {/* AlertModal debe ir al final para estar sobre cualquier modal */}
            <AlertModal
                isOpen={showJoinAlert}
                type="warning"
                title="Un momento..."
                message="¿Estás seguro de que quieres solicitar unirte a esta comunidad? El líder de la comunidad revisará tu solicitud y decidirá si te acepta o no."
                confirmText="Sí, solicitar unirme"
                cancelText="No, cancelar"
                onClose={() => setShowJoinAlert(false)}
                onConfirm={handleJoin}
                className="z-[300]"
            />
        </section>
        </div>
    );
}

export default Community;

// Modal de detalle de comunidad
function CommunityDetailModal({ community, isOpen, onClose, onJoin }) {


    if (!isOpen || !community) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center transition-opacity duration-200">

            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl rounded-2xl  bg-[var(--ins-background)]/95 p-8 shadow-2xl ring-1 ring-white/10 animate-fadeInUp" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--ins-text-gray)] hover:text-[var(--secondary-color)] text-2xl font-bold">×</button>
                <div className="grid grid-cols-1 lg:grid-cols-3">
                    <div className="">
                        <CommunityCard community={community} className="w-full" />
                        <Button className="mt-6 w-full" variant="primary" onClick={onJoin}>Solicitar unirse</Button>
                    </div>
                    <div className="span-2 lg:col-span-2 lg:pl-8 mt-6 lg:mt-0 gap-4">
                        <h3 className="text-lg font-bold mb-2 text-[var(--secondary-color)]">Información del canal</h3>
                        <div className="xl:col-span-3 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoRow icon={<User size={18} />} label="Lider de la comunidad" value={community.leader?.username || "N/A"} />
                                <InfoRow
                                icon={<Users size={18} />}
                                label="Miembros"
                                value={community.members ? community.members.length : "Sin miembros :c"}
                                />
                            </div>
                            <InfoRow
                                icon={<Video size={18} />}
                                label="Canal"
                                className="col-span-2"
                                href={getLinkFromValue(community.leader?.streamer?.link)}
                                target="_blank"
                                value={community.leader?.streamer?.link ? community.leader?.streamer?.link : "N/A"}
                            />
                        </div>
                        <div className="mt-4">
                            <InfoRow
                                icon={<File size={18} />}
                                label="Descripcion"
                                className="mt-4"
                                value={community.description || "N/A"}
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <div className="rounded-2xl bg-[var(--black-color)]/20 overflow-hidden mt-4">
                        <div className="px-5 py-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-gray)]">Miembros</p>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-gray)]">
                             {community.members ? community.members.length : 0} registros
                        </span>
                        </div>

                        {community.members && community.members.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-gray)]">
                            No hay movimientos de estatus registrados para este usuario.
                        </div>
                        ) : (
                        <div className="overflow-x-auto tdt-scrollbar">
                            <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="bg-[var(--white-color)]/5 text-[10px] uppercase tracking-[0.22em] text-[var(--ins-text-gray)]">
                                <tr>
                                <th className="px-5 py-3 font-bold">#</th>
                                <th className="px-5 py-3 font-bold">Usuario</th>
                                <th className="px-5 py-3 font-bold">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {community.members && community.members.map((entry, index) => (
                                <tr key={entry.id} className="border-t border-[var(--white-color)]/5 align-top">
                                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                                    {index + 1}
                                    </td>
                                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                                    {entry.nombre || "N/A"}
                                    </td>
                                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                                    {entry.role === "leader" ? (
                                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-green-500/20 text-green-400">Líder</span>
                                    ) : (
                                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-blue-500/20 text-blue-400">Miembro</span>
                                    )}
                                    </td>

                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ icon, label, value, href, target }) {
  const link = href || getLinkFromValue(value);
  const content = (
    <div className="rounded-2xl bg-black/20 p-4 flex items-start gap-4 hover:bg-[var(--white-color)]/10 transition-colors">
      <div className="p-2.5 bg-[var(--black-color)]/30 rounded-xl text-[var(--ins-text-gray)]">
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ins-text-gray)]">{label}</p>
        <p className="text-sm font-bold text-[var(--ins-text-white)] mt-1 truncate" title={typeof value === 'string' ? value : undefined}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
  if (link && link !== "#") {
    return (
      <a href={link} target={target || "_blank"} rel="noopener noreferrer" className="block w-full">{content}</a>
    );
  }
  return content;
}

function getLinkFromValue(value) {
  if (!value) return null;
  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return null;
  }
  if (value.props && value.props.href) return value.props.href;
  return null;
}