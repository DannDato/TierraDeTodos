import { useRef } from "react";

import Banner from "../elements/Banner";
import Button from "../elements/Button";
import NewsCard from "../components/NewsCard";


function Home() {
  return (
    <>  
      <Banner>
        <center>
          <div className="max-w-[800px] text-[var(--white-color)] flex flex-col items-center z-20" >
            <img 
              src="img/tdt3.webp" 
              alt="Tierra de Todos Logo" 
              className="w-full max-w-[550px] mb-5"
            />
            <p className="text-lg font-light mb-8">
              Bienvenido a TDT, un servidor de Minecraft donde la comunidad,
              la aventura y la creatividad se unen en una nueva edición.
            </p>
            <Button variant="primary" size="lg" fullWidth={true}>¡Juega ya!</Button>
          </div>
        </center>
      </Banner>

      {/* noticias */}
      <section 
        id="info" 
        className="relative z-20 bg-[var(--white-color)] text-[var(--black-color)] md:px-24 
        pt-10 rounded-t-[80px] -mt-[100px] md:-mt-[250px] pb-10 overflow-hidden"
      >
        {/* inicia configuracion del carrusel */}
        {(() => {
          const carouselRef = useRef(null);
          const scrollLeft = () => {
            if (carouselRef.current) {
              carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
            }
          };
          const scrollRight = () => {
            if (carouselRef.current) {
              carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
            }
          };

          return (
            <div className="mx-auto px-4 md:px-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-blac pb-4">
                <h2 className="text-4xl font-bold m-0 text-[var(--black-color)]">Noticias & Actualizaciones</h2>
                <div className="flex items-center gap-6 mt-4 sm:mt-0">
                  <a 
                    href="/noticias" 
                    data-aos="fade-up" 
                    className="text-[var(--secondary-color)] hover:text-[var(--black-color)] transition-colors font-medium cursor-pointer"
                  >
                    Ver todas &rarr;
                  </a>
                </div>
              </div>

              <p 
                className="text-lg font-light leading-relaxed text-[var(--black-color)]" 
              >
                Echa un vistazo a las últimas noticias sobre TDT y descubre lo que está por venir en esta nueva edición. Desde actualizaciones emocionantes hasta eventos especiales, mantente informado sobre todo lo relacionado con Tierra de Todos 3.
              </p>

              {/* CONTENEDOR DEL CARRUSEL */}
              <div className="relative w-full mt-10 mb-12">
                <div 
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 pt-4 custom-scrollbar"
                >
                  {/* Tarjeta 1 */}
                  <div className="snap-start shrink-0 basis-[85%] md:basis-[55%] lg:basis-[40%]">
                    <NewsCard
                      image="img/noticias/noticia1.jpg"
                      category="Actualización"
                      date="25/08/2026"
                      title="TDT lanza su nueva edición"
                      description="La nueva edición de Tierra de Todos, correspondiente al número 3, trae emocionantes novedades y mejoras..."
                      onClick={() => console.log("Ir a noticia")}
                    />
                  </div>

                  {/* Tarjeta 2 */}
                  <div className="snap-start shrink-0 basis-[85%] md:basis-[55%] lg:basis-[40%]">
                    <NewsCard
                      image="img/noticias/noticia2.jpg"
                      category="Desarrollo"
                      date="12/09/2026"
                      title="Más fácil que nunca"
                      description="Ahora instalar y jugar en TDT es más fácil que nunca. Con nuestra nueva plataforma de instalación..."
                      onClick={() => console.log("Ir a noticia")}
                    />
                  </div>

                  {/* Tarjeta 3 */}
                  <div className="snap-start shrink-0 basis-[85%] md:basis-[55%] lg:basis-[40%]">
                    <NewsCard
                      image="img/noticias/noticia3.jpg"
                      category="Lanzamiento"
                      date="Próximamente"
                      title="Aún no hay fecha de lanzamiento"
                      description="Aunque la nueva edición de TDT está en desarrollo, aún no se ha anunciado una fecha de lanzamiento..."
                      onClick={() => console.log("Ir a noticia")}
                    />
                  </div>

                  {/* Tarjeta 4  */}
                  <div className="snap-start shrink-0 basis-[85%] md:basis-[55%] lg:basis-[40%]">
                    <NewsCard
                      image="img/noticias/noticia1.jpg"
                      category="Comunidad"
                      date="Próximamente"
                      title="Torneo de apertura"
                      description="Prepárate para el gran torneo de apertura en la primera semana del servidor. Habrá premios increíbles."
                      onClick={() => console.log("Ir a noticia")}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <button 
                    onClick={scrollLeft}
                    className="mx-4 p-3 rounded-full border border-gray-300 text-gray-600 hover:bg-[var(--secondary-color)] hover:text-white hover:border-[var(--secondary-color)] transition-colors"
                    aria-label="Desplazar a la izquierda"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button 
                    onClick={scrollRight}
                    className="mx-4 p-3 rounded-full border border-gray-300 text-gray-600 hover:bg-[var(--secondary-color)] hover:text-white hover:border-[var(--secondary-color)] transition-colors"
                    aria-label="Desplazar a la derecha"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </section>
    </>
  );
}

export default Home;