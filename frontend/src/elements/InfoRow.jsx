

function InfoRow({ icon, label, value, href, target }) {
  const link = href || getLinkFromValue(value);
  const content = (
    <div className="rounded-3xl bg-black/20 p-4 flex items-start gap-4 hover:bg-[var(--white-color)]/10 transition-colors">
      <div className="p-2.5 bg-[var(--black-color)]/30 rounded-xl text-[var(--ins-text-gray)]">
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ins-text-gray)]">{label}</p>
        <p className="text-sm font-bold text-[var(--ins-text-white)] mt-1 truncate" title={typeof value === 'string' ? value : undefined}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
  if (link && link !== "#") {
    return (
      <a href={link} target={target || "_blank"} rel="noopener noreferrer" className="block w-full">{content}</a>
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