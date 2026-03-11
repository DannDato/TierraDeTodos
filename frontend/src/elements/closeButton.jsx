import { X } from "lucide-react";

export default function CloseButton({ onClick, ...props }) {
    return(
        <button 
            onClick={onClick}
            className="text-[var(--ins-text-dark)] hover:text-[var(--cancel-color)] transition-colors p-2 bg-[var(--black-color)]/20 rounded-full hover:bg-[var(--cancel-color)]/10"
        >
        <X size={24} />
        </button>
    )
}