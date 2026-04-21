function Switch({
  label = "",
  checked = false,
  onChange,
  disabled = false,
  className = "",
}) {
  const handleToggle = () => {
    if (!disabled && typeof onChange === "function") {
      onChange(!checked);
    }
  };

  return (
    <label className={`inline-flex items-center gap-2 select-none ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={handleToggle}
        disabled={disabled}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40 ${checked ? "bg-[var(--secondary-color)]" : "bg-white/15 border border-white/10"}`}
      >
        <span
          className={`absolute top-[2px] left-[3px] h-[18px] w-[18px] rounded-full shadow transition-transform duration-200 ${checked ? "bg-white translate-x-5" : "bg-white/60 translate-x-0"}`}
        />
      </button>
      {label ? <span className="text-sm leading-none text-[var(--ins-text-gray)]">{label}</span> : null}
    </label>
  );
}

export default Switch;
