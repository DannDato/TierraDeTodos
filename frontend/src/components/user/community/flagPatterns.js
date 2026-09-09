export const FLAG_PATTERNS = [
  { id: "horizontal", label: "Horizontal" },
  { id: "vertical", label: "Vertical" },
  { id: "diagonal", label: "Diagonal" },
  { id: "diagonal-reverse", label: "Diagonal inversa" },
  { id: "cross", label: "Cruz" },
  { id: "x", label: "Equis" },
  { id: "circle", label: "Círculo" },
  { id: "quartered", label: "Cuartos" },
  { id: "solid", label: "Sólido" },
];

export function getFlagPatternBackground(primary = "#8b4a24", secondary = "#263746", pattern = "horizontal") {
  switch (pattern) {
    case "vertical":
      return `linear-gradient(to right, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;

    case "diagonal":
      return `linear-gradient(135deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;

    case "diagonal-reverse":
      return `linear-gradient(45deg, ${primary} 0%, ${primary} 50%, ${secondary} 50%, ${secondary} 100%)`;

    case "cross":
      return `
        linear-gradient(to right, transparent 40%, ${secondary} 40%, ${secondary} 60%, transparent 60%),
        linear-gradient(to bottom, transparent 40%, ${secondary} 40%, ${secondary} 60%, transparent 60%),
        ${primary}
      `;

    case "x":
      return `
        linear-gradient(45deg, transparent 43%, ${secondary} 43%, ${secondary} 57%, transparent 57%),
        linear-gradient(-45deg, transparent 43%, ${secondary} 43%, ${secondary} 57%, transparent 57%),
        ${primary}
      `;

    case "circle":
      return `radial-gradient(circle at center, ${secondary} 0%, ${secondary} 27%, transparent 28%), ${primary}`;

    case "quartered":
      return `conic-gradient(${primary} 0deg 90deg, ${secondary} 90deg 180deg, ${primary} 180deg 270deg, ${secondary} 270deg 360deg)`;

    case "solid":
      return primary;

    case "horizontal":
    default:
      return `linear-gradient(to bottom, ${primary} 0%, ${primary} 52%, ${secondary} 52%, ${secondary} 100%)`;
  }
}