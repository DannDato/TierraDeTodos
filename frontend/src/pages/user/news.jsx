import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Plus } from "lucide-react";

import api from "../../api/axios";
import Button from "../../elements/Button";
import Input from "../../elements/Input";
import LoadingOverlay from "../../components/LoadingOverlay";

const fallbackNews = [
  {
    id: 1,
    type: "EVENTO",
    title: "Inicia la Temporada 4: Ecos del Nether",
    date: "10 de Marzo, 2026",
    excerpt: "Reinicio del Nether, nuevos biomas y activación de misiones globales.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCV_HOL25Drop_MoM_DotNet_Homepage_2560x932.jpg",
    featured: true,
  },
  {
    id: 2,
    type: "PARCHE",
    title: "Actualización del Modpack v3.2.0",
    date: "5 de Marzo, 2026",
    excerpt: "Mejoras de rendimiento, actualización de Create y correcciones de bugs.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCEDU_Splash_Art_Bad_Connection_dotNET_2560x932_1.jpg",
    featured: false,
  },
  {
    id: 3,
    type: "ANUNCIO",
    title: "Torneo de Construcción Primaveral",
    date: "1 de Marzo, 2026",
    excerpt: "Demuestra tus habilidades y gana rangos exclusivos en Discord.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/dungeons/key-art/Dungeons-PMP_Hero-Art_ParallaxB_1920x1080.jpg",
    featured: false,
  },
  {
    id: 4,
    type: "NOTICIA",
    title: "Evento de comunidad este fin de semana",
    date: "24 de Febrero, 2026",
    excerpt: "Prepárate para actividades sorpresa y recompensas especiales.",
    image: "https://education.minecraft.net/content/dam/education-edition/blogs/soanes_portales.png",
    featured: false,
  },
];

function News() {
  const currentUser = {
    role: localStorage.getItem("role") || "USER",
  };

  const [news, setNews] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [newsResult, menuResult] = await Promise.allSettled([
          api.get("/home/news"),
          api.get("/system/menu"),
        ]);

        if (newsResult.status === "fulfilled") {
          const payload = newsResult.value?.data;
          const candidates = Array.isArray(payload) ? payload : payload?.news;
          setNews(Array.isArray(candidates) ? candidates : fallbackNews);
        } else {
          setNews(fallbackNews);
        }

        if (menuResult.status === "fulfilled") {
          setPermissions(Array.isArray(menuResult.value?.data?.permissions) ? menuResult.value.data.permissions : []);
        } else {
          setPermissions([]);
        }
      } catch (error) {
        console.error("News load error:", error);
        setNews(fallbackNews);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hasCreatePermission = permissions.includes("news.create");

  const normalizedNews = useMemo(() => {
    return (news || []).map((item, index) => ({
      id: item.id || `news-${index}`,
      type: String(item.type || "NOTICIA").toUpperCase(),
      title: item.title || "Sin título",
      date: item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-MX") : "Sin fecha"),
      excerpt: item.excerpt || item.summary || item.description || "",
      image: item.image || item.cover || "/img/tierradetodos.png",
      featured: Boolean(item.featured),
    }));
  }, [news]);

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return normalizedNews;

    return normalizedNews.filter((item) => {
      return (
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.excerpt || "").toLowerCase().includes(query) ||
        String(item.type || "").toLowerCase().includes(query) ||
        String(item.date || "").toLowerCase().includes(query)
      );
    });
  }, [normalizedNews, search]);

  const featuredNews = filteredNews.find((item) => item.featured) || filteredNews[0] || null;
  const regularNews = featuredNews ? filteredNews.filter((item) => item.id !== featuredNews.id) : filteredNews;

  const getBadgeColor = (type) => {
    switch (type) {
      case "EVENTO": return "bg-purple-500";
      case "PARCHE": return "bg-blue-500";
      case "ANUNCIO": return "bg-green-500";
      default: return "bg-amber-500";
    }
  };

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
      <LoadingOverlay isVisible={loading} message="Cargando noticias" />

      <div className="w-full max-w-7xl px-4 md:mx-10 mx-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
              <span>{currentUser.role}</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Noticias</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Noticias del Sistema
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="w-full sm:w-[340px]">
              <Input
                placeholder="Buscar noticia por título, tipo o fecha..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            {hasCreatePermission && (
              <Button
                variant="primary"
                className="bg-[var(--secondary-color)] hover:bg-[var(--hover-secondary)] text-white gap-2"
                onClick={() => window.alert("Formulario de creación pendiente de conectar con backend de noticias.")}
              >
                <Plus size={16} /> Nueva noticia
              </Button>
            )}
          </div>
        </div>

        {filteredNews.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/10 py-14 text-center text-[var(--ins-text-gray)]">
            No hay noticias para mostrar con ese filtro.
          </div>
        ) : (
          <>
            {featuredNews && (
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-md group cursor-pointer mb-4">
                <img
                  src={featuredNews.image}
                  alt={featuredNews.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-md mb-3 ${getBadgeColor(featuredNews.type)}`}>
                    {featuredNews.type}
                  </span>
                  <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg leading-tight">{featuredNews.title}</h2>
                  <p className="text-gray-200 text-sm max-w-xl drop-shadow-md">{featuredNews.excerpt}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {regularNews.map((article) => (
                <div key={article.id} className="bg-black/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col">
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded-md ${getBadgeColor(article.type)}`}>
                        {article.type}
                      </span>
                      <span className="text-xs text-[var(--white-color)] font-medium">{article.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--ins-text-white)] mb-2 leading-tight group-hover:text-[var(--secondary-color)] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-[var(--gray-color)] flex-1">{article.excerpt}</p>
                    <div className="mt-4 flex items-center text-[var(--secondary-color)] text-sm font-bold">
                      Leer más <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default News;
