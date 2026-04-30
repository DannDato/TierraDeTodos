import { useState, useEffect } from "react";
import {
  Play,
  Download,
  Server,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Trophy,
  Coins,
  Swords,
  Users,
  CircleDashed,
  Newspaper,
  Zap,
  LogOut
} from "lucide-react";
import Button from "../../elements/Button";
import api from "../../api/axios";
import tdtNewsImage from "../../img/tdtnews.png";
import LoadingOverlay from "../../components/LoadingOverlay";
import { useNavigate } from "react-router-dom";

// ==========================================
// MOCK DATA: Alertas Globales
// ==========================================
const mockAlerts = [
  // {
  //   id: 1,
  //   level: "danger", // 'danger' (Rojo), 'warning' (Amarillo), 'success' (Verde), 'info' (Azul)
  //   message: "Los servidores de autenticación están experimentando problemas. Podrías tardar en entrar.",
  // },
  // {
  //   id: 2,
  //   level: "warning",
  //   message: "Mantenimiento programado para hoy a las 10:00 PM EST. El servidor estará inactivo por 30 minutos.",
  // },
  // {
  //   id: 3,
  //   level: "success",
  //   message: "¡El evento de Doble XP y Drops ya está activo en todos los mundos!",
  // }
];

function Start() {
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem("username") || "Jugador";

  // Base local para evolucionar a progreso real desde API sin rehacer la UI.
  const [playerSummary] = useState({
    username: currentUsername,
    progress: {
      badges: null,
      playtime: null,
      coins: null,
      kd: null,
    },
  });

  const [news, setNews] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [alerts] = useState(mockAlerts); // Estado para las alertas

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoadingNews(true);
        const { data } = await api.get("/user/news");
        const payload = Array.isArray(data) ? data : data?.news;
        setNews(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error("Start news load error:", error);
        setNews([]);
      } finally {
        setLoadingNews(false);
      }
    };

    loadNews();
  }, []);

  const normalizedNews = news
    .map((item, index) => {
      const rawDate = item?.fecha || item?.date || item?.createdAt;
      const safeDate = rawDate ? new Date(rawDate) : null;
      const dateLabel = safeDate && !Number.isNaN(safeDate.getTime())
        ? safeDate.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
        : "Sin fecha";

      return {
        id: item?.id || `news-${index}`,
        type: String(item?.type || "NOTICIA").toUpperCase(),
        title: item?.title || "Sin titulo",
        date: dateLabel,
        excerpt: item?.description || item?.excerpt || "",
        image: item?.image || item?.cover || tdtNewsImage,
        fechaRaw: item?.fecha || item?.createdAt || null,
      };
    })
    .sort((a, b) => {
      const timeA = new Date(a.fechaRaw || 0).getTime();
      const timeB = new Date(b.fechaRaw || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return Number(b.id || 0) - Number(a.id || 0);
    });

  const featuredNews = normalizedNews[0] || null;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handlePlayClick = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsDownloading(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 80);
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "EVENTO": return "bg-purple-500";
      case "PARCHE": return "bg-blue-500";
      default: return "bg-amber-500";
    }
  };

  // Función para determinar el estilo y color de cada alerta
  const getAlertStyle = (level) => {
    switch (level) {
      case 'danger':
        return { wrapper: 'bg-red-500/15 text-red-800', icon: <AlertTriangle size={20} className="text-red-600" /> };
      case 'warning':
        return { wrapper: 'bg-amber-500/15 text-amber-800', icon: <AlertTriangle size={20} className="text-amber-600" /> };
      case 'success':
        return { wrapper: 'bg-emerald-500/15 text-emerald-800', icon: <CheckCircle2 size={20} className="text-emerald-600" /> };
      default:
        return { wrapper: 'bg-blue-500/15 text-blue-800', icon: <Info size={20} className="text-blue-600" /> };
    }
  };

  const goToNewsDetail = (id) => {
    navigate(`/news?open=${encodeURIComponent(String(id))}`);
  };

  return (
    <div className="min-h-screen h-screen py-10 flex items-start justify-center pb-2 text-[var(--white-color)] z-[1]">
      <LoadingOverlay isVisible={loadingNews} message="Cargando noticias" />
      <div className="flex-row w-full  px-0 mx-0 min-h-screen h-screen">

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--white-color)] uppercase tracking-widest mb-2">
              <span>Tierra de Todos</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Inicio</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Bienvenido de vuelta, {playerSummary.username}
            </h1>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SISTEMA DE ALERTAS GLOBALES */}
        {/* ========================================================= */}
        {alerts.length > 0 && (
          <div className="flex flex-col gap-3 mb-6 w-full">
            {alerts.map((alert) => {
              const style = getAlertStyle(alert.level);
              return (
                <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-3xl ${style.wrapper} transition-all`}>
                  <div className="flex-shrink-0">
                    {style.icon}
                  </div>
                  <p className="text-sm font-bold m-0 leading-tight">
                    {alert.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        {/* ========================================================= */}
        {/* ESTADISTICAS DEL JUGADOR */}
        {/* ========================================================= */}
        <div className="bg-black/20 rounded-3xl p-6 shadow-md flex flex-col relative overflow-hidden pb-8">

          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--ins-text-white)]">
                <CircleDashed size={24} style={{ color: "var(--secondary-color)" }}/>
                Tu progreso actual
            </h2>
            <span className="text-[10px] font-bold bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] px-2 py-1 rounded-md">
              TDT
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            <div className="bg-white/5 p-3 rounded-3xl flex flex-col items-start gap-2">
                <p className="text-[10px] font-bold  uppercase">Insignias</p>
              <div className="p-2 bg-purple-500/10 rounded-xl text-yellow-600">
                <Trophy size={18} />
              </div>
              <div>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-3xl flex flex-col items-start gap-2">
              <div>
                <p className="text-[10px] font-bold  uppercase">Tiempo Jugado</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 flex-row items-center gap-4 flex">
                <Clock size={18} />
                <p className="text-sm font-extrabold text-[var(--ins-text-white)]">142h 30m</p>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-3xl flex flex-col items-start gap-2">
              <p className="text-[10px] font-bold  uppercase">Monedas</p>
              <div className="p-2 bg-emerald-500/10 rounded-3xl text-emerald-600 flex-row items-center gap-4 flex">
                <Coins size={18} />
                <p className="text-sm font-extrabold text-[var(--ins-text-white)]">$15,420</p>
              </div>
              <div>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-3xl flex flex-col items-start gap-2">
              <p className="text-[10px] font-bold  uppercase">Kills / Muertes</p>
              <div className="p-2 bg-red-500/10 rounded-3xl text-red-300 flex-row items-center gap-4 flex">
                <Swords size={18} />
                <p className="text-sm font-extrabold text-[var(--ins-text-white)]">34 / 12</p>
              </div>
              <div>
              </div>
            </div>
          </div>

        </div>
        {/* CONTENIDO PRINCIPAL*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="col-span-2 flex flex-col gap-6 p-8 bg-black/20 rounded-3xl shadow-md max-h-120">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--ins-text-white)]">
              <Newspaper size={24} style={{ color: "var(--secondary-color)" }}/>
              Ultima noticia destacada
            </h2>
            {featuredNews && (
              <div
                className="relative h-80 w-full rounded-3xl overflow-hidden shadow-md group cursor-pointer"
                onClick={() => goToNewsDetail(featuredNews.id)}
                onDoubleClick={() => goToNewsDetail(featuredNews.id)}
              >
                <img
                  src={featuredNews.image}
                  alt={featuredNews.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 p-8 w-full">
                  <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-3xl mb-3 ${getBadgeColor(featuredNews.type)}`}>
                    {featuredNews.type}
                  </span>
                  <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg leading-tight">
                    {featuredNews.title}
                  </h2>
                  <p className="text-gray-200 text-sm max-w-xl drop-shadow-md line-clamp-3">
                    {featuredNews.excerpt}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-black/20 rounded-3xl p-6 shadow-md h-80 flex flex-col items-center relative overflow-hidden gap-5 h-120">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>

              <div className="w-full relative z-10">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[var(--ins-text-white)] justify-center">
                  <Play size={24} style={{ color: "var(--secondary-color)" }}/>
                  ¿Aun no lo instalas?
                </h2>
              </div>

              <div className="w-full relative z-10">
                {isDownloading ? (
                  <div className="w-full bg-white p-4 rounded-3xl shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[var(--secondary-color)] flex items-center gap-1">
                        <Download size={14} className="animate-bounce" /> Preparando descarga...
                      </span>
                      <span className="text-xs font-bold text-gray-500">{downloadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[var(--secondary-color)] h-2.5 rounded-full transition-all duration-200 ease-out"
                        style={{ width: `${downloadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    // className="py-5 text-xl tracking-wide shadow-lg shadow-[var(--secondary-color)]/30 hover:shadow-[var(--secondary-color)]/50"
                    onClick={handlePlayClick}
                  >
                    <Play size={24} fill="currentColor" /> Descargar
                  </Button>
                )}
              </div>

              <Button
                variant="discord"
                size="lg"
                target={"_blank"}
                fullWidth
                // className="py-5 text-xl tracking-wide shadow-lg shadow-[var(--secondary-color)]/30 hover:shadow-[var(--secondary-color)]/50"
                href="https://discord.gg/tdt3"
              >
                Únete a Discord
              </Button>

              <div className="mt-0  flex items-center justify-center gap-2 text-xs font-bold text-[var(--white-color)]">
                {/* <Server size={14} /> Servidor en línea • 124 Jugadores */}
              </div>
              <div className="w-full relative z-10">
                <h2 className="text-xl font-bold  flex items-center gap-2 text-[var(--ins-text-white)] justify-center">
                  <Zap size={24} style={{ color: "var(--secondary-color)" }}/>
                  Acceso rápido
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-align-center mt-4 relative z-10">
                <button
                  onClick={() => navigate('/community')}
                  className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[var(--white-color)]/20 hover:bg-[var(--secondary-color)]/30 transition-colors shadow-md"
                  type="button"
                >
                  <Users size={28} className="text-[var(--white-color)]" />
                  {/* <span className="text-xs font-bold text-[var(--secondary-color)] uppercase">Comunidades</span> */}
                </button>
                <button
                  onClick={() => navigate('/tickets')}
                  className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 transition-colors shadow-md"
                  type="button"
                >
                  <AlertTriangle size={28} className="text-amber-500" />
                  {/* <span className="text-xs font-bold text-amber-500 uppercase">Tickets</span> */}
                </button>
                <button
                  onClick={() => navigate('/logout')}
                  className="flex flex-col items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 transition-colors shadow-md"
                  type="button"
                >
                  <LogOut size={28} className="text-red-500" />
                  {/* <span className="text-xs font-bold text-red-500 uppercase">Cerrar sesión</span> */}
                </button>
              </div>
            </div>
          </div>

        </div>
        {/* ========================================================= */}
        {/* ACCESOS DIRECTOS RÁPIDOS */}
        {/* ========================================================= */}
        <div className="flex gap-4 mt-8 mb-8 w-full justify-center w-full bg-black/20 rounded-3xl p-6 shadow-md">

        </div>
      </div>
    </div>
  );
}

export default Start;