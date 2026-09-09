import React from "react";
import { FLAG_PATTERNS, getFlagPatternBackground } from "./flagPatterns";

export default function FlagPatternPicker({ value = "horizontal", primaryColor = "#8b4a24", secondaryColor = "#263746", onChange }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
      {FLAG_PATTERNS.map((pattern) => {
        const selected = value === pattern.id;

        return (
          <button key={pattern.id} type="button" onClick={() => onChange?.(pattern.id)} className={`group flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${selected ? "border-[var(--secondary-color)] bg-[var(--secondary-color)]/10 shadow-lg" : "border-white/10 bg-black/10 hover:border-white/25 hover:bg-white/5"}`}>
            <div className="relative w-full aspect-[1.35/1] rounded-md overflow-hidden border border-black/40 shadow-md" style={{ background: getFlagPatternBackground(primaryColor, secondaryColor, pattern.id) }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
            </div>

            <span className={`text-[9px] font-bold text-center leading-tight ${selected ? "text-[var(--secondary-color)]" : "text-[var(--ins-text-gray)] group-hover:text-[var(--ins-text-white)]"}`}>
              {pattern.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}