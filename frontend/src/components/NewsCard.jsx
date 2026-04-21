import React from "react";

function NewsCard({
  image,
  category,
  date,
  title,
  description,
  onClick,
  ctaLabel,
  ctaOnClick,
  className = "",
}) {
  const getBadgeClasses = (value) => {
    const type = String(value || "").toUpperCase();
    if (type === "EVENTO") return "bg-purple-500";
    if (type === "PARCHE") return "bg-blue-500";
    if (type === "ANUNCIO") return "bg-emerald-600";
    return "bg-amber-500";
  };

  return (
    <div
      onClick={onClick}
      className={`flex flex-col group cursor-pointer
                  bg-gray-800/5 p-5 rounded-xl h-full
                  transition-all duration-300
                  hover:shadow-xl hover:-translate-y-1
                  min-w-[250px]
                  ${className}`}
    >
      {/* Imagen */}
      <div className="overflow-hidden rounded-xl mb-4 shadow-sm">
        <img src={image} alt={title} className="w-full aspect-video object-cover  transition-transform duration-500  group-hover:scale-110"/>
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between text-[var(--black-color)] mb-2 text-sm gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide text-white ${getBadgeClasses(category)}`}>
          {category}
        </span>
        <span className="font-bold text-xs text-black/75 whitespace-nowrap">
          {date}
        </span>
      </div>

      {/* Título */}
      <h3
        className="text-2xl font-bold text-[var(--black-color)]
                   transition-colors duration-300
                   group-hover:text-[var(--secondary-color)] line-clamp-2"
      >
        {title}
      </h3>

      {/* Descripción */}
      <p className="text-base lg:text-lg font-light mt-2 text-[var(--black-color)] leading-relaxed line-clamp-3">
        {description}
      </p>

      {ctaLabel ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            ctaOnClick?.();
          }}
          className="mt-4 inline-flex items-center text-[var(--secondary-color)] text-sm font-bold hover:text-[var(--hover-secondary)] transition-colors"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}

export default NewsCard;