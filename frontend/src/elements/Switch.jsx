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
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/40 ${checked ? "bg-[var(--secondary-color)]" : "bg-white/25"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
      {label ? <span className="text-sm leading-none text-[var(--ins-text-gray)]">{label}</span> : null}
    </label>
  );
}

export default Switch;
