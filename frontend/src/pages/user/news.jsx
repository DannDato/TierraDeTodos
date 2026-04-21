import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Plus, UserRound, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../../api/axios";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import Select from "../../elements/Select";
import LoadingOverlay from "../../components/LoadingOverlay";
import tdtNewsImage from "../../img/tdtnews.png";

const createInitialNewsForm = () => ({
  title: "",
  type: "NOTICIA",
  fecha: new Date().toISOString().slice(0, 10),
  description: "",
  note: "",
});

function News() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = {
    role: localStorage.getItem("role") || "USER",
    username: localStorage.getItem("username") || "Sistema",
  };

  const [news, setNews] = useState([]);
  const [newsTypes, setNewsTypes] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [editFormData, setEditFormData] = useState(createInitialNewsForm());
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState(createInitialNewsForm());
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsSubmitting, setCommentsSubmitting] = useState(false);
  const createImageInputRef = useRef(null);
  const editImageInputRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [newsResult, typesResult, menuResult] = await Promise.allSettled([
          api.get("/user/news"),
          api.get("/user/news/types"),
          api.get("/system/menu"),
        ]);

        if (newsResult.status === "fulfilled") {
          const payload = newsResult.value?.data;
          const candidates = Array.isArray(payload) ? payload : payload?.news;
          setNews(Array.isArray(candidates) ? candidates : []);
        } else {
          setNews([]);
        }

        if (typesResult.status === "fulfilled") {
          const typesPayload = typesResult.value?.data;
          const candidates = Array.isArray(typesPayload) ? typesPayload : typesPayload?.types;
          const parsedTypes = Array.isArray(candidates) ? candidates : [];
          setNewsTypes(parsedTypes);
          if (parsedTypes.length > 0) {
            setFormData((prev) => ({
              ...prev,
              type: prev.type || parsedTypes[0]?.name || "NOTICIA",
            }));
          }
        } else {
          setNewsTypes([]);
        }

        if (menuResult.status === "fulfilled") {
          setPermissions(Array.isArray(menuResult.value?.data?.permissions) ? menuResult.value.data.permissions : []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error("News load error:", error);
        setNews([]);
        setNewsTypes([]);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hasCreatePermission = permissions.includes("news.create");
  const hasEditPermission = permissions.includes("news.edit");
  const hasDeletePermission = permissions.includes("news.delete");

  const normalizedNews = useMemo(() => {
    return (news || []).map((item, index) => {
      const rawDate = item.fecha || item.date || item.createdAt;
      const safeDate = rawDate ? new Date(rawDate) : null;
      const humanDate = safeDate && !Number.isNaN(safeDate.getTime())
        ? safeDate.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
        : "Sin fecha";

      return {
        id: item.id || `news-${index}`,
        type: String(item.type || "NOTICIA").toUpperCase(),
        title: item.title || "Sin título",
        fecha: item.fecha || (safeDate ? safeDate.toISOString().slice(0, 10) : ""),
        dateLabel: humanDate,
        description: item.description || item.excerpt || item.summary || "",
        image: item.image || item.cover || tdtNewsImage,
        note: item.note || "",
        Reporter: item.Reporter || item.reporter || "Sistema",
        featured: Boolean(item.featured),
      };
    });
  }, [news]);

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return normalizedNews;

    return normalizedNews.filter((item) => {
      return (
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.description || "").toLowerCase().includes(query) ||
        String(item.type || "").toLowerCase().includes(query) ||
        String(item.dateLabel || "").toLowerCase().includes(query) ||
        String(item.Reporter || "").toLowerCase().includes(query)
      );
    });
  }, [normalizedNews, search]);

  const sortedNews = useMemo(() => {
    return [...filteredNews].sort((a, b) => {
      const timeA = new Date(a.fecha || a.createdAt || 0).getTime();
      const timeB = new Date(b.fecha || b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [filteredNews]);

  const featuredNews = sortedNews[0] || null;
  const regularNews = featuredNews ? sortedNews.filter((item) => item.id !== featuredNews.id) : sortedNews;

  const typeColorMap = useMemo(() => {
    const map = {};
    for (const type of newsTypes) {
      const key = String(type?.name || "").toUpperCase();
      if (!key) continue;
      map[key] = type?.color || "#f59e0b";
    }
    return map;
  }, [newsTypes]);

  const typeOptions = useMemo(() => {
    return newsTypes.map((type) => ({
      value: String(type?.name || "").toUpperCase(),
      label: String(type?.name || "").toUpperCase(),
    }));
  }, [newsTypes]);

  const getBadgeColor = (type) => {
    const color = typeColorMap[String(type || "").toUpperCase()];
    if (color) return color;
    return "#f59e0b";
  };

  const openNewsModal = useCallback((article) => {
    setSelectedNews(article);
    setIsEditingSelected(false);
    setEditFormData({
      title: article.title || "",
      type: article.type || "NOTICIA",
      fecha: article.fecha || new Date().toISOString().slice(0, 10),
      description: article.description || "",
      note: article.note || "",
    });
    setEditImageFile(null);
    setEditImagePreview("");
    setCommentText("");
  }, []);

  const closeNewsModal = () => {
    setSelectedNews(null);
    setIsEditingSelected(false);
    setComments([]);
    setCommentText("");
  };

  useEffect(() => {
    const loadComments = async () => {
      if (!selectedNews?.id) {
        setComments([]);
        return;
      }

      try {
        setCommentsLoading(true);
        const { data } = await api.get(`/user/news/${selectedNews.id}/comments`);
        const payload = Array.isArray(data) ? data : data?.comments;
        setComments(Array.isArray(payload) ? payload : []);
      } catch (_error) {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    loadComments();
  }, [selectedNews?.id]);

  useEffect(() => {
    const openId = String(searchParams.get("open") || "").trim();
    if (!openId || normalizedNews.length === 0 || selectedNews) {
      return;
    }

    const target = normalizedNews.find((item) => String(item.id) === openId);
    if (!target) {
      return;
    }

    openNewsModal(target);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("open");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, normalizedNews, selectedNews, openNewsModal]);

  const openCreateModal = () => {
    setFormData({
      ...createInitialNewsForm(),
      type: typeOptions[0]?.value || "NOTICIA",
    });
    setSelectedImageFile(null);
    setSelectedImagePreview("");
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setIsCreateModalOpen(false);
  };

  const handleImageChange = (event, mode = "create") => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      if (mode === "create") {
        setSelectedImageFile(null);
        setSelectedImagePreview("");
      } else {
        setEditImageFile(null);
        setEditImagePreview("");
      }
      return;
    }

    if (!file.type?.startsWith("image/")) {
      window.alert("Solo se permiten imágenes.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      window.alert("La imagen no debe superar 5MB.");
      event.target.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);
    if (mode === "create") {
      setSelectedImageFile(file);
      setSelectedImagePreview(preview);
    } else {
      setEditImageFile(file);
      setEditImagePreview(preview);
    }
  };

  const canEditSelected = useMemo(() => {
    if (!selectedNews) return false;
    return hasEditPermission && String(selectedNews.Reporter || "") === String(currentUser.username || "");
  }, [selectedNews, hasEditPermission, currentUser.username]);

  const startEditSelected = () => {
    if (!selectedNews || !canEditSelected) return;
    setEditFormData({
      title: selectedNews.title || "",
      type: selectedNews.type || typeOptions[0]?.value || "NOTICIA",
      fecha: selectedNews.fecha || new Date().toISOString().slice(0, 10),
      description: selectedNews.description || "",
      note: selectedNews.note || "",
    });
    setEditImageFile(null);
    setEditImagePreview("");
    setIsEditingSelected(true);
  };

  const cancelEditSelected = () => {
    setIsEditingSelected(false);
    setEditImageFile(null);
    setEditImagePreview("");
  };

  const handleCreateNews = async (event) => {
    event.preventDefault();

    const payload = {
      title: String(formData.title || "").trim(),
      type: String(formData.type || "NOTICIA").trim().toUpperCase(),
      fecha: String(formData.fecha || "").trim(),
      description: String(formData.description || "").trim(),
      note: String(formData.note || "").trim(),
      Reporter: currentUser.username,
    };

    if (!payload.title || !payload.fecha || !payload.description) {
      window.alert("Título, fecha y descripción son obligatorios.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.post("/user/news", payload);
      const createdNews = data?.news;

      if (createdNews && selectedImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("newsImage", selectedImageFile);

        const imageResult = await api.post(`/user/news/${createdNews.id}/image`, imageFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const updatedNews = imageResult?.data?.news || createdNews;
        setNews((prev) => [updatedNews, ...(Array.isArray(prev) ? prev : [])]);
      } else if (createdNews) {
        setNews((prev) => [createdNews, ...(Array.isArray(prev) ? prev : [])]);
      }

      setIsCreateModalOpen(false);
    } catch (error) {
      window.alert(error.response?.data?.message || "No se pudo crear la noticia.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEditedNews = async () => {
    if (!selectedNews || !canEditSelected) return;

    const payload = {
      title: String(editFormData.title || "").trim(),
      type: String(editFormData.type || "NOTICIA").trim().toUpperCase(),
      fecha: String(editFormData.fecha || "").trim(),
      description: String(editFormData.description || "").trim(),
      note: String(editFormData.note || "").trim(),
    };

    if (!payload.title || !payload.fecha || !payload.description) {
      window.alert("Título, fecha y descripción son obligatorios.");
      return;
    }

    try {
      setSubmitting(true);
      const { data } = await api.put(`/user/news/${selectedNews.id}`, payload);
      let updatedNews = data?.news;

      if (updatedNews && editImageFile) {
        const imageFormData = new FormData();
        imageFormData.append("newsImage", editImageFile);

        const imageResult = await api.post(`/user/news/${selectedNews.id}/image`, imageFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        updatedNews = imageResult?.data?.news || updatedNews;
      }

      if (updatedNews) {
        setNews((prev) => prev.map((item) => (item.id === updatedNews.id ? updatedNews : item)));
        const refreshed = {
          ...selectedNews,
          ...updatedNews,
          Reporter: updatedNews.Reporter || updatedNews.reporter || selectedNews.Reporter,
        };
        setSelectedNews(refreshed);
      }

      setIsEditingSelected(false);
      setEditImageFile(null);
      setEditImagePreview("");
    } catch (error) {
      window.alert(error.response?.data?.message || "No se pudo editar la noticia.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendComment = async () => {
    if (!selectedNews?.id) return;

    const payload = {
      comment: String(commentText || "").trim(),
    };

    if (!payload.comment) {
      window.alert("Escribe un comentario antes de publicar.");
      return;
    }

    try {
      setCommentsSubmitting(true);
      const { data } = await api.post(`/user/news/${selectedNews.id}/comments`, payload);
      const createdComment = data?.comment;
      if (createdComment) {
        setComments((prev) => [...prev, createdComment]);
      }
      setCommentText("");
    } catch (error) {
      window.alert(error.response?.data?.message || "No se pudo publicar el comentario.");
    } finally {
      setCommentsSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedNews?.id || !hasDeletePermission) return;

    const ok = window.confirm("Esta accion eliminara la noticia de forma permanente. Deseas continuar?");
    if (!ok) return;

    try {
      setSubmitting(true);
      await api.delete(`/user/news/${selectedNews.id}`);
      setNews((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== selectedNews.id) : []));
      closeNewsModal();
    } catch (error) {
      window.alert(error.response?.data?.message || "No se pudo eliminar la noticia.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
      <LoadingOverlay isVisible={loading || submitting} message={submitting ? "Publicando noticia..." : "Cargando noticias"} />

      <div className="w-full max-w-7xl px-4 md:mx-10 mx-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Noticias</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Noticias!
            </h1>
            <p className="text-sm text-[var(--ins-text-gray)] mt-2 max-w-3xl leading-relaxed">
              Mantente al tanto de las últimas novedades, eventos y anuncios relacionados con Tierra de Todos. Aquí encontrarás toda la información oficial sobre el servidor, actualizaciones, actividades especiales y mucho más. ¡No te pierdas nada!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-[340px]">
              <Input
                placeholder="Buscar noticia por título, tipo, fecha o reportero..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {hasCreatePermission && (
              <Button
                variant="primary"
                className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white gap-2"
                onClick={openCreateModal}
              >
                <Plus size={16} /> Nueva noticia
              </Button>
            )}
          </div>
        </div>

        {sortedNews.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/10 py-14 text-center text-[var(--ins-text-gray)]">
            No hay noticias para mostrar.
          </div>
        ) : (
          <>
            {featuredNews && (
              <div
                className="relative h-80 w-full rounded-3xl overflow-hidden shadow-md group cursor-pointer mb-4"
                onDoubleClick={() => openNewsModal(featuredNews)}
                onClick={() => openNewsModal(featuredNews)}
              >
                <img
                  src={featuredNews.image}
                  alt={featuredNews.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-md mb-3" style={{ backgroundColor: getBadgeColor(featuredNews.type) }}>
                    {featuredNews.type}
                  </span>
                  <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg leading-tight">{featuredNews.title}</h2>
                  <p className="text-gray-200 text-sm max-w-xl drop-shadow-md line-clamp-2">{featuredNews.description}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {regularNews.map((article) => (
                <div
                  key={article.id}
                  className="bg-black/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
                  onDoubleClick={() => openNewsModal(article)}
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded-md" style={{ backgroundColor: getBadgeColor(article.type) }}>
                        {article.type}
                      </span>
                      <span className="text-xs text-[var(--white-color)] font-medium">{article.dateLabel}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--ins-text-white)] mb-2 leading-tight group-hover:text-[var(--secondary-color)] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[var(--gray-color)] flex-1 line-clamp-3">{article.description}</p>
                    <button
                      type="button"
                      className="mt-4 flex items-center text-[var(--secondary-color)] text-sm font-bold"
                      onClick={() => openNewsModal(article)}
                    >
                      Leer más <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeNewsModal} />
          <div className="relative w-full md:w-full lg:w-[60vw] max-w-[1200px] h-[95vh] rounded-3xl bg-[var(--ins-background)] shadow-2xl overflow-hidden flex flex-col">
            <div
              className={`relative h-56 md:h-72 w-full ${isEditingSelected ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (isEditingSelected) editImageInputRef.current?.click();
              }}
            >
              <img src={editImagePreview || selectedNews.image} alt={selectedNews.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              {isEditingSelected && (
                <div className="absolute inset-0 flex items-center justify-center text-white/90 text-sm font-bold tracking-wider uppercase bg-black/25">
                  Click para cambiar imagen
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeNewsModal();
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/45 text-white hover:bg-black/65 transition-colors"
              >
                <X size={18} />
              </button>
              <input
                ref={editImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageChange(event, "edit")}
              />
              <div
                className="absolute bottom-0 left-0 p-6 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-md mb-3" style={{ backgroundColor: getBadgeColor(isEditingSelected ? editFormData.type : selectedNews.type) }}>
                  {isEditingSelected ? editFormData.type : selectedNews.type}
                </span>
                <div className="flex items-end justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isEditingSelected ? (
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-transparent border-b border-white/50 text-2xl md:text-3xl font-extrabold text-white leading-tight outline-none focus:border-white"
                      />
                    ) : (
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{selectedNews.title}</h2>
                    )}
                  </div>

                  {!isEditingSelected && canEditSelected && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
                        onClick={startEditSelected}
                      >
                        Editar noticia
                      </Button>

                      {hasDeletePermission && (
                        <Button
                          type="button"
                          variant="cancel"
                          className="bg-[var(--cancel-color)] hover:bg-[var(--hover-cancel)] text-white"
                          onClick={handleDeleteSelected}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  )}

                  {!isEditingSelected && !canEditSelected && hasDeletePermission && (
                    <Button
                      type="button"
                      variant="cancel"
                      className="bg-[var(--cancel-color)] hover:bg-[var(--hover-cancel)] text-white"
                      onClick={handleDeleteSelected}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto tdt-scrollbar space-y-4">
              {isEditingSelected ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-2">Tipo</span>
                      <Select
                        value={editFormData.type}
                        onChange={(value) => setEditFormData((prev) => ({ ...prev, type: value }))}
                        options={typeOptions}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="block text-xs text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-2">Fecha</span>
                      <input
                        type="date"
                        value={editFormData.fecha}
                        onChange={(e) => setEditFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)]"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-2">Descripción</span>
                    <textarea
                      rows={6}
                      value={editFormData.description}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/30 text-lg text-[var(--ins-text-white)] leading-relaxed whitespace-pre-wrap outline-none focus:border-[var(--secondary-color)] resize-none"
                      style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-1">Nota</span>
                    <textarea
                      rows={2}
                      value={editFormData.note}
                      onChange={(e) => setEditFormData((prev) => ({ ...prev, note: e.target.value }))}
                      className="w-full bg-transparent border-b border-white/25 text-base text-[var(--ins-text-gray)] leading-relaxed whitespace-pre-wrap outline-none focus:border-[var(--secondary-color)] resize-none"
                      style={{ fontFamily: '"Times New Roman", Times, serif' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="-mx-6 -mt-6 px-6 py-6 bg-white"
                    style={{
                      backgroundImage:
                        "radial-gradient(rgba(0,0,0,0.06) 0.45px, transparent 0.45px), linear-gradient(0deg, rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
                      backgroundSize: "3px 3px, 14px 14px, 18px 18px",
                      backgroundPosition: "0 0, 0 0, 0 0",
                    }}
                  >
                    <div className="flex flex-wrap gap-4 text-xs text-black/65 uppercase tracking-wider font-semibold mb-4">
                      <span>Fecha: {selectedNews.dateLabel}</span>
                      <span>Reportero: {selectedNews.Reporter}</span>
                    </div>

                    <p className="text-2xl text-black text-justify whitespace-pre-wrap" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                      {selectedNews.description}
                    </p>

                    {selectedNews.note ? (
                      <p className="mt-4 text-base text-black/75 whitespace-pre-wrap" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        Nota: {selectedNews.note}
                      </p>
                    ) : null}
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ins-text-white)] mb-3">
                  Comentarios
                </h3>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 tdt-scrollbar">
                  {commentsLoading ? (
                    <p className="text-sm text-[var(--ins-text-gray)]">Cargando comentarios...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-[var(--ins-text-gray)]">Aun no hay comentarios. Se la primera persona en comentar.</p>
                  ) : (
                    comments.map((entry) => (
                      <div key={entry.id} className="rounded-2xl bg-black/15 p-3 border border-white/5">
                        <div className="flex items-start gap-3">
                          <Link
                            to={`/players?search=${encodeURIComponent(String(entry.username || ""))}`}
                            className="w-9 h-9 rounded-full bg-black/35 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center hover:border-[var(--secondary-color)] transition-colors"
                            title={`Ver jugador ${entry.username || "Usuario"}`}
                          >
                            {entry.avatarUrl ? (
                              <img src={entry.avatarUrl} alt={entry.username || "Usuario"} className="w-full h-full object-cover" />
                            ) : (
                              <UserRound size={16} className="text-[var(--ins-text-gray)]" />
                            )}
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Link
                                to={`/players?search=${encodeURIComponent(String(entry.username || ""))}`}
                                className="text-sm font-semibold text-[var(--secondary-color)] hover:text-[var(--hover-secondary)] truncate transition-colors"
                                title={`Ver jugador ${entry.username || "Usuario"}`}
                              >
                                {entry.username || "Usuario"}
                              </Link>
                              <span className="text-[11px] text-[var(--ins-text-gray)] whitespace-nowrap">
                                {entry.createdAt
                                  ? new Date(entry.createdAt).toLocaleString("es-MX", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                  : ""}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--ins-text-white)] whitespace-pre-wrap break-words">
                              {entry.comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Escribe tu comentario..."
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)] resize-none placeholder:text-white/35"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      variant="primary"
                      className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white"
                      onClick={handleSendComment}
                      disabled={commentsSubmitting || !String(commentText || "").trim()}
                    >
                      Comentar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {isEditingSelected && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-black/10">
                <Button type="button" variant="ghost" className="text-white" onClick={cancelEditSelected} disabled={submitting}>Cancelar</Button>
                <Button type="button" variant="primary" className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white" onClick={handleSaveEditedNews} disabled={submitting}>
                  Guardar cambios
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeCreateModal} />
          <form
            onSubmit={handleCreateNews}
            className="relative w-full md:w-full lg:w-[60vw] max-w-[1200px] h-[95vh] rounded-3xl bg-[var(--ins-background)] shadow-2xl overflow-hidden flex flex-col"
          >
            <div
              className="relative h-56 md:h-72 w-full cursor-pointer"
              onClick={() => createImageInputRef.current?.click()}
            >
              <img
                src={selectedImagePreview || tdtNewsImage}
                alt="Preview noticia"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center text-white/90 text-sm font-bold tracking-wider uppercase bg-black/25">
                Click para subir imagen
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeCreateModal();
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/45 text-white hover:bg-black/65 transition-colors"
              >
                <X size={18} />
              </button>
              <input
                ref={createImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageChange(event, "create")}
              />
              <div
                className="absolute bottom-0 left-0 p-6 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-md mb-3" style={{ backgroundColor: getBadgeColor(formData.type) }}>
                  {formData.type}
                </span>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la noticia"
                  className="w-full bg-transparent border-b border-white/50 text-2xl md:text-3xl font-extrabold text-white leading-tight outline-none focus:border-white placeholder:text-white/65"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto tdt-scrollbar space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-2">Tipo</span>
                  <Select
                    value={formData.type}
                    onChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                    options={typeOptions}
                    className="w-full"
                    placeholder={typeOptions.length > 0 ? "Seleccionar" : "Sin tipos disponibles"}
                  />
                </div>
                <div>
                  <span className="block text-xs text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-2">Fecha</span>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)]"
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-2">Descripción</span>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Contenido principal de la noticia"
                  className="w-full bg-transparent border-b border-white/30 text-lg text-[var(--ins-text-white)] leading-relaxed whitespace-pre-wrap outline-none focus:border-[var(--secondary-color)] resize-none placeholder:text-white/45"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                />
              </div>

              <div>
                <span className="block text-[11px] text-[var(--ins-text-gray)] uppercase tracking-wider font-semibold mb-1">Nota</span>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Dato extra opcional"
                  className="w-full bg-transparent border-b border-white/25 text-base text-[var(--ins-text-gray)] leading-relaxed whitespace-pre-wrap outline-none focus:border-[var(--secondary-color)] resize-none placeholder:text-white/35"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-black/10">
              <Button type="button" variant="ghost" className="text-white" onClick={closeCreateModal}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white" disabled={submitting || typeOptions.length === 0}>
                Publicar
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default News;
