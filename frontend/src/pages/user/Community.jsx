import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import Button from "../../elements/Button";
import AlertModal from "../../elements/AlertModal";
import CommunityManager from "../../components/user/community/CommunityManager";
import CommunityCard from "../../components/user/community/CommunityCard";
import InfoRow from "../../elements/InfoRow";
import Table from "../../elements/Table";
import CommunityDefault from "../../img/community_default.png";
import Mapa from "../../img/mapa.png";
import { Link } from "react-router-dom";
import LoadingOverlay from "../../components/shared/LoadingOverlay";

import { Shield, Crown, User, Users, Video, File, X, RefreshCw, Search, Move } from "lucide-react";


function normalizeSearch(value = "") {
    return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}


function getCommunitySearchScore(community, search) {
    const query = normalizeSearch(search);
    if (!query) return 0;

    const name = normalizeSearch(community?.name);
    const description = normalizeSearch(community?.description);
    const leader = normalizeSearch(community?.leader?.username);

    if (name === query) return 1000;
    if (name.startsWith(query)) return 800 - Math.abs(name.length - query.length);
    if (name.includes(query)) return 600 - name.indexOf(query);
    if (leader === query) return 500;
    if (leader.startsWith(query)) return 400;
    if (leader.includes(query)) return 300;
    if (description.includes(query)) return 100;

    return 0;
}


/**
 * Posiciones deterministas.
 * Siempre son las mismas para conservar la geografía del mundo.
 */
function generateMapPositions() {
    const positions = [{ left: 50, top: 53, rotation: 0 }];
    let seed = 873421;

    const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    const generated = [];
    const columns = 10;
    const rows = 10;

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            const left = 7 + column * (86 / (columns - 1));
            const top = 14 + row * (78 / (rows - 1));
            const jitterX = (random() - 0.5) * 5;
            const jitterY = (random() - 0.5) * 5;
            const rotation = (random() - 0.5) * 8;

            const finalLeft = Math.max(6, Math.min(94, left + jitterX));
            const finalTop = Math.max(13, Math.min(92, top + jitterY));
            const distanceFromCenter = Math.sqrt(Math.pow(finalLeft - 50, 2) + Math.pow(finalTop - 53, 2));

            if (distanceFromCenter < 11) continue;

            generated.push({ left: finalLeft, top: finalTop, rotation });
        }
    }

    for (let i = generated.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [generated[i], generated[j]] = [generated[j], generated[i]];
    }

    positions.push(...generated.slice(0, 99));

    return positions;
}


const MAP_POSITIONS = generateMapPositions();


function Community() {
    const BATCH_SIZE = 6;
    const PREFETCH_ROWS = 2;
    const ESTIMATED_CARD_HEIGHT = 560;
    const PREFETCH_BAND_PX = PREFETCH_ROWS * ESTIMATED_CARD_HEIGHT;

    const WORLD_WIDTH = 1.45;
    const WORLD_HEIGHT = 1.35;
    const SAFE_ZONE_HEIGHT = 175;

    const [showForm, setShowForm] = useState(false);
    const [manageComunity, setManageComunity] = useState(false);
    const [hasCommunity, setHasCommunity] = useState(false);
    const [communityRequest, setCommunityRequest] = useState(null);
    const [selected, setSelected] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showJoinConfirm, setShowJoinConfirm] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showCancelRequestConfirm, setShowCancelRequestConfirm] = useState(false);
    const [hoveredMapCommunityId, setHoveredMapCommunityId] = useState(null);
    const [search, setSearch] = useState("");

    const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
    const [isDraggingMap, setIsDraggingMap] = useState(false);

    const dragRef = useRef({
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
    });

    const mapViewportRef = useRef(null);
    const sentinelRef = useRef(null);

    const [joinFeedback, setJoinFeedback] = useState({
        isOpen: false,
        type: "info",
        title: "Aviso",
        message: "",
        reload: false,
    });

    const currentUser = {
        username: localStorage.getItem("username"),
        role: localStorage.getItem("role"),
    };

    const [communities, setCommunities] = useState([]);
    const [myCommunity, setMyCommunity] = useState(null);
    const [loadingCommunities, setLoadingCommunities] = useState(false);
    const [errorCommunities, setErrorCommunities] = useState("");
    const [manageRequestsCount, setManageRequestsCount] = useState(0);
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);


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
    };


    const handleCancelRequest = () => {
        setShowCancelRequestConfirm(true);
    };


    const loadCommunityData = async () => {
        setLoadingCommunities(true);
        setErrorCommunities("");

        const [myCommunityResult, communitiesResult, requestsResult] = await Promise.allSettled([
            api.get("/user/community"),
            api.get("/user/communities"),
            api.get("/user/community/requests"),
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


    const handleJoinConfirm = async () => {
        if (!selected?.id) return;

        setShowJoinConfirm(false);

        try {
            await api.post(`/user/community/${selected.id}/join`);
            handleClose();
            await loadCommunityData();

            setJoinFeedback({
                isOpen: true,
                type: "success",
                title: "Solicitud enviada",
                message: "El líder de la comunidad revisará tu solicitud y decidirá si te acepta o no.",
                reload: false,
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
                reload: false,
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
    };


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


    useEffect(() => {
        loadCommunityData();
    }, []);


    const closeJoinFeedback = async () => {
        const shouldReload = Boolean(joinFeedback.reload);

        setJoinFeedback({
            isOpen: false,
            type: "info",
            title: "Aviso",
            message: "",
            reload: false,
        });

        if (shouldReload) await loadCommunityData();
    };


    const orderedCommunities = useMemo(() => {
        return [...communities].sort((a, b) => {
            const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : NaN;
            const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : NaN;

            if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) return dateA - dateB;

            const idA = Number(a?.id);
            const idB = Number(b?.id);

            if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB;

            return String(a?.id || "").localeCompare(String(b?.id || ""));
        });
    }, [communities]);


    const requestedCommunityId = communityRequest?.communityId || null;

    const hasPendingRequest =
        !hasCommunity &&
        Boolean(communityRequest) &&
        String(communityRequest?.status || "PENDING").toUpperCase() === "PENDING";


    const requestedCommunity =
        orderedCommunities.find((community) => String(community?.id) === String(requestedCommunityId)) || null;


    const visibleCommunities = useMemo(
        () => orderedCommunities.filter((community) => String(community?.id) !== String(myCommunity?.id)),
        [orderedCommunities, myCommunity]
    );


    const mapCommunities = useMemo(() => {
        const result = [];

        if (myCommunity) result.push({ community: myCommunity, isMyCommunity: true });

        visibleCommunities.forEach((community) => {
            result.push({ community, isMyCommunity: false });
        });

        return result.slice(0, MAP_POSITIONS.length);
    }, [myCommunity, visibleCommunities]);


    const bestDesktopMatchId = useMemo(() => {
        if (!normalizeSearch(search)) return null;

        let bestCommunity = null;
        let bestScore = 0;

        mapCommunities.forEach(({ community }) => {
            const score = getCommunitySearchScore(community, search);

            if (score > bestScore) {
                bestScore = score;
                bestCommunity = community;
            }
        });

        return bestCommunity?.id || null;
    }, [mapCommunities, search]);


    const bestDesktopMatchIndex = useMemo(() => {
        if (!bestDesktopMatchId) return -1;

        return mapCommunities.findIndex(({ community }) => String(community.id) === String(bestDesktopMatchId));
    }, [mapCommunities, bestDesktopMatchId]);


    const mobileFilteredCommunities = useMemo(() => {
        const query = normalizeSearch(search);

        if (!query) return visibleCommunities;

        return visibleCommunities.filter((community) => getCommunitySearchScore(community, query) > 0);
    }, [visibleCommunities, search]);


    const myCommunityMatchesSearch = useMemo(() => {
        if (!myCommunity) return false;
        if (!normalizeSearch(search)) return true;

        return getCommunitySearchScore(myCommunity, search) > 0;
    }, [myCommunity, search]);


    const clampMapOffset = (x, y) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const worldWidth = viewportWidth * WORLD_WIDTH;
        const worldHeight = viewportHeight * WORLD_HEIGHT;

        const maxX = Math.max(0, (worldWidth - viewportWidth) / 2);
        const maxY = Math.max(0, (worldHeight - viewportHeight) / 2);

        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
        };
    };


    const handleMapPointerDown = (event) => {
        if (event.button !== 0) return;
        if (event.target.closest("[data-community-flag='true']")) return;
        if (event.target.closest("[data-map-ui='true']")) return;

        event.currentTarget.setPointerCapture?.(event.pointerId);

        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            originX: mapOffset.x,
            originY: mapOffset.y,
        };

        setIsDraggingMap(true);
    };


    const handleMapPointerMove = (event) => {
        if (!isDraggingMap) return;

        const deltaX = event.clientX - dragRef.current.startX;
        const deltaY = event.clientY - dragRef.current.startY;

        const next = clampMapOffset(
            dragRef.current.originX + deltaX,
            dragRef.current.originY + deltaY
        );

        setMapOffset(next);
    };


    const handleMapPointerUp = (event) => {
        if (!isDraggingMap) return;

        event.currentTarget.releasePointerCapture?.(event.pointerId);
        setIsDraggingMap(false);
    };


    const resetMapPosition = () => {
        setMapOffset({ x: 0, y: 0 });
    };


    /**
     * Si hay coincidencia en desktop movemos el mundo para llevar la casa
     * hacia el centro de la zona visible, debajo del header seguro.
     */
    useEffect(() => {
        if (bestDesktopMatchIndex < 0) return;
        if (window.innerWidth < 1024) return;

        const position = MAP_POSITIONS[bestDesktopMatchIndex];
        if (!position) return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const worldWidth = viewportWidth * WORLD_WIDTH;
        const worldHeight = viewportHeight * WORLD_HEIGHT;

        const communityX = worldWidth * (position.left / 100);
        const communityY = worldHeight * (position.top / 100);

        const targetX = viewportWidth / 2;
        const targetY = SAFE_ZONE_HEIGHT + ((viewportHeight - SAFE_ZONE_HEIGHT) / 2);

        const centeredWorldX = (viewportWidth - worldWidth) / 2;
        const centeredWorldY = (viewportHeight - worldHeight) / 2;

        const desiredX = targetX - centeredWorldX - communityX;
        const desiredY = targetY - centeredWorldY - communityY;

        setMapOffset(clampMapOffset(desiredX, desiredY));
    }, [bestDesktopMatchIndex]);


    useEffect(() => {
        const handleResize = () => {
            setMapOffset((current) => clampMapOffset(current.x, current.y));
        };

        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);


    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [mobileFilteredCommunities.length, search]);


    useEffect(() => {
        if (loadingCommunities || hasPendingRequest || !sentinelRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;

                if (!entry?.isIntersecting) return;

                setVisibleCount((prev) => {
                    if (prev >= mobileFilteredCommunities.length) return prev;
                    return Math.min(prev + BATCH_SIZE, mobileFilteredCommunities.length);
                });
            },
            { root: null, rootMargin: `0px 0px ${PREFETCH_BAND_PX}px 0px`, threshold: 0.01 }
        );

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    }, [loadingCommunities, hasPendingRequest, mobileFilteredCommunities.length, PREFETCH_BAND_PX]);


    const progressiveCommunities = useMemo(
        () => mobileFilteredCommunities.slice(0, visibleCount),
        [mobileFilteredCommunities, visibleCount]
    );


    return (
        <div className="relative min-h-screen text-[var(--white-color)]">

            <LoadingOverlay isVisible={loadingCommunities} message="Cargando comunidades..." />


            {/* ====================================================== */}
            {/* FONDO FULLSCREEN                                      */}
            {/* ====================================================== */}

            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">

                <div
                    className="absolute -inset-8 bg-cover bg-center scale-110 blur-[15px]"
                    style={{ backgroundImage: `url(${Mapa})` }}
                />

                <div className="absolute inset-0 bg-black/18" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/35" />
                <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,.42)]" />

            </div>


            {/* ====================================================== */}
            {/* DESKTOP - MUNDO ARRASTRABLE                           */}
            {/* ====================================================== */}

            <div
                ref={mapViewportRef}
                className={`hidden lg:block fixed inset-0 z-10 overflow-hidden touch-none select-none ${isDraggingMap ? "cursor-grabbing" : "cursor-grab"}`}
                onPointerDown={handleMapPointerDown}
                onPointerMove={handleMapPointerMove}
                onPointerUp={handleMapPointerUp}
                onPointerCancel={handleMapPointerUp}
            >

                {/* Mundo */}
                <div
                    className="absolute left-1/2 top-1/2 will-change-transform"
                    style={{
                        width: `${WORLD_WIDTH * 100}vw`,
                        height: `${WORLD_HEIGHT * 100}vh`,
                        transform: `translate(calc(-50% + ${mapOffset.x}px), calc(-50% + ${mapOffset.y}px))`,
                        transition: isDraggingMap ? "none" : "transform 500ms cubic-bezier(.2,.8,.2,1)",
                    }}
                >

                    {/* Mapa real del mundo */}
                    <div className="absolute inset-0 overflow-hidden">

                        <div
                            className="absolute -inset-5 bg-cover bg-center scale-[1.03] blur-[5.5px]"
                            style={{ backgroundImage: `url(${Mapa})` }}
                        />

                        <div className="absolute inset-0 bg-black/7" />

                    </div>


                    {/* Capa de banderas con zona segura superior */}
                    <div
                        className={`${hasPendingRequest ? "blur-sm pointer-events-none select-none" : ""}`}
                        style={{
                            position: "absolute",
                            inset: 0,
                            clipPath: `inset(${SAFE_ZONE_HEIGHT}px 0 0 0)`,
                        }}
                    >

                        {mapCommunities.map(({ community, isMyCommunity }, index) => {

                            const position = MAP_POSITIONS[index];
                            const isHovered = String(hoveredMapCommunityId) === String(community.id);
                            const isSearchMatch = String(bestDesktopMatchId) === String(community.id);
                            const isMagnified = isHovered || isSearchMatch;

                            const normalScale = isMyCommunity ? 0.41 : 0.33;
                            const magnifiedScale = 1.008;

                            return (
                                <div
                                    key={community.id}
                                    className="absolute w-[130px] h-[170px]"
                                    style={{
                                        left: `${position.left}%`,
                                        top: `${position.top}%`,
                                        transform: "translate(-50%, -50%)",
                                        zIndex: isMagnified ? 100 : isMyCommunity ? 30 : 10,
                                    }}
                                >

                                    {isMyCommunity && (
                                        <div
                                            className="absolute left-1/2 -top-7 z-[110] inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/72 backdrop-blur-md border border-amber-300/35 shadow-xl whitespace-nowrap transition-all duration-200"
                                            style={{
                                                opacity: isMagnified ? 0 : 1,
                                                transform: `translateX(-50%) scale(${isMagnified ? 0.8 : 1})`,
                                            }}
                                        >
                                            <Crown size={11} className="text-amber-300" />

                                            <span className="text-[8px] uppercase tracking-[0.2em] font-black text-amber-100">
                                                Tu casa
                                            </span>
                                        </div>
                                    )}


                                    {isSearchMatch && (
                                        <>
                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[210px] h-[250px] rounded-full bg-amber-300/12 blur-2xl animate-pulse pointer-events-none" />
                                            <div className="absolute left-1/2 top-[-52px] -translate-x-1/2 px-3 py-1 rounded-full bg-amber-300 text-black text-[9px] uppercase tracking-[0.16em] font-black shadow-xl whitespace-nowrap z-[120]">
                                                Coincidencia
                                            </div>
                                        </>
                                    )}


                                    <div
                                        data-community-flag="true"
                                        className="absolute left-1/2 top-1/2 w-[360px] cursor-pointer transition-transform duration-300 ease-out"
                                        style={{
                                            transform: `translate(-50%, -50%) rotate(${isMagnified ? 0 : position.rotation}deg) scale(${isMagnified ? magnifiedScale : normalScale})`,
                                            transformOrigin: "center center",
                                            filter: isMagnified
                                                ? "drop-shadow(0 22px 26px rgba(0,0,0,.82)) drop-shadow(0 6px 8px rgba(0,0,0,.72))"
                                                : "drop-shadow(0 12px 13px rgba(0,0,0,.76)) drop-shadow(0 4px 5px rgba(0,0,0,.68))",
                                        }}
                                        onMouseEnter={() => setHoveredMapCommunityId(community.id)}
                                        onMouseLeave={() => setHoveredMapCommunityId(null)}
                                        onClick={() => handleOpen(community)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                handleOpen(community);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        title={`Abrir ${community.name || "comunidad"}`}
                                    >
                                        <CommunityCard community={community} />
                                    </div>

                                </div>
                            );

                        })}

                    </div>

                </div>


                {/* Indicador sutil de arrastre */}
                <div data-map-ui="true" className="absolute left-1/2 bottom-5 -translate-x-1/2 z-[170] flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-xl pointer-events-none">
                    <Move size={12} className="text-white/45" />
                    <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-white/45">
                        Arrastra para explorar
                    </span>
                </div>


                {/* Reset */}
                {(Math.abs(mapOffset.x) > 10 || Math.abs(mapOffset.y) > 10) && (
                    <button data-map-ui="true" type="button" onClick={resetMapPosition} className="absolute right-5 bottom-5 z-[180] px-3 py-2 rounded-xl bg-black/55 backdrop-blur-xl border border-white/10 text-[10px] uppercase tracking-[0.14em] font-bold text-white/55 hover:text-white hover:bg-black/70 transition-colors shadow-xl cursor-pointer">
                        Centrar mapa
                    </button>
                )}

            </div>


            {/* ====================================================== */}
            {/* HEADER SEGURO DESKTOP                                  */}
            {/* ====================================================== */}

            <div data-map-ui="true" className="hidden lg:block fixed left-0 right-0 top-0 z-[150] pointer-events-none">

                {/* Degradado protector.
                    El mapa sigue visible detrás, pero las banderas están recortadas debajo. */}
                <div className="absolute inset-x-0 top-0 h-[175px] bg-gradient-to-b from-black/48 via-black/24 to-transparent backdrop-blur-[1px] pointer-events-none" />

                <div className="relative px-3 pt-12 sm:px-6 lg:px-8 pointer-events-auto">

                    <div className="flex items-center justify-between gap-6 md:my-15 md:mx-35">

                        <div className="">

                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 drop-shadow-[0_3px_5px_rgba(0,0,0,.9)]">
                                <span>{currentUser.role}</span>
                                <span>/</span>
                                <span className="text-[var(--secondary-color)]">Comunidades</span>
                            </div>

                            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight drop-shadow-[0_4px_9px_rgba(0,0,0,.95)]">
                                Comunidades
                            </h1>

                            <p className="text-sm text-white/75 mt-2 max-w-lg drop-shadow-[0_3px_6px_rgba(0,0,0,.9)]">
                                Las casas que forman parte de Tierra de Todos
                            </p>

                        </div>


                        <div className="flex items-center gap-3">

                            <div className="relative w-[320px] xl:w-[380px]">

                                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none" />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar una casa..."
                                    className="w-full h-[44px] pl-11 pr-10 rounded-2xl bg-black/58 backdrop-blur-xl border border-white/15 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-amber-300/45 focus:bg-black/70 focus:shadow-[0_0_25px_rgba(0,0,0,.4)]"
                                />

                                {search && (
                                    <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors" aria-label="Limpiar búsqueda">
                                        <X size={15} />
                                    </button>
                                )}

                            </div>


                            <Button hidden={!manageComunity} variant="primary" onClick={() => setShowForm(true)} type="button">

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

                    </div>

                </div>

            </div>


            {/* ====================================================== */}
            {/* MENSAJES FLOTANTES DESKTOP                            */}
            {/* ====================================================== */}

            <div data-map-ui="true" className="hidden lg:block fixed inset-0 z-[160] pointer-events-none">


                {hasPendingRequest && (
                    <div className="absolute top-[185px] left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-auto">

                        <div className="rounded-2xl border border-amber-400/20 bg-black/72 backdrop-blur-xl px-5 py-4 shadow-2xl">

                            <div className="flex items-center justify-between gap-4">

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                                        Solicitud pendiente
                                    </p>

                                    <p className="mt-2 text-sm text-white/80">
                                        Esperando aprobación para entrar a <span className="font-bold">{requestedCommunity?.name || "la comunidad seleccionada"}</span>.
                                    </p>
                                </div>

                                <Button variant="cancel" size="sm" onClick={handleCancelRequest} type="button">
                                    Cancelar
                                </Button>

                            </div>

                        </div>

                    </div>
                )}


                {search && !bestDesktopMatchId && (
                    <div className="absolute top-[190px] left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-black/72 backdrop-blur-xl border border-white/10 shadow-xl">
                        <span className="text-xs text-white/70">
                            No encontré ninguna casa que coincida con “{search}”
                        </span>
                    </div>
                )}


                {!myCommunity && (
                    <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">

                        <div className="w-[250px] rounded-3xl border border-dashed border-white/20 bg-black/58 backdrop-blur-xl px-6 py-8 text-center shadow-2xl">

                            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                                <Shield size={26} className="text-white/50" />
                            </div>

                            <h3 className="mt-4 font-bold">
                                Aún no tienes casa
                            </h3>

                            <p className="mt-2 text-xs text-white/55">
                                Explora el territorio y elige una comunidad.
                            </p>

                        </div>

                    </div>
                )}

            </div>


            {/* ====================================================== */}
            {/* MOBILE / TABLET                                       */}
            {/* ====================================================== */}

            <div className="lg:hidden relative z-10 min-h-screen px-3 pt-12 pb-24">


                {/* Header móvil */}
                <div className="mb-6">

                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2 drop-shadow-lg">
                        <span>{currentUser.role}</span>
                        <span>/</span>
                        <span className="text-[var(--secondary-color)]">Comunidades</span>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-[0_3px_8px_rgba(0,0,0,.8)]">
                        Comunidades
                    </h1>

                    <div className="mt-5 relative">

                        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar una casa..."
                            className="w-full h-[44px] pl-11 pr-10 rounded-2xl bg-black/58 backdrop-blur-xl border border-white/15 text-sm text-white placeholder:text-white/40 outline-none focus:border-amber-300/45 focus:bg-black/70 transition-all shadow-xl"
                        />

                        {search && (
                            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors" aria-label="Limpiar búsqueda">
                                <X size={15} />
                            </button>
                        )}

                    </div>


                    {manageComunity && (
                        <div className="mt-3">
                            <Button variant="primary" onClick={() => setShowForm(true)} type="button">

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
                    )}

                </div>


                {!loadingCommunities && errorCommunities ? (

                    <div className="flex flex-col items-center gap-3 py-16 text-center rounded-3xl bg-black/45 backdrop-blur-xl">

                        <p className="text-red-300 font-bold">
                            No se pudieron cargar las comunidades
                        </p>

                        <p className="text-white/60 text-sm">
                            Revisa tu conexión e intenta de nuevo.
                        </p>

                        <button type="button" onClick={loadCommunityData} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 text-sm font-bold text-white/60 hover:text-white hover:bg-white/12 transition-colors">
                            <RefreshCw size={14} />
                            Reintentar
                        </button>

                    </div>

                ) : (

                    <>

                        {hasPendingRequest && (
                            <div className="mb-8 mx-auto max-w-xl rounded-2xl border border-amber-400/20 bg-black/65 backdrop-blur-xl px-5 py-4 shadow-2xl">

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                                            Solicitud pendiente
                                        </p>

                                        <p className="mt-2 text-sm text-white/80">
                                            Esperando aprobación para entrar a <span className="font-bold">{requestedCommunity?.name || "la comunidad seleccionada"}</span>.
                                        </p>
                                    </div>

                                    <Button variant="cancel" size="sm" onClick={handleCancelRequest} type="button">
                                        Cancelar solicitud
                                    </Button>

                                </div>

                            </div>
                        )}


                        {search && !myCommunityMatchesSearch && mobileFilteredCommunities.length === 0 && (
                            <div className="my-16 mx-auto max-w-sm text-center rounded-3xl bg-black/55 backdrop-blur-xl border border-white/10 px-6 py-10 shadow-2xl">

                                <Search size={28} className="mx-auto text-white/35" />

                                <h3 className="mt-4 font-bold">
                                    No encontré esa casa
                                </h3>

                                <p className="mt-2 text-sm text-white/50">
                                    Prueba con otro nombre o con el usuario de su líder.
                                </p>

                            </div>
                        )}


                        <div className={`grid gap-x-3 gap-y-10 sm:gap-x-5 ${hasPendingRequest ? "blur-sm pointer-events-none select-none" : ""}`} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))" }}>


                            {myCommunityMatchesSearch && (
                                <div className="relative min-w-0 flex flex-col items-center">

                                    <div className="h-9 mb-1 flex items-center justify-center">

                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-amber-300/30 shadow-xl">

                                            <Crown size={13} className="text-amber-300" />

                                            <span className="text-[10px] uppercase tracking-[0.22em] font-black text-amber-100">
                                                Tu casa
                                            </span>

                                        </div>

                                    </div>


                                    {myCommunity ? (
                                        <div
                                            className="w-full flex justify-center cursor-pointer drop-shadow-[0_14px_14px_rgba(0,0,0,.72)] transition-transform duration-300 hover:scale-[1.025]"
                                            onClick={() => handleOpen(myCommunity)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    handleOpen(myCommunity);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            title={`Abrir ${myCommunity.name || "comunidad"}`}
                                        >
                                            <CommunityCard community={myCommunity} />
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-[360px] min-h-[500px] flex items-center justify-center px-8">

                                            <div className="w-full rounded-3xl border border-dashed border-white/20 bg-black/50 backdrop-blur-xl px-6 py-10 text-center shadow-2xl">

                                                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                                                    <Shield size={28} className="text-white/50" />
                                                </div>

                                                <h3 className="mt-5 font-bold">
                                                    Aún no tienes casa
                                                </h3>

                                                <p className="mt-2 text-sm leading-relaxed text-white/55">
                                                    Elige uno de los estandartes y solicita unirte.
                                                </p>

                                            </div>

                                        </div>
                                    )}

                                </div>
                            )}


                            {progressiveCommunities.map((community) => (
                                <div key={community.id} className="relative min-w-0 flex flex-col items-center">

                                    <div className="h-9 mb-1" />

                                    <div
                                        className="w-full flex justify-center cursor-pointer drop-shadow-[0_14px_14px_rgba(0,0,0,.72)] transition-transform duration-300 hover:scale-[1.025]"
                                        onClick={() => handleOpen(community)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                handleOpen(community);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        title={`Abrir ${community.name || "comunidad"}`}
                                    >
                                        <CommunityCard community={community} />
                                    </div>

                                </div>
                            ))}

                        </div>


                        {!hasPendingRequest && (
                            <>
                                <div ref={sentinelRef} className="w-full h-8" />

                                {visibleCount < mobileFilteredCommunities.length && (
                                    <div className="text-center text-xs text-white/50 pb-2">
                                        Mostrando {progressiveCommunities.length} de {mobileFilteredCommunities.length} comunidades...
                                    </div>
                                )}
                            </>
                        )}

                    </>

                )}

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
                className="z-[320]"
            />


            <AlertModal
                isOpen={showLeaveConfirm}
                type="warning"
                title="Un momento..."
                message="¿Estás seguro de que quieres abandonar esta comunidad?"
                confirmText="Sí, abandonar comunidad"
                cancelText="No, cancelar"
                onClose={() => setShowLeaveConfirm(false)}
                onConfirm={handleLeaveConfirm}
                className="z-[320]"
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
                className="z-[320]"
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
                className="z-[320]"
            />


            <CommunityManager isOpen={showForm} onClose={() => setShowForm(false)} />


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

        </div>
    );
}


export default Community;



function CommunityDetailModal({ community, isOpen, onClose, onJoin, onLeave, hasCommunity, myCommunity, manageComunity }) {

    useEffect(() => {
        if (!isOpen) return;

        const onEsc = (event) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onEsc);

        return () => window.removeEventListener("keydown", onEsc);
    }, [isOpen, onClose]);


    if (!isOpen || !community) return null;


    const membersColumns = [
        {
            key: "index",
            header: "#",
            cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
            render: (_entry, index) => index + 1,
        },
        {
            key: "avatar",
            header: "",
            render: (entry) => (
                <img
                    key={entry.id}
                    src={entry.profileImage || community.logo_url || CommunityDefault}
                    alt={entry.username || "Usuario"}
                    className="w-8 h-8 rounded-full border object-cover mt-1"
                    loading="lazy"
                    decoding="async"
                    style={{ borderColor: community.color || "#222222" }}
                />
            ),
        },
        {
            key: "username",
            header: "Usuario",
            cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
            render: (entry) => (
                <Link
                    to={`/players?search=${encodeURIComponent(String(entry.username || ""))}`}
                    className="text-sm font-semibold hover:text-[var(--hover-secondary)] transition-colors"
                    title={`Ver jugador ${entry.username || "Usuario"}`}
                >
                    {entry.username || "Usuario"}
                </Link>
            ),
        },
        {
            key: "role",
            header: "Acciones",
            cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
            render: (entry) => (
                entry.isLeader ? (
                    <span className="px-2 py-1 text-xs font-mono rounded-full bg-green-500/20 text-green-400">
                        Líder
                    </span>
                ) : (
                    <span className="px-2 py-1 text-xs font-mono rounded-full bg-blue-500/20 text-blue-400">
                        Miembro
                    </span>
                )
            ),
        },
    ];


    return (
        createPortal((
        <div className="fixed inset-0 z-[220] flex items-end md:items-center justify-center transition-opacity duration-200">

            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-6xl max-h-[92dvh] p-4 sm:p-6 lg:p-8 modal-main rounded-t-3xl md:rounded-3xl overflow-y-auto">

                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onClose();
                    }}
                    className="absolute top-4 right-4 p-2 rounded-xl text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-white/10 transition-colors"
                    aria-label="Cerrar detalle"
                >
                    <X size={18} />
                </button>


                <div className="grid grid-cols-1 lg:grid-cols-3">

                    <div>

                        <div className="hidden lg:block">
                            <CommunityCard community={community} />
                        </div>

                        {hasCommunity && myCommunity?.id === community?.id ? (
                            !manageComunity ? (
                                <Button className="mt-6 w-full" variant="cancel" onClick={onLeave}>
                                    Abandonar comunidad
                                </Button>
                            ) : null
                        ) : hasCommunity ? (
                            <div className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 w-fit">
                                <div className="w-2 h-2 rounded-full bg-[var(--ins-text-gray)]" />
                                <span className="text-sm text-[var(--ins-text-gray)]">Ya perteneces a otra comunidad</span>
                            </div>
                        ) : (
                            <Button className="mt-6 w-full" variant="primary" onClick={onJoin}>
                                Solicitar unirse
                            </Button>
                        )}

                    </div>


                    <div className="lg:col-span-2 lg:pl-8 mt-6 lg:mt-0 gap-4">

                        <h3 className="text-lg font-bold mb-2 text-[var(--secondary-color)]">
                            Información del canal
                        </h3>

                        <div className="xl:col-span-3 space-y-4">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <InfoRow icon={<User size={18} />} label="Lider de la comunidad" value={community.leader?.username || "N/A"} />

                                <InfoRow icon={<Users size={18} />} label="Miembros" value={community.members ? community.members.length : "Sin miembros :c"} />

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
                            <InfoRow icon={<File size={18} />} label="Descripcion" className="mt-4" value={community.description || "N/A"} />
                        </div>

                        <div className="rounded-3xl bg-[var(--black-color)]/20 overflow-hidden mt-4 border border-white/10">
                            <div className="px-5 py-4 flex items-center justify-between gap-3">
                                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-white)]">
                                    Miembros
                                </p>
                                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-white)]">
                                    {community.members ? community.members.length : 0} registros
                                </span>
                            </div>

                            {community.members && community.members.length === 0 ? (
                                <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-white)]">
                                    No hay miembros registrados para esta comunidad.
                                </div>
                            ) : (
                                <Table columns={membersColumns} data={community.members || []} rowKey="id" minWidth="min-w-[680px]" layout="embedded" />
                            )}
                        </div>

                    </div>

                </div>


            </div>

        </div>
        ), document.body)
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