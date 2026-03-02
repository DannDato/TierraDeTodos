import clsx from "clsx";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  onClick,
  type = "button",
  className,
  href,
  target,
  ...props
}) {
  const baseStyles =
    "flex items-center justify-center rounded-3xl font-medium hover:scale-105 shadow-md transition-all duration-300 focus:outline-none gap-2";

  const variants = {
    primary:
      "bg-[var(--secondary-color)] text-white hover:bg-[var(--hover-secondary)]",
    secondary:
      "bg-[var(--primary-color)] text-white hover:bg-[var(--hover-primary)]",
    cancel:
      "bg-[var(--cancel-color)] text-white hover:bg-[var(--hover-cancel)]",
    outline:
      "border border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-color)] hover:text-[var(--white-color)]",
    ghost:
      "bg-transparent text-[var(--white-color)] hover:text-[var(--gray-color)]",
      
    discord:
      "bg-[var(--discord-color)] text-white hover:bg-[var(--discord-hover)]",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-10 py-4 text-lg",
  };

  const classes = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : undefined}
        className={classes}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}