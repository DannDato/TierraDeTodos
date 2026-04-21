export default function Textarea({
  label,
  context = "dark",
  placeholder,
  value,
  onChange,
  error = false,
  rows = 4,
}) {
  const hasError = error === true || typeof error === "string";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label
          className={`text-sm font-medium text-left pl-1 transition-colors
            ${hasError ? "text-red-500" : "" + (context === "light" ? "text-gray-700" : "text-[var(--ins-text-white)]")}
          `}
        >
          {label}
        </label>
      )}

      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-4 py-3 outline-none transition resize-none
          ${context === "light" ? "placeholder-[var(--black-color)]/20" : "placeholder-[var(--white-color)]/40"}
          ${
            hasError
              ? "border-b border-red-500 text-red-500 placeholder-red-400"
              : context === "light"
              ? "text-gray-900 border-b bg-transparent"
              : "text-[var(--white-color)] border-b border-[var(--ins-text-gray)] bg-transparent"
          }
          focus:border-b-[var(--secondary-color)]
        `}
      />

      {typeof error === "string" && <span className="text-red-500 text-xs pl-1">{error}</span>}
    </div>
  );
}
