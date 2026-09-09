
import mapaImage from "../img/mapa.png";

function Background({
  // backgroundImage = "/img/banner2.gif",
  // backgroundImage = "/img/pollos.jpg",
  // backgroundImage = "/img/banner2.webp",
  backgroundImage = mapaImage,
  // backgroundImage = "/img/banner.webp",
  // backgroundImage = "/img/bannergif.webp",
  overlayColor = "rgba(39, 37, 35, 0.51)",
  blur = "20px",
  children,
  className = "",
  ...props
}) {
  return (
    <section id="inicio" className={`relative ${className}`} {...props}>
      {/* Imagen de fondo */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center scale-110"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: `blur(${blur})`,
          zIndex: 0,
        }}
      ></div>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[1] bg-cover p-5"
        style={{
          backgroundColor: overlayColor,
          zIndex: 1,
        }}
      >
      </div>
      <div
        className="absolute inset-0 z-10 flex items-center justify-center bg-cover p-0 md:p-5"
        style={{
          zIndex: 10,
        }}
      >
         {/* max-w-[1000px] */}
        <div className="z-10 w-full align-middle">
          {children}
        </div>
      </div>
      <div className="pointer-events-none fixed inset-0 z-[2] bg-gradient-to-t from-black to-transparent" data-aos="fade" data-aos-duration="2000" />
    </section>
  );
}

export default Background;