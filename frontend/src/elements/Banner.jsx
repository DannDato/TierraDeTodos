
function Banner({
  backgroundImage = "/img/banner.gif",
  overlayColor = "rgba(44,44,44,0.6)",
  blur = "10px",
  children,
  className = "",
}) {
  return (
    <section className={`relative h-[600px] md:h-[800px] lg:h-[1000px] overflow-hidden ${className}`}>
      
      {/* Imagen de fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: `blur(${blur})`,
          zIndex: 0,
        }}
      ></div>

      {/* Overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center text-center p-5"
        style={{
          backgroundColor: overlayColor,
          zIndex: 10,
        }}
      >
        <div className="w-full max-w-[1000px] z-20">
          {children}
        </div>
      </div>
    </section>
  );
}

export default Banner;