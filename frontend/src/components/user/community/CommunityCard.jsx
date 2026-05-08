import React from "react";
import CommunityDefault from "../../../img/community_default.png";
/**
 * CommunityCard - Diseño Estilo "Ficha de Facción"
 * @param {Object} community - Datos de la comunidad
 */
export default function CommunityCard({ community }) {
  if (!community) return null;

  // 1. Configuración de Colores y Fallbacks
  const primaryColor = community.color || '#e67e22';
  const secondaryColor = community.color2 || '#2c3e50';
  const DEFAULT_COMMUNITY = CommunityDefault;
  const DEFAULT_USER = CommunityDefault;

  // 2. Lógica de Imagen Principal (Cascada de prioridad)
  const mainImage =  community.logo_url || community.leader?.profileImage || DEFAULT_COMMUNITY;

  // 3. Manejador de errores para evitar el icono de "imagen rota"
  const handleImgError = (e, fallback) => {
    if (e.target.src !== window.location.origin + fallback) {
      e.target.src = fallback;
    }
    e.target.onerror = null; // Evita bucles infinitos
  };

  return (
    <div className="w-full max-w-[370px] lg:max-w-[420px] group transition-all duration-300 hover:-translate-y-2">
      {/* Contenedor Principal con Borde Doble y Sombra */}
      <div
        className="relative p-1 rounded-[2.5rem] bg-[var(--ins-background)]/50 backdrop-blur-md border border-white/5 overflow-hidden w-full h-[480px]"

      >
        {/* Listón Decorativo de dos colores (Esquina Superior) */}
        <div className="absolute top-0 right-10 flex z-10">
          <div className="w-4 h-12 relative" style={{ backgroundColor: primaryColor }}>
            <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#1a1a1a]"></div>
          </div>
          <div className="w-4 h-16 relative" style={{ backgroundColor: secondaryColor }}>
            <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-[#1a1a1a]"></div>
          </div>
        </div>

        {/* Cuerpo de la Tarjeta */}
        <div className="p-8 flex flex-col items-center">

          <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-black mb-6">
            Comunidad Oficial
          </span>

          {/* Avatar con Glow Dinámico */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-[2.2rem] blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
              style={{ backgroundColor: primaryColor }}
            ></div>
            <div
              className="relative p-1.5 rounded-[2.2rem] border-2 shadow-inner"
              style={{ borderColor: primaryColor }}
            >
              <img
                src={mainImage}
                alt={community.name}
                className="w-32 h-32 rounded-[1.8rem] object-cover bg-[#111]"
                onError={(e) => handleImgError(e, DEFAULT_COMMUNITY)}
              />
            </div>
          </div>

          {/* Textos de la Comunidad */}
          <div className="text-center space-y-2 mb-8">
            <h3 className="text-3xl font-bold text-[#f5f5f0] tracking-tight group-hover:text-white transition-colors">
              {community.name}
            </h3>
            <p className="text-sm text-white/40 font-medium italic px-4 leading-relaxed">
              {community.description || "Sin descripción de facción."}
            </p>
          </div>

          {/* Stack de Miembros */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex -space-x-3">
              {community.members && community.members.length > 0 ? (
                community.members.slice(0, 5).map((member, index) => (
                  <img
                    key={member.id || index}
                    src={member.profileImage || community.logo_url || DEFAULT_USER}
                    alt={member.username}
                    className="w-10 h-10 rounded-full border-2 border-[#1a1a1a] object-cover ring-1 ring-white/5 shadow-lg"
                    onError={(e) => handleImgError(e, DEFAULT_USER)}
                  />
                ))
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                   <span className="text-[8px] text-white/20">?</span>
                </div>
              )}
            </div>

            {/* Contador de Miembros */}
            <div className="px-4 py-1 rounded-full bg-white/5 border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                {community.members?.length > 0 ? (
                  <>
                    {community.members.length} {community.members.length === 1 ? 'miembro' : 'miembros'}
                    {community.members.length > 5 && ` (+${community.members.length - 5})`}
                  </>
                ) : (
                  "Territorio Deshabitado"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Capa de textura sutil para que no se vea "plano" */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      </div>
    </div>
  );
}