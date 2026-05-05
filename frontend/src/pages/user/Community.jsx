import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import Button from "../../elements/Button";
import AlertModal from "../../elements/AlertModal";
import CommunityManager from "../../components/community/CommunityManager";
import CommunityCard from "../../components/community/CommunityCard";
import InfoRow from "../../elements/InfoRow";
import CommunityDefault from "../../img/community_default.png";
import { Link } from "react-router-dom";

import { Video, User, Users, File } from "lucide-react";

function Community() {
    const BATCH_SIZE = 6;
    const PREFETCH_ROWS = 2;
    const ESTIMATED_CARD_HEIGHT = 320;
    const PREFETCH_BAND_PX = PREFETCH_ROWS * ESTIMATED_CARD_HEIGHT;

    const [showForm, setShowForm] = useState(false);
    const [manageComunity, setManageComunity] = useState(false);
    const [hasCommunity, setHasCommunity] = useState(false);
    const [communityRequest, setCommunityRequest] = useState(null);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showJoinConfirm, setShowJoinConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showCancelRequestConfirm, setShowCancelRequestConfirm] = useState(false);
    const [joinFeedback, setJoinFeedback] = useState({
        isOpen: false,
        type: "info",
        title: "Aviso",
        message: "",
        reload: false,
    });

    const handleOpen = (community) => {
        setSelected(community);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setSelected(null);
    };

    const handleJoinRequest = () => {
        setShowJoinConfirm(true);
    };

    const handleLeaveRequest = () => {
        setShowLeaveConfirm(true);
    }

    const handleCancelRequest = () => {
        setShowCancelRequestConfirm(true);
    };

    const handleJoinConfirm = async () => {
        if (!selected?.id) return;

        setShowJoinConfirm(false);
        try {
            await api.post(`/user/community/${selected.id}/join`);
            setJoinFeedback({
                isOpen: true,
                type: "success",
                title: "Solicitud enviada",
                message: "El líder de la comunidad revisará tu solicitud y decidirá si te acepta o no.",
                reload: true,
            });
        } catch (_err) {
            setJoinFeedback({
                isOpen: true,
                type: "error",
                title: "Error al solicitar unirse",
                message: "No se pudo enviar la solicitud de ingreso a la comunidad.",
                reload: false,
            });
        }
    };
    const handleLeaveConfirm = async () => {
        if (!selected?.id) return;
        setShowLeaveConfirm(false);
        try {
            await api.post(`/user/community/${selected.id}/leave`);
            handleClose();
            await loadCommunityData();
            setJoinFeedback({
                isOpen: true,
                type: "success",
                title: "Has abandonado la comunidad",
                message: "Has abandonado la comunidad exitosamente.",
                reload: true,
            });
        } catch (_err) {
            setJoinFeedback({
                isOpen: true,
                type: "error",
                title: "Error al abandonar la comunidad",
                message: "No se pudo abandonar la comunidad.",
                reload: false,
            });
        }

    }

    const handleCancelRequestConfirm = async () => {
        const requestId = communityRequest?.id;
        if (!requestId) return;

        setShowCancelRequestConfirm(false);
        try {
            await api.delete(`/user/community/requests/${requestId}`);
            await loadCommunityData();
            setJoinFeedback({
                isOpen: true,
                type: "success",
                title: "Solicitud cancelada",
                message: "Tu solicitud de ingreso fue cancelada correctamente.",
                reload: false,
            });
        } catch (_err) {
            setJoinFeedback({
                isOpen: true,
                type: "error",
                title: "Error al cancelar",
                message: "No se pudo cancelar tu solicitud de ingreso.",
                reload: false,
            });
        }
    };

    const currentUser = { username:localStorage.getItem("username"), role: localStorage.getItem("role") };
    const [communities, setCommunities] = useState([]);
    const [myCommunity, setMyCommunity] = useState(null);
    const [loadingCommunities, setLoadingCommunities] = useState(false);
    const [errorCommunities, setErrorCommunities] = useState("");
    const [manageRequestsCount, setManageRequestsCount] = useState(0);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
    const sentinelRef = useRef(null);

    const loadCommunityData = async () => {
        setLoadingCommunities(true);
        setErrorCommunities("");

        const [myCommunityResult, communitiesResult, requestsResult] = await Promise.allSettled([
            api.get("/user/community"),
            api.get("/user/communities"),
            api.get("/user/community/requests")
        ]);

        if (myCommunityResult.status === "fulfilled" && myCommunityResult.value?.data?.community) {
            setMyCommunity(myCommunityResult.value.data.community);
            setHasCommunity(true);
        } else {
            setMyCommunity(null);
            setHasCommunity(false);
        }

        if (requestsResult.status === "fulfilled" && requestsResult.value?.data?.hasPendingRequest) {
            setCommunityRequest(requestsResult.value?.data?.request || null);
        } else {
            setCommunityRequest(null);
        }

        if (communitiesResult.status === "fulfilled") {
            const payload = communitiesResult.value?.data || {};
            setCommunities(Array.isArray(payload.communities) ? payload.communities : []);
            const isManager = Boolean(payload.isManager);
            setManageComunity(isManager);

            if (isManager) {
                try {
                    const manageRequestsRes = await api.get("/user/community/manage/requests");
                    const pendingRequests = Array.isArray(manageRequestsRes?.data?.requests) ? manageRequestsRes.data.requests : [];
                    setManageRequestsCount(pendingRequests.length);
                } catch (_err) {
                    setManageRequestsCount(0);
                }
            } else {
                setManageRequestsCount(0);
            }
        } else {
            setCommunities([]);
            setManageComunity(false);
            setManageRequestsCount(0);
            setErrorCommunities("No se pudieron cargar las comunidades");
        }
        setLoadingCommunities(false);
    };

    useEffect(() => {
        loadCommunityData();
    }, []);

    const closeJoinFeedback = () => {
        const shouldReload = Boolean(joinFeedback.reload);
        setJoinFeedback({
            isOpen: false,
            type: "info",
            title: "Aviso",
            message: "",
            reload: false,
        });

        if (shouldReload) {
            window.location.reload();
        }
    };

    const requestedCommunityId = communityRequest?.communityId || null;
    const hasPendingRequest = !hasCommunity && Boolean(communityRequest) && String(communityRequest?.status || "PENDING").toUpperCase() === "PENDING";
    const requestedCommunity = communities.find((community) => String(community?.id) === String(requestedCommunityId)) || null;
    const visibleCommunities = useMemo(
        () => communities.filter((community) => String(community?.id) !== String(myCommunity?.id)),
        [communities, myCommunity]
    );

    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [visibleCommunities.length]);

    useEffect(() => {
        if (loadingCommunities || hasPendingRequest) return;
        if (!sentinelRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry?.isIntersecting) return;

                setVisibleCount((prev) => {
                    if (prev >= visibleCommunities.length) return prev;
                    return Math.min(prev + BATCH_SIZE, visibleCommunities.length);
                });
            },
            { root: null, rootMargin: `0px 0px ${PREFETCH_BAND_PX}px 0px`, threshold: 0.01 }
        );

        observer.observe(sentinelRef.current);

        return () => {
            observer.disconnect();
        };
    }, [loadingCommunities, hasPendingRequest, visibleCommunities.length, PREFETCH_BAND_PX]);

    const progressiveCommunities = useMemo(
        () => visibleCommunities.slice(0, visibleCount),
        [visibleCommunities, visibleCount]
    );

    return (
        <div>
        <div className="min-h-screen py-15 flex flex-col items-center  pb-24 text-[var(--white-color)] z-[1] min-h-screen h-screen">

            <div className="w-full  px-0 mx-0 text-[var(--ins-text-white)]">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2">
                        <span>{currentUser.role}</span>
                        <span>/</span>
                        <span className="text-[var(--secondary-color)]">Comunidades</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                        Comunidades
                        </h1>

                        <p className="hidden lg:block text-sm text-[var(--ins-text-white)] mt-2 max-w-lg">
                        Las comunidades que participan en Tierra de Todos
                        </p>
                    </div>
                    <Button
                        hidden={!manageComunity}
                        variant="primary"
                        onClick={() => setShowForm(true)}
                        type="button"
                    >
                        <span className="inline-flex items-center gap-2">
                            Gestiona tu comunidad
                            {manageRequestsCount > 0 && (
                                <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                    {manageRequestsCount}
                                </span>
                            )}
                        </span>
                    </Button>
                </div>
            {/* FORMULARIO DE COMUNIDAD VISIBLE PARA USUARIOS CON community.manage */}

            </div>
            <div className="flex flex-col lg:flex-row gap-8 items-start w-full  px-0 mx-0 mb-4">
                <div className="w-full ">
                    <div className="bg-black/10 rounded-3xl p-6 backdrop-blur-sm border border-white/10 p-10">
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 items-center mb-6 alig">
                            <div className="items-center flex gap-2 ">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Video size={24} style={{ color: "var(--secondary-color)" }}/>
                                    Tu comunidad
                                </h2>
                            </div>
                            <div>
                                {myCommunity ? (
                                    <div key={myCommunity.id} className="cursor-pointer hover:scale-[1.03] transition-transform" onClick={() => handleOpen(myCommunity)}>
                                        <CommunityCard community={myCommunity} />
                                    </div>
                                ) : hasPendingRequest ? (
                                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <p className="text-left sm:text-center">
                                                Esperando aprobación para entrar a <span className="font-bold">{requestedCommunity?.name || "la comunidad seleccionada"}</span>.
                                            </p>
                                            <Button
                                                variant="cancel"
                                                size="sm"
                                                onClick={handleCancelRequest}
                                                type="button"
                                                className="sm:ml-auto"
                                            >
                                                Cancelar solicitud
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm text-[var(--ins-text-white)]">
                                        No tienes comunidad registrada.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-8 items-start w-full  px-0 mx-0">
                <div className="w-full ">
                    <div className="bg-black/10 rounded-3xl p-6 backdrop-blur-sm border border-white/10 p-10">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Video size={24} style={{ color: "var(--secondary-color)" }}/>
                            Todas las comunidades
                        </h2>
                        {loadingCommunities ? (
                            <div className="text-[var(--ins-text-white)]">Cargando comunidades...</div>
                        ) : errorCommunities ? (
                            <div className="text-red-500">{errorCommunities}</div>
                        ) : visibleCommunities.length === 0 ? (
                            <div className="text-[var(--ins-text-white)]">No hay comunidades registradas.</div>
                        ) : (
                            <div className="relative">
                                {hasPendingRequest && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl backdrop-blur-[10px] border border-white/10">
                                        <div className="rounded-2xl bg-[var(--ins-background)]/90 px-5 py-4 text-center shadow-xl border border-amber-400/20">
                                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Solicitud pendiente</p>
                                            <p className="mt-2 text-sm text-[var(--ins-text-white)]">
                                                Esperando aprobación para entrar a {requestedCommunity?.name || "la comunidad seleccionada"}.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 hover:bounce transition-all ${hasPendingRequest ? "blur-sm pointer-events-none select-none" : ""}`}>
                                    {progressiveCommunities.map((community) => (
                                        <div key={community.id} className="cursor-pointer hover:scale-[1.03] transition-transform" onClick={() => handleOpen(community)}>
                                            <CommunityCard community={community} />
                                        </div>
                                    ))}
                                </div>
                                {!hasPendingRequest && (
                                    <>
                                        <div ref={sentinelRef} className="w-full h-8" />
                                        {visibleCount < visibleCommunities.length && (
                                            <div className="text-center text-xs text-[var(--ins-text-gray)] pb-2">
                                                Mostrando {progressiveCommunities.length} de {visibleCommunities.length} comunidades...
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <AlertModal
                isOpen={showJoinConfirm}
                type="warning"
                title="Un momento..."
                message="¿Estás seguro de que quieres solicitar unirte a esta comunidad? El líder de la comunidad revisará tu solicitud y decidirá si te acepta o no."
                confirmText="Sí, solicitar unirme"
                cancelText="No, cancelar"
                onClose={() => setShowJoinConfirm(false)}
                onConfirm={handleJoinConfirm}
                className="z-[260]"
            />
            <AlertModal
                isOpen={showLeaveConfirm}
                type="warning"
                title="Un momento..."
                message="¿Estás seguro de que quieres abandonar esta comunidad? El líder de la comunidad revisará tu solicitud y decidirá si te acepta o no."
                confirmText="Sí, abandonar comunidad"
                cancelText="No, cancelar"
                onClose={() => setShowLeaveConfirm(false)}
                onConfirm={handleLeaveConfirm}
                className="z-[260]"
            />
            <AlertModal
                isOpen={showCancelRequestConfirm}
                type="warning"
                title="Cancelar solicitud"
                message="¿Estás seguro de que quieres cancelar tu solicitud de ingreso a la comunidad?"
                confirmText="Sí, cancelar solicitud"
                cancelText="No, volver"
                onClose={() => setShowCancelRequestConfirm(false)}
                onConfirm={handleCancelRequestConfirm}
                className="z-[260]"
            />

            <AlertModal
                isOpen={joinFeedback.isOpen}
                type={joinFeedback.type}
                title={joinFeedback.title}
                message={joinFeedback.message}
                confirmText="Cerrar"
                cancelText="Cerrar"
                onClose={closeJoinFeedback}
                onConfirm={closeJoinFeedback}
                className="z-[260]"
            />
            {/* Modal de gestión de comunidad fuera del mapeo para evitar múltiples instancias */}
            <CommunityManager isOpen={showForm} onClose={() => setShowForm(false)} />
            {/* Modal de detalle de comunidad */}
            <CommunityDetailModal
                isOpen={showModal}
                community={selected}
                onClose={handleClose}
                onJoin={handleJoinRequest}
                onLeave={handleLeaveRequest}
                hasCommunity={hasCommunity}
                myCommunity={myCommunity}
                manageComunity={manageComunity}
            />
            {/* AlertModal debe ir al final para estar sobre cualquier modal */}
        </div>
        </div>
    );
}

export default Community;

// Modal de detalle de comunidad
function CommunityDetailModal({ community, isOpen, onClose, onJoin, onLeave, hasCommunity, myCommunity, manageComunity }) {


    if (!isOpen || !community) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center transition-opacity duration-200 ">

            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-5xl rounded-3xl  p-8 shadow-2xl animate-fadeInUp bg-[var(--ins-background)]/50 backdrop-blur-sm border border-white/10 mt-[-65px]" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                <button onClick={onClose} className="absolute top-4 right-4 text-[var(--ins-text-white)] hover:text-[var(--secondary-color)] text-2xl font-bold">×</button>
                <div className="grid grid-cols-1 lg:grid-cols-3">
                    <div className="">
                        <CommunityCard community={community} className="w-full" />
                        {hasCommunity && myCommunity?.id === community?.id ? (
                            // Es su comunidad
                            !manageComunity ? (
                                <Button className="mt-6 w-full" variant="cancel" onClick={onLeave}>
                                    Abandonar comunidad
                                </Button>
                            ) : null
                        ) : hasCommunity ? (
                            // Tiene comunidad pero es otra
                            <div className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 w-fit">
                                <div className="w-2 h-2 rounded-full bg-[var(--ins-text-gray)]" />
                                <span className="text-sm text-[var(--ins-text-gray)]">Ya perteneces a otra comunidad</span>
                            </div>
                        ) : (
                            // No tiene comunidad
                            <Button className="mt-6 w-full" variant="primary" onClick={onJoin}>
                                Solicitar unirse
                            </Button>
                        )}
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
                    <div className="rounded-3xl bg-[var(--black-color)]/20 overflow-hidden mt-4 border border-white/10">
                        <div className="px-5 py-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-white)]">Miembros</p>
                        </div>
                        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-white)]">
                             {community.members ? community.members.length : 0} registros
                        </span>
                        </div>

                        {community.members && community.members.length === 0 ? (
                        <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-white)]">
                            No hay movimientos de estatus registrados para este usuario.
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
                                {community.members && community.members.map((entry, index) => (
                                <tr key={entry.id} className="border-t border-[var(--white-color)]/5 align-top">
                                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                                    {index + 1}
                                    </td>
                                    <td>
                                        <img
                                        key={entry.id}
                                        src={entry.profileImage || community.logo_url || CommunityDefault}
                                        alt={entry.username || "Usuario"}
                                        className="w-8 h-8 rounded-full border object-cover mt-1"
                                        loading="lazy"
                                        decoding="async"
                                        style={{ borderColor: community.color || '#222222' }}
                                        />
                                    </td>
                                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                                        <Link
                                           to={`/players?search=${encodeURIComponent(String(entry.username || ""))}`}
                                            className="text-sm font-semibold hover:text-[var(--hover-secondary)] transition-colors"
                                            title={`Ver jugador ${entry.username || "Usuario"}`}
                                            >
                                            {entry.username || "Usuario"}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                                    {entry.isLeader ? (
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


function getLinkFromValue(value) {
  if (!value) return null;
  if (typeof value === "string") {
    if (value.startsWith("http://") || value.startsWith("https://")) return value;
    return null;
  }
  if (value.props && value.props.href) return value.props.href;
  return null;
}