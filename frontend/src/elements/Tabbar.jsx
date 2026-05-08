import { cloneElement, isValidElement } from "react";

const VARIANT_STYLES = {
  glass: {
    container: "inline-flex p-1 gap-1 bg-[var(--black-color)]/40 rounded-xl",
    button: "rounded-lg text-sm font-bold transition-all duration-200",
    size: {
      sm: "px-4 py-2",
      md: "px-5 py-2",
      lg: "px-3 lg:px-5 py-2",
    },
    active: "bg-[var(--white-color)]/10 text-[var(--ins-text-white)] shadow-sm",
    inactive: "text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)] hover:bg-[var(--white-color)]/5",
  },
  solid: {
    container: "inline-flex items-center gap-2",
    button: "rounded-xl text-sm font-bold transition-colors",
    size: {
      sm: "px-3 py-2",
      md: "px-4 py-2",
      lg: "px-4 py-2",
    },
    active: "bg-[var(--secondary-color)] text-white",
    inactive: "bg-white/5 text-[var(--ins-text-gray)] hover:text-[var(--ins-text-white)]",
  },
};

function joinClasses(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export default function Tabbar({
  tabs = [],
  activeTab,
  onChange,
  variant = "glass",
  size = "md",
  className = "",
  buttonClassName = "",
  fullWidth = false,
}) {
  const resolvedVariant = VARIANT_STYLES[variant] || VARIANT_STYLES.glass;
  const resolvedSize = resolvedVariant.size[size] || resolvedVariant.size.md;

  return (
    <div className={joinClasses(resolvedVariant.container, fullWidth ? "w-full" : "", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const iconClassName = isActive
          ? tab.activeIconClassName || "text-[var(--secondary-color)]"
          : tab.inactiveIconClassName || "";
        const icon = isValidElement(tab.icon)
          ? cloneElement(tab.icon, {
              className: joinClasses(tab.icon.props.className, iconClassName),
            })
          : null;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              if (tab.disabled) return;
              onChange?.(tab.id, tab);
            }}
            disabled={tab.disabled}
            className={joinClasses(
              resolvedVariant.button,
              resolvedSize,
              fullWidth ? "flex-1" : "",
              isActive ? resolvedVariant.active : resolvedVariant.inactive,
              tab.disabled ? "cursor-not-allowed opacity-50" : "",
              buttonClassName,
              tab.buttonClassName
            )}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              {icon}
              <span className={tab.labelClassName}>{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
