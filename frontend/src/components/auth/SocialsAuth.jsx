function SocialsAuth({
  onGoogle,
  onDiscord,
  onMicrosoft,
  className = "",
}) {
  return (
    <div className={`flex flex-col gap-4 w-full ${className}`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))' }}
    >
      
      {/* Google */}
      <button
        onClick={onGoogle}
        className="flex items-center justify-center gap-3 w-full py-3 rounded-lg 
                   bg-white text-black font-medium
                   transition-all duration-300 
                   hover:scale-[1.02] hover:shadow-lg"
      >
        <img
          src="/img/icons/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
      </button>

      {/* Discord */}
      <button
        onClick={onDiscord}
        className="flex items-center justify-center gap-3 w-full py-3 rounded-lg 
                   bg-[#5865F2] text-white font-medium
                   transition-all duration-300 
                   hover:scale-[1.02] hover:shadow-lg"
      >
        <img
          src="/img/icons/discord.svg"
          alt="Discord"
          className="w-5 h-5"
        />
      </button>

      {/* Microsoft */}
      <button
        onClick={onMicrosoft}
        className="flex items-center justify-center gap-3 w-full py-3 rounded-lg 
                   bg-[#2F2F2F] text-white font-medium
                   transition-all duration-300 
                   hover:scale-[1.02] hover:shadow-lg"
      >
        <img
          src="/img/icons/microsoft.svg"
          alt="Microsoft"
          className="w-5 h-5"
        />
      </button>

    </div>
  );
}

export default SocialsAuth;