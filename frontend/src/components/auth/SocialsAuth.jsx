import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { setPendingVerifyAccessUser, setVerifyAccessResendAvailableAt } from "../../utils/verifyAccessStorage";

function SocialsAuth({
  googleClientId,
  onGoogleCredential,
  onTwitch,
  onAuthResult,
  onAuthError,
  onDiscord,
  className = "",
}) {
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const googleCallbackRef = useRef(null);
  const [resolvedGoogleClientId, setResolvedGoogleClientId] = useState(googleClientId || null);
  const effectiveGoogleClientId = googleClientId || resolvedGoogleClientId;

  const handleAuthResult = useCallback((data) => {
    onAuthResult?.(data);
    if (data.type === "authenticated" && data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("role", data.user.role);
      navigate("/start");
      return;
    }
    if (data.type === "new_device") {
      setPendingVerifyAccessUser(data.usuario || data.email);
      setVerifyAccessResendAvailableAt(Date.now() + 60_000);
      navigate("/verifyAccess");
      return;
    }
    if (data.type === "registration_required") {
      sessionStorage.setItem("externalRegistrationToken", data.registrationToken);
      sessionStorage.setItem("externalRegistrationProvider", data.provider);
      sessionStorage.setItem("externalRegistrationEmail", data.email || "");
      navigate("/complete-registration");
    }
  }, [navigate, onAuthResult]);

  const reportAuthError = useCallback((error) => {
    onAuthError?.(error);
  }, [onAuthError]);

  useEffect(() => {
    googleCallbackRef.current = onGoogleCredential || ((response) => {
      const credential = response?.credential;
      if (!credential) {
        reportAuthError(new Error("Google no devolvió una credencial válida"));
        return;
      }
      api.post("/auth/google", { credential })
        .then(({ data }) => handleAuthResult(data))
        .catch((error) => reportAuthError(error.response?.data?.message || "Error al autenticar con Google"));
    });
  }, [handleAuthResult, onGoogleCredential, reportAuthError]);

  useEffect(() => {
    if (googleClientId) return undefined;
    api.get("/auth/google/config")
      .then(({ data }) => setResolvedGoogleClientId(data?.enabled ? data.clientId : null))
      .catch(() => setResolvedGoogleClientId(null));
  }, [googleClientId]);

  useEffect(() => {
    if (!effectiveGoogleClientId || !googleButtonRef.current) return undefined;

    let attempts = 0;
    let timer;
    const renderGoogleButton = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: effectiveGoogleClientId,
          callback: (response) => googleCallbackRef.current?.(response),
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
  }, [effectiveGoogleClientId]);

  const handleTwitch = async () => {
    if (onTwitch) {
      onTwitch();
      return;
    }
    try {
      const { data } = await api.get("/auth/twitch/start");
      window.location.assign(data.authorizationUrl);
    } catch (error) {
      reportAuthError(error.response?.data?.message || "Twitch no está disponible");
    }
  };

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))" }}>

      <button type="button" onClick={handleTwitch} className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-[#6441a4] text-white font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
        <img src="/img/icons/twitch.svg" alt="Twitch" className="w-8 h-8 m-[-10px]" />
      </button>

      <div className="relative min-h-11 w-full">
        <button type="button" className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-white text-black font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg" aria-label="Continuar con Google">
          <img src="/img/icons/google.svg" alt="Google" className="w-5 h-5" />
        </button>
        <div ref={googleButtonRef} className="absolute inset-0 z-10 overflow-hidden opacity-0" aria-hidden="true" />
      </div>
      {/* <button type="button" onClick={onDiscord} className="flex items-center justify-center gap-3 w-full py-3 rounded-lg bg-[#5865f2] text-white font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
        <img src="/img/icons/discord.svg" alt="Discord" className="w-5 h-5" />
      </button> */}
    </div>
  );
}

export default SocialsAuth;
