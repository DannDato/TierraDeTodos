import CommunityCard from "./CommunityCard";
import CommunityEmblemEditor from "./CommunityEmblemEditor";
import FlagPatternPicker from "./FlagPatternPicker";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import api from "../../../api/axios";
import Input from "../../../elements/Input";
import Button from "../../../elements/Button";
import Table from "../../../elements/Table";
import FilePickerButton from "../../../elements/FilePickerButton";
import LoadingOverlay from "../../shared/LoadingOverlay";
import InfoRow from "../../../elements/InfoRow";
import CommunityDefault from "../../../img/community_default.png";
import AlertModal from "../../../elements/AlertModal";
import { Video, User, Link as LinkIcon, Hash, Palette, FileText, Users, Check, X, UserMinus, Clock3, Flag, Paintbrush } from "lucide-react";


function TableActionButton({ title, icon, label, onClick, disabled = false, tone = "default" }) {
  const toneClasses = {
    default: "text-gray-400 hover:text-blue-400 hover:border-blue-400/20",
    success: "text-gray-400 hover:text-green-400 hover:border-green-400/20",
    danger: "text-gray-400 hover:text-red-400 hover:border-red-400/20",
  };

  return (
    <button type="button" className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--black-color)]/20 border border-transparent transition-colors ${toneClasses[tone]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} title={title} onClick={onClick} disabled={disabled}>
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}


function RequestsTable({ requests = [], actionId = null, onApprove, onReject }) {
  const requestColumns = [
    {
      key: "index",
      header: "#",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (_request, index) => index + 1,
    },
    {
      key: "username",
      header: "Usuario",
      cellClassName: "text-[var(--ins-text-white)]",
      render: (request) => (
        <div className="flex flex-col gap-1">
          <Link to={`/players?search=${encodeURIComponent(String(request.username || ""))}`} className="text-sm font-semibold text-[var(--secondary-color)] hover:text-[var(--hover-secondary)] truncate transition-colors" title={`Ver jugador ${request.username || "Usuario"}`}>
            {request?.username || "Usuario"}
          </Link>

          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ins-text-gray)]">
            ID {request?.userId || "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (request) => request?.email || "Sin correo",
    },
    {
      key: "requestedAt",
      header: "Solicitud",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (request) => request?.requestedAt ? new Date(request.requestedAt).toLocaleString() : "Sin fecha",
    },
    {
      key: "status",
      header: "Estado",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: () => (
        <span className="px-2 py-1 text-xs font-mono rounded-full bg-amber-500/20 text-amber-300 inline-flex items-center gap-1.5">
          <Clock3 size={12} /> Pendiente
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (request) => {
        const isProcessing = actionId === request?.id;

        return (
          <div className="flex items-center justify-end gap-2">
            <TableActionButton title="Aprobar solicitud" icon={<Check size={16} />} label="Aprobar" tone="success" disabled={isProcessing} onClick={() => onApprove?.(request)} />
            <TableActionButton title="Rechazar solicitud" icon={<X size={16} />} label="Rechazar" tone="danger" disabled={isProcessing} onClick={() => onReject?.(request)} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="rounded-3xl bg-[var(--black-color)]/20 overflow-hidden mt-8 border border-white/10">
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-white)]">Solicitudes</p>

        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-white)]">
          {requests.length} pendientes
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-white)]">
          No hay solicitudes pendientes.
        </div>
      ) : (
        <Table columns={requestColumns} data={requests} rowKey={(request, index) => request?.id || `${request?.username || "N/A"}-${index}`} minWidth="min-w-[860px]" layout="embedded" />
      )}
    </div>
  );
}


function MembersTable({ members = [], actionId = null, onRemoveMember, communityLogoUrl }) {
  const membersColumns = [
    {
      key: "index",
      header: "#",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (_member, index) => index + 1,
    },
    {
      key: "avatar",
      header: "",
      render: (member) => (
        <img key={member.id} src={member.profileImage || communityLogoUrl || CommunityDefault} alt={member.username} className="w-8 h-8 rounded-full border object-cover" />
      ),
    },
    {
      key: "username",
      header: "Usuario",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (member) => (
        <Link to={`/players?search=${encodeURIComponent(String(member.username || ""))}`} className="text-sm font-semibold text-[var(--secondary-color)] hover:text-[var(--hover-secondary)] transition-colors" title={`Ver jugador ${member.username || "Usuario"}`}>
          {member?.username || "N/A"}
        </Link>
      ),
    },
    {
      key: "role",
      header: "Rol",
      cellClassName: "text-[var(--ins-text-white)] whitespace-nowrap",
      render: (member) => member?.isLeader ? (
        <span className="px-2 py-1 text-xs font-mono rounded-full bg-green-500/20 text-green-400">Lider</span>
      ) : (
        <span className="px-2 py-1 text-xs font-mono rounded-full bg-blue-500/20 text-blue-400">Miembro</span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (member) => {
        if (member?.isLeader) return <span className="text-xs text-[var(--ins-text-gray)]">Sin acciones</span>;

        const isProcessing = actionId === member?.id;

        return (
          <div className="flex items-center justify-end gap-2">
            <TableActionButton title="Expulsar miembro" icon={<UserMinus size={16} />} label="Expulsar" tone="danger" disabled={isProcessing} onClick={() => onRemoveMember?.(member)} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="rounded-3xl bg-[var(--black-color)]/20 overflow-hidden mt-8 border border-white/10">
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-white)]">Miembros</p>

        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-white)]">
          {members.length} registros
        </span>
      </div>

      {members.length === 0 ? (
        <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-white)]">
          No hay miembros en esta comunidad.
        </div>
      ) : (
        <Table columns={membersColumns} data={members} rowKey={(member, index) => member?.id || `${member?.username || "N/A"}-${index}`} minWidth="min-w-[760px]" layout="embedded" />
      )}
    </div>
  );
}


export default function CommunityManager({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    plataforma: "",
    streamer: "",
    streamerLogo: null,
    canal: "",
    nombreComunidad: "",
    nombreCorto: "",
    color: "#FFFFFF",
    color2: "#222222",
    textColor: "#f2dfbf",
    flagPattern: "horizontal",
    descripcionComunidad: "",
  });

  const [communityLogoPreview, setCommunityLogoPreview] = useState(CommunityDefault);
  const [persistedLogoUrl, setPersistedLogoUrl] = useState("");
  const [emblemFile, setEmblemFile] = useState(null);
  const [emblemPreview, setEmblemPreview] = useState("");
  const [persistedEmblemUrl, setPersistedEmblemUrl] = useState("");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [canManage, setCanManage] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "info",
    title: "Aviso",
    message: "",
    reload: false,
  });

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    type: "warning",
    title: "Confirmar acción",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
  });

  const [communityData, setCommunityData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [expandedRequests, setExpandedRequests] = useState(false);
  const [activeAction, setActiveAction] = useState({ type: null, id: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingActionRef = useRef(null);
  const logoObjectUrlRef = useRef(null);


  const setLogoPreviewFromFile = (file) => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = null;
    }

    if (file instanceof File) {
      const objectUrl = URL.createObjectURL(file);
      logoObjectUrlRef.current = objectUrl;
      setCommunityLogoPreview(objectUrl);
      return;
    }

    setCommunityLogoPreview(persistedLogoUrl || CommunityDefault);
  };


  useEffect(() => {
    return () => {
      if (logoObjectUrlRef.current) URL.revokeObjectURL(logoObjectUrlRef.current);
    };
  }, []);


  const loadCommunityInfo = async () => {
    const res = await api.get("/user/community");
    const c = res.data.community;

    if (c) {
      const logoUrl = c.logo_url || "";
      const existingEmblem = c.emblem_url || c.emblemUrl || "";

      setCommunityData(c);
      setPersistedLogoUrl(logoUrl);
      setCommunityLogoPreview(logoUrl || CommunityDefault);

      setPersistedEmblemUrl(existingEmblem);
      setEmblemPreview(existingEmblem);
      setEmblemFile(null);

      setFormData({
        plataforma: c.leader?.streamer?.platform || "",
        streamer: c.leader?.streamer?.username || "",
        streamerLogo: null,
        canal: c.leader?.streamer?.link || "",
        nombreComunidad: c.name || "",
        nombreCorto: c.shortname || "",
        color: c.color || "#FFFFFF",
        color2: c.color2 || "#222222",
        textColor: c.text_color || c.textColor || "#f2dfbf",
        flagPattern: c.flag_pattern || c.flagPattern || "horizontal",
        descripcionComunidad: c.description || "",
      });

      setHasFormChanges(false);
    }

    return c;
  };


  const loadMembers = async () => {
    const res = await api.get("/user/community/members");
    const nextMembers = res.data.members || [];
    setMembers(nextMembers);
    return nextMembers;
  };


  const loadRequests = async () => {
    const res = await api.get("/user/community/manage/requests");
    const nextRequests = res.data.requests || [];
    setRequests(nextRequests);
    return nextRequests;
  };


  const reloadTables = async () => {
    await Promise.all([loadMembers(), loadRequests()]);
  };


  useEffect(() => {
    let isMounted = true;

    if (!isOpen) {
      if (logoObjectUrlRef.current) {
        URL.revokeObjectURL(logoObjectUrlRef.current);
        logoObjectUrlRef.current = null;
      }

      setLoading(false);
      setCanManage(null);
      setRequests([]);
      setMembers([]);
      setEmblemFile(null);
      return;
    }

    const openManager = async () => {
      setLoading(true);
      setCanManage(null);

      try {
        const permissionRes = await api.get("/user/communities/can-manage");
        if (!isMounted) return;

        const allowed = Boolean(permissionRes?.data?.canManage);
        setCanManage(allowed);

        if (!allowed) return;

        await Promise.allSettled([loadCommunityInfo(), loadMembers(), loadRequests()]);
      } catch (_error) {
        if (!isMounted) return;
        setCanManage(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    openManager();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);


  const handleChange = (field, value) => {
    if (field === "streamerLogo") {
      setFormData((prev) => ({ ...prev, streamerLogo: value instanceof File ? value : null }));
      setLogoPreviewFromFile(value);
      setHasFormChanges(true);
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasFormChanges(true);
  };


  const handleEmblemChange = (file, previewUrl) => {
    setEmblemFile(file instanceof File ? file : null);
    setEmblemPreview(previewUrl || "");
    setHasFormChanges(true);
  };


  const closeAlert = () => {
    const shouldReload = Boolean(alertConfig.reload);

    setAlertConfig({
      isOpen: false,
      type: "info",
      title: "Aviso",
      message: "",
      reload: false,
    });

    if (shouldReload) window.location.reload();
  };


  const openConfirm = ({ title, message, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm }) => {
    pendingActionRef.current = onConfirm;

    setConfirmConfig({
      isOpen: true,
      type: "warning",
      title,
      message,
      confirmText,
      cancelText,
    });
  };


  const closeConfirm = () => {
    pendingActionRef.current = null;

    setConfirmConfig({
      isOpen: false,
      type: "warning",
      title: "Confirmar acción",
      message: "",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
    });
  };


  const handleConfirmAction = async () => {
    const action = pendingActionRef.current;
    closeConfirm();

    if (typeof action === "function") await action();
  };


  const processRequestAction = async (request, decision) => {
    const isApprove = decision === "approve";
    setActiveAction({ type: "request", id: request.id });

    const executeAction = async () => {
      try {
        await api.patch(`/user/community/requests/${request.id}/${decision}`);
        await reloadTables();

        setAlertConfig({
          isOpen: true,
          type: "success",
          title: isApprove ? "Solicitud aprobada" : "Solicitud rechazada",
          message: isApprove ? `La solicitud de ${request.username || "este usuario"} fue aprobada correctamente.` : `La solicitud de ${request.username || "este usuario"} fue rechazada correctamente.`,
          reload: false,
        });
      } catch (err) {
        const isNetworkError = !err.response || err.code === "ECONNABORTED";

        setAlertConfig({
          isOpen: true,
          type: "error",
          title: isApprove ? "Error al aprobar" : "Error al rechazar",
          message: err.response?.data?.message || "No se pudo procesar la solicitud.",
          reload: false,
          ...(isNetworkError && { retry: true, retryAction: () => executeAction() }),
        });
      } finally {
        setActiveAction({ type: null, id: null });
      }
    };

    await executeAction();
  };


  const handleApproveRequest = (request) => {
    openConfirm({
      title: "Aprobar solicitud",
      message: `¿Deseas aprobar la solicitud de ${request.username || "este usuario"}? Será agregado a tu comunidad.`,
      confirmText: "Sí, aprobar",
      cancelText: "Cancelar",
      onConfirm: () => processRequestAction(request, "approve"),
    });
  };


  const handleRejectRequest = (request) => {
    openConfirm({
      title: "Rechazar solicitud",
      message: `¿Deseas rechazar la solicitud de ${request.username || "este usuario"}? La solicitud quedará marcada como rechazada.`,
      confirmText: "Sí, rechazar",
      cancelText: "Cancelar",
      onConfirm: () => processRequestAction(request, "reject"),
    });
  };


  const handleRemoveMember = (member) => {
    openConfirm({
      title: "Sacar miembro",
      message: `¿Deseas sacar a ${member.username || "este miembro"} de la comunidad?`,
      confirmText: "Sí, sacar",
      cancelText: "Cancelar",
      onConfirm: async () => {
        setActiveAction({ type: "member", id: member.id });

        try {
          await api.delete(`/user/community/members/${member.id}`);
          await loadMembers();

          setAlertConfig({
            isOpen: true,
            type: "success",
            title: "Miembro removido",
            message: `${member.username || "El miembro"} fue removido de la comunidad.`,
            reload: false,
          });
        } catch (err) {
          setAlertConfig({
            isOpen: true,
            type: "error",
            title: "Error al sacar miembro",
            message: err.response?.data?.message || "No se pudo sacar al miembro de la comunidad.",
            reload: false,
          });
        } finally {
          setActiveAction({ type: null, id: null });
        }
      },
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      let logoUrl = "";
      let emblemUrl = persistedEmblemUrl || "";

      if (formData.streamerLogo instanceof File) {
        const logoForm = new FormData();
        logoForm.append("logo", formData.streamerLogo);

        const uploadRes = await api.post("/user/communities/logo", logoForm, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...authHeaders,
          },
        });

        logoUrl = uploadRes.data.url;
      }

      if (emblemFile instanceof File) {
        const emblemForm = new FormData();
        emblemForm.append("emblem", emblemFile);

        const emblemRes = await api.post("/user/communities/emblem", emblemForm, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...authHeaders,
          },
        });

        emblemUrl = emblemRes.data.url;
      }

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
          text_color: formData.textColor,
          flag_pattern: formData.flagPattern,
          emblem_url: emblemUrl,
          description: formData.descripcionComunidad,
          logo_url: logoUrl || persistedLogoUrl || "",
        },
        token ? { headers: authHeaders } : {}
      );

      setPersistedEmblemUrl(emblemUrl);
      setEmblemFile(null);

      setAlertConfig({
        isOpen: true,
        type: "success",
        title: "Comunidad actualizada",
        message: "Comunidad y estandarte guardados correctamente.",
        reload: true,
      });

      setHasFormChanges(false);
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        type: "error",
        title: "Error al guardar",
        message: err.response?.data?.message || err.message || "No se pudo guardar la comunidad",
        reload: false,
      });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };


  if (!isOpen) return null;


  if (canManage === false) {
    return createPortal((
      <div className="fixed inset-0 z-[240] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-[var(--ins-background)] rounded-2xl shadow-2xl p-8 w-full max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-4 text-[var(--secondary-color)]">Sin permiso</h2>
          <p className="mb-6">No tienes permiso para gestionar comunidades.</p>
          <Button onClick={onClose} variant="primary">Cerrar</Button>
        </div>
      </div>
    ), document.body);
  }


  return createPortal((
    <div className="fixed inset-0 z-[240] flex items-center justify-center transition-opacity duration-200">

      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

      <LoadingOverlay isVisible={loading} message="Cargando información de la comunidad..." />

      <AlertModal isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} onConfirm={closeAlert} confirmText="Cerrar" cancelText="Cerrar" className="z-[320]" />

      <AlertModal isOpen={confirmConfig.isOpen} type={confirmConfig.type} title={confirmConfig.title} message={confirmConfig.message} onClose={closeConfirm} onConfirm={handleConfirmAction} confirmText={confirmConfig.confirmText} cancelText={confirmConfig.cancelText} className="z-[320]" />


      <div className="relative w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-7xl max-h-[94dvh] h-[94dvh] lg:h-[92vh] p-4 sm:p-6 lg:p-8 modal-main overflow-y-auto">

        <button onClick={onClose} className="absolute top-4 right-4 text-[var(--ins-text-gray)] hover:text-[var(--secondary-color)] text-2xl font-bold">
          ×
        </button>


        <h2 className="text-2xl font-bold mb-6 text-[var(--white-color)] flex items-center gap-2">
          <Video size={28} style={{ color: "var(--secondary-color)" }} />
          Gestionar comunidad
        </h2>


        {!loading && (
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

              {/* Preview */}
              <div className="lg:col-span-1 lg:sticky lg:top-0">

                <div className="flex flex-col items-center">

                  <h4 className="hidden lg:block text-md font-bold mb-3 text-[var(--secondary-color)]">
                    Previsualización
                  </h4>


                  <div className="hidden lg:block" style={{ maxWidth: 340, width: "100%" }}>
                    <CommunityCard
                      community={{
                        ...communityData,
                        name: formData.nombreComunidad || communityData?.name,
                        description: formData.descripcionComunidad || communityData?.description,
                        color: formData.color || communityData?.color,
                        color2: formData.color2 || communityData?.color2,
                        text_color: formData.textColor,
                        flag_pattern: formData.flagPattern,
                        emblem_url: emblemPreview || persistedEmblemUrl || "",
                        logo_url: communityLogoPreview,
                        leader: {
                          ...((communityData && communityData.leader) || {}),
                          profileImage: communityLogoPreview,
                          streamer: {
                            ...((communityData && communityData.leader?.streamer) || {}),
                            platform: formData.plataforma || communityData?.leader?.streamer?.platform,
                            username: formData.streamer || communityData?.leader?.streamer?.username,
                            link: formData.canal || communityData?.leader?.streamer?.link,
                          },
                        },
                      }}
                    />
                  </div>


                  <div className="w-full mt-3" style={{ maxWidth: 340 }}>
                    <FilePickerButton label="Cambiar imagen de comunidad" onFileSelect={(file) => handleChange("streamerLogo", file)} accept="image/*" />

                    {formData.streamerLogo instanceof File && (
                      <span className="text-xs text-green-400 mt-2 block">
                        Imagen seleccionada: {formData.streamerLogo.name}
                      </span>
                    )}
                  </div>


                  <div className="w-full pt-4 self-center" style={{ maxWidth: 340 }}>
                    {hasFormChanges && (
                      <div className="flex justify-center mt-3">
                        <Button type="submit" variant="primary" disabled={isSubmitting || loading}>
                          {isSubmitting || loading ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </div>
                    )}
                  </div>

                </div>

              </div>


              {/* Formulario */}
              <div className="lg:col-span-2 space-y-6">

                <section className="space-y-4">

                  <h3 className="text-lg font-bold text-[var(--secondary-color)]">
                    Información del canal
                  </h3>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <InfoRow icon={<User size={16} />} label="Nombre de streamer" value={<Input name="streamer" value={formData.streamer} onChange={(e) => handleChange("streamer", e.target.value)} placeholder="Tu usuario en la plataforma" />} />

                    <InfoRow icon={<Video size={16} />} label="Plataforma" value={<Input name="plataforma" value={formData.plataforma} onChange={(e) => handleChange("plataforma", e.target.value)} placeholder="Twitch, YouTube, Kick..." />} />

                  </div>


                  <InfoRow icon={<LinkIcon size={16} />} label="Canal" value={<Input name="canal" value={formData.canal} onChange={(e) => handleChange("canal", e.target.value)} placeholder="https://www.twitch.tv/tu_usuario" />} />


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <InfoRow icon={<Users size={16} />} label="Nombre de la comunidad" value={<Input name="nombreComunidad" value={formData.nombreComunidad} onChange={(e) => handleChange("nombreComunidad", e.target.value)} placeholder="Nombre de la comunidad" />} />

                    <InfoRow icon={<Hash size={16} />} label="Nombre corto" value={<Input name="nombreCorto" value={formData.nombreCorto} onChange={(e) => handleChange("nombreCorto", e.target.value)} placeholder="Nombre corto para visualización" />} />

                  </div>


                  <InfoRow icon={<FileText size={16} />} label="Descripcion" value={<Input name="descripcionComunidad" value={formData.descripcionComunidad} onChange={(e) => handleChange("descripcionComunidad", e.target.value)} placeholder="Describe tu comunidad" />} />

                </section>


                {/* DISEÑO DEL ESTANDARTE */}
                <section className="rounded-3xl border border-white/10 bg-black/10 overflow-hidden">

                  <div className="px-5 py-4 border-b border-white/10 bg-black/10">

                    <div className="flex items-center gap-2">
                      <Flag size={19} className="text-[var(--secondary-color)]" />

                      <h3 className="text-lg font-bold text-[var(--secondary-color)]">
                        Diseño del estandarte
                      </h3>
                    </div>

                    <p className="text-xs text-[var(--ins-text-gray)] mt-1">
                      Personaliza los colores, patrón, texto y emblema de tu casa.
                    </p>

                  </div>


                  <div className="p-5 space-y-7">

                    {/* Colores */}
                    <div>

                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ins-text-white)] mb-4">
                        Colores
                      </p>


                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[var(--ins-text-white)] flex items-center gap-1">
                            <Palette size={14} /> Primario
                          </label>

                          <div className="flex items-center gap-2">
                            <Input value={formData.color} onChange={(e) => handleChange("color", e.target.value)} placeholder="#FFFFFF" />

                            <label className="w-10 h-10 rounded-xl cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 border border-white/10" style={{ backgroundColor: formData.color }} title="Color primario">
                              <input type="color" value={formData.color} onChange={(e) => handleChange("color", e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                            </label>
                          </div>
                        </div>


                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[var(--ins-text-white)] flex items-center gap-1">
                            <Palette size={14} /> Secundario
                          </label>

                          <div className="flex items-center gap-2">
                            <Input value={formData.color2} onChange={(e) => handleChange("color2", e.target.value)} placeholder="#222222" />

                            <label className="w-10 h-10 rounded-xl cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 border border-white/10" style={{ backgroundColor: formData.color2 }} title="Color secundario">
                              <input type="color" value={formData.color2} onChange={(e) => handleChange("color2", e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                            </label>
                          </div>
                        </div>


                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-[var(--ins-text-white)] flex items-center gap-1">
                            <Palette size={14} /> Texto
                          </label>

                          <div className="flex items-center gap-2">
                            <Input value={formData.textColor} onChange={(e) => handleChange("textColor", e.target.value)} placeholder="#f2dfbf" />

                            <label className="w-10 h-10 rounded-xl cursor-pointer shrink-0 overflow-hidden transition-transform hover:scale-105 border border-white/10" style={{ backgroundColor: formData.textColor }} title="Color del texto">
                              <input type="color" value={formData.textColor} onChange={(e) => handleChange("textColor", e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                            </label>
                          </div>
                        </div>

                      </div>

                    </div>


                    {/* Patrón */}
                    <div>

                      <div className="flex items-center gap-2 mb-4">
                        <Flag size={15} className="text-[var(--ins-text-gray)]" />

                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ins-text-white)]">
                          Distribución de colores
                        </p>
                      </div>


                      <FlagPatternPicker value={formData.flagPattern} primaryColor={formData.color} secondaryColor={formData.color2} onChange={(pattern) => handleChange("flagPattern", pattern)} />

                    </div>


                    {/* Editor */}
                    <div>

                      <div className="flex items-center gap-2 mb-4">
                        <Paintbrush size={15} className="text-[var(--ins-text-gray)]" />

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ins-text-white)]">
                            Emblema personalizado
                          </p>

                          <p className="text-[10px] text-[var(--ins-text-gray)] mt-1">
                            Dibuja el símbolo de tu casa. El PNG se generará con transparencia.
                          </p>
                        </div>
                      </div>


                      <CommunityEmblemEditor initialImage={persistedEmblemUrl} onChange={handleEmblemChange} />

                    </div>

                  </div>

                </section>


                {/* Solicitudes */}
                {requests.length > 0 && (
                  <div className="mt-8">

                    <button type="button" onClick={() => setExpandedRequests(!expandedRequests)} className="w-full flex items-center justify-between px-5 py-3 rounded-3xl bg-[var(--black-color)]/20 border border-white/10 hover:border-white/20 transition-colors">

                      <div className="flex items-center gap-3">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-white)]">Solicitudes</p>

                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-bold">
                          {requests.length}
                        </span>
                      </div>

                      <span className={`text-[var(--ins-text-gray)] transition-transform ${expandedRequests ? "rotate-180" : ""}`}>
                        ▼
                      </span>

                    </button>


                    {expandedRequests && (
                      <RequestsTable requests={requests} actionId={activeAction.type === "request" ? activeAction.id : null} onApprove={handleApproveRequest} onReject={handleRejectRequest} />
                    )}

                  </div>
                )}


                <MembersTable members={members} actionId={activeAction.type === "member" ? activeAction.id : null} onRemoveMember={handleRemoveMember} communityLogoUrl={communityLogoPreview} />

              </div>

            </div>

          </form>
        )}

      </div>

    </div>
  ), document.body);
}