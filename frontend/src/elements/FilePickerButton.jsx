import { useRef } from "react";

export default function FilePickerButton({
  label,
  buttonText = "Seleccionar archivo",
  accept = "*/*",
  onFileSelect,
  fileName,
  disabled = false,
  className = "",
}) {
  const inputRef = useRef(null);

  const handleOpenPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0] || null;
    onFileSelect?.(file);
    event.target.value = "";
  };

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label className="text-sm font-medium text-left pl-1 text-[var(--ins-text-white)]">
          {label}
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={disabled}
        className="w-full md:w-auto px-4 py-2 rounded-xl bg-[var(--ins-text-gray)]/20 text-[var(--ins-text-white)] text-sm font-semibold hover:bg-[var(--ins-text-gray)]/30 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-4"
      >
        {buttonText}
      </button>

      {fileName && (
        <p className="text-xs text-[var(--ins-text-gray)] truncate" title={fileName}>
          {fileName}
        </p>
      )}
    </div>
  );
}
