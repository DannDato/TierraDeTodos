

function Background({
  // backgroundImage = "/img/banner2.gif",
  // backgroundImage = "/img/pollos.jpg",
  // backgroundImage = "/img/banner2.webp",
  backgroundImage = "/img/banner.webp",
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
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center scale-110"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: `blur(${blur})`,
          zIndex: 0,
        }}
      ></div>

      {/* Overlay */}
      <div
        className="fixed top-0 left-0 w-full h-full bg-cover inset-0 flex  p-5 z-1"
        style={{
          backgroundColor: overlayColor,
          zIndex: 10,
        }}
      >
      </div>
      <div
        className="absolute bg-cover inset-0 flex items-center justify-center p-0 md:p-5 z-1"
        style={{
          zIndex: 10,
        }}
      >
         {/* max-w-[1000px] */}
        <div className="w-full z-20 align-middle">
          {children}
        </div>
      </div>
      <div className="fixed top-0 left-0 w-full h-full bg-cover bg-gradient-to-t from-black to-transparent pointer-events-none" data-aos="fade" data-aos-duration="2000" />
    </section>
  );
}

export default Background;