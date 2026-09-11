import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function Streamers() {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    let mounted = true;
    api.get("/system/public-streamers")
      .then(({ data }) => {
        if (mounted) setParticipants(Array.isArray(data?.participants) ? data.participants : []);
      })
      .catch(() => {
        if (mounted) setParticipants([]);
      });

    return () => { mounted = false; };
  }, []);

  const featured = participants.find((participant) => participant.category === "DANNDATO");
  const cards = participants.filter((participant) => participant.id !== featured?.id);

  if (!(participants.length > 3)) return null;
  return (
    <section id="streamers" className="py-20 bg-[var(--white-color)] text-[var(--black-color)] relative overflow-hidden mx-2 md:mx-10 rounded-[30px] z-20" data-aos="fade-up" data-aos-duration="1000">
      
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--black-color)] uppercase tracking-widest">
            Participantes
          </h2>
          <div className="w-24 h-1 bg-[var(--tertiary-color)] mx-auto rounded-full"></div>
        </div>

        {featured && <div className="flex justify-center mb-20" data-aos="zoom-in" data-aos-duration="900">
          {(() => {
            const FeaturedCard = featured.link ? "a" : "div";
            return <FeaturedCard {...(featured.link ? { href: featured.link, target: "_blank", rel: "noopener noreferrer" } : {})} className="group relative bg-[var(--black-color)] rounded-3xl p-8 md:p-10 w-full max-w-md flex flex-col items-center text-center shadow-2xl border-2 border-[var(--secondary-color)] transition-all duration-300 hover:shadow-[0_0_30px_var(--secondary-color)] hover:-translate-y-2">
            <div className="absolute -top-5 bg-[var(--secondary-color)] text-[var(--white-color)] px-6 py-2 rounded-full font-bold tracking-wide text-sm shadow-lg border-2 border-[var(--black-color)] z-10">
              👑 ANFITRIÓN
            </div>

            <div className="relative mb-4 mt-2">
              <img
                src="/img/streamers/danndato.png"
                alt="DannDato"
                className="w-36 h-36 rounded-full object-cover border-4 border-[var(--black-color)] outline outline-4 outline-[var(--secondary-color)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
              />
            </div>
            
            <h3 className="text-3xl font-bold text-[var(--white-color)] mb-1">{featured.displayName}</h3>
            <span className="text-[var(--secondary-color)] font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
              {featured.platform || "Tierra de Todos"}
            </span>
            </FeaturedCard>;
          })()}
        </div>
        }

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {cards.map((streamer, index) => {
            const Card = streamer.link ? "a" : "div";
            return <Card
              key={streamer.user}
              {...(streamer.link ? { href: streamer.link, target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group bg-[var(--black-color)] rounded-2xl p-5 flex flex-col items-center text-center shadow-lg border border-transparent hover:border-[var(--tertiary-color)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] relative overflow-hidden"
              data-aos="fade-up"
              data-aos-delay={(index % 5) * 100} 
            >
              <div 
                className={`absolute top-3 right-3 w-3 h-3 rounded-full shadow-sm ${
                  streamer.plataforma === 'kick.com' ? 'bg-[var(--secondary-color)]' : 'bg-purple-500'
                }`}
                title={streamer.plataforma}
              ></div>

              <img
                src={streamer.image || "/img/streamers/danndato.png"}
                alt={streamer.displayName || streamer.username}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-gray-700 mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:border-[var(--tertiary-color)]"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150/808080/FFFFFF?text=?'; }}
              />
              
              <span className="text-[var(--white-color)] font-semibold text-sm md:text-base truncate w-full">
                {streamer.displayName || streamer.username}
              </span>
              
              <span className="text-gray-400 text-xs mt-1">
                {streamer.category}
              </span>
            </Card>;
          })}
        </div>

      </div>
    </section>
  );
}