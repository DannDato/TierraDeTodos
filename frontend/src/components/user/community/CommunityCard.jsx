import React from "react";
import CommunityDefault from "../../../img/community_default.png";
import OldFabricTexture from "../../../img/fabric-texture.png";
import { getFlagPatternBackground } from "./flagPatterns";

export default function CommunityCard({ community }) {
  if (!community) return null;

  const primaryColor = community.color || "#8b4a24";
  const secondaryColor = community.color2 || "#263746";
  const textColor = community.text_color || community.textColor || "#f2dfbf";
  const flagPattern = community.flag_pattern || community.flagPattern || "horizontal";
  const emblemUrl = community.emblem_url || community.emblemUrl || "";

  const DEFAULT_COMMUNITY = CommunityDefault;
  const DEFAULT_USER = CommunityDefault;
  const OLD_FABRIC_TEXTURE = OldFabricTexture;

  const mainImage = community.logo_url || community.leader?.profileImage || DEFAULT_COMMUNITY;

  const handleImgError = (e, fallback) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallback;
  };

  return (
    <div className="group relative w-full max-w-[360px] pl-[38px] pt-5 pb-7 select-none">

      {/* Asta */}
      <div className="absolute left-0 top-0 bottom-0 w-[28px] rounded-sm shadow-2xl border-x border-black/50" style={{ backgroundImage: "linear-gradient(90deg,rgba(0,0,0,.4),transparent 25%,transparent 70%,rgba(255,255,255,.1)),repeating-linear-gradient(0deg,#3b2415 0px,#3b2415 9px,#51321c 9px,#51321c 18px,#2e1a0e 18px,#2e1a0e 27px)", imageRendering: "pixelated" }}>
        <div className="absolute -left-[5px] top-[75px] w-[38px] h-[12px] bg-[#282522] border border-black/70 shadow-lg" />
        <div className="absolute -left-[5px] bottom-[55px] w-[38px] h-[12px] bg-[#282522] border border-black/70 shadow-lg" />
        <div className="absolute inset-x-[5px] top-[4px] h-[10px] bg-white/10" />
        <div className="absolute -top-[19px] left-1/2 -translate-x-1/2 w-[38px] h-[38px] bg-[#4b2d17] border border-black/50 shadow-lg" style={{ clipPath: "polygon(50% 0%,100% 45%,80% 100%,20% 100%,0 45%)" }} />
      </div>

      {/* Sombra */}
      <div className="absolute left-[52px] right-2 top-10 bottom-3 translate-y-5 blur-2xl bg-black/60 opacity-65" />

      {/* Bandera */}
      <div className="relative min-h-[475px] overflow-hidden shadow-2xl transition-all duration-300 group-hover:-translate-y-1" style={{ background: getFlagPatternBackground(primaryColor, secondaryColor, flagPattern), clipPath: "polygon(0 0,97% 1%,100% 5%,98% 10%,100% 16%,97% 22%,100% 29%,98% 36%,100% 43%,97% 50%,100% 57%,97% 64%,99% 71%,96% 78%,98% 85%,94% 91%,88% 94%,82% 91%,75% 96%,68% 92%,60% 98%,52% 93%,44% 100%,36% 94%,28% 98%,20% 92%,12% 96%,5% 91%,0 94%)" }}>

        {/* Emblema personalizado */}
        {emblemUrl && (
          <div className="absolute z-[4] left-1/2 top-[48px] -translate-x-1/2 w-[218px] h-[412px] flex items-center justify-center pointer-events-none">
            <img src={emblemUrl} alt="" className="max-w-full max-h-full object-contain opacity-90 drop-shadow-[0_7px_8px_rgba(0,0,0,.45)]" />
          </div>
        )}

        {/* Tela vieja */}
        <div className="absolute z-[8] inset-0 opacity-50 mix-blend-multiply pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 30%,rgba(47,28,13,.55) 0 2px,transparent 3px),radial-gradient(circle at 80% 70%,rgba(47,28,13,.5) 0 1px,transparent 3px),radial-gradient(circle at 35% 85%,rgba(255,255,255,.08) 0 1px,transparent 2px),repeating-linear-gradient(0deg,rgba(54,37,22,.22) 0px,rgba(54,37,22,.22) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(90deg,rgba(38,25,16,.18) 0px,rgba(38,25,16,.18) 1px,transparent 1px,transparent 5px)" }} />

        {OLD_FABRIC_TEXTURE && (
          <div className="absolute z-[9] inset-0 opacity-35 mix-blend-multiply pointer-events-none" style={{ backgroundImage: `url(${OLD_FABRIC_TEXTURE})`, backgroundSize: "cover" }} />
        )}

        {/* Envejecimiento */}
        <div className="absolute z-10 inset-0 bg-[#6a4a2f]/20 mix-blend-multiply pointer-events-none" />
        <div className="absolute z-10 inset-x-0 top-0 h-10 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
        <div className="absolute z-10 inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute z-10 inset-y-0 left-0 w-7 bg-gradient-to-r from-black/35 to-transparent pointer-events-none" />
        <div className="absolute z-10 inset-y-0 right-0 w-7 bg-gradient-to-l from-black/25 to-transparent pointer-events-none" />

        {/* Mordidas */}
        <div className="absolute z-30 -left-3 top-[105px] w-7 h-12 rounded-full bg-[var(--ins-background)] rotate-12" />
        <div className="absolute z-30 -right-2 top-[165px] w-8 h-11 rounded-full bg-[var(--ins-background)] -rotate-12" />
        <div className="absolute z-30 -left-2 top-[330px] w-6 h-9 rounded-full bg-[var(--ins-background)]" />
        <div className="absolute z-30 right-[30px] bottom-[-8px] w-12 h-10 rounded-full bg-[var(--ins-background)] rotate-12" />

        {/* Agujeros */}
        <div className="absolute z-30 left-[45px] top-[70px] w-[7px] h-[10px] rounded-full bg-black/45 rotate-[25deg]" />
        <div className="absolute z-30 right-[55px] top-[270px] w-[5px] h-[8px] rounded-full bg-black/35 -rotate-[20deg]" />

        {/* Costuras */}
        <div className="absolute z-30 left-5 right-6 top-[14px] border-t-2 border-dashed border-[#d9b98d]/30" />
        <div className="absolute z-30 left-[14px] top-5 bottom-12 border-l-2 border-dashed border-[#d9b98d]/25" />

        {/* Unión */}
        <div className="absolute z-30 left-0 top-[55px] w-5 h-[16px] bg-[#292421] border-y border-r border-black/60 shadow-md" />
        <div className="absolute z-30 left-0 top-[175px] w-5 h-[16px] bg-[#292421] border-y border-r border-black/60 shadow-md" />
        <div className="absolute z-30 left-0 top-[295px] w-5 h-[16px] bg-[#292421] border-y border-r border-black/60 shadow-md" />

        {/* Contenido */}
        <div className="relative z-20 flex min-h-[455px] flex-col items-center px-8 pt-10 pb-14">

          <div className="flex items-center justify-center gap-3 w-full mb-7">
            <div className="h-px flex-1 bg-[#e1c79d]/25" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-black whitespace-nowrap" style={{ color: textColor, opacity: 0.7 }}>Comunidad Oficial</span>
            <div className="h-px flex-1 bg-[#e1c79d]/25" />
          </div>

          {/* Logo de comunidad en rombo */}
          <div className="relative w-[112px] h-[112px] mb-7 flex items-center justify-center">

            {/* Sombra */}
            <div className="absolute w-[88px] h-[88px] rotate-45 bg-black/55 blur-xl translate-y-2" />

            {/* Marco dorado */}
            <div className="relative w-[88px] h-[88px] rotate-45 p-[2px] bg-gradient-to-br from-[#f1dda0] via-[#9b763b] to-[#d8b867] shadow-[0_8px_20px_rgba(0,0,0,.62)] transition-transform duration-300 group-hover:scale-105">

              {/* Interior */}
              <div className="relative w-full h-full overflow-hidden bg-[#211b17] border border-[#46341e]">

                {/* Imagen contrarrotada para quedar derecha */}
                <img
                  src={mainImage}
                  alt={community.name}
                  onError={(e) => handleImgError(e, DEFAULT_COMMUNITY)}
                  className="absolute left-1/2 top-1/2 w-[145%] h-[145%] max-w-none -translate-x-1/2 -translate-y-1/2 -rotate-45 object-cover"
                  style={{ imageRendering: "pixelated" }}
                />

                {/* Brillo mínimo */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25 pointer-events-none" />

                {/* Línea interior dorada muy fina */}
                <div className="absolute inset-[3px] border border-[#f4d995]/35 pointer-events-none" />

              </div>

            </div>

          </div>


          <h3 className="text-center text-3xl font-black leading-[1.05] drop-shadow-[0_2px_2px_rgba(0,0,0,.9)]" style={{ fontFamily: "'Cinzel Decorative','Georgia',serif", color: textColor }}>
            {community.name}
          </h3>


          <div className="flex items-center justify-center gap-2 w-[70%] my-4">
            <div className="h-px flex-1" style={{ backgroundColor: textColor, opacity: 0.3 }} />
            <div className="w-2 h-2 rotate-45 border" style={{ borderColor: textColor, opacity: 0.45 }} />
            <div className="h-px flex-1" style={{ backgroundColor: textColor, opacity: 0.3 }} />
          </div>


          <p className="text-center text-sm italic leading-relaxed line-clamp-2 min-h-[40px] drop-shadow-[0_1px_2px_rgba(0,0,0,.8)]" style={{ fontFamily: "'IM FELL English','Georgia',serif", color: textColor, opacity: 0.78 }}>
            “{community.description || "Sin descripción de comunidad."}”
          </p>


          <div className="flex -space-x-3 mt-6">
            {community.members && community.members.length > 0 ? (
              community.members.slice(0, 5).map((member, index) => (
                <div key={member.id || index} className="relative w-10 h-10 rounded-full bg-[#332a22] border-2 border-[#8d7657] shadow-lg overflow-hidden">
                  <img src={member.profileImage || community.logo_url || DEFAULT_USER} alt={member.username} onError={(e) => handleImgError(e, DEFAULT_USER)} className="w-full h-full object-cover" style={{ imageRendering: "pixelated" }} />
                </div>
              ))
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#a58a65]/40 flex items-center justify-center bg-black/20">
                <span className="text-xs" style={{ color: textColor, opacity: 0.4 }}>?</span>
              </div>
            )}
          </div>


          <div className="mt-3 px-4 py-1.5 bg-[#29231f]/65 border border-[#8b7455]/40 shadow-inner" style={{ clipPath: "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)" }}>
            <span className="text-[9px] uppercase tracking-[0.16em] font-black" style={{ color: textColor, opacity: 0.68 }}>
              {community.members?.length > 0 ? (
                <>
                  {community.members.length} {community.members.length === 1 ? "miembro" : "miembros"}
                  {community.members.length > 5 && ` · +${community.members.length - 5}`}
                </>
              ) : (
                "Territorio deshabitado"
              )}
            </span>
          </div>

        </div>


        <div className="absolute z-20 left-0 right-0 bottom-8 text-center text-[7px] uppercase tracking-[0.35em] font-black" style={{ fontFamily: "'Cinzel',serif", color: textColor, opacity: 0.2 }}>
          Tierra de Todos
        </div>

      </div>

    </div>
  );
}