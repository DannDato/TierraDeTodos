import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

const providers = [
  { key: "GOOGLE", label: "Google", icon: "/img/icons/google.svg", className: "bg-white text-black" },
  { key: "TWITCH", label: "Twitch", icon: "/img/icons/twitch.svg", className: "bg-[#6441a4] text-white" },
  { key: "DISCORD", label: "Discord", icon: "/img/icons/discord.svg", className: "bg-[#5865F2] text-white" },
];

function Socials({
  googleClientId,
  connectedAccounts = [],
  onGoogleCredential,
  onProviderClick,
  onDisconnect,
  className = "",
}) {
  const googleButtonRef = useRef(null);
  const googleCallbackRef = useRef(onGoogleCredential);

  useEffect(() => {
    googleCallbackRef.current = onGoogleCredential;
  }, [onGoogleCredential]);

  const isConnected = (provider) => connectedAccounts.some((account) => account.provider === provider);

  useEffect(() => {
    if (!googleClientId || connectedAccounts.some((account) => account.provider === "GOOGLE") || !googleButtonRef.current) return undefined;

    let attempts = 0;
    let timer;
    const renderGoogleButton = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => googleCallbackRef.current(response),
          ux_mode: "popup",
        });
        googleButtonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: googleButtonRef.current.clientWidth || 280,
        });
        return;
      }

      attempts += 1;
      if (attempts < 40) timer = window.setTimeout(renderGoogleButton, 100);
    };

    renderGoogleButton();
    return () => window.clearTimeout(timer);
  }, [googleClientId, connectedAccounts]);

  return (
    <div 
      className={`gap-3`}
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))" }}
    >
      {providers.map((provider) => {
        const connected = isConnected(provider.key);
        const isGoogle = provider.key === "GOOGLE";

        return (
          <div key={provider.key} className="relative min-h-16">
            <button
              type="button"
              onClick={() => connected ? onDisconnect?.(provider.key) : onProviderClick?.(provider.key)}
              className={`flex h-full min-h-16 w-full items-center justify-center gap-3 rounded-lg py-3 font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${provider.className}`}
              aria-label={connected ? `Desconectar ${provider.label}` : `Conectar ${provider.label}`}
            >
              <img src={provider.icon} alt={provider.label} className="h-6 w-6 ml-8 lg:ml-0" />
              <span className="hidden lg:inline">{provider.label}</span>
            </button>

            {isGoogle && !connected && (
              <div ref={googleButtonRef} className="absolute inset-0 z-10 overflow-hidden opacity-0" aria-hidden="true" />
            )}

            {connected && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/50" aria-label={`${provider.label} conectado`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                  <Check size={20} strokeWidth={3} />
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Socials;
