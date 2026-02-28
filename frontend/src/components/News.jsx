import { useRef } from "react";
import NewsCard from "../components/NewsCard";

export default function News() {
  const carouselRef = useRef(null);

  // temporal (luego viene del backend)
  const newsData = [
    {
      id: 1,
      image: "/img/noticias/noticia1.jpg",
      category: "Actualización",
      date: "25/08/2026",
      title: "TDT lanza su nueva edición",
      description:
        "La nueva edición de Tierra de Todos, correspondiente al número 3, trae emocionantes novedades y mejoras..."
    },
    {
      id: 2,
      image: "/img/noticias/noticia2.jpg",
      category: "Desarrollo",
      date: "12/09/2026",
      title: "Más fácil que nunca",
      description:
        "Ahora instalar y jugar en TDT es más fácil que nunca. Con nuestra nueva plataforma..."
    },
    {
      id: 3,
      image: "/img/noticias/noticia3.jpg",
      category: "Lanzamiento",
      date: "Próximamente",
      title: "Aún no hay fecha de lanzamiento",
      description:
        "Aunque la nueva edición está en desarrollo, aún no se ha anunciado fecha..."
    },
    {
      id: 4,
      image: "/img/noticias/noticia1.jpg",
      category: "Comunidad",
      date: "Próximamente",
      title: "Torneo de apertura",
      description:
        "Prepárate para el gran torneo de apertura en la primera semana del servidor."
    }
  ];

  const scrollLeft = () => {carouselRef.current?.scrollBy({ left: -400, behavior: "smooth" });};
  const scrollRight = () => {carouselRef.current?.scrollBy({ left: 400, behavior: "smooth" });};

  return (
    <section
      id="noticias"
      className="scroll-mt-24 relative z-20 bg-[var(--white-color)] text-[var(--black-color)] 
      md:px-24 pt-10 rounded-t-[80px] -mt-[100px] md:-mt-[250px] pb-10 overflow-hidden"
      data-aos="fade-up"
      data-aos-duration="1000"
    >
      <div className="mx-auto px-4 md:px-0">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b pb-4">
          <h2
            className="text-4xl font-bold"
            data-aos="fade-right"
            data-aos-duration="1000"
          >
            Noticias & Actualizaciones
          </h2>

          <a
            href="/noticias"
            data-aos="fade-left"
            data-aos-duration="1000"
            className="mt-4 sm:mt-0 text-[var(--secondary-color)] hover:text-[var(--black-color)] transition-colors font-medium"
          >
            Ver todas →
          </a>
        </div>

        <p
          className="text-lg font-light leading-relaxed"
        >
          Echa un vistazo a las últimas noticias sobre TDT y descubre lo que
          está por venir en esta nueva edición.
        </p>

        {/* CARRUSEL */}
        <div className="relative w-full mt-10 mb-12">
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-4 custom-scrollbar"
          >
            {newsData.map((news) => (
              <div
                key={news.id}
                className="snap-start shrink-0 basis-[85%] md:basis-[55%] lg:basis-[40%]"
              >
                <NewsCard
                  image={news.image}
                  category={news.category}
                  date={news.date}
                  title={news.title}
                  description={news.description}
                  onClick={() => console.log(`Ir a noticia ${news.id}`)}
                />
              </div>
            ))}
          </div>

          {/* CONTROLES */}
          <div className="text-center mt-4">
            <button
              onClick={scrollLeft}
              className="mx-4 p-3 rounded-full border border-gray-300 
              text-gray-600 hover:bg-[var(--secondary-color)] 
              hover:text-white hover:border-[var(--secondary-color)] 
              transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /> </svg>
            </button>

            <button
              onClick={scrollRight}
              className="mx-4 p-3 rounded-full border border-gray-300 
              text-gray-600 hover:bg-[var(--secondary-color)] 
              hover:text-white hover:border-[var(--secondary-color)] 
              transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"> <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /> </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}