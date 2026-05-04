import React, { useEffect, useState } from "react";
import {
  CircleX,
  CircleCheckBig,
  TriangleAlert,
  CircleHelp,
} from "lucide-react";

function AlertModal({
  isOpen,
  type = "error", // error | success | warning | info
  title = "¡Error!",
  message = "Algo salió mal.",
  onClose,
  onConfirm,
  cancelText = "Cancelar",
  confirmText = "Aceptar",
  className = "",
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isActive, setIsActive] = useState(isOpen);

  useEffect(() => {
    let timeoutId;

    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => setIsActive(true));
    } else {
      setIsActive(false);
      timeoutId = setTimeout(() => setShouldRender(false), 220);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const typeStyles = {
    error: {
      icon: CircleX,
      iconClass: "text-rose-300",
      ringClass: "ring-rose-300/35",
      chipClass: "bg-rose-300/15 text-rose-100",
      actionClass: "text-rose-200 border-rose-200/40 hover:border-rose-200/70 hover:text-rose-100",
    },
    success: {
      icon: CircleCheckBig,
      iconClass: "text-emerald-300",
      ringClass: "ring-emerald-300/35",
      chipClass: "bg-emerald-300/15 text-emerald-100",
      actionClass: "text-emerald-200 border-emerald-200/40 hover:border-emerald-200/70 hover:text-emerald-100",
    },
    warning: {
      icon: TriangleAlert,
      iconClass: "text-amber-300",
      ringClass: "ring-amber-300/35",
      chipClass: "bg-amber-300/15 text-amber-100",
      actionClass: "text-amber-200 border-amber-200/40 hover:border-amber-200/70 hover:text-amber-100",
    },
    info: {
      icon: CircleHelp,
      iconClass: "text-sky-300",
      ringClass: "ring-sky-300/35",
      chipClass: "bg-sky-300/15 text-sky-100",
      actionClass: "text-sky-200 border-sky-200/40 hover:border-sky-200/70 hover:text-sky-100",
    },
  };

  const current = typeStyles[type] || typeStyles.info;
  const Icon = current.icon;
  const typeLabels = {
    error: "ERROR",
    success: "BIEN",
    warning: "ATENCION",
    info: "INFO",
  };

  const handleConfirm = () => {
    if (typeof onConfirm === "function") {
      onConfirm();
      return;
    }
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[120] ${className} transition-opacity duration-200 ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
    >

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg rounded-3xl border border-white/15 bg-[var(--ins-background)]/95 px-7 py-6 text-center shadow-2xl ring-1 ${current.ringClass} transition-all duration-200 ${
          isActive ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.98]"
        }`}
      >

        <div className="mb-4 flex justify-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${current.chipClass}`}>
            <Icon size={16} className={current.iconClass} />
            {typeLabels[type] || typeLabels.info}
          </div>
        </div>

        <h2 className="mb-2 text-xl font-extrabold text-[var(--ins-text-white)]">{title}</h2>

        <p className="mb-6 text-[var(--ins-text-white)]/90 leading-relaxed">{message}</p>

        <div className="flex justify-center gap-2 border-t border-white/10 pt-4">
          <button
            onClick={onClose}
            type="button"
            className="min-w-28 rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold tracking-wide text-[var(--ins-text-white)]/75 transition-all duration-200 hover:border-white/20 hover:text-[var(--ins-text-white)] focus:outline-none focus:ring-2 focus:ring-white/25"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            type="button"
            className={`min-w-28 rounded-2xl border bg-transparent px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/25 ${current.actionClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;