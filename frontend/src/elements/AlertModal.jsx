import React from "react";
import Button from "./Button";

function AlertModal({
  isOpen,
  type = "error", // error | success | warning | info
  title = "¡Error!",
  message = "Algo salió mal.",
  onClose,
  onConfirm,
  confirmText = "Aceptar",
}) {
  if (!isOpen) return null;

  const typeStyles = {
    error: {
      icon: "❌",
      color: "text-red-600",
      button: "bg-red-600 hover:bg-red-700",
    },
    success: {
      icon: "✅",
      color: "text-emerald-600",
      button: "bg-emerald-600 hover:bg-emerald-700",
    },
    warning: {
      icon: "⚠️",
      color: "text-amber-500",
      button: "bg-amber-500 hover:bg-amber-600",
    },
    info: {
      icon: "ℹ️",
      color: "text-blue-600",
      button: "bg-blue-600 hover:bg-blue-700",
    },
  };

  const current = typeStyles[type];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6 text-center animate-fadeIn">
        
        <div className={`text-5xl mb-4 ${current.color}`}>
          {current.icon}
        </div>

        <h2 className="text-xl font-bold mb-2">{title}</h2>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-center gap-3">
          <Button onClick={onClose} variant="secondary">
            Cancelar
          </Button>
          <Button onClick={onConfirm} variant="primary">
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;