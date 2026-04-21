import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NewsCard from "../components/NewsCard";
import api from "../api/axios";
import tdtNewsImage from "../img/tdtnews.png";

export default function News() {
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const [newsData, setNewsData] = useState([]);
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    const loadLatestNews = async () => {
      try {
        const { data } = await api.get("/home/news");
        const payload = Array.isArray(data) ? data : data?.news;
        setNewsData(Array.isArray(payload) ? payload : []);
      } catch (_error) {
        setNewsData([]);
      }
    };

    loadLatestNews();
  }, []);

  const normalizedNews = useMemo(() => {
    return newsData.map((item, index) => {
      const rawDate = item?.fecha || item?.createdAt;
      const safeDate = rawDate ? new Date(rawDate) : null;
      const dateLabel = safeDate && !Number.isNaN(safeDate.getTime())
        ? safeDate.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" })
        : "Sin fecha";

      return {
        id: item?.id || `home-news-${index}`,
        image: item?.image || tdtNewsImage,
        category: String(item?.type || "NOTICIA").toUpperCase(),
        date: dateLabel,
        title: item?.title || "Sin titulo",
        description: item?.description || "",
      };
    });
  }, [newsData]);

  const openNews = (newsId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!newsId) {
      navigate("/news");
      return;
    }

    navigate(`/news?open=${encodeURIComponent(String(newsId))}`);
  };

  const scrollLeft = () => {carouselRef.current?.scrollBy({ left: -400, behavior: "smooth" });};
  const scrollRight = () => {carouselRef.current?.scrollBy({ left: 400, behavior: "smooth" });};

  return (
    <section
      id="noticias"
      className="scroll-mt-24 relative z-20 bg-[var(--white-color)] text-[var(--black-color)]
      md:px-24 pt-10 rounded-[30px] -mt-[100px] md:-mt-[250px] pb-10 overflow-hidden mx-2 md:mx-10"
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
            href="#"
            onClick={(event) => {
              event.preventDefault();
              openNews(normalizedNews[0]?.id || "");
            }}
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
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-4 scrollbar-hidden"
          >
            {normalizedNews.map((news) => (
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
                  onClick={() => openNews(news.id)}
                  ctaLabel={isLoggedIn ? "Leer más..." : "Inicia sesión para leer más..."}
                  ctaOnClick={() => openNews(news.id)}
                />
              </div>
            ))}
          </div>

          {/* CONTROLES */}
          <div className="text-center mt-4 z-1 relative">
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