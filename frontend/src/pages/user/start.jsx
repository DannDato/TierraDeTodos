import { useState, useEffect } from "react";
import { 
  Play, 
  Download, 
  Newspaper, 
  Megaphone, 
  Settings2, 
  ChevronRight,
  Server,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock, 
  Trophy, 
  Coins, 
  Swords 
} from "lucide-react";
import Button from "../../elements/Button";

// ==========================================
// MOCK DATA: Noticias y Actualizaciones
// ==========================================
const mockNews = [
  {
    id: 1,
    type: "EVENTO",
    title: "¡Inicia la Temporada 4: Ecos del Nether!",
    date: "10 de Marzo, 2026",
    excerpt: "Adéntrate en las nuevas profundidades. Hemos reiniciado el Nether, añadido nuevos biomas personalizados y activado el sistema de misiones globales.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCV_HOL25Drop_MoM_DotNet_Homepage_2560x932.jpg", 
    featured: false,
  },
  {
    id: 2,
    type: "PARCHE",
    title: "Actualización del Modpack v3.2.0",
    date: "5 de Marzo, 2026",
    excerpt: "Mejoras de rendimiento (FPS boost), actualización de Create y corrección de bugs en los comercios.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCEDU_Splash_Art_Bad_Connection_dotNET_2560x932_1.jpg",
    featured: true,
  },
  {
    id: 3,
    type: "ANUNCIO",
    title: "Torneo de Construcción Primaveral",
    date: "1 de Marzo, 2026",
    excerpt: "Demuestra tus habilidades y gana rangos exclusivos en nuestro servidor de Discord.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/dungeons/key-art/Dungeons-PMP_Hero-Art_ParallaxB_1920x1080.jpg",
    featured: false,
  },
  {
    id: 4,
    type: "NOTICIA",
    title: "¡Se roban las papas!",
    date: "1 de Marzo, 2026",
    excerpt: "Un grupo de ladrones ha robado todas las papas del servidor. Se sospecha que los responsables son los aldeanos del bioma de la nieve.",
    image: "https://education.minecraft.net/content/dam/education-edition/blogs/soanes_portales.png",
    featured: false,
  }
];

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
  const [news] = useState(mockNews);
  const [alerts] = useState(mockAlerts); // Estado para las alertas

  const featuredNews = news.find(n => n.featured);
  const regularNews = news.filter(n => !n.featured);

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
        return { wrapper: 'bg-red-500/15 border-red-500/30 text-red-800', icon: <AlertTriangle size={20} className="text-red-600" /> };
      case 'warning': 
        return { wrapper: 'bg-amber-500/15 border-amber-500/30 text-amber-800', icon: <AlertTriangle size={20} className="text-amber-600" /> };
      case 'success': 
        return { wrapper: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800', icon: <CheckCircle2 size={20} className="text-emerald-600" /> };
      default: 
        return { wrapper: 'bg-blue-500/15 border-blue-500/30 text-blue-800', icon: <Info size={20} className="text-blue-600" /> };
    }
  };

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--ins-background)] pb-24">
      <div className="flex-row w-full max-w-7xl px-4 md:mx-10 mx-0">

        {/* ENCABEZADO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>Tierra de Todos</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Inicio</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--ins-text-white)] tracking-tight">
              Bienvenido de vuelta, Steve
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
                <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${style.wrapper} transition-all`}>
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
        <div className="bg-black/10 rounded-3xl p-6 shadow-md border border-black/5 flex flex-col relative overflow-hidden pb-8">
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-xs font-bold text-[var(--ins-text-gray)] uppercase tracking-widest">Tu Progreso</span>
            <span className="text-[10px] font-bold bg-[var(--secondary-color)]/10 text-[var(--secondary-color)] px-2 py-1 rounded-md">
              TDT
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            <div className="bg-white/5 p-3 rounded-2xl border border-black/5 flex flex-col items-start gap-2">
                <p className="text-[10px] font-bold text-[var(--ins-text-gray)] uppercase">Insignias</p>
              <div className="p-2 bg-purple-500/10 rounded-xl text-yellow-600">
                <Trophy size={18} />
              </div>
              <div>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-black/5 flex flex-col items-start gap-2">
              <div>
                <p className="text-[10px] font-bold text-[var(--ins-text-gray)] uppercase">Tiempo Jugado</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 flex-row items-center gap-4 flex">
                <Clock size={18} />
                <p className="text-sm font-extrabold text-[var(--ins-text-white)]">142h 30m</p>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-black/5 flex flex-col items-start gap-2">
              <p className="text-[10px] font-bold text-[var(--ins-text-gray)] uppercase">Monedas</p>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 flex-row items-center gap-4 flex">
                <Coins size={18} />
                <p className="text-sm font-extrabold text-[var(--ins-text-white)]">$15,420</p>
              </div>
              <div>
              </div>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-black/5 flex flex-col items-start gap-2">
              <p className="text-[10px] font-bold text-[var(--ins-text-gray)] uppercase">Kills / Muertes</p>
              <div className="p-2 bg-red-500/10 rounded-xl text-red-300 flex-row items-center gap-4 flex">
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
          <div className="lg:col-span-2 flex flex-col gap-6">            
            {featuredNews && (
              <div className="relative h-80 w-full rounded-3xl overflow-hidden shadow-md group cursor-pointer">
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
                  <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-lg leading-tight">
                    {featuredNews.title}
                  </h2>
                  <p className="text-gray-200 text-sm max-w-xl drop-shadow-md">
                    {featuredNews.excerpt}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-black/10 rounded-3xl p-6 shadow-md border h-80 border-black/5 flex flex-col items-center text-center relative overflow-hidden gap-5">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>
              
              <div className="w-full mb-3 relative z-10">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">¿Aún no lo instalas?</span>
              </div>
              
              <div className="w-full relative z-10">
                {isDownloading ? (
                  <div className="w-full bg-white p-4 rounded-3xl border border-black/10 shadow-sm">
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
                    className="py-5 text-xl tracking-wide shadow-lg shadow-[var(--secondary-color)]/30 hover:shadow-[var(--secondary-color)]/50"
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
                className="py-5 text-xl tracking-wide shadow-lg shadow-[var(--secondary-color)]/30 hover:shadow-[var(--secondary-color)]/50"
                href="https://discord.gg/tdt3"
              >
                Únete a Discord
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                <Server size={14} /> Servidor en línea • 124 Jugadores
              </div>
            </div>
          </div>
        </div>

        {/* NOTICIAS SECUNDARIAS */}
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
                    <span className="text-xs text-gray-400 font-medium">{article.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--ins-text-white)] mb-2 leading-tight group-hover:text-[var(--secondary-color)] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-[var(--gray-color)] flex-1">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 flex items-center text-[var(--secondary-color)] text-sm font-bold">
                    Leer más <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export default Start;