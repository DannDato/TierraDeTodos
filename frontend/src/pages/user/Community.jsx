import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import Input from "../../elements/Input";
import Button from "../../elements/Button";
import FilePickerButton from "../../elements/FilePickerButton";
import AlertModal from "../../elements/AlertModal";
import LoadingOverlay from "../../components/LoadingOverlay";
import CommunityManager from "../../components/community/CommunityManager";
import CommunityCard from "../../components/community/CommunityCard";

import { Video } from "lucide-react";


function Community() {
    const [showForm, setShowForm] = useState(false);
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
            })
            .catch(err => {
                setErrorCommunities("No se pudieron cargar las comunidades");
            })
            .finally(() => setLoadingCommunities(false));
    }, []);
    return (
        <section className="min-h-screen py-10 flex flex-col items-center bg-[var(--ins-background)] pb-24 text-[var(--white-color)]">
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
                                    <CommunityCard key={community.id} community={community} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Modal de gestión de comunidad fuera del mapeo para evitar múltiples instancias */}
            <CommunityManager isOpen={showForm} onClose={() => setShowForm(false)} />
        </section>
    );
}

export default Community;
