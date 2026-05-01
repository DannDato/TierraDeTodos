import Runas from "../img/runas.png";

function InfoRow({ icon, label, value, href, target }) {
  const link = href || getLinkFromValue(value);

  const content = (
    /* Añadimos relative, overflow-hidden y group para el efecto hover */
    <div className="relative group overflow-hidden rounded-3xl bg-black/20 p-4 flex items-start gap-4 hover:bg-[var(--white-color)]/10 transition-all duration-300 border border-white/5">
      
      {/* Capa de Runas de fondo */}
      <div 
        className="absolute inset-0 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700 ease-in-out pointer-events-none"
        style={{
          backgroundImage: `url(${Runas})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent)',
          maskImage: 'linear-gradient(to left, black, transparent)',
          zIndex: 0
        }}
      />

      {/* Contenido Superior (z-10 para que no lo tapen las runas) */}
      <div className="relative z-10 p-2.5 bg-[var(--black-color)]/30 rounded-xl text-[var(--ins-text-gray)] border border-white/5">
        {icon}
      </div>

      <div className="relative z-10 overflow-hidden">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ins-text-gray)] opacity-80">
          {label}
        </p>
        <p className="text-sm font-bold text-[var(--ins-text-white)] mt-1 truncate" title={typeof value === 'string' ? value : undefined}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );

  if (link && link !== "#") {
    return (
      <a href={link} target={target || "_blank"} rel="noopener noreferrer" className="block w-full">
        {content}
      </a>
    );
  }
  return content;
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


export default InfoRow;