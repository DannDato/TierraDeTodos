import React from "react";

function NewsCard({
  image,
  category,
  date,
  title,
  description,
  onClick,
  className = "",
}) {
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
      <div className="flex items-center text-[var(--black-color)] mb-1 text-sm">
        <span className="pr-1 font-bold text-[var(--secondary-color)]">
          {category}
        </span>
        |
        <span className="pl-1 font-bold">
          {date}
        </span>
      </div>

      {/* Título */}
      <h3
        className="text-xl font-bold text-[var(--black-color)] 
                   transition-colors duration-300 
                   group-hover:text-[var(--secondary-color)]"
      >
        {title}
      </h3>

      {/* Descripción */}
      <p className="text-sm font-light mt-2 text-[var(--black-color)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default NewsCard;