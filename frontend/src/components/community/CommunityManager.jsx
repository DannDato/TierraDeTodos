import CommunityCard from "./CommunityCard";
import React, { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import Input from "../../elements/Input";
import Button from "../../elements/Button";
import FilePickerButton from "../../elements/FilePickerButton";
import LoadingOverlay from "../LoadingOverlay";
import InfoRow from "../../elements/InfoRow";
import CommunityDefault from "../../img/community_default.png";
import AlertModal from "../../elements/AlertModal";
import { Video, User, Link as LinkIcon, Hash, Palette, FileText, Users, Check, X, UserMinus, Clock3 } from "lucide-react";

function TableActionButton({ title, icon, label, onClick, disabled = false, tone = "default" }) {
  const toneClasses = {
    default: "text-gray-400 hover:text-blue-400 hover:border-blue-400/20",
    success: "text-gray-400 hover:text-green-400 hover:border-green-400/20",
    danger: "text-gray-400 hover:text-red-400 hover:border-red-400/20",
  };

  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--black-color)]/20 border border-transparent transition-colors ${toneClasses[tone]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

function RequestsTable({ requests = [], actionId = null, onApprove, onReject }) {
  return (
    <div className="rounded-3xl bg-[var(--black-color)]/20 overflow-hidden mt-8 border border-white/10">
      <div className="px-5 py-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--ins-text-white)]">Solicitudes</p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-[var(--ins-text-white)]">
          {requests.length} pendientes
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="px-5 py-8 text-sm text-center text-[var(--ins-text-white)]">
          No hay solicitudes pendientes.
        </div>
      ) : (
        <div className="overflow-x-auto tdt-scrollbar">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[var(--white-color)]/5 text-[10px] uppercase tracking-[0.22em] text-[var(--ins-text-white)]">
              <tr>
                <th className="px-5 py-3 font-bold">#</th>
                <th className="px-5 py-3 font-bold">Usuario</th>
                <th className="px-5 py-3 font-bold">Email</th>
                <th className="px-5 py-3 font-bold">Solicitud</th>
                <th className="px-5 py-3 font-bold">Estado</th>
                <th className="px-5 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request, index) => {
                const requestName = request?.displayName || request?.username || "N/A";
                const isProcessing = actionId === request?.id;

                return (
                  <tr key={request?.id || `${requestName}-${index}`} className="border-t border-[var(--white-color)]/5 align-top">
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">{index + 1}</td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)]">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{requestName}</span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--ins-text-gray)]">ID {request?.userId || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">{request?.email || "Sin correo"}</td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                      {request?.requestedAt ? new Date(request.requestedAt).toLocaleString() : "Sin fecha"}
                    </td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-mono rounded-full bg-amber-500/20 text-amber-300 inline-flex items-center gap-1.5">
                        <Clock3 size={12} /> Pendiente
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TableActionButton
                          title="Aprobar solicitud"
                          icon={<Check size={16} />}
                          label="Aprobar"
                          tone="success"
                          disabled={isProcessing}
                          onClick={() => onApprove?.(request)}
                        />
                        <TableActionButton
                          title="Rechazar solicitud"
                          icon={<X size={16} />}
                          label="Rechazar"
                          tone="danger"
                          disabled={isProcessing}
                          onClick={() => onReject?.(request)}
                        />
                      </div>
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

function MembersTable({ members = [], actionId = null, onRemoveMember, formData }) {
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
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[var(--white-color)]/5 text-[10px] uppercase tracking-[0.22em] text-[var(--ins-text-white)]">
              <tr>
                <th className="px-5 py-3 font-bold">#</th>
                <th className="px-5 py-3 font-bold"></th>
                <th className="px-5 py-3 font-bold">Usuario</th>
                <th className="px-5 py-3 font-bold">Rol</th>
                <th className="px-5 py-3 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, index) => {
                const memberName = member?.displayName || member?.nombre || member?.username || "N/A";
                const isLeader = Boolean(member?.isLeader);
                const avatarSrc = member?.profileImage || member?.avatarUrl || null;
                const isProcessing = actionId === member?.id;

                return (
                  <tr key={member?.id || `${memberName}-${index}`} className="border-t border-[var(--white-color)]/5 align-top">
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">{index + 1}</td>
                    <td className="px-5 py-3">
                      <img
                      key={member.id}
                      src={member.profileImage || formData.streamerLogo || CommunityDefault}
                      alt={member.username}
                      className="w-8 h-8 rounded-full border object-cover"

                      />
                    </td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">{memberName}</td>
                    <td className="px-5 py-3 text-[var(--ins-text-white)] whitespace-nowrap">
                      {isLeader ? (
                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-green-500/20 text-green-400">Lider</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-mono rounded-full bg-blue-500/20 text-blue-400">Miembro</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isLeader ? (
                        <span className="text-xs text-[var(--ins-text-gray)]">Sin acciones</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <TableActionButton
                            title="Expulsar miembro"
                            icon={<UserMinus size={16} />}
                            label="Expulsar"
                            tone="danger"
                            disabled={isProcessing}
                            onClick={() => onRemoveMember?.(member)}
                          />
                        </div>
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
  const pendingActionRef = useRef(null);

  const loadCommunityInfo = async () => {
    const res = await api.get("/user/community");
    const c = res.data.community;
    if (c) {
      setCommunityData(c);
      setFormData({
        plataforma: c.leader?.streamer?.platform || "",
        streamer: c.leader?.streamer?.username || "",
        streamerLogo: c.logo_url || CommunityDefault,
        canal: c.leader?.streamer?.link || "",
        nombreComunidad: c.name || "",
        nombreCorto: c.shortname || "",
        color: c.color || "#FFFFFF",
        color2: c.color2 || "#222222",
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
      setLoading(false);
      setCanManage(null);
      setRequests([]);
      setMembers([]);
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

        if (!allowed) {
          return;
        }

        await Promise.allSettled([loadCommunityInfo(), loadMembers(), loadRequests()]);
      } catch (_error) {
        if (!isMounted) return;
        setCanManage(false);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    openManager();

    return () => { isMounted = false; };
  }, [isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (shouldReload) {
      window.location.reload();
    }
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
    if (typeof action === "function") {
      await action();
    }
  };

  const processRequestAction = async (request, decision) => {
    const isApprove = decision === "approve";
    setActiveAction({ type: "request", id: request.id });

    try {
      await api.patch(`/user/community/requests/${request.id}/${decision}`);
      await reloadTables();
      setAlertConfig({
        isOpen: true,
        type: "success",
        title: isApprove ? "Solicitud aprobada" : "Solicitud rechazada",
        message: isApprove
          ? `La solicitud de ${request.displayName || request.username || "este usuario"} fue aprobada correctamente.`
          : `La solicitud de ${request.displayName || request.username || "este usuario"} fue rechazada correctamente.`,
        reload: false,
      });
    } catch (err) {
      setAlertConfig({
        isOpen: true,
        type: "error",
        title: isApprove ? "Error al aprobar" : "Error al rechazar",
        message: err.response?.data?.message || "No se pudo procesar la solicitud.",
        reload: false,
      });
    } finally {
      setActiveAction({ type: null, id: null });
    }
  };

  const handleApproveRequest = (request) => {
    openConfirm({
      title: "Aprobar solicitud",
      message: `¿Deseas aprobar la solicitud de ${request.displayName || request.username || "este usuario"}? Será agregado a tu comunidad.`,
      confirmText: "Sí, aprobar",
      cancelText: "Cancelar",
      onConfirm: () => processRequestAction(request, "approve"),
    });
  };

  const handleRejectRequest = (request) => {
    openConfirm({
      title: "Rechazar solicitud",
      message: `¿Deseas rechazar la solicitud de ${request.displayName || request.username || "este usuario"}? La solicitud quedará marcada como rechazada.`,
      confirmText: "Sí, rechazar",
      cancelText: "Cancelar",
      onConfirm: () => processRequestAction(request, "reject"),
    });
  };

  const handleRemoveMember = (member) => {
    openConfirm({
      title: "Sacar miembro",
      message: `¿Deseas sacar a ${member.displayName || member.username || "este miembro"} de la comunidad?`,
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
            message: `${member.displayName || member.username || "El miembro"} fue removido de la comunidad.`,
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
    }
  };

  if (!isOpen) return null;
  if (canManage === false) {
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
      <AlertModal
        isOpen={confirmConfig.isOpen}
        type={confirmConfig.type}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onClose={closeConfirm}
        onConfirm={handleConfirmAction}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
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
                          logo_url: formData.streamerLogo,
                          leader: {
                            ...((communityData && communityData.leader) || {}),
                            profileImage: formData.streamerLogo,
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
            {requests.length > 0 && (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setExpandedRequests(!expandedRequests)}
                  className="w-full flex items-center justify-between px-5 py-3 rounded-3xl bg-[var(--black-color)]/20 border border-white/10 hover:border-white/20 transition-colors"
                >
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
                  <div className="mt-0">
                    <RequestsTable
                      requests={requests}
                      actionId={activeAction.type === "request" ? activeAction.id : null}
                      onApprove={handleApproveRequest}
                      onReject={handleRejectRequest}
                    />
                  </div>
                )}
              </div>
            )}
            <MembersTable
              members={members}
              actionId={activeAction.type === "member" ? activeAction.id : null}
              onRemoveMember={handleRemoveMember}
              formData={formData}
            />
          </>
        )}
      </div>
    </div>
  );
}
