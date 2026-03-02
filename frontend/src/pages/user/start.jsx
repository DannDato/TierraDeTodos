import { useState, useEffect } from "react";
import { 
  Play, 
  Download, 
  Newspaper, 
  Megaphone, 
  Settings2, 
  ChevronRight,
  Server
} from "lucide-react";
import Button from "../../elements/Button";

const mockNews = [
  {
    id: 1,
    type: "EVENTO",
    title: "¡Inicia la Temporada 4: Ecos del Nether!",
    date: "10 de Marzo, 2026",
    excerpt: "Adéntrate en las nuevas profundidades. Hemos reiniciado el Nether, añadido nuevos biomas personalizados y activado el sistema de misiones globales.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCV_HOL25Drop_MoM_DotNet_Homepage_2560x932.jpg", // Placeholder
    featured: true,
  },
  {
    id: 2,
    type: "PARCHE",
    title: "Actualización del Modpack v3.2.0",
    date: "5 de Marzo, 2026",
    excerpt: "Mejoras de rendimiento (FPS boost), actualización de Create y corrección de bugs en los comercios.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/MCEDU_Splash_Art_Bad_Connection_dotNET_2560x932_1.jpg",
    featured: false,
  },
  {
    id: 3,
    type: "ANUNCIO",
    title: "Torneo de Construcción Primaveral",
    date: "1 de Marzo, 2026",
    excerpt: "Demuestra tus habilidades y gana rangos exclusivos en nuestro servidor de Discord.",
    image: "https://www.minecraft.net/content/dam/minecraftnet/games/dungeons/key-art/Dungeons-PMP_Hero-Art_ParallaxB_1920x1080.jpg",
    featured: false,
  }
];

function Start() {
  const [news] = useState(mockNews);
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
    }, 200);
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "EVENTO": return "bg-purple-500";
      case "PARCHE": return "bg-blue-500";
      default: return "bg-amber-500";
    }
  };

  return (
    <section className="min-h-screen py-10 flex items-start justify-center bg-[var(--white-color)] pb-24">
      <div className="flex-row w-full max-w-7xl px-4 md:mx-10 mx-0">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 px-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              <span>Tierra de Todos</span>
              <span>/</span>
              <span className="text-[var(--secondary-color)]">Resumen</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--black-color)] tracking-tight">
              Bienvenido de vuelta, Steve
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularNews.map((article) => (
                <div key={article.id} className="bg-[var(--gray-light-color)] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col">
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
                    <h3 className="text-lg font-bold text-[var(--black-color)] mb-2 leading-tight group-hover:text-[var(--secondary-color)] transition-colors">
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

          <div className="lg:col-span-1 flex flex-col gap-6">
            
            <div className="bg-[var(--gray-light-color)] rounded-3xl p-6 shadow-md border border-black/5 flex flex-col items-center text-center relative overflow-hidden">
              
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--secondary-color)] opacity-5 rounded-full blur-2xl"></div>

              <div className="w-full mb-6 relative z-10">
                <div className="flex justify-between items-center w-full mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ajustes de Instancia</span>
                  <button className="text-gray-400 hover:text-[var(--secondary-color)] transition-colors tooltip" title="Configurar RAM y JVM">
                    <Settings2 size={16} />
                  </button>
                </div>
                
                <select className="w-full bg-white px-4 py-3 rounded-2xl border border-black/10 text-sm font-bold text-[var(--black-color)] outline-none focus:border-[var(--secondary-color)] shadow-sm cursor-pointer appearance-none text-center">
                  <option>TDT Balanced (Recomendado)</option>
                  <option>TDT High Performance</option>
                  <option>TDT Low PC</option>
                </select>
              </div>

              <div className="w-full relative z-10 mt-auto">
                {isDownloading ? (
                  <div className="w-full bg-white p-4 rounded-3xl border border-black/10 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[var(--secondary-color)] flex items-center gap-1">
                        <Download size={14} className="animate-bounce" /> Sincronizando Mods...
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
                    <Play size={24} fill="currentColor" /> JUGAR AHORA
                  </Button>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-gray-400">
                <Server size={14} /> Servidor en línea • 124 Jugadores
              </div>
            </div>

            <div className="bg-[var(--discord-color)] text-white rounded-3xl p-6 shadow-md cursor-pointer hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Únete a Discord</h3>
                  <p className="text-white/80 text-sm">Busca equipo y obtén soporte.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

export default Start;