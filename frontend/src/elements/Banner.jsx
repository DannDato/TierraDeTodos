
function Banner({
  // backgroundImage = "/img/banner.gif",
  backgroundImage = "/img/banner2.gif",
  // backgroundImage = "/img/bannergif.webp",
  overlayColor = "rgba(32, 32, 32, 0.6)",
  blur = "10px",
  children,
  className = "",
  ...props
}) {
  return (
    <section id="inicio" className={`relative h-[600px] md:h-[800px] lg:h-[1000px] overflow-hidden ${className}`} {...props}>
      
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
        className="fixed top-0 left-0 w-full h-full bg-cover inset-0 flex items-center justify-center text-center p-5 z-1"
        style={{
          backgroundColor: overlayColor,
          zIndex: 10,
        }}
      >
      </div>
      <div
        className="absolute bg-cover inset-0 flex items-center justify-center text-center p-5 z-1"
        style={{
          zIndex: 10,
        }}
      >
        <div className="w-full max-w-[1000px] z-20">
          {children}
        </div>
      </div>
      <div className="fixed top-0 left-0 w-full h-full bg-cover bg-gradient-to-t from-black to-transparent pointer-events-none" data-aos="fade" data-aos-duration="2000" />
    </section>
  );
}

export default Banner;